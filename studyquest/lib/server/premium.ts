import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import type { PremiumInfo, PremiumState } from '../library';
import { administrator, check } from './auth';
import { DEFAULT_LOOK, isLook } from '../premium-look';
import { PLANS, type ClaimStatus, type MyClaim } from '../premium-plans';
import { imageType, siteGet, siteTransaction, siteUpdate, storeBlob } from './site-content';
import { BUDGET_MAX, PAY_MIN } from '../services';

/* 💎 Obuna (premium): pullik imkoniyatlar (kutubxonadagi 💎 manbalar, avatar) uchun.
   To'lov tizimi ulanguncha obunani administrator qo'lda beradi: talaba ko'rsatilgan usulda to'laydi, administrator
   «Sayt boshqaruvi → 💎 Obuna»da muddatini belgilaydi. Keyin to'lov tizimi (Click, Payme …) ulanganda u ham shu
   yozuvni yangilaydi: site/premium/<foydalanuvchi> = {uid, name, group, until, at, by, hist}; hist — har bir
   ochilish: qachon, necha kunga, qancha to'langan (chek qabul qilinganda) va kim ochgan.
   site/premiumInfo = {card, holder, how, price} — karta va yo'riqnoma (talabaga ko'rsatiladi). Narx ixtiyoriy.

   🛒 O'zi obuna bo'lish (talaba): «Obuna bo'lish» → muddat (1 oy / 1 yil) va karta → istalgan summani to'laydi →
   «To'lov qildim» → summa va to'lov vaqti yoki chek → «Yuborish». To'lov tekshiruvga tushadi va
   administrator «To'lov keldi»ni bosgach obuna ochiladi yoki uzayadi. Bir vaqtda bitta to'lov tekshiriladi.
   Chekni faqat administrator ko'radi (/api/premium?receipt=…). */

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
  servicePayments?: Record<string, true>;
  /** joriy (uzluksiz) obuna boshlangan vaqt — «muddatni o'zgartirish» shundan hisoblanadi */
  since?: number;
};
type Claim = {
  id: string;
  uid: string;
  name: string;
  group: string;
  /** so‘ralgan yoki tasdiqlangan muddat (kun) */
  days: number;
  /** talaba to'lagan summa (so'm) */
  amount: number;
  /** talaba yozgan to'lov vaqti */
  paidAt?: number;
  /** chek rasmi yuklangan */
  receipt?: true;
  at: number;
  status: ClaimStatus;
  /** Eski to‘lovlarda muddat yuborish paytida berilgan. */
  requiresApproval?: true;
  decidedAt?: number;
  by?: string;
};
type Block = { at: number; by: string; name: string };
type PremiumRecords = {
  premium?: Record<string, Grant>;
  premiumClaims?: Record<string, Record<string, Claim>>;
  premiumBlock?: Record<string, Block>;
};
const DAY = 86400000;
const RECEIPT_MAX = 1_200_000;
const CLAIMS_MAX = 60;
const HIST_MAX = 30;
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
export const premiumKey = keyOf;

