import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import type {
  CourseEntry,
  CourseGrant,
  CourseRequest,
  CourseShop,
  PaidCourseState,
} from '../course-access';
import { course as mainCourse, demoUsers, extraCourses } from '../seed';
import { administrator, ApiError, check } from './auth';
import { authAdmin, demo, repository } from './repository';
import { siteGet, siteUpdate } from './site-content';
import { premiumState } from './premium';

/* 🔑 Kursga kirish. Kurs darslari:
   • TerDU talabalariga — o'qituvchi tasdiqlagan asl talaba hisobi (legacy_<id>, «university») bilan ochiq (avvalgidek);
   • o'qituvchi va administratorga — doim ochiq;
   • qolganlarga (email/Google bilan ro'yxatdan o'tganlar, «mustaqil o'quvchi» hisoblari) — faqat 💎 obuna bo'lsa yoki
     administrator ruxsat bergan bo'lsa.
   Bazada (brauzerlar tegolmaydigan site/* bo'limida):
     site/courseAccess/<foydalanuvchi>   = {uid, name, email?, at, by}      — administrator bergan ruxsat;
     site/courseRequests/<foydalanuvchi> = {uid, name, email?, at, note?}   — «ruxsat so'rash» (administrator ko'radi);
     site/courseGate = {off, students}                                     — off=true: kurs hammaga ochiq (vaqtincha);
                                                                             students=true: «Talabaman» deb guruhi bilan
                                                                             yozilganlarga kurs darhol ochiladi.
   🎓 Ro'yxatdan o'tishda «Talabamisiz?» so'ralmaydi: foydalanuvchi kursni boshlaganda so'raladi — «Ha» desa guruhini
   yozib kursga yoziladi (so'rov {group} bilan; o'qituvchi/administrator tasdiqlaydi yoki students=true bo'lsa — darhol).
   Ruxsat foydalanuvchi id si (legacy_<id> yoki uid) yoki uning kirish hisobi (Firebase uid) bo'yicha beriladi —
   administrator emailni yozib bersa, server uni uid ga aylantiradi. */

export const COURSE_LOCKED =
  'Kurs darslari obunachilar va administrator ruxsat bergan foydalanuvchilar uchun ochiq.';
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const DEMO = new Set(demoUsers.map((u) => u.id));

/** TerDU talabasi: o'qituvchi tasdiqlagan asl talaba hisobi (demo talabasi ham shunday hisoblanadi). */
export function terduStudent(a: Pick<Actor, 'id' | 'learnerType'>) {
  return a.learnerType === 'university' && (a.id.startsWith('legacy_') || DEMO.has(a.id));
}

/* Umumiy sozlama 30 soniya xotirada (har sahifa ochilganda bazaga bormaslik uchun). */
type Gate = { off: boolean; students: boolean };
const mem = ((
  globalThis as { __sqCourseGate?: { c: (Gate & { at: number }) | null } }
).__sqCourseGate ??= { c: null });
export function forgetCourseGate() {
  mem.c = null;
}
export async function courseGate(): Promise<Gate> {
  const c = mem.c;
  if (c && Date.now() - c.at < 30000) return { off: c.off, students: c.students };
  let off = false,
    students = true;
  try {
    const v = await siteGet<{ off?: boolean; students?: boolean }>('courseGate');
    off = v?.off === true;
    // ✅ sukut bo'yicha yoqiq: «Talabaman» deb guruhi bilan yozilganga kurs darhol ochiladi (o'chirilsa — tasdiq)
    students = v?.students !== false;
  } catch {}
  mem.c = { off, students, at: Date.now() };
  return { off, students };
}

async function grantOf(a: Pick<Actor, 'id' | 'uid'>, base = 'courseAccess') {
  const ids = [...new Set([a.id, a.uid].filter(Boolean))];
  const found = await Promise.all(ids.map((id) => siteGet<CourseGrant>(base + '/' + keyOf(id))));
  return found.find((g, i) => g && g.uid === ids[i]) || null;
}

