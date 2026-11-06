import { beforeEach, expect, it, vi } from 'vitest';
import type { Actor } from '../lib/types';
import { BUILTIN_AVATARS as CAT } from '../lib/avatars';

/* Avatar egallash asl bazada tranzaksiya bilan: soxta RTDB (birinchi chaqiruv null bilan — haqiqiy SDK kabi). */
const tree: { meta?: any } = {};
const at = (path: string) => path.split('/').filter(Boolean);
function get(path: string) {
  let node: any = tree;
  for (const k of at(path)) node = node?.[k];
  return node ?? null;
}
function set(path: string, value: unknown) {
  const keys = at(path);
  let node: any = tree;
  for (const k of keys.slice(0, -1)) node = node[k] ??= {};
  if (value === null) delete node[keys.at(-1)!];
  else node[keys.at(-1)!] = structuredClone(value);
}
vi.mock('../lib/server/repository', () => ({
  demo: () => false,
  legacyDb: () => ({
    ref: (path: string) => ({
      get: async () => ({ val: () => get(path) }),
      set: async (v: unknown) => set(path, v),
      remove: async () => set(path, null),
      transaction: async (update: (v: unknown) => unknown) => {
        update(null); // SDK avval keshdagi qiymat (bo'sh) bilan chaqiradi, server rad etib qayta yuboradi
        const next = update(structuredClone(get(path)));
        if (next === undefined) return { committed: false };
        set(path, next);
        return { committed: true };
      },
    }),
  }),
}));
const { pickAvatar, manageAvatars } = await import('../lib/server/avatars');

beforeEach(() => {
  delete tree.meta;
});
const ranked = Array.from({ length: 12 }, (_, i) => ({
  id: 'legacy_s' + (i + 1),
  name: 'Talaba ' + (i + 1),
  classId: 'AP-223',
  academicPoints: 500 - i,
}));
const student = (n: number) => ({ id: 'legacy_s' + n, role: 'student' }) as unknown as Actor;

it('claims avatars in the original database without overwriting other students', async () => {
  await pickAvatar(student(1), ranked, { avatar: 'mario' }, CAT, 111);
  await pickAvatar(student(2), ranked, { avatar: 'sonic' }, CAT, 222);
  expect(get('meta/avatars/own')).toEqual({
    mario: { s: 'legacy_s1', at: 111 },
    sonic: { s: 'legacy_s2', at: 222 },
  });
  await expect(pickAvatar(student(3), ranked, { avatar: 'mario' }, CAT)).rejects.toMatchObject({
    status: 409,
  });
  expect(get('meta/avatars/own/mario')).toEqual({ s: 'legacy_s1', at: 111 });
  await manageAvatars(
    { id: 'owner', role: 'admin' } as unknown as Actor,
    ranked,
    { op: 'allow', student: 'legacy_s12', allow: true },
    CAT,
    333,
  );
  expect(get('meta/avatars/allow')).toEqual({ legacy_s12: 333 });
  // Ruxsat berilgan 12-o'rin ham band avatarni ololmaydi, bo'shini oladi.
  await expect(pickAvatar(student(12), ranked, { avatar: 'mario' }, CAT)).rejects.toMatchObject({
    status: 409,
  });
  const view = await pickAvatar(student(12), ranked, { avatar: 'po' }, CAT);
  expect(view.avatars.me).toMatchObject({ place: 12, allowed: true, can: true, avatar: 'po' });
  expect(Object.keys(get('meta/avatars/own'))).toEqual(['mario', 'sonic', 'po']);
});
