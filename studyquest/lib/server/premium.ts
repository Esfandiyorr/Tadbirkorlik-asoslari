import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import type { PremiumInfo, PremiumState } from '../library';
import { administrator } from './auth';
import { siteGet, siteUpdate } from './site-content';

/* 💎 Obuna (premium): pullik imkoniyatlar (sun'iy intellekt taqdimoti, kutubxonadagi 💎 manbalar) uchun.
   To'lov tizimi ulanguncha obunani administrator qo'lda beradi: talaba ko'rsatilgan usulda to'laydi, administrator
   «Sayt boshqaruvi → 💎 Obuna»da muddatini belgilaydi. Keyin to'lov tizimi (Click, Payme …) ulanganda u ham shu
   yozuvni yangilaydi: site/premium/<foydalanuvchi> = {uid, name, group, until, at, by}.
   site/premiumInfo = {price, how, free} — narx va to'lov yo'riqnomasi (talabaga ko'rsatiladi), bepul sinov soni. */

export type Grant = {
  uid: string;
  name: string;
  group: string;
  until: number;
  at: number;
  by: string;
};
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
export const premiumKey = keyOf;

const INFO: PremiumInfo = { price: '', how: '', free: 1 };
function normalizeInfo(raw: Partial<PremiumInfo> | null): PremiumInfo {
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const f = Math.round(Number(raw?.free));
  return {
    price: s(raw?.price, 80),
    how: s(raw?.how, 600),
    free: Number.isFinite(f) && f >= 0 && f <= 20 ? f : INFO.free,
  };
}
export async function premiumInfo(): Promise<PremiumInfo> {
  return normalizeInfo(await siteGet<Partial<PremiumInfo>>('premiumInfo'));
}
const staff = (a: Pick<Actor, 'role'>) => a.role === 'admin' || a.role === 'teacher';
/** Foydalanuvchining obunasi (o'qituvchi va administratorga hamma narsa ochiq). */
export async function premiumState(a: Actor, now = Date.now()): Promise<PremiumState> {
  if (staff(a)) return { active: true, until: 0, staff: true };
  const g = await siteGet<Grant>('premium/' + keyOf(a.id));
  const until = Number(g?.until) || 0;
  return { active: until > now, until: until > now ? until : 0, staff: false };
}
/** Talaba sahifalari uchun: obuna holati va narx/to'lov yo'riqnomasi. */
export async function premiumView(a: Actor, now = Date.now()) {
  const [state, info] = await Promise.all([premiumState(a, now), premiumInfo()]);
  return { state, info, now };
}

export async function premiumAdmin(a: Actor, now = Date.now()) {
  administrator(a);
  const [raw, info] = await Promise.all([siteGet<Record<string, Grant>>('premium'), premiumInfo()]);
  const grants = Object.values(raw || {})
    .filter((g) => g && typeof g.uid === 'string' && Number(g.until) > 0)
    .sort((x, y) => y.until - x.until);
  return {
    info,
    grants,
    active: grants.filter((g) => g.until > now).length,
    now,
  };
}
export type PremiumAdminView = Awaited<ReturnType<typeof premiumAdmin>>;

const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('grant'),
      uid: z.string().min(1).max(140),
      name: z.string().trim().min(1).max(120),
      group: z.string().trim().max(40).optional(),
      days: z.number().int().min(1).max(730),
    })
    .strict(),
  z.object({ op: z.literal('revoke'), uid: z.string().min(1).max(140) }).strict(),
  z
    .object({
      op: z.literal('info'),
      price: z.string().trim().max(80),
      how: z.string().trim().max(600),
      free: z.number().int().min(0).max(20),
    })
    .strict(),
]);
/** Administrator: obuna berish (muddat mavjud obunaga qo'shiladi), bekor qilish, narx va yo'riqnomani saqlash. */
export async function managePremium(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const p = input.parse(raw);
  if (p.op === 'info')
    await siteUpdate({ premiumInfo: { price: p.price, how: p.how, free: p.free } });
  else if (p.op === 'revoke') await siteUpdate({ ['premium/' + keyOf(p.uid)]: null });
  else await grantPremium(p.uid, p.name, p.group || '', p.days, (a.name || a.id).slice(0, 60), now);
  return premiumAdmin(a, now);
}
/** Obuna berish (muddat mavjud obunaning ustiga qo'shiladi). Administrator ham, to'lov tizimi (Click) ham shuni chaqiradi. */
export async function grantPremium(
  uid: string,
  name: string,
  group: string,
  days: number,
  by: string,
  now = Date.now(),
) {
  const key = keyOf(uid),
    cur = await siteGet<Grant>('premium/' + key);
  const from = Math.max(now, Number(cur?.until) || 0);
  const g: Grant = {
    uid,
    name: name.slice(0, 120),
    group: group.slice(0, 40),
    until: from + days * 86400000,
    at: now,
    by: by.slice(0, 60),
  };
  await siteUpdate({ ['premium/' + key]: g });
  return g;
}
/** Barcha amaldagi obunalar: foydalanuvchi id → tugash vaqti (avatar huquqi uchun). */
export async function activePremium(now = Date.now()) {
  const raw = (await siteGet<Record<string, Grant>>('premium')) || {};
  const out: Record<string, number> = {};
  for (const g of Object.values(raw)) if (g?.uid && Number(g.until) > now) out[g.uid] = g.until;
  return out;
}
