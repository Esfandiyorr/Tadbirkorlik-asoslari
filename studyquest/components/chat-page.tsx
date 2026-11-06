'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Inbox, RefreshCw, CheckCheck } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { NativeSurface } from './native-surface';
import { navigate } from './dashboard';
import { dueText, tr } from '@/lib/points';
import type { Lang, SupportMessage } from '@/lib/types';

/* «Talabalar chati» sahifasi: ikki bo'lim — guruh chati va «Adminga xabar».
   Administrator/o'qituvchi ikkinchi bo'limda kelgan murojaatlarni ko'radi va javob yozadi. */
const cats: Record<SupportMessage['cat'], [string, string, string, string]> = {
  tech: ['🛠️', 'Texnik muammo', 'Technical problem', 'Техническая проблема'],
  grade: ['📊', 'Baho yoki ball bo‘yicha', 'About grades or points', 'Об оценках и баллах'],
  account: ['🔑', 'Hisob, parol, guruh', 'Account, password, group', 'Аккаунт, пароль, группа'],
  idea: ['💡', 'Taklif yoki g‘oya', 'Suggestion or idea', 'Предложение или идея'],
  avatar: ['🎭', 'Avatar taklifi', 'Avatar suggestion', 'Предложение аватара'],
  other: ['✉️', 'Boshqa savol', 'Other question', 'Другой вопрос'],
};
const catLabel = (c: SupportMessage['cat'], lang: Lang) =>
  cats[c][0] + ' ' + (lang === 'en' ? cats[c][2] : lang === 'ru' ? cats[c][3] : cats[c][1]);
/** «5-noyabr, 07:41» (Toshkent vaqti) — brauzer tiliga bog'liq bo'lmagan aniq ko'rinish. */
const when = (t: number, lang: Lang) => dueText(t, lang, 0).date;
function StatusChip({ m, lang }: { m: SupportMessage; lang: Lang }) {
  const map = {
    new: ['🟣', tr(lang, 'Yuborildi', 'Sent', 'Отправлено')],
    read: ['👀', tr(lang, 'O‘qildi', 'Read', 'Прочитано')],
    answered: ['✅', tr(lang, 'Javob berildi', 'Answered', 'Есть ответ')],
    closed: ['📁', tr(lang, 'Yopildi', 'Closed', 'Закрыто')],
  } as const;
  return (
    <span className={'support-status ' + m.status}>
      {map[m.status][0]} {map[m.status][1]}
    </span>
  );
}

export function ChatPage({ sub = '' }: { sub?: string }) {
  const { data, lang } = useApp();
  const u = data?.user,
    staff = u?.role === 'teacher' || u?.role === 'admin',
    groupChat = !!u && (staff || u.learnerType === 'university'),
    tab = sub === 'admin' || !groupChat ? 'admin' : 'chat';
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {tr(lang, 'MULOQOT VA YORDAM', 'TALK AND HELP', 'ОБЩЕНИЕ И ПОМОЩЬ')}
          </span>
          <h1>💬 {tr(lang, 'Talabalar chati', 'Class chat', 'Чат студентов')}</h1>
          <p>
            {tr(
              lang,
              'Guruhdoshlaringiz bilan dars haqida gaplashing yoki savolingizni to‘g‘ridan-to‘g‘ri administratorga yozing.',
              'Talk about the lessons with classmates or write your question straight to the administrator.',
              'Обсуждайте занятия с одногруппниками или напишите вопрос прямо администратору.',
            )}
          </p>
        </div>
      </div>
      <div className="chat-tabs" role="tablist">
        {groupChat && (
          <button
            role="tab"
            aria-selected={tab === 'chat'}
            className={tab === 'chat' ? 'on' : ''}
            onClick={() => navigate('chat')}
          >
            <MessageSquare size={18} />
            {tr(lang, 'Guruh chati', 'Group chat', 'Чат группы')}
          </button>
        )}
        <button
          role="tab"
          aria-selected={tab === 'admin'}
          className={tab === 'admin' ? 'on' : ''}
          onClick={() => navigate('chat/admin')}
        >
          {staff ? <Inbox size={18} /> : <Send size={18} />}
          {staff
            ? tr(lang, 'Kelgan xabarlar', 'Inbox', 'Входящие')
            : tr(lang, 'Adminga xabar', 'Message the admin', 'Написать админу')}
        </button>
      </div>
      {tab === 'chat' ? <GroupChat /> : staff ? <SupportInbox /> : <SupportForm />}
    </>
  );
}

