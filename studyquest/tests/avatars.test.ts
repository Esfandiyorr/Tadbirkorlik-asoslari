import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { BUILTIN_AVATARS as CAT } from '../lib/avatars';
import {
  avatarAdminView,
  avatarView,
  manageAvatars,
  pickAvatar,
  orderAvatar,
  readAvatars,
  releaseStale,
  type BoardRow,
} from '../lib/server/avatars';
import { resetSiteMemory } from '../lib/server/site-content';
import { managePremium } from '../lib/server/premium';
import { fulfilPayment } from '../lib/server/payments';

/* 🎭 Avatar qoidalari: umumiy reytingning 1–10-o'rni yoki administrator ruxsati; bitta avatar — bitta talaba;
   top-10 dan tushgan (ruxsatsiz) talabaning avatari bo'shaydi. Demo rejimi — xotiradagi ombor. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  resetSiteMemory();
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
  // Ruxsat olib tashlansa — avatar avtomatik bo'shatiladi (egalik yozuvi o'chadi)
  expect(panel.avatars.find((a) => a.id === 'walle')?.owner).toBeNull();
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

const DAY = 86400000;

it('releases the avatar automatically when a student leaves the top ten — it does not come back', async () => {
  const now = Date.UTC(2026, 10, 14, 9, 0);
  await pickAvatar(student(10), ranked, { avatar: 'po' }, CAT, now);
  const moved = board([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10, 12]);
  const store = await releaseStale(moved, await readAvatars(now), CAT, now);
  expect(store.own).toEqual({});
  expect((await readAvatars(now)).own).toEqual({});
  // talabaga bir marta xabar: qaysi avatar bo'shatildi
  const view = avatarView(moved, await readAvatars(now), 'legacy_s10', CAT, now);
  expect(view.avatars.me).toMatchObject({ can: false, avatar: null, lost: { a: 'po', at: now } });
  // top-10 ga qaytsa ham avatar o'zi qaytmaydi — qaytadan tanlaydi
  const back = avatarView(ranked, await readAvatars(now), 'legacy_s10', CAT, now);
  expect(back.avatars.me).toMatchObject({ can: true, avatar: null });
  const again = await pickAvatar(student(10), ranked, { avatar: 'mario' }, CAT, now + 1000);
  expect(again.avatars.me).toMatchObject({ avatar: 'mario', lost: null });
  // reyting bo'sh kelsa (baza javob bermadi) — hech kimning avatari o'chirilmaydi
  expect((await releaseStale([], await readAvatars(now), CAT, now)).own.mario?.s).toBe(
    'legacy_s10',
  );
});

it('Premium and a bought pass let students outside the top ten hold an avatar while they last', async () => {
  const now = Date.UTC(2026, 10, 14, 9, 0);
  // 💎 obuna
  await managePremium(admin, { op: 'grant', uid: 'legacy_s11', name: 'Talaba 11', days: 30 }, now);
  const withPremium = await pickAvatar(student(11), ranked, { avatar: 'joy' }, CAT, now);
  expect(withPremium.avatars.me).toMatchObject({ can: true, via: 'premium', avatar: 'joy' });
  // obuna tugadi → avatar avtomatik bo'shaydi
  const later = now + 31 * DAY;
  const expired = await releaseStale(ranked, await readAvatars(later), CAT, later);
  expect(expired.own.joy).toBeUndefined();
  // 💳 sotib olish: so'rov → administrator tasdiqlaydi → muddat
  const ordered = await orderAvatar(
    student(12),
    ranked,
    { op: 'order', note: 'Click 25 000' },
    CAT,
    now,
  );
  expect(ordered.avatars.me).toMatchObject({ can: false, order: now, canBuy: true });
  let panel = await manageAvatars(
    admin,
    ranked,
    { op: 'shop', on: true, price: '15 000 so‘m', days: 30, how: 'Karta …' },
    CAT,
    now,
  );
  expect(panel.shop).toEqual({ on: true, price: '15 000 so‘m', days: 30, how: 'Karta …' });
  expect(panel.orders).toEqual([
    {
      uid: 'legacy_s12',
      name: 'Talaba 12',
      group: 'AP-224',
      at: now,
      note: 'Click 25 000',
      place: 12,
    },
  ]);
  panel = await manageAvatars(
    admin,
    ranked,
    { op: 'grantPass', student: 'legacy_s12', days: 30 },
    CAT,
    now,
  );
  expect(panel.orders).toEqual([]);
  expect(panel.passes[0]).toMatchObject({ id: 'legacy_s12', until: now + 30 * DAY, active: true });
  const bought = await pickAvatar(student(12), ranked, { avatar: 'walle' }, CAT, now);
  expect(bought.avatars.me).toMatchObject({ via: 'pass', pass: now + 30 * DAY, avatar: 'walle' });
  // muddat qo'shiladi (tugamasdan uzaytirish)
  panel = await manageAvatars(
    admin,
    ranked,
    { op: 'grantPass', student: 'legacy_s12', days: 7 },
    CAT,
    now,
  );
  expect(panel.passes[0].until).toBe(now + 37 * DAY);
  // muddat olib qo'yilsa — avatar ham bo'shaydi
  panel = await manageAvatars(admin, ranked, { op: 'revokePass', student: 'legacy_s12' }, CAT, now);
  expect(panel.avatars.find((a) => a.id === 'walle')?.owner).toBeNull();
});

it('orders: only ranked students, nothing for those who already qualify, rejection and the shop switch', async () => {
  const now = Date.UTC(2026, 10, 14, 9, 0);
  // top-10 dagi talaba so'rov yubormaydi (huquqi bor)
  const top = await orderAvatar(student(1), ranked, { op: 'order' }, CAT, now);
  expect(top.avatars.me?.order).toBeNull();
  // reytingda yo'q talaba sotib ololmaydi
  await expect(orderAvatar(student(99), ranked, { op: 'order' }, CAT, now)).rejects.toMatchObject({
    status: 403,
  });
  await orderAvatar(student(11), ranked, { op: 'order' }, CAT, now);
  let panel = await manageAvatars(
    admin,
    ranked,
    { op: 'rejectOrder', student: 'legacy_s11' },
    CAT,
    now,
  );
  expect(panel.orders).toEqual([]);
  await orderAvatar(student(11), ranked, { op: 'order' }, CAT, now);
  expect(
    (await orderAvatar(student(11), ranked, { op: 'cancel' }, CAT, now)).avatars.me?.order,
  ).toBeNull();
  // sotuv yopiq — so'rov qabul qilinmaydi
  panel = await manageAvatars(
    admin,
    ranked,
    { op: 'shop', on: false, price: '', days: 30, how: '' },
    CAT,
    now,
  );
  await expect(orderAvatar(student(11), ranked, { op: 'order' }, CAT, now)).rejects.toMatchObject({
    status: 409,
  });
  expect(
    avatarView(ranked, await readAvatars(now), 'legacy_s11', CAT, now).avatars.me?.canBuy,
  ).toBe(false);
  // faqat administrator
  await expect(
    manageAvatars(teacher, ranked, { op: 'grantPass', student: 'legacy_s11', days: 30 }, CAT, now),
  ).rejects.toMatchObject({ status: 403 });
});

it('a confirmed payment (Click later) grants the product once, even if it arrives twice', async () => {
  const now = Date.UTC(2026, 10, 14, 9, 0);
  const pay = {
    ref: 'T-1001',
    product: 'avatar',
    uid: 'legacy_s11',
    name: 'Talaba 11',
    days: 30,
    amount: 15000,
    provider: 'click',
  };
  expect(await fulfilPayment(pay, now)).toMatchObject({ ok: true, repeated: false });
  expect(await fulfilPayment(pay, now + 1000)).toMatchObject({ ok: true, repeated: true });
  const view = avatarView(ranked, await readAvatars(now), 'legacy_s11', CAT, now);
  expect(view.avatars.me).toMatchObject({ can: true, via: 'pass', pass: now + 30 * DAY });
  await fulfilPayment(
    { ...pay, ref: 'T-1002', product: 'premium', uid: 'legacy_s12', name: 'Talaba 12' },
    now,
  );
  expect(
    avatarView(ranked, await readAvatars(now), 'legacy_s12', CAT, now).avatars.me,
  ).toMatchObject({ via: 'premium' });
  await expect(fulfilPayment({ ...pay, product: 'gold' }, now)).rejects.toThrow();
});
