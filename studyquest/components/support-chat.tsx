'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, CheckCheck, RefreshCw, Reply, Send, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { dueText, tr } from '@/lib/points';
import type { Lang, SupportMessage, SupportThread } from '@/lib/types';

/* 💬 «Adminga xabar» — Telegramdek suhbat. Talaba o'z suhbatini, administrator/o'qituvchi esa chapda suhbatlar
   ro'yxatini va o'ngda tanlangan suhbatni ko'radi. Istalgan xabarga «javob berish» (iqtibos bilan) mumkin;
   iqtibos bosilsa — asl xabarga o'tadi. Har 10 soniyada yangilanadi (sahifa ko'rinib turganda).
   Xabarlar 7 kundan keyin avtomatik o'chadi (lib/server/support.ts). */

type Msg = SupportMessage;
const POLL_MS = 10000;
export const supportCats: Record<Msg['cat'], [string, string, string, string]> = {
  tech: ['🛠️', 'Texnik muammo', 'Technical problem', 'Техническая проблема'],
  grade: ['📊', 'Baho yoki ball', 'Grades or points', 'Оценки и баллы'],
  account: ['🔑', 'Hisob, parol, guruh', 'Account, password, group', 'Аккаунт, пароль, группа'],
  idea: ['💡', 'Taklif yoki g‘oya', 'Suggestion or idea', 'Предложение или идея'],
  avatar: ['🎭', 'Avatar taklifi', 'Avatar suggestion', 'Предложение аватара'],
  report: ['🚩', 'Shikoyat', 'Report', 'Жалоба'],
  other: ['✉️', 'Boshqa savol', 'Other question', 'Другой вопрос'],
};
const catLabel = (c: Msg['cat'], lang: Lang) =>
  supportCats[c][0] +
  ' ' +
  (lang === 'en' ? supportCats[c][2] : lang === 'ru' ? supportCats[c][3] : supportCats[c][1]);
const TZ = 18000000; // Toshkent (UTC+5)
const hm = (t: number) => new Date(t + TZ).toISOString().slice(11, 16);
const dayOf = (t: number) => new Date(t + TZ).toISOString().slice(0, 10);
function dayLabel(t: number, lang: Lang) {
  const now = Date.now();
  if (dayOf(t) === dayOf(now)) return tr(lang, 'Bugun', 'Today', 'Сегодня');
  if (dayOf(t) === dayOf(now - 86400000)) return tr(lang, 'Kecha', 'Yesterday', 'Вчера');
  return dueText(t, lang, 0).date.split(',')[0];
}
const short = (t: string, n = 70) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
/** Sahifa ko'rinib turganda har 10 soniyada chaqiradi. */
function usePoll(fn: () => void, on = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => !document.hidden && ref.current(), POLL_MS);
    return () => clearInterval(t);
  }, [on]);
}
async function post(
  request: ReturnType<typeof useApp>['request'],
  action: 'send' | 'reply' | 'read',
  input: unknown,
) {
  const r = await request('/api/support', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, input }),
  });
  const v = await r.json();
  if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
  return v;
}