function GroupChat() {
  const { data, lang } = useApp();
  const box = useRef<HTMLElement>(null),
    [stuck, setStuck] = useState(false),
    [attempt, setAttempt] = useState(0);
  // Chat 10 soniyada ochilmasa — bo'sh kulrang blok o'rniga sababi va «Qayta urinish» tugmasi.
  useEffect(() => {
    setStuck(false);
    const t = setTimeout(() => {
      const doc = box.current?.querySelector('.native-document');
      if (!doc || !doc.textContent?.trim()) setStuck(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [attempt]);
  return (
    <div className="chat-layout">
      <section className={'panel chat-card' + (stuck ? ' is-stuck' : '')} ref={box}>
        {stuck && (
          <div className="chat-stuck" role="status">
            <span aria-hidden="true">🔌</span>
            <p>
              <b>{tr(lang, 'Chat ochilmadi', 'The chat did not open', 'Чат не открылся')}</b>
              {tr(
                lang,
                'Internet aloqasini tekshiring. Guruh chati faqat o‘qituvchi tasdiqlagan talabalar uchun ochiq — hisobingiz hali tasdiqlanmagan bo‘lishi mumkin.',
                'Check your connection. The group chat is open only to students the teacher has approved — your account may still be waiting.',
                'Проверьте интернет. Чат группы открыт только подтверждённым студентам — возможно, ваш аккаунт ещё ждёт подтверждения.',
              )}
            </p>
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw size={16} />
              {tr(lang, 'Qayta urinish', 'Try again', 'Повторить')}
            </Button>
          </div>
        )}
        <NativeSurface
          key={attempt}
          className="native-workspace native-chat"
          title={tr(lang, 'Talabalar chati', 'Class chat', 'Чат студентов')}
          src={'/legacy/index.html?sqEmbed=chat' + (data?.mode === 'demo' ? '&sqDemo=1' : '')}
        />
      </section>
      <aside className="chat-side">
        <section className="panel chat-rules">
          <h2>📌 {tr(lang, 'Chat qoidalari', 'Chat rules', 'Правила чата')}</h2>
          <ul>
            <li>
              🤝{' '}
              {tr(
                lang,
                'Hurmat bilan yozing — haqorat va so‘kinish avtomatik to‘xtatiladi.',
                'Be respectful — insults and swearing are blocked automatically.',
                'Пишите уважительно — оскорбления блокируются автоматически.',
              )}
            </li>
            <li>
              📚{' '}
              {tr(
                lang,
                'Dars, topshiriq va tadbirkorlik haqida gaplashing.',
                'Talk about lessons, tasks and entrepreneurship.',
                'Обсуждайте занятия, задания и предпринимательство.',
              )}
            </li>
            <li>
              🖼️{' '}
              {tr(
                lang,
                'Rasm, video va havola — o‘qituvchi ruxsat bergan talabalarga.',
                'Images, videos and links — for students the teacher allows.',
                'Фото, видео и ссылки — для студентов с разрешением.',
              )}
            </li>
            <li>
              🗓️{' '}
              {tr(
                lang,
                'Videolar 1 kundan, xabarlar 1 haftadan keyin o‘chadi.',
                'Videos vanish after a day, messages after a week.',
                'Видео удаляются через день, сообщения — через неделю.',
              )}
            </li>
          </ul>
        </section>
        <button className="panel chat-help" onClick={() => navigate('chat/admin')}>
          <span aria-hidden="true">🙋</span>
          <span>
            <b>{tr(lang, 'Savolingiz bormi?', 'Have a question?', 'Есть вопрос?')}</b>
            <small>
              {tr(
                lang,
                'Baho, parol yoki texnik muammo bo‘yicha administratorga yozing.',
                'Write to the administrator about grades, passwords or technical problems.',
                'Напишите администратору об оценках, пароле или технической проблеме.',
              )}
            </small>
          </span>
        </button>
      </aside>
    </div>
  );
}

function useSupport(inbox: boolean) {
  const { request } = useApp();
  const [list, setList] = useState<SupportMessage[] | null>(null),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const r = await request('/api/support' + (inbox ? '?view=inbox' : ''));
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setList(v.messages);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request, inbox]);
  useEffect(() => {
    void load();
  }, [load]);
  const act = async (action: 'send' | 'reply', input: unknown) => {
    const r = await request('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, input }),
    });
    const v = await r.json();
    if (!r.ok) throw new Error(v.error);
    await load();
    return v.message as SupportMessage;
  };
  return { list, error, load, act };
}

function SupportForm() {
  const { lang, toast } = useApp();
  const { list, error, load, act } = useSupport(false);
  const [cat, setCat] = useState<SupportMessage['cat']>('tech'),
    [text, setText] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div className="support-layout">
      <section className="panel support-form">
        <h2>
          ✉️{' '}
          {tr(
            lang,
            'Administratorga yozish',
            'Write to the administrator',
            'Написать администратору',
          )}
        </h2>
        <p className="muted">
          {tr(
            lang,
            'Xabaringizni faqat administrator va o‘qituvchi ko‘radi. Javob shu sahifada chiqadi.',
            'Only the administrator and teacher see your message. The answer appears on this page.',
            'Сообщение видят только администратор и преподаватель. Ответ появится здесь.',
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await act('send', { cat, text });
              setText('');
              toast(tr(lang, '✅ Xabar yuborildi', '✅ Message sent', '✅ Сообщение отправлено'));
            } catch (err) {
              toast((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset className="support-cats">
            <legend>{tr(lang, 'Mavzu', 'Topic', 'Тема')}</legend>
            {(Object.keys(cats) as SupportMessage['cat'][]).map((c) => (
              <label key={c} className={cat === c ? 'on' : ''}>
                <input
                  type="radio"
                  name="support-cat"
                  value={c}
                  checked={cat === c}
                  onChange={() => setCat(c)}
                />
                {catLabel(c, lang)}
              </label>
            ))}
          </fieldset>
          <label>
            {tr(lang, 'Xabar matni', 'Your message', 'Текст сообщения')}
            <textarea
              className="input"
              required
              minLength={5}
              maxLength={1500}
              rows={5}
              value={text}
              placeholder={tr(
                lang,
                'Masalan: 3-mavzu testida ballim ko‘rinmayapti…',
                'For example: my score for the topic 3 test is not showing…',
                'Например: не отображается балл за тест 3-й темы…',
              )}
              onChange={(e) => setText(e.target.value)}
            />
            <small className="support-count">{text.length} / 1500</small>
          </label>
          <Button disabled={busy || text.trim().length < 5}>
            <Send size={16} />
            {tr(lang, 'Yuborish', 'Send', 'Отправить')}
          </Button>
        </form>
      </section>
      <section className="support-history">
        <div className="section-heading">
          <h2>📬 {tr(lang, 'Mening murojaatlarim', 'My messages', 'Мои обращения')}</h2>
          <button onClick={() => void load()}>
            <RefreshCw size={15} />
            {tr(lang, 'Yangilash', 'Refresh', 'Обновить')}
          </button>
        </div>
        {error ? (
          <p role="alert" className="support-error">
            {error}
          </p>
        ) : !list ? (
          <p className="muted">{tr(lang, 'Yuklanmoqda…', 'Loading…', 'Загрузка…')}</p>
        ) : !list.length ? (
          <div className="soft-empty panel">
            <span>📭</span>
            <p>
              {tr(
                lang,
                'Hali murojaat yubormagansiz. Savol bo‘lsa — chap tomondagi shaklni to‘ldiring.',
                'You have not sent any messages yet. Use the form to ask a question.',
                'Вы ещё не писали. Задайте вопрос через форму.',
              )}
            </p>
          </div>
        ) : (
          list.map((m) => (
            <article key={m.id} className="panel support-item">
              <header>
                <span>{catLabel(m.cat, lang)}</span>
                <StatusChip m={m} lang={lang} />
              </header>
              <p>{m.text}</p>
              <small>{when(m.at, lang)}</small>
              {m.reply && (
                <div className="support-reply">
                  <b>
                    👩‍🏫 {m.reply.by} · {when(m.reply.at, lang)}
                  </b>
                  <p>{m.reply.text}</p>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function SupportInbox() {
  const { lang, toast } = useApp();
  const { list, error, load, act } = useSupport(true);
  const [filter, setFilter] = useState<'open' | 'all'>('open'),
    [draft, setDraft] = useState<Record<string, string>>({});
  const shown = (list || []).filter(
    (m) => filter === 'all' || m.status === 'new' || m.status === 'read',
  );
  const fresh = (list || []).filter((m) => m.status === 'new').length;
  return (
    <section className="support-history">
      <div className="section-heading">
        <h2>
          📥 {tr(lang, 'Kelgan murojaatlar', 'Incoming messages', 'Входящие обращения')}
          {fresh > 0 && <span className="support-badge">{fresh}</span>}
        </h2>
        <div className="row-actions">
          <Button
            size="sm"
            variant={filter === 'open' ? 'default' : 'outline'}
            onClick={() => setFilter('open')}
          >
            {tr(lang, 'Javobsizlar', 'Unanswered', 'Без ответа')}
          </Button>
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            {tr(lang, 'Hammasi', 'All', 'Все')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void load()}>
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="support-error">
          {error}
        </p>
      ) : !list ? (
        <p className="muted">{tr(lang, 'Yuklanmoqda…', 'Loading…', 'Загрузка…')}</p>
      ) : !shown.length ? (
        <div className="soft-empty panel">
          <span>🎉</span>
          <p>
            {tr(
              lang,
              'Javob kutayotgan murojaat yo‘q.',
              'No messages are waiting for an answer.',
              'Нет обращений без ответа.',
            )}
          </p>
        </div>
      ) : (
        shown.map((m) => (
          <article key={m.uid + m.id} className={'panel support-item ' + m.status}>
            <header>
              <span>
                <b>{m.name}</b>
                {m.group ? ' · ' + m.group : ''} · {catLabel(m.cat, lang)}
              </span>
              <StatusChip m={m} lang={lang} />
            </header>
            <p>{m.text}</p>
            <small>{when(m.at, lang)}</small>
            {m.reply ? (
              <div className="support-reply">
                <b>
                  👩‍🏫 {m.reply.by} · {when(m.reply.at, lang)}
                </b>
                <p>{m.reply.text}</p>
              </div>
            ) : (
              <form
                className="support-answer"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await act('reply', { uid: m.uid, id: m.id, text: draft[m.id] });
                    setDraft({ ...draft, [m.id]: '' });
                    toast(tr(lang, '✅ Javob yuborildi', '✅ Reply sent', '✅ Ответ отправлен'));
                  } catch (err) {
                    toast((err as Error).message);
                  }
                }}
              >
                <textarea
                  className="input"
                  rows={2}
                  maxLength={1500}
                  required
                  aria-label={tr(lang, 'Javob', 'Reply', 'Ответ')}
                  placeholder={tr(lang, 'Javob yozing…', 'Write a reply…', 'Напишите ответ…')}
                  value={draft[m.id] || ''}
                  onChange={(e) => setDraft({ ...draft, [m.id]: e.target.value })}
                />
                <div className="row-actions">
                  <Button size="sm" disabled={!(draft[m.id] || '').trim()}>
                    <Send size={15} />
                    {tr(lang, 'Javob berish', 'Reply', 'Ответить')}
                  </Button>
                  {m.status === 'new' && (
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() =>
                        act('reply', { uid: m.uid, id: m.id, status: 'read' }).catch((err) =>
                          toast((err as Error).message),
                        )
                      }
                    >
                      <CheckCheck size={15} />
                      {tr(lang, 'O‘qildi', 'Mark read', 'Прочитано')}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </article>
        ))
      )}
    </section>
  );
}
