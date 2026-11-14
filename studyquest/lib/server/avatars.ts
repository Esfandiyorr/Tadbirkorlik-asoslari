import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  AVATAR_ID,
  AVATAR_TOP,
  AVATAR_SHOP_DEFAULT,
  type AvatarItem,
  type AvatarOrder,
  type AvatarShop,
} from '../avatars';
import { administrator, ApiError, check } from './auth';
import { demo, legacyDb } from './repository';
import { siteGet, siteUpdate } from './site-content';
import { activePremium } from './premium';

/* 🎭 Avatarlar (mukofot): bitta avatar bir vaqtda faqat bitta talabada bo'ladi. Avatar olish huquqi:
     🏆 umumiy reytingda 1–10-o'rin, ✅ administrator ruxsati, 💎 obuna (premium) yoki 💳 sotib olingan muddat.
   Huquq tugasa (top-10 dan tushdi, obuna yoki sotib olingan muddat tugadi) — avatar AVTOMATIK bo'shatiladi:
   egalik yozuvi o'chiriladi (talaba keyin qaytib kirsa ham avtomatik qaytmaydi) va talabaga bir marta xabar chiqadi.
   Asl bazada, faqat server yozadi: meta/avatars/own/<avatar> = {s: <talaba>, at}, meta/avatars/allow/<talaba> = vaqt.
   site/* (brauzerlar tegolmaydi):
     site/avatarPass/<talaba>   = {uid, name, until, at, by}   — sotib olingan muddat (administrator yoki Click);
     site/avatarOrders/<talaba> = {uid, name, group, at, note?}— «to'lov qildim» so'rovi (administrator tasdiqlaydi);
     site/avatarShop            = {on, price, days, how}       — narx, muddat va to'lov yo'riqnomasi;
     site/avatarGone/<talaba>   = {a, at}                      — «avataringiz bo'shatildi» xabari. */

type Claim = { s: string; at: number };
type Pass = { uid: string; name: string; until: number; at: number; by: string };
type Gone = { a: string; at: number };
export type AvatarStore = {
  own: Record<string, Claim>;
  allow: Record<string, number>;
  /** talaba id → obuna tugash vaqti (faqat amaldagilar) */
  premium?: Record<string, number>;
  /** talaba id → sotib olingan muddat tugash vaqti */
  pass?: Record<string, number>;
  gone?: Record<string, Gone>;
  orders?: Record<string, AvatarOrder>;
  shop?: AvatarShop;
};
export type BoardRow = { id: string; name: string; classId: string; academicPoints: number };

const memory = ((globalThis as { __sqAvatars?: AvatarStore }).__sqAvatars ??= {
  own: {},
  allow: {},
});
const STUDENT = /^[A-Za-z0-9_-]{1,120}$/;
const TAKEN = 'Bu avatarni boshqa talaba tanlagan. Boshqasini tanlang.';
const DAY = 86400000;
/** «Avataringiz bo'shatildi» xabari shuncha vaqt ko'rinadi (yangi avatar tanlaganda darhol yo'qoladi). */
const GONE_SHOWN = 14 * DAY;
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);

function normalizeShop(raw: Partial<AvatarShop> | null): AvatarShop {
  const d = Math.round(Number(raw?.days));
  return {
    on: raw?.on !== false,
    price: typeof raw?.price === 'string' ? raw.price.trim().slice(0, 80) : '',
    days: Number.isFinite(d) && d >= 1 && d <= 365 ? d : AVATAR_SHOP_DEFAULT.days,
    how: typeof raw?.how === 'string' ? raw.how.trim().slice(0, 600) : '',
  };
}

export async function readAvatars(now = Date.now()): Promise<AvatarStore> {
  const [base, premium, passes, gone, orders, shop] = await Promise.all([
    demo()
      ? Promise.resolve({ own: { ...memory.own }, allow: { ...memory.allow } })
      : legacyDb()
          .ref('meta/avatars')
          .get()
          .then((s) => (s.val() || {}) as Partial<AvatarStore>),
    activePremium(now).catch(() => ({})),
    siteGet<Record<string, Pass>>('avatarPass').catch(() => null),
    siteGet<Record<string, Gone>>('avatarGone').catch(() => null),
    siteGet<Record<string, AvatarOrder>>('avatarOrders').catch(() => null),
    siteGet<Partial<AvatarShop>>('avatarShop').catch(() => null),
  ]);
  const pass: Record<string, number> = {};
  for (const p of Object.values(passes || {}))
    if (p?.uid && Number(p.until) > 0) pass[p.uid] = +p.until;
  const byStudent = <T extends { uid?: string }>(o: Record<string, T> | null) =>
    Object.fromEntries(
      Object.values(o || {})
        .filter((x) => x && typeof x.uid === 'string')
        .map((x) => [x.uid as string, x]),
    );
  return {
    own: base.own || {},
    allow: base.allow || {},
    premium,
    pass,
    gone: Object.fromEntries(
      Object.entries(gone || {}).filter(([, g]) => g?.a && now - Number(g.at) < GONE_SHOWN),
    ),
    orders: byStudent(orders),
    shop: normalizeShop(shop),
  };
}

