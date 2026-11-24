import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import type { PremiumInfo, PremiumState } from '../library';
import { administrator, check } from './auth';
import { DEFAULT_LOOK, isLook } from '../premium-look';
import { siteGet, siteUpdate } from './site-content';

/* 💎 Obuna (premium): pullik imkoniyatlar (kurs darslari — talaba bo'lmaganlarga, kutubxonadagi 💎 manbalar, avatar) uchun.
   To'lov tizimi ulanguncha obunani administrator qo'lda beradi: talaba ko'rsatilgan usulda to'laydi, administrator
   «Sayt boshqaruvi → 💎 Obuna»da muddatini belgilaydi. Keyin to'lov tizimi (Click, Payme …) ulanganda u ham shu
   yozuvni yangilaydi: site/premium/<foydalanuvchi> = {uid, name, group, until, at, by, hist}; hist — har bir
   ochilish: qachon, necha kunga, qancha to'langan (chek qabul qilinganda) va kim ochgan.
   site/premiumInfo = {price, how} — narx va to'lov yo'riqnomasi (talabaga ko'rsatiladi). */

/** 💳 Obunaning bir ochilishi: chek qabul qilinganda — to'langan summa bilan, qo'lda berilganda — summasiz. */
export type PremiumTerm = { at: number; days: number; amount?: number; by: string };
export type Grant = {
  uid: string;
  name: string;
  group: string;
  until: number;
  at: number;
  by: string;
  hist?: PremiumTerm[];
};
const HIST_MAX = 30;
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
export const premiumKey = keyOf;

function normalizeInfo(raw: Partial<PremiumInfo> | null): PremiumInfo {
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  return { price: s(raw?.price, 80), how: s(raw?.how, 600) };
}
export async function premiumInfo(): Promise<PremiumInfo> {
  return normalizeInfo(await siteGet<Partial<PremiumInfo>>('premiumInfo'));
}
const staff = (a: Pick<Actor, 'role'>) => a.role === 'admin' || a.role === 'teacher';
/** Foydalanuvchining obunasi (o'qituvchi va administratorga hamma narsa ochiq). */
export async function premiumState(a: Actor, now = Date.now()): Promise<PremiumState> {
  if (staff(a)) return { active: true, until: 0, staff: true };
  const [g, look] = await Promise.all([
    siteGet<Grant>('premium/' + keyOf(a.id)),
    siteGet<string>('premiumLook/' + keyOf(a.id)).catch(() => null),
  ]);
  const until = Number(g?.until) || 0;
  return {
    active: until > now,
    until: until > now ? until : 0,
    staff: false,
    ...(until > now ? { look: isLook(look) ? look : DEFAULT_LOOK } : {}),
  };
}
/** 💎 Obunachi profil bezagini tanlaydi (obuna amalda bo'lishi kerak). */
export async function setPremiumLook(a: Actor, look: unknown, now = Date.now()) {
  check(isLook(look), 400, 'Bunday bezak yo‘q.');
  const st = await premiumState(a, now);
  check(st.active && !st.staff, 403, 'Profil bezagi — Premium obunachilar uchun.');
  await siteUpdate({ ['premiumLook/' + keyOf(a.id)]: look });
  return premiumView(a, now);
}
/** Obunachilar tanlagan bezaklar: foydalanuvchi kaliti → bezak (reyting uchun). */
export async function premiumLooks(): Promise<Record<string, string>> {
  return (await siteGet<Record<string, string>>('premiumLook')) || {};
}
/** Talaba sahifalari uchun: obuna holati va narx/to'lov yo'riqnomasi. */
export async function premiumView(a: Actor, now = Date.now()) {
  const [state, info] = await Promise.all([premiumState(a, now), premiumInfo()]);
  return { state, info, now };
}

const terms = (g: Grant) =>
  (Array.isArray(g.hist) ? g.hist : [])
    .filter((t) => t && Number(t.days) > 0)
    .map((t) => ({
      at: Number(t.at) || 0,
      days: Number(t.days),
      ...(Number(t.amount) > 0 ? { amount: Number(t.amount) } : {}),
      by: String(t.by || ''),
    }));
/** Administrator: obunachilar (muddat va to'langan summa tarixi bilan) va chek yuborib kutayotganlar. */
export async function premiumAdmin(a: Actor, now = Date.now()) {
  administrator(a);
  const [raw, info, pending] = await Promise.all([
    siteGet<Record<string, Grant>>('premium'),
    premiumInfo(),
    // 🧾 chek yuborganlar («Pullik xizmatlar» buyurtmalaridan)
    import('./services').then((m) => m.premiumPending()),
  ]);
  const grants = Object.values(raw || {})
    .filter((g) => g && typeof g.uid === 'string' && Number(g.until) > 0)
    .map((g) => {
      const hist = terms(g);
      return {
        uid: g.uid,
        name: g.name,
        group: g.group || '',
        until: Number(g.until),
        at: Number(g.at) || 0,
        by: g.by || '',
        hist,
        days: hist.reduce((n, t) => n + t.days, 0),
        paid: hist.reduce((n, t) => n + (t.amount || 0), 0),
      };
    })
    .sort((x, y) => y.until - x.until);
  return {
    info,
    grants,
    pending,
    active: grants.filter((g) => g.until > now).length,
    paid: grants.reduce((n, g) => n + g.paid, 0),
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
    })
    .strict(),
]);
/** Administrator: obuna berish (muddat mavjud obunaga qo'shiladi), bekor qilish, narx va yo'riqnomani saqlash. */
export async function managePremium(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const p = input.parse(raw);
  if (p.op === 'info') await siteUpdate({ premiumInfo: { price: p.price, how: p.how } });
  else if (p.op === 'revoke') await siteUpdate({ ['premium/' + keyOf(p.uid)]: null });
  else await grantPremium(p.uid, p.name, p.group || '', p.days, (a.name || a.id).slice(0, 60), now);
  return premiumAdmin(a, now);
}
/** Obuna berish (muddat mavjud obunaning ustiga qo'shiladi). Administrator ham, to'lov tizimi (Click) ham shuni chaqiradi.
    amount — to'langan summa (chek qabul qilinganda), tarixga yoziladi. */
export async function grantPremium(
  uid: string,
  name: string,
  group: string,
  days: number,
  by: string,
  now = Date.now(),
  amount = 0,
) {
  const key = keyOf(uid),
    cur = await siteGet<Grant>('premium/' + key);
  const from = Math.max(now, Number(cur?.until) || 0);
  const term: PremiumTerm = {
    at: now,
    days,
    ...(amount > 0 ? { amount } : {}),
    by: by.slice(0, 60),
  };
  const g: Grant = {
    uid,
    name: name.slice(0, 120),
    group: group.slice(0, 40),
    until: from + days * 86400000,
    at: now,
    by: by.slice(0, 60),
    // tarix saqlanadi (muddati tugab, qayta obuna bo'lsa ham)
    hist: [...(cur ? terms(cur) : []), term].slice(-HIST_MAX),
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
