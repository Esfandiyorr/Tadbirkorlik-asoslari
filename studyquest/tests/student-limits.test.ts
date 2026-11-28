import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import {
  closedFeatures,
  groupLimitKey,
  limitLessonAccess,
  READ_ONLY,
  type LimitStore,
} from '../lib/student-limits';
import { closedFor, manageLimits, readLimits, requireFeature } from '../lib/server/student-limits';
import { studentsHubView } from '../lib/server/students-hub';
import { grantPremium } from '../lib/server/premium';
import { resetSiteMemory } from '../lib/server/site-content';

/* 🎚 «Talabalar bilan ishlash» → «Bo'limlar»: guruh va talaba bo'yicha yopilgan bo'limlar. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const who = (id: string, role = 'student', classId = 'AP-223') =>
  ({
    id,
    uid: id,
    role,
    name: 'Ali Valiyev',
    classId,
    learnerType: 'university',
  }) as unknown as Actor;
const admin = who('owner', 'admin', '');
const teacher = who('teach', 'teacher', '');
const ali = who('legacy_ali');
const vali = who('legacy_vali');
const other = who('legacy_sardor', 'student', 'FIZ-123');

it('a student rule wins over the group rule; lessons closed also closes tests', () => {
  const store: LimitStore = {
    g: { 'AP-223': { f: { arena: false, live: false }, at: 1, by: 'x' } },
    u: { legacy_vali: { f: { arena: true }, at: 1, by: 'x' } },
  };
  expect(closedFeatures(store, 'legacy_ali', 'AP-223')).toEqual(['arena', 'live']);
  expect(closedFeatures(store, 'legacy_vali', 'AP-223')).toEqual(['live']);
  expect(closedFeatures(store, 'legacy_sardor', 'FIZ-123')).toEqual([]);
  expect(closedFeatures({ u: { x: { f: { lessons: false }, at: 1, by: '' } } }, 'x', '')).toEqual([
    'lessons',
    'tests',
  ]);
  expect(groupLimitKey(' AP  223.1 ')).toBe('AP 223_1');
});

it('“reading only” keeps the presentations and turns scored topics into reading mode', () => {
  const closed = closedFeatures({ g: { g1: { f: READ_ONLY, at: 1, by: '' } } }, 's', 'g1');
  expect(closed).not.toContain('lessons');
  expect(closed).toEqual(expect.arrayContaining(['tests', 'arena', 'live', 'premium', 'chat']));
  const access = { m1: { state: 'score', due: 5 }, m2: { state: 'read' }, m3: { state: 'locked' } };
  expect(limitLessonAccess(access, closed)).toEqual({
    m1: { state: 'read' },
    m2: { state: 'read' },
    m3: { state: 'locked' },
  });
  expect(limitLessonAccess(access, ['lessons', 'tests'])).toEqual({
    m1: { state: 'locked' },
    m2: { state: 'locked' },
    m3: { state: 'locked' },
  });
  expect(limitLessonAccess(access, ['arena'])).toBe(access);
});

it('staff save group and student rules; the server refuses closed sections', async () => {
  await expect(
    manageLimits(ali, { op: 'set', scope: 'g', key: 'AP-223', f: { arena: false } }),
  ).rejects.toMatchObject({ status: 403 });
  await manageLimits(teacher, {
    op: 'set',
    scope: 'g',
    key: 'AP-223',
    group: 'AP-223',
    f: { ...READ_ONLY },
  });
  await manageLimits(admin, {
    op: 'set',
    scope: 'u',
    key: 'legacy_vali',
    name: 'Vali',
    f: { tests: true, live: true },
  });
  const store = await readLimits(true);
  // guruh qoidasida faqat yopilganlar saqlanadi
  expect(store.g?.['AP-223']?.f.lessons).toBeUndefined();
  expect(store.g?.['AP-223']?.f.arena).toBe(false);
  expect(await closedFor(ali)).toEqual(expect.arrayContaining(['tests', 'live', 'premium']));
  expect(await closedFor(vali)).not.toContain('live');
  expect(await closedFor(vali)).not.toContain('tests');
  expect(await closedFor(other)).toEqual([]);
  // xodimlarga hech narsa yopilmaydi
  expect(await closedFor(who('teach2', 'teacher', 'AP-223'))).toEqual([]);
  await expect(requireFeature(ali, 'live')).rejects.toMatchObject({ status: 403 });
  await expect(requireFeature(ali, 'lessons')).resolves.toBeUndefined();
  await expect(requireFeature(vali, 'live')).resolves.toBeUndefined();
  await expect(
    manageLimits(admin, { op: 'set', scope: 'g', key: 'AP-223', f: { nope: false } }),
  ).rejects.toMatchObject({ status: 400 });
  // olib tashlash — hammasi yana ochiq
  await manageLimits(admin, { op: 'clear', scope: 'g', key: 'AP-223' });
  expect(await closedFor(ali)).toEqual([]);
  // hammasi ochiq qoida saqlanmaydi
  await manageLimits(admin, { op: 'set', scope: 'g', key: 'AP-223', f: { arena: true } });
  expect((await readLimits(true)).g?.['AP-223']).toBeUndefined();
});

it('the hub shows teachers students and rules, and administrators Premium and access too', async () => {
  const roster = [
    { id: 'legacy_ali', legacyId: 'ali', name: 'Ali Valiyev', classId: 'AP-223' },
    { id: 'legacy_vali', legacyId: 'vali', name: 'Vali Karimov', classId: 'AP-223' },
  ];
  await grantPremium('legacy_ali', 'Ali Valiyev', 'AP-223', 30, 'test');
  await grantPremium('google_zz', 'Zarina', '', 30, 'test');
  await manageLimits(admin, { op: 'set', scope: 'g', key: 'AP-223', f: { chat: false } });
  const t = await studentsHubView(teacher, roster);
  expect(t.admin).toBe(false);
  expect(t.premium).toBeUndefined();
  expect(t.students.map((s) => s.id)).toEqual(['legacy_ali', 'legacy_vali']);
  expect(t.limits.g?.['AP-223']?.f.chat).toBe(false);
  const a = await studentsHubView(admin, roster);
  expect(a.admin).toBe(true);
  expect(a.premium?.legacy_ali?.until).toBeGreaterThan(Date.now());
  expect(a.premium?.legacy_vali).toBeUndefined();
  // asl bazada yo'q obunachi ham ro'yxatda
  expect(a.students.find((s) => s.id === 'google_zz')).toMatchObject({ other: true });
  expect(a.courses?.length).toBeGreaterThan(0);
  await expect(studentsHubView(ali, roster)).rejects.toMatchObject({ status: 403 });
});
