import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor, Lesson } from '../lib/types';
import {
  courseAccessAdmin,
  courseEntry,
  manageCourseAccess,
  requestCourseAccess,
  cancelCourseRequest,
  requireCourse,
  groupedStudent,
  paidEntry,
  paidView,
  requirePaidCourse,
  MAIN_COURSE,
} from '../lib/server/course-access';
import { MAIN_COURSE_ID } from '../lib/course-access';
import { managePremium } from '../lib/server/premium';
import { legacyAccess } from '../lib/server/legacy-access';
import { resetSiteMemory, siteUpdate } from '../lib/server/site-content';

beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
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
const student = who('legacy_ali', 'student', 'university', { classId: 'AP-223' });
const email = who('uidEmail1');
const independent = who('legacy_mustaqil', 'student', 'independent', { uid: 'fbMustaqil' });
const now = Date.UTC(2026, 10, 14, 9, 0);
const lesson = { id: 'm1', courseId: 'c1', legacyFile: 'mavzu_1.html' } as unknown as Lesson;

it('only confirmed students with a group qualify for automatic course access', () => {
  expect(groupedStudent(student)).toBe(true);
  expect(groupedStudent({ ...student, classId: '  ' })).toBe(false);
  expect(groupedStudent({ ...student, classId: ' Mustaqil ' })).toBe(false);
  expect(groupedStudent({ ...independent, classId: 'AP-223' })).toBe(false);
});

it('grouped students and staff enter; other users need administrator approval', async () => {
  expect(await courseEntry(student)).toEqual({ ok: true, via: 'student' });
  expect(await courseEntry(who('tc', 'teacher'))).toEqual({ ok: true, via: 'staff' });
  expect(await courseEntry(admin)).toEqual({ ok: true, via: 'staff' });
  expect(await courseEntry(email)).toEqual({ ok: false, pending: null });
  expect(await courseEntry(independent)).toEqual({ ok: false, pending: null });
  await expect(requireCourse(email)).rejects.toMatchObject({ status: 403 });
  await expect(legacyAccess(email, lesson)).rejects.toMatchObject({ status: 403 });
  await expect(requireCourse(student)).resolves.toEqual(student);
  await expect(legacyAccess(student, lesson)).resolves.toBeUndefined();
});

it('a non-student asks for access, the administrator approves and can take it back', async () => {
  await expect(requestCourseAccess(email, { note: 'x'.repeat(301) }, now)).rejects.toThrow();
  expect(await requestCourseAccess(email, { note: 'Iqtisodiyot, 2-kurs' }, now)).toEqual({
    ok: false,
    pending: now,
  });
  expect(await courseEntry(email)).toEqual({ ok: false, pending: now });
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
  expect(await courseEntry(email)).toEqual({ ok: true, via: 'grant' });
  await expect(requireCourse(email)).resolves.toEqual(email);
  // ochiq bo'lgach yana so'rash — hech narsa yozilmaydi
  expect(await requestCourseAccess(email, {}, now)).toEqual({ ok: true, via: 'grant' });
  expect((await courseAccessAdmin(admin)).requests).toEqual([]);
  v = await manageCourseAccess(admin, { op: 'revoke', uid: email.id });
  expect(v.grants).toEqual([]);
  expect(await courseEntry(email)).toEqual({ ok: false, pending: null });
});

it('a declined or cancelled request disappears; unknown requests are refused', async () => {
  await requestCourseAccess(independent, {}, now);
  expect(await courseEntry(independent)).toMatchObject({ pending: now });
  expect(await cancelCourseRequest(independent)).toEqual({ ok: false, pending: null });
  expect((await courseAccessAdmin(admin)).requests).toEqual([]);
  await requestCourseAccess(independent, {}, now);
  const v = await manageCourseAccess(admin, { op: 'reject', uid: independent.id });
  expect(v.requests).toEqual([]);
  expect(v.grants).toEqual([]);
  expect(await courseEntry(independent)).toEqual({ ok: false, pending: null });
  await expect(
    manageCourseAccess(admin, { op: 'approve', uid: independent.id }),
  ).rejects.toMatchObject({ status: 404 });
});

it('Premium and the former public setting do not authorise a user without a group', async () => {
  await siteUpdate({ courseGate: { off: true, students: true } });
  await managePremium(admin, { op: 'grant', uid: email.id, name: email.name, days: 30 }, now);
  expect(await courseEntry(email)).toEqual({ ok: false, pending: null });
  await expect(requireCourse(email)).rejects.toMatchObject({ status: 403 });
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
  expect(await courseEntry(independent)).toEqual({ ok: true, via: 'grant' });
  // email bo'yicha qidiruv faqat jonli bazada — demo rejimida rad etiladi
  await expect(
    manageCourseAccess(admin, { op: 'grant', email: 'mustaqil@example.com' }, now),
  ).rejects.toMatchObject({ status: 409 });
});

