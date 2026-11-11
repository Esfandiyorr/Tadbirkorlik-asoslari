'use client';
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Megaphone, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { dueText, tr } from '@/lib/points';
import type { Lang } from '@/lib/types';
import { FRESH_MS, PROMO_KIND, type PromoItem } from '@/lib/promo';
import { ImagePick } from './image-pick';

/* 📢 E'lonlar oynasi (yon menyuda «Talabalar chati» ostida, har 10 soniyada almashadi) va ⚡ jonli test oynasi.
   Matni uzun e'lon ustiga bosilsa — to'liq matn alohida oynada ochiladi.
   Ma'lumot: GET /api/platform?view=news → {news, live, now}. Jonli testni o'qituvchi asl panelda rejalashtiradi
   (Kursni boshqarish → 🔑 O'qituvchi → ⚡ Jonli test); o'yinning o'zi arenada (#/live, #/yozuv). */

export type NewsItem = {
  id: string;
  h?: string;
  t: string;
  link?: string;
  until?: number;
  at: number;
  /** saytga kirganda katta oynada chiqadi (foydalanuvchi «O'qildi» bosguncha) */
  pop?: boolean;
  /** rasm (administrator biriktirgan) */
  img?: string;
};
export type LiveGame = {
  d: string;
  open: number;
  start: number;
  end: number;
  type: 'quiz' | 'yz';
  nq?: number;
  qsec?: number;
  note?: string;
};
type NewsData = { news: NewsItem[]; live: LiveGame | null; promo: PromoItem[]; now: number };

/** Boshlanishidan necha daqiqa oldin jonli test oynasi chiqadi (asl dvigatel: KH_GATE_MS). */
export const GATE_MS = 20 * 60000;
/** E'lonlar oynalari (1- va 2-oyna) shuncha vaqtda almashadi. */
export const ROTATE_MS = 10000;
const navigate = (view: string) => {
  location.hash = view;
};

// Bitta umumiy holat: yon menyudagi oyna va jonli test oynasi bitta so'rovdan foydalanadi.
let shared: NewsData | null = null,
  skew = 0,
  timer: ReturnType<typeof setTimeout> | undefined,
  inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const serverNow = () => Date.now() + skew;
