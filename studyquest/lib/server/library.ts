import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { LIBRARY_KINDS, type LibraryItem, type LibraryKind } from '../library';
import { administrator, check } from './auth';
import { imageUrl, siteGet, siteUpdate, storeBlob } from './site-content';

/* 📚 Kutubxona: foydali manbalar ro'yxati — kitob, qo'llanma, maqola, video, qonun va namunalar. Administrator
   «Sayt boshqaruvi → 📚 Kutubxona»da qo'shadi: nom, muallif, izoh, havola (https), muqova rasmi va 💎 belgisi.
   Fayllarning o'zi bazada saqlanmaydi — havola beriladi (Google Drive, Telegram, lex.uz, YouTube …).
   💎 manbaning havolasi obunasiz foydalanuvchiga yuborilmaydi (locked: true).
   site/library/<id> = {kind, h, a?, t?, link, pro?, img?, at}; muqova baytlari — site/blob/lb-<id>. */

type Stored = Omit<LibraryItem, 'id' | 'img' | 'locked'> & { img?: string };
const ID = /^[a-z0-9-]{2,40}$/;
const MAX = 300;

export async function readLibrary(premium: boolean): Promise<LibraryItem[]> {
  const raw = (await siteGet<Record<string, Stored>>('library')) || {};
  return Object.entries(raw)
    .filter(
      ([id, v]) =>
        ID.test(id) && v && typeof v.h === 'string' && v.h && LIBRARY_KINDS.includes(v.kind),
    )
    .sort(([, a], [, b]) => (b.at || 0) - (a.at || 0))
    .slice(0, MAX)
    .map(([id, v]) => {
      const locked = !!v.pro && !premium;
      return {
        id,
        kind: v.kind,
        h: v.h,
        at: v.at,
        ...(v.a ? { a: v.a } : {}),
        ...(v.t ? { t: v.t } : {}),
        ...(v.link && !locked ? { link: v.link } : {}),
        ...(v.img ? { img: imageUrl('lb-' + id, v.img) } : {}),
        ...(v.pro ? { pro: true } : {}),
        ...(locked ? { locked: true } : {}),
      };
    });
}

const link = z
  .string()
  .trim()
  .max(500)
  .regex(/^https:\/\/[^\s]+$/, 'Havola https:// bilan boshlansin.');
const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('add'),
      kind: z.enum(LIBRARY_KINDS),
      h: z.string().trim().min(2).max(120),
      a: z.string().trim().max(100).optional(),
      t: z.string().trim().max(600).optional(),
      link,
      pro: z.boolean().optional(),
    })
    .strict(),
  z.object({ op: z.literal('remove'), id: z.string().regex(ID) }).strict(),
]);

/** Administrator: manba qo'shish (ixtiyoriy muqova bilan) yoki o'chirish. Yangilangan ro'yxatni qaytaradi. */
export async function manageLibraryItems(a: Actor, raw: unknown, cover?: Buffer, now = Date.now()) {
  administrator(a);
  const v = input.parse(raw);
  if (v.op === 'remove') {
    await siteUpdate({ ['library/' + v.id]: null, ['blob/lb-' + v.id]: null });
    return { items: await readLibrary(true) };
  }
  const stored = (await siteGet<Record<string, Stored>>('library')) || {};
  check(Object.keys(stored).length < MAX, 409, 'Kutubxona to‘ldi: avval eskilarini o‘chiring.');
  const id = now.toString(36) + '-' + randomUUID().slice(0, 8);
  // muqova avval saqlanadi — yaroqsiz rasm bo'lsa manba ham yozilmaydi
  const saved = cover ? await storeBlob('lb-' + id, cover, now) : null;
  const item: Stored = {
    kind: v.kind as LibraryKind,
    h: v.h,
    link: v.link,
    at: now,
    ...(v.a ? { a: v.a } : {}),
    ...(v.t ? { t: v.t } : {}),
    ...(v.pro ? { pro: true } : {}),
    ...(saved ? { img: saved.v } : {}),
  };
  await siteUpdate({ ['library/' + id]: item });
  return { id, items: await readLibrary(true) };
}