/* ---------- 💳 pullik kurslar (masalan, restoran kursi) ----------
   Kurs hammaga ko'rinadi, darslarini faqat ADMINISTRATOR va u ruxsat bergan foydalanuvchilar ochadi (o'qituvchi ham
   ruxsat bilan). Har kursning yozuvlari alohida:
     site/courseAccess_<kurs>/<foydalanuvchi>   — ruxsat;  site/courseRequests_<kurs>/<foydalanuvchi> — so'rov;
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
const shopMem = ((
  globalThis as { __sqCourseShop?: Map<string, { v: CourseShop; at: number }> }
).__sqCourseShop ??= new Map());
function normalizeShop(raw: Partial<CourseShop> | null): CourseShop {
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  return { price: s(raw?.price, 80), how: s(raw?.how, 600) };
}
async function courseShop(course: string): Promise<CourseShop> {
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
  const w = where(course);
  const [grant, request] = await Promise.all([
    grantOf(a, w.grants),
    siteGet<CourseRequest>(w.requests + '/' + keyOf(a.id)),
  ]);
  if (grant) return { ok: true, via: 'grant' };
  return { ok: false, pending: request?.uid === a.id ? Number(request.at) || null : null };
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

/** Foydalanuvchi kurs darslariga kira oladimi va nima sababdan (obuna, ruxsat, talaba …). */
export async function courseEntry(a: Actor, now = Date.now()): Promise<CourseEntry> {
  if (a.role !== 'student') return { ok: true, via: 'staff' };
  if (terduStudent(a)) return { ok: true, via: 'student' };
  const [gate, grant, premium, request] = await Promise.all([
    courseGate(),
    grantOf(a),
    premiumState(a, now),
    siteGet<CourseRequest>('courseRequests/' + keyOf(a.id)),
  ]);
  if (grant) return { ok: true, via: 'grant' };
  if (premium.active) return { ok: true, via: 'premium', until: premium.until };
  if (gate.off) return { ok: true, via: 'open' };
  const mine = request?.uid === a.id;
  return {
    ok: false,
    pending: mine ? Number(request!.at) || null : null,
    ...(mine && request!.group ? { group: request!.group } : {}),
  };
}
/** Server tekshiruvi: dars ochilishidan oldin. */
export async function requireCourse(a: Actor) {
  if (a.role !== 'student' || terduStudent(a)) return;
  if ((await courseEntry(a)).ok) return;
  // Tejamkor (readOnly) so'rovda Firestore'dagi o'qituvchi roli ko'rinmaydi — rad etishdan oldin bir marta tekshiriladi
  const stored = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  if (stored?.role === 'teacher' || stored?.role === 'admin') return;
  throw new ApiError(403, COURSE_LOCKED);
}

const MAX_REQUESTS = 1000;
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
  const entry = w.paid ? await paidEntry(a, w.course) : await courseEntry(a, now);
  if (entry.ok) return entry;
  if (v.group && (await courseGate()).students) {
    // administrator «talabalarga darhol ochish»ni yoqqan — kurs shu zahoti ochiladi
    await siteUpdate({
      [w.grants + '/' + keyOf(a.id)]: {
        uid: a.id,
        name: a.name.slice(0, 120),
        ...(a.email ? { email: a.email.slice(0, 120) } : {}),
        group: v.group,
        at: now,
        by: 'student',
      } satisfies CourseGrant,
      [w.requests + '/' + keyOf(a.id)]: null,
    });
    return { ok: true, via: 'grant' } satisfies CourseEntry;
  }
  const all = (await siteGet<Record<string, unknown>>(w.requests)) || {};
  check(
    Object.keys(all).length < MAX_REQUESTS || !!all[keyOf(a.id)],
    429,
    'So‘rovlar juda ko‘p. Birozdan keyin urinib ko‘ring yoki administratorga yozing.',
  );
  const rec: CourseRequest = {
    uid: a.id,
    name: a.name.slice(0, 120),
    ...(a.email ? { email: a.email.slice(0, 120) } : {}),
    ...(v.group ? { group: v.group } : {}),
    at: now,
    ...(v.note ? { note: v.note } : {}),
  };
  await siteUpdate({ [w.requests + '/' + keyOf(a.id)]: rec });
  return { ok: false, pending: now, ...(v.group ? { group: v.group } : {}) } satisfies CourseEntry;
}
export async function cancelCourseRequest(a: Actor, course?: string) {
  await siteUpdate({ [where(course).requests + '/' + keyOf(a.id)]: null });
  return { ok: false, pending: null } satisfies CourseEntry;
}

