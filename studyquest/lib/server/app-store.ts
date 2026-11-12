import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator, check } from './auth';
import { authAdmin, demo, legacyDb, repository } from './repository';
import { siteGet, siteUpdate } from './site-content';

/* 📱 Play Market (Google Play) talablari uchun server qismi.
   1) Ilova ma'lumotlari — site/app = {operator, email, pkg, sha[]}: administrator «Sayt boshqaruvi → 📱 Ilova»da
      kiritadi. operator va email ochiq /privacy va /delete-account sahifalarida ko'rinadi; pkg + sha (ilova imzosi
      izi) — /.well-known/assetlinks.json da (usiz ilova tepasida brauzer manzil satri ko'rinib qoladi).
   2) Hisobni o'chirish so'rovi — site/deleteRequests/<foydalanuvchi> = {uid, name, group, role, at, reason}:
      foydalanuvchi profilida so'raydi (va bekor qila oladi), administrator tasdiqlasa hisob va shaxsiy ma'lumotlar
      o'chiriladi (nusxa saqlanmaydi), rad etsa — so'rov olib tashlanadi.
   site/* bo'limiga brauzerlar tegolmaydi — faqat server o'qiydi va yozadi. */

export type AppInfo = { operator: string; email: string; pkg: string; sha: string[] };
const EMPTY: AppInfo = { operator: '', email: '', pkg: '', sha: [] };
const SHA = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
/** «ab:cd…», «ABCD…» yoki bo'shliqli ko'rinishdagi SHA-256 izini bir xil ko'rinishga keltiradi (AB:CD:…). */
export function normalizeSha(v: string) {
  const hex = String(v)
    .replace(/[^0-9a-fA-F]/g, '')
    .toUpperCase();
  return hex.length === 64 ? hex.match(/../g)!.join(':') : '';
}
function normalize(raw: Partial<AppInfo> | null): AppInfo {
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  return {
    operator: s(raw?.operator, 120),
    email: s(raw?.email, 120),
    pkg: s(raw?.pkg, 150),
    sha: (Array.isArray(raw?.sha) ? raw!.sha : [])
      .map((x) => normalizeSha(String(x)))
      .filter((x) => SHA.test(x))
      .slice(0, 6),
  };
}
/* Kesh globalThis da: sahifa va API bitta jarayonda alohida modul nusxalarida ishlasa ham bitta kesh bo'ladi. */
const mem = ((
  globalThis as { __sqAppInfo?: { c: { v: AppInfo; at: number } | null } }
).__sqAppInfo ??= { c: null });
/** Sinovlar uchun: keshni unutish. */
export function forgetAppInfo() {
  mem.c = null;
}
/** Ilova ma'lumotlari (bir daqiqa xotirada saqlanadi — ochiq sahifalar tez-tez so'raydi). */
export async function appInfo(): Promise<AppInfo> {
  const cache = mem.c;
  if (cache && Date.now() - cache.at < 60000) return cache.v;
  let v = EMPTY;
  try {
    v = normalize(await siteGet<Partial<AppInfo>>('app'));
  } catch {}
  mem.c = { v, at: Date.now() };
  return v;
}
/** Digital Asset Links: sayt va Android ilovasi bir egaga tegishli ekanini Google'ga tasdiqlaydi. */
export function assetLinks(info: AppInfo) {
  if (!info.pkg || !info.sha.length) return [];
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: info.pkg,
        sha256_cert_fingerprints: info.sha,
      },
    },
  ];
}

/* ---------- 🗑 hisobni o'chirish so'rovlari ---------- */
export type DeleteRequest = {
  uid: string;
  name: string;
  group: string;
  role: string;
  lt?: string;
  at: number;
  reason?: string;
};
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);

export async function deletionStatus(a: Actor) {
  const r = await siteGet<DeleteRequest>('deleteRequests/' + keyOf(a.id));
  return { pending: r?.at || null };
}
/** Foydalanuvchi: hisobimni o'chiring. Administrator tasdiqlaguncha hisob ishlayveradi; bekor qilish mumkin. */
export async function requestDeletion(a: Actor, raw: unknown, now = Date.now()) {
  const v = z
    .object({ reason: z.string().trim().max(300).optional(), confirm: z.literal(true) })
    .strict()
    .parse(raw);
  check(
    a.role !== 'admin',
    400,
    'Administrator hisobi platformaning o‘zi — uni shu yerdan o‘chirib bo‘lmaydi.',
  );
  const rec: DeleteRequest = {
    uid: a.id,
    name: a.name.slice(0, 120),
    group: (a.classId || '').slice(0, 40),
    role: a.role,
    ...(a.learnerType ? { lt: a.learnerType } : {}),
    at: now,
    ...(v.reason ? { reason: v.reason } : {}),
  };
  await siteUpdate({ ['deleteRequests/' + keyOf(a.id)]: rec });
  return { pending: now };
}
export async function cancelDeletion(a: Actor) {
  await siteUpdate({ ['deleteRequests/' + keyOf(a.id)]: null });
  return { pending: null };
}

