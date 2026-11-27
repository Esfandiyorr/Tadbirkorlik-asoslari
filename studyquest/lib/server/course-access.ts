import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  COURSE_RECEIPT_MAX,
  type CourseEntry,
  type CourseGrant,
  type CourseRequest,
  type CourseShop,
  type PaidCourseState,
} from '../course-access';
import { course as mainCourse, extraCourses } from '../seed';
import { administrator, ApiError, check } from './auth';
import { authAdmin, demo, repository } from './repository';
import { imageType, siteGet, siteTransaction, siteUpdate } from './site-content';
// Asosiy kurs: tasdiqlangan guruhli hisoblar, xodimlar va administrator ruxsat berganlar.
export const COURSE_LOCKED =
  'Kurs guruhi biriktirilgan talabalar uchun ochiq. Kirish uchun administratordan ruxsat so‘rang.';
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);

/** Guruh so‘rov matnidan emas, tizim tasdiqlagan talaba hisobidan olinadi. */
export function groupedStudent(a: Pick<Actor, 'classId' | 'learnerType'>) {
  const group = typeof a.classId === 'string' ? a.classId.trim().toLowerCase() : '';
  return a.learnerType === 'university' && !!group && group !== 'mustaqil';
}

/* ---------- 💳 pullik kurslar (masalan, restoran kursi) ----------
   Kurs hammaga ko'rinadi, darslarini faqat ADMINISTRATOR va u ruxsat bergan foydalanuvchilar ochadi (o'qituvchi ham
   ruxsat bilan). Har kursning yozuvlari alohida:
     site/courseAccess_<kurs>/<foydalanuvchi>   — eski ruxsatlar;
     site/courseRequests_<kurs>/<foydalanuvchi> — so‘rov, to‘lov tarixi va yangi ruxsat;
     site/courseShop/<kurs> = {price, how}      — narx va to'lov yo'riqnomasi (talabaga ko'rsatiladi). */
export const MAIN_COURSE = mainCourse.id; // = MAIN_COURSE_ID (lib/course-access.ts)
export const PAID_LOCKED =
  'Bu kurs pullik: darslarni faqat administrator ruxsat bergan qatnashchilar ochadi.';
export const paidCourse = (id?: string) => extraCourses.find((c) => c.id === id && c.paid);
/** Kurs bo'yicha yozuvlar joyi: asosiy fan — avvalgi yo'llar, pullik fan — o'z yo'llari. */
function where(course?: string) {
  if (!course || course === MAIN_COURSE)
    return { course: MAIN_COURSE, grants: 'courseAccess', requests: 'courseRequests', paid: false };
  const c = paidCourse(course);
  check(c, 404, 'Kurs topilmadi');
  return {
    course: c!.id,
    grants: 'courseAccess_' + c!.id,
    requests: 'courseRequests_' + c!.id,
    paid: true,
  };
}
type CourseTable = ReturnType<typeof where>;
type CoursePaymentRequest = CourseRequest & { payment: NonNullable<CourseRequest['payment']> };
type ReviewedCoursePayment = CoursePaymentRequest & {
  status: 'approved' | 'rejected';
  decidedAt: number;
};
type Admission = {
  request?: CourseRequest;
  grant?: CourseGrant;
  reviews?: Record<string, ReviewedCoursePayment>;
};
type StoredAdmission = Admission | CourseRequest;

// Eski so‘rovlar bitta yozuv edi. Yangi yozuvda qaror va ruxsat birga o‘zgaradi.
function admission(raw?: StoredAdmission | null): Admission {
  return raw && 'uid' in raw ? { request: raw } : raw || {};
}
const admissionPath = (w: CourseTable, uid: string) => w.requests + '/' + keyOf(uid);
const accepted = (g: CourseGrant | null | undefined, uid: string) =>
  g?.uid === uid && g.by !== 'student';

const accessCourses = [
  { id: MAIN_COURSE, title: mainCourse.title, paid: false },
  ...extraCourses.filter((c) => c.paid).map((c) => ({ id: c.id, title: c.title, paid: true })),
];
const receiptPath = (course: string, uid: string, id: string) =>
  'courseReceipts/' + course + '/' + keyOf(uid) + '/' + id;
const hasPayment = (r: CourseRequest | undefined | null): r is CoursePaymentRequest =>
  !!r?.uid && typeof r.at === 'number' && !!r.payment?.id;