function schedule() {
  clearTimeout(timer);
  const soon = !!shared?.live && shared.live.start - serverNow() < 30 * 60000;
  timer = setTimeout(() => void load(), soon ? 15000 : 60000);
}
async function load() {
  try {
    const r = await fetch('/api/platform?view=news');
    if (r.ok) {
      const v = (await r.json()) as NewsData;
      if (Number.isFinite(v.now)) skew = v.now - Date.now();
      shared = { news: v.news || [], live: v.live || null, promo: v.promo || [], now: v.now };
      listeners.forEach((f) => f());
    }
  } catch {}
  if (listeners.size) schedule();
}
export function useNews() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    listeners.add(rerender);
    if (!shared && !inflight) inflight = load().finally(() => (inflight = null));
    else if (!timer) schedule();
    return () => {
      listeners.delete(rerender);
      if (!listeners.size) {
        clearTimeout(timer);
        timer = undefined;
      }
    };
  }, []);
  const setNews = useCallback((news: NewsItem[]) => {
    shared = { ...(shared || { live: null, promo: [], now: Date.now() }), news };
    listeners.forEach((f) => f());
  }, []);
  const setPromo = useCallback((promo: PromoItem[]) => {
    shared = { ...(shared || { live: null, news: [], now: Date.now() }), promo };
    listeners.forEach((f) => f());
  }, []);
  return { data: shared, now: serverNow, setNews, setPromo };
}
/** Har soniyada qayta chizish (teskari sanoq uchun). */
function useTick(on: boolean) {
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [on]);
}
function useHash() {
  const [hash, setHash] = useState('');
  useEffect(() => {
    const sync = () => setHash(location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  return hash;
}

const hm = (ms: number) => new Date(ms + 18000000).toISOString().slice(11, 16);
const day = (ms: number) => new Date(ms + 18000000).toISOString().slice(0, 10);
export function when(ms: number, lang: Lang, now: number) {
  const d = day(ms);
  if (d === day(now)) return tr(lang, 'bugun', 'today', 'сегодня') + ' ' + hm(ms);
  if (d === day(now + 86400000)) return tr(lang, 'ertaga', 'tomorrow', 'завтра') + ' ' + hm(ms);
  return dueText(ms, lang, now).date;
}
export function left(ms: number, lang: Lang) {
  const s = Math.max(0, Math.floor(ms / 1000)),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  if (h)
    return (
      h +
      ' ' +
      tr(lang, 'soat', 'h', 'ч') +
      ' ' +
      String(m).padStart(2, '0') +
      ' ' +
      tr(lang, 'daq', 'min', 'мин')
    );
  return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
export function liveState(g: LiveGame, now: number) {
  return now < g.open ? 'wait' : now < g.start ? 'lobby' : 'live';
}
const gamePath = (g: LiveGame) => 'arena/play/' + (g.type === 'yz' ? 'yozuv' : 'live');
const gameName = (g: LiveGame, lang: Lang) =>
  g.type === 'yz'
    ? tr(lang, 'Yozuv marafoni', 'Typing race', 'Марафон печати')
    : tr(lang, 'Jonli test', 'Live quiz', 'Живой тест');

type Slide = { key: string; node: React.ReactNode };

/** Matn o'z joyiga sig'madimi (qisqartirib ko'rsatilyaptimi) — «To'liq o'qish» belgisi uchun. */
export function useClamped<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [clamped, setClamped] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, clamped] as const;
}

/** E'lonning to'liq matni — alohida oynada (Esc, «×» yoki tashqariga bosish bilan yopiladi). */
export function NewsReader({
  kicker,
  title,
  text,
  img,
  link,
  cta,
  meta,
  tone = 'news',
  onClose,
}: {
  kicker: ReactNode;
  title?: string;
  text?: string;
  img?: string;
  link?: string;
  cta?: string;
  meta?: string;
  tone?: 'news' | 'promo';
  onClose: () => void;
}) {
  const { lang } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null),
    done = useRef(onClose);
  done.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && done.current();
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      before?.focus?.();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop news-reader-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className={'panel news-reader is-' + tone}
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-reader-h"
      >
        <header>
          <span className="news-reader-kicker">{kicker}</span>
          <button
            ref={closeRef}
            type="button"
            className="av-close"
            aria-label={tr(lang, 'Yopish', 'Close', 'Закрыть')}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {img && <img className="news-reader-img" src={img} alt="" />}
        <h2 id="news-reader-h">{title || tr(lang, 'E’lon', 'Announcement', 'Объявление')}</h2>
        {text && <p className="news-reader-text">{text}</p>}
        {meta && <small className="news-reader-meta">{meta}</small>}
        {link && (
          <a
            className="news-reader-cta"
            href={link}
            onClick={() => !link.startsWith('http') && onClose()}
            {...(link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {cta || tr(lang, 'Batafsil', 'Learn more', 'Подробнее')} →
          </a>
        )}
      </section>
    </div>,
    document.body,
  );
}

/** Administrator e'loni (oynadagi bitta slayd): sarlavha va matnga bosilsa — to'liq matn ochiladi. */
function NewsSlide({ item, now, onOpen }: { item: NewsItem; now: number; onOpen: () => void }) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [ref, clamped] = useClamped<HTMLSpanElement>();
  // Uzun e'londa «Batafsil» tugmasi to'liq matn oynasida (kichik oynada matnga joy qolsin).
  const long = item.t.length > 140 || item.t.includes('\n');
  return (
    <div className="news-slide is-item">
      <span className="news-kicker">
        <i className="news-ping" aria-hidden="true" />
        📢 {L('E’LON', 'NEWS', 'ОБЪЯВЛЕНИЕ')}
        {now - item.at < FRESH_MS && <em className="news-new">{L('YANGI', 'NEW', 'НОВОЕ')}</em>}
      </span>
      <button
        type="button"
        className={'news-open' + (clamped ? ' is-clamped' : '')}
        aria-haspopup="dialog"
        onClick={onOpen}
      >
        {item.img && <img className="news-slide-img" src={item.img} alt="" loading="lazy" />}
        {item.h && <b>{item.h}</b>}
        <span className="news-text" ref={ref}>
          {item.t}
        </span>
        {clamped && (
          <span className="news-more">{L('To‘liq o‘qish', 'Read all', 'Читать полностью')} →</span>
        )}
      </button>
      {item.link && !long && (
        <a
          className="news-cta"
          href={item.link}
          {...(item.link.startsWith('http')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {L('Batafsil', 'More', 'Подробнее')} →
        </a>
      )}
    </div>
  );
}

/** Yon menyudagi doimiy e'lonlar oynasi: jonli test + administrator e'lonlari, har 10 soniyada almashadi. */
export function NewsBox({ className = '' }: { className?: string }) {
  const { lang, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now } = useNews();
  const g = d?.live && d.live.end > now() ? d.live : null;
  useTick(!!g && g.start - now() < 86400000);
  const [index, setIndex] = useState(0),
    [hover, setHover] = useState(false),
    [paused, setPaused] = useState(false),
    [reading, setReading] = useState<NewsItem | null>(null);
  const slides: Slide[] = [];
  if (g) {
    const n = now(),
      st = liveState(g, n);
    slides.push({
      key: 'live-' + g.d,
      node: (
        <div className={'news-slide news-live is-' + st}>
          <span className="news-kicker">
            <i className="news-ping" aria-hidden="true" />
            {g.type === 'yz' ? '⌨️' : '⚡'} {gameName(g, lang).toUpperCase()}
          </span>
          <b>
            {st === 'live'
              ? L('Hozir ketmoqda!', 'On now!', 'Идёт сейчас!')
              : st === 'lobby'
                ? L(
                    'Lobbi ochiq — qo‘shiling!',
                    'Lobby open — join now!',
                    'Лобби открыто — входите!',
                  )
                : when(g.start, lang, n)}
          </b>
          <small>
            {st === 'wait'
              ? (g.type === 'yz'
                  ? L('Yozuv poygasi', 'Typing race', 'Гонка печати')
                  : (g.nq || 10) + ' ' + L('ta savol', 'questions', 'вопросов')) +
                (g.start - n < 86400000
                  ? ' · ' +
                    L('boshlanishiga', 'starts in', 'до старта') +
                    ' ' +
                    left(g.start - n, lang)
                  : '')
              : st === 'lobby'
                ? L('Boshlanishiga', 'Starts in', 'До старта') + ' ' + left(g.start - n, lang)
                : L('G‘oliblarga reyting balli', 'Rating points for winners', 'Баллы победителям')}
          </small>
          {st !== 'wait' && (
            <a className="news-cta" href={'#' + gamePath(g)}>
              {st === 'live'
                ? '👀 ' + L('O‘yinni ochish', 'Open the game', 'Открыть игру')
                : '🎮 ' + L('O‘yinga kirish', 'Join the game', 'Войти в игру')}
            </a>
          )}
        </div>
      ),
    });
  }
  for (const item of d?.news || [])
    slides.push({
      key: item.id,
      node: <NewsSlide item={item} now={now()} onOpen={() => setReading(item)} />,
    });
  if (!slides.length)
    slides.push({
      key: 'empty',
      node: (
        <div className="news-slide news-empty">
          <span className="news-kicker">📢 {L('E’LONLAR', 'NEWS', 'ОБЪЯВЛЕНИЯ')}</span>
          <p>
            {L(
              'Jonli test vaqti va yangiliklar shu yerda chiqadi.',
              'Live quiz times and news appear here.',
              'Здесь появятся время живого теста и новости.',
            )}
          </p>
        </div>
      ),
    });
  const count = slides.length,
    current = index % count;
  useEffect(() => {
    if (count < 2 || hover || paused || reading) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, hover, paused, reading]);
  return (
    <section
      className={'news-box ' + className}
      aria-roledescription="carousel"
      aria-label={L('E’lonlar', 'Announcements', 'Объявления')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="news-stage" key={slides[current].key}>
        {slides[current].node}
      </div>
      <div className="news-foot">
        {count > 1 && (
          <>
            <div
              className="news-dots"
              role="tablist"
              aria-label={L('E’lonlar', 'News', 'Объявления')}
            >
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  aria-label={i + 1 + ' / ' + count}
                  className={i === current ? 'on' : ''}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="news-pause"
              aria-label={
                paused
                  ? L('Davom ettirish', 'Play', 'Продолжить')
                  : L('To‘xtatish', 'Pause', 'Пауза')
              }
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          </>
        )}
        {data?.user?.role === 'admin' && (
          <button
            type="button"
            className="news-admin"
            onClick={() => {
              // Boshqaruv → 🛠 Sayt boshqaruvi → 📢 E'lonlar.
              try {
                sessionStorage.setItem('sq-staff-tab', 'site');
                sessionStorage.setItem('sq-bo-section', 'news');
              } catch {}
              navigate('admin');
            }}
            aria-label={L('E’lon qo‘shish', 'Add news', 'Добавить объявление')}
            title={L('E’lon qo‘shish', 'Add news', 'Добавить объявление')}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      {reading && (
        <NewsReader
          kicker={<>📢 {L('E’LON', 'NEWS', 'ОБЪЯВЛЕНИЕ')}</>}
          title={reading.h}
          text={reading.t}
          img={reading.img}
          link={reading.link}
          meta={
            L('Joylangan', 'Posted', 'Опубликовано') +
            ': ' +
            dueText(reading.at, lang, now()).date +
            (reading.until
              ? ' · ' +
                L('ko‘rinadi', 'visible until', 'до') +
                ' ' +
                dueText(reading.until, lang, now()).date
              : '')
          }
          onClose={() => setReading(null)}
        />
      )}
    </section>
  );
}

/** ✉️ Bosh sahifadagi kichik «xat» tugmasi (telefonda — joriy mavzu yonida): ikkala e'lon oynasi (e'lonlar va
   takliflar) bitta joyda. Yonida — yangi (hali ochilmagan) e'lonlar soni qizil raqamda, hammasi ko'rilgach — umumiy
   soni kulrangda. Eng so'nggi sarlavha har 10 soniyada almashadi. Bosilsa — hammasi to'liq matni bilan. */
export function NewsChip({ className = '' }: { className?: string }) {
  const { lang, data, request } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now } = useNews();
  const [index, setIndex] = useState(0),
    // ochilgan paytdagi «ko'rilganlar» (oynada yangilarini belgilash uchun); null — yopiq
    [open, setOpen] = useState<Set<string> | null>(null),
    [seen, setSeen] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    setSeen(new Set(localSeen()));
    const on = (e: Event) => setSeen((x) => new Set(x).add((e as CustomEvent<string>).detail));
    window.addEventListener('sq-news-seen', on);
    return () => window.removeEventListener('sq-news-seen', on);
  }, []);
  const n = now();
  const g = d?.live && d.live.end > n && d.live.start - n < 86400000 ? d.live : null;
  const news = d?.news || [],
    promo = d?.promo || [];
  const entries = [
    ...(g
      ? [
          {
            key: 'live',
            text:
              (g.type === 'yz' ? '⌨️ ' : '⚡ ') +
              gameName(g, lang) +
              ' · ' +
              (liveState(g, n) === 'live' ? L('hozir', 'now', 'сейчас') : when(g.start, lang, n)),
          },
        ]
      : []),
    ...news.map((x) => ({ key: x.id, text: x.h || x.t })),
    ...promo.map((x) => ({ key: x.id, text: x.h })),
  ];
  const ids = [...news.map((x) => x.id), ...promo.map((x) => x.id)];
  const unread = ids.filter((id) => !seen.has(id)).length;
  const count = entries.length;
  useEffect(() => {
    if (count < 2 || open) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, open]);
  if (!count) return null;
  const cur = entries[index % count];
  const total = ids.length || count;
  function show() {
    setOpen(new Set(seen));
    // ochib ko'rildi — yangi deb sanalmaydi; katta oynadagi e'lonlar ham «o'qildi»
    for (const x of news)
      if (!seen.has(x.id)) {
        markLocalSeen(x.id);
        if (x.pop && data?.user)
          void request('/api/platform', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'newsSeen', input: { id: x.id } }),
          }).catch(() => {});
      }
    for (const x of promo) if (!seen.has(x.id)) markLocalSeen(x.id);
  }
  return (
    <>
      <button
        type="button"
        className={'news-chip ' + (unread ? 'has-new ' : '') + className}
        aria-haspopup="dialog"
        aria-label={
          L('E’lonlar', 'Announcements', 'Объявления') +
          ': ' +
          total +
          (unread ? ', ' + L('yangi', 'new', 'новых') + ': ' + unread : '')
        }
        onClick={show}
      >
        <span className="news-chip-env" aria-hidden="true">
          <Mail size={17} />
        </span>
        <em className={'news-chip-count' + (unread ? ' is-new' : '')}>{unread || total}</em>
        <span className="news-chip-text" key={cur.key}>
          {cur.text}
        </span>
      </button>
      {open &&
        createPortal(
          <NewsList
            g={g}
            news={news}
            promo={promo}
            fresh={open}
            now={n}
            onClose={() => setOpen(null)}
          />,
          document.body,
        )}
    </>
  );
}
/** Hamma e'lonlar, takliflar (2-oyna) va yaqin jonli test — bitta oynada, to'liq matni bilan. */
function NewsList({
  g,
  news,
  promo,
  fresh,
  now,
  onClose,
}: {
  g: LiveGame | null;
  news: NewsItem[];
  promo: PromoItem[];
  /** ochilishdan oldin ko'rilgan e'lonlar — qolganlari «YANGI» */
  fresh: Set<string>;
  now: number;
  onClose: () => void;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const closeRef = useRef<HTMLButtonElement>(null),
    done = useRef(onClose),
    [before] = useState(() => new Set(fresh));
  done.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && done.current();
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      prev?.focus?.();
    };
  }, []);
  const st = g ? liveState(g, now) : 'wait';
  const isNew = (id: string) => !before.has(id);
  const ext = (link: string) =>
    link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <div
      className="modal-backdrop news-reader-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="panel news-reader news-list"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-list-h"
      >
        <header>
          <h2 id="news-list-h" className="news-reader-kicker">
            ✉️ {L('E’LONLAR', 'ANNOUNCEMENTS', 'ОБЪЯВЛЕНИЯ')}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="av-close"
            aria-label={L('Yopish', 'Close', 'Закрыть')}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {g && (
          <article className="news-list-item is-live">
            <h3>
              {g.type === 'yz' ? '⌨️' : '⚡'} {gameName(g, lang)} · {when(g.start, lang, now)}
            </h3>
            <p>
              {st === 'live'
                ? L('Hozir ketmoqda!', 'On now!', 'Идёт сейчас!')
                : st === 'lobby'
                  ? L('Lobbi ochiq — qo‘shiling!', 'Lobby open — join now!', 'Лобби открыто!')
                  : L('Boshlanishiga', 'Starts in', 'До старта') + ' ' + left(g.start - now, lang)}
            </p>
            {st !== 'wait' && (
              <a className="news-reader-cta" href={'#' + gamePath(g)} onClick={onClose}>
                🎮 {L('O‘yinga kirish', 'Join the game', 'Войти в игру')}
              </a>
            )}
          </article>
        )}
        {news.map((x) => (
          <article key={x.id} className={'news-list-item' + (isNew(x.id) ? ' is-new' : '')}>
            <span className="news-list-kind">
              📢 {L('E’lon', 'Announcement', 'Объявление')}
              {isNew(x.id) && <em>{L('YANGI', 'NEW', 'НОВОЕ')}</em>}
            </span>
            {x.img && <img className="news-reader-img" src={x.img} alt="" loading="lazy" />}
            {x.h && <h3>{x.h}</h3>}
            <p className="news-reader-text">{x.t}</p>
            <small className="news-reader-meta">{dueText(x.at, lang, now).date}</small>
            {x.link && (
              <a
                className="news-reader-cta"
                href={x.link}
                onClick={() => !x.link!.startsWith('http') && onClose()}
                {...ext(x.link)}
              >
                {L('Batafsil', 'Learn more', 'Подробнее')} →
              </a>
            )}
          </article>
        ))}
        {promo.map((x) => {
          const k = PROMO_KIND[x.kind] || PROMO_KIND.other;
          return (
            <article
              key={x.id}
              className={'news-list-item is-promo' + (isNew(x.id) ? ' is-new' : '')}
            >
              {x.img && <img className="news-reader-img" src={x.img} alt="" loading="lazy" />}
              <span className="news-list-kind">
                {k.icon} {tr(lang, ...k.name)}
                {isNew(x.id) && <em>{L('YANGI', 'NEW', 'НОВОЕ')}</em>}
              </span>
              <h3>{x.h}</h3>
              {x.t && <p className="news-reader-text">{x.t}</p>}
              {x.link && (
                <a
                  className="news-reader-cta is-promo"
                  href={x.link}
                  onClick={() => !x.link!.startsWith('http') && onClose()}
                  {...ext(x.link)}
                >
                  {x.cta || L('Batafsil', 'Learn more', 'Подробнее')} →
                </a>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

const SEEN_KEY = 'sq-news-seen';
const localSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};
/** E'lonni shu brauzerda «o'qildi» deb belgilaydi va ochiq katta oynaga xabar beradi. */
export function markLocalSeen(id: string) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...localSeen(), id].slice(-50)));
  } catch {}
  window.dispatchEvent(new CustomEvent('sq-news-seen', { detail: id }));
}
/** 📣 Yangi e'lon — saytga kirganda katta oynada (har bir foydalanuvchiga, u «O'qildi» bosguncha).
   2-oynaning (🛍 reklama) «katta oynada ko'rsatish» belgili e'loni ham shu yerda chiqadi — u faqat bir marta: «×» yoki Esc
   bosilsa ham ko'rilgan hisoblanadi (keyin yon menyudagi 2-oynada turadi).
   O'qilganlar serverda saqlanadi (kirgan foydalanuvchi uchun; boshqa qurilmada ham chiqmaydi), mehmonda — brauzerda.
   Bir nechta bo'lsa — navbat bilan, eng yangisi birinchi. 1-oyna e'lonida «×» yoki Esc — shu safar yopiladi, keyingi
   kirishda yana chiqadi. O'yin ichida (#arena…) chiqmaydi. */
