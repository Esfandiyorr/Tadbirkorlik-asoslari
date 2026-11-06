import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import { AVATAR_ID, BUILTIN_AVATARS, type AvatarItem } from '../avatars';
import { administrator, check } from './auth';
import { siteGet, siteUpdate, storeBlob } from './site-content';
import { demo, legacyDb } from './repository';

/* 🎭 Avatarlar kutubxonasi (Sayt boshqaruvi → Avatarlar): asl 10 ta qahramon + administrator yuklaganlari.
   site/avatars/<id> = {n: [uz, en, ru], f: manba, v: rasm versiyasi, off: yashirilgan, c: o'zi qo'shgan, at, by};
   rasm baytlari site/blob/av-<id> da. Yashirilgan avatar tanlanmaydi va egasida ham ko'rinmaydi. */

type Entry = {
  n?: [string, string, string];
  f?: string;
  v?: string;
  off?: boolean;
  c?: boolean;
  at?: number;
  by?: string;
};
let cache: { at: number; value: Promise<AvatarItem[]> } | null = null;
const src = (id: string, v?: string) =>
  v ? '/api/site/img/av-' + id + '?v=' + v : '/avatars/' + id + '.webp';

async function entries() {
  return (await siteGet<Record<string, Entry>>('avatars')) || {};
}
function merge(saved: Record<string, Entry>): AvatarItem[] {
  const builtin = BUILTIN_AVATARS.map((b) => {
    const e = saved[b.id] || {};
    return {
      ...b,
      name: e.n || b.name,
      from: e.f ?? b.from,
      src: e.v ? src(b.id, e.v) : b.src,
      ...(e.off ? { off: true } : {}),
    };
  });
  const custom = Object.entries(saved)
    .filter(([id, e]) => e?.c && e.v && !BUILTIN_AVATARS.some((b) => b.id === id))
    .sort(([, a], [, b]) => (+(a.at ?? 0) || 0) - (+(b.at ?? 0) || 0))
    .map(([id, e]) => ({
      id,
      name: e.n || ([id, id, id] as [string, string, string]),
      from: e.f || '',
      src: src(id, e.v),
      custom: true,
      ...(e.off ? { off: true } : {}),
    }));
  return [...builtin, ...custom];
}
/** Butun kutubxona (yashirilganlari bilan) — 30 soniya keshlanadi (har reyting so'rovida bazaga bormaslik uchun). */
export function avatarLibrary(): Promise<AvatarItem[]> {
  if (!demo() && cache && Date.now() - cache.at < 30000) return cache.value;
  const value = entries().then(merge);
  if (!demo()) {
    cache = { at: Date.now(), value };
    value.catch(() => (cache = null));
  }
  return value;
}
/** Talabalar ko'radigan (yashirilmagan) avatarlar. */
export async function avatarCatalog() {
  return (await avatarLibrary()).filter((a) => !a.off);
}

const tri = z.tuple([
  z.string().trim().min(1).max(40),
  z.string().trim().max(40),
  z.string().trim().max(40),
]);
const id = z.string().regex(AVATAR_ID);
const input = z.discriminatedUnion('op', [
  z.object({ op: z.literal('rename'), id, name: tri, from: z.string().trim().max(80) }).strict(),
  z.object({ op: z.literal('hide'), id, off: z.boolean() }).strict(),
  z.object({ op: z.literal('delete'), id }).strict(),
  z.object({ op: z.literal('resetImage'), id }).strict(),
]);
const filled = (n: [string, string, string]) =>
  [n[0], n[1] || n[0], n[2] || n[0]] as [string, string, string];

/** Administrator: nom, ko'rinish, o'chirish (faqat o'zi qo'shgani), rasmni asl holiga qaytarish (asl qahramonlar). */
export async function manageLibrary(a: Actor, raw: unknown) {
  administrator(a);
  const p = input.parse(raw),
    lib = await avatarLibrary(),
    item = lib.find((x) => x.id === p.id);
  check(item, 404, 'Avatar topilmadi.');
  const by = a.name || a.id;
  if (p.op === 'rename')
    await siteUpdate({
      ['avatars/' + p.id + '/n']: filled(p.name),
      ['avatars/' + p.id + '/f']: p.from,
      ['avatars/' + p.id + '/by']: by,
    });
  else if (p.op === 'hide') await siteUpdate({ ['avatars/' + p.id + '/off']: p.off ? true : null });
  else if (p.op === 'delete') {
    check(item!.custom, 400, 'Asl avatarni o‘chirib bo‘lmaydi — uni yashiring.');
    await siteUpdate({ ['avatars/' + p.id]: null, ['blob/av-' + p.id]: null });
    await releaseOwner(p.id);
  } else {
    check(!item!.custom, 400, 'Bu avatarning asl rasmi yo‘q.');
    await siteUpdate({ ['avatars/' + p.id + '/v']: null, ['blob/av-' + p.id]: null });
  }
  cache = null;
  return avatarLibrary();
}

/** Administrator: yangi avatar qo'shish (rasm + nom) yoki mavjud avatar rasmini almashtirish. */
export async function uploadAvatar(
  a: Actor,
  fields: { id?: string; name?: string; en?: string; ru?: string; from?: string },
  bytes: Buffer,
  now = Date.now(),
) {
  administrator(a);
  const lib = await avatarLibrary(),
    by = a.name || a.id;
  if (fields.id) {
    check(
      lib.some((x) => x.id === fields.id),
      404,
      'Avatar topilmadi.',
    );
    const saved = await storeBlob('av-' + fields.id, bytes, now);
    await siteUpdate({
      ['avatars/' + fields.id + '/v']: saved.v,
      ['avatars/' + fields.id + '/by']: by,
    });
  } else {
    const name = filled(tri.parse([fields.name || '', fields.en || '', fields.ru || '']));
    const newId = 'c' + now.toString(36);
    check(!lib.some((x) => x.id === newId), 409, 'Qayta urinib ko‘ring.');
    const saved = await storeBlob('av-' + newId, bytes, now);
    await siteUpdate({
      ['avatars/' + newId]: {
        n: name,
        f: z
          .string()
          .trim()
          .max(80)
          .parse(fields.from || ''),
        v: saved.v,
        c: true,
        at: now,
        by,
      },
    });
  }
  cache = null;
  return avatarLibrary();
}

/** O'chirilgan avatar egasidan ham olinadi. */
async function releaseOwner(id: string) {
  if (demo()) {
    const memory = (globalThis as { __sqAvatars?: { own: Record<string, unknown> } }).__sqAvatars;
    if (memory) delete memory.own[id];
    return;
  }
  await legacyDb()
    .ref('meta/avatars/own/' + id)
    .remove();
}
export function resetAvatarLibraryCache() {
  cache = null;
}