function rules(board: BoardRow[], store: AvatarStore, catalog: AvatarItem[], now = Date.now()) {
  const top = new Set(board.slice(0, AVATAR_TOP).map((r) => r.id));
  const premium = (id: string) => (store.premium?.[id] || 0) > now;
  const pass = (id: string) => (store.pass?.[id] || 0) > now;
  const eligible = (id: string) => top.has(id) || !!store.allow[id] || premium(id) || pass(id);
  // Faqat hozir huquqi bor egalar hisobga olinadi. Yashirilgan avatar hech kimda ko'rinmaydi.
  const owners: Record<string, string> = {};
  for (const { id, off } of catalog) {
    if (off) continue;
    const c = store.own[id];
    if (c?.s && eligible(c.s)) owners[id] = c.s;
  }
  return { top, eligible, owners, premium, pass };
}

/** 🔄 Huquqi tugaganlarning avatarini bo'shatadi (egalik yozuvi o'chadi, talabaga xabar qoladi). Reyting bo'sh
    kelsa (baza javob bermadi) — hech narsa o'chirilmaydi. Yangilangan holatni qaytaradi. */
export async function releaseStale(
  board: BoardRow[],
  store: AvatarStore,
  catalog: AvatarItem[],
  now = Date.now(),
): Promise<AvatarStore> {
  if (!board.length) return store;
  const { eligible } = rules(board, store, catalog, now);
  const stale = Object.entries(store.own).filter(([, c]) => c?.s && !eligible(c.s));
  if (!stale.length) return store;
  const same = (cur: Record<string, Claim>, [a, c]: [string, Claim]) =>
    cur[a]?.s === c.s && cur[a]?.at === c.at;
  if (demo()) {
    for (const s of stale) if (same(memory.own, s)) delete memory.own[s[0]];
  } else
    await legacyDb()
      .ref('meta/avatars/own')
      .transaction((cur: Record<string, Claim> | null) => {
        if (!cur) return cur;
        for (const s of stale) if (same(cur, s)) delete cur[s[0]];
        return cur;
      });
  const gone: Record<string, Gone> = {};
  for (const [a, c] of stale) gone['avatarGone/' + keyOf(c.s)] = { a, at: now };
  await siteUpdate(gone).catch(() => {});
  const own = { ...store.own };
  for (const [a] of stale) delete own[a];
  const notes = { ...store.gone };
  for (const [a, c] of stale) notes[c.s] = { a, at: now };
  return { ...store, own, gone: notes };
}

/** Reyting qatorlariga amaldagi avatarni qo'shadi va talabaning o'z holatini qaytaradi. */
export function avatarView(
  board: BoardRow[],
  store: AvatarStore,
  me: string | undefined,
  catalog: AvatarItem[],
  now = Date.now(),
) {
  const { top, eligible, owners, premium, pass } = rules(board, store, catalog, now);
  const byOwner = Object.fromEntries(Object.entries(owners).map(([a, s]) => [s, a]));
  const shop = store.shop || AVATAR_SHOP_DEFAULT;
  const place = me ? board.findIndex((r) => r.id === me) + 1 : 0;
  return {
    leaderboard: board.map((r) => (byOwner[r.id] ? { ...r, avatar: byOwner[r.id] } : r)),
    avatars: {
      owners,
      catalog: catalog.filter((a) => !a.off),
      shop,
      me: me
        ? {
            place,
            top: top.has(me),
            allowed: !!store.allow[me],
            premium: premium(me),
            pass: pass(me) ? store.pass![me] : null,
            can: eligible(me),
            via: top.has(me)
              ? ('top' as const)
              : store.allow[me]
                ? ('allow' as const)
                : premium(me)
                  ? ('premium' as const)
                  : pass(me)
                    ? ('pass' as const)
                    : null,
            avatar: (byOwner[me] as string | undefined) || null,
            lost: (!byOwner[me] && store.gone?.[me]) || null,
            order: store.orders?.[me]?.at || null,
            // sotib olish faqat reytingdagi (tasdiqlangan) talabaga
            canBuy: shop.on && place > 0,
          }
        : null,
    },
  };
}

