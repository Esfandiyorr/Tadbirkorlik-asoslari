'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr, dueText } from '@/lib/points';
import type { StaffSummary } from '@/lib/server/staff-summary';
import { StaffActivity } from './staff-activity';
export function StaffTasks({ admin, open }: { admin: boolean; open: (tab: string) => void }) {
  const { request, lang } = useApp(),
    L = (a: string, b: string, c: string) => tr(lang, a, b, c);
  const [value, setValue] = useState<StaffSummary | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await request('/api/staff-summary'),
        v = await r.json();
      if (!r.ok) throw Error(v.error);
      setValue(v);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [request]);
  const count = (n: number | null | undefined) => (n == null ? '—' : n);
  return (
    <section className="staff-tasks panel" aria-labelledby="staff-tasks-title">
      <div className="staff-tasks-heading">
        <h2 id="staff-tasks-title">{L('Bugungi ishlar', 'Tasks to review', 'Текущие задачи')}</h2>
        <Button size="sm" variant="ghost" disabled={busy} onClick={load}>
          {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      <div className="staff-task-grid">
        <button onClick={() => open('accountHelp')}>
          <b>{count(value?.help)}</b>
          {L('Kirish bo‘yicha so‘rovlar', 'Sign-in help', 'Помощь со входом')}
        </button>
        <a href="#chat/admin">
          <b>{count(value?.messages)}</b>
          {L(
            'Javob kutilayotgan suhbatlar',
            'Conversations awaiting reply',
            'Собеседники ждут ответа',
          )}
        </a>
        {admin && (
          <button onClick={() => open('courseRequests')}>
            <b>{count(value?.courseRequests)}</b>
            {L('Kursga kirish so‘rovlari', 'Course access requests', 'Запросы доступа к курсам')}
          </button>
        )}
      </div>
      {busy && (
        <p role="status">{L('Vazifalar yuklanmoqda…', 'Loading tasks…', 'Загрузка задач…')}</p>
      )}
      {error && <p role="alert">{error}</p>}
      {value &&
        Object.entries(value).some(
          ([k, v]) => v === null && !(k === 'courseRequests' && !admin),
        ) && (
          <p>
            {L(
              'Ba’zi bo‘limlar yuklanmadi; “—” mavjud ma’lumot yo‘qligini bildiradi. Yangilab ko‘ring.',
              'Some sections did not load; “—” means unavailable data. Try refreshing.',
              'Некоторые разделы не загрузились; «—» означает недоступные данные. Обновите.',
            )}
          </p>
        )}
      {value?.deadlines && (
        <div className="staff-deadlines">
          <b>{L('Yaqin muddatlar', 'Upcoming deadlines', 'Ближайшие сроки')}</b>
          {value.deadlines.length ? (
            value.deadlines.map((d) => (
              <button key={d.id} onClick={() => open('access')}>
                {d.title} · {dueText(d.due, lang).date}
              </button>
            ))
          ) : (
            <span>
              {L(
                'Hamma uchun ochiq mavzularda yaqin muddat yo‘q.',
                'No upcoming deadlines for topics open to everyone.',
                'Нет ближайших сроков у тем, открытых всем.',
              )}
            </span>
          )}
        </div>
      )}
      <div className="row-actions">
        <Button variant="outline" onClick={() => open('access')}>
          {L('Mavzuni ochish', 'Open a topic', 'Открыть тему')}
        </Button>
        <Button variant="outline" onClick={() => open('academic')}>
          {L('Talabani topish', 'Find a student', 'Найти студента')}
        </Button>
      </div>
      <StaffActivity />
    </section>
  );
}
