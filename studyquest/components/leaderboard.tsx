'use client';
import { useMemo, useState } from 'react';
import { CalendarDays, Trophy, Users } from 'lucide-react';
import { useApp } from './provider';
import {
  AvatarFigure,
  AvatarPicker,
  avatarName,
  useAcademicBoard,
  type BoardEntry,
} from './avatars';
import { num, tr } from '@/lib/points';

type Entry = BoardEntry;
type Period = 'day' | 'all';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
/** Har talabaga ismidan barqaror rang. */
const hue = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
};
/** Ismning bosh harflari rangli doira ichida (arenadagi onlayn ro'yxatda ishlatiladi). */
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
/** Avatar o'rni: talaba tanlagan qahramon yoki rangsiz soya. O'z qatorida bosilsa — avatarlar kutubxonasi. */
function AvatarSlot({ id, label, onOpen }: { id?: string; label: string; onOpen?: () => void }) {
  if (onOpen)
    return (
      <button type="button" className="rk-slot is-mine" onClick={onOpen} aria-label={label}>
        <AvatarFigure id={id} />
      </button>
    );
  return (
    <span className="rk-slot" title={label || undefined}>
      <AvatarFigure id={id} />
    </span>
  );
}

export function Leaderboard({ embedded = false }: { embedded?: boolean }) {
  const { data, lang } = useApp(),
    L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const board = useAcademicBoard(),
    { rows, loading, error } = board;
  const [period, setPeriod] = useState<Period>('all'),
    [group, setGroup] = useState(''),
    [picking, setPicking] = useState(false);
  const myId = data?.user?.id,
    myGroup = data?.user?.classId || '';
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
  const groups = Array.from(new Set(rows.map((r) => r.classId).filter(Boolean))).sort((a, b) =>
    a === myGroup ? -1 : b === myGroup ? 1 : a.localeCompare(b),
  );
  const myIndex = visible.findIndex((r) => r.id === myId);
  const mine = myIndex >= 0 ? visible[myIndex] : null;
  const ahead = myIndex > 0 ? visible[myIndex - 1] : null;
  const amStudent = data?.user?.role === 'student' && rows.some((r) => r.id === myId);
  const unit = L('ball', 'pts', 'б.');
  const tabs: [Period, typeof Trophy, string][] = [
    ['day', CalendarDays, L('Kunlik', 'Today', 'За день')],
    ['all', Trophy, L('Umumiy', 'Overall', 'Общий')],
  ];
  return (
    <div className={'rk-page' + (embedded ? ' is-embedded' : '')}>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{L('BIRGA O‘SAMIZ', 'GROW TOGETHER', 'РАСТЁМ ВМЕСТЕ')}</span>
          {embedded ? (
            <h2 className="rk-title">{L('Reyting', 'Leaderboard', 'Рейтинг')}</h2>
          ) : (
            <h1>{L('Reyting', 'Leaderboard', 'Рейтинг')}</h1>
          )}
          <p>
            {L(
              'Ball faqat taqdimotlardan (har mavzu 100 ball) va o‘qituvchi beradigan qo‘shimcha topshiriqlardan to‘planadi.',
              'Points come only from presentations (100 per topic) and extra tasks from the teacher.',
              'Баллы — только за презентации (100 за тему) и дополнительные задания преподавателя.',
            )}
          </p>
        </div>
      </div>

      {amStudent && !loading && !error && (
        <section className="rk-mine" aria-label={L('Mening natijam', 'My result', 'Мой результат')}>
          <button
            type="button"
            className={'rk-mine-avatar' + (board.avatars.me?.avatar ? ' has' : '')}
            onClick={() => setPicking(true)}
            aria-label={L('Avatarlar kutubxonasi', 'Avatar library', 'Библиотека аватаров')}
          >
            <AvatarFigure id={board.avatars.me?.avatar} />
          </button>
          <div className="rk-mine-place">
            <small>{L('O‘rningiz', 'Your place', 'Ваше место')}</small>
            <b>{mine ? myIndex + 1 : '—'}</b>
            {mine && (
              <span>
                / {visible.length} {L('talaba', 'students', 'студ.')}
              </span>
            )}
          </div>
          <div className="rk-mine-score">
            <small>
              {period === 'day'
                ? L('Bugungi ballingiz', 'Today’s points', 'Баллы за сегодня')
                : L('Umumiy ballingiz', 'Your points', 'Ваши баллы')}
            </small>
            <b>
              {num(mine ? score(mine) : 0)} <span>{unit}</span>
            </b>
          </div>
          <p className="rk-mine-note">
            {!mine
              ? period === 'day'
                ? L(
                    'Bugun hali ball olmadingiz — taqdimotni oching va kunlik reytingga kiring.',
                    'No points today yet — open a presentation to enter today’s ranking.',
                    'Сегодня баллов пока нет — откройте презентацию, чтобы попасть в рейтинг дня.',
                  )
                : L(
                    'Bu guruhda siz yo‘qsiz — «Hammasi» ni tanlang.',
                    'You are not in this group — choose “All”.',
                    'Вас нет в этой группе — выберите «Все».',
                  )
              : ahead && score(ahead) > score(mine)
                ? L(
                    `${myIndex}-o‘ringacha ${num(score(ahead) - score(mine))} ball qoldi`,
                    `${num(score(ahead) - score(mine))} pts to place ${myIndex}`,
                    `До ${myIndex}-го места: ${num(score(ahead) - score(mine))} б.`,
                  )
                : ahead
                  ? L(
                      `${myIndex}-o‘rin bilan ballingiz teng — bitta topshiriq yetarli!`,
                      `Tied with place ${myIndex} — one more task is enough!`,
                      `Поровну с ${myIndex}-м местом — хватит одного задания!`,
                    )
                  : L('Siz birinchisiz! 🎉', 'You are first! 🎉', 'Вы на первом месте! 🎉')}
          </p>
        </section>
      )}

      <section className="panel rk-panel">
        <div className="rk-controls">
          <div
            className="rk-tabs"
            role="tablist"
            aria-label={L('Reyting turi', 'Ranking type', 'Тип рейтинга')}
          >
            {tabs.map(([id, Icon, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={period === id}
                className={period === id ? 'on' : ''}
                onClick={() => setPeriod(id)}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          {groups.length > 1 && (
            <div className="rk-groups" role="group" aria-label={L('Guruh', 'Group', 'Группа')}>
              {['', ...groups].map((g) => (
                <button
                  key={g || 'all'}
                  aria-pressed={group === g}
                  className={group === g ? 'on' : ''}
                  onClick={() => setGroup(g)}
                >
                  {g === myGroup && g ? <Users size={13} aria-hidden="true" /> : null}
                  {g || L('Hammasi', 'All', 'Все')}
                </button>
              ))}
            </div>
          )}
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
          <ol className="ranking-list rk-list">
            {visible.map((r, i) => (
              <li
                key={r.id}
                className={
                  'rk-row ' + (i < 10 ? 'rk-c' + (i + 1) : 'plain') + (r.id === myId ? ' me' : '')
                }
                aria-current={r.id === myId ? 'true' : undefined}
              >
                <span className="rk-rank">{i + 1}</span>
                <span className="rk-who">
                  <b>
                    <span className="rk-name">{r.name}</span>
                    {r.id === myId && <em>{L('Siz', 'You', 'Вы')}</em>}
                  </b>
                  <small>{r.classId}</small>
                </span>
                <span className="rk-score">
                  {num(score(r))} <small>{unit}</small>
                </span>
                <AvatarSlot
                  id={r.avatar}
                  label={
                    r.id === myId
                      ? L('Avatarlar kutubxonasi', 'Avatar library', 'Библиотека аватаров')
                      : r.avatar
                        ? avatarName(r.avatar, lang)
                        : ''
                  }
                  onOpen={r.id === myId && amStudent ? () => setPicking(true) : undefined}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
      {picking && <AvatarPicker board={board} onClose={() => setPicking(false)} />}
    </div>
  );
}
