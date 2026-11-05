'use client';
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Lock, Unlock, Users } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { TopicArt } from './topic-art';
import { dueText, tr } from '@/lib/points';

type Mode = 'lock' | 'read' | 'open';
type Row = {
  id: string;
  order: number;
  title: string;
  state: Mode | 'groups';
  due?: number;
  source: 'teacher' | 'initial' | 'groups';
  groups: string[];
  students: number;
};

/* O'qituvchi bo'limi → «Mavzular holati»: har mavzuni bir bosishda hammaga 🔒 yopish, 📖 o'qish rejimiga o'tkazish
   yoki 🟢 ochish (ball bilan). Talabalarda sahifa 30 soniya ichida o'zi yangilanadi. */
export function TopicAccessPanel() {
  const { request, call, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [rows, setRows] = useState<Row[] | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=topicAccess'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setRows(v.topics);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  const modes: [Mode, string, typeof Lock][] = [
    ['lock', L('Yopiq', 'Closed', 'Закрыта'), Lock],
    ['read', L('O‘qish rejimi', 'Reading mode', 'Только чтение'), BookOpen],
    ['open', L('Hammaga ochiq', 'Open for all', 'Открыта всем'), Unlock],
  ];
  async function pick(row: Row, mode: Mode) {
    setBusy(row.id + mode);
    try {
      const v = await call<{ topics: Row[] }>('topicMode', { topic: row.id, mode });
      setRows(v.topics);
      const n = row.order + 1;
      toast(
        mode === 'lock'
          ? L(`🔒 ${n}-mavzu hammaga yopildi`, `🔒 Topic ${n} is closed`, `🔒 Тема ${n} закрыта`)
          : mode === 'read'
            ? L(
                `📖 ${n}-mavzu o‘qish rejimida — ball berilmaydi`,
                `📖 Topic ${n} is in reading mode — no points`,
                `📖 Тема ${n} только для чтения — без баллов`,
              )
            : L(
                `🟢 ${n}-mavzu hammaga ochildi — ball beriladi`,
                `🟢 Topic ${n} is open for everyone — with points`,
                `🟢 Тема ${n} открыта всем — с баллами`,
              ),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const stateChip = (r: Row) =>
    r.state === 'lock' ? (
      <span className="access-chip locked">🔒 {L('Yopiq', 'Closed', 'Закрыта')}</span>
    ) : r.state === 'read' ? (
      <span className="access-chip read">
        📖 {L('O‘qish rejimi · ball yo‘q', 'Reading mode · no points', 'Чтение · без баллов')}
      </span>
    ) : r.state === 'open' ? (
      <span className="access-chip score">
        <span className="live-dot" /> {L('Ball beriladi', 'Points on', 'Баллы начисляются')}
        {r.due ? ' · ' + dueText(r.due, lang).date + L(' gacha', '', '') : ''}
      </span>
    ) : (
      <span className="access-chip groups">
        <Users size={14} /> {L('Guruhlarga', 'Groups', 'Группам')}:{' '}
        {[
          ...r.groups,
          ...(r.students
            ? [L(`${r.students} talaba`, `${r.students} students`, `${r.students} студ.`)]
            : []),
        ].join(', ')}
      </span>
    );
  const counts = (rows || []).reduce<Record<string, number>>(
    (a, r) => ({ ...a, [r.state]: (a[r.state] || 0) + 1 }),
    {},
  );
  return (
    <section className="panel topic-access">
      <div className="section-heading">
        <div>
          <h2>🎚 {L('Mavzular holati', 'Topic access', 'Доступ к темам')}</h2>
          <p className="muted">
            {L(
              'Har mavzuni bir bosishda barcha talabalar uchun yoping, o‘qish rejimiga o‘tkazing yoki oching. Talabalarda sahifa 30 soniya ichida o‘zi yangilanadi.',
              'Close a topic, switch it to reading mode or open it for every student with one click. Student pages update by themselves within 30 seconds.',
              'Одним нажатием закройте тему, переведите её в режим чтения или откройте для всех студентов. Страницы студентов обновятся сами за 30 секунд.',
            )}
          </p>
        </div>
      </div>
      <ul className="topic-access-legend">
        <li>
          <b>🔒 {L('Yopiq', 'Closed', 'Закрыта')}</b> —{' '}
          {L(
            'talaba ham, mehmon ham ocha olmaydi.',
            'neither students nor guests can open it.',
            'не откроют ни студенты, ни гости.',
          )}
        </li>
        <li>
          <b>📖 {L('O‘qish rejimi', 'Reading mode', 'Только чтение')}</b> —{' '}
          {L(
            'hamma o‘qiy oladi, lekin ball berilmaydi va test ishlanmaydi.',
            'everyone can read it, but no points are given and the test is closed.',
            'читать могут все, но баллы не начисляются и тест закрыт.',
          )}
        </li>
        <li>
          <b>🟢 {L('Hammaga ochiq', 'Open for all', 'Открыта всем')}</b> —{' '}
          {L(
            'barcha guruhlar ball oladi: shu haftaning yakshanbasi 23:59 gacha, keyin mavzu o‘zi o‘qish rejimiga o‘tadi.',
            'every group earns points until 23:59 this Sunday, then the topic switches to reading mode by itself.',
            'все группы получают баллы до 23:59 этого воскресенья, затем тема сама переходит в режим чтения.',
          )}
        </li>
      </ul>
      {error && (
        <p role="alert" className="error-state">
          {error}{' '}
          <Button variant="outline" size="sm" onClick={() => void load()}>
            {L('Qayta urinish', 'Try again', 'Повторить')}
          </Button>
        </p>
      )}
      {!rows && !error && <div className="skeleton h-64" />}
      {rows && (
        <>
          <p className="topic-access-summary">
            🔒 {counts.lock || 0} · 📖 {counts.read || 0} · 🟢 {counts.open || 0}
            {counts.groups ? ' · 👥 ' + counts.groups : ''}
          </p>
          <ol className="topic-access-list">
            {rows.map((r) => (
              <li key={r.id} className={'topic-access-row is-' + r.state}>
                <TopicArt id={r.id} number={r.order + 1} compact />
                <div className="topic-access-info">
                  <b>
                    {r.order + 1}-{L('mavzu', 'topic', 'тема')}: {r.title}
                  </b>
                  <div>
                    {stateChip(r)}
                    <small>
                      {r.source === 'initial'
                        ? L('boshlang‘ich holat', 'initial state', 'начальное состояние')
                        : r.source === 'teacher'
                          ? L('o‘qituvchi tanlagan', 'set by the teacher', 'выбрано преподавателем')
                          : L(
                              '«Kursni boshqarish» bo‘limidagi guruh qoidalari',
                              'group rules from «Course controls»',
                              'правила групп из «Управления предметом»',
                            )}
                    </small>
                  </div>
                </div>
                <div
                  className="topic-access-modes"
                  role="group"
                  aria-label={L(
                    `${r.order + 1}-mavzu holati`,
                    `Topic ${r.order + 1} access`,
                    `Доступ к теме ${r.order + 1}`,
                  )}
                >
                  {modes.map(([m, label, Icon]) => {
                    const on = r.state === m;
                    return (
                      <Button
                        key={m}
                        size="sm"
                        variant={on ? 'default' : 'outline'}
                        className={'mode-' + m}
                        aria-pressed={on}
                        disabled={!!busy}
                        onClick={() => void pick(r, m)}
                      >
                        <Icon size={15} /> {label}
                      </Button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
