import { test, expect, type Page } from '@playwright/test';

/* 📢 E'lonlar oynasi (yon menyu, har 5 soniyada almashadi) va ⚡ jonli test oynasi (boshlanishidan 20 daqiqa oldin). */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
/** Jonli test jadvalini soxtalashtirish: asl bazadagi kahoot/idx o'rniga. */
async function withLive(page: Page, inMinutes: number, type: 'quiz' | 'yz' = 'quiz') {
  const now = Date.now();
  await page.route('**/api/platform?view=news', async (route) => {
    const response = await route.fetch(),
      body = await response.json();
    body.live = {
      d: 'demo-game',
      open: now + (inMinutes - 15) * 60000,
      start: now + inMinutes * 60000,
      end: now + (inMinutes + 15) * 60000,
      type,
      nq: 12,
      qsec: 15,
    };
    await route.fulfill({ response, json: body });
  });
}

test('the administrator posts announcements and the side box rotates them every five seconds', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  // Boshqaruv → 🛠 Sayt boshqaruvi → «📢 E'lonlar» kartochkasi.
  await page.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  const panel = page.locator('.news-manage');
  for (const [h, t] of [
    ['Amaliy mashg‘ulot', 'Seshanba kuni 3-mavzu bo‘yicha amaliy mashg‘ulot bo‘ladi.'],
    ['', 'Reytingda 1–10-o‘ringa chiqing va avatar tanlang'],
  ]) {
    if (h) await panel.getByLabel('Sarlavha').fill(h);
    await panel.getByLabel('E’lon matni').fill(t);
    await panel.getByRole('button', { name: /E’lon joylash/ }).click();
    await expect(panel.locator('.news-admin-list')).toContainText(t);
  }
  const box = page.locator('.sidebar-news');
  await expect(box.locator('.news-dots button')).toHaveCount(2);
  const text = () => box.locator('.news-slide').textContent();
  const first = await text();
  // 5 soniyadan keyin keyingi e'lon.
  await expect.poll(text, { timeout: 8000 }).not.toBe(first);
  await expect(box.getByRole('button', { name: 'E’lon qo‘shish' })).toBeVisible();
  // To'xtatish tugmasi almashishni to'xtatadi.
  await box.getByRole('button', { name: 'To‘xtatish' }).click();
  await page.mouse.move(800, 800);
  const held = await text();
  await page.waitForTimeout(6000);
  expect(await text()).toBe(held);
  // Tozalash: e'lonlarni o'chirish.
  for (let i = 0; i < 2; i++) {
    await panel
      .getByRole('button', { name: /O‘chirish/ })
      .first()
      .click();
    await expect(panel.locator('.news-admin-list li:not(.muted)')).toHaveCount(1 - i);
  }
});

test('students see a small live quiz card twenty minutes before the start and may close it', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await withLive(page, 10);
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const card = page.getByRole('dialog', { name: 'Jonli test bor!' });
  await expect(card).toContainText('Lobbi ochiq');
  await expect(card).toContainText('12 ta savol');
  await expect(card.locator('.kh-pop-meta b')).toHaveText(/⏱ (09|10):\d\d/);
  // Kichik kartochka: ekranni to'sib qo'ymaydi, sahifa ishlatiladi.
  const box = (await card.boundingBox())!;
  expect(box.width).toBeLessThan(400);
  await expect(page.locator('.hero-avatar')).toBeVisible();
  await card.getByRole('button', { name: /O‘yinga kirish/ }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#arena/play/live');
  await expect(card).toBeHidden();
  await page.goto('/#ranking', { waitUntil: 'domcontentloaded' });
  await expect(card).toBeVisible();
  // Talaba qatnashmasligi mumkin: yopilgani qayta yuklanganda ham saqlanadi.
  await card.getByRole('button', { name: 'Qatnashmayman' }).click();
  await expect(card).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sidebar-news .news-live')).toContainText('Lobbi ochiq');
  await expect(card).toBeHidden();
  // Fikrini o'zgartirsa — yon menyudagi e'lonlar oynasidan kiradi.
  await page
    .locator('.sidebar-news')
    .getByRole('link', { name: /O‘yinga kirish/ })
    .click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#arena/play/live');
});

