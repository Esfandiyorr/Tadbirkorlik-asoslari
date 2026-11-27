import { beforeEach, expect, it, vi } from 'vitest';
import { BUILTIN_AVATARS } from '../lib/avatars';
import type { Actor } from '../lib/types';
import { orderAvatar, readAvatars } from '../lib/server/avatars';
import {
  cancelCourseRequest,
  courseEntry,
  courseReceipt,
  MAIN_COURSE,
  manageCourseAccess,
  paidEntry,
  requestCourseAccess,
  requireCourse,
  requirePaidCourse,
  submitCoursePayment,
} from '../lib/server/course-access';
import { decidePayment, paymentReview } from '../lib/server/payment-review';
import { grantPremium, premiumState, subscribe } from '../lib/server/premium';
import { adminServices } from '../lib/server/services';
import { resetSiteMemory, siteGet, siteUpdate } from '../lib/server/site-content';

const visitor = {
  id: 'visitor',
  uid: 'visitor',
  role: 'student',
  name: 'Kurs qatnashchisi',
  learnerType: 'independent',
} as Actor;
const admin = { ...visitor, id: 'owner', uid: 'owner', role: 'admin' } as Actor;
const now = Date.UTC(2026, 10, 28, 9);
const day = 86_400_000;
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

beforeEach(() => {
  vi.stubEnv('STUDYQUEST_DEMO', 'true');
  resetSiteMemory();
});

async function setPrice(course: string, price: string) {
  await manageCourseAccess(admin, { op: 'shop', course, price, how: 'Click orqali to‘lang.' });
}

it('attaches a private receipt to an existing request and opens the main course on approval', async () => {
  await setPrice(MAIN_COURSE, '10000');
  await siteUpdate({
    'courseRequests/visitor': {
      uid: visitor.id,
      name: visitor.name,
      note: 'Oldingi so‘rov',
      at: now - 1,
    },
  });
  await expect(
    submitCoursePayment(visitor, { course: MAIN_COURSE, note: '' }, Buffer.from('not an image')),
  ).rejects.toMatchObject({ status: 400 });

  const res = await Promise.all([
    submitCoursePayment(visitor, { course: MAIN_COURSE, note: '' }, png, now),
    submitCoursePayment(visitor, { course: MAIN_COURSE, note: '' }, png, now),
  ]);
  expect(res).toEqual(Array(2).fill({ ok: false, pending: now, receiptSubmitted: true }));
  expect(await cancelCourseRequest(visitor)).toEqual(res[0]);
  expect(await requestCourseAccess(visitor, { note: 'Qayta so‘rov' }, now + 1)).toEqual(res[0]);
  expect(
    Object.keys((await siteGet('courseReceipts/' + MAIN_COURSE + '/visitor')) || {}),
  ).toHaveLength(1);
  await expect(requireCourse(visitor)).rejects.toMatchObject({ status: 403 });
  await expect(paymentReview(visitor)).rejects.toMatchObject({ status: 403 });

  await setPrice(MAIN_COURSE, '12 000 so‘m');
  const {
    payments: [payment],
  } = await paymentReview(admin);
  expect(payment).toMatchObject({
    type: 'course',
    status: 'pending',
    amount: 10_000,
    note: 'Oldingi so‘rov',
    target: { source: 'course', course: MAIN_COURSE, uid: visitor.id },
  });
  const id = payment.target!.id;
  await expect(courseReceipt(visitor, MAIN_COURSE, visitor.id, id)).rejects.toMatchObject({
    status: 403,
  });
  expect(await courseReceipt(admin, MAIN_COURSE, visitor.id, id)).toEqual({
    type: 'image/png',
    bytes: png,
  });
  await expect(
    decidePayment(visitor, { decision: 'approve', target: payment.target }),
  ).rejects.toMatchObject({ status: 403 });
  await decidePayment(admin, { decision: 'approve', target: payment.target }, now + 2);
  expect(await courseEntry(visitor)).toEqual({ ok: true, via: 'grant' });
  await expect(requireCourse(visitor)).resolves.toBe(visitor);
  expect((await paymentReview(admin)).payments).toMatchObject([
    { status: 'approved', amount: 10_000 },
  ]);
  await manageCourseAccess(admin, { op: 'revoke', uid: visitor.id });
  await expect(requireCourse(visitor)).rejects.toMatchObject({ status: 403 });
  expect((await paymentReview(admin)).payments[0].status).toBe('approved');
});

