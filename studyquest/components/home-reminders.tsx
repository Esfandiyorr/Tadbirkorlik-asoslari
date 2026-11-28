'use client';
import { useEffect, useState } from 'react';
import { Bell, ClipboardCheck, Flag, Keyboard, Radio } from 'lucide-react';
import { tr } from '@/lib/points';
import { REMINDER_ROTATE_MS } from '@/lib/reminders';
import type { Lang } from '@/lib/types';

/* 🔔 Bosh sahifa bannerdagi «Eslatmalar»: bir vaqtda bitta eslatma, har REMINDER_ROTATE_MS da keyingisi
   (sichqoncha ustida yoki fokusda — to'xtaydi; nuqtalar bilan tanlash mumkin). */

export type ReminderCard = {
  key: string;
  at: number;
  kind: 'topic' | 'quiz' | 'yz' | 'race' | 'note';
  title: string;
  /** «23:59 gacha» yoki «15:00 da» (administrator eslatmasida bo'lmaydi) */
  when?: string;
  go?: () => void;
};
const ICON = { topic: ClipboardCheck, quiz: Radio, yz: Keyboard, race: Flag, note: Bell } as const;

/** Administrator eslatmasidagi havola: «#bo'lim», «/sahifa» yoki https:// (yangi oynada). */
export function followLink(link: string) {
  if (link.startsWith('#')) location.hash = link.slice(1);
  else if (link.startsWith('/')) location.href = link;
  else window.open(link, '_blank', 'noopener,noreferrer');
}

export function HomeReminders({ items, lang }: { items: ReminderCard[]; lang: Lang }) {
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false);
  const n = items.length,
    current = n ? index % n : 0;
  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), REMINDER_ROTATE_MS);
    return () => clearInterval(t);
  }, [n, paused]);
  return (
    <div
      className="hb-plans hb-reminders"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <h2>
        {tr(lang, 'Eslatmalar', 'Reminders', 'Напоминания')}
        {n > 1 && (
          <span className="hb-count">
            {current + 1}/{n}
          </span>
        )}
      </h2>
      {n ? (
        <ul>
          {items.map((p, j) => {
            const Icon = ICON[p.kind];
            const body = (
              <>
                <Icon size={16} aria-hidden="true" />
                <span className="hb-plan-title">{p.title}</span>
                {p.when && <em>{p.when}</em>}
              </>
            );
            return (
              <li key={p.key} hidden={j !== current} className={j === current ? 'is-on' : ''}>
                {p.go ? (
                  <button type="button" onClick={p.go}>
                    {body}
                  </button>
                ) : (
                  <div className="hb-note">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hb-empty">
          {tr(lang, 'Hozircha eslatma yo‘q', 'No reminders yet', 'Пока нет напоминаний')}
        </p>
      )}
      {n > 1 && (
        <div
          className="hb-dots"
          role="group"
          aria-label={tr(lang, 'Eslatmalar', 'Reminders', 'Напоминания')}
        >
          {items.map((p, j) => (
            <button
              key={p.key}
              type="button"
              aria-label={tr(lang, `${j + 1}-eslatma`, `Reminder ${j + 1}`, `Напоминание ${j + 1}`)}
              aria-current={j === current ? 'true' : undefined}
              onClick={() => setIndex(j)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