const pickInput = z.object({ avatar: z.string().regex(AVATAR_ID).nullable() }).strict();

/** Talaba avatar tanlaydi (yoki null — olib tashlaydi). Egallash tranzaksiya bilan: ikkitasi bir vaqtda ololmaydi. */
export async function pickAvatar(
  a: Actor,
  board: BoardRow[],
  raw: unknown,
  catalog: AvatarItem[],
  now = Date.now(),
) {
  check(a.role === 'student', 403, 'Avatarni faqat talabalar tanlaydi.');
  const { avatar } = pickInput.parse(raw);
  check(
    !avatar || catalog.some((x) => x.id === avatar && !x.off),
    404,
    'Bu avatar kutubxonada yo‘q.',
  );
  const store = await releaseStale(board, await readAvatars(now), catalog, now);
  const { eligible } = rules(board, store, catalog, now);
  check(
    eligible(a.id),
    403,
    'Avatar umumiy reytingda 1–10-o‘rinlardagi talabalarga, obunachilarga va avatarni sotib olganlarga beriladi.',
  );
  const apply = (own: Record<string, Claim>) => {
    const next = { ...own };
    const c = avatar ? next[avatar] : null;
    if (c?.s && c.s !== a.id && eligible(c.s)) throw new ApiError(409, TAKEN);
    for (const id of Object.keys(next)) if (next[id]?.s === a.id) delete next[id];
    if (avatar) next[avatar] = { s: a.id, at: now };
    return next;
  };
  if (demo()) memory.own = apply(memory.own);
  else {
    let conflict = false;
    const result = await legacyDb()
      .ref('meta/avatars/own')
      .transaction((current) => {
        try {
          return apply(current || {});
        } catch {
          conflict = true;
          return undefined;
        }
      });
    check(!conflict && result.committed, 409, TAKEN);
  }
  // yangi avatar tanlandi — «bo'shatildi» xabari endi kerak emas
  if (avatar && store.gone?.[a.id]) await siteUpdate({ ['avatarGone/' + keyOf(a.id)]: null });
  return avatarView(board, await readAvatars(now), a.id, catalog, now);
}

/* ---------- 💳 avatarni sotib olish ---------- */

/** Sotib olingan muddat (mavjud muddatning ustiga qo'shiladi). Administrator ham, to'lov tizimi (Click) ham chaqiradi. */
export async function grantAvatarPass(
  uid: string,
  name: string,
  days: number,
  by: string,
  now = Date.now(),
) {
  check(STUDENT.test(uid), 400, 'Talaba noto‘g‘ri');
  const key = keyOf(uid),
    cur = await siteGet<Pass>('avatarPass/' + key);
  const from = Math.max(now, Number(cur?.until) || 0);
  const pass: Pass = {
    uid,
    name: name.slice(0, 120),
    until: from + days * DAY,
    at: now,
    by: by.slice(0, 60),
  };
  await siteUpdate({ ['avatarPass/' + key]: pass, ['avatarOrders/' + key]: null });
  return pass;
}

const orderInput = z.discriminatedUnion('op', [
  z.object({ op: z.literal('order'), note: z.string().trim().max(300).optional() }).strict(),
  z.object({ op: z.literal('cancel') }).strict(),
]);
/** Talaba: «To'lov qildim — avatarni oching» so'rovi (yoki bekor qilish). Administrator to'lovni tekshirib tasdiqlaydi. */
export async function orderAvatar(
  a: Actor,
  board: BoardRow[],
  raw: unknown,
  catalog: AvatarItem[],
  now = Date.now(),
) {
  check(a.role === 'student', 403, 'Avatarni faqat talabalar oladi.');
  const v = orderInput.parse(raw);
  const key = 'avatarOrders/' + keyOf(a.id);
  if (v.op === 'cancel') await siteUpdate({ [key]: null });
  else {
    const store = await readAvatars(now);
    check(store.shop?.on !== false, 409, 'Avatar sotuvi hozircha yopiq.');
    const row = board.find((r) => r.id === a.id);
    check(row, 403, 'Avatar umumiy reytingdagi (tasdiqlangan) talabalar uchun.');
    if (!rules(board, store, catalog, now).eligible(a.id)) {
      const order: AvatarOrder = {
        uid: a.id,
        name: row!.name.slice(0, 120),
        group: (row!.classId || '').slice(0, 40),
        at: now,
        ...(v.note ? { note: v.note } : {}),
      };
      await siteUpdate({ [key]: order });
    }
  }
  return avatarView(board, await readAvatars(now), a.id, catalog, now);
}

/* ---------- 🛠 administrator ---------- */