it('lets a rejected receipt be replaced and protects the new attempt from stale decisions', async () => {
  await setPrice('restoran', '50 000 so‘m');
  await submitCoursePayment(visitor, { course: 'restoran', note: '' }, png, now);
  const first = (await paymentReview(admin)).payments[0];
  await decidePayment(admin, { decision: 'reject', target: first.target }, now + 1);
  expect(await paidEntry(visitor, 'restoran')).toMatchObject({ ok: false, receiptRejected: true });
  await submitCoursePayment(visitor, { course: 'restoran', note: 'Yangi chek' }, png, now + 2);
  const [next, old] = (await paymentReview(admin)).payments;
  expect([next.status, old.status]).toEqual(['pending', 'rejected']);
  await expect(
    decidePayment(admin, { decision: 'approve', target: first.target }),
  ).rejects.toMatchObject({ status: 409 });
  await expect(requirePaidCourse(visitor, 'restoran')).rejects.toMatchObject({ status: 403 });
  await decidePayment(admin, { decision: 'approve', target: next.target }, now + 3);
  await expect(requirePaidCourse(visitor, 'restoran')).resolves.toBeUndefined();
  expect(await courseEntry(visitor)).toMatchObject({ ok: false });
});

it('reviews subscription, avatar and service payments through their existing fulfillment rules', async () => {
  const buyer = { ...visitor, id: 'avatar-buyer', uid: 'avatar-buyer' };
  const board = Array.from({ length: 10 }, (_, i) => ({
    id: 'top-' + i,
    name: 'Talaba ' + i,
    classId: 'AP-223',
    academicPoints: 100 - i,
  })).concat({ id: buyer.id, name: buyer.name, classId: 'AP-223', academicPoints: 10 });
  const serviceAt = now + 10;
  const serviceId = 'example1';
  const legacyId = 'example2';
  const service = {
    uid: visitor.id,
    name: visitor.name,
    title: 'Taqdimot',
    text: 'Tayyor ish',
    status: 'review',
    budget: 5000,
    at: now - 100,
    upd: serviceAt,
    paidAt: serviceAt,
  };
  await siteUpdate({
    avatarShop: { on: true, days: 45, price: '25 000 so‘m' },
    'avatarOrders/legacy-buyer': {
      uid: 'legacy-buyer',
      name: 'Eski so‘rov',
      group: 'AP-223',
      at: now - 1,
    },
    ['serviceOrders/visitor/' + serviceId]: { ...service, kind: 'slides' },
    ['serviceOrders/visitor/' + legacyId]: { ...service, kind: 'premium', paidAt: serviceAt + 1 },
  });
  await orderAvatar(buyer, board, { op: 'order', note: 'Click 12345' }, BUILTIN_AVATARS, now);
  await subscribe(visitor, { plan: 'oy', amount: 15_000, paidAt: now - 100 }, now);
  const { payments } = await paymentReview(admin);
  const sub = payments.find((p) => p.target?.source === 'subscription')!;
  const legacy = payments.find((p) => p.target?.id === legacyId)!;
  const work = payments.find((p) => p.target?.id === serviceId)!;
  const avatar = payments.find((p) => p.target?.source === 'avatar' && p.target.uid === buyer.id)!;
  const oldAvatar = payments.find((p) => p.name === 'Eski so‘rov')!;
  expect(legacy).toMatchObject({ type: 'subscription', selectTerm: true });
  expect(work).toMatchObject({ type: 'service', amount: 5000 });
  expect(avatar).toMatchObject({ amount: 25_000, days: 45, note: 'Click 12345' });

  await decidePayment(admin, { decision: 'approve', target: sub.target }, now + 20);
  await decidePayment(admin, { decision: 'approve', target: avatar.target }, now + 21);
  await decidePayment(admin, { decision: 'reject', target: oldAvatar.target }, now + 21);
  expect((await readAvatars(now + 22)).pass?.[buyer.id]).toBe(now + 21 + 45 * day);
  await decidePayment(
    admin,
    { decision: 'reject', target: work.target, reason: 'Chekni qayta yuboring' },
    now + 22,
  );
  expect((await paymentReview(admin)).payments.find((p) => p.key === work.key)).toMatchObject({
    status: 'rejected',
    amount: 5000,
    reason: 'Chekni qayta yuboring',
  });
  await siteUpdate({
    ['serviceOrders/visitor/' + serviceId + '/paidAt']: now + 23,
    ['serviceOrders/visitor/' + serviceId + '/budget']: 7000,
  });
  await expect(
    decidePayment(admin, { decision: 'approve', target: work.target }),
  ).rejects.toMatchObject({ status: 409 });
  // The product was opened before a failed order write. A retry must use the first approval and extend it only once.
  const at = now + 24;
  await siteUpdate({
    ['serviceOrders/visitor/' + legacyId + '/approving']: { at, days: 365, by: admin.name },
  });
  await grantPremium(visitor.id, visitor.name, '', 365, admin.name, at, 5000, legacyId);
  const legacyReviews = await Promise.allSettled([
    decidePayment(admin, { decision: 'approve', target: legacy.target, days: 30 }, at + 1),
    adminServices(admin, { op: 'confirm', uk: 'visitor', id: legacyId, days: 30 }, at + 1),
  ]);
  expect(legacyReviews.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(await premiumState(visitor, now + 25)).toMatchObject({ until: now + 20 + 395 * day });
});
