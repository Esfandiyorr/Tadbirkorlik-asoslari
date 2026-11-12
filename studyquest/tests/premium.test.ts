import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { managePremium, premiumAdmin, premiumState, premiumView } from '../lib/server/premium';
import { manageLibraryItems, readLibrary } from '../lib/server/library';
import {
  makeDeck,
  readDeck,
  removeDeck,
  setSlidesGenerator,
  slidesView,
  tidyDeck,
} from '../lib/server/slides';
import { readImage, resetSiteMemory } from '../lib/server/site-content';

/* 💎 Obuna, 📚 kutubxona va 🎞 sun'iy intellekt taqdimoti: kim nimani ocha oladi va qancha tuza oladi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
afterEach(() => setSlidesGenerator(null));
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
    { op: 'info', price: '25 000 so‘m / oy', how: 'Click orqali to‘lang', free: 2 },
    now,
  );
  expect((await premiumView(ali, now)).info).toEqual({
    price: '25 000 so‘m / oy',
    how: 'Click orqali to‘lang',
    free: 2,
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

it('builds a presentation within the free trial, then asks for Premium, and keeps the decks', async () => {
  const now = Date.UTC(2026, 10, 12, 9, 0);
  const asked: unknown[] = [];
  setSlidesGenerator(async (r) => {
    asked.push(r);
    return {
      title: '  Marketing   strategiyasi ',
      subtitle: 'Kichik biznes uchun',
      slides: [
        ...Array.from({ length: 9 }, (_, i) => ({
          title: `Slayd ${i + 1}`,
          bullets: ['Birinchi band', '', 'Ikkinchi band', 'a', 'b', 'c', 'd', 'e'],
          notes: 'Izoh',
        })),
        { title: '', bullets: ['x'], notes: '' }, // bo'sh sarlavhali slayd tashlab yuboriladi
      ],
    };
  });
  const input = { topic: 'Marketing strategiyasi', n: 6, lang: 'uz', level: 'student' };
  let v = await slidesView(ali, now);
  expect(v).toMatchObject({ configured: true, freeLeft: 1, can: true, decks: [] });
  await expect(makeDeck(ali, { ...input, n: 40 }, now)).rejects.toThrow();
  await expect(makeDeck(ali, { ...input, topic: 'a' }, now)).rejects.toThrow();
  const made = await makeDeck(ali, { ...input, note: 'Misollar bilan' }, now);
  // faqat mavzu va talab yuboriladi — ism yoki guruh emas
  expect(asked).toEqual([{ ...input, note: 'Misollar bilan' }]);
  expect(made.deck.deck.title).toBe('Marketing strategiyasi');
  expect(made.deck.deck.slides).toHaveLength(6); // so'ralganidan ko'p bo'lsa qisqartiriladi
  expect(made.deck.deck.slides[0].bullets).toEqual([
    'Birinchi band',
    'Ikkinchi band',
    'a',
    'b',
    'c',
    'd',
  ]);
  expect(made.view).toMatchObject({ freeLeft: 0, can: false });
  expect(made.view.decks.map((d) => d.title)).toEqual(['Marketing strategiyasi']);
  // bepul sinov tugadi — obuna kerak (402), generator chaqirilmaydi
  await expect(makeDeck(ali, input, now + 1000)).rejects.toMatchObject({ status: 402 });
  expect(asked).toHaveLength(1);
  // boshqa foydalanuvchi bu taqdimotni ocha olmaydi
  await expect(readDeck(who('legacy_vali'), made.deck.id)).rejects.toMatchObject({ status: 404 });
  expect((await readDeck(ali, made.deck.id)).deck.slides).toHaveLength(6);

  // obuna bilan — kuniga 5, oyiga 40 tagacha; 12 tadan eskilari o'chadi
  await managePremium(admin, { op: 'grant', uid: 'legacy_ali', name: 'Ali', days: 60 }, now);
  // (bugungi bepul taqdimot ham hisobga kiradi — yana 4 ta)
  for (let i = 0; i < 4; i++) await makeDeck(ali, input, now + 2000 + i);
  await expect(makeDeck(ali, input, now + 5000)).rejects.toMatchObject({ status: 429 });
  for (let d = 1; d <= 2; d++)
    for (let i = 0; i < 5; i++) await makeDeck(ali, input, now + d * DAY + i); // ertasiga yana mumkin
  v = await slidesView(ali, now + 2 * DAY + 10);
  expect(v.decks).toHaveLength(12);
  expect(v).toMatchObject({ todayLeft: 0, monthLeft: 25, can: false });
  v = await removeDeck(ali, v.decks[0].id, now + 2 * DAY + 10);
  expect(v.decks).toHaveLength(11);
  // oylik chegara: 40 taga yetgach — keyingi oygacha to'xtaydi, yangi oyda yana ochiladi
  for (let d = 3; d <= 7; d++)
    for (let i = 0; i < 5; i++) await makeDeck(ali, input, now + d * DAY + i);
  await expect(makeDeck(ali, input, now + 8 * DAY)).rejects.toMatchObject({ status: 429 });
  expect(await slidesView(ali, now + 8 * DAY)).toMatchObject({ todayLeft: 0, monthLeft: 0 });
  const nextMonth = Date.UTC(2026, 11, 1, 9, 0);
  expect(await slidesView(ali, nextMonth)).toMatchObject({
    todayLeft: 5,
    monthLeft: 40,
    can: true,
  });

  // generator xato qilsa — sinov sarflanmaydi va «band» belgisi qolmaydi
  const vali = who('legacy_vali');
  setSlidesGenerator(async () => {
    throw new Error('tarmoq');
  });
  await expect(makeDeck(vali, input, now)).rejects.toThrow('tarmoq');
  setSlidesGenerator(async () => ({ title: 't', subtitle: '', slides: [] }));
  await expect(makeDeck(vali, input, now + 1)).rejects.toMatchObject({ status: 502 });
  expect(await slidesView(vali, now)).toMatchObject({ freeLeft: 1, can: true });
  expect(() => tidyDeck({ title: 1 }, 5)).toThrow();
});
