import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { BUILTIN_AVATARS as CAT } from '../lib/avatars';
import {
  avatarAdminView,
  avatarView,
  manageAvatars,
  pickAvatar,
  readAvatars,
  type BoardRow,
} from '../lib/server/avatars';

/* 🎭 Avatar qoidalari: umumiy reytingning 1–10-o'rni yoki administrator ruxsati; bitta avatar — bitta talaba;
   top-10 dan tushgan (ruxsatsiz) talabaning avatari bo'shaydi. Demo rejimi — xotiradagi ombor. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  const store = (globalThis as { __sqAvatars?: { own: object; allow: object } }).__sqAvatars;
  if (store) {
    store.own = {};
    store.allow = {};
  }
});
const board = (order: number[]): BoardRow[] =>
  order.map((n, i) => ({
    id: 'legacy_s' + n,
    name: 'Talaba ' + n,
    classId: n % 2 ? 'AP-223' : 'AP-224',
    academicPoints: 1000 - i * 10,
  }));
const ranked = board([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const student = (n: number) =>
  ({ id: 'legacy_s' + n, role: 'student', name: 'Talaba ' + n }) as unknown as Actor;
const admin = { id: 'owner', role: 'admin', name: 'Admin' } as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;

it('lets only the overall top ten choose, and each avatar belongs to one student', async () => {
  const first = await pickAvatar(student(1), ranked, { avatar: 'mario' }, CAT);
  expect(first.avatars.me).toMatchObject({ place: 1, top: true, can: true, avatar: 'mario' });
  expect(first.leaderboard[0]).toMatchObject({ id: 'legacy_s1', avatar: 'mario' });
  // Boshqa talaba band avatarni ololmaydi, bo'shini oladi.
  await expect(pickAvatar(student(2), ranked, { avatar: 'mario' }, CAT)).rejects.toMatchObject({
    status: 409,
  });
  await pickAvatar(student(2), ranked, { avatar: 'sonic' }, CAT);
  // 11-o'rin ruxsatsiz tanlay olmaydi.
  await expect(pickAvatar(student(11), ranked, { avatar: 'joy' }, CAT)).rejects.toMatchObject({
    status: 403,
  });
  // Almashtirsa — eskisi bo'shaydi: har talabada bitta avatar.
  const swapped = await pickAvatar(student(1), ranked, { avatar: 'joy' }, CAT);
  expect(swapped.avatars.owners).toEqual({ sonic: 'legacy_s2', joy: 'legacy_s1' });
  await pickAvatar(student(3), ranked, { avatar: 'mario' }, CAT);
  // Olib tashlash.
  const removed = await pickAvatar(student(1), ranked, { avatar: null }, CAT);
  expect(removed.avatars.me?.avatar).toBeNull();
  expect(removed.leaderboard[0]).not.toHaveProperty('avatar');
  expect(Object.values((await readAvatars()).own).map((c) => c.s)).toEqual([
    'legacy_s2',
    'legacy_s3',
  ]);
});

it('frees the avatar of a student who left the top ten unless the administrator allowed them', async () => {
  await pickAvatar(student(10), ranked, { avatar: 'po' }, CAT);
  // 10-o'rindagi talaba 11-o'ringa tushdi: avatari ko'rinmaydi va boshqalar uni tanlay oladi.
  const moved = board([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10, 12]);
  const view = avatarView(moved, await readAvatars(), 'legacy_s10', CAT);
  expect(view.avatars.me).toMatchObject({ place: 11, top: false, can: false, avatar: null });
  expect(view.leaderboard.find((r) => r.id === 'legacy_s10')).not.toHaveProperty('avatar');
  expect(view.avatars.owners).toEqual({});
  await pickAvatar(student(11), moved, { avatar: 'po' }, CAT);
  // Administrator ruxsati bilan top-10 dan tashqaridagi talaba ham tanlaydi va avatari saqlanadi.
  await manageAvatars(admin, moved, { op: 'allow', student: 'legacy_s12', allow: true }, CAT);
  const allowed = await pickAvatar(student(12), moved, { avatar: 'walle' }, CAT);
  expect(allowed.avatars.me).toMatchObject({
    place: 12,
    top: false,
    allowed: true,
    avatar: 'walle',
  });
  expect(allowed.leaderboard.at(-1)).toMatchObject({ id: 'legacy_s12', avatar: 'walle' });
  // Ruxsat olib tashlansa — avatar nofaol (bo'sh).
  const panel = await manageAvatars(
    admin,
    moved,
    {
      op: 'allow',
      student: 'legacy_s12',
      allow: false,
    },
    CAT,
  );
  expect(panel.avatars.find((a) => a.id === 'walle')?.owner).toMatchObject({
    id: 'legacy_s12',
    active: false,
  });
  expect(avatarView(moved, await readAvatars(), undefined, CAT).avatars.owners).toEqual({
    po: 'legacy_s11',
  });
});

it('restricts administration to administrators and teachers cannot claim avatars', async () => {
  await expect(
    manageAvatars(teacher, ranked, { op: 'release', avatar: 'mario' }, CAT),
  ).rejects.toMatchObject({ status: 403 });
  await expect(pickAvatar(teacher, ranked, { avatar: 'mario' }, CAT)).rejects.toMatchObject({
    status: 403,
  });
  await expect(pickAvatar(student(1), ranked, { avatar: 'shrek' }, CAT)).rejects.toThrow();
  await pickAvatar(student(4), ranked, { avatar: 'judy' }, CAT);
  const released = await manageAvatars(admin, ranked, { op: 'release', avatar: 'judy' }, CAT);
  expect(released.avatars.find((a) => a.id === 'judy')?.owner).toBeNull();
  const view = avatarAdminView(ranked, await readAvatars(), CAT);
  expect(view.avatars).toHaveLength(10);
  expect(view.students[0]).toMatchObject({ id: 'legacy_s1', place: 1, allowed: false });
});
