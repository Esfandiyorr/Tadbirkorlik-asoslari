'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Crown, Gem, Trophy, Users } from 'lucide-react';
import { useApp } from './provider';
import { num, tr } from '@/lib/points';

type Entry = { id: string; name: string; academicPoints?: number; today?: number; classId: string };
type Period = 'day' | 'all';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
/** Har talabaga ismidan barqaror rang (avatar o'rnida). */
const hue = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
};
/** Ismning bosh harflari rangli doira ichida (rasmli avatarlar o'chirilgan). Reyting va arenada ishlatiladi. */
export function Avatar({ e, size }: { e: { id: string; name: string }; size: number }) {
  const h = hue(e.id);
  return (
    <span
      className="rk-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(140deg, hsl(${h} 78% 62%), hsl(${(h + 40) % 360} 70% 42%))`,
      }}
      aria-hidden="true"
    >
      {initials(e.name)}
    </span>
  );
}
/** Gulchambar ichida o'rin raqami (1 — oltin, 2 — kumush, 3 — bronza, qolganlari — binafsha). */
export function Laurel({ place, size = 46 }: { place: number; size?: number }) {
  const color =
    place === 1 ? '#f5b81b' : place === 2 ? '#c7cfdb' : place === 3 ? '#e08a4f' : '#a78bfa';
  // Chap va o'ng shoxcha: pastdan (≈110°) tepaga (≈250°) aylana bo'ylab 6 tadan barg, tepasi ochiq.
  const leaves = [0, 1, 2, 3, 4, 5].map((i) => {
    const deg = 112 + i * 27,
      a = (deg * Math.PI) / 180;
    return { x: 32 + 23 * Math.cos(a), y: 33 + 23 * Math.sin(a), deg, r: 4.6 - i * 0.25 };
  });
  return (
    <svg className="rk-laurel" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {leaves.map((l, i) => (
        <g key={i} fill={color}>
          <ellipse
            cx={l.x}
            cy={l.y}
            rx={l.r * 0.55}
            ry={l.r * 1.5}
            transform={`rotate(${l.deg} ${l.x} ${l.y})`}
          />
          <ellipse
            cx={64 - l.x}
            cy={l.y}
            rx={l.r * 0.55}
            ry={l.r * 1.5}
            transform={`rotate(${180 - l.deg} ${64 - l.x} ${l.y})`}
          />
        </g>
      ))}
      <path
        d="M22 58 Q32 52 42 58"
        stroke={color}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="32"
        y="39"
        textAnchor="middle"
        fontSize={place > 9 ? 16 : 20}
        fontWeight="800"
        fill={color}
      >
        {place}
      </text>
    </svg>
  );
}