type Pop = {
  id: string;
  at: number;
  promo?: PromoItem;
  h?: string;
  t?: string;
  img?: string;
  link?: string;
  cta?: string;
  until?: number;
};
export function NewsPopup() {
  const { data, lang, request } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now } = useNews();
  const hash = useHash();
  const signedIn = !!data?.user;
  const [seen, setSeen] = useState<Set<string> | null>(null),
    [later, setLater] = useState<Set<string>>(() => new Set()),
    [busy, setBusy] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const mine = new Set(localSeen());
      if (signedIn)
        try {
          const r = await request('/api/platform?view=newsSeen');
          if (r.ok) for (const id of ((await r.json()).seen || []) as string[]) mine.add(id);
        } catch {}
      if (live) setSeen(mine);
    })();
    return () => {
      live = false;
    };
  }, [signedIn, request]);
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setSeen((s) => new Set(s || []).add(id));
    };
    window.addEventListener('sq-news-seen', on);
    return () => window.removeEventListener('sq-news-seen', on);
  }, []);
  /** Ko'rildi: shu brauzerda va (kirgan bo'lsa) serverda — boshqa qurilmada ham chiqmaydi. */
  const markRead = useCallback(
    async (id: string) => {
      markLocalSeen(id);
      if (signedIn)
        await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'newsSeen', input: { id } }),
        }).catch(() => {});
      setSeen((s) => new Set(s).add(id));
    },
    [signedIn, request],
  );
  const pops: Pop[] = [
    ...(d?.news || []).filter((x) => x.pop),
    ...(d?.promo || []).filter((x) => x.pop).map((x) => ({ ...x, promo: x })),
  ];
  const queue = pops
    .filter((x) => seen && !seen.has(x.id) && !later.has(x.id))
    .sort((a, b) => b.at - a.at);
  const item = queue[0];
  useEffect(() => {
    if (item) okRef.current?.focus();
  }, [item?.id]);
  useEffect(() => {
    if (!item) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (item.promo) void markRead(item.id);
      else setLater((s) => new Set(s).add(item.id));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [item, markRead]);
  if (!item || hash.startsWith('#arena')) return null;
  async function read() {
    if (!item) return;
    setBusy(true);
    await markRead(item.id);
    setBusy(false);
  }
  const external = item.link?.startsWith('http');
  const kind = item.promo ? PROMO_KIND[item.promo.kind] || PROMO_KIND.other : null;
  return createPortal(
    <div className="modal-backdrop news-pop-backdrop">
      <section
        className={'news-pop' + (item.promo ? ' is-promo' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-pop-h"
        aria-describedby="news-pop-t"
      >
        <header>
          <span className="news-pop-kicker">
            <i className="news-ping" aria-hidden="true" />
            {kind
              ? kind.icon +
                ' ' +
                L('YANGI TAKLIF', 'NEW OFFER', 'НОВОЕ ПРЕДЛОЖЕНИЕ') +
                ' · ' +
                tr(lang, ...kind.name)
              : '📢 ' + L('YANGI E’LON', 'NEW ANNOUNCEMENT', 'НОВОЕ ОБЪЯВЛЕНИЕ')}
            {queue.length > 1 && <em>1 / {queue.length}</em>}
          </span>
          <button
            type="button"
            className="news-pop-x"
            aria-label={
              item.promo
                ? L('Yopish', 'Close', 'Закрыть')
                : L('Keyinroq o‘qiyman', 'Read later', 'Прочитаю позже')
            }
            title={
              item.promo
                ? L('Yopish', 'Close', 'Закрыть')
                : L('Keyinroq o‘qiyman', 'Read later', 'Прочитаю позже')
            }
            onClick={() => (item.promo ? void read() : setLater((s) => new Set(s).add(item.id)))}
          >
            <X size={20} />
          </button>
        </header>
        {item.img && <img className="news-pop-img" src={item.img} alt="" />}
        <h2 id="news-pop-h">{item.h || L('E’lon', 'Announcement', 'Объявление')}</h2>
        {item.t && (
          <p id="news-pop-t" className="news-pop-text">
            {item.t}
          </p>
        )}
        <small className="news-pop-date">
          {L('Joylangan', 'Posted', 'Опубликовано')}: {dueText(item.at, lang, now()).date}
          {item.promo && item.until
            ? ' · ' + dueText(item.until, lang, now()).date + L(' gacha', ' until', ' до')
            : ''}
        </small>
        <div className="news-pop-actions">
          <button
            ref={okRef}
            type="button"
            className="news-pop-ok"
            disabled={busy}
            onClick={() => void read()}
          >
            ✓ {item.promo ? L('Ko‘rdim', 'Got it', 'Понятно') : L('O‘qildi', 'Read', 'Прочитано')}
          </button>
          {item.link && (
            <a
              className="news-pop-link"
              href={item.link}
              onClick={() => void read()}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {item.cta || L('Batafsil', 'Learn more', 'Подробнее')} →
            </a>
          )}
        </div>
        <small className="news-pop-hint">
          {item.promo
            ? L(
                'Bu taklif katta bo‘lib faqat bir marta chiqadi — keyin yon menyudagi 2-e’lon oynasida turadi.',
                'This offer pops up only once — then it stays in the second box of the side menu.',
                'Это предложение всплывает только один раз — затем оно остаётся во втором окне бокового меню.',
              )
            : L(
                '«O‘qildi» bosilgach, e’lon e’lonlar oynasida qoladi va katta bo‘lib boshqa chiqmaydi.',
                'After “Read”, the announcement stays in the announcements box and will not pop up again.',
                'После «Прочитано» объявление останется в окне объявлений и больше не всплывёт.',
              )}
        </small>
      </section>
    </div>,
    document.body,
  );
}

/** Jonli test boshlanishidan 20 daqiqa oldin — tugaguncha: ekran burchagida kichik «⚡ Jonli test» kartochkasi
   (arenadan tashqari). Talaba ham, o'qituvchi ham istalgan payt yopadi — shu o'yin uchun boshqa chiqmaydi;
   keyin kirmoqchi bo'lsa, yon menyudagi e'lonlar oynasida «O'yinga kirish» tugmasi bor. */
export function LiveGate() {
  const { data, lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now } = useNews();
  const hash = useHash();
  const u = data?.user,
    staff = u?.role === 'teacher' || u?.role === 'admin',
    student = u?.role === 'student' && u.learnerType !== 'independent';
  const g = d?.live || null,
    n = now(),
    on = !!g && n >= g.start - GATE_MS && n < g.end;
  useTick(!!g && g.start - n < GATE_MS + 60000);
  const [closed, setClosed] = useState('');
  useEffect(() => {
    try {
      setClosed(sessionStorage.getItem('sq-khgate') || '');
    } catch {}
  }, []);
  if (!g || !on || (!student && !staff) || hash.startsWith('#arena') || closed === g.d) return null;
  const st = liveState(g, n),
    yz = g.type === 'yz';
  const head = yz
    ? st === 'live'
      ? L('Yozuv marafoni ketmoqda!', 'The typing race is on!', 'Марафон печати идёт!')
      : L('Yozuv marafoni bor!', 'There is a typing race!', 'Скоро марафон печати!')
    : st === 'live'
      ? L('Jonli test ketmoqda!', 'The live quiz is on!', 'Живой тест идёт!')
      : L('Jonli test bor!', 'There is a live quiz!', 'Скоро живой тест!');
  const sub =
    st === 'wait'
      ? L(
          `Qo‘shilish ${hm(g.open)} da ochiladi · boshlanishi ${hm(g.start)}`,
          `Joining opens at ${hm(g.open)}, start at ${hm(g.start)}`,
          `Вход с ${hm(g.open)}, старт в ${hm(g.start)}`,
        )
      : st === 'lobby'
        ? L(
            'Lobbi ochiq — qo‘shilishingiz mumkin.',
            'The lobby is open — you can join.',
            'Лобби открыто — можно войти.',
          )
        : L('Hali ham qo‘shilib ko‘rish mumkin.', 'You can still look in.', 'Ещё можно заглянуть.');
  const close = () => {
    try {
      sessionStorage.setItem('sq-khgate', g.d);
    } catch {}
    setClosed(g.d);
  };
  return createPortal(
    <section className={'kh-pop is-' + st} role="dialog" aria-labelledby="kh-pop-h">
      <button
        type="button"
        className="kh-pop-x"
        onClick={close}
        aria-label={L('Yopish', 'Close', 'Закрыть')}
        title={L('Yopish', 'Close', 'Закрыть')}
      >
        <X size={16} />
      </button>
      <div className="kh-pop-ic" aria-hidden="true">
        {yz ? (st === 'live' ? '🏃' : '⌨️') : st === 'live' ? '🎮' : '⚡'}
      </div>
      <div className="kh-pop-body">
        <h2 id="kh-pop-h">{head}</h2>
        <p>{sub}</p>
        <p className="kh-pop-meta">
          {st !== 'live' && <b>⏱ {left(g.start - n, lang)}</b>}
          {yz
            ? ' 🏆 ' + L('1–3-o‘rinlarga ball', 'points for places 1–3', 'баллы за 1–3 места')
            : ' ' +
              (g.nq || 10) +
              ' ' +
              L('ta savol', 'questions', 'вопросов') +
              ' · 🏆 ' +
              L('reyting balli', 'rating points', 'баллы рейтинга')}
        </p>
        {g.note && <p className="kh-pop-note">{g.note}</p>}
        <div className="kh-pop-actions">
          <Button size="sm" className="kh-pop-btn" onClick={() => navigate(gamePath(g))}>
            {st === 'live'
              ? '👀 ' + L('O‘yinni ochish', 'Open the game', 'Открыть игру')
              : yz
                ? '⌨️ ' + L('Poygaga kirish', 'Enter the race', 'Войти в гонку')
                : '🎮 ' + L('O‘yinga kirish', 'Enter the game', 'Войти в игру')}
          </Button>
          <button type="button" className="kh-pop-later" onClick={close}>
            {L('Qatnashmayman', 'Not now', 'Не сейчас')}
          </button>
        </div>
      </div>
    </section>,
    document.body,
  );
}

/** Administrator → «📢 E'lonlar»: e'lon qo'shish/o'chirish va jonli test holati. */
export function NewsAdmin({ openCourseControls }: { openCourseControls?: () => void }) {
  const { request, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now, setNews } = useNews();
  const [form, setForm] = useState({ h: '', t: '', link: '', until: '', pop: true, push: true }),
    [image, setImage] = useState<Blob | null>(null),
    [busy, setBusy] = useState('');
  // 📲 belgining boshlang'ich holati — «🔔 Bildirishnomalar» bo'limidagi «Yangi e'lon» sozlamasidan
  useEffect(() => {
    let live = true;
    request('/api/platform?view=pushAdmin')
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (live && v?.auto && typeof v.auto.news === 'boolean')
          setForm((f) => ({ ...f, push: v.auto.news }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [request]);
  async function send(input: Record<string, unknown>, key: string, done: string) {
    setBusy(key);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'news', input }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message);
      // o'zi joylagan e'lon administratorning o'ziga katta oynada chiqmasin
      if (v.id) markLocalSeen(v.id);
      setNews(v.news || []);
      toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  /** Rasmli e'lon — bitta so'rovda (e'lon + rasm; bildirishnoma ham rasm bilan ketadi). */
  async function sendWithImage(input: Record<string, unknown>, img: Blob, done: string) {
    setBusy('add');
    try {
      const body = new FormData();
      body.set('input', JSON.stringify(input));
      body.set('file', img, 'elon.' + (img.type.split('/')[1] || 'png'));
      const r = await request('/api/site/news', { method: 'POST', body }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Rasm yuklanmadi');
      if (v.id) markLocalSeen(v.id);
      setNews(v.news || []);
      toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    // «Muddat» — shu kun oxirigacha (Toshkent vaqti).
    const until = form.until ? Date.parse(form.until + 'T23:59:59+05:00') : undefined;
    const input = {
      op: 'add',
      t: form.t.trim(),
      ...(form.h.trim() ? { h: form.h.trim() } : {}),
      ...(form.link.trim() ? { link: form.link.trim() } : {}),
      ...(until ? { until } : {}),
      ...(form.pop ? { pop: true } : {}),
      push: form.push,
    };
    const done = '📢 ' + L('E’lon joylandi', 'Announcement posted', 'Объявление опубликовано');
    const ok = image ? await sendWithImage(input, image, done) : await send(input, 'add', done);
    if (ok) {
      setForm({ h: '', t: '', link: '', until: '', pop: form.pop, push: form.push });
      setImage(null);
    }
  }
  const g = d?.live,
    n = now();
  return (
    <section className="panel news-manage">
      <div className="section-heading">
        <div>
          <h2>
            <Megaphone size={20} /> {L('E’lonlar', 'Announcements', 'Объявления')}
          </h2>
          <p className="muted">
            {L(
              'E’lonlar yon menyudagi «📢 E’lonlar» oynasida chiqadi va har 10 soniyada almashadi. Matn uzun bo‘lsa, oynada qisqartirib ko‘rsatiladi — talaba e’lonni bosib to‘liq o‘qiydi. Keyingi jonli test u yerda o‘zi ko‘rinadi.',
              'Announcements appear in the “📢 News” box in the side menu and change every 10 seconds. Long texts are shortened there — students click an announcement to read all of it. The next live quiz is shown there automatically.',
              'Объявления показываются в окне «📢 Объявления» в боковом меню и меняются каждые 10 секунд. Длинный текст студент открывает нажатием. Ближайший живой тест показывается там автоматически.',
            )}
          </p>
        </div>
      </div>
      <div className="news-admin-live">
        <b>⚡ {L('Jonli test', 'Live quiz', 'Живой тест')}:</b>{' '}
        {g
          ? gameName(g, lang) +
            ' · ' +
            when(g.start, lang, n) +
            (g.type === 'quiz'
              ? ' · ' + (g.nq || 10) + ' ' + L('ta savol', 'questions', 'вопросов')
              : '')
          : L('hozircha rejalashtirilmagan', 'not scheduled yet', 'пока не запланирован')}
        <small>
          {L(
            'Rejalashtirish va savollar banki: O‘qituvchi → «Kursni boshqarish» → 🔑 O‘qituvchi → ⚡ Jonli test.',
            'Scheduling and the question bank: Teacher → “Course controls” → 🔑 Teacher → ⚡ Live quiz.',
            'Расписание и банк вопросов: Преподаватель → «Управление предметом» → 🔑 Преподаватель → ⚡ Живой тест.',
          )}
        </small>
        {openCourseControls && (
          <Button size="sm" variant="outline" onClick={openCourseControls}>
            {L('Jonli testni boshqarish', 'Manage the live quiz', 'Управлять живым тестом')}
          </Button>
        )}
      </div>
      <form className="news-admin-form" onSubmit={(e) => void add(e)}>
        <input
          className="input"
          maxLength={60}
          value={form.h}
          onChange={(e) => setForm({ ...form, h: e.target.value })}
          aria-label={L('Sarlavha', 'Title', 'Заголовок')}
          placeholder={L('Sarlavha (ixtiyoriy)', 'Title (optional)', 'Заголовок (необязательно)')}
        />
        <textarea
          className="input"
          required
          minLength={2}
          maxLength={1500}
          rows={4}
          value={form.t}
          onChange={(e) => setForm({ ...form, t: e.target.value })}
          aria-label={L('E’lon matni', 'Announcement text', 'Текст объявления')}
          placeholder={L(
            'E’lon matni (1500 belgigacha; uzun matnni talaba bosib to‘liq o‘qiydi)',
            'Announcement text (up to 1500 characters; students click to read long texts)',
            'Текст объявления (до 1500 символов)',
          )}
        />
        <div className="news-admin-row">
          <input
            className="input"
            maxLength={300}
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            aria-label={L('Havola', 'Link', 'Ссылка')}
            placeholder={L(
              'Havola: https://… yoki #ranking (ixtiyoriy)',
              'Link: https://… or #ranking (optional)',
              'Ссылка: https://… или #ranking (необязательно)',
            )}
          />
          <label>
            <span>{L('Ko‘rinadi:', 'Visible until:', 'Показывать до:')}</span>
            <input
              className="input"
              type="date"
              value={form.until}
              onChange={(e) => setForm({ ...form, until: e.target.value })}
              aria-label={L('Qaysi kungacha ko‘rinadi', 'Visible until', 'Показывать до')}
            />
          </label>
        </div>
        <ImagePick
          value={image}
          onChange={setImage}
          hint={L(
            'Rasm e’lonlar oynasida, katta oynada va telefondagi bildirishnomada (Android, kompyuter) chiqadi.',
            'The picture appears in the news box, the big window and in phone notifications (Android, desktop).',
            'Картинка видна в окне объявлений, в большом окне и в уведомлении на телефоне (Android, компьютер).',
          )}
        />
        <label className="news-admin-pop">
          <input
            type="checkbox"
            checked={form.pop}
            onChange={(e) => setForm({ ...form, pop: e.target.checked })}
          />
          <span>
            📣{' '}
            {L(
              'Saytga kirganda hammaga katta oynada ko‘rsatish — «O‘qildi» bosilgach boshqa chiqmaydi',
              'Show it to everyone in a big window when they open the site — it stops after they press “Read”',
              'Показать всем в большом окне при входе — после «Прочитано» больше не появится',
            )}
          </span>
        </label>
        <label className="news-admin-pop">
          <input
            type="checkbox"
            checked={form.push}
            onChange={(e) => setForm({ ...form, push: e.target.checked })}
          />
          <span>
            📲{' '}
            {L(
              'Telefonlarga ham yuborilsin — bildirishnomani yoqqan talabalar va o‘qituvchilarga',
              'Also send to phones — to students and teachers who turned notifications on',
              'Отправить и на телефоны — тем, кто включил уведомления',
            )}
          </span>
        </label>
        <Button type="submit" disabled={busy === 'add' || form.t.trim().length < 2}>
          <Plus size={15} /> {L('E’lon joylash', 'Post', 'Опубликовать')}
        </Button>
      </form>
      <ul className="news-admin-list">
        {(d?.news || []).map((x) => (
          <li key={x.id}>
            {x.img && <img className="news-admin-img" src={x.img} alt="" loading="lazy" />}
            <span>
              {x.h && <b>{x.h}</b>}
              <span>{x.t}</span>
              <small>
                {x.pop ? '📣 ' : ''}
                {dueText(x.at, lang, n).date}
                {x.until ? ' → ' + dueText(x.until, lang, n).date : ''}
                {x.link ? ' · ' + x.link : ''}
              </small>
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!!busy}
              aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + (x.h || x.t.slice(0, 30))}
              onClick={() =>
                void send(
                  { op: 'remove', id: x.id },
                  'rm' + x.id,
                  L('E’lon o‘chirildi', 'Deleted', 'Удалено'),
                )
              }
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}
        {!d?.news?.length && (
          <li className="muted">
            {L('Hozircha e’lon yo‘q.', 'No announcements yet.', 'Объявлений пока нет.')}
          </li>
        )}
      </ul>
    </section>
  );
}
