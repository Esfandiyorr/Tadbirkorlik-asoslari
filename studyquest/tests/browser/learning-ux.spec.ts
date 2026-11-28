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
    // «Joriy mavzu» kartasi yo'q — «Mavzular» kartasi birinchi ekranda, pastki menyudan yuqorida
    const action = page.locator('.home-sections .quick-link.is-topics');
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

/* 🏠 Bosh sahifa banneri: bugungi sana (Toshkent), ism va «🔔 Eslatmalar» — administrator yozganlari va avtomatik
   (bugungi jonli o'yin), bir necha soniyada almashadi; «Joriy mavzu» va kursga ruxsat kartalari bosh sahifada yo'q. */
test('the home banner shows the date, the name and the reminders the administrator controls', async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.route('**/api/platform?view=news', (route) => route.continue());
  await page.goto('/#home');
  const banner = page.locator('.home-banner');
  const today = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
  }).format(Date.now());
  await expect(banner.locator('.hb-date')).toContainText(today + '-');
  await expect(banner.getByRole('heading', { level: 1 })).toContainText('Madina');
  const box = banner.locator('.hb-reminders');
  await expect(box.getByRole('heading')).toContainText('Eslatmalar');
  await expect(box).toContainText('Hozircha eslatma yo‘q');
  await expect(page.locator('.home-course')).toHaveCount(0);
  await expect(page.locator('.dashboard-main .course-gate')).toHaveCount(0);
  // avatar tanlanmagan — banner o'ng tomonida «Avatar qo'yish»
  await expect(banner.getByRole('button', { name: 'Avatar qo‘yish' })).toBeVisible();
  await expect(page.locator('.home-sections .quick-link')).toHaveText([
    /Mavzular/,
    /Kurslar/,
    /O‘yinlar/,
    /Kitoblar/,
    /Chat/,
  ]);

  // administrator: Sayt boshqaruvi → 📢 E'lonlar → 🔔 eslatmalar (guruhga, havola bilan)
  const admin = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await admin.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  const remind = (input: Record<string, unknown>) =>
    admin.request.post('/api/platform', { data: { action: 'reminders', input } });
  try {
    await admin.goto('/#admin', { waitUntil: 'domcontentloaded' });
    await admin.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).first().click();
    const rem = admin.locator('.reminders-admin');
    await expect(rem).toContainText('Hozircha o‘zingiz yozgan eslatma yo‘q.');
    await rem.getByLabel(/Qisqa matn/).fill('Ertaga 9:00 da seminar');
    await rem.getByLabel(/Havola/).fill('#courses');
    // kimga: guruhlar ro'yxatidan belgilanadi
    await rem.getByRole('radio', { name: /Guruhlarga/ }).check();
    await rem.getByRole('checkbox', { name: /AP-223/ }).check();
    await rem.getByRole('button', { name: 'Eslatma qo‘shish' }).click();
    await expect(rem.locator('.reminders-list li')).toContainText('Ertaga 9:00 da seminar');
    await expect(rem.locator('.reminders-list li')).toContainText('👥 AP-223');
    // boshqa guruhga yozilgani bu talabaga chiqmaydi
    await remind({ op: 'add', t: 'FIZ-123 uchun eslatma', group: 'FIZ-123' });

    await page.reload();
    await expect(box.locator('li')).toHaveCount(1);
    await expect(box).toContainText('Ertaga 9:00 da seminar');
    await expect(box).not.toContainText('FIZ-123');
    await box.getByRole('button', { name: /Ertaga 9:00 da seminar/ }).click();
    await expect.poll(() => new URL(page.url()).hash).toBe('#courses');

    // bugungi jonli test (Toshkent kuni ichida) ham eslatma — ikkalasi almashib turadi
    const now = Date.now();
    const tashkentHour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Tashkent',
        hour: '2-digit',
        hour12: false,
      }).format(now),
    );
    if (tashkentHour < 23) {
      await page.unroute('**/api/platform?view=news');
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
      await page.goto('/#home');
      await page.reload();
      await page
        .getByRole('button', { name: 'Tushunarli' })
        .click({ timeout: 10000 })
        .catch(() => {});
      await expect(box.locator('li')).toHaveCount(2);
      await expect(box.locator('.hb-count')).toHaveText('1/2');
      const live = box.locator('li').filter({ hasText: 'Jonli test' });
      await expect(live.locator('em')).toHaveText(/\d\d:\d\d da/);
      // bir necha soniyada keyingisi; nuqta bilan ham tanlanadi
      await page.mouse.move(0, 0);
      await expect(box.locator('.hb-count')).toHaveText('2/2', { timeout: 12000 });
      await box.getByRole('button', { name: '1-eslatma' }).click();
      await expect(box.locator('li.is-on')).toContainText('Jonli test');
      // administrator avtomatik jonli o'yin eslatmasini o'chiradi
      await remind({ op: 'auto', live: false });
      await page.reload();
      await expect(box.locator('li')).toHaveCount(1);
      await expect(box).not.toContainText('Jonli test');
    }
  } finally {
    const view = await (await admin.request.get('/api/platform?view=reminders')).json();
    for (const r of view.items || []) await remind({ op: 'remove', id: r.id });
    await remind({ op: 'auto', live: true, topics: true });
    await admin.context().close();
  }
});

/* 📱 Telefonda (va ilovada) asosiylari: pastki menyu — Asosiy, Kurslar, Kutubxona, Xizmatlar/O'yinlar, Profil;
   bosh sahifada faqat Mavzular, Kurslar (va Pullik xizmatlar) kartalari; statistika va o'ng ustun yo'q. */
test('on a phone the app shows the essentials: topics, courses and paid services', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#home');
  const nav = page.locator('.bottom-nav a');
  // pullik xizmatlar yopiq (demo) — o'rnida O'yinlar
  await expect(nav).toHaveText(['Asosiy', 'Kurslar', 'Kutubxona', 'O‘yinlar', 'Profil']);
  await expect(page.locator('.home-sections .quick-link:visible')).toHaveText([
    /Mavzular/,
    /Kurslar/,
  ]);
  // obuna bo'lmagan talabaga — «Obuna bo'ling» kartasi (telefonda bosh sahifada)
  await expect(page.locator('.premium-side.is-home')).toContainText('Obuna bo‘ling');
  await expect(page.locator('.stats-grid')).toBeHidden();
  await expect(page.locator('.dashboard-aside')).toBeHidden();
  await expect(page.locator('.app-footer')).toBeHidden();
  // birinchi ekranda: ism, eslatmalar va asosiy kartalar
  await expect(page.locator('.home-banner .hb-reminders')).toBeInViewport();
  await expect(page.locator('.home-sections .quick-link.is-topics')).toBeInViewport();
  // «Mavzular» kartasi — asosiy fan mavzulari; pastki menyuda «Kurslar» belgilangan
  await page.locator('.home-sections .quick-link.is-topics').click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#course/tad-asoslari');
  await expect(nav.filter({ hasText: 'Kurslar' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.course-banner .legend')).toBeHidden();
  await expect(page.locator('.lesson-card').first()).toBeVisible();
  // «Kutubxona» — pastki menyudan
  await nav.filter({ hasText: 'Kutubxona' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#library');
  await expect(nav.filter({ hasText: 'Kutubxona' })).toHaveAttribute('aria-current', 'page');
  // ☰ menyuda qolganlari ham bor
  await page.getByRole('button', { name: 'Menyu' }).click();
  await expect(page.locator('.sidebar nav')).toContainText('Kutubxona');
  await expect(page.locator('.sidebar nav')).toContainText('Talabalar chati');
});