it('a group claimed in a request needs approval even when self-enrolment was previously enabled', async () => {
  await siteUpdate({
    courseGate: { students: true },
    ['courseAccess/' + email.id]: {
      uid: email.id,
      name: email.name,
      group: 'AP-223',
      at: now,
      by: 'student',
    },
  });
  expect(await courseEntry(email)).toEqual({ ok: false, pending: null });
  expect((await courseAccessAdmin(admin)).grants).toEqual([]);
  await expect(requestCourseAccess(email, { group: '!' }, now)).rejects.toThrow();
  await expect(requestCourseAccess(email, { group: 'A' }, now)).rejects.toThrow();
  await expect(
    requestCourseAccess(email, { group: 'AP-223', course: 'restoran' }, now),
  ).rejects.toMatchObject({ status: 400 });
  expect(await requestCourseAccess(email, { group: ' AP-223 ' }, now)).toEqual({
    ok: false,
    pending: now,
    group: 'AP-223',
  });
  expect(await courseEntry(email)).toEqual({ ok: false, pending: now, group: 'AP-223' });
  let v = await courseAccessAdmin(admin);
  expect(v.requests).toEqual([
    {
      uid: 'uidEmail1',
      name: 'Dilnoza Karimova',
      email: 'uidEmail1@example.com',
      group: 'AP-223',
      at: now,
    },
  ]);
  v = await manageCourseAccess(admin, { op: 'approve', uid: email.id }, now + 1000);
  expect(v.grants[0]).toMatchObject({ uid: 'uidEmail1', group: 'AP-223', by: 'owner' });
  expect(await courseEntry(email)).toEqual({ ok: true, via: 'grant' });
});

/* 💳 Pullik kurs (restoran): hammaga ko'rinadi, darslarni faqat administrator va u ruxsat berganlar ochadi. */
it('a paid course opens only for the administrator and the participants he approves', async () => {
  const teacherA = who('tc', 'teacher', 'university');
  // administrator — doim; o'qituvchi va TerDU talabasi ham ruxsatsiz kirmaydi
  expect(await paidEntry(admin, 'restoran')).toEqual({ ok: true, via: 'staff' });
  expect(await paidEntry(teacherA, 'restoran')).toEqual({ ok: false, pending: null });
  expect(await paidEntry(student, 'restoran')).toEqual({ ok: false, pending: null });
  await expect(requirePaidCourse(student, 'restoran')).rejects.toMatchObject({ status: 403 });
  await expect(requirePaidCourse(admin, 'restoran')).resolves.toBeUndefined();
  // asosiy fanga berilgan ruxsat pullik kursni ochmaydi (har kurs alohida)
  await requestCourseAccess(email, {}, now);
  await manageCourseAccess(admin, { op: 'approve', uid: email.id }, now);
  expect(await paidEntry(email, 'restoran')).toEqual({ ok: false, pending: null });

  // so'rov → administrator kurs bo'yicha ko'radi va tasdiqlaydi
  expect(
    await requestCourseAccess(email, { course: 'restoran', note: 'Oshxona, ofitsiant' }, now),
  ).toEqual({ ok: false, pending: now });
  let v = await courseAccessAdmin(admin, 'restoran');
  expect(v).toMatchObject({ course: 'restoran', paid: true });
  expect(v.courses.map((c) => c.id)).toEqual(['tad-asoslari', 'restoran']);
  expect(v.requests).toEqual([
    expect.objectContaining({ uid: email.id, note: 'Oshxona, ofitsiant' }),
  ]);
  // asosiy fan ro'yxatiga aralashmaydi
  expect((await courseAccessAdmin(admin)).requests).toEqual([]);
  v = await manageCourseAccess(admin, { op: 'approve', uid: email.id, course: 'restoran' }, now);
  expect(v.requests).toEqual([]);
  expect(v.grants.map((g) => g.uid)).toEqual([email.id]);
  expect(await paidEntry(email, 'restoran')).toEqual({ ok: true, via: 'grant' });
  await expect(requirePaidCourse(email, 'restoran')).resolves.toBeUndefined();

  // TerDU talabasiga to'g'ridan-to'g'ri ruxsat, keyin olib qo'yish
  v = await manageCourseAccess(
    admin,
    { op: 'grantUser', uid: student.id, name: 'Ali Valiyev', course: 'restoran' },
    now,
  );
  expect(await paidEntry(student, 'restoran')).toEqual({ ok: true, via: 'grant' });
  v = await manageCourseAccess(admin, { op: 'revoke', uid: student.id, course: 'restoran' });
  expect(v.grants.map((g) => g.uid)).toEqual([email.id]);
  expect(await paidEntry(student, 'restoran')).toEqual({ ok: false, pending: null });

  // narx va to'lov yo'riqnomasi — hammaga (mehmonga ham) ko'rinadi
  v = await manageCourseAccess(admin, {
    op: 'shop',
    course: 'restoran',
    price: '450 000 so‘m',
    how: 'Click orqali',
  });
  expect(v.shop).toEqual({ price: '450 000 so‘m', how: 'Click orqali' });
  expect((await paidView()).restoran).toEqual({
    ok: false,
    pending: null,
    price: '450 000 so‘m',
    how: 'Click orqali',
  });
  expect((await paidView(email)).restoran).toMatchObject({ ok: true, via: 'grant' });
  // noma'lum kurs va faqat administrator
  await expect(courseAccessAdmin(admin, 'yoq')).rejects.toMatchObject({ status: 404 });
  await expect(
    manageCourseAccess(teacherA, { op: 'revoke', uid: email.id, course: 'restoran' }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    manageCourseAccess(admin, { op: 'shop', course: 'tad-asoslari', price: '1', how: '' }),
  ).rejects.toMatchObject({ status: 400 });
});

it('the client constant for the main course matches the catalog', () => {
  expect(MAIN_COURSE_ID).toBe(MAIN_COURSE);
});
