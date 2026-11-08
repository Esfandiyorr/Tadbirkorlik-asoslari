'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { tr } from '@/lib/points';
import {
  LOGO_CRITERIA,
  LOGO_DESC_MAX,
  LOGO_DESC_MIN,
  LOGO_MAX_SCORE,
  LOGO_TOPIC,
  type LogoAi,
  type LogoTaskView,
} from '@/lib/logo-task';

/* 🎨 «Biznesingiz uchun logotip» (8-mavzu topshirig'i): talaba o'ziga berilgan biznesni ko'radi, logotip rasmini
   yuklaydi va ta'rif yozadi; sun'iy intellekt 10 ballik baho va maslahat beradi, o'qituvchi yakuniy bahoni qo'yadi. */

/** Rasmni brauzerda tayyorlash: eng uzun tomoni 1024 px gacha, shaffof joylar oq fon bilan (WEBP yoki JPEG). */
async function prepare(file: File): Promise<Blob> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type))
    throw new Error('PNG, JPG, WEBP yoki GIF rasm tanlang.');
  const bitmap = await createImageBitmap(file);
  const k = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bitmap.width * k));
  c.height = Math.max(1, Math.round(bitmap.height * k));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, c.width, c.height);
  bitmap.close?.();
  const out = (type: string) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, 0.9));
  let blob = await out('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await out('image/jpeg');
  if (!blob) throw new Error('Rasmni tayyorlab bo‘lmadi.');
  if (blob.size > 3 * 1024 * 1024) throw new Error('Rasm juda katta — kichikroq rasm tanlang.');
  return blob;
}

/** Toshkent vaqti bo'yicha «09.11, 14:05». */
const when = (ms: number) => {
  const d = new Date(ms + 5 * 3600000),
    p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
};

export function ScoreBadge({ score, max = LOGO_MAX_SCORE }: { score: number; max?: number }) {
  const tone = score >= 8 ? 'is-high' : score >= 5 ? 'is-mid' : 'is-low';
  return (
    <span className={'logo-score ' + tone}>
      <b>{score}</b>
      <small>/{max}</small>
    </span>
  );
}

