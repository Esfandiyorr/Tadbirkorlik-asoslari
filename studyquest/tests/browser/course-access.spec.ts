import { test, expect, type Page } from '@playwright/test';

async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
const noScroll = (page: Page) =>
  expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(0);

test('the sign-in page: name and password, three languages, sign-up with «Are you a student?», guest and help', async ({
  page,
}) => {
  await page.route('**/api/platform', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const state = await response.json();
    state.mode = 'legacy';
    delete state.user;
    await route.fulfill({ response, json: state });
  });
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto('/#login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('www.tadbirkorlik-asoslari.uz');
  await expect(page.getByLabel('Ism familiya')).toHaveAttribute('placeholder', 'Ism familiya');
  await expect(page.getByLabel('Parol')).toHaveAttribute('type', 'password');
  const loginButton = page.getByRole('button', { name: 'Kirish', exact: true });
  await expect(loginButton).toBeVisible();
  // Google bilan kirish asosiy oynada ham; ortiqcha narsa yo'q: email maydoni, video va dizayn tanlovi
  await expect(page.getByRole('button', { name: 'Google orqali kirish' })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toHaveCount(0);
  await expect(page.locator('video')).toHaveCount(0);
  // talaba kirishi yashirin oynada — avvalgi talaba tizimi
  await expect(page.locator('#student-login')).toHaveAttribute('src', /studyquest=login/);
  await noScroll(page);
  // tillar tepada
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeVisible();
  await page.getByRole('button', { name: 'Русский' }).click();
  await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Гость' })).toBeVisible();
  await page.getByRole('button', { name: 'O‘zbekcha' }).click();
  // faqat ism yozilsa — tushuntirish
  await page.getByLabel('Ism familiya').fill('Ali');
  await loginButton.click();
  await expect(page.locator('.la-error')).toHaveText('Ism va familiyangizni to‘liq yozing.');

  // «Ro‘yxatdan o‘tish» → ism-familiya yoki Google → «Talabamisiz?» → guruh
  await page.getByRole('button', { name: 'Ro‘yxatdan o‘tish' }).click();
  await expect(page.getByRole('heading', { name: 'Ro‘yxatdan o‘tish' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google orqali kirish' })).toBeVisible();
  await expect(page.locator('.auth-legal a')).toHaveAttribute('href', /^\/privacy\?lang=uz/);
  await page.getByLabel('Ism', { exact: true }).fill('Aziz');
  await page.getByLabel('Familiya').fill('Karimov');
  await page.getByRole('button', { name: 'Davom etish' }).click();
  await expect(page.getByRole('heading', { name: 'Talabamisiz?' })).toBeVisible();
  await page.getByRole('button', { name: /Ha, talabaman/ }).click();
  const list = page.getByLabel('Ro‘yxatdan tanlang');
  await expect(list.locator('option', { hasText: 'YES-123' })).toHaveCount(1);
  const own = page.getByLabel('yoki o‘zingiz yozing');
  await expect(own).toHaveAttribute('placeholder', 'Masalan: Yes-123');
  await own.fill('Maxsus-7');
  await list.selectOption('AP-223');
  await expect(own).toHaveValue('');
  await noScroll(page);
  await page.getByRole('button', { name: 'Orqaga' }).click();
  await page.getByRole('button', { name: 'Orqaga' }).click();
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();

  // «Mehmon» — sayt tuzilishi va kurslar
  await page.getByRole('button', { name: 'Mehmon' }).click();
  await expect(page.getByRole('heading', { name: 'Sayt haqida' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sayt tuzilishi' })).toBeVisible();
  await expect(page.locator('.la-courses')).toContainText('Tadbirkorlik asoslari');
  await expect(page.locator('.la-courses')).toContainText('15 ta mavzu');
  await noScroll(page);
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();

  // «?» — kirishda yordam
  await page.getByRole('button', { name: 'Kirishda yordam' }).click();
  await expect(page.locator('.la-tips')).toContainText('1111');
  await expect(page.locator('.account-help')).toBeVisible();
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
  await page.getByRole('button', { name: 'Mehmon' }).click();
  await page.getByRole('button', { name: 'Saytni mehmon sifatida ko‘rish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#courses');
});

test('someone without an assigned group requests approval and can check the result', async ({
  page,
}) => {
  await as(page, 'demo-student');
  const asked: Record<string, string>[] = [];
  let course: Record<string, unknown> = { ok: false, pending: null };
  await page.route('**/api/platform', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      if (body?.action !== 'courseRequest') return route.continue();
      asked.push(body.input);
      course =
        body.input.op === 'cancel'
          ? { ok: false, pending: null }
          : {
              ok: false,
              pending: Date.now(),
              ...(body.input.group ? { group: body.input.group } : {}),
            };
      return route.fulfill({ json: course });
    }
    const response = await route.fetch();
    const state = await response.json();
    if (state.user) {
      state.user.learnerType = 'independent';
      state.course = course;
      state.lessonAccess = Object.fromEntries(
        state.lessons.map((l: { id: string }) => [l.id, { state: 'locked' }]),
      );
    }
    await route.fulfill({ response, json: state });
  });
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.course-gate')).toBeVisible();
  await page.goto('/#courses', { waitUntil: 'domcontentloaded' });
  await page.locator('.course-card').first().click();
  const gate = page.locator('.course-gate');
  await expect(gate.getByRole('heading')).toHaveText('Kursga kirish uchun ruxsat kerak');
  await expect(page.locator('.course-learning-list')).toBeVisible();
  await gate.getByRole('button', { name: 'Ruxsat so‘rash' }).click();
  await gate.getByLabel(/Izoh/).fill('Kursni ko‘rib chiqmoqchiman');
  await gate.getByRole('button', { name: 'So‘rov yuborish' }).click();
  await expect(gate.getByRole('heading')).toHaveText('So‘rov yuborilgan');
  expect(asked).toEqual([{ op: 'request', note: 'Kursni ko‘rib chiqmoqchiman' }]);
  await gate.getByRole('button', { name: 'So‘rovni bekor qilish' }).click();
  await expect(gate.getByRole('button', { name: 'Ruxsat so‘rash' })).toBeVisible();
  await page.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.course-gate-page .course-gate')).toBeVisible();
  await expect(page.locator('.native-viewer')).toHaveCount(0);
  await gate.getByRole('button', { name: 'Ruxsat so‘rash' }).click();
  await gate.getByRole('button', { name: 'So‘rov yuborish' }).click();
  await expect(gate.getByRole('heading')).toHaveText('So‘rov yuborilgan');
  course = { ok: true, via: 'grant' };
  await gate.getByRole('button', { name: 'Holatni tekshirish' }).click();
  await expect(gate).toHaveCount(0);
  await expect(page.locator('.native-viewer')).toBeVisible();
  await page.setViewportSize({ width: 360, height: 760 });
  await noScroll(page);
});

test('the administrator can approve and revoke course access', async ({ page }) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Kursga ruxsat' }).click();
  const sec = page.locator('.bo-course-access');
  await expect(sec.locator('.bo-status .bo-pill')).toContainText('Kirish cheklangan');
  await expect(sec).toContainText('Yangi so‘rov yo‘q.');
  await expect(sec.getByLabel('Email')).toBeDisabled();

  // so'rovlar ro'yxati (talaba bo'lmagan foydalanuvchi so'ragan holat)
  const at = Date.now() - 3600000;
  const request = { uid: 'uidX', name: 'Dilnoza Karimova', email: 'dilnoza@example.com', at };
  const view = (grants: unknown[], requests: unknown[]) => ({
    grants,
    requests,
    email: false,
  });
  const sent: unknown[] = [];
  await page.route('**/api/platform?view=courseAccessAdmin', (route) =>
    route.fulfill({
      json: view([], [{ ...request, note: 'Iqtisodiyot, 2-kurs', group: 'AP-223' }]),
    }),
  );
  await page.route('**/api/platform', async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().method() !== 'POST' || body?.action !== 'courseAccessAdmin')
      return route.continue();
    sent.push(body.input);
    await route.fulfill({ json: view([{ ...request, at: Date.now(), by: 'demo-admin' }], []) });
  });
  await page.getByRole('button', { name: 'Sayt boshqaruvi', exact: true }).click();
  await page.locator('.bo-card-btn').filter({ hasText: 'Kursga ruxsat' }).click();
  const row = sec.locator('.bo-list li').filter({ hasText: 'Dilnoza Karimova' });
  await expect(row).toContainText('dilnoza@example.com');
  await expect(row).toContainText('💬 Iqtisodiyot, 2-kurs');
  await expect(row.locator('.bo-group')).toHaveText('🎓 AP-223');
  await row.getByRole('button', { name: 'Ruxsat berish: Dilnoza Karimova' }).click();
  await expect(sec).toContainText('Yangi so‘rov yo‘q.');
  await expect(sec.getByRole('button', { name: 'Ruxsatni olish: Dilnoza Karimova' })).toBeVisible();
  expect(sent).toEqual([{ op: 'approve', uid: 'uidX', paymentId: null }]);
});

test('course files require a signed lesson access cookie and are cleared at sign-out', async ({
  page,
}) => {
  const directLesson = '/legacy/mavzu-1.html';
  const pdf = '/legacy/fayllar/M1-mavzu.pdf';
  const quiz = '/api/site/quiz?t=m1';
  expect((await page.request.get(directLesson)).status()).toBe(403);
  expect((await page.request.get(pdf)).status()).toBe(403);
  expect((await page.request.get(quiz)).status()).toBe(403);
  // eski (nusxalangan) dars havolasi brauzerda ochilsa — fayl berilmaydi, saytdagi o'sha darsga o'tadi
  await page.goto(directLesson, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await expect.poll(() => new URL(page.url()).hash).toBe('#lesson/m1');
  expect((await page.request.get(pdf)).status()).toBe(403);
  await as(page, 'demo-student');
  expect((await page.request.get(directLesson)).status()).toBe(403);
  const entry = await page.request.get('/api/platform?view=legacyLesson&lesson=m1');
  expect(entry.status()).toBe(200);
  const opened = await page.request.get(directLesson);
  expect(opened.status()).toBe(200);
  expect(opened.headers()['cache-control']).toContain('no-store');
  expect((await page.request.get(pdf)).status()).toBe(200);
  expect((await page.request.get(quiz)).status()).toBe(200);
  expect((await page.request.get('/legacy/mavzu-2.html')).status()).toBe(403);
  await page.request.delete('/api/admin-access');
  expect((await page.request.get(directLesson)).status()).toBe(403);
});

test('the administrator publishes the main-course price and grouped students can still open lessons', async ({
  page,
  browser,
  baseURL,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Kursga ruxsat' }).click();
  const panel = page.locator('.bo-course-access');
  const price = '179 000 so‘m';
  const how = 'Click orqali to‘lang, chek raqamini so‘rovda yozing.';
  await panel.getByLabel(/Kurs narxi/).fill(price);
  await panel.getByLabel('Qanday to‘lanadi').fill(how);
  await panel.getByRole('button', { name: 'Saqlash', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Saqlandi');
  const visitor = await browser.newPage({ baseURL });
  try {
    await visitor.goto('/#course/tad-asoslari', { waitUntil: 'domcontentloaded' });
    await expect(visitor.locator('.course-gate .paid-gate-price')).toContainText(price);
    await expect(visitor.locator('.course-gate .paid-gate-price')).toContainText(how);
    await as(visitor, 'demo-student');
    await visitor.reload();
    await expect(visitor.locator('.course-gate')).toHaveCount(0);
    await visitor.goto('/#lesson/m1');
    await expect(visitor.locator('.native-viewer')).toBeVisible();
  } finally {
    await visitor.close();
    await page.request.post('/api/platform', {
      data: {
        action: 'courseAccessAdmin',
        input: { op: 'shop', course: 'tad-asoslari', price: '', how: '' },
      },
    });
  }
});