/** Suhbat oynasi: xabarlar (kunlar bo'yicha), javob berish va yozish maydoni. */
function ChatThread({
  messages,
  error,
  mine,
  head,
  empty,
  placeholder,
  onSend,
}: {
  messages: Msg[] | null;
  error: string;
  /** o'ng tomonda (o'zimniki) ko'rinadigan xabarlar */
  mine: 'user' | 'staff';
  head: ReactNode;
  empty: ReactNode;
  placeholder: string;
  onSend: (text: string, re?: string) => Promise<void>;
}) {
  const { lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [text, setText] = useState(''),
    [re, setRe] = useState<Msg | null>(null),
    [busy, setBusy] = useState(false),
    [flash, setFlash] = useState('');
  const list = useRef<HTMLDivElement>(null),
    input = useRef<HTMLTextAreaElement>(null),
    stick = useRef(true),
    count = useRef(0);
  // yangi xabar kelganda — pastga (agar foydalanuvchi yuqorini o'qimayotgan bo'lsa)
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || !messages) return;
    if (stick.current || count.current === 0) el.scrollTop = el.scrollHeight;
    count.current = messages.length;
  }, [messages]);
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [text]);
  const jump = (id: string) => {
    const el = document.getElementById('tg-' + id);
    if (!el)
      return toast(L('Bu xabar endi yo‘q.', 'That message is gone.', 'Это сообщение удалено.'));
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(id);
    setTimeout(() => setFlash(''), 1600);
  };
  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      stick.current = true;
      const replied = re;
      await onSend(t, replied?.id);
      // yuborilayotganda yangi matn yozilgan bo'lsa — o'chirilmaydi
      setText((cur) => (cur.trim() === t ? '' : cur));
      setRe((cur) => (cur === replied ? null : cur));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }
  let lastDay = '',
    prev: Msg | null = null;
  return (
    <section className="panel tg-chat">
      <header className="tg-head">{head}</header>
      <div
        className="tg-thread"
        ref={list}
        role="log"
        aria-live="polite"
        aria-label={L('Xabarlar', 'Messages', 'Сообщения')}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        <p className="tg-note">
          🕒{' '}
          {L(
            'Xabarlar 7 kundan keyin avtomatik o‘chadi.',
            'Messages are deleted automatically after 7 days.',
            'Сообщения удаляются автоматически через 7 дней.',
          )}
        </p>
        {error ? (
          <p role="alert" className="support-error">
            {error}
          </p>
        ) : !messages ? (
          <p className="muted tg-loading">{L('Yuklanmoqda…', 'Loading…', 'Загрузка…')}</p>
        ) : !messages.length ? (
          <div className="tg-empty">{empty}</div>
        ) : (
          messages.map((m) => {
            const own = (m.from || 'user') === mine,
              day = dayOf(m.at),
              sep = day !== lastDay;
            // muallif ismi — ketma-ket xabarlar guruhining birinchisida (Telegramdagidek)
            const showName = !own && (sep || !prev || prev.from !== m.from || prev.name !== m.name);
            lastDay = day;
            prev = m;
            return (
              <div key={m.id} className="tg-row">
                {sep && (
                  <div className="tg-day">
                    <span>{dayLabel(m.at, lang)}</span>
                  </div>
                )}
                <div
                  id={'tg-' + m.id}
                  className={
                    'tg-msg ' + (own ? 'mine' : 'theirs') + (flash === m.id ? ' is-flash' : '')
                  }
                >
                  <div className="tg-bubble">
                    {showName && <b className="tg-author">{m.name}</b>}
                    {m.from !== 'staff' && m.cat !== 'other' && (
                      <span className="tg-cat">{catLabel(m.cat, lang)}</span>
                    )}
                    {m.re && (
                      <button type="button" className="tg-quote" onClick={() => jump(m.re!.id)}>
                        <b>{m.re.name}</b>
                        <span>{m.re.text}</span>
                      </button>
                    )}
                    <p className="tg-text">{m.text}</p>
                    <span className="tg-meta">
                      {hm(m.at)}
                      {own && mine === 'user' && (
                        <span
                          className={'tg-ticks' + (m.status === 'new' ? '' : ' seen')}
                          aria-label={
                            m.status === 'new'
                              ? L('Yuborildi', 'Sent', 'Отправлено')
                              : L('O‘qildi', 'Read', 'Прочитано')
                          }
                        >
                          {m.status === 'new' ? <Check size={14} /> : <CheckCheck size={14} />}
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="tg-reply-btn"
                    aria-label={L('Javob berish', 'Reply', 'Ответить') + ': ' + short(m.text, 40)}
                    title={L('Javob berish', 'Reply', 'Ответить')}
                    onClick={() => {
                      setRe(m);
                      input.current?.focus();
                    }}
                  >
                    <Reply size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form
        className="tg-compose"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {re && (
          <div className="tg-replying">
            <Reply size={16} aria-hidden="true" />
            <span>
              <b>
                {L('Javob', 'Reply to', 'Ответ')}: {re.name}
              </b>
              <small>{short(re.text)}</small>
            </span>
            <button
              type="button"
              aria-label={L('Javobni bekor qilish', 'Cancel reply', 'Отменить ответ')}
              onClick={() => setRe(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="tg-input-row">
          <textarea
            ref={input}
            rows={1}
            maxLength={1500}
            value={text}
            aria-label={L('Xabar', 'Message', 'Сообщение')}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit();
              }
              if (e.key === 'Escape' && re) setRe(null);
            }}
          />
          <button
            type="submit"
            className="tg-send"
            disabled={busy || !text.trim()}
            aria-label={L('Yuborish', 'Send', 'Отправить')}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}

/** Talaba (yoki o'qituvchi) — administrator bilan suhbat. */
export function SupportChat() {
  const { request, lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [list, setList] = useState<Msg[] | null>(null),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await request('/api/support'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setList(v.messages || []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  usePoll(() => void load());
  return (
    <div className="support-chat-layout">
      <ChatThread
        messages={list}
        error={error}
        mine="user"
        head={
          <>
            <span className="tg-ava is-admin" aria-hidden="true">
              👩‍🏫
            </span>
            <span className="tg-who">
              <b>{L('Administrator', 'Administrator', 'Администратор')}</b>
              <small>
                {L(
                  'Odatda bir kun ichida javob beradi',
                  'Usually answers within a day',
                  'Обычно отвечает в течение дня',
                )}
              </small>
            </span>
          </>
        }
        empty={
          <>
            <span aria-hidden="true">👋</span>
            <p>
              {L(
                'Savolingizni yozing — administrator shu yerda javob beradi. Butun yozishma shu yerda saqlanadi.',
                'Write your question — the administrator answers right here. The whole conversation stays here.',
                'Напишите вопрос — администратор ответит здесь. Вся переписка сохраняется здесь.',
              )}
            </p>
          </>
        }
        placeholder={L('Xabar yozing…', 'Write a message…', 'Напишите сообщение…')}
        onSend={async (text, re) => {
          const v = await post(request, 'send', { text, ...(re ? { re } : {}) });
          setList((x) => [...(x || []), v.message]);
        }}
      />
      <aside className="panel support-tips">
        <h2>🙋 {L('Nima haqida yozish mumkin?', 'What can I ask?', 'О чём можно написать?')}</h2>
        <ul>
          {(['tech', 'grade', 'account', 'idea'] as Msg['cat'][]).map((c) => (
            <li key={c}>{catLabel(c, lang)}</li>
          ))}
        </ul>
        <p className="muted">
          {L(
            'Yozishmani faqat siz, administrator va o‘qituvchi ko‘radi. Xabar ustidagi ↩ tugmasi — aynan shu xabarga javob berish.',
            'Only you, the administrator and the teacher see this conversation. The ↩ button on a message replies to that exact message.',
            'Переписку видят только вы, администратор и преподаватель. Кнопка ↩ — ответ на конкретное сообщение.',
          )}
        </p>
      </aside>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('') || '?';
const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

/** Administrator/o'qituvchi: chapda suhbatlar, o'ngda tanlangan suhbat. */
export function SupportInbox() {
  const { request, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [threads, setThreads] = useState<SupportThread[] | null>(null),
    [error, setError] = useState(''),
    [filter, setFilter] = useState<'waiting' | 'all'>('all'),
    [sel, setSel] = useState<string | null>(null),
    [msgs, setMsgs] = useState<Msg[] | null>(null),
    [msgError, setMsgError] = useState('');
  const loadThreads = useCallback(async () => {
    try {
      const r = await request('/api/support?view=inbox'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setThreads(v.threads || []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  const loadThread = useCallback(
    async (uid: string) => {
      try {
        const r = await request('/api/support?view=inbox&uid=' + encodeURIComponent(uid)),
          v = await r.json();
        if (!r.ok) throw new Error(v.error);
        setMsgs(v.messages || []);
        setMsgError('');
        // ochilgan suhbat — o'qildi
        if ((v.messages as Msg[]).some((m) => m.from !== 'staff' && m.status === 'new')) {
          await post(request, 'read', { uid }).catch(() => {});
          setThreads((t) => t && t.map((x) => (x.uid === uid ? { ...x, unread: 0 } : x)));
        }
      } catch (e) {
        setMsgError((e as Error).message);
      }
    },
    [request],
  );
  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);
  usePoll(() => {
    void loadThreads();
    if (sel) void loadThread(sel);
  });
  const open = (uid: string) => {
    setSel(uid);
    setMsgs(null);
    void loadThread(uid);
  };
  const current = threads?.find((t) => t.uid === sel);
  const shown = (threads || []).filter((t) => filter === 'all' || t.waiting);
  const waiting = (threads || []).filter((t) => t.waiting).length;
  return (
    <div className={'tg-inbox' + (sel ? ' has-sel' : '')}>
      <aside className="panel tg-list">
        <div className="tg-list-head">
          <h2>
            📥 {L('Suhbatlar', 'Conversations', 'Диалоги')}
            {waiting > 0 && <span className="support-badge">{waiting}</span>}
          </h2>
          <Button
            size="sm"
            variant="ghost"
            aria-label={L('Yangilash', 'Refresh', 'Обновить')}
            onClick={() => void loadThreads()}
          >
            <RefreshCw size={15} />
          </Button>
        </div>
        <div className="tg-filter" role="group" aria-label={L('Saralash', 'Filter', 'Фильтр')}>
          <button
            type="button"
            className={filter === 'all' ? 'on' : ''}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            {L('Hammasi', 'All', 'Все')}
          </button>
          <button
            type="button"
            className={filter === 'waiting' ? 'on' : ''}
            aria-pressed={filter === 'waiting'}
            onClick={() => setFilter('waiting')}
          >
            {L('Javob kutayotganlar', 'Waiting for reply', 'Ждут ответа')}
          </button>
        </div>
        {error ? (
          <p role="alert" className="support-error">
            {error}
          </p>
        ) : !threads ? (
          <p className="muted">{L('Yuklanmoqda…', 'Loading…', 'Загрузка…')}</p>
        ) : !shown.length ? (
          <p className="muted tg-none">
            🎉{' '}
            {filter === 'waiting'
              ? L('Javob kutayotgan suhbat yo‘q.', 'Nobody is waiting.', 'Никто не ждёт ответа.')
              : L('Hozircha xabar yo‘q.', 'No messages yet.', 'Сообщений пока нет.')}
          </p>
        ) : (
          <ul>
            {shown.map((t) => (
              <li key={t.uid}>
                <button
                  type="button"
                  className={'tg-thread-btn' + (t.uid === sel ? ' on' : '')}
                  aria-current={t.uid === sel ? 'true' : undefined}
                  onClick={() => open(t.uid)}
                >
                  <span
                    className="tg-ava"
                    aria-hidden="true"
                    style={{
                      background: `hsl(${hue(t.uid)} 70% 88%)`,
                      color: `hsl(${hue(t.uid)} 60% 30%)`,
                    }}
                  >
                    {initials(t.name)}
                  </span>
                  <span className="tg-thread-main">
                    <span className="tg-thread-top">
                      <b>{t.name}</b>
                      <small>
                        {dayOf(t.last.at) === dayOf(Date.now())
                          ? hm(t.last.at)
                          : dayLabel(t.last.at, lang)}
                      </small>
                    </span>
                    <span className="tg-thread-bottom">
                      <small>
                        {t.group ? t.group + ' · ' : ''}
                        {t.last.from === 'staff' ? L('Siz', 'You', 'Вы') + ': ' : ''}
                        {short(t.last.text, 60)}
                      </small>
                      {t.unread > 0 && (
                        <em
                          className="tg-unread"
                          aria-label={L('o‘qilmagan', 'unread', 'непрочитанных') + ': ' + t.unread}
                        >
                          {t.unread}
                        </em>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <div className="tg-pane">
        {sel ? (
          <ChatThread
            key={sel}
            messages={msgs}
            error={msgError}
            mine="staff"
            head={
              <>
                <button
                  type="button"
                  className="tg-back"
                  aria-label={L('Suhbatlar ro‘yxati', 'Back to conversations', 'К списку диалогов')}
                  onClick={() => setSel(null)}
                >
                  <ArrowLeft size={18} />
                </button>
                <span
                  className="tg-ava"
                  aria-hidden="true"
                  style={{
                    background: `hsl(${hue(sel)} 70% 88%)`,
                    color: `hsl(${hue(sel)} 60% 30%)`,
                  }}
                >
                  {initials(current?.name || '?')}
                </span>
                <span className="tg-who">
                  <b>{current?.name || sel}</b>
                  <small>
                    {[
                      current?.group,
                      current?.role === 'teacher'
                        ? L('o‘qituvchi', 'teacher', 'преподаватель')
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </span>
              </>
            }
            empty={
              <p>
                {L(
                  'Bu suhbatda xabar qolmagan.',
                  'No messages left here.',
                  'Сообщений не осталось.',
                )}
              </p>
            }
            placeholder={L('Javob yozing…', 'Write a reply…', 'Напишите ответ…')}
            onSend={async (text, re) => {
              const v = await post(request, 'reply', { uid: sel, text, ...(re ? { re } : {}) });
              setMsgs((x) => [
                ...(x || []).map((m) =>
                  m.from !== 'staff' ? { ...m, status: 'answered' as const } : m,
                ),
                v.message,
              ]);
              setThreads(
                (t) =>
                  t &&
                  t.map((x) =>
                    x.uid === sel ? { ...x, last: v.message, waiting: false, unread: 0 } : x,
                  ),
              );
              toast(L('✅ Yuborildi', '✅ Sent', '✅ Отправлено'));
            }}
          />
        ) : (
          <div className="panel tg-placeholder">
            <span aria-hidden="true">💬</span>
            <p>
              {L(
                'Chapdan suhbatni tanlang. Xabarga javob berish uchun uning yonidagi ↩ tugmasini bosing.',
                'Pick a conversation on the left. Press ↩ next to a message to reply to it.',
                'Выберите диалог слева. Чтобы ответить на сообщение, нажмите ↩ рядом с ним.',
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
