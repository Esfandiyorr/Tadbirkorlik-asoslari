'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { PremiumBadge, PremiumOffer } from './premium';
import { dueText, tr } from '@/lib/points';
import {
  DECK_THEMES,
  SLIDES_MAX,
  SLIDES_MIN,
  deckTheme,
  type Deck,
  type DeckMeta,
  type DeckThemeId,
  type SavedDeck,
  type SlideLang,
  type SlideLevel,
} from '@/lib/slides';
import type { SlidesView } from '@/lib/server/slides';

/* 🎞 Taqdimot: talaba mavzuni yozadi — sun'iy intellekt tayyor taqdimot tuzadi (lib/server/slides.ts). Natija sayt
   ichida slaydma-slayd ko'rinadi (5 xil rang mavzusi, to'liq ekran, ma'ruzachi izohlari) va PowerPoint (.pptx) fayli
   qilib yuklab olinadi. Pullik imkoniyat: obuna yoki administrator belgilagan bepul sinov. */

const LEVELS: [SlideLevel, string, string, string][] = [
  ['simple', '🌱 Sodda', '🌱 Simple', '🌱 Просто'],
  ['student', '🎓 Talaba', '🎓 Student', '🎓 Студент'],
  ['expert', '🚀 Chuqur', '🚀 In depth', '🚀 Углублённо'],
];
const STEPS: [string, string, string][] = [
  ['Mavzu o‘rganilmoqda…', 'Studying the topic…', 'Изучаем тему…'],
  ['Reja tuzilmoqda…', 'Planning the structure…', 'Составляем план…'],
  ['Slaydlar yozilmoqda…', 'Writing the slides…', 'Пишем слайды…'],
  ['Ma’ruzachi izohlari qo‘shilmoqda…', 'Adding speaker notes…', 'Добавляем заметки докладчика…'],
  ['Oxirgi tekshiruv…', 'Final check…', 'Финальная проверка…'],
];

