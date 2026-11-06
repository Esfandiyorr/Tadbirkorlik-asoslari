import { test, expect, type Page } from '@playwright/test';

/* 🛠 Sayt boshqaruvi (administrator): kartochkalar va ⚡ Jonli test bo'limi — savollar banki, kunlik jadval,
   qo'lda o'yin tuzish; talaba o'yinni yon menyudagi e'lonlar oynasida ko'radi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
/** Toshkent vaqti (UTC+5) bo'yicha sana va soat. */
const tashkent = (ms: number) => {
  const iso = new Date(ms + 18000000).toISOString();
  return { d: iso.slice(0, 10), t: iso.slice(11, 16) };
};
const live = (page: Page, input: unknown) =>
  page.request.post('/api/platform', { data: { action: 'liveAdmin', input } });

test.afterEach(async ({ page }) => {
  // Demo xotirasini tozalash — keyingi sinovlarda jonli test oynasi chiqmasin.
  await as(page, 'demo-admin');
  await live(page, { op: 'settings', on: false, time: '20:00', nq: 10, qsec: 15, off: [] });
  const v = await (await page.request.get('/api/platform?view=liveAdmin')).json();
  for (const g of v.games || []) await live(page, { op: 'cancel', d: g.d });
  if (v.bank?.length)
    await live(page, { op: 'delete', ids: v.bank.map((x: { id: string }) => x.id) });
});

test('the site manager opens with clear cards and leads to every admin task', async ({ page }) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  const hub = page.locator('.bo-hub');
  await expect(hub.getByRole('heading', { name: /Sayt boshqaruvi/ })).toBeVisible();
  for (const name of [
    'Jonli test',
    'Avatarlar',
    'E’lonlar',
    'Mavzular holati',
    'Talabalar va baholar',
  ])
    await expect(hub.locator('.bo-card-btn').filter({ hasText: name })).toBeVisible();
  // Kartochka ichki bo'limni ochadi, «← Sayt boshqaruvi» qaytaradi.
  await hub.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  await expect(page.locator('.news-manage')).toBeVisible();
  await page.getByRole('button', { name: 'Sayt boshqaruvi', exact: true }).click();
  // Boshqa tabga olib boradigan kartochka.
  await page.locator('.bo-card-btn').filter({ hasText: 'Mavzular holati' }).click();
  await expect(page.getByRole('button', { name: 'Mavzular holati', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the administrator fills the question bank, schedules daily games and creates a game', async ({
  page,
}) => {
  // E'lonlar oynasi javobi brauzerda 20 soniya keshlanadi — sinovda har safar yangisi olinsin.
  await page.route('**/api/platform?view=news', (route) => route.continue());
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Jonli test' }).click();
  await expect(page.locator('.bo-status')).toContainText('O‘chiq');

  // 📚 Ko'p savolni birdan qo'shish.
  await page.getByRole('tab', { name: /Savollar banki/ }).click();
  await page.getByRole('button', { name: /Ko‘p savol qo‘shish/ }).click();
  const words = ['narx', 'talab', 'taklif', 'raqobat', 'foyda', 'kapital'];
  await page
    .getByLabel('Savollar matni')
    .fill(
      words
        .map(
          (w, i) =>
            `${i + 1}) Bozor iqtisodiyotida ${w} nimani anglatadi?\nTo‘g‘ri javob ${w} *\nNoto‘g‘ri javob A\nNoto‘g‘ri javob B\nNoto‘g‘ri javob C`,
        )
        .join('\n\n') + '\n\nTushunarsiz blok\nfaqat bitta qator',
    );
  await expect(page.locator('.bo-form [role="status"]')).toContainText('Tayyor: 6');
  await expect(page.locator('.bo-form [role="status"]')).toContainText('tushunilmadi: 1');
  await page.getByRole('button', { name: /Bankka qo‘shish/ }).click();
  const list = page.locator('.bo-qlist li');
  await expect(list).toHaveCount(6);
  await expect(page.getByRole('tab', { name: /Savollar banki \(6\)/ })).toBeVisible();
  // ✏️ Bitta savolni tahrirlash.
  await list.filter({ hasText: 'narx' }).getByRole('button', { name: 'Tahrirlash' }).click();
  await page
    .getByRole('textbox', { name: 'Savol', exact: true })
    .fill('Bozor iqtisodiyotida narx nimani bildiradi?');
  await page.getByRole('button', { name: 'Saqlash', exact: true }).click();
  await expect(page.locator('.bo-qlist')).toContainText('narx nimani bildiradi?');
  await expect(list).toHaveCount(6);

  // 📅 Kunlik avtomatik o'yin (vaqti hozirdan uzoq — sinov paytida jonli test oynasi chiqmaydi).
  await page.getByRole('tab', { name: /Jadval va sozlama/ }).click();
  const later = tashkent(Date.now() + 6 * 3600000);
  await page.getByLabel(/Har kuni o‘zi tuzilsin/).check();
  await page.getByLabel('Vaqti', { exact: true }).fill(later.t);
  await page.getByLabel('Savollar soni').selectOption('5');
  await page.getByRole('button', { name: 'Saqlash', exact: true }).click();
  await expect(page.locator('.bo-status')).toContainText('Yoqilgan');
  await expect(page.locator('.bo-status')).toContainText(`soat ${later.t} da, 5 ta savol`);
  await expect(page.locator('.bo-list li').first()).toContainText('Avtomatik o‘yin');

  // 🎯 O'yin tuzish: kun, vaqt, eslatma va savollar.
  await page.getByRole('tab', { name: /O‘yin tuzish/ }).click();
  const own = tashkent(Date.now() + 45 * 60000);
  await page.getByLabel('Sana').fill(own.d);
  await page.getByLabel('Vaqti', { exact: true }).fill(own.t);
  await page.getByLabel(/Talabalarga eslatma/).fill('Iqtisod bo‘yicha');
  await page.getByRole('button', { name: /Tasodifiy 15 ta/ }).click();
  await expect(page.locator('.bo-qlist em')).toHaveCount(6);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /O‘yinni tuzish/ }).click();
  const first = page.locator('.bo-list li').first();
  await expect(first).toContainText('Siz tuzgan o‘yin');
  await expect(first).toContainText(own.t);
  await expect(first).toContainText('Iqtisod bo‘yicha');

  // Talaba keyingi o'yinni yon menyudagi e'lonlar oynasida ko'radi (20 daqiqadan uzoq — katta oyna yo'q).
  // (Faqat xesh o'zgargani uchun goto sahifani qayta yuklamaydi — reload kerak.)
  await as(page, 'demo-student');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const slide = page.locator('.sidebar-news .news-live');
  await expect(slide).toContainText('JONLI TEST');
  await expect(slide).toContainText(own.t);
  await expect(page.locator('.kh-pop')).toHaveCount(0);

  // ⛔ To'xtatish.
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bo-status')).toBeVisible(); // bo'lim eslab qolingan
  page.once('dialog', (d) => d.accept());
  await page.locator('.bo-list li').first().getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(page.locator('.bo-list')).not.toContainText('Siz tuzgan o‘yin');
});