function requestEntry(state: Admission, uid: string): CourseEntry {
  if (accepted(state.grant, uid)) return { ok: true, via: 'grant' };
  const { request } = state;
  if (request?.uid !== uid) {
    const last = Object.values(state.reviews || {}).reduce<ReviewedCoursePayment | null>(
      (latest, review) => (!latest || review.decidedAt > latest.decidedAt ? review : latest),
      null,
    );
    return {
      ok: false,
      pending: null,
      ...(last?.status === 'rejected' ? { receiptRejected: true } : {}),
    };
  }
  return {
    ok: false,
    pending: Number(request.at) || null,
    ...(request.group ? { group: request.group } : {}),
    ...(hasPayment(request) ? { receiptSubmitted: true } : {}),
  };
}

async function accessEntry(a: Actor, w: CourseTable): Promise<CourseEntry> {
  const ids = a.uid && a.uid !== a.id ? [a.id, a.uid] : [a.id];
  const records = await Promise.all(
    ids.map(async (uid) => {
      const [legacyGrant, raw] = await Promise.all([
        siteGet<CourseGrant>(w.grants + '/' + keyOf(uid)),
        siteGet<StoredAdmission>(admissionPath(w, uid)),
      ]);
      return { granted: accepted(legacyGrant, uid), entry: requestEntry(admission(raw), uid) };
    }),
  );
  if (records.some((r) => r.granted || r.entry.ok)) return { ok: true, via: 'grant' };
  return records[0].entry;
}

const shopMem = ((
  globalThis as { __sqCourseShop?: Map<string, { v: CourseShop; at: number }> }
).__sqCourseShop ??= new Map());
function normalizeShop(raw: Partial<CourseShop> | null): CourseShop {
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  return { price: s(raw?.price, 80), how: s(raw?.how, 600) };
}
export async function courseShop(course: string): Promise<CourseShop> {
  const c = shopMem.get(course);
  if (c && Date.now() - c.at < 30000) return c.v;
  let v: CourseShop = { price: '', how: '' };
  try {
    v = normalizeShop(await siteGet<Partial<CourseShop>>('courseShop/' + course));
  } catch {}
  shopMem.set(course, { v, at: Date.now() });
  return v;
}
/** Foydalanuvchi pullik kursga kira oladimi: administrator — doim; qolganlar — faqat ruxsat bilan. */
export async function paidEntry(a: Actor, course: string): Promise<CourseEntry> {
  if (a.role === 'admin') return { ok: true, via: 'staff' };
  return accessEntry(a, where(course));
}
/** Barcha pullik kurslar bo'yicha holat va narx (mehmonga — faqat narx, «kira olmaydi»). */
export async function paidView(a?: Actor): Promise<Record<string, PaidCourseState>> {
  const list = extraCourses.filter((c) => c.paid);
  const rows = await Promise.all(
    list.map(async (c) => {
      const [shop, entry] = await Promise.all([
        courseShop(c.id),
        a ? paidEntry(a, c.id) : Promise.resolve<CourseEntry>({ ok: false, pending: null }),
      ]);
      return [c.id, { ...entry, ...shop }] as const;
    }),
  );
  return Object.fromEntries(rows);
}
/** Server tekshiruvi: pullik kurs darsi ochilishidan oldin. */
export async function requirePaidCourse(a: Actor, course: string) {
  if ((await paidEntry(a, course)).ok) return;
  // Tejamkor (readOnly) so'rovda Firestore'dagi administrator roli ko'rinmaydi — rad etishdan oldin bir marta tekshiriladi
  const stored = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  if (stored?.role === 'admin') return;
  throw new ApiError(403, PAID_LOCKED);
}

export async function courseEntry(a: Actor): Promise<CourseEntry> {
  if (a.role !== 'student') return { ok: true, via: 'staff' };
  if (groupedStudent(a)) return { ok: true, via: 'student' };
  return accessEntry(a, where());
}

/** Read-only auth includes legacy groups. Other group assignments and staff roles are stored in Firestore. */
export async function requireCourse(a: Actor): Promise<Actor> {
  if ((await courseEntry(a)).ok) return a;
  const stored = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  if (stored && !stored.blocked) {
    if (stored.role === 'teacher' || stored.role === 'admin') return { ...a, role: stored.role };
    const group = { classId: stored.classId, learnerType: stored.learnerType };
    if (!a.id.startsWith('legacy_') && groupedStudent(group)) return { ...a, ...group };
  }
  throw new ApiError(403, COURSE_LOCKED);
}

