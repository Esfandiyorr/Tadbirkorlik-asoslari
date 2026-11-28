import 'server-only';
import { z } from 'zod';
import { avatarOrderId } from '../avatars';
import { courseReceiptUrl } from '../course-access';
import { isProduct, priceAmount, PRODUCTS, type OrderFile } from '../services';
import type { Actor } from '../types';
import { administrator } from './auth';
import { listAvatarPayments, reviewAvatarOrder } from './avatars';
import { listCoursePayments, reviewCourseRequest } from './course-access';
import type { Payment } from './payments';
import { listPremiumPayments, reviewPremiumClaim } from './premium';
import { listServicePayments, reviewServicePayment } from './services';
import { siteGet } from './site-content';
import { recordStaffActivity } from './staff-activity';

const uid = z.string().min(1).max(140);
const targetInput = z.discriminatedUnion('source', [
  z.object({ source: z.literal('subscription'), uid, id: z.string().regex(/^[a-z0-9]{6,30}$/) }),
  z.object({
    source: z.literal('course'),
    uid,
    course: z.string().min(1).max(40),
    id: z.string().regex(/^[a-f0-9]{32}$/),
  }),
  z.object({
    source: z.literal('avatar'),
    uid: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
    id: z.string().regex(/^[a-z0-9]{1,32}$/),
  }),
  z.object({
    source: z.literal('service'),
    uk: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
    id: z.string().regex(/^[a-z0-9]{6,40}$/),
    at: z.number().int().positive(),
  }),
]);
type Target = z.infer<typeof targetInput>;

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentRow = {
  key: string;
  type: Target['source'];
  status: PaymentStatus;
  name: string;
  group?: string;
  email?: string;
  title?: string;
  amount?: number;
  price?: string;
  at: number;
  paidAt?: number;
  days?: number;
  selectTerm?: true;
  approving?: true;
  note?: string;
  reason?: string;
  receiptUrl?: string;
  serviceReceipts?: { order: string; files: OrderFile[] };
  target?: Target;
};

export async function paymentReview(a: Actor) {
  administrator(a);
  const [subscriptions, courses, avatars, services, provider] = await Promise.all([
    listPremiumPayments(a),
    listCoursePayments(a),
    listAvatarPayments(a),
    listServicePayments(a),
    siteGet<Record<string, Payment>>('payments'),
  ]);
  const payments: PaymentRow[] = [
    ...subscriptions.map((p): PaymentRow => ({
      key: 'subscription:' + p.uid + ':' + p.id,
      type: 'subscription',
      status: p.status === 'new' ? 'pending' : p.status === 'ok' ? 'approved' : 'rejected',
      name: p.name,
      group: p.group,
      amount: p.amount || undefined,
      at: p.at,
      paidAt: p.paidAt,
      days: p.days,
      ...(p.receipt
        ? { receiptUrl: '/api/premium?receipt=' + encodeURIComponent(p.uid + '/' + p.id) }
        : {}),
      ...(p.status === 'new' ? { target: { source: 'subscription', uid: p.uid, id: p.id } } : {}),
    })),
    ...courses.map((p): PaymentRow => ({
      key: 'course:' + p.course + ':' + p.uid + ':' + p.payment.id,
      type: 'course',
      status: p.status,
      name: p.name,
      email: p.email,
      group: p.group,
      title: p.title,
      amount: priceAmount(p.payment.price),
      price: p.payment.price,
      at: p.at,
      note: p.note,
      receiptUrl: courseReceiptUrl(p.course, p.uid, p.payment.id),
      ...(p.status === 'pending'
        ? { target: { source: 'course', uid: p.uid, course: p.course, id: p.payment.id } }
        : {}),
    })),
    ...avatars.map((p): PaymentRow => ({
      key: 'avatar:' + p.uid + ':' + avatarOrderId(p),
      type: 'avatar',
      status: p.status,
      name: p.name,
      group: p.group,
      amount: priceAmount(p.price),
      price: p.price,
      at: p.at,
      days: p.days,
      note: p.note,
      ...(p.status === 'pending'
        ? { target: { source: 'avatar', uid: p.uid, id: avatarOrderId(p) } }
        : {}),
    })),
    ...services.map((p): PaymentRow => {
      const product = isProduct(p.kind) ? PRODUCTS[p.kind] : undefined;
      return {
        key: 'service:' + p.uk + ':' + p.id + ':' + p.at,
        type: product?.premium ? 'subscription' : 'service',
        status: p.status,
        name: p.name,
        group: p.group,
        email: p.email,
        title: p.title,
        amount: p.amount || undefined,
        at: p.at,
        days: p.days || product?.days,
        note: p.note,
        reason: p.reason,
        ...(p.receipts.length
          ? { serviceReceipts: { order: p.uk + '/' + p.id, files: p.receipts } }
          : {}),
        ...(p.status === 'pending'
          ? { target: { source: 'service', uk: p.uk, id: p.id, at: p.at } }
          : {}),
        ...(p.approving ? { approving: true } : {}),
        ...(p.status === 'pending' && p.kind === 'premium' && !p.approving
          ? { selectTerm: true }
          : {}),
      };
    }),
    ...Object.entries(provider || {})
      .filter(([, p]) => !!p?.ref && (p.product === 'premium' || p.product === 'avatar'))
      .map(([key, p]): PaymentRow => ({
        key: 'provider:' + key,
        type: p.product === 'premium' ? 'subscription' : 'avatar',
        status: 'approved',
        name: p.name,
        title: p.provider,
        amount: p.amount,
        at: p.at,
        days: p.days,
      })),
  ];
  return { payments };
}
export type PaymentReviewView = Awaited<ReturnType<typeof paymentReview>>;

const decisionInput = z.object({
  decision: z.enum(['approve', 'reject']),
  target: targetInput,
  days: z.number().int().min(1).max(730).optional(),
  reason: z.string().trim().max(300).optional(),
});

export async function decidePayment(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const { decision, target, days, reason } = decisionInput.parse(raw);
  if (target.source === 'subscription') {
    const { uid, id } = target;
    await reviewPremiumClaim(a, { op: decision === 'approve' ? 'verify' : 'reject', uid, id }, now);
  } else if (target.source === 'course') {
    await reviewCourseRequest(
      a,
      { op: decision, uid: target.uid, course: target.course, paymentId: target.id },
      now,
    );
  } else if (target.source === 'avatar') {
    await reviewAvatarOrder(a, { op: decision, student: target.uid, orderId: target.id }, now);
  } else {
    const order = { uk: target.uk, id: target.id, expectedPaidAt: target.at };
    await reviewServicePayment(
      a,
      decision === 'approve'
        ? { op: 'confirm', ...order, days }
        : { op: 'reject', ...order, reason },
      now,
    );
  }
  await recordStaffActivity(a, 'payment:' + decision, target.source + ' · ' + target.id).catch(
    () => {},
  );
}
