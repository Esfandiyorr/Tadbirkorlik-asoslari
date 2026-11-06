import { test, expect } from '@playwright/test';

/* Reyting: birinchi 10 talaba rangli qatorlarda, qolganlari oddiy oq; o'ng tomonda avatar o'rni — rangsiz soya
   (avatarlar keyin mukofot sifatida beriladi); tepada talabaning o'z o'rni va bali; kunlik/umumiy va guruh filtri. */
const names = [
  'Jasur Karimov',
  'Dilnoza Yusupova',
  'Bobur Aliyev',
  'Shahzod Rasulov',
  'Madina Ergasheva',
  'Nigora Tosheva',
  'Sardor Qodirov',
  'Malika Saidova',
  'Azizbek Umarov',
  'Kamola Nazarova',
  'Otabek Ismoilov',
  'Zarina Hamidova',
];
const today = [12, 40, 5, 33, 25, 18, 27, 0, 9, 21, 3, 15];

test('top ten rows are coloured, the rest plain, and every student sees their place and points', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.route('**/api/platform?view=academic', (route) =>
    route.fulfill({
      json: {
        leaderboard: names.map((name, i) => ({
          id: i === 4 ? 'demo-student' : 'x' + i,
          name,
          classId: i % 3 ? 'AP-223' : 'FIZ-123',
          academicPoints: 620 - i * 32.5,
          today: today[i],
        })),
      },
    }),
  );
  await page.goto('/#ranking', { waitUntil: 'domcontentloaded' });
  const rows = page.locator('.rk-list > li');
  await expect(rows).toHaveCount(12);
  for (let i = 0; i < 10; i++) await expect(rows.nth(i)).toHaveClass(new RegExp('rk-c' + (i + 1)));
  await expect(rows.nth(10)).toHaveClass(/plain/);
  await expect(rows.nth(11)).toHaveClass(/plain/);
  // Qator: o'rin, ism-familiya, guruh, ball va avatar o'rni (rasm emas, soya).
  await expect(rows.nth(0).locator('.rk-rank')).toHaveText('1');
  await expect(rows.nth(0)).toContainText('Jasur Karimov');
  await expect(rows.nth(0)).toContainText('FIZ-123');
  await expect(rows.nth(0).locator('.rk-score')).toHaveText('620 ball');
  await expect(page.locator('.rk-list .rk-slot svg')).toHaveCount(12);
  await expect(page.locator('.rk-list img')).toHaveCount(0);
  // Mening qatorim belgilangan, tepada o'rnim va balim.
  const mine = rows.nth(4);
  await expect(mine).toHaveAttribute('aria-current', 'true');
  await expect(mine).toContainText('Siz');
  const card = page.locator('.rk-mine');
  await expect(card.locator('.rk-mine-place')).toContainText('5');
  await expect(card.locator('.rk-mine-place')).toContainText('/ 12 talaba');
  await expect(card.locator('.rk-mine-score')).toContainText('490');
  await expect(card).toContainText('4-o‘ringacha 32,5 ball qoldi');

  // Kunlik reyting: faqat bugun ball olganlar, bugungi ball bo'yicha.
  await page.getByRole('tab', { name: /Kunlik/ }).click();
  await expect(page.getByRole('tab', { name: /Kunlik/ })).toHaveAttribute('aria-selected', 'true');
  await expect(rows).toHaveCount(11);
  await expect(rows.nth(0)).toContainText('Dilnoza Yusupova');
  await expect(rows.nth(0).locator('.rk-score')).toHaveText('40 ball');
  await expect(card.locator('.rk-mine-score')).toContainText('Bugungi ballingiz');
  await expect(card.locator('.rk-mine-place')).toContainText('4');
  await expect(page.locator('.rk-note')).toContainText('00:00');

  // Guruh filtri: boshqa guruhda men yo'qman — tepada shu haqda yoziladi.
  await page.getByRole('tab', { name: /Umumiy/ }).click();
  await page.locator('.rk-groups').getByRole('button', { name: 'FIZ-123' }).click();
  await expect(rows).toHaveCount(4);
  await expect(card.locator('.rk-mine-place b')).toHaveText('—');
  await expect(card).toContainText('Bu guruhda siz yo‘qsiz');
  await page.locator('.rk-groups').getByRole('button', { name: 'Hammasi' }).click();
  await expect(rows).toHaveCount(12);
  // Telefon kengligida gorizontal aylantirish yo'q.
  await page.setViewportSize({ width: 360, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});
