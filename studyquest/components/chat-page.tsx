'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Inbox, RefreshCw } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { NativeSurface } from './native-surface';
import { navigate } from './dashboard';
import { tr } from '@/lib/points';
import { SupportChat, SupportInbox } from './support-chat';

/* «Talabalar chati» sahifasi: ikki bo'lim — guruh chati va «Adminga xabar» (Telegramdek suhbat).
   Administrator/o'qituvchi ikkinchi bo'limda suhbatlar ro'yxatini ko'radi va javob yozadi (components/support-chat.tsx). */
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
      {tab === 'chat' ? <GroupChat /> : staff ? <SupportInbox /> : <SupportChat />}
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