const MAX_REQUESTS = 1000;
async function checkRequestSpace(w: CourseTable, key: string) {
  const all = (await siteGet<Record<string, StoredAdmission>>(w.requests)) || {};
  check(
    !!admission(all[key]).request ||
      Object.values(all).filter((r) => admission(r).request).length < MAX_REQUESTS,
    429,
    'So‘rovlar juda ko‘p. Birozdan keyin urinib ko‘ring yoki administratorga yozing.',
  );
}
function requestRecord(a: Actor, at: number): CourseRequest {
  return {
    uid: a.id,
    name: (a.name || 'Foydalanuvchi').slice(0, 120),
    ...(a.email ? { email: a.email.slice(0, 120) } : {}),
    at,
  };
}
/** Foydalanuvchi: «Kursga ruxsat so'rash» (administrator «Sayt boshqaruvi → 🔑 Kursga ruxsat»da ko'radi). */
export async function requestCourseAccess(a: Actor, raw: unknown, now = Date.now()) {
  const v = z
    .object({
      note: z.string().trim().max(300).optional(),
      course: z.string().max(40).optional(),
      // 🎓 «Talabaman» — guruh (masalan, AP-223)
      group: z
        .string()
        .trim()
        .regex(
          /^[\p{L}\p{N}][\p{L}\p{N} ._/-]{1,39}$/u,
          'Guruh nomini to‘g‘ri yozing (masalan, AP-223).',
        )
        .optional(),
    })
    .strict()
    .parse(raw ?? {});
  const w = where(v.course);
  check(!v.group || !w.paid, 400, 'Guruh bilan faqat asosiy kursga yoziladi.');
  const entry = w.paid ? await paidEntry(a, w.course) : await courseEntry(a);
  if (entry.ok || entry.receiptSubmitted) return entry;
  const key = keyOf(a.id);
  await checkRequestSpace(w, key);
  const rec: CourseRequest = {
    ...requestRecord(a, now),
    ...(v.group ? { group: v.group } : {}),
    ...(v.note ? { note: v.note } : {}),
  };
  const saved = await siteTransaction<StoredAdmission>(admissionPath(w, a.id), (raw) => {
    const current = admission(raw);
    if (accepted(current.grant, a.id) || hasPayment(current.request)) return current;
    return { ...current, request: rec };
  });
  return requestEntry(admission(saved), a.id);
}
export async function cancelCourseRequest(a: Actor, course?: string) {
  const saved = await siteTransaction<StoredAdmission>(
    admissionPath(where(course), a.id),
    (raw) => {
      const { request, ...state } = admission(raw);
      if (hasPayment(request)) return { ...state, request };
      return state.grant || state.reviews ? state : null;
    },
  );
  return requestEntry(admission(saved), a.id);
}

const coursePaymentInput = z.object({
  course: z.string().min(1).max(40),
  note: z.string().trim().max(300),
});
/** Chek shaxsiy yo‘lda saqlanadi. So‘rovga faqat chek kaliti va yuborish paytidagi narx yoziladi. */
export async function submitCoursePayment(
  a: Actor,
  raw: unknown,
  bytes: Buffer,
  now = Date.now(),
): Promise<CourseEntry> {
  const { course, note } = coursePaymentInput.parse(raw);
  const w = where(course);
  check(
    bytes.length > 0 && bytes.length <= COURSE_RECEIPT_MAX,
    413,
    'Chek rasmi 1 MB gacha bo‘lsin.',
  );
  const type = imageType(bytes);
  check(type && type !== 'image/gif', 400, 'Chek uchun PNG, JPG yoki WEBP rasm yuklang.');
  const [shop, entry] = await Promise.all([
    courseShop(w.course),
    w.paid ? paidEntry(a, w.course) : courseEntry(a),
  ]);
  if (entry.ok || entry.receiptSubmitted) return entry;
  check(shop.price || shop.how, 409, 'Kurs uchun to‘lov yo‘riqnomasi sozlanmagan.');
  const key = keyOf(a.id);
  await checkRequestSpace(w, key);
  const id = randomUUID().replace(/-/g, '');
  const receipt = receiptPath(w.course, a.id, id);
  const rec: CoursePaymentRequest = {
    ...requestRecord(a, now),
    ...(note ? { note } : {}),
    payment: { id, price: shop.price },
  };
  await siteUpdate({ [receipt]: { t: type, d: bytes.toString('base64') } });
  const saved = await siteTransaction<StoredAdmission>(admissionPath(w, a.id), (raw) => {
    const current = admission(raw);
    const previous = current.request?.uid === a.id ? current.request : null;
    if (accepted(current.grant, a.id) || hasPayment(previous)) return current;
    return {
      ...current,
      request: {
        ...rec,
        ...(!note && previous?.note ? { note: previous.note } : {}),
        ...(previous?.group ? { group: previous.group } : {}),
      },
    };
  });
  const state = admission(saved);
  if (state.request?.payment?.id !== id) await siteUpdate({ [receipt]: null });
  return requestEntry(state, a.id);
}

