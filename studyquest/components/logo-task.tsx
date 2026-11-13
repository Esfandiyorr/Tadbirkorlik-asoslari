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

/* Rasmni brauzerda tayyorlash: eng uzun tomoni 1024 px gacha, shaffof joylar oq fon bilan (WEBP yoki JPEG).
   Telefonlar fayl turini turlicha aytadi («image/jpg», bo'sh, HEIC), shuning uchun turiga emas, rasm ochilishiga
   qaraladi: avval createImageBitmap, bo'lmasa (eski iPhone) — <img>. Ochilmasa, lekin fayl o'zi JPG/PNG/WEBP/GIF va
   3 MB gacha bo'lsa — o'zgartirmasdan yuboriladi (server baytlarini baribir tekshiradi). */
type PrepError = 'heic' | 'decode' | 'big';
const fail = (code: PrepError) => Object.assign(new Error(code), { code });
/** Fayl boshidagi baytlardan haqiqiy turi (telefon aytgan turga ishonilmaydi). */
async function sniff(file: Blob): Promise<string> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (b[0] === 0x89 && s(1, 3) === 'PNG') return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP') return 'image/webp';
  if (s(0, 4) === 'GIF8') return 'image/gif';
  if (s(4, 4) === 'ftyp' && /^(heic|heix|hevc|heim|heis|mif1|msf1|avif)/.test(s(8, 4)))
    return 'image/heic';
  return '';
}
async function decode(
  file: Blob,
): Promise<{ img: CanvasImageSource; w: number; h: number; done: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const b = await createImageBitmap(file);
      return { img: b, w: b.width, h: b.height, done: () => b.close?.() };
    } catch {}
  }
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    el.src = url;
    await (el.decode
      ? el.decode()
      : new Promise((ok, no) => {
          el.onload = ok;
          el.onerror = no;
        }));
    if (!el.naturalWidth) throw new Error('empty');
    return {
      img: el,
      w: el.naturalWidth,
      h: el.naturalHeight,
      done: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}
