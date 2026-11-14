import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor, Lesson } from '../lib/types';
import {
  courseAccessAdmin,
  courseEntry,
  forgetCourseGate,
  manageCourseAccess,
  requestCourseAccess,
  cancelCourseRequest,
  requireCourse,
  terduStudent,
} from '../lib/server/course-access';
import { managePremium } from '../lib/server/premium';
import { legacyAccess } from '../lib/server/legacy-access';
import { resetSiteMemory } from '../lib/server/site-content';

/* 🔑 Kursga kirish: TerDU talabalari — avvalgidek; talaba bo'lmaganlar — faqat 💎 obuna yoki administrator ruxsati. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  resetSiteMemory();
  forgetCourseGate();
});
const who = (
  id: string,
  role = 'student',
  learnerType: Actor['learnerType'] = 'independent',
  extra: Partial<Actor> = {},
) =>
  ({
    id,
    uid: id,
    role,
    name: 'Dilnoza Karimova',
    email: id + '@example.com',
    classId: '',
    learnerType,
    ...extra,
  }) as unknown as Actor;
const admin = who('owner', 'admin', 'university');
const student = who('legacy_ali', 'student', 'university');
const email = who('uidEmail1');
const independent = who('legacy_mustaqil', 'student', 'independent', { uid: 'fbMustaqil' });
const now = Date.UTC(2026, 10, 14, 9, 0);
const lesson = { id: 'm1', courseId: 'c1', legacyFile: 'mavzu_1.html' } as unknown as Lesson;

it('only teacher-approved TerDU student accounts count as students', () => {
  expect(terduStudent(student)).toBe(true);
  expect(terduStudent(who('demo-student', 'student', 'university'))).toBe(true);
  expect(terduStudent(independent)).toBe(false);
  // email bilan ro'yxatdan o'tgan hisobda «university» yozuvi bo'lsa ham — talaba hisoblanmaydi
  expect(terduStudent(who('uidEmail2', 'student', 'university'))).toBe(false);
});

it('students and staff always enter; everyone else needs Premium or permission', async () => {
  expect(await courseEntry(student, now)).toEqual({ ok: true, via: 'student' });
  expect(await courseEntry(who('tc', 'teacher'), now)).toEqual({ ok: true, via: 'staff' });
  expect(await courseEntry(admin, now)).toEqual({ ok: true, via: 'staff' });
  expect(await courseEntry(email, now)).toEqual({ ok: false, pending: null });
  expect(await courseEntry(independent, now)).toEqual({ ok: false, pending: null });
  await expect(requireCourse(email)).rejects.toMatchObject({ status: 403 });
  await expect(legacyAccess(email, lesson)).rejects.toMatchObject({ status: 403 });
  await expect(requireCourse(student)).resolves.toBeUndefined();
  await expect(legacyAccess(student, lesson)).resolves.toBeUndefined();
});

it('a non-student asks for access, the administrator approves and can take it back', async () => {
  await expect(requestCourseAccess(email, { note: 'x'.repeat(301) }, now)).rejects.toThrow();
  expect(await requestCourseAccess(email, { note: 'Iqtisodiyot, 2-kurs' }, now)).toEqual({
    ok: false,
    pending: now,
  });
  expect(await courseEntry(email, now)).toEqual({ ok: false, pending: now });
  // faqat administrator ko'radi va boshqaradi
  await expect(courseAccessAdmin(email)).rejects.toMatchObject({ status: 403 });
  await expect(manageCourseAccess(email, { op: 'approve', uid: email.id })).rejects.toMatchObject({
    status: 403,
  });
  let v = await courseAccessAdmin(admin);
  expect(v.requests).toEqual([
    {
      uid: 'uidEmail1',
      name: 'Dilnoza Karimova',
      email: 'uidEmail1@example.com',
      at: now,
      note: 'Iqtisodiyot, 2-kurs',
    },
  ]);
  v = await manageCourseAccess(admin, { op: 'approve', uid: email.id }, now + 1000);
  expect(v.requests).toEqual([]);
  expect(v.grants).toEqual([
    {
      uid: 'uidEmail1',
      name: 'Dilnoza Karimova',
      email: 'uidEmail1@example.com',
      at: now + 1000,
      by: 'owner',
    },
  ]);
  expect(await courseEntry(email, now)).toEqual({ ok: true, via: 'grant' });
  await expect(requireCourse(email)).resolves.toBeUndefined();
  // ochiq bo'lgach yana so'rash — hech narsa yozilmaydi
  expect(await requestCourseAccess(email, {}, now)).toEqual({ ok: true, via: 'grant' });
  expect((await courseAccessAdmin(admin)).requests).toEqual([]);
  v = await manageCourseAccess(admin, { op: 'revoke', uid: email.id });
  expect(v.grants).toEqual([]);
  expect(await courseEntry(email, now)).toEqual({ ok: false, pending: null });
});

it('a declined or cancelled request disappears; unknown requests are refused', async () => {
  await requestCourseAccess(independent, {}, now);
  expect(await courseEntry(independent, now)).toMatchObject({ pending: now });
  expect(await cancelCourseRequest(independent)).toEqual({ ok: false, pending: null });
  expect((await courseAccessAdmin(admin)).requests).toEqual([]);
  await requestCourseAccess(independent, {}, now);
  const v = await manageCourseAccess(admin, { op: 'reject', uid: independent.id });
  expect(v.requests).toEqual([]);
  expect(v.grants).toEqual([]);
  expect(await courseEntry(independent, now)).toEqual({ ok: false, pending: null });
  await expect(
    manageCourseAccess(admin, { op: 'approve', uid: independent.id }),
  ).rejects.toMatchObject({ status: 404 });
});

it('Premium opens the course while it lasts', async () => {
  await managePremium(admin, { op: 'grant', uid: email.id, name: email.name, days: 30 }, now);
  expect(await courseEntry(email, now)).toEqual({
    ok: true,
    via: 'premium',
    until: now + 30 * 86400000,
  });
  expect(await courseEntry(email, now + 31 * 86400000)).toEqual({ ok: false, pending: null });
});

it('access given by email reaches the sign-in account, also behind a student-section id', async () => {
  const find = async (e: string) =>
    e === 'mustaqil@example.com'
      ? { uid: 'fbMustaqil', name: 'Mustaqil', email: 'mustaqil@example.com' }
      : null;
  await expect(
    manageCourseAccess(admin, { op: 'grant', email: 'yoq@example.com' }, now, find),
  ).rejects.toMatchObject({ status: 404 });
  await expect(
    manageCourseAccess(admin, { op: 'grant', email: 'not-an-email' }, now, find),
  ).rejects.toThrow();
  const v = await manageCourseAccess(
    admin,
    { op: 'grant', email: ' Mustaqil@Example.com ' },
    now,
    find,
  );
  expect(v.grants[0]).toMatchObject({ uid: 'fbMustaqil', email: 'mustaqil@example.com' });
  // asl hisob id si legacy_mustaqil, kirish hisobi (uid) — fbMustaqil
  expect(await courseEntry(independent, now)).toEqual({ ok: true, via: 'grant' });
  // email bo'yicha qidiruv faqat jonli bazada — demo rejimida rad etiladi
  await expect(
    manageCourseAccess(admin, { op: 'grant', email: 'mustaqil@example.com' }, now),
  ).rejects.toMatchObject({ status: 409 });
});

it('the administrator can open the course to everyone for a while', async () => {
  let v = await manageCourseAccess(admin, { op: 'gate', off: true });
  expect(v.gate).toEqual({ off: true });
  expect(await courseEntry(email, now)).toEqual({ ok: true, via: 'open' });
  v = await manageCourseAccess(admin, { op: 'gate', off: false });
  expect(v.gate).toEqual({ off: false });
  expect(await courseEntry(email, now)).toEqual({ ok: false, pending: null });
});