const adminInput = z.discriminatedUnion('op', [
  z
    .object({ op: z.literal('allow'), student: z.string().regex(STUDENT), allow: z.boolean() })
    .strict(),
  z.object({ op: z.literal('release'), avatar: z.string().regex(AVATAR_ID) }).strict(),
  z
    .object({
      op: z.literal('grantPass'),
      student: z.string().regex(STUDENT),
      days: z.number().int().min(1).max(365),
    })
    .strict(),
  z.object({ op: z.literal('revokePass'), student: z.string().regex(STUDENT) }).strict(),
  z.object({ op: z.literal('rejectOrder'), student: z.string().regex(STUDENT) }).strict(),
  z
    .object({
      op: z.literal('shop'),
      on: z.boolean(),
      price: z.string().trim().max(80),
      days: z.number().int().min(1).max(365),
      how: z.string().trim().max(600),
    })
    .strict(),
]);

/** Administrator: ruxsat, bo'shatish, sotib olingan muddat (berish/olish), so'rovni rad etish, narx sozlamasi. */
export async function manageAvatars(
  a: Actor,
  board: BoardRow[],
  raw: unknown,
  catalog: AvatarItem[],
  now = Date.now(),
) {
  administrator(a);
  const v = adminInput.parse(raw);
  const by = (a.name || a.id).slice(0, 60);
  if (v.op === 'grantPass') {
    const store = await readAvatars(now);
    const name =
      board.find((r) => r.id === v.student)?.name ||
      store.orders?.[v.student]?.name ||
      v.student.replace(/^legacy_/, '');
    await grantAvatarPass(v.student, name, v.days, by, now);
  } else if (v.op === 'revokePass') await siteUpdate({ ['avatarPass/' + keyOf(v.student)]: null });
  else if (v.op === 'rejectOrder') await siteUpdate({ ['avatarOrders/' + keyOf(v.student)]: null });
  else if (v.op === 'shop')
    await siteUpdate({
      avatarShop: normalizeShop({ on: v.on, price: v.price, days: v.days, how: v.how }),
    });
  else if (demo()) {
    if (v.op === 'allow') {
      if (v.allow) memory.allow[v.student] = now;
      else delete memory.allow[v.student];
    } else delete memory.own[v.avatar];
  } else if (v.op === 'allow')
    await legacyDb()
      .ref('meta/avatars/allow/' + v.student)
      .set(v.allow ? now : null);
  else
    await legacyDb()
      .ref('meta/avatars/own/' + v.avatar)
      .remove();
  const store = await releaseStale(board, await readAvatars(now), catalog, now);
  return avatarAdminView(board, store, catalog, now);
}

/** Administrator ko'rinishi: har avatar egasi, ruxsat/obuna/sotib olganlar, so'rovlar, narx va reytingdagi talabalar. */
export function avatarAdminView(
  board: BoardRow[],
  store: AvatarStore,
  catalog: AvatarItem[],
  now = Date.now(),
) {
  const { top, eligible, premium, pass } = rules(board, store, catalog, now);
  const who = (id: string) => {
    const i = board.findIndex((r) => r.id === id);
    return {
      id,
      name: i >= 0 ? board[i].name : id.replace(/^legacy_/, ''),
      classId: i >= 0 ? board[i].classId : '',
      place: i + 1,
    };
  };
  const via = (id: string) =>
    top.has(id)
      ? 'top'
      : store.allow[id]
        ? 'allow'
        : premium(id)
          ? 'premium'
          : pass(id)
            ? 'pass'
            : null;
  return {
    catalog,
    avatars: catalog
      .filter((x) => !x.off)
      .map(({ id }) => {
        const c = store.own[id];
        return {
          id,
          owner: c?.s ? { ...who(c.s), active: eligible(c.s), via: via(c.s), at: c.at } : null,
        };
      }),
    allowed: Object.keys(store.allow)
      .filter((id) => store.allow[id])
      .map((id) => ({ ...who(id), top: top.has(id) })),
    passes: Object.entries(store.pass || {})
      .map(([id, until]) => ({ ...who(id), until, active: until > now }))
      .sort((x, y) => y.until - x.until),
    orders: Object.values(store.orders || {})
      .map((o) => ({ ...o, place: who(o.uid).place }))
      .sort((x, y) => x.at - y.at),
    shop: store.shop || AVATAR_SHOP_DEFAULT,
    students: board.map((r, i) => ({
      id: r.id,
      name: r.name,
      classId: r.classId,
      place: i + 1,
      allowed: !!store.allow[r.id],
    })),
    now,
  };
}
export type AvatarAdminView = ReturnType<typeof avatarAdminView>;
