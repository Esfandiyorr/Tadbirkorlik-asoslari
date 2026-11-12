import { test, expect, type Page } from '@playwright/test';

/* Yangi menyu: 🏆 reyting kurs ichida; o'rnida 📚 Kutubxona va 🎞 Taqdimot (sun'iy intellekt, pullik).
   Demo muhitda taqdimotni namunaviy generator tuzadi — tashqi xizmatga so'rov yuborilmaydi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
const act = (page: Page, action: string, input: unknown) =>
  page.request.post('/api/platform', { data: { action, input } });

test('the leaderboard lives inside the course and the menu offers the library and presentations', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const side = page.locator('.sidebar nav');
  await expect(side.locator('a[href="#library"]')).toHaveText('Kutubxona');
  await expect(side.locator('a[href="#slides"]')).toHaveText('Taqdimot');
  await expect(side.locator('a[href="#ranking"]')).toHaveCount(0);
  // kurs ichida ikki bo'lim: Mavzular va Reyting
  await side.locator('a[href="#courses"]').click();
  await page.locator('.course-card').first().click();
  await expect(page.getByRole('tab', { name: 'Mavzular' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('.lesson-grid')).toBeVisible();
  await page.getByRole('tab', { name: 'Reyting' }).click();
  await expect.poll(() => new URL(page.url()).hash).toMatch(/^#course\/[^/]+\/ranking$/);
  await expect(page.locator('.rk-page.is-embedded')).toBeVisible();
  await expect(page.locator('.lesson-grid')).toHaveCount(0);
  await expect(page.locator('.course-banner')).toBeVisible();
  // eski havola (#ranking) ham shu yerga olib keladi
  await page.goto('/#ranking', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.rk-page.is-embedded')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Reyting' })).toHaveAttribute('aria-selected', 'true');
});

test('the administrator fills the library; premium resources open only with Premium', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#library', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.soft-empty')).toContainText('Kutubxona hozircha bo‘sh');
  await page.getByRole('button', { name: 'Manba qo‘shish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const form = page.locator('.bo-section .bo-form');
  await form.getByLabel('Turi').selectOption('guide');
  await form.getByLabel('Muallif yoki manba').fill('TerDU');
  await form.getByLabel('Nomi', { exact: true }).fill('Biznes-reja tuzish qo‘llanmasi');
  await form.getByLabel(/Qisqa izoh/).fill('Bosqichma-bosqich, namunalar bilan');
  await form.getByLabel('Havola').fill('example.uz/reja');
  await expect(form.getByText('Havola https:// bilan boshlansin.')).toBeVisible();
  await form.getByLabel('Havola').fill('https://example.uz/reja');
  await form.getByLabel('Rasm', { exact: true }).setInputFiles('public/terdu-logo.png');
  await form.getByRole('button', { name: /Kutubxonaga qo‘shish/ }).click();
  await expect(page.locator('.bo-lib-list')).toContainText('Biznes-reja tuzish qo‘llanmasi');
  await form.getByLabel('Turi').selectOption('template');
  await form.getByLabel('Nomi', { exact: true }).fill('Moliyaviy model namunasi');
  await form.getByLabel('Havola').fill('https://example.uz/model');
  await form.getByLabel(/Faqat obunachilar uchun/).check();
  await form.getByRole('button', { name: /Kutubxonaga qo‘shish/ }).click();
  await expect(page.locator('.bo-lib-list li')).toHaveCount(2);

  // talaba: ochiq manba havola bo'lib ochiladi, 💎 manba — «obuna» oynasini chiqaradi
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  await student.goto('/#library', { waitUntil: 'domcontentloaded' });
  const cards = student.locator('.lib-card');
  await expect(cards).toHaveCount(2);
  const open = cards.filter({ hasText: 'Biznes-reja tuzish qo‘llanmasi' });
  await expect(open).toHaveAttribute('href', 'https://example.uz/reja');
  await expect(open.locator('.lib-cover img')).toHaveAttribute('src', /^\/api\/site\/img\/lb-/);
  const locked = cards.filter({ hasText: 'Moliyaviy model namunasi' });
  await expect(locked).toContainText('Obuna bilan ochiladi');
  expect(await locked.getAttribute('href')).toBeNull();
  await locked.click();
  const offer = student.getByRole('dialog', { name: /Obuna bilan ko‘proq imkoniyat/ });
  await expect(offer).toBeVisible();
  await offer.getByRole('button', { name: 'Keyinroq' }).click();
  // qidiruv va tur bo'yicha saralash
  await student.getByLabel('Kutubxonadan qidirish').fill('moliyaviy');
  await expect(cards).toHaveCount(1);
  await student.getByLabel('Kutubxonadan qidirish').fill('');
  await student
    .locator('.lib-kinds')
    .getByRole('button', { name: /Qo‘llanma/ })
    .click();
  await expect(cards).toHaveCount(1);

  // administrator obuna beradi — 💎 manba ochiladi
  const me = (await (await student.request.get('/api/platform')).json()).user;
  expect(
    (await act(page, 'premiumAdmin', { op: 'grant', uid: me.id, name: me.name, days: 30 })).ok(),
  ).toBe(true);
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.premium-badge')).toContainText('Obuna');
  await expect(
    student.locator('.lib-card').filter({ hasText: 'Moliyaviy model namunasi' }),
  ).toHaveAttribute('href', 'https://example.uz/model');
  await student.context().close();

  // tozalash
  await act(page, 'premiumAdmin', { op: 'revoke', uid: me.id });
  for (let i = 0; i < 2; i++) {
    page.once('dialog', (d) => void d.accept());
    await page
      .locator('.bo-lib-list')
      .getByRole('button', { name: /O‘chirish/ })
      .first()
      .click();
    await expect(page.locator('.bo-lib-list li:not(.muted)')).toHaveCount(1 - i);
  }
});

test('a student builds a free presentation, views it, downloads PowerPoint and then needs Premium', async ({
  page,
}) => {
  await as(page, 'demo-teacher'); // boshqa sinovlardagi talabadan mustaqil bo'lishi uchun avval o'qituvchi holati
  await page.goto('/#slides', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sm-access.is-on')).toContainText('Bugun yana');
  await as(page, 'demo-student');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sm-access.is-free')).toContainText('1 ta bepul taqdimot');
  const form = page.locator('.sm-form');
  const go = form.getByRole('button', { name: 'Taqdimot tuzish' });
  await expect(go).toBeDisabled();
  await form.getByLabel('Taqdimot mavzusi').fill('Kichik biznesda marketing');
  await form.getByLabel('Slaydlar soni').fill('6');
  await form.getByRole('radio', { name: /Chuqur/ }).click();
  await go.click();
  await expect(page.getByText('🎞 Taqdimot tayyor!')).toBeVisible();
  const viewer = page.locator('.sm-viewer');
  await expect(viewer.locator('.sm-slide.is-cover h2')).toHaveText('Kichik biznesda marketing');
  await expect(viewer.locator('.sm-pos')).toHaveText('1 / 7');
  await page.keyboard.press('ArrowRight');
  await expect(viewer.locator('.sm-pos')).toHaveText('2 / 7');
  await expect(viewer.locator('.sm-slide li')).toHaveCount(3);
  await expect(viewer.locator('.sm-notes')).toContainText('Gapirib berish uchun');
  await viewer.getByRole('button', { name: 'Keyingi slayd' }).click();
  await expect(viewer.locator('.sm-pos')).toHaveText('3 / 7');
  // rang mavzusi
  await viewer.getByRole('radio', { name: 'Okean' }).click();
  await expect(viewer).toHaveAttribute('style', /--dk-bg:\s*#0C4A6E/i);
  // PowerPoint fayli
  const download = page.waitForEvent('download');
  await viewer.getByRole('button', { name: /PowerPoint/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('Kichik biznesda marketing.pptx');
  // ro'yxatda saqlangan; bepul sinov tugadi — ikkinchisi obuna so'raydi
  await expect(page.locator('.sm-mine li')).toHaveCount(1);
  await expect(page.locator('.sm-access.is-off')).toContainText('Bepul taqdimotlar tugadi');
  await form.getByLabel('Taqdimot mavzusi').fill('Biznes reja');
  await go.click();
  await expect(page.getByRole('dialog', { name: /Obuna bilan ko‘proq imkoniyat/ })).toBeVisible();
  await page.getByRole('button', { name: 'Keyinroq' }).click();
  // telefon kengligida ham sig'adi
  await page.setViewportSize({ width: 380, height: 760 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(381);
  // o'chirish
  page.once('dialog', (d) => void d.accept());
  await page
    .locator('.sm-mine')
    .getByRole('button', { name: /O‘chirish/ })
    .click();
  await expect(page.locator('.sm-mine')).toHaveCount(0);
  await expect(page.locator('.sm-viewer')).toHaveCount(0);
});
