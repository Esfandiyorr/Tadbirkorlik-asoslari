import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { managePromo, promoImage, readPromo } from '../lib/server/promo';
import { readImage, resetSiteMemory } from '../lib/server/site-content';

/* 🛍 2-e'lon oynasi: mahsulot, kurs va grant reklamasi — faqat administrator yozadi, muddati o'tgani ko'rinmaydi,
   rasm baytlari turi bo'yicha tekshiriladi va e'lon o'chirilsa — rasmi ham o'chadi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const admin = { id: 'owner', role: 'admin', name: 'Admin' } as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const now = Date.UTC(2026, 10, 7, 9, 0);
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);

it('only the administrator posts offers; bad input is rejected', async () => {
  await expect(
    managePromo(teacher, { op: 'add', kind: 'course', h: 'Kurs' }, now),
  ).rejects.toThrow();
  await expect(managePromo(admin, { op: 'add', kind: 'shop', h: 'Kurs' }, now)).rejects.toThrow();
  await expect(managePromo(admin, { op: 'add', kind: 'course', h: 'x' }, now)).rejects.toThrow();
  await expect(
    managePromo(admin, { op: 'add', kind: 'grant', h: 'Grant', link: 'javascript:alert(1)' }, now),
  ).rejects.toThrow();
  await expect(
    managePromo(admin, { op: 'add', kind: 'grant', h: 'Grant', extra: 1 }, now),
  ).rejects.toThrow();
  expect(await readPromo(now)).toEqual([]);
});

it('offers are listed newest first, expire by date and lose their picture when removed', async () => {
  const a = await managePromo(
    admin,
    {
      op: 'add',
      kind: 'grant',
      h: 'Yoshlar grant dasturi',
      t: '50 mln so‘mgacha, ariza 1-dekabrgacha',
      link: 'https://example.uz/grant',
      cta: 'Ariza topshirish',
      until: now + 86400000,
    },
    now,
  );
  expect(a.id).toMatch(/^[a-z0-9-]+$/);
  const b = await managePromo(
    admin,
    { op: 'add', kind: 'course', h: 'Excel kursi', link: '#courses' },
    now + 1000,
  );
  expect(b.promo.map((x) => x.h)).toEqual(['Excel kursi', 'Yoshlar grant dasturi']);
  expect(b.promo[1]).toMatchObject({
    kind: 'grant',
    t: '50 mln so‘mgacha, ariza 1-dekabrgacha',
    cta: 'Ariza topshirish',
    at: now,
  });
  // rasm: faqat haqiqiy rasm baytlari, faqat mavjud e'longa
  await expect(promoImage(admin, a.id!, Buffer.from('<svg/>'), now)).rejects.toThrow();
  await expect(promoImage(admin, 'yoq-id', png, now)).rejects.toThrow();
  await expect(promoImage(teacher, a.id!, png, now)).rejects.toThrow();
  const withImg = await promoImage(admin, a.id!, png, now + 2000);
  const item = withImg.promo.find((x) => x.id === a.id)!;
  expect(item.img).toBe('/api/site/img/pr-' + a.id + '?v=' + (now + 2000).toString(36));
  expect((await readImage('pr-' + a.id))?.type).toBe('image/png');
  // muddati o'tgach ko'rinmaydi
  expect((await readPromo(now + 2 * 86400000)).map((x) => x.h)).toEqual(['Excel kursi']);
  // o'chirilsa — rasmi ham o'chadi
  const left = await managePromo(admin, { op: 'remove', id: a.id }, now + 3000);
  expect(left.promo.map((x) => x.h)).toEqual(['Excel kursi']);
  expect(await readImage('pr-' + a.id)).toBeNull();
});
