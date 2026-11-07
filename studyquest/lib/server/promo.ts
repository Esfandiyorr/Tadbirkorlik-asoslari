import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { PROMO_KINDS, type PromoItem, type PromoKind } from '../promo';
import { administrator, check } from './auth';
import { newsLink } from './news';
import { imageUrl, siteGet, siteUpdate, storeBlob } from './site-content';

/* 🛍 2-e'lon oynasi (yon menyu pastida): mahsulot, kurs va grant dasturlari reklamasi. Faqat administrator
   «Sayt boshqaruvi → 🛍 2-e'lon oynasi»da yozadi. Ma'lumot asl bazaning site/promo/<id> bo'limida — Firebase
   qoidalarida bu bo'lim yo'q, brauzerlar unga tegolmaydi; rasm baytlari site/blob/pr-<id> da. Saytga
   /api/platform?view=news javobida (e'lonlar bilan bitta so'rovda, CDN keshida) beriladi. */

type Stored = Omit<PromoItem, 'id' | 'img'> & { img?: string };
const MAX = 10;
const ID = /^[a-z0-9-]{2,40}$/;

export async function readPromo(now = Date.now()): Promise<PromoItem[]> {
  const raw = (await siteGet<Record<string, Stored>>('promo')) || {};
  return Object.entries(raw)
    .filter(
      ([id, v]) =>
        ID.test(id) &&
        v &&
        typeof v.h === 'string' &&
        v.h &&
        PROMO_KINDS.includes(v.kind) &&
        (!v.until || v.until > now),
    )
    .sort(([, a], [, b]) => (b.at || 0) - (a.at || 0))
    .slice(0, MAX)
    .map(([id, v]) => ({
      id,
      kind: v.kind,
      h: v.h,
      at: v.at,
      ...(v.t ? { t: v.t } : {}),
      ...(v.link ? { link: v.link } : {}),
      ...(v.cta ? { cta: v.cta } : {}),
      ...(v.until ? { until: v.until } : {}),
      ...(v.img ? { img: imageUrl('pr-' + id, v.img) } : {}),
    }));
}

const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('add'),
      kind: z.enum(PROMO_KINDS),
      h: z.string().trim().min(2).max(70),
      t: z.string().trim().max(240).optional(),
      link: newsLink.optional(),
      cta: z.string().trim().max(24).optional(),
      until: z.number().int().positive().optional(),
    })
    .strict(),
  z.object({ op: z.literal('remove'), id: z.string().regex(ID) }).strict(),
]);

/** Administrator: reklama e'lonini qo'shish yoki o'chirish. Yangilangan ro'yxatni (va yangi e'lon id sini) qaytaradi. */
export async function managePromo(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = input.parse(raw);
  if (v.op === 'add') {
    const stored = (await siteGet<Record<string, Stored>>('promo')) || {};
    check(
      Object.values(stored).filter((x) => !x?.until || x.until > now).length < 20,
      409,
      'Juda ko‘p e’lon: avval eskilarini o‘chiring.',
    );
    const id = now.toString(36) + '-' + randomUUID().slice(0, 8);
    const item: Stored = {
      kind: v.kind as PromoKind,
      h: v.h,
      at: now,
      ...(v.t ? { t: v.t } : {}),
      ...(v.link ? { link: v.link } : {}),
      ...(v.cta ? { cta: v.cta } : {}),
      ...(v.until ? { until: v.until } : {}),
    };
    await siteUpdate({ ['promo/' + id]: item });
    return { id, promo: await readPromo(now) };
  }
  await siteUpdate({ ['promo/' + v.id]: null, ['blob/pr-' + v.id]: null });
  return { promo: await readPromo(now) };
}

/** Administrator: e'longa rasm qo'shish yoki almashtirish (baytlar turi serverda tekshiriladi). */
export async function promoImage(a: Actor, id: string, bytes: Buffer, now = Date.now()) {
  administrator(a);
  check(ID.test(id), 400, 'E’lon topilmadi.');
  check(await siteGet<Stored>('promo/' + id), 404, 'E’lon topilmadi.');
  const saved = await storeBlob('pr-' + id, bytes, now);
  await siteUpdate({ ['promo/' + id + '/img']: saved.v });
  return { promo: await readPromo(now) };
}
