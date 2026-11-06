'use client';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { createPortal } from 'react-dom';
import { Megaphone, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { dueText, tr } from '@/lib/points';
import type { Lang } from '@/lib/types';

/* 📢 E'lonlar oynasi (yon menyuda «Talabalar chati» ostida, har 5 soniyada almashadi) va ⚡ jonli test oynasi.
   Ma'lumot: GET /api/platform?view=news → {news, live, now}. Jonli testni o'qituvchi asl panelda rejalashtiradi
   (Kursni boshqarish → 🔑 O'qituvchi → ⚡ Jonli test); o'yinning o'zi arenada (#/live, #/yozuv). */

export type NewsItem = {
  id: string;
  h?: string;
  t: string;
  link?: string;
  until?: number;
  at: number;
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
type NewsData = { news: NewsItem[]; live: LiveGame | null; now: number };

/** Boshlanishidan necha daqiqa oldin jonli test oynasi chiqadi (asl dvigatel: KH_GATE_MS). */
export const GATE_MS = 20 * 60000;
const ROTATE_MS = 5000;
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
      shared = { news: v.news || [], live: v.live || null, now: v.now };
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
    shared = { ...(shared || { live: null, now: Date.now() }), news };
    listeners.forEach((f) => f());
  }, []);
  return { data: shared, now: serverNow, setNews };
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

/** Yon menyudagi doimiy e'lonlar oynasi: jonli test + administrator e'lonlari, har 5 soniyada almashadi. */
export function NewsBox({ className = '' }: { className?: string }) {
  const { lang, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now } = useNews();
  const g = d?.live && d.live.end > now() ? d.live : null;
  useTick(!!g && g.start - now() < 86400000);
  const [index, setIndex] = useState(0),
    [hover, setHover] = useState(false),
    [paused, setPaused] = useState(false);
  const slides: Slide[] = [];
  if (g) {
    const n = now(),
      st = liveState(g, n);
    slides.push({
      key: 'live-' + g.d,
      node: (
        <div className={'news-slide news-live is-' + st}>
          <span className="news-kicker">
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
      node: (
        <div className="news-slide">
          <span className="news-kicker">📢 {L('E’LON', 'NEWS', 'ОБЪЯВЛЕНИЕ')}</span>
          {item.h && <b>{item.h}</b>}
          <p>{item.t}</p>
          {item.link && (
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
      ),
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
    if (count < 2 || hover || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, hover, paused]);
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
              try {
                sessionStorage.setItem('sq-staff-tab', 'news');
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
    </section>
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
  const [form, setForm] = useState({ h: '', t: '', link: '', until: '' }),
    [busy, setBusy] = useState('');
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
    const ok = await send(
      {
        op: 'add',
        t: form.t.trim(),
        ...(form.h.trim() ? { h: form.h.trim() } : {}),
        ...(form.link.trim() ? { link: form.link.trim() } : {}),
        ...(until ? { until } : {}),
      },
      'add',
      '📢 ' + L('E’lon joylandi', 'Announcement posted', 'Объявление опубликовано'),
    );
    if (ok) setForm({ h: '', t: '', link: '', until: '' });
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
              'E’lonlar yon menyudagi «📢 E’lonlar» oynasida chiqadi va har 5 soniyada almashadi. Keyingi jonli test u yerda o‘zi ko‘rinadi.',
              'Announcements appear in the “📢 News” box in the side menu and change every 5 seconds. The next live quiz is shown there automatically.',
              'Объявления показываются в окне «📢 Объявления» в боковом меню и меняются каждые 5 секунд. Ближайший живой тест показывается там автоматически.',
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
          maxLength={300}
          rows={3}
          value={form.t}
          onChange={(e) => setForm({ ...form, t: e.target.value })}
          aria-label={L('E’lon matni', 'Announcement text', 'Текст объявления')}
          placeholder={L(
            'E’lon matni (300 belgigacha)',
            'Announcement text (up to 300 characters)',
            'Текст объявления (до 300 символов)',
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
        <Button type="submit" disabled={busy === 'add' || form.t.trim().length < 2}>
          <Plus size={15} /> {L('E’lon joylash', 'Post', 'Опубликовать')}
        </Button>
      </form>
      <ul className="news-admin-list">
        {(d?.news || []).map((x) => (
          <li key={x.id}>
            <span>
              {x.h && <b>{x.h}</b>}
              <span>{x.t}</span>
              <small>
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