/* ---------- 🛠 administrator bo'limi ---------- */
export async function courseAccessAdmin(a: Actor, course?: string) {
  administrator(a);
  const w = where(course);
  const [grants, requests, gate, shop] = await Promise.all([
    siteGet<Record<string, CourseGrant>>(w.grants),
    siteGet<Record<string, CourseRequest>>(w.requests),
    siteGet<{ off?: boolean; students?: boolean }>('courseGate'),
    w.paid ? courseShop(w.course) : Promise.resolve(null),
  ]);
  const valid = <T extends { uid?: unknown; at?: unknown }>(x: T | null | undefined): x is T =>
    !!x && typeof x.uid === 'string' && typeof x.at === 'number';
  return {
    course: w.course,
    paid: w.paid,
    courses: [
      { id: MAIN_COURSE, title: mainCourse.title, paid: false },
      ...extraCourses.filter((c) => c.paid).map((c) => ({ id: c.id, title: c.title, paid: true })),
    ],
    shop,
    gate: { off: gate?.off === true, students: gate?.students !== false },
    grants: Object.values(grants || {})
      .filter(valid)
      .sort((x, y) => y.at - x.at),
    requests: Object.values(requests || {})
      .filter(valid)
      .sort((x, y) => x.at - y.at),
    email: !demo(),
  };
}
export type CourseAccessAdminView = Awaited<ReturnType<typeof courseAccessAdmin>>;

const uid = z.string().min(1).max(140);
const courseId = z.string().max(40).optional();
const input = z.discriminatedUnion('op', [
  z.object({ op: z.literal('approve'), uid, course: courseId }).strict(),
  z.object({ op: z.literal('reject'), uid, course: courseId }).strict(),
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
  z.object({ op: z.literal('gate'), off: z.boolean() }).strict(),
  // 🎓 «Talabaman» deb guruhi bilan yozilganlarga kursni darhol ochish (aks holda — so'rov, tasdiqlash kerak)
  z.object({ op: z.literal('students'), on: z.boolean() }).strict(),
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
/** Administrator: so'rovni tasdiqlash/rad etish, email bo'yicha ruxsat berish, ruxsatni olish, umumiy sozlama. */
export async function manageCourseAccess(
  a: Actor,
  raw: unknown,
  now = Date.now(),
  find: FindUser = findDefault,
) {
  administrator(a);
  const p = input.parse(raw);
  if (p.op === 'gate' || p.op === 'students') {
    await siteUpdate(
      // students: sukut bo'yicha yoqiq, shuning uchun o'chirilgani aniq false bilan saqlanadi
      p.op === 'gate' ? { 'courseGate/off': p.off } : { 'courseGate/students': p.on },
    );
    mem.c = null;
    return courseAccessAdmin(a);
  }
  const w = where(p.course);
  if (p.op === 'shop') {
    check(w.paid, 400, 'Narx faqat pullik kurs uchun.');
    await siteUpdate({ ['courseShop/' + w.course]: normalizeShop(p) });
    shopMem.delete(w.course);
    return courseAccessAdmin(a, w.course);
  }
  if (p.op === 'revoke') {
    await siteUpdate({ [w.grants + '/' + keyOf(p.uid)]: null });
    return courseAccessAdmin(a, w.course);
  }
  if (p.op === 'grantUser') {
    await siteUpdate({
      [w.grants + '/' + keyOf(p.uid)]: {
        uid: p.uid,
        name: p.name,
        at: now,
        by: a.uid,
      } satisfies CourseGrant,
      [w.requests + '/' + keyOf(p.uid)]: null,
    });
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
    await siteUpdate({
      [w.grants + '/' + keyOf(u!.uid)]: {
        uid: u!.uid,
        name: u!.name.slice(0, 120),
        email: u!.email.slice(0, 120),
        at: now,
        by: a.uid,
      } satisfies CourseGrant,
      [w.requests + '/' + keyOf(u!.uid)]: null,
    });
    return courseAccessAdmin(a, w.course);
  }
  const key = keyOf(p.uid);
  const r = await siteGet<CourseRequest>(w.requests + '/' + key);
  check(r && r.uid === p.uid, 404, 'So‘rov topilmadi (bekor qilingan bo‘lishi mumkin).');
  await siteUpdate({
    [w.requests + '/' + key]: null,
    ...(p.op === 'approve'
      ? {
          [w.grants + '/' + key]: {
            uid: r!.uid,
            name: r!.name,
            ...(r!.email ? { email: r!.email } : {}),
            ...(r!.group ? { group: r!.group } : {}),
            at: now,
            by: a.uid,
          } satisfies CourseGrant,
        }
      : {}),
  });
  return courseAccessAdmin(a, w.course);
}