test('teachers close the card too, and a later game only shows its time', async ({ page }) => {
  await as(page, 'demo-teacher');
  await withLive(page, 15, 'yz');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const card = page.getByRole('dialog', { name: 'Yozuv marafoni bor!' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Yopish' }).click();
  await expect(card).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sidebar-news .news-live')).toBeVisible();
  await expect(card).toBeHidden();

  const later = await page.context().newPage();
  await as(later, 'demo-student');
  await withLive(later, 120);
  await later.goto('/#home', { waitUntil: 'domcontentloaded' });
  const slide = later.locator('.sidebar-news .news-live');
  await expect(slide).toContainText('JONLI TEST');
  await expect(slide).toContainText(/bugun|ertaga/);
  await expect(slide).toContainText('boshlanishiga');
  await expect(later.locator('.kh-pop')).toHaveCount(0);
});

test('the administrator fills the second box with offers and students see them under the menu', async ({
  page,
  browser,
}) => {
  const student = async () => {
    const p = await (
      await browser.newContext({ baseURL: test.info().project.use.baseURL })
    ).newPage();
    await as(p, 'demo-student');
    await p.goto('/#home', { waitUntil: 'domcontentloaded' });
    await expect(p.locator('.sidebar-news')).toBeVisible();
    return p;
  };
  // Bo'sh 2-e'lon oynasini talaba ko'rmaydi; «Joriy mavzu» bloki endi yon menyuda yo'q.
  const s1 = await student();
  await expect(s1.locator('.sidebar-promo')).toHaveCount(0);
  await expect(s1.locator('.sidebar-current')).toHaveCount(0);
  await s1.context().close();

  // Administrator bo'sh oynada izohni va «+» tugmasini ko'radi — u «Sayt boshqaruvi → 2-e'lon oynasi»ni ochadi.
  await as(page, 'demo-admin');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const side = page.locator('.sidebar-promo');
  await expect(side).toContainText('2-E’LON OYNASI');
  await side.getByRole('button', { name: 'Reklama qo‘shish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const panel = page.locator('.promo-manage');
  await expect(panel).toBeVisible();
  await panel.getByRole('radio', { name: /Grant dasturi/ }).click();
  await panel.getByLabel('Sarlavha').fill('Yoshlar grant dasturi');
  await panel
    .getByLabel('Qisqa matn')
    .fill('Startaplar uchun 50 mln so‘mgacha grant. Ariza 1-dekabrgacha.');
  await panel.getByLabel('Havola').fill('https://example.uz/grant');
  await panel.getByLabel('Tugma yozuvi').fill('Ariza topshirish');
  await panel.getByLabel('Rasm', { exact: true }).setInputFiles('public/terdu-logo.png');
  // Ko'rinishi: joylashdan oldin qanday chiqishi.
  const preview = panel.locator('.promo-preview');
  await expect(preview).toContainText('Yoshlar grant dasturi');
  await expect(preview.locator('img.promo-img')).toBeVisible();
  await panel.getByRole('button', { name: /E’lonni joylash/ }).click();
  await expect(panel.locator('.promo-admin-list')).toContainText('Yoshlar grant dasturi');
  await expect(panel.locator('.promo-admin-list img')).toHaveAttribute(
    'src',
    /^\/api\/site\/img\/pr-/,
  );
  await panel.getByRole('radio', { name: /Kurs/ }).click();
  await panel.getByLabel('Sarlavha').fill('Excel bo‘yicha bepul kurs');
  await panel.getByLabel('Havola').fill('#courses');
  await panel.getByRole('button', { name: /E’lonni joylash/ }).click();
  await expect(panel.locator('.promo-admin-list li')).toHaveCount(2);
  await expect(side.locator('.promo-dots button')).toHaveCount(2);

  // Talaba ikkala taklifni yon menyuda ko'radi (har 6 soniyada almashadi), «+» tugmasi yo'q.
  const s2 = await student();
  const box = s2.locator('.sidebar-promo');
  await expect(box.locator('.promo-dots button')).toHaveCount(2);
  await expect(box.getByRole('button', { name: 'Reklama qo‘shish' })).toHaveCount(0);
  await box.locator('.promo-dots button').nth(1).click();
  await expect(box.locator('.promo-kind')).toContainText('Grant dasturi');
  await expect(box.locator('.promo-kind')).toContainText('YANGI');
  const cta = box.getByRole('link', { name: /Ariza topshirish/ });
  await expect(cta).toHaveAttribute('href', 'https://example.uz/grant');
  await expect(cta).toHaveAttribute('target', '_blank');
  const img = box.locator('img.promo-img');
  await expect(img).toHaveAttribute('src', /^\/api\/site\/img\/pr-[a-z0-9-]+\?v=/);
  expect(
    (await s2.request.get((await img.getAttribute('src'))!)).headers()['content-type'],
  ).toMatch(/^image\//);
  await box.locator('.promo-dots button').nth(0).click();
  await expect(box).toContainText('Excel bo‘yicha bepul kurs');
  await expect(box.getByRole('link', { name: /Batafsil/ })).toHaveAttribute('href', '#courses');
  await s2.context().close();

  // Tozalash.
  for (let i = 0; i < 2; i++) {
    await panel
      .getByRole('button', { name: /O‘chirish/ })
      .first()
      .click();
    await expect(panel.locator('.promo-admin-list li:not(.muted)')).toHaveCount(1 - i);
  }
  await expect(side).toContainText('2-E’LON OYNASI');
});
