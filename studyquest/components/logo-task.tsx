'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, Send } from 'lucide-react';
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
  type LogoTaskView,
} from '@/lib/logo-task';

/* 🎨 «Biznesingiz uchun logotip» (8-mavzu topshirig'i): talaba o'ziga berilgan biznesni ko'radi, logotip rasmini
   yuklaydi va ta'rif yozadi; o'qituvchi ishni ko'rib, 0–25 ball va izoh qo'yadi (8-mavzu balining logotip qismi). */

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
export const when = (ms: number) => {
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
      const r = await request('/api/task', { method: 'POST', body: form }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setTask(v.task);
      setFile(null);
      setPreview('');
      setDesc('');
      toast(
        L(
          '✅ Ishingiz yuborildi — o‘qituvchi baholaydi',
          '✅ Your work was sent — the teacher will grade it',
          '✅ Работа отправлена — преподаватель оценит её',
        ),
      );
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
                `Talablar va baholash (${LOGO_MAX_SCORE} ball)`,
                `Requirements and grading (${LOGO_MAX_SCORE} points)`,
                `Требования и оценка (${LOGO_MAX_SCORE} баллов)`,
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
              <li>
                {L(
                  'O‘qituvchi baholaguncha ishingizni yangisiga almashtirishingiz mumkin.',
                  'Until the teacher grades it, you can replace your work with a new version.',
                  'Пока преподаватель не оценил работу, её можно заменить.',
                )}
              </li>
            </ul>
            <ol className="logo-criteria">
              {LOGO_CRITERIA.map((c) => (
                <li key={c.en}>
                  <b>{c.max}</b> — {tr(lang, c.uz, c.en, c.ru)}
                </li>
              ))}
            </ol>
          </details>
        </article>

        <article className="panel logo-result" aria-live="polite">
          <div className="logo-result-head">
            <h2>{L('Natija', 'Result', 'Результат')}</h2>
            {task.final && <ScoreBadge score={task.final.score} />}
          </div>
          {task.status === 'new' && (
            <p className="muted">
              {L(
                'Hali ish yuborilmagan. Logotipingizni chizing, rasmini yuklang va ta’rif yozing — o‘qituvchi ko‘rib baholaydi.',
                'Nothing sent yet. Draw your logo, upload a picture and write a description — the teacher will grade it.',
                'Работа ещё не отправлена. Нарисуйте логотип, загрузите фото и напишите описание — преподаватель оценит.',
              )}
            </p>
          )}
          {task.status === 'sent' && (
            <p className="logo-sent-note">
              ✅{' '}
              {L(
                'Ishingiz yuborildi. O‘qituvchi ko‘rib chiqib baholaydi — baho shu sahifada chiqadi.',
                'Your work was sent. The teacher will review and grade it — the mark appears on this page.',
                'Работа отправлена. Преподаватель проверит её — оценка появится на этой странице.',
              )}
            </p>
          )}
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
          {task.final && task.again && (
            <p className="logo-sent-note">
              🔁{' '}
              {L(
                'O‘qituvchi qayta yuborishga ruxsat berdi — yangi variant yuborsangiz, u qaytadan baholanadi.',
                'The teacher allowed a new version — if you send one, it will be graded again.',
                'Преподаватель разрешил отправить новый вариант — он будет оценён заново.',
              )}
            </p>
          )}
          {task.img && (
            <figure className="logo-sent">
              <img
                src={task.img}
                alt={L('Yuborilgan logotip', 'Submitted logo', 'Отправленный логотип')}
              />
              <figcaption>
                {task.sentAt && (
                  <small>
                    {L('Yuborilgan', 'Sent', 'Отправлено')}: {when(task.sentAt)}
                  </small>
                )}
                {task.desc && <span>{task.desc}</span>}
              </figcaption>
            </figure>
          )}
        </article>
      </div>

      {task.canSend ? (
        <form
          className="panel logo-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <h2>
            {task.img
              ? L('Yangi variant yuborish', 'Send a new version', 'Отправить новый вариант')
              : L('Ishni yuborish', 'Submit your work', 'Отправить работу')}
            {task.img && (
              <small>
                {L(
                  'avvalgisi almashtiriladi',
                  'it replaces the previous one',
                  'заменит предыдущий',
                )}
              </small>
            )}
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
              {L('O‘qituvchiga yuborish', 'Send to the teacher', 'Отправить преподавателю')}
            </Button>
            {!file && (
              <span className="muted">
                {L('Avval rasm tanlang', 'Choose a picture first', 'Сначала выберите изображение')}
              </span>
            )}
          </div>
        </form>
      ) : (
        <p className="panel logo-closed">
          {!task.open
            ? L(
                'Topshiriq qabul qilish yopilgan.',
                'Submissions are closed.',
                'Приём работ закрыт.',
              )
            : L(
                'Ishingiz baholandi. Qayta yuborish kerak bo‘lsa, «Chat» orqali o‘qituvchiga yozing.',
                'Your work has been graded. If you need to send it again, message the teacher in Chat.',
                'Работа оценена. Если нужно отправить заново, напишите преподавателю в чат.',
              )}
        </p>
      )}
    </section>
  );
}