export async function courseReceipt(a: Actor, course: string, uid: string, id: string) {
  administrator(a);
  const w = where(course);
  check(/^[A-Za-z0-9_-]{1,140}$/.test(uid) && /^[a-f0-9]{32}$/.test(id), 400, 'Chek topilmadi.');
  const r = await siteGet<{ t: string; d: string }>(receiptPath(w.course, uid, id));
  check(r?.d && r.t, 404, 'Chek topilmadi.');
  return { type: r!.t, bytes: Buffer.from(r!.d, 'base64') };
}

export async function listCoursePayments(a: Actor) {
  administrator(a);
  const groups = await Promise.all(
    accessCourses.map(async ({ id: course, title }) => {
      const raw = await siteGet<Record<string, StoredAdmission>>(where(course).requests);
      return Object.values(raw || {}).flatMap((record) => {
        const { request, reviews } = admission(record);
        const pending = hasPayment(request) ? [{ ...request, status: 'pending' as const }] : [];
        const reviewed = Object.values(reviews || {}).filter(hasPayment);
        return [...pending, ...reviewed].map((r) => ({ ...r, course, title }));
      });
    }),
  );
  return groups.flat();
}

/* ---------- 🛠 administrator bo'limi ---------- */
export async function courseAccessAdmin(a: Actor, course?: string) {
  administrator(a);
  const w = where(course);
  const [grants, raw, shop] = await Promise.all([
    siteGet<Record<string, CourseGrant>>(w.grants),
    siteGet<Record<string, StoredAdmission>>(w.requests),
    courseShop(w.course),
  ]);
  const allGrants = { ...grants };
  const requests = Object.entries(raw || {}).map(([key, record]) => {
    const state = admission(record);
    if (state.grant) allGrants[key] = state.grant;
    return state.request;
  });
  const valid = <T extends { uid?: unknown; at?: unknown }>(x: T | null | undefined): x is T =>
    !!x && typeof x.uid === 'string' && typeof x.at === 'number';
  return {
    course: w.course,
    paid: w.paid,
    courses: accessCourses,
    shop,
    grants: Object.values(allGrants)
      .filter((g) => valid(g) && g.by !== 'student')
      .sort((x, y) => y.at - x.at),
    requests: requests.filter(valid).sort((x, y) => x.at - y.at),
    email: !demo(),
  };
}
export type CourseAccessAdminView = Awaited<ReturnType<typeof courseAccessAdmin>>;

const uid = z.string().min(1).max(140);
const courseId = z.string().max(40).optional();
const paymentId = z
  .string()
  .regex(/^[a-f0-9]{32}$/)
  .nullable()
  .optional();