function normalizeInfo(raw: Partial<PremiumInfo> | null): PremiumInfo {
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  return {
    price: s(raw?.price, 80),
    how: s(raw?.how, 600),
    card: s(raw?.card, 40),
    holder: s(raw?.holder, 80),
  };
}
export async function premiumInfo(): Promise<PremiumInfo> {
  return normalizeInfo(await siteGet<Partial<PremiumInfo>>('premiumInfo'));
}
const staff = (a: Pick<Actor, 'role'>) => a.role === 'admin' || a.role === 'teacher';
/** Foydalanuvchining obunasi (o'qituvchi va administratorga hamma narsa ochiq). */
export async function premiumState(a: Actor, now = Date.now()): Promise<PremiumState> {
  if (staff(a)) return { active: true, until: 0, staff: true };
  const [grant, look, claims] = await Promise.all([
    siteGet<Grant>('premium/' + keyOf(a.id)),
    siteGet<string>('premiumLook/' + keyOf(a.id)).catch(() => null),
    siteGet<Record<string, Claim>>('premiumClaims/' + keyOf(a.id)),
  ]);
  const until = Number(approvedGrant(grant, claims)?.until) || 0;
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
/* 🏅 Obunachining o'z Premium belgisi: ism yonidagi belgini bosib telefonidan rasm yuklaydi (faqat o'ziga ko'rinadi).
   Rasm site/blob/pm-<xesh> da, yozuv site/premiumMark/<foydalanuvchi> = {k, v}; manzil /api/site/img/pm-…?v=… */
const MARK_MAX = 300 * 1024;
const markBlobKey = (uid: string) =>
  'pm-' + createHash('sha256').update(uid).digest('hex').slice(0, 20);
type MarkRecord = { k: string; v: string };
async function premiumMark(a: Actor) {
  const m = await siteGet<MarkRecord>('premiumMark/' + keyOf(a.id)).catch(() => null);
  return m?.k && m.v ? '/api/site/img/' + m.k + '?v=' + m.v : undefined;
}
/** Obunachi belgisini almashtiradi (img — rasmning base64 matni) yoki asl TerDU belgisiga qaytaradi (null). */
export async function setPremiumMark(a: Actor, img: unknown, now = Date.now()) {
  const st = await premiumState(a, now);
  check(st.active && !st.staff, 403, 'O‘z belgingizni qo‘yish — Premium obunachilar uchun.');
  const key = keyOf(a.id),
    k = markBlobKey(a.id);
  if (img === null) {
    await siteUpdate({ ['premiumMark/' + key]: null, ['blob/' + k]: null });
    return premiumView(a, now);
  }
  check(typeof img === 'string' && /^[A-Za-z0-9+/]+=*$/.test(img), 400, 'Rasm topilmadi.');
  const bytes = Buffer.from(img as string, 'base64');
  check(bytes.length <= MARK_MAX, 413, 'Belgi rasmi 300 KB dan oshmasin.');
  const { v } = await storeBlob(k, bytes, now);
  await siteUpdate({ ['premiumMark/' + key]: { k, v } });
  return premiumView(a, now);
}
/** Hisob o'chirilganda: belgi yozuvi va rasmi. */
export function forgetPremiumMark(uid: string) {
  return { ['premiumMark/' + keyOf(uid)]: null, ['blob/' + markBlobKey(uid)]: null } as Record<
    string,
    unknown
  >;
}
export async function premiumView(a: Actor, now = Date.now()) {
  const key = keyOf(a.id);
  const [state, info, mark, claims, block, serviceHow] = await Promise.all([
    premiumState(a, now),
    premiumInfo(),
    premiumMark(a),
    siteGet<Record<string, Claim>>('premiumClaims/' + key).catch(() => null),
    siteGet<Block>('premiumBlock/' + key).catch(() => null),
    // karta yozilmagan bo'lsa — «Pullik xizmatlar» yo'riqnomasi (avval karta raqami o'sha yerda edi)
    siteGet<{ how?: string }>('serviceInfo')
      .then((v) => v?.how || '')
      .catch(() => ''),
  ]);
  const last = Object.values(claims || {})
    .filter((c) => c?.id)
    .sort((x, y) => y.at - x.at)[0];
  const claim: MyClaim | undefined = last
    ? { id: last.id, amount: last.amount || 0, days: last.days, at: last.at, status: last.status }
    : undefined;
  return {
    state,
    info: { ...info, how: info.how || serviceHow },
    now,
    ...(state.active && !state.staff && mark ? { mark } : {}),
    ...(claim ? { claim } : {}),
    ...(block?.at ? { blocked: true } : {}),
  };
}

const subscribeInput = z
  .object({
    /** muddat: 1 oy yoki 1 yil */
    plan: z.enum(['oy', 'yil']),
    /** to'lagan summasi (so'm) — narx ixtiyoriy */
    amount: z.number().int().min(PAY_MIN).max(BUDGET_MAX),
    /** to'lov vaqti (ms) */
    paidAt: z.number().int().positive().optional(),
    /** chek rasmi (base64) */
    receipt: z
      .string()
      .max(Math.ceil((RECEIPT_MAX * 4) / 3) + 8)
      .regex(/^[A-Za-z0-9+/]+=*$/)
      .optional(),
  })
  .strict();
/** Talaba to‘lov ma’lumotini administratorga tekshirish uchun yuboradi. */
export async function subscribe(a: Actor, raw: unknown, now = Date.now()) {
  const p = subscribeInput.parse(raw);
  check(!staff(a), 400, 'O‘qituvchi va administratorda obuna doim ochiq.');
  check(
    p.paidAt !== undefined || !!p.receipt,
    400,
    'To‘lov qilingan vaqtni yozing yoki chek rasmini yuklang.',
  );
  if (p.paidAt !== undefined)
    check(
      p.paidAt >= now - 3 * DAY && p.paidAt <= now + 10 * 60000,
      400,
      'To‘lov vaqti noto‘g‘ri: oxirgi 3 kun ichidagi aniq vaqtni kiriting.',
    );
  let bytes: Buffer | null = null,
    type: string | null = null;
  if (p.receipt) {
    bytes = Buffer.from(p.receipt, 'base64');
    check(bytes.length > 0 && bytes.length <= RECEIPT_MAX, 413, 'Chek rasmi 1 MB dan oshmasin.');
    type = imageType(bytes);
    check(type, 400, 'Chek uchun PNG, JPG yoki WEBP rasm yuklang.');
  }
  const key = keyOf(a.id);
  const plan = PLANS.find((x) => x.id === p.plan)!;
  check(
    !(await siteGet<Block>('premiumBlock/' + key))?.at,
    403,
    'Obunangizni administrator yopgan: to‘lovingiz topilmagan. Savol bo‘lsa, «Adminga xabar» orqali yozing.',
  );
  const id = now.toString(36) + randomBytes(3).toString('hex');
  const name = (a.name || 'Foydalanuvchi').slice(0, 120),
    group = String(a.classId || '').slice(0, 40);
  const claim: Claim = {
    id,
    uid: a.id,
    name,
    group,
    days: plan.days,
    amount: p.amount,
    ...(p.paidAt !== undefined ? { paidAt: p.paidAt } : {}),
    ...(bytes ? { receipt: true as const } : {}),
    at: now,
    status: 'new',
    requiresApproval: true,
  };
  // bir vaqtda bitta tekshirilmagan to'lov (ikki marta bosilsa ham — tranzaksiya)
  const receiptPath = 'premiumReceipts/' + key + '/' + id;
  if (bytes) await siteUpdate({ [receiptPath]: { t: type, d: p.receipt } });
  let problem = '';
  await siteTransaction<Record<string, Claim>>('premiumClaims/' + key, (cur) => {
    const list = Object.values(cur || {}).filter((c) => c?.id);
    problem = list.some((c) => c.status === 'new')
      ? 'Oldingi to‘lovingiz hali tekshirilmoqda. Javobni kuting.'
      : list.length >= CLAIMS_MAX
        ? 'To‘lovlar ro‘yxati to‘ldi. «Adminga xabar» orqali yozing.'
        : '';
    return problem ? cur : { ...(cur || {}), [id]: claim };
  });
  if (problem && bytes) await siteUpdate({ [receiptPath]: null });
  check(!problem, 409, problem);
  await notify(
    (s) => s.role === 'admin',
    '💎 Obuna uchun yangi to‘lov',
    name +
      (group ? ' (' + group + ')' : '') +
      ' · ' +
      plan.name[0] +
      ' · ' +
      p.amount.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') +
      ' so‘m — to‘lovni tekshiring',
    '/#admin',
  );
  return premiumView(a, now);
}
/** Bildirishnoma (yuborilmasa ham amal bajarilgan bo'ladi). */
async function notify(
  who: (s: { uid: string; role?: string }) => boolean,
  t: string,
  b: string,
  u = '/',
) {
  try {
    const { sendPush } = await import('./push');
    await sendPush({ t, b, u, g: 'premium' }, who);
  } catch {}
}
/** 🧾 Chek rasmi — faqat administrator. */
export async function premiumReceipt(a: Actor, uid: string, id: string) {
  administrator(a);
  check(/^[A-Za-z0-9_-]{1,140}$/.test(uid) && /^[a-z0-9]{6,30}$/.test(id), 400, 'Chek topilmadi.');
  const r = await siteGet<{ t: string; d: string }>('premiumReceipts/' + keyOf(uid) + '/' + id);
  check(r?.d && r.t, 404, 'Chek topilmadi.');
  return { type: r!.t, bytes: Buffer.from(r!.d, 'base64') };
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
/** Joriy uzluksiz obuna boshlangan vaqt: saqlangan bo'lsa — o'zi, eski yozuvlarda — tarixdan tiklanadi. */
export function sinceOf(g: Grant) {
  if (Number(g.since) > 0) return Number(g.since);
  let since = 0,
    end = 0;
  for (const t of terms(g).sort((x, y) => x.at - y.at)) {
    if (t.at >= end) since = t.at;
    end = Math.max(end, t.at) + t.days * DAY;
  }
  return since || Math.max(0, Number(g.until) - 30 * DAY);
}
/** Eski, hali tasdiqlanmagan to‘lov bergan muddatni Premium hisobidan chiqaradi. */
function approvedGrant(grant: Grant | null, claims: Record<string, Claim> | null): Grant | null {
  if (!grant) return null;
  const pending = Object.values(claims || {}).find(
    (c) => c?.status === 'new' && !c.requiresApproval,
  );
  if (!pending) return grant;
  const hist = terms(grant);
  const index = hist.findIndex((term) => term.at === pending.at && term.by === 'O‘zi (to‘lov)');
  if (index < 0) return grant;
  const current = hist.filter((term) => term.at >= sinceOf(grant));
  const approved = current.filter((term) => term !== hist[index]);
  const untilFor = (list: PremiumTerm[]) =>
    list.reduce((until, term) => Math.max(until, term.at) + term.days * DAY, 0);
  if (current.length && !approved.length) {
    return index
      ? {
          ...grant,
          hist: hist.slice(0, index),
          until: Math.min(pending.at, untilFor(hist.slice(0, index))),
          since: 0,
        }
      : null;
  }
  return {
    ...grant,
    until: grant.until - (untilFor(current) - untilFor(approved)),
    since: approved[0]?.at || sinceOf(grant),
    hist: hist.filter((_, i) => i !== index),
  };
}
const claimView = (c: Claim) => ({
  id: c.id,
  uid: c.uid,
  name: c.name,
  group: c.group || '',
  days: c.days,
  amount: c.amount || 0,
  ...(c.paidAt ? { paidAt: c.paidAt } : {}),
  ...(c.receipt ? { receipt: true as const } : {}),
  at: c.at,
  status: c.status,
  ...(c.decidedAt ? { decidedAt: c.decidedAt } : {}),
  ...(c.by ? { by: c.by } : {}),
});
export type PremiumClaimView = ReturnType<typeof claimView>;

function paymentClaims(raw: PremiumRecords['premiumClaims'] | null) {
  return Object.values(raw || {})
    .flatMap((m) => Object.values(m || {}))
    .filter((c) => c?.id && c.uid)
    .map(claimView)
    .sort((x, y) => y.at - x.at);
}

export async function listPremiumPayments(a: Actor) {
  administrator(a);
  return paymentClaims(await siteGet<PremiumRecords['premiumClaims']>('premiumClaims'));
}

/** Administrator: yangi (tekshirilmagan) obunalar, obunachilar (boshlanishi, tugashi, to'lovlar tarixi bilan),
    yopilganlar va «Pullik xizmatlar» orqali kelgan eski cheklar. */
export async function premiumAdmin(a: Actor, now = Date.now()) {
  administrator(a);
  const [raw, info, pending, claimsRaw, blocksRaw] = await Promise.all([
    siteGet<Record<string, Grant>>('premium'),
    premiumInfo(),
    // 🧾 eski tartib: «Pullik xizmatlar» buyurtmasi orqali yuborilgan cheklar
    import('./services').then((m) => m.premiumPending()),
    siteGet<Record<string, Record<string, Claim>>>('premiumClaims'),
    siteGet<Record<string, Block>>('premiumBlock'),
  ]);
  const claims = paymentClaims(claimsRaw);
  const lastClaim = new Map<string, PremiumClaimView>();
  for (const c of claims) if (!lastClaim.has(c.uid)) lastClaim.set(c.uid, c);
  const grants = Object.entries(raw || {})
    .map(([key, g]) => approvedGrant(g, claimsRaw?.[key] || null))
    .filter((g): g is Grant => g !== null)
    .filter((g) => g && typeof g.uid === 'string' && Number(g.until) > 0)
    .map((g) => {
      const hist = terms(g);
      const since = sinceOf(g);
      return {
        uid: g.uid,
        name: g.name,
        group: g.group || '',
        until: Number(g.until),
        since,
        /** joriy obuna muddati (kun) — boshlanishidan tugashigacha */
        term: Math.max(1, Math.round((Number(g.until) - since) / DAY)),
        at: Number(g.at) || 0,
        by: g.by || '',
        hist,
        days: hist.reduce((n, t) => n + t.days, 0),
        paid: hist.reduce((n, t) => n + (t.amount || 0), 0),
        ...(lastClaim.has(g.uid) ? { claim: lastClaim.get(g.uid) } : {}),
      };
    })
    .sort((x, y) => y.until - x.until);
  const blocked = Object.entries(blocksRaw || {})
    .filter(([, b]) => b?.at)
    .map(([key, b]) => ({ key, name: b.name || key, at: b.at, by: b.by || '' }))
    .sort((x, y) => y.at - x.at);
  const fresh = claims.filter((c) => c.status === 'new');
  return {
    info,
    /** Tasdiqlash kutilayotgan to‘lovlar. */
    fresh,
    grants,
    blocked,
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
      op: z.literal('remove'),
      uid: z.string().min(1).max(140),
      block: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal('verify'),
      uid: z.string().min(1).max(140),
      id: z.string().max(40),
      /** tasdiqlanadigan muddat (kun) */
      days: z.number().int().min(1).max(730).optional(),
    })
    .strict(),
  z
    .object({ op: z.literal('reject'), uid: z.string().min(1).max(140), id: z.string().max(40) })
    .strict(),
  z
    .object({
      op: z.literal('term'),
      uid: z.string().min(1).max(140),
      days: z.number().int().min(1).max(730),
    })
    .strict(),
  z.object({ op: z.literal('unblock'), key: z.string().min(1).max(140) }).strict(),
  z
    .object({
      op: z.literal('info'),
      price: z.string().trim().max(80).optional(),
      how: z.string().trim().max(600),
      card: z.string().trim().max(40).optional(),
      holder: z.string().trim().max(80).optional(),
    })
    .strict(),
]);
/** Chek bo‘yicha qaror va obuna muddati bir tranzaksiyada saqlanadi. */
export async function reviewPremiumClaim(
  a: Actor,
  p: Extract<z.infer<typeof input>, { op: 'verify' | 'reject' }>,
  now = Date.now(),
) {
  administrator(a);
  const by = (a.name || a.id).slice(0, 60);
  const key = keyOf(p.uid);
  check(/^[a-z0-9]{6,30}$/.test(p.id), 400, 'To‘lov topilmadi.');
  // Qaror va obuna bir tranzaksiyada saqlanadi, hatto ikki admin bir vaqtda bossa ham.
  let problem = 404;
  await siteTransaction<PremiumRecords>('', (site) => {
    const claims = site?.premiumClaims?.[key];
    const c = claims?.[p.id];
    problem = c?.uid !== p.uid ? 404 : c.status !== 'new' ? 409 : 0;
    if (!site || !claims || !c || problem) return site;
    if (p.op === 'verify' && site.premiumBlock?.[key]?.at) {
      problem = 403;
      return site;
    }
    const grant = approvedGrant(site.premium?.[key] || null, claims);
    const days = p.op === 'verify' ? (p.days ?? c.days) : c.days;
    claims[p.id] = {
      ...c,
      days,
      status: p.op === 'verify' ? 'ok' : 'removed',
      decidedAt: now,
      by,
    };
    if (p.op === 'verify') {
      (site.premium ??= {})[key] = extendGrant(
        grant,
        c.uid,
        c.name,
        c.group,
        days,
        by,
        now,
        c.amount,
      );
    } else if (!c.requiresApproval && site.premium) {
      if (grant) site.premium[key] = grant;
      else delete site.premium[key];
    }
    return site;
  });
  check(problem !== 403, 403, 'Avval foydalanuvchini blokdan chiqaring.');
  check(
    !problem,
    problem,
    problem === 404 ? 'To‘lov topilmadi.' : 'Bu to‘lov allaqachon ko‘rib chiqilgan.',
  );
  await notify(
    (s) => s.uid === p.uid,
    p.op === 'verify' ? '💎 To‘lov tasdiqlandi' : '💎 To‘lov tasdiqlanmadi',
    p.op === 'verify'
      ? 'Premium obunangiz faollashtirildi.'
      : 'Savol bo‘lsa, «Adminga xabar» orqali yozing.',
  );
}