export function AiResult({ ai, lang }: { ai: LogoAi; lang: 'uz' | 'en' | 'ru' }) {
  return (
    <div className="logo-ai">
      {(ai.notLogo || ai.copied) && (
        <p className="logo-flag" role="note">
          ⚠️{' '}
          {ai.copied
            ? tr(
                lang,
                `Bu logotip «${ai.copied}» brendining logotipiga juda o‘xshaydi — ko‘chirilgan ish baholanmaydi. O‘zingiz yangi g‘oya o‘ylab toping.`,
                `This logo looks like the “${ai.copied}” brand logo — copied work is not graded. Create your own idea.`,
                `Логотип очень похож на логотип «${ai.copied}» — скопированная работа не оценивается.`,
              )
            : tr(
                lang,
                'Rasmda logotip topilmadi. Logotipingizni aniq va to‘g‘ridan-to‘g‘ri suratga oling.',
                'No logo was found in the picture. Photograph your logo clearly and straight on.',
                'На изображении не найден логотип. Сфотографируйте логотип чётко и прямо.',
              )}
        </p>
      )}
      <ul className="logo-parts">
        {LOGO_CRITERIA.map((c) => (
          <li key={c.key}>
            <span>{tr(lang, c.uz, c.en, c.ru)}</span>
            <span className="logo-bar" aria-hidden="true">
              <i style={{ width: (ai.parts[c.key] / c.max) * 100 + '%' }} />
            </span>
            <b>
              {ai.parts[c.key]}/{c.max}
            </b>
          </li>
        ))}
      </ul>
      {ai.summary && <p className="logo-summary">{ai.summary}</p>}
      <div className="logo-advice">
        {!!ai.good.length && (
          <div>
            <h4>✅ {tr(lang, 'Yaxshi chiqqan', 'What works', 'Что получилось')}</h4>
            <ul>
              {ai.good.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {!!ai.fix.length && (
          <div>
            <h4>💡 {tr(lang, 'Yaxshilash uchun', 'To improve', 'Что улучшить')}</h4>
            <ul>
              {ai.fix.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function LogoTaskPage({ id = LOGO_TOPIC }: { id?: string }) {
  const { lang, request, toast } = useApp();
  const L = useCallback((uz: string, en: string, ru: string) => tr(lang, uz, en, ru), [lang]);
  const [task, setTask] = useState<LogoTaskView | null>(null),
    [error, setError] = useState(''),
    [file, setFile] = useState<Blob | null>(null),
    [preview, setPreview] = useState(''),
    [desc, setDesc] = useState(''),
    [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/task'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setTask(v.task);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
  // Boshqa oynada baholanayotgan bo'lsa — holatni yangilab turish
  useEffect(() => {
    if (task?.status !== 'pending' || busy) return;
    const t = setTimeout(() => void load(), 5000);
    return () => clearTimeout(t);
  }, [task, busy, load]);

  async function choose(f: File | undefined) {
    if (!f) return;
    try {
      const blob = await prepare(f);
      setFile(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      toast((e as Error).message);
    }
  }
  async function send() {
    if (!file || desc.trim().length < LOGO_DESC_MIN) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file, 'logo.' + (file.type === 'image/webp' ? 'webp' : 'jpg'));
      form.append('desc', desc.trim());
      form.append('lang', lang);
      const r = await request('/api/task', { method: 'POST', body: form }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setTask(v.task);
      if (v.task.status === 'graded') {
        setFile(null);
        setPreview('');
        setDesc('');
        toast(
          L(
            `🤖 Baho: ${v.task.ai.score}/${LOGO_MAX_SCORE}`,
            `🤖 Mark: ${v.task.ai.score}/${LOGO_MAX_SCORE}`,
            `🤖 Оценка: ${v.task.ai.score}/${LOGO_MAX_SCORE}`,
          ),
        );
      }
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function retry() {
    setBusy(true);
    try {
      const r = await request('/api/task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'retry' }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setTask(v.task);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const head = (
    <header className="logo-head">
      <Button
        variant="ghost"
        size="icon"
        aria-label={L('8-mavzuga qaytish', 'Back to topic 8', 'Назад к теме 8')}
        onClick={() => navigate('lesson/' + id)}
      >
        <ArrowLeft size={18} />
      </Button>
      <div>
        <span className="logo-kicker">
          {L(
            '8-mavzu · Amaliy topshiriq',
            'Topic 8 · Practical task',
            'Тема 8 · Практическое задание',
          )}
        </span>
        <h1>
          🎨{' '}
          {L('Biznesingiz uchun logotip', 'A logo for your business', 'Логотип для вашего бизнеса')}
        </h1>
      </div>
    </header>
  );
  if (error)
    return (
      <section className="logo-task">
        {head}
        <p className="error-state" role="alert">
          {error}
        </p>
      </section>
    );
  if (!task)
    return (
      <section className="logo-task">
        {head}
        <div className="skeleton h-64" />
      </section>
    );
  const b = task.brief;
  const mark = task.final?.score ?? task.best;
  const canSend = task.open && task.left > 0 && task.status !== 'pending';
  const descOk = desc.trim().length >= LOGO_DESC_MIN;
  return (
    <section className="logo-task" aria-labelledby="logo-title">
      {head}
      <div className="logo-grid">
        <article className="panel logo-brief" aria-labelledby="logo-title">
          <span className="logo-kicker">
            {L('Sizning biznesingiz', 'Your business', 'Ваш бизнес')}
          </span>
          <h2 id="logo-title">
            <span aria-hidden="true">{b.icon}</span> «{b.name}»
          </h2>
          <p className="logo-kind">
            <b>{b.kind}</b> — {b.what}
          </p>
          <dl>
            <div>
              <dt>👥 {L('Asosiy mijozlar', 'Main customers', 'Основные клиенты')}</dt>
              <dd>{b.aud}</dd>
            </div>
            <div>
              <dt>🎭 {L('Brend xarakteri', 'Brand character', 'Характер бренда')}</dt>
              <dd>{lang === 'uz' ? b.character.uz : b.character.en}</dd>
            </div>
            <div>
              <dt>
                📍{' '}
                {L(
                  'Logotip qayerda ishlatiladi',
                  'Where the logo is used',
                  'Где используется логотип',
                )}
              </dt>
              <dd>{b.use}</dd>
            </div>
          </dl>
          <details className="logo-rules">
            <summary>
              📋{' '}
              {L(
                'Talablar va baholash (10 ball)',
                'Requirements and grading (10 points)',
                'Требования и оценка (10 баллов)',
              )}
            </summary>
            <ul>
              <li>
                {L(
                  'Logotipni o‘zingiz chizing: qog‘ozda (keyin aniq suratga oling) yoki Canva, Figma, telefon ilovasida.',
                  'Draw the logo yourself: on paper (then photograph it clearly) or in Canva, Figma or a phone app.',
                  'Нарисуйте логотип сами: на бумаге (и чётко сфотографируйте) или в Canva, Figma, приложении.',
                )}
              </li>
              <li>
                {L(
                  'Biznes nomi yoki bosh harfi o‘qilsin; 1–3 ta rang; boshqa brendni ko‘chirish — 0 ball.',
                  'The name or initial must be readable; one to three colours; copying another brand scores 0.',
                  'Название или буква должны читаться; 1–3 цвета; копия чужого бренда — 0 баллов.',
                )}
              </li>
              <li>
                {L(
                  `Ta’rif (kamida ${LOGO_DESC_MIN} belgi): g‘oya, ramz, rang, shrift nimani anglatadi va nega mijozlarga mos.`,
                  `Description (at least ${LOGO_DESC_MIN} characters): what the idea, symbol, colours and type mean and why they suit the customers.`,
                  `Описание (не менее ${LOGO_DESC_MIN} символов): идея, символ, цвета, шрифт и почему это подходит клиентам.`,
                )}
              </li>
            </ul>
            <ol className="logo-criteria">
              {LOGO_CRITERIA.map((c) => (
                <li key={c.key}>
                  <b>{c.max}</b> — {tr(lang, c.uz, c.en, c.ru)}
                </li>
              ))}
            </ol>
          </details>
        </article>

        <article className="panel logo-result" aria-live="polite">
          <div className="logo-result-head">
            <h2>{L('Natija', 'Result', 'Результат')}</h2>
            {mark !== undefined && <ScoreBadge score={mark} />}
          </div>
          {task.final && (
            <p className="logo-final">
              👩‍🏫{' '}
              {L(
                `O‘qituvchi bahosi: ${task.final.score}/${LOGO_MAX_SCORE}`,
                `Teacher’s mark: ${task.final.score}/${LOGO_MAX_SCORE}`,
                `Оценка преподавателя: ${task.final.score}/${LOGO_MAX_SCORE}`,
              )}
              {task.final.note && <span> — {task.final.note}</span>}
            </p>
          )}
          {task.status === 'new' && (
            <p className="muted">
              {L(
                'Hali ish yuborilmagan. Logotipingizni chizing, rasmini yuklang va ta’rif yozing — sun’iy intellekt bir daqiqa ichida baholaydi.',
                'Nothing sent yet. Draw your logo, upload a picture and write a description — the AI grades it within a minute.',
                'Работа ещё не отправлена. Нарисуйте логотип, загрузите фото и напишите описание — ИИ оценит за минуту.',
              )}
            </p>
          )}
          {(task.status === 'pending' || busy) && (
            <p className="logo-wait">
              <Loader2 size={18} className="spin" aria-hidden="true" />
              {L(
                'Sun’iy intellekt logotipingizni ko‘rib chiqmoqda… (odatda 10–30 soniya)',
                'The AI is looking at your logo… (usually 10–30 seconds)',
                'ИИ изучает ваш логотип… (обычно 10–30 секунд)',
              )}
            </p>
          )}
          {(task.status === 'failed' || task.status === 'queued') && !busy && (
            <div className="logo-flag">
              <p>⏳ {task.error}</p>
              {task.aiReady && task.left > 0 && (
                <Button variant="outline" size="sm" onClick={() => void retry()}>
                  <RefreshCw size={15} />
                  {L('Qayta baholash', 'Grade again', 'Оценить снова')}
                </Button>
              )}
            </div>
          )}
          {task.img && (
            <figure className="logo-sent">
              <img
                src={task.img}
                alt={L('Yuborilgan logotip', 'Submitted logo', 'Отправленный логотип')}
              />
              <figcaption>
                {task.sentAt && <small>{when(task.sentAt)}</small>}
                {task.desc && <span>{task.desc}</span>}
              </figcaption>
            </figure>
          )}
          {task.ai && task.status === 'graded' && (
            <>
              <h3 className="logo-ai-title">
                <Sparkles size={16} aria-hidden="true" />{' '}
                {L('Sun’iy intellekt bahosi', 'AI assessment', 'Оценка ИИ')}: {task.ai.score}/
                {LOGO_MAX_SCORE}
              </h3>
              <AiResult ai={task.ai} lang={lang} />
            </>
          )}
          {task.tries.length > 0 && (
            <p className="logo-tries">
              {L('Urinishlar', 'Attempts', 'Попытки')}:{' '}
              {task.tries.map((t, i) => (
                <span key={i}>
                  {i + 1}) <b>{t.score}</b>
                </span>
              ))}
              {task.best !== undefined && (
                <em>
                  {' '}
                  · {L('hisobga olinadi', 'counted', 'учитывается')}: <b>{task.best}</b>
                </em>
              )}
            </p>
          )}
          <p className="logo-note">
            🤖{' '}
            {L(
              'Sun’iy intellekt — yordamchi baholovchi. U adashishi mumkin, shuning uchun o‘qituvchi har bir ishni ko‘rib chiqadi va bahoni o‘zgartira oladi.',
              'The AI is an assistant grader and can be wrong, so the teacher reviews every piece of work and can change the mark.',
              'ИИ — помощник в оценке и может ошибаться, поэтому преподаватель проверяет каждую работу и может изменить оценку.',
            )}
          </p>
        </article>
      </div>

      {canSend ? (
        <form
          className="panel logo-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <h2>
            {task.tries.length
              ? L('Yangi variant yuborish', 'Send a new version', 'Отправить новый вариант')
              : L('Ishni yuborish', 'Submit your work', 'Отправить работу')}
            <small>
              {L(
                `${task.left} ta urinish qoldi`,
                `${task.left} attempt(s) left`,
                `осталось попыток: ${task.left}`,
              )}
            </small>
          </h2>
          <div className="logo-form-grid">
            <button
              type="button"
              className={'logo-drop' + (preview ? ' has-img' : '')}
              onClick={() => picker.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void choose(e.dataTransfer.files?.[0]);
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt={L('Tanlangan logotip', 'Chosen logo', 'Выбранный логотип')}
                />
              ) : (
                <span>
                  <ImagePlus size={28} aria-hidden="true" />
                  <b>
                    {L(
                      'Logotip rasmini tanlang',
                      'Choose the logo picture',
                      'Выберите изображение',
                    )}
                  </b>
                  <small>PNG · JPG · WEBP</small>
                </span>
              )}
            </button>
            <input
              ref={picker}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              aria-label={L('Logotip rasmi', 'Logo picture', 'Изображение логотипа')}
              onChange={(e) => void choose(e.target.files?.[0])}
            />
            <label className="logo-desc">
              <span>{L('Logotip ta’rifi', 'Logo description', 'Описание логотипа')}</span>
              <textarea
                className="input"
                rows={8}
                maxLength={LOGO_DESC_MAX}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={L(
                  'Masalan: «Ramz — tandir va undan chiqayotgan bug‘, issiq non va oila iliqligini bildiradi. Ranglar: to‘q sariq (non, ishtaha) va jigarrang (an’ana). Shrift qalin va yumaloq — do‘stona va ishonchli. Mahalladagi oilalar uchun sodda va uydagidek his beradi; kichik qilib non qopiga ham bosiladi…»',
                  'For example: “The symbol is a tandoor with rising steam — warm bread and family warmth. Colours: orange (bread, appetite) and brown (tradition). The type is bold and rounded — friendly and trustworthy…”',
                  'Например: «Символ — тандыр и пар над ним: тёплый хлеб и уют семьи. Цвета: оранжевый и коричневый…»',
                )}
              />
              <small className={descOk ? 'ok' : ''}>
                {desc.trim().length}/{LOGO_DESC_MIN}+ ·{' '}
                {L(
                  'g‘oya, ramz, rang, shrift, mijozga mosligi',
                  'idea, symbol, colours, type, fit with customers',
                  'идея, символ, цвета, шрифт, соответствие клиентам',
                )}
              </small>
            </label>
          </div>
          <div className="logo-actions">
            <Button type="submit" disabled={busy || !file || !descOk}>
              {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              {L('Yuborish va baholatish', 'Send for grading', 'Отправить на оценку')}
            </Button>
            {!file && (
              <span className="muted">
                {L('Avval rasm tanlang', 'Choose a picture first', 'Сначала выберите изображение')}
              </span>
            )}
          </div>
        </form>
      ) : (
        (!task.open || task.left <= 0) && (
          <p className="panel logo-closed">
            {!task.open
              ? L(
                  'Topshiriq qabul qilish yopilgan.',
                  'Submissions are closed.',
                  'Приём работ закрыт.',
                )
              : task.left <= 0
                ? L(
                    'Barcha urinishlar ishlatildi. Qo‘shimcha urinish kerak bo‘lsa, «Chat» orqali o‘qituvchiga yozing.',
                    'All attempts are used. If you need another one, message the teacher in Chat.',
                    'Все попытки использованы. Если нужна ещё одна, напишите преподавателю в чат.',
                  )
                : null}
          </p>
        )
      )}
    </section>
  );
}
