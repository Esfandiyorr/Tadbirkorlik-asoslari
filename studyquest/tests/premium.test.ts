import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import {
  grantPremium,
  managePremium,
  premiumAdmin,
  premiumState,
  premiumReceipt,
  premiumView,
  setPremiumLook,
  setPremiumMark,
  subscribe,
} from '../lib/server/premium';
import { avatarView, readAvatars } from '../lib/server/avatars';
import { BUILTIN_AVATARS } from '../lib/avatars';
import { manageLibraryItems, readLibrary } from '../lib/server/library';
import { readImage, resetSiteMemory } from '../lib/server/site-content';

/* 💎 Obuna va 📚 kutubxona: kim nimani ocha oladi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const who = (id: string, role = 'student') =>
  ({
    id,
    uid: id,
    role,
    name: 'Ali Valiyev',
    classId: 'AP-223',
    learnerType: 'university',
  }) as unknown as Actor;
const admin = who('owner', 'admin');
const ali = who('legacy_ali');
const DAY = 86400000;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

it('the administrator gives, extends and removes Premium; staff always have it', async () => {
  const now = Date.UTC(2026, 10, 12, 9, 0);
  expect(await premiumState(ali, now)).toEqual({ active: false, until: 0, staff: false });
  expect(await premiumState(who('tc', 'teacher'), now)).toMatchObject({
    active: true,
    staff: true,
  });
  await expect(
    managePremium(ali, { op: 'grant', uid: 'legacy_ali', name: 'Ali', days: 30 }, now),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    managePremium(admin, { op: 'grant', uid: 'legacy_ali', name: 'Ali', days: 0 }, now),
  ).rejects.toThrow();
  let v = await managePremium(
    admin,
    { op: 'grant', uid: 'legacy_ali', name: 'Ali Valiyev', group: 'AP-223', days: 30 },
    now,
  );
  expect(v.active).toBe(1);
  expect(v.grants[0]).toMatchObject({
    uid: 'legacy_ali',
    until: now + 30 * DAY,
    by: 'Ali Valiyev',
  });
  expect(await premiumState(ali, now)).toEqual({
    active: true,
    look: 'oltin',
    until: now + 30 * DAY,
    staff: false,
  });
  // yana berilsa — muddat ustiga qo'shiladi
  v = await managePremium(
    admin,
    { op: 'grant', uid: 'legacy_ali', name: 'Ali', days: 7 },
    now + DAY,
  );
  expect(v.grants[0].until).toBe(now + 37 * DAY);
  // qo'lda berilgan muddatlar tarixda (to'lovsiz)
  expect(v.grants[0]).toMatchObject({ days: 37, paid: 0 });
  expect(v.grants[0].hist.map((t) => t.days)).toEqual([30, 7]);
  expect(v.grants[0].hist[0].amount).toBeUndefined();
  expect(v.pending).toEqual([]);
  // muddati o'tgach — o'zi tugaydi
  expect((await premiumState(ali, now + 38 * DAY)).active).toBe(false);
  expect((await premiumAdmin(admin, now + 38 * DAY)).active).toBe(0);
  // narx va yo'riqnoma talabaga ko'rinadi
  await managePremium(
    admin,
    { op: 'info', price: '25 000 so‘m / oy', how: 'Click orqali to‘lang' },
    now,
  );
  expect((await premiumView(ali, now)).info).toMatchObject({
    price: '25 000 so‘m / oy',
    how: 'Click orqali to‘lang',
    card: '',
  });
  v = await managePremium(admin, { op: 'revoke', uid: 'legacy_ali' }, now);
  expect(v.grants).toEqual([]);
  expect((await premiumState(ali, now)).active).toBe(false);
});

it('the library hides the link of a premium resource from people without Premium', async () => {
  await expect(
    manageLibraryItems(ali, { op: 'add', kind: 'book', h: 'Kitob', link: 'https://example.uz/a' }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    manageLibraryItems(admin, { op: 'add', kind: 'book', h: 'Kitob', link: 'javascript:alert(1)' }),
  ).rejects.toThrow();
  // yaroqsiz muqova bo'lsa manba ham yozilmaydi
  await expect(
    manageLibraryItems(
      admin,
      { op: 'add', kind: 'book', h: 'Kitob', link: 'https://example.uz/a' },
      Buffer.from('<svg/>'),
    ),
  ).rejects.toMatchObject({ status: 400 });
  expect(await readLibrary(true)).toEqual([]);
  const free = await manageLibraryItems(
    admin,
    {
      op: 'add',
      kind: 'guide',
      h: 'Biznes-reja qo‘llanmasi',
      a: 'TerDU',
      link: 'https://example.uz/reja',
    },
    PNG,
    1000,
  );
  const pro = await manageLibraryItems(
    admin,
    {
      op: 'add',
      kind: 'template',
      h: 'Moliyaviy model',
      link: 'https://example.uz/model',
      pro: true,
    },
    undefined,
    2000,
  );
  const guest = await readLibrary(false);
  expect(guest.map((x) => [x.h, x.link, x.locked, x.pro])).toEqual([
    ['Moliyaviy model', undefined, true, true],
    ['Biznes-reja qo‘llanmasi', 'https://example.uz/reja', undefined, undefined],
  ]);
  expect(guest[1].img).toMatch(/^\/api\/site\/img\/lb-/);
  const sub = await readLibrary(true);
  expect(sub[0]).toMatchObject({ link: 'https://example.uz/model', pro: true });
  expect(sub[0].locked).toBeUndefined();
  // o'chirilsa — muqovasi ham
  const key = guest[1].img!.slice('/api/site/img/'.length).split('?')[0];
  expect(await readImage(key)).not.toBeNull();
  await manageLibraryItems(admin, { op: 'remove', id: free.id! });
  expect(await readImage(key)).toBeNull();
  expect((await readLibrary(true)).map((x) => x.id)).toEqual([pro.id]);
});

it('a subscriber picks one of 5 profile looks; the leaderboard shows it only while Premium is active', async () => {
  const now = Date.UTC(2026, 10, 24, 9, 0);
  await expect(setPremiumLook(ali, 'olov', now)).rejects.toThrow('Premium');
  await grantPremium(ali.id, 'Ali Valiyev', 'AP-223', 30, 'test', now);
  expect((await premiumState(ali, now)).look).toBe('oltin'); // tanlanmagan — «Oltin toj»
  await expect(setPremiumLook(ali, 'yoq', now)).rejects.toThrow('bezak');
  await setPremiumLook(ali, 'olov', now);
  expect((await premiumState(ali, now)).look).toBe('olov');
  const board = [
    { id: ali.id, name: 'Ali Valiyev', classId: 'AP-223', academicPoints: 90 },
    { id: 'legacy_vali', name: 'Vali Karimov', classId: 'AP-223', academicPoints: 80 },
  ];
  let rows = avatarView(board, await readAvatars(now), undefined, BUILTIN_AVATARS, now).leaderboard;
  expect(rows.map((r) => (r as { pm?: string }).pm)).toEqual(['olov', undefined]);
  // obuna tugagach — bezak ko'rinmaydi
  const later = now + 31 * DAY;
  rows = avatarView(board, await readAvatars(later), undefined, BUILTIN_AVATARS, later).leaderboard;
  expect(rows.map((r) => (r as { pm?: string }).pm)).toEqual([undefined, undefined]);
  expect((await premiumState(ali, later)).look).toBeUndefined();
});

it('a subscriber puts their own badge after the name (only while Premium); the original comes back on reset', async () => {
  const now = Date.UTC(2026, 10, 25, 9, 0);
  // obunasiz — yo'q
  await expect(setPremiumMark(ali, PNG.toString('base64'), now)).rejects.toThrow('Premium');
  await managePremium(
    admin,
    { op: 'grant', uid: 'legacy_ali', name: 'Ali Valiyev', group: 'AP-223', days: 30 },
    now,
  );
  expect((await premiumView(ali, now)).mark).toBeUndefined();
  // noto'g'ri yoki juda katta rasm — yo'q
  await expect(setPremiumMark(ali, 'not base64!', now)).rejects.toThrow();
  await expect(setPremiumMark(ali, Buffer.from('salom').toString('base64'), now)).rejects.toThrow(
    'PNG',
  );
  await expect(
    setPremiumMark(ali, Buffer.alloc(400 * 1024, 1).toString('base64'), now),
  ).rejects.toThrow('300 KB');
  const v = await setPremiumMark(ali, PNG.toString('base64'), now);
  expect(v.mark).toMatch(/^\/api\/site\/img\/pm-[0-9a-f]{20}\?v=/);
  const key = v.mark!.split('/').pop()!.split('?')[0];
  expect((await readImage(key))!.bytes.equals(PNG)).toBe(true);
  // obuna tugasa — belgi ham ko'rinmaydi
  expect((await premiumView(ali, now + 31 * DAY)).mark).toBeUndefined();
  // asl belgiga qaytarish
  expect((await setPremiumMark(ali, null, now)).mark).toBeUndefined();
  expect(await readImage(key)).toBeNull();
  // o'qituvchi va administratorga kerak emas
  await expect(setPremiumMark(admin, PNG.toString('base64'), now)).rejects.toThrow('Premium');
});

it('a student pays any amount and subscribes by themselves: Premium opens at once for a month; the administrator confirms it for 1 month or 1 year, changes the term or removes', async () => {
  const now = Date.UTC(2026, 10, 25, 9, 0);
  const vali = who('legacy_vali');
  await managePremium(
    admin,
    {
      op: 'info',
      how: 'Click yoki Payme orqali',
      card: '8600 1234 5678 9012',
      holder: 'I. Sayfiddinov',
    },
    now,
  );
  // talaba karta va yo'riqnomani ko'radi (narx yo'q — ixtiyoriy)
  expect((await premiumView(ali, now)).info).toMatchObject({
    card: '8600 1234 5678 9012',
    holder: 'I. Sayfiddinov',
    how: 'Click yoki Payme orqali',
  });
  // summa shart (kamida 1 000); to'lov vaqti yoki chek shart; vaqt oxirgi 3 kun ichida
  await expect(subscribe(ali, { paidAt: now }, now)).rejects.toThrow();
  await expect(subscribe(ali, { amount: 500, paidAt: now }, now)).rejects.toThrow();
  await expect(subscribe(ali, { amount: 20000 }, now)).rejects.toMatchObject({ status: 400 });
  await expect(subscribe(ali, { amount: 20000, paidAt: now - 4 * DAY }, now)).rejects.toMatchObject(
    { status: 400 },
  );
  await expect(subscribe(ali, { amount: 20000, paidAt: now + DAY }, now)).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    subscribe(ali, { amount: 20000, receipt: Buffer.from('salom').toString('base64') }, now),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    subscribe(who('tc', 'teacher'), { amount: 20000, paidAt: now }, now),
  ).rejects.toMatchObject({ status: 400 });

  // ✅ istalgan summa + to'lov vaqti — obuna darhol 1 oyga ochiladi
  let me = await subscribe(ali, { amount: 20000, paidAt: now - 600000 }, now);
  expect(me.state).toMatchObject({ active: true, until: now + 30 * DAY });
  expect(me.claim).toMatchObject({ amount: 20000, days: 30, status: 'new' });
  // tekshirilmagan to'lov turganda ikkinchisi yo'q (bepul muddat to'plab bo'lmaydi)
  await expect(subscribe(ali, { amount: 5000, paidAt: now }, now + 1000)).rejects.toMatchObject({
    status: 409,
  });
  // chek bilan (vaqtsiz)
  me = await subscribe(vali, { amount: 100000, receipt: PNG.toString('base64') }, now + 2000);
  expect(me.state.until).toBe(now + 2000 + 30 * DAY);

  // administrator: yangi obunalar (eng yangisi birinchi), chek rasmi faqat unga
  let v = await premiumAdmin(admin, now + 3000);
  expect(v.fresh.map((c) => [c.uid, c.amount, !!c.receipt, !!c.paidAt])).toEqual([
    ['legacy_vali', 100000, true, false],
    ['legacy_ali', 20000, false, true],
  ]);
  const valiClaim = v.fresh[0];
  expect((await premiumReceipt(admin, 'legacy_vali', valiClaim.id)).bytes.equals(PNG)).toBe(true);
  await expect(premiumReceipt(ali, 'legacy_vali', valiClaim.id)).rejects.toMatchObject({
    status: 403,
  });
  const aliGrant = v.grants.find((g) => g.uid === 'legacy_ali')!;
  expect(aliGrant).toMatchObject({ since: now, term: 30, paid: 20000, claim: { status: 'new' } });

  // ✅ summaga qarab: Ali — 1 oy, Vali — 1 yil (boshlangan kunidan)
  v = await managePremium(
    admin,
    { op: 'verify', uid: 'legacy_ali', id: aliGrant.claim!.id, days: 30 },
    now + 4000,
  );
  v = await managePremium(
    admin,
    { op: 'verify', uid: 'legacy_vali', id: valiClaim.id, days: 365 },
    now + 5000,
  );
  expect(v.fresh).toEqual([]);
  expect(v.grants.find((g) => g.uid === 'legacy_vali')).toMatchObject({
    since: now + 2000,
    until: now + 2000 + 365 * DAY,
    term: 365,
  });
  expect(v.grants.find((g) => g.uid === 'legacy_ali')).toMatchObject({ until: now + 30 * DAY });
  await expect(
    managePremium(admin, { op: 'verify', uid: 'legacy_ali', id: aliGrant.claim!.id }, now),
  ).rejects.toMatchObject({ status: 409 });
  expect((await premiumView(ali, now + 4000)).claim?.status).toBe('ok');

  // 🔁 1 oylik obunani 1 yillikka o'zgartirish — boshlangan kunidan hisoblanadi
  v = await managePremium(admin, { op: 'term', uid: 'legacy_ali', days: 365 }, now + 5 * DAY);
  expect(v.grants.find((g) => g.uid === 'legacy_ali')).toMatchObject({
    since: now,
    until: now + 365 * DAY,
    term: 365,
  });
  // tugab bo'lgan muddatni tanlab bo'lmaydi
  await expect(
    managePremium(admin, { op: 'term', uid: 'legacy_ali', days: 30 }, now + 40 * DAY),
  ).rejects.toMatchObject({ status: 400 });
  // tasdiqlangach yana to'lasa — 1 oy ustiga qo'shiladi, boshlanishi o'zgarmaydi
  me = await subscribe(ali, { amount: 15000, paidAt: now + 6 * DAY }, now + 6 * DAY);
  expect(me.state.until).toBe(now + 395 * DAY);
  expect(
    (await premiumAdmin(admin, now + 6 * DAY)).grants.find((g) => g.uid === 'legacy_ali'),
  ).toMatchObject({ since: now, paid: 35000 });

  // ✖ noqonuniy obuna: chiqarib tashlanadi va o'zi qayta obuna bo'la olmaydi
  v = await managePremium(admin, { op: 'remove', uid: 'legacy_vali' }, now + 7 * DAY);
  expect(v.grants.some((g) => g.uid === 'legacy_vali')).toBe(false);
  expect(v.blocked).toMatchObject([{ key: 'legacy_vali', name: 'Ali Valiyev' }]);
  expect((await premiumState(vali, now + 7 * DAY)).active).toBe(false);
  expect(await premiumView(vali, now + 7 * DAY)).toMatchObject({ blocked: true });
  await expect(
    subscribe(vali, { amount: 5000, paidAt: now + 7 * DAY }, now + 7 * DAY),
  ).rejects.toMatchObject({ status: 403 });
  // blokdan chiqarilsa — yana o'zi obuna bo'la oladi
  v = await managePremium(admin, { op: 'unblock', key: 'legacy_vali' }, now + 8 * DAY);
  expect(v.blocked).toEqual([]);
  me = await subscribe(vali, { amount: 5000, paidAt: now + 8 * DAY }, now + 8 * DAY);
  expect(me.state.active).toBe(true);
  v = await managePremium(admin, { op: 'remove', uid: 'legacy_vali' }, now + 9 * DAY);
  expect((await premiumView(vali, now + 9 * DAY)).claim?.status).toBe('removed');
  // administrator qo'lda ochsa — blok olinadi
  await managePremium(
    admin,
    { op: 'grant', uid: 'legacy_vali', name: 'Vali', days: 30 },
    now + 9 * DAY,
  );
  expect((await premiumAdmin(admin, now + 9 * DAY)).blocked).toEqual([]);
  // talaba boshqaruv amallarini bajara olmaydi
  await expect(
    managePremium(ali, { op: 'term', uid: 'legacy_ali', days: 365 }, now),
  ).rejects.toMatchObject({ status: 403 });
});
