import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import type { CourseEntry, CourseGrant, CourseRequest } from '../course-access';
import { demoUsers } from '../seed';
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
     site/courseGate = {off}                                               — off=true: kurs hammaga ochiq (vaqtincha).
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
const mem = ((
  globalThis as { __sqCourseGate?: { c: { off: boolean; at: number } | null } }
).__sqCourseGate ??= { c: null });
export function forgetCourseGate() {
  mem.c = null;
}
export async function courseGate(): Promise<{ off: boolean }> {
  const c = mem.c;
  if (c && Date.now() - c.at < 30000) return { off: c.off };
  let off = false;
  try {
    off = (await siteGet<{ off?: boolean }>('courseGate'))?.off === true;
  } catch {}
  mem.c = { off, at: Date.now() };
  return { off };
}

async function grantOf(a: Pick<Actor, 'id' | 'uid'>) {
  const ids = [...new Set([a.id, a.uid].filter(Boolean))];
  const found = await Promise.all(
    ids.map((id) => siteGet<CourseGrant>('courseAccess/' + keyOf(id))),
  );
  return found.find((g, i) => g && g.uid === ids[i]) || null;
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
  return { ok: false, pending: request?.uid === a.id ? Number(request.at) || null : null };
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
    .object({ note: z.string().trim().max(300).optional() })
    .strict()
    .parse(raw ?? {});
  const entry = await courseEntry(a, now);
  if (entry.ok) return entry;
  const all = (await siteGet<Record<string, unknown>>('courseRequests')) || {};
  check(
    Object.keys(all).length < MAX_REQUESTS || !!all[keyOf(a.id)],
    429,
    'So‘rovlar juda ko‘p. Birozdan keyin urinib ko‘ring yoki administratorga yozing.',
  );
  const rec: CourseRequest = {
    uid: a.id,
    name: a.name.slice(0, 120),
    ...(a.email ? { email: a.email.slice(0, 120) } : {}),
    at: now,
    ...(v.note ? { note: v.note } : {}),
  };
  await siteUpdate({ ['courseRequests/' + keyOf(a.id)]: rec });
  return { ok: false, pending: now } satisfies CourseEntry;
}
export async function cancelCourseRequest(a: Actor) {
  await siteUpdate({ ['courseRequests/' + keyOf(a.id)]: null });
  return { ok: false, pending: null } satisfies CourseEntry;
}

/* ---------- 🛠 administrator bo'limi ---------- */
export async function courseAccessAdmin(a: Actor) {
  administrator(a);
  const [grants, requests, gate] = await Promise.all([
    siteGet<Record<string, CourseGrant>>('courseAccess'),
    siteGet<Record<string, CourseRequest>>('courseRequests'),
    siteGet<{ off?: boolean }>('courseGate'),
  ]);
  const valid = <T extends { uid?: unknown; at?: unknown }>(x: T | null | undefined): x is T =>
    !!x && typeof x.uid === 'string' && typeof x.at === 'number';
  return {
    gate: { off: gate?.off === true },
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
const input = z.discriminatedUnion('op', [
  z.object({ op: z.literal('approve'), uid }).strict(),
  z.object({ op: z.literal('reject'), uid }).strict(),
  z.object({ op: z.literal('revoke'), uid }).strict(),
  z
    .object({
      op: z.literal('grant'),
      email: z
        .string()
        .trim()
        .max(120)
        .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), 'Email manzil noto‘g‘ri.'),
    })
    .strict(),
  z.object({ op: z.literal('gate'), off: z.boolean() }).strict(),
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
  if (p.op === 'gate') {
    await siteUpdate({ courseGate: { off: p.off } });
    mem.c = null;
    return courseAccessAdmin(a);
  }
  if (p.op === 'revoke') {
    await siteUpdate({ ['courseAccess/' + keyOf(p.uid)]: null });
    return courseAccessAdmin(a);
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
      ['courseAccess/' + keyOf(u!.uid)]: {
        uid: u!.uid,
        name: u!.name.slice(0, 120),
        email: u!.email.slice(0, 120),
        at: now,
        by: a.uid,
      } satisfies CourseGrant,
      ['courseRequests/' + keyOf(u!.uid)]: null,
    });
    return courseAccessAdmin(a);
  }
  const key = keyOf(p.uid);
  const r = await siteGet<CourseRequest>('courseRequests/' + key);
  check(r && r.uid === p.uid, 404, 'So‘rov topilmadi (bekor qilingan bo‘lishi mumkin).');
  await siteUpdate({
    ['courseRequests/' + key]: null,
    ...(p.op === 'approve'
      ? {
          ['courseAccess/' + key]: {
            uid: r!.uid,
            name: r!.name,
            ...(r!.email ? { email: r!.email } : {}),
            at: now,
            by: a.uid,
          } satisfies CourseGrant,
        }
      : {}),
  });
  return courseAccessAdmin(a);
}