const input = z.discriminatedUnion('op', [
  z.object({ op: z.literal('approve'), uid, course: courseId, paymentId }).strict(),
  z.object({ op: z.literal('reject'), uid, course: courseId, paymentId }).strict(),
  z.object({ op: z.literal('revoke'), uid, course: courseId }).strict(),
  z
    .object({
      op: z.literal('grant'),
      course: courseId,
      email: z
        .string()
        .trim()
        .max(120)
        .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), 'Email manzil noto‘g‘ri.'),
    })
    .strict(),
  // reytingdagi (TerDU) talabaga yoki boshqa ma'lum foydalanuvchiga to'g'ridan-to'g'ri ruxsat
  z
    .object({
      op: z.literal('grantUser'),
      course: courseId,
      uid: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
      name: z.string().trim().min(1).max(120),
    })
    .strict(),
  z
    .object({
      op: z.literal('shop'),
      course: z.string().max(40),
      price: z.string().trim().max(80),
      how: z.string().trim().max(600),
    })
    .strict(),
]);
type FindUser = (email: string) => Promise<{ uid: string; name: string; email: string } | null>;
const findDefault: FindUser = async (email) => {
  try {
    const u = await authAdmin().getUserByEmail(email);
    return { uid: u.uid, name: u.displayName || email.split('@')[0], email: u.email || email };
  } catch {
    return null;
  }
};

/** Qaror, alohida to‘lov tarixi va darsga ruxsat birga saqlanadi. */
export async function reviewCourseRequest(
  a: Actor,
  p: { op: 'approve' | 'reject'; uid: string; course?: string; paymentId?: string | null },
  now = Date.now(),
) {
  administrator(a);
  const w = where(p.course);
  let problem = 404;
  await siteTransaction<StoredAdmission>(admissionPath(w, p.uid), (raw) => {
    const { request, ...state } = admission(raw);
    if (request?.uid !== p.uid) {
      problem = 404;
      return raw;
    }
    if (p.paymentId !== undefined && (request.payment?.id ?? null) !== p.paymentId) {
      problem = 409;
      return raw;
    }
    problem = 0;
    if (hasPayment(request)) {
      state.reviews = {
        ...state.reviews,
        [request.payment.id]: {
          ...request,
          status: p.op === 'approve' ? 'approved' : 'rejected',
          decidedAt: now,
        },
      };
    }
    if (p.op === 'approve')
      state.grant = {
        uid: request.uid,
        name: request.name,
        ...(request.email ? { email: request.email } : {}),
        ...(request.group ? { group: request.group } : {}),
        at: now,
        by: a.uid,
      };
    return state.grant || state.reviews ? state : null;
  });
  check(
    !problem,
    problem,
    problem === 409
      ? 'So‘rov yangilangan. Ro‘yxatni yangilang.'
      : 'So‘rov topilmadi yoki ko‘rib chiqilgan.',
  );
}

async function grantCourseManually(w: CourseTable, grant: CourseGrant) {
  await siteTransaction<StoredAdmission>(admissionPath(w, grant.uid), (raw) => {
    const { request, ...state } = admission(raw);
    return { ...state, grant, ...(hasPayment(request) ? { request } : {}) };
  });
}

/** Administrator: so'rovni tasdiqlash/rad etish, email bo'yicha ruxsat berish, ruxsatni olish. */
export async function manageCourseAccess(
  a: Actor,
  raw: unknown,
  now = Date.now(),
  find: FindUser = findDefault,
) {
  administrator(a);
  const p = input.parse(raw);
  const w = where(p.course);
  if (p.op === 'shop') {
    await siteUpdate({ ['courseShop/' + w.course]: normalizeShop(p) });
    shopMem.delete(w.course);
    return courseAccessAdmin(a, w.course);
  }
  if (p.op === 'revoke') {
    await siteUpdate({
      [w.grants + '/' + keyOf(p.uid)]: null,
      [admissionPath(w, p.uid) + '/grant']: null,
    });
    return courseAccessAdmin(a, w.course);
  }
  if (p.op === 'grantUser') {
    await grantCourseManually(w, { uid: p.uid, name: p.name, at: now, by: a.uid });
    return courseAccessAdmin(a, w.course);
  }
  if (p.op === 'grant') {
    check(find !== findDefault || !demo(), 409, 'Demo rejimida email bo‘yicha qidirib bo‘lmaydi.');
    const u = await find(p.email.toLowerCase());
    check(
      u,
      404,
      'Bu email bilan ro‘yxatdan o‘tgan foydalanuvchi topilmadi. Avval u saytda ro‘yxatdan o‘tsin.',
    );
    await grantCourseManually(w, {
      uid: u!.uid,
      name: u!.name.slice(0, 120),
      email: u!.email.slice(0, 120),
      at: now,
      by: a.uid,
    });
    return courseAccessAdmin(a, w.course);
  }
  await reviewCourseRequest(a, p, now);
  return courseAccessAdmin(a, w.course);
}