type Read = (path: string) => Promise<unknown>;
type Update = (patch: Record<string, unknown>) => Promise<unknown>;
const readDefault: Read = async (path) => (await legacyDb().ref(path).get()).val();
const updateDefault: Update = async (patch) => legacyDb().ref().update(patch);

/** Talabaning hisobi va shaxsiy ma'lumotlarini butunlay o'chirish (nusxa saqlanmaydi; jurnalda faqat id va vaqt). */
async function eraseAccount(by: Actor, r: DeleteRequest, read: Read, update: Update, now: number) {
  const key = keyOf(r.uid);
  const site: Record<string, unknown> = {
    ['deleteRequests/' + key]: null,
    ['newsSeen/' + key]: null,
    ['slides/' + key]: null,
    ['premium/' + key]: null,
  };
  const subs = (await siteGet<Record<string, { uid?: string }>>('push/subs')) || {};
  for (const [k, s] of Object.entries(subs)) if (s?.uid === r.uid) site['push/subs/' + k] = null;
  // sinovda (read/update berilganda) ham ishlaydi; demo muhitda jonli bazaga tegilmaydi
  const real = !demo() || read !== readDefault;
  if (r.uid.startsWith('legacy_') && real) {
    const sid = r.uid.slice(7);
    check(/^[a-zA-Z0-9_-]{1,100}$/.test(sid), 400, 'Hisob noto‘g‘ri');
    const exists = await read('students/' + sid);
    if (exists)
      await update({
        ['students/' + sid]: null,
        ['keys/' + sid]: null,
        ['owners/' + sid]: null,
        ['priv/' + sid]: null,
        ['support/' + key]: null,
        ['meta/deletedStudentIds/' + sid]: true,
        ['adminAudit/' + randomUUID()]: {
          action: 'eraseStudent',
          studentId: sid,
          by: by.uid,
          at: now,
          why: 'self-request',
        },
      });
  } else if (!r.uid.startsWith('legacy_') && !demo()) {
    // email bilan ro'yxatdan o'tgan foydalanuvchi: kirish hisobi (Firebase Auth) ham o'chiriladi
    await authAdmin()
      .deleteUser(r.uid)
      .catch(() => {});
    await update({ ['support/' + key]: null }).catch(() => {});
  }
  // yangi platformadagi yozuv (profil, XP, o'qish tarixi) — imkon bo'lsa o'chiriladi
  try {
    await (await repository()).transaction(async (tx) => tx.delete('users', r.uid));
  } catch {}
  await siteUpdate(site);
}

/* ---------- 🛠 administrator bo'limi ---------- */
export async function appAdmin(a: Actor) {
  administrator(a);
  const [info, raw] = await Promise.all([
    siteGet<Partial<AppInfo>>('app').then(normalize),
    siteGet<Record<string, DeleteRequest>>('deleteRequests'),
  ]);
  return {
    info,
    requests: Object.values(raw || {})
      .filter((x) => x && typeof x.uid === 'string')
      .sort((x, y) => x.at - y.at),
    ready: {
      policy: !!info.operator && !!info.email,
      links: !!info.pkg && info.sha.length > 0,
    },
  };
}
export type AppAdminView = Awaited<ReturnType<typeof appAdmin>>;

const email = z
  .string()
  .trim()
  .max(120)
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), 'Email manzil noto‘g‘ri.');
const adminInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('save'),
      operator: z.string().trim().max(120),
      email,
      pkg: z
        .string()
        .trim()
        .max(150)
        .refine(
          (v) => !v || /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+$/i.test(v),
          'Paket nomi «uz.terdu.tadbirkorlik» ko‘rinishida bo‘ladi.',
        ),
      sha: z.array(z.string().max(200)).max(6),
    })
    .strict(),
  z.object({ op: z.literal('approve'), uid: z.string().min(1).max(140) }).strict(),
  z.object({ op: z.literal('reject'), uid: z.string().min(1).max(140) }).strict(),
]);
/** Administrator: ilova ma'lumotlarini saqlash; o'chirish so'rovini tasdiqlash yoki rad etish. */
export async function manageApp(
  a: Actor,
  raw: unknown,
  now = Date.now(),
  read = readDefault,
  update = updateDefault,
) {
  administrator(a);
  const p = adminInput.parse(raw);
  if (p.op === 'save') {
    const sha = p.sha.map((x) => x.trim()).filter(Boolean);
    const fixed = sha.map(normalizeSha);
    check(
      fixed.every((x) => SHA.test(x)),
      400,
      'SHA-256 izi 64 ta belgidan iborat (masalan: 14:6D:E9:…). Play Console → App integrity dan nusxalang.',
    );
    await siteUpdate({
      app: { operator: p.operator, email: p.email, pkg: p.pkg, sha: [...new Set(fixed)] },
    });
    mem.c = null;
    return appAdmin(a);
  }
  const key = keyOf(p.uid);
  const r = await siteGet<DeleteRequest>('deleteRequests/' + key);
  check(r && r.uid === p.uid, 404, 'So‘rov topilmadi (bekor qilingan bo‘lishi mumkin).');
  if (p.op === 'reject') await siteUpdate({ ['deleteRequests/' + key]: null });
  else await eraseAccount(a, r!, read, update, now);
  return appAdmin(a);
}