export function Leaderboard() {
  const { data, lang, request } = useApp(),
    L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [rows, setRows] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [period, setPeriod] = useState<Period>('all'),
    [group, setGroup] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    request('/api/platform?view=academic')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (live) {
          setRows(d.leaderboard || []);
          setError('');
        }
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [request]);
  const myGroup = data?.user?.classId || '';
  const score = (r: Entry) => (period === 'day' ? r.today || 0 : r.academicPoints || 0);
  const visible = useMemo(
    () =>
      rows
        .filter((r) => !group || r.classId === group)
        .filter((r) => period === 'all' || (r.today || 0) > 0)
        .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, group, period],
  );
  const groups = Array.from(new Set(rows.map((r) => r.classId).filter(Boolean))).sort();
  const myIndex = visible.findIndex((r) => r.id === data?.user?.id);
  const me = myIndex >= 0 ? visible[myIndex] : null;
  const podium = [visible[1], visible[0], visible[2]];
  const unit = L('ball', 'pts', 'б.');
  return (
    <div className="rk-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{L('BIRGA O‘SAMIZ', 'GROW TOGETHER', 'РАСТЁМ ВМЕСТЕ')}</span>
          <h1>{L('Reyting', 'Leaderboard', 'Рейтинг')}</h1>
          <p>
            {L(
              'Ball faqat taqdimotlardan (har mavzu 100 ball) va o‘qituvchi beradigan qo‘shimcha topshiriqlardan to‘planadi.',
              'Points come only from presentations (100 per topic) and extra tasks from the teacher.',
              'Баллы — только за презентации (100 за тему) и дополнительные задания преподавателя.',
            )}
          </p>
        </div>
      </div>

      <div className="rk-controls">
        <div
          className="rk-tabs"
          role="tablist"
          aria-label={L('Reyting turi', 'Ranking type', 'Тип рейтинга')}
        >
          {(
            [
              ['day', <CalendarDays key="i" size={16} />, L('Kunlik', 'Today', 'За день')],
              ['all', <Trophy key="i" size={16} />, L('Umumiy', 'Overall', 'Общий')],
            ] as const
          ).map(([id, icon, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={period === id}
              className={period === id ? 'on' : ''}
              onClick={() => setPeriod(id)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
        <div className="rk-groups">
          {myGroup && (
            <button
              className={group === myGroup ? 'on' : ''}
              aria-pressed={group === myGroup}
              onClick={() => setGroup(group === myGroup ? '' : myGroup)}
            >
              <Users size={15} /> {L('Mening guruhim', 'My group', 'Моя группа')} · {myGroup}
            </button>
          )}
          <select
            className="input"
            aria-label={L('Guruh', 'Group', 'Группа')}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">{L('Barcha guruhlar', 'All groups', 'Все группы')}</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>
      {period === 'day' && (
        <p className="rk-note">
          📅{' '}
          {L(
            'Bugun to‘plangan ballar. Kunlik reyting har kuni 00:00 da (Toshkent vaqti) yangidan boshlanadi.',
            'Points earned today. The daily ranking restarts every day at 00:00 (Tashkent time).',
            'Баллы за сегодня. Дневной рейтинг обнуляется каждый день в 00:00 (по Ташкенту).',
          )}
        </p>
      )}

      {error ? (
        <div className="error-state">{error}</div>
      ) : loading ? (
        <div className="skeleton h-64" />
      ) : !visible.length ? (
        <div className="empty-state">
          <Trophy size={42} />
          <h3>
            {period === 'day'
              ? L(
                  'Bugun hali hech kim ball olmagan — birinchi bo‘ling!',
                  'Nobody has earned points today yet — be the first!',
                  'Сегодня ещё никто не набрал баллов — будьте первым!',
                )
              : L(
                  'Birinchi natija sizniki bo‘lishi mumkin.',
                  'The first result could be yours.',
                  'Первый результат может стать вашим.',
                )}
          </h3>
        </div>
      ) : (
        <div className="rk-board">
          {me && (
            <section className={'rk-me' + (myIndex < 3 ? ' top' : '')}>
              <div className="rk-me-avatar">
                {myIndex === 0 && <Crown className="rk-crown" size={30} />}
                <Avatar e={me} size={64} />
              </div>
              <div>
                <small>
                  {myIndex === 0
                    ? L('Tabriklaymiz! 🎉', 'Congratulations! 🎉', 'Поздравляем! 🎉')
                    : L('Sizning o‘rningiz', 'Your place', 'Ваше место')}
                </small>
                <b>{me.name}</b>
                <span className="rk-pts">
                  <Gem size={15} /> {num(score(me))} {unit}
                </span>
              </div>
              <Laurel place={myIndex + 1} size={58} />
            </section>
          )}
          <section
            className="rk-podium"
            aria-label={L('Eng yaxshi uchlik', 'Top three', 'Тройка лидеров')}
          >
            {podium.map((r, i) => {
              if (!r) return <div key={i} className="rk-pod empty" />;
              const place = [2, 1, 3][i];
              return (
                <div
                  key={r.id}
                  className={'rk-pod place-' + place + (r.id === data?.user?.id ? ' me' : '')}
                >
                  <Laurel place={place} size={place === 1 ? 54 : 44} />
                  <div className="rk-pod-avatar">
                    {place === 1 && <Crown className="rk-crown" size={26} />}
                    <Avatar e={r} size={place === 1 ? 72 : 58} />
                  </div>
                  <b>{r.name}</b>
                  <small>{r.classId}</small>
                  <span className="rk-pts">
                    <Gem size={14} /> {num(score(r))}
                  </span>
                </div>
              );
            })}
          </section>
          <ol className="ranking-list rk-list" start={1}>
            {visible.map((r, i) => (
              <li key={r.id} className={r.id === data?.user?.id ? 'me' : ''}>
                <Avatar e={r} size={42} />
                <div className="rk-who">
                  <b>{r.name}</b>
                  <small>{r.classId}</small>
                </div>
                <span className="rk-pts">
                  <Gem size={14} /> {num(score(r))} <small>{unit}</small>
                </span>
                <Laurel place={i + 1} size={40} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