/** Administrator: obuna berish (muddat mavjud obunaga qo'shiladi), tasdiqlash, muddatni o'zgartirish, chiqarib
    tashlash (xohlasa — o'zi qayta obuna bo'la olmasin), blokdan chiqarish, karta va narxlarni saqlash. */
export async function managePremium(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const p = input.parse(raw);
  const by = (a.name || a.id).slice(0, 60);
  if (p.op === 'info') {
    const cur = await premiumInfo();
    await siteUpdate({
      premiumInfo: normalizeInfo({
        ...cur,
        how: p.how,
        ...(p.price !== undefined ? { price: p.price } : {}),
        ...(p.card !== undefined ? { card: p.card } : {}),
        ...(p.holder !== undefined ? { holder: p.holder } : {}),
      }),
    });
  } else if (p.op === 'revoke' || p.op === 'remove') {
    const key = keyOf(p.uid);
    const [g, claims] = await Promise.all([
      siteGet<Grant>('premium/' + key),
      siteGet<Record<string, Claim>>('premiumClaims/' + key),
    ]);
    const o: Record<string, unknown> = { ['premium/' + key]: null };
    // tekshirilmagan to'lovlar — «topilmadi»
    for (const c of Object.values(claims || {}))
      if (c?.id && c.status === 'new')
        Object.assign(o, {
          ['premiumClaims/' + key + '/' + c.id + '/status']: 'removed',
          ['premiumClaims/' + key + '/' + c.id + '/decidedAt']: now,
          ['premiumClaims/' + key + '/' + c.id + '/by']: by,
        });
    if (p.op === 'remove' && p.block !== false)
      o['premiumBlock/' + key] = {
        at: now,
        by,
        name: (g?.name || Object.values(claims || {})[0]?.name || p.uid).slice(0, 120),
      };
    await siteUpdate(o);
    if (p.op === 'remove')
      await notify(
        (s) => s.uid === p.uid,
        '💎 Obuna yopildi',
        'To‘lovingiz topilmadi. Savol bo‘lsa, «Adminga xabar» orqali yozing.',
      );
  } else if (p.op === 'verify' || p.op === 'reject') {
    await reviewPremiumClaim(a, p, now);
  } else if (p.op === 'term') {
    const key = keyOf(p.uid);
    const g = await siteGet<Grant>('premium/' + key);
    check(g?.uid, 404, 'Obunachi topilmadi.');
    const since = sinceOf(g!);
    const until = since + p.days * DAY;
    check(
      until > now,
      400,
      'Bu muddat allaqachon tugagan (obuna ' +
        new Date(since + 18000000).toISOString().slice(0, 10) +
        ' da boshlangan). Kattaroq muddat tanlang.',
    );
    await siteUpdate({ ['premium/' + key]: { ...g, until, since, at: now, by } });
  } else if (p.op === 'unblock') {
    check(/^[A-Za-z0-9_-]{1,120}$/.test(p.key), 400, 'Foydalanuvchi topilmadi.');
    await siteUpdate({ ['premiumBlock/' + p.key]: null });
  } else {
    await grantPremium(p.uid, p.name, p.group || '', p.days, by, now);
    // administrator o'zi ochdi — blok olinadi
    await siteUpdate({ ['premiumBlock/' + keyOf(p.uid)]: null });
  }
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
  serviceOrder?: string,
) {
  return siteTransaction<Grant>('premium/' + keyOf(uid), (cur) => {
    if (serviceOrder && cur?.servicePayments?.[serviceOrder] === true) return cur;
    const next = extendGrant(cur, uid, name, group, days, by, now, amount);
    if (serviceOrder) next.servicePayments = { ...next.servicePayments, [serviceOrder]: true };
    return next;
  });
}

