'use client';
import { Lock, BookOpen, Clock3 } from 'lucide-react';
import type { Lang, LessonAccess, ReadingHistory } from '@/lib/types';
import { dueText, num, pointHints, topicPoints, tr } from '@/lib/points';

/** 🟢 Ball beriladi (muddat bilan) · 📖 O'qish rejimi · 🔒 Yopiq */
export function AccessChip({ access, lang }: { access?: LessonAccess; lang: Lang }) {
  if (!access) return null;
  if (access.state === 'locked')
    return (
      <span className="access-chip locked">
        <Lock size={13} />
        {tr(lang, 'Hali yopiq', 'Not open yet', 'Пока закрыта')}
      </span>
    );
  if (access.state === 'read')
    return (
      <span className="access-chip read">
        <BookOpen size={13} />
        {tr(lang, 'O‘qish rejimi', 'Reading mode', 'Режим чтения')}
      </span>
    );
  const due = access.due ? dueText(access.due, lang) : null;
  return (
    <span className={'access-chip score' + (due?.urgent ? ' urgent' : '')}>
      <span className="live-dot" />
      {tr(lang, 'Ball beriladi', 'Earning points', 'Начисляются баллы')}
      {due && (
        <>
          {' · '}
          <Clock3 size={13} />
          {due.left}
        </>
      )}
    </span>
  );
}

/** Mavzu bali: halqa (jami/100) */
export function PointsRing({
  value,
  size = 64,
  label,
  unit = '/100',
}: {
  value: number;
  size?: number;
  label?: string;
  unit?: string;
}) {
  const r = 26,
    c = 2 * Math.PI * r,
    pct = Math.max(0, Math.min(100, value)) / 100;
  const color =
    value >= 90 ? '#16a34a' : value >= 60 ? '#7c3aed' : value > 0 ? '#ea8a0c' : '#c9c6d6';
  return (
    <div
      className="points-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--soft-violet)" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span>
        <b>{num(Math.round(value * 10) / 10)}</b>
        <small>{unit}</small>
      </span>
    </div>
  );
}

/** Qismlar: slaydlar 30, vaqt 20, test 50 (8-mavzuda test 25 + 🎨 logotip 25) — har biri o'z rangida */
export function PointsBreakdown({
  history,
  lang,
  hints = false,
}: {
  history?: ReadingHistory;
  lang: Lang;
  hints?: boolean;
}) {
  const p = topicPoints(history),
    rows = [
      {
        key: 'slides',
        label: tr(lang, 'Slaydlar', 'Slides', 'Слайды'),
        value: p.slides,
        max: 30,
        emoji: '📑',
      },
      {
        key: 'time',
        label: tr(lang, 'O‘qish vaqti', 'Reading time', 'Время чтения'),
        value: p.time,
        max: 20,
        emoji: '⏱️',
      },
      {
        key: 'test',
        label: tr(lang, 'Test', 'Test', 'Тест'),
        value: p.test,
        max: history?.testMax ?? 50,
        emoji: '🧪',
      },
      ...(history?.taskMax
        ? [
            {
              key: 'task',
              label: tr(lang, 'Logotip (o‘qituvchi)', 'Logo (teacher)', 'Логотип (преподаватель)'),
              value: p.task || 0,
              max: history.taskMax,
              emoji: '🎨',
            },
          ]
        : []),
    ],
    tips = hints ? pointHints(history, lang) : [];
  return (
    <div className="points-breakdown">
      {rows.map((r) => (
        <div className={'pb-row ' + r.key} key={r.key}>
          <span className="pb-label">
            <span className="pb-emoji">{r.emoji}</span>
            {r.label}
          </span>
          <span className="pb-bar">
            <i style={{ width: (r.value / r.max) * 100 + '%' }} />
          </span>
          <b>
            {num(r.value)}
            <small>/{r.max}</small>
          </b>
        </div>
      ))}
      {hints &&
        (tips.length ? (
          <ul className="pb-hints">
            {tips.map((t) => (
              <li key={t.key}>
                <span>{t.text}</span>
                <b>+{num(t.points)}</b>
              </li>
            ))}
          </ul>
        ) : history ? (
          <p className="pb-done">
            🎉{' '}
            {tr(
              lang,
              'Bu mavzudan to‘liq 100 ball oldingiz!',
              'You earned the full 100 points!',
              'Вы получили все 100 баллов!',
            )}
          </p>
        ) : null)}
    </div>
  );
}