async function prepare(file: File): Promise<Blob> {
  const real = await sniff(file);
  const asIs = () => {
    if (!real || real === 'image/heic') throw fail(real === 'image/heic' ? 'heic' : 'decode');
    if (file.size > 3 * 1024 * 1024) throw fail('big');
    return file.type === real ? file : new Blob([file], { type: real });
  };
  let pic;
  try {
    pic = await decode(file);
  } catch {
    return asIs();
  }
  try {
    const k = Math.min(1, 1024 / Math.max(pic.w, pic.h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(pic.w * k));
    c.height = Math.max(1, Math.round(pic.h * k));
    const ctx = c.getContext('2d');
    if (!ctx) return asIs();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(pic.img, 0, 0, c.width, c.height);
    const out = (type: string) =>
      new Promise<Blob | null>((ok) => {
        try {
          c.toBlob(ok, type, 0.9);
        } catch {
          ok(null);
        }
      });
    let blob = await out('image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await out('image/jpeg');
    if (!blob || !blob.size) return asIs();
    if (blob.size > 3 * 1024 * 1024) throw fail('big');
    return blob;
  } finally {
    pic.done();
  }
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
      const code = (e as { code?: PrepError }).code;
      toast(
        code === 'heic'
          ? L(
              'Bu rasm HEIC turida — telefoningiz uni ocha olmadi. Logotipni skrinshot qilib (ekran rasmi), o‘sha rasmni tanlang yoki kamera sozlamasida «HEIF / Yuqori samarali» ni o‘chiring.',
              'This picture is HEIC and your phone could not open it. Take a screenshot of the logo and choose that, or turn off “HEIF / High efficiency” in the camera settings.',
              'Это фото в формате HEIC — телефон не смог его открыть. Сделайте скриншот логотипа и выберите его или отключите «HEIF / Высокая эффективность» в настройках камеры.',
            )
          : code === 'big'
            ? L(
                'Rasm juda katta (3 MB dan ortiq). Logotipni skrinshot qilib, o‘sha rasmni tanlang.',
                'The picture is too large (over 3 MB). Take a screenshot of the logo and choose that.',
                'Изображение слишком большое (более 3 МБ). Сделайте скриншот логотипа и выберите его.',
              )
            : L(
                'Bu faylni rasm sifatida ochib bo‘lmadi. JPG yoki PNG rasm tanlang — eng osoni: logotipni skrinshot qilib, o‘shani yuklang.',
                'This file could not be opened as a picture. Choose a JPG or PNG — the easiest way is to take a screenshot of the logo and upload that.',
                'Этот файл не открывается как изображение. Выберите JPG или PNG — проще всего сделать скриншот логотипа.',
              ),
      );
    }
  }
  async function send() {
    if (!file || desc.trim().length < LOGO_DESC_MIN) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file, 'logo.' + (file.type === 'image/webp' ? 'webp' : 'jpg'));
      form.append('desc', desc.trim());
      let r: Response;
      try {
        r = await request('/api/task', { method: 'POST', body: form });
      } catch {
        throw new Error(
          L(
            'Internet aloqasi uzildi — rasm yetib bormadi. Aloqani tekshirib, qayta yuboring.',
            'The connection dropped and the picture did not arrive. Check your internet and send again.',
            'Соединение прервалось — изображение не дошло. Проверьте интернет и отправьте снова.',
          ),
        );
      }
      const v = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(
          v.error ||
            L(
              'Yuborib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.',
              'Could not send. Please try again in a moment.',
              'Не удалось отправить. Попробуйте ещё раз чуть позже.',
            ),
        );
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
      <p
        className="logo-points"
        title={L(
          '8-mavzu: slaydlar 30 + o‘qish vaqti 20 + test 25 + logotip 25 = 100 ball',
          'Topic 8: slides 30 + reading time 20 + test 25 + logo 25 = 100 points',
          'Тема 8: слайды 30 + время 20 + тест 25 + логотип 25 = 100 баллов',
        )}
      >
        <b>🎯 {LOGO_MAX_SCORE}</b>
        <span>
          {L('ball', 'points', 'баллов')}
          <small>{L('8-mavzu 100 balidan', 'of topic 8’s 100', 'из 100 баллов темы 8')}</small>
        </span>
      </p>
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
                  <small>
                    {L(
                      'Galereyadan rasm yoki skrinshot',
                      'A photo or screenshot from the gallery',
                      'Фото или скриншот из галереи',
                    )}
                  </small>
                </span>
              )}
            </button>
            <input
              ref={picker}
              type="file"
              accept="image/*"
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
          <p className="logo-form-points">
            🎯{' '}
            {L(
              `O‘qituvchi ishingizni ko‘rib, 0–${LOGO_MAX_SCORE} ball qo‘yadi — bu ball 8-mavzu baliga va reytingga qo‘shiladi.`,
              `The teacher reviews your work and gives 0–${LOGO_MAX_SCORE} points — they count towards topic 8 and the ranking.`,
              `Преподаватель оценит работу на 0–${LOGO_MAX_SCORE} баллов — они идут в баллы темы 8 и рейтинг.`,
            )}
          </p>
          <div className="logo-actions">
            <Button type="submit" disabled={busy || !file || !descOk}>
              {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              {L('O‘qituvchiga yuborish', 'Send to the teacher', 'Отправить преподавателю')}
            </Button>
            {!file ? (
              <span className="muted">
                {L('Avval rasm tanlang', 'Choose a picture first', 'Сначала выберите изображение')}
              </span>
            ) : (
              !descOk && (
                <span className="logo-need" role="status">
                  ✍️{' '}
                  {L(
                    `Ta’rif juda qisqa — yana ${LOGO_DESC_MIN - desc.trim().length} ta belgi yozing (kamida ${LOGO_DESC_MIN}).`,
                    `The description is too short — write ${LOGO_DESC_MIN - desc.trim().length} more characters (at least ${LOGO_DESC_MIN}).`,
                    `Описание слишком короткое — допишите ещё ${LOGO_DESC_MIN - desc.trim().length} символов (минимум ${LOGO_DESC_MIN}).`,
                  )}
                </span>
              )
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