function extendGrant(
  cur: Grant | null,
  uid: string,
  name: string,
  group: string,
  days: number,
  by: string,
  now: number,
  amount: number,
): Grant {
  const active = Number(cur?.until) > now;
  const from = Math.max(now, Number(cur?.until) || 0);
  const term: PremiumTerm = {
    at: now,
    days,
    ...(amount > 0 ? { amount } : {}),
    by: by.slice(0, 60),
  };
  return {
    uid,
    name: name.slice(0, 120),
    group: group.slice(0, 40),
    until: from + days * 86400000,
    at: now,
    by: by.slice(0, 60),
    // tarix saqlanadi (muddati tugab, qayta obuna bo'lsa ham)
    hist: [...(cur ? terms(cur) : []), term].slice(-HIST_MAX),
    ...(cur?.servicePayments ? { servicePayments: cur.servicePayments } : {}),
    // uzluksiz obuna boshlanishi: amaldagi obuna uzaytirilsa — o'zgarmaydi
    since: active && cur ? sinceOf(cur) : now,
  };
}
/** Barcha amaldagi obunalar: foydalanuvchi id → tugash vaqti (avatar huquqi uchun). */
export async function activePremium(now = Date.now()) {
  const [raw, claims] = await Promise.all([
    siteGet<Record<string, Grant>>('premium'),
    siteGet<NonNullable<PremiumRecords['premiumClaims']>>('premiumClaims'),
  ]);
  const out: Record<string, number> = {};
  for (const [key, row] of Object.entries(raw || {})) {
    const g = approvedGrant(row, claims?.[key] || null);
    if (g?.uid && Number(g.until) > now) out[g.uid] = g.until;
  }
  return out;
}
