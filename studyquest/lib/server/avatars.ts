import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import { AVATAR_ID, AVATAR_TOP, type AvatarItem } from '../avatars';
import { administrator, ApiError, check } from './auth';
import { demo, legacyDb } from './repository';

/* 🎭 Avatarlar (mukofot): umumiy reytingda 1–10-o'rindagi yoki administrator ruxsat bergan talaba kutubxonadan
   bitta qahramonni tanlaydi; bitta avatar bir vaqtda faqat bitta talabada bo'ladi.
   Asl bazada, faqat server yozadi: meta/avatars/own/<avatar> = {s: <talaba>, at}, meta/avatars/allow/<talaba> = vaqt.
   Talaba top-10 dan tushib ketsa (va ruxsati bo'lmasa) avatari ko'rinmaydi va boshqalar uni tanlay oladi. */

type Claim = { s: string; at: number };
export type AvatarStore = { own: Record<string, Claim>; allow: Record<string, number> };
export type BoardRow = { id: string; name: string; classId: string; academicPoints: number };

const memory = ((globalThis as { __sqAvatars?: AvatarStore }).__sqAvatars ??= {
  own: {},
  allow: {},
});
const STUDENT = /^[A-Za-z0-9_-]{1,120}$/;
const TAKEN = 'Bu avatarni boshqa talaba tanlagan. Boshqasini tanlang.';

export async function readAvatars(): Promise<AvatarStore> {
  if (demo()) return { own: { ...memory.own }, allow: { ...memory.allow } };
  const v = ((await legacyDb().ref('meta/avatars').get()).val() || {}) as Partial<AvatarStore>;
  return { own: v.own || {}, allow: v.allow || {} };
}

function rules(board: BoardRow[], store: AvatarStore, catalog: AvatarItem[]) {
  const top = new Set(board.slice(0, AVATAR_TOP).map((r) => r.id));
  const eligible = (id: string) => top.has(id) || !!store.allow[id];
  // Faqat hozir huquqi bor egalar hisobga olinadi; qolganlari bo'sh. Yashirilgan avatar hech kimda ko'rinmaydi.
  const owners: Record<string, string> = {};
  for (const { id, off } of catalog) {
    if (off) continue;
    const c = store.own[id];
    if (c?.s && eligible(c.s)) owners[id] = c.s;
  }
  return { top, eligible, owners };
}

/** Reyting qatorlariga amaldagi avatarni qo'shadi va talabaning o'z holatini qaytaradi. */
export function avatarView(
  board: BoardRow[],
  store: AvatarStore,
  me: string | undefined,
  catalog: AvatarItem[],
) {
  const { top, eligible, owners } = rules(board, store, catalog);
  const byOwner = Object.fromEntries(Object.entries(owners).map(([a, s]) => [s, a]));
  return {
    leaderboard: board.map((r) => (byOwner[r.id] ? { ...r, avatar: byOwner[r.id] } : r)),
    avatars: {
      owners,
      catalog: catalog.filter((a) => !a.off),
      me: me
        ? {
            place: board.findIndex((r) => r.id === me) + 1,
            top: top.has(me),
            allowed: !!store.allow[me],
            can: eligible(me),
            avatar: (byOwner[me] as string | undefined) || null,
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
  const store = await readAvatars();
  const { eligible } = rules(board, store, catalog);
  check(
    eligible(a.id),
    403,
    'Avatar umumiy reytingda 1–10-o‘rinlardagi va administrator ruxsat bergan talabalarga beriladi.',
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
  return avatarView(board, await readAvatars(), a.id, catalog);
}

const adminInput = z.discriminatedUnion('op', [
  z
    .object({ op: z.literal('allow'), student: z.string().regex(STUDENT), allow: z.boolean() })
    .strict(),
  z.object({ op: z.literal('release'), avatar: z.string().regex(AVATAR_ID) }).strict(),
]);

/** Administrator: talabaga avatar ruxsati berish/olish yoki avatarni bo'shatish. */
export async function manageAvatars(
  a: Actor,
  board: BoardRow[],
  raw: unknown,
  catalog: AvatarItem[],
  now = Date.now(),
) {
  administrator(a);
  const v = adminInput.parse(raw);
  if (demo()) {
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
  return avatarAdminView(board, await readAvatars(), catalog);
}

/** Administrator ko'rinishi: har avatar egasi, ruxsat berilganlar va reytingdagi talabalar. */
export function avatarAdminView(board: BoardRow[], store: AvatarStore, catalog: AvatarItem[]) {
  const { top, eligible } = rules(board, store, catalog);
  const who = (id: string) => {
    const i = board.findIndex((r) => r.id === id);
    return {
      id,
      name: i >= 0 ? board[i].name : id.replace(/^legacy_/, ''),
      classId: i >= 0 ? board[i].classId : '',
      place: i + 1,
    };
  };
  return {
    catalog,
    avatars: catalog
      .filter((x) => !x.off)
      .map(({ id }) => {
        const c = store.own[id];
        return { id, owner: c?.s ? { ...who(c.s), active: eligible(c.s), at: c.at } : null };
      }),
    allowed: Object.keys(store.allow)
      .filter((id) => store.allow[id])
      .map((id) => ({ ...who(id), top: top.has(id) })),
    students: board.map((r, i) => ({
      id: r.id,
      name: r.name,
      classId: r.classId,
      place: i + 1,
      allowed: !!store.allow[r.id],
    })),
  };
}
