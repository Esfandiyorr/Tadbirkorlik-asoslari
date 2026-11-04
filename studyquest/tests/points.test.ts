import { it, expect } from 'vitest';
import { topicPoints, pointHints, dueText, num, courseTotals } from '../lib/points';
import { lessonAccessStates } from '../lib/server/legacy-access';
import { academicRecord } from '../lib/server/academic';
import type { Data, ReadingHistory } from '../lib/types';

const history = (over: Partial<ReadingHistory> = {}): ReadingHistory => ({
  seenSlides: 9,
  totalSlides: 18,
  lastSlide: 0,
  seconds: 1800,
  correctAnswers: 6,
  quizTotal: 15,
  score: undefined,
  grade: 0,
  status: 'started',
  parts: { slides: 15, time: 10, test: 20 },
  ...over,
});

it('a topic is worth 100: 30 slides + 20 reading time + 50 test', () => {
  const p = topicPoints(history());
  expect(p).toMatchObject({ slides: 15, time: 10, test: 20, total: 45, remaining: 55 });
  // The original platform score wins when it exists (it already includes all three parts).
  expect(topicPoints(history({ score: 74.2 })).total).toBe(74.2);
  expect(topicPoints(undefined)).toMatchObject({ total: 0, remaining: 100 });
});

it('hints say exactly what is left and how many points each step gives', () => {
  const hints = pointHints(history(), 'uz');
  expect(hints.map((h) => h.key)).toEqual(['slides', 'time', 'test']);
  expect(hints[0]).toMatchObject({ text: 'Yana 9 ta slaydni oching', points: 15 });
  expect(hints[1]).toMatchObject({ text: 'Yana 30 daqiqa o‘qing', points: 10 });
  expect(hints[2]).toMatchObject({ text: 'Testda yana 9 ta to‘g‘ri javob', points: 30 });
  const full = history({
    seenSlides: 18,
    seconds: 3600,
    correctAnswers: 15,
    parts: { slides: 30, time: 20, test: 50 },
  });
  expect(pointHints(full, 'uz')).toEqual([]);
});

it('academic records split the original 30/20/50 score into its parts', () => {
  const r = academicRecord('alice', {
    name: 'Ali',
    surname: 'Valiyev',
    status: 'ok',
    topics: { m1: { p: 75, b: 4, s: 12, t: 3000, q: 8 } },
  } as never);
  const m1 = r.readingHistory!.m1;
  expect(m1.parts!.slides).toBeGreaterThan(0);
  expect(m1.parts!.slides).toBeLessThanOrEqual(30);
  expect(m1.parts!.time).toBeLessThanOrEqual(20);
  expect(m1.parts!.test).toBeLessThanOrEqual(50);
  expect(m1.score).toBe(75);
});

it('deadlines are shown in Tashkent time with the days left', () => {
  const now = Date.UTC(2026, 10, 4, 7, 0); // 4-noyabr 12:00 (UTC+5)
  const due = Date.UTC(2026, 10, 8, 18, 59); // 8-noyabr 23:59 (UTC+5)
  const d = dueText(due, 'uz', now);
  expect(d.date).toBe('8-noyabr, 23:59');
  expect(d.left).toBe('4 kun qoldi');
  expect(d.urgent).toBe(false);
  expect(dueText(due, 'uz', due - 3 * 3600000)).toMatchObject({
    left: '3 soat qoldi',
    urgent: true,
  });
  expect(dueText(due, 'uz', due + 1).left).toBe('muddat tugadi');
  expect(num(74.25)).toBe('74,3');
  expect(num(40)).toBe('40');
});

it('topic access follows the original weekly rules: score until Sunday, then reading mode', () => {
  const now = Date.UTC(2026, 10, 4, 7, 0);
  const access = lessonAccessStates(
    { m8: { lim: true, g: { 'AP-223': now - 86400000 }, s: {}, at: 0 } },
    { id: 'alice', group: 'AP-223', independent: false },
    now,
  );
  expect(access.m8.state).toBe('score');
  expect(access.m8.due).toBeGreaterThan(now);
  expect(access.m9.state).toBe('locked');
  const other = lessonAccessStates(
    { m8: { lim: true, g: { 'AP-223': now - 86400000 }, s: {}, at: 0 } },
    { id: 'bob', group: 'BX-101', independent: false },
    now,
  );
  expect(other.m8.state).not.toBe('score');
});

it('course totals add up the topic points', () => {
  const d = {
    lessons: [{ id: 'm1' }, { id: 'm2' }],
    user: {
      readingHistory: {
        m1: history({
          score: 100,
          status: 'read',
          seconds: 3600,
          parts: { slides: 30, time: 20, test: 50 },
        }),
        m2: history({ score: 40 }),
      },
    },
  } as unknown as Data;
  const t = courseTotals(d);
  expect(t).toMatchObject({ points: 140, max: 200, read: 1, started: 2, perfect: 1, fullTest: 1 });
});
