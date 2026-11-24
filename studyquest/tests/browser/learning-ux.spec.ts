import { test, expect } from '@playwright/test';

test('course progress belongs to its course and does not change saved grades', async ({ page }) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  const before = await (await page.request.get('/api/platform')).json();
  await page.goto('/#home');
  const cards = page.locator('.dashboard-main .course-card');
  await expect(cards.filter({ hasText: 'Tadbirkorlik asoslari' })).toContainText('186,5 / 1500');
  await expect(cards.filter({ hasText: 'Restoran xodimlari' })).not.toContainText('186,5');
  await page.goto('/#course/tad-asoslari');
  await expect(page.locator('.course-banner')).toContainText('186,5 / 1500');
  const after = await (await page.request.get('/api/platform')).json();
  expect(after.user.academicPoints).toBe(before.user.academicPoints);
  expect(after.user.readingHistory).toEqual(before.user.readingHistory);
});

for (const width of [320, 390])
  test(`continue action is above the bottom navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
    await page.goto('/#home');
    const action = page.locator('.home-course .hero-button');
    await expect(action).toBeVisible();
    const button = (await action.boundingBox())!,
      nav = (await page.locator('.bottom-nav').boundingBox())!;
    expect(button.y).toBeGreaterThan(0);
    expect(button.y + button.height).toBeLessThan(nav.y);
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });

test('lesson status filters and public lesson plans work without granting course access', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#course/tad-asoslari');
  await page.getByRole('button', { name: 'Tugallangan', exact: true }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(1);
  await expect(page.locator('.lesson-card')).toContainText('Tadbirkorlik tafakkuri');
  await page.getByRole('button', { name: 'Davom etmoqda', exact: true }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(2);
  await page.goto('/#course/restoran');
  const plan = page
    .locator('.lesson-item')
    .filter({ hasText: 'Menyu va allergenlar bilan ishlash' })
    .locator('.lesson-plan-preview');
  const group = page
    .locator('.course-module')
    .filter({ hasText: 'Menyu bilan ishlash va xalqaro xizmat amaliyoti' });
  if ((await group.getAttribute('open')) === null) await group.locator(':scope > summary').click();
  await plan.locator('summary').click();
  await expect(plan).toContainText('Yong‘oqqa allergiyasi bor mehmon');
  expect((await page.request.get('/api/platform?view=legacyLesson&lesson=r5')).status()).toBe(403);
});

/* 🏠 Bosh sahifa banneri: bugungi sana (Toshkent), ism, «Bugungi rejalar» (bo'sh holat va bugungi jonli o'yin),
   joriy mavzu alohida kartada, bo'lim kartalari. */
test('the home banner shows the date, the name and today’s plans; the current topic has its own card', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#home');
  const banner = page.locator('.home-banner');
  const today = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
  }).format(Date.now());
  await expect(banner.locator('.hb-date')).toContainText(today + '-');
  await expect(banner.getByRole('heading', { level: 1 })).toContainText('Madina');
  await expect(banner.locator('.hb-plans')).toContainText('Bugun rejalashtirilgan ish yo‘q');
  // avatar tanlanmagan — banner o'ng tomonida «Avatar qo'yish»
  await expect(banner.getByRole('button', { name: 'Avatar qo‘yish' })).toBeVisible();
  const course = page.locator('.home-course');
  await expect(course).toContainText('Joriy mavzu');
  await expect(course.locator('.hero-button')).toHaveText(/Davom ettirish|Boshlash/);
  await expect(page.locator('.home-sections .quick-link')).toHaveText([
    /Mavzular/,
    /Kurslar/,
    /O‘yinlar/,
    /Kitoblar/,
    /Chat/,
  ]);
  // bugungi jonli test (Toshkent kuni ichida) rejalarda vaqti bilan
  const now = Date.now();
  const tashkentHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tashkent',
      hour: '2-digit',
      hour12: false,
    }).format(now),
  );
  test.skip(tashkentHour >= 23, 'Toshkentda kun tugayapti — bugungi o‘yinni qo‘yib bo‘lmaydi');
  await page.route('**/api/platform?view=news', async (route) => {
    const response = await route.fetch(),
      body = await response.json();
    body.live = {
      d: 'demo-game',
      open: now - 60000,
      start: now + 30 * 60000,
      end: now + 45 * 60000,
      type: 'quiz',
      nq: 5,
      qsec: 15,
    };
    await route.fulfill({ response, json: body });
  });
  await page.reload();
  await page
    .getByRole('button', { name: 'Tushunarli' })
    .click({ timeout: 10000 })
    .catch(() => {});
  const plan = page.locator('.hb-plans li');
  await expect(plan).toHaveCount(1);
  await expect(plan).toContainText('Jonli test');
  await expect(plan.locator('em')).toHaveText(/\d\d:\d\d da/);
});

/* 📱 Telefonda (va ilovada) asosiylari: pastki menyu — Asosiy, Mavzular, Kurslar, Xizmatlar/O'yinlar, Profil;
   bosh sahifada faqat Mavzular, Kurslar (va Pullik xizmatlar) kartalari; statistika va o'ng ustun yo'q. */
test('on a phone the app shows the essentials: topics, courses and paid services', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#home');
  const nav = page.locator('.bottom-nav a');
  // pullik xizmatlar yopiq (demo) — o'rnida O'yinlar
  await expect(nav).toHaveText(['Asosiy', 'Mavzular', 'Kurslar', 'O‘yinlar', 'Profil']);
  await expect(page.locator('.home-sections .quick-link:visible')).toHaveText([
    /Mavzular/,
    /Kurslar/,
  ]);
  // obuna bo'lmagan talabaga — «Obuna bo'ling» kartasi (telefonda bosh sahifada)
  await expect(page.locator('.premium-side.is-home')).toContainText('Obuna bo‘ling');
  await expect(page.locator('.stats-grid')).toBeHidden();
  await expect(page.locator('.dashboard-aside')).toBeHidden();
  await expect(page.locator('.app-footer')).toBeHidden();
  // birinchi ekranda: ism, rejalar, joriy mavzu tugmasi va asosiy kartalar
  await expect(page.locator('.home-banner .hb-plans')).toBeInViewport();
  await expect(page.locator('.home-course .hero-button')).toBeInViewport();
  await expect(page.locator('.home-sections .quick-link.is-topics')).toBeInViewport();
  // «Mavzular» — asosiy fan mavzulari
  await nav.filter({ hasText: 'Mavzular' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#course/tad-asoslari');
  await expect(nav.filter({ hasText: 'Mavzular' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.course-banner .legend')).toBeHidden();
  await expect(page.locator('.lesson-card').first()).toBeVisible();
  // ☰ menyuda qolganlari ham bor
  await page.getByRole('button', { name: 'Menyu' }).click();
  await expect(page.locator('.sidebar nav')).toContainText('Kutubxona');
  await expect(page.locator('.sidebar nav')).toContainText('Talabalar chati');
});
