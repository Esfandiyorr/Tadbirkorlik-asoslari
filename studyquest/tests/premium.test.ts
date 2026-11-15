import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { managePremium, premiumAdmin, premiumState, premiumView } from '../lib/server/premium';
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
  // muddati o'tgach — o'zi tugaydi
  expect((await premiumState(ali, now + 38 * DAY)).active).toBe(false);
  expect((await premiumAdmin(admin, now + 38 * DAY)).active).toBe(0);
  // narx va yo'riqnoma talabaga ko'rinadi
  await managePremium(
    admin,
    { op: 'info', price: '25 000 so‘m / oy', how: 'Click orqali to‘lang' },
    now,
  );
  expect((await premiumView(ali, now)).info).toEqual({
    price: '25 000 so‘m / oy',
    how: 'Click orqali to‘lang',
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