export function SlidesMaker() {
  const { data, lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const user = data?.user;
  const [view, setView] = useState<SlidesView | null>(null),
    [error, setError] = useState(''),
    [f, setF] = useState({
      topic: '',
      n: 8,
      lang: (lang === 'ru' || lang === 'en' ? lang : 'uz') as SlideLang,
      level: 'student' as SlideLevel,
      note: '',
    }),
    [busy, setBusy] = useState(false),
    [step, setStep] = useState(0),
    [deck, setDeck] = useState<SavedDeck | null>(null),
    [offer, setOffer] = useState(false);
  const uid = user?.id;
  useEffect(() => {
    if (!uid) return;
    let live = true;
    request('/api/slides')
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        if (live) setView(v);
      })
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, [request, uid]);
  // kutish paytida holat yozuvi almashib turadi
  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000);
    return () => clearInterval(t);
  }, [busy]);

  async function make(e: FormEvent) {
    e.preventDefault();
    if (!view?.can) return setOffer(true);
    setBusy(true);
    try {
      const r = await request('/api/slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'make',
            input: {
              topic: f.topic.trim(),
              n: f.n,
              lang: f.lang,
              level: f.level,
              ...(f.note.trim() ? { note: f.note.trim() } : {}),
            },
          }),
        }),
        v = await r.json();
      if (r.status === 402) {
        setOffer(true);
        return;
      }
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      setDeck(v.deck);
      setView(v.view);
      toast('🎞 ' + L('Taqdimot tayyor!', 'Your presentation is ready!', 'Презентация готова!'));
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function open(m: DeckMeta) {
    try {
      const r = await request('/api/slides?id=' + encodeURIComponent(m.id)),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setDeck(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast((err as Error).message);
    }
  }
  async function remove(id: string) {
    if (
      !window.confirm(
        L('Taqdimot o‘chirilsinmi?', 'Delete this presentation?', 'Удалить презентацию?'),
      )
    )
      return;
    try {
      const r = await request('/api/slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'remove', id }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setView(v);
      if (deck?.id === id) setDeck(null);
    } catch (err) {
      toast((err as Error).message);
    }
  }

  const heading = (
    <div className="page-heading">
      <div>
        <span className="eyebrow">
          {L('SUN’IY INTELLEKT', 'AI ASSISTANT', 'ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ')}
        </span>
        <h1>🎞 {L('Taqdimot', 'Presentation', 'Презентация')}</h1>
        <p>
          {L(
            'Mavzuni yozing — sun’iy intellekt bir-ikki daqiqada tayyor taqdimot tuzib beradi: slaydlar, qisqa bandlar va gapirib berish uchun izohlar. PowerPoint faylini yuklab olasiz.',
            'Type a topic — AI builds a ready presentation in a minute or two: slides, short bullets and notes to speak from. Download it as a PowerPoint file.',
            'Напишите тему — ИИ за одну-две минуты подготовит презентацию: слайды, тезисы и заметки для выступления. Скачайте файл PowerPoint.',
          )}
        </p>
      </div>
      <div className="page-heading-side">
        <PremiumBadge state={view?.premium} />
      </div>
    </div>
  );
  if (!user)
    return (
      <>
        {heading}
        <div className="soft-empty panel">
          <span>🎞</span>
          <p>
            {L(
              'Taqdimot tuzish uchun hisobingizga kiring.',
              'Sign in to build a presentation.',
              'Войдите, чтобы создать презентацию.',
            )}
          </p>
          <Button onClick={() => navigate('login')}>{L('Kirish', 'Sign in', 'Войти')}</Button>
        </div>
      </>
    );
  const admin = user.role === 'admin';
  return (
    <>
      {heading}
      {error && <p className="error-state">{error}</p>}
      {!view && !error && <div className="skeleton h-64" />}
      {view && (
        <div className="sm-layout">
          <form className="panel sm-form" onSubmit={(e) => void make(e)}>
            {!view.configured ? (
              <p className="sm-access is-off" role="status">
                🛠{' '}
                {admin
                  ? L(
                      'Sun’iy intellekt hali ulanmagan: Vercel → Settings → Environment Variables ga ANTHROPIC_API_KEY kalitini qo‘shing va saytni qayta joylang.',
                      'AI is not connected yet: add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables and redeploy.',
                      'ИИ ещё не подключён: добавьте ANTHROPIC_API_KEY в Vercel → Settings → Environment Variables и переразверните сайт.',
                    )
                  : L(
                      'Bu bo‘lim tez orada ishga tushadi.',
                      'This section is coming soon.',
                      'Этот раздел скоро заработает.',
                    )}
              </p>
            ) : view.premium.active ? (
              <p className="sm-access is-on" role="status">
                💎{' '}
                {L(
                  `Bugun yana ${view.todayLeft} ta taqdimot tuzishingiz mumkin.`,
                  `You can build ${view.todayLeft} more presentations today.`,
                  `Сегодня можно создать ещё ${view.todayLeft}.`,
                )}
              </p>
            ) : view.freeLeft > 0 ? (
              <p className="sm-access is-free" role="status">
                🎁{' '}
                {L(
                  `Sizda ${view.freeLeft} ta bepul taqdimot bor. Keyin — obuna bilan.`,
                  `You have ${view.freeLeft} free presentation(s). After that — with Premium.`,
                  `У вас ${view.freeLeft} бесплатная презентация. Дальше — по подписке.`,
                )}
              </p>
            ) : (
              <p className="sm-access is-off" role="status">
                💎{' '}
                {L(
                  'Bepul taqdimotlar tugadi. Davom etish uchun obuna bo‘ling.',
                  'Your free presentations are used up. Subscribe to continue.',
                  'Бесплатные презентации закончились. Оформите подписку.',
                )}{' '}
                <button type="button" className="sm-link" onClick={() => setOffer(true)}>
                  {L('Obuna haqida', 'About Premium', 'О подписке')} →
                </button>
              </p>
            )}
            <label>
              {L('Taqdimot mavzusi', 'Presentation topic', 'Тема презентации')}
              <input
                className="input"
                required
                minLength={3}
                maxLength={160}
                value={f.topic}
                onChange={(e) => setF({ ...f, topic: e.target.value })}
                placeholder={L(
                  'Masalan: Kichik biznesda marketing strategiyasi',
                  'E.g. Marketing strategy for a small business',
                  'Например: Маркетинговая стратегия малого бизнеса',
                )}
              />
            </label>
            <label>
              <span className="sm-count">
                {L('Slaydlar soni', 'Number of slides', 'Количество слайдов')} <b>{f.n}</b>
              </span>
              <input
                type="range"
                min={SLIDES_MIN}
                max={SLIDES_MAX}
                value={f.n}
                onChange={(e) => setF({ ...f, n: +e.target.value })}
                aria-label={L('Slaydlar soni', 'Number of slides', 'Количество слайдов')}
              />
            </label>
            <div className="sm-row">
              <label>
                {L('Tili', 'Language', 'Язык')}
                <select
                  className="input"
                  value={f.lang}
                  onChange={(e) => setF({ ...f, lang: e.target.value as SlideLang })}
                >
                  <option value="uz">O‘zbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </label>
              <div
                className="sm-levels"
                role="radiogroup"
                aria-label={L('Daraja', 'Level', 'Уровень')}
              >
                {LEVELS.map(([id, uz, en, ru]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={f.level === id}
                    className={f.level === id ? 'on' : ''}
                    onClick={() => setF({ ...f, level: id })}
                  >
                    {L(uz, en, ru)}
                  </button>
                ))}
              </div>
            </div>
            <label>
              {L(
                'Qo‘shimcha talab (ixtiyoriy)',
                'Extra wishes (optional)',
                'Пожелания (необязательно)',
              )}
              <textarea
                className="input"
                rows={2}
                maxLength={400}
                value={f.note}
                onChange={(e) => setF({ ...f, note: e.target.value })}
                placeholder={L(
                  'Masalan: O‘zbekiston misollari bilan, oxirida 3 ta savol bo‘lsin',
                  'E.g. with examples from Uzbekistan and 3 questions at the end',
                  'Например: с примерами из Узбекистана и 3 вопросами в конце',
                )}
              />
            </label>
            <Button
              type="submit"
              disabled={busy || !view.configured || f.topic.trim().length < 3}
              className="sm-go"
            >
              <Sparkles size={17} />
              {busy
                ? L('Tayyorlanmoqda…', 'Working…', 'Готовим…')
                : L('Taqdimot tuzish', 'Build the presentation', 'Создать презентацию')}
            </Button>
            <small className="muted">
              {L(
                'Sun’iy intellekt xato qilishi mumkin — raqam va faktlarni taqdimotdan oldin tekshirib oling.',
                'AI can make mistakes — check figures and facts before you present.',
                'ИИ может ошибаться — проверьте цифры и факты перед выступлением.',
              )}
            </small>
          </form>
          <div className="sm-stage-col">
            {busy ? (
              <div className="panel sm-wait" role="status" aria-live="polite">
                <div className="sm-wait-deck" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <b>{L(...STEPS[step])}</b>
                <small>
                  {L(
                    'Odatda 1–2 daqiqa. Sahifani yopmang.',
                    'Usually 1–2 minutes. Keep this page open.',
                    'Обычно 1–2 минуты. Не закрывайте страницу.',
                  )}
                </small>
              </div>
            ) : deck ? (
              <DeckViewer key={deck.id} saved={deck} onRemove={() => void remove(deck.id)} />
            ) : (
              <div className="panel sm-empty">
                <span aria-hidden="true">✨</span>
                <b>
                  {L(
                    'Taqdimotingiz shu yerda chiqadi',
                    'Your presentation appears here',
                    'Здесь появится презентация',
                  )}
                </b>
                <small>
                  {L(
                    'Mavzuni yozing va «Taqdimot tuzish» ni bosing.',
                    'Type a topic and press “Build the presentation”.',
                    'Напишите тему и нажмите «Создать презентацию».',
                  )}
                </small>
              </div>
            )}
            {!!view.decks.length && (
              <section className="panel sm-mine">
                <h2>🗂 {L('Mening taqdimotlarim', 'My presentations', 'Мои презентации')}</h2>
                <ul>
                  {view.decks.map((m) => (
                    <li key={m.id} className={deck?.id === m.id ? 'is-open' : ''}>
                      <button type="button" onClick={() => void open(m)}>
                        <b>{m.title}</b>
                        <small>
                          {m.n} {L('slayd', 'slides', 'сл.')} · {dueText(m.at, lang, view.now).date}
                        </small>
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + m.title}
                        onClick={() => void remove(m.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
      {offer && <PremiumOffer info={view?.info} onClose={() => setOffer(false)} />}
    </>
  );
}

/** PowerPoint (.pptx) faylini brauzerda yasash — kutubxona faqat kerak bo'lganda yuklanadi. */
async function downloadPptx(deck: Deck, themeId: string) {
  const th = deckTheme(themeId),
    hex = (c: string) => c.replace('#', '');
  const Pptx = (await import('pptxgenjs')).default;
  const p = new Pptx();
  p.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 dyuym (16:9)
  p.title = deck.title;
  const cover = p.addSlide();
  cover.background = { color: hex(th.bg) };
  cover.addShape('rect', { x: 0, y: 6.9, w: 13.33, h: 0.6, fill: { color: hex(th.accent) } });
  cover.addText(deck.title, {
    x: 0.8,
    y: 2.0,
    w: 11.7,
    h: 2.0,
    fontSize: 40,
    bold: true,
    color: hex(th.ink),
    fontFace: 'Calibri',
    valign: 'middle',
    fit: 'shrink',
  });
  if (deck.subtitle)
    cover.addText(deck.subtitle, {
      x: 0.8,
      y: 4.1,
      w: 11.7,
      h: 1.0,
      fontSize: 20,
      color: hex(th.soft),
      fontFace: 'Calibri',
      fit: 'shrink',
    });
  deck.slides.forEach((s, i) => {
    const sl = p.addSlide();
    sl.background = { color: hex(th.page) };
    sl.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.35, fill: { color: hex(th.bg) } });
    sl.addShape('rect', { x: 0, y: 1.35, w: 13.33, h: 0.08, fill: { color: hex(th.accent) } });
    sl.addText(s.title, {
      x: 0.7,
      y: 0.15,
      w: 11.2,
      h: 1.05,
      fontSize: 28,
      bold: true,
      color: hex(th.ink),
      fontFace: 'Calibri',
      valign: 'middle',
      fit: 'shrink',
    });
    sl.addText(String(i + 2), {
      x: 12.2,
      y: 0.4,
      w: 0.7,
      h: 0.5,
      fontSize: 14,
      color: hex(th.soft),
      align: 'right',
    });
    sl.addText(
      s.bullets.map((b) => ({
        text: b,
        options: { bullet: { indent: 22 }, breakLine: true, paraSpaceAfter: 14 },
      })),
      {
        x: 0.9,
        y: 1.8,
        w: 11.5,
        h: 5.2,
        fontSize: 22,
        color: hex(th.body),
        fontFace: 'Calibri',
        valign: 'top',
        fit: 'shrink',
      },
    );
    if (s.notes) sl.addNotes(s.notes);
  });
  const name =
    deck.title
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .trim()
      .slice(0, 60) || 'taqdimot';
  await p.writeFile({ fileName: name + '.pptx' });
}

function DeckViewer({ saved, onRemove }: { saved: SavedDeck; onRemove: () => void }) {
  const { lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const deck = saved.deck;
  const total = deck.slides.length + 1; // 0 — muqova
  const [i, setI] = useState(0),
    [theme, setTheme] = useState<DeckThemeId>(() => {
      try {
        return (localStorage.getItem('sq-deck-theme') as DeckThemeId) || 'violet';
      } catch {
        return 'violet';
      }
    }),
    [notes, setNotes] = useState(true),
    [saving, setSaving] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const go = useCallback(
    (d: number) => setI((x) => Math.max(0, Math.min(total - 1, x + d))),
    [total],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [go]);
  const th = deckTheme(theme);
  const vars = {
    '--dk-bg': th.bg,
    '--dk-bg2': th.bg2,
    '--dk-ink': th.ink,
    '--dk-soft': th.soft,
    '--dk-accent': th.accent,
    '--dk-body': th.body,
    '--dk-page': th.page,
  } as CSSProperties;
  const slide = i > 0 ? deck.slides[i - 1] : null;
  async function save() {
    setSaving(true);
    try {
      await downloadPptx(deck, theme);
    } catch {
      toast(
        L(
          'Faylni tayyorlab bo‘lmadi. Qayta urinib ko‘ring.',
          'Could not prepare the file. Try again.',
          'Не удалось подготовить файл. Попробуйте снова.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="panel sm-viewer" style={vars}>
      <div
        className="sm-themes"
        role="radiogroup"
        aria-label={L('Rang mavzusi', 'Colour theme', 'Цветовая тема')}
      >
        {DECK_THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={theme === t.id}
            aria-label={t.name[lang === 'en' ? 1 : lang === 'ru' ? 2 : 0]}
            title={t.name[lang === 'en' ? 1 : lang === 'ru' ? 2 : 0]}
            className={theme === t.id ? 'on' : ''}
            style={{ background: `linear-gradient(135deg, ${t.bg}, ${t.bg2})` }}
            onClick={() => {
              setTheme(t.id);
              try {
                localStorage.setItem('sq-deck-theme', t.id);
              } catch {}
            }}
          />
        ))}
      </div>
      <div className="sm-stage" ref={stage}>
        <div className={'sm-slide' + (slide ? '' : ' is-cover')} key={i} aria-live="polite">
          {slide ? (
            <>
              <header>
                <h2>{slide.title}</h2>
                <em>{i + 1}</em>
              </header>
              <ul>
                {slide.bullets.map((b, k) => (
                  <li key={k} style={{ animationDelay: 120 + k * 90 + 'ms' }}>
                    {b}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2>{deck.title}</h2>
              {deck.subtitle && <p>{deck.subtitle}</p>}
            </>
          )}
        </div>
        <button
          type="button"
          className="sm-nav is-prev"
          disabled={i === 0}
          onClick={() => go(-1)}
          aria-label={L('Oldingi slayd', 'Previous slide', 'Предыдущий слайд')}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="sm-nav is-next"
          disabled={i === total - 1}
          onClick={() => go(1)}
          aria-label={L('Keyingi slayd', 'Next slide', 'Следующий слайд')}
        >
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="sm-bar">
        <span className="sm-pos">
          {i + 1} / {total}
        </span>
        <div className="sm-dots" aria-hidden="true">
          {Array.from({ length: total }, (_, k) => (
            <button
              key={k}
              type="button"
              tabIndex={-1}
              className={k === i ? 'on' : ''}
              onClick={() => setI(k)}
            />
          ))}
        </div>
        <div className="sm-actions">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNotes(!notes)}
            aria-pressed={notes}
            title={L('Ma’ruzachi izohi', 'Speaker notes', 'Заметки докладчика')}
          >
            <StickyNote size={15} />
            <span>{L('Izoh', 'Notes', 'Заметки')}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void stage.current?.requestFullscreen?.().catch(() => {})}
            title={L('To‘liq ekran', 'Full screen', 'На весь экран')}
          >
            <Maximize2 size={15} />
            <span>{L('To‘liq ekran', 'Full screen', 'Во весь экран')}</span>
          </Button>
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            <Download size={15} />
            <span>
              {saving ? L('Tayyorlanmoqda…', 'Preparing…', 'Готовим…') : 'PowerPoint (.pptx)'}
            </span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRemove}
            aria-label={L('Taqdimotni o‘chirish', 'Delete the presentation', 'Удалить презентацию')}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
      {notes && slide?.notes && (
        <p className="sm-notes">
          <b>🎤 {L('Gapirib berish uchun', 'What to say', 'Что сказать')}:</b> {slide.notes}
        </p>
      )}
    </section>
  );
}
