import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { course, modules, lessons, settings, badges, demoUsers } from '../../lib/seed';
function ownerCookie() {
  const payload = Buffer.from(
    JSON.stringify({ uid: 'test-owner', exp: Date.now() + 900000 }),
  ).toString('base64url');
  return (
    payload + '.' + createHmac('sha256', 'isolated-browser-test-key').update(payload).digest('hex')
  );
}
test('guests see only maintenance and cannot access lessons, students, files or writes', async ({
  page,
  request,
}) => {
  await page.goto('/#admin');
  await expect(page.getByText('Platforma vaqtincha yopiq', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Google orqali administrator kirishi' }),
  ).toBeVisible();
  expect(await page.locator('iframe, .sidebar, input[type=password]').count()).toBe(0);
  for (const path of [
    '/legacy/mavzu-1.html',
    '/legacy/arena.html',
    '/legacy/fayllar/M1-mavzu.pdf',
    '/api/platform?view=roster',
    '/api/platform?view=leaderboard',
  ])
    expect((await request.get(path)).status()).toBe(403);
  expect(
    (
      await request.post('/api/platform', {
        data: {
          action: 'legacyResetPassword',
          input: { id: 'alice', password: 'test-fixture-only' },
        },
      })
    ).status(),
  ).toBe(403);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: 'tests/artifacts/maintenance-mobile.png', fullPage: true });
});
test('a signed owner session can load original material; forged cookie cannot', async ({
  context,
  request,
}) => {
  await context.addCookies([
    { name: 'tad-owner-access', value: ownerCookie(), url: 'http://127.0.0.1:3202' },
  ]);
  const response = await context.request.get('/legacy/mavzu-1.html');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('TADBIRKORLIK');
  await context.addCookies([
    { name: 'tad-owner-access', value: 'forged', url: 'http://127.0.0.1:3202' },
  ]);
  expect((await context.request.get('/legacy/mavzu-1.html')).status()).toBe(403);
});
test('administrator finds original students, views fifteen histories and resets a selected password in the native panel', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'tad-owner-access', value: ownerCookie(), url: 'http://127.0.0.1:3202' },
  ]);
  const student = {
    ...demoUsers[0],
    id: 'legacy_alice',
    legacyId: 'alice',
    name: 'Ali Valiyev',
    classId: 'AP-223',
    legacyStatus: 'ok',
    academicPoints: 375.5,
    email: 'alice@example.test',
    readingHistory: Object.fromEntries(
      lessons.map((l) => [
        l.id,
        {
          seenSlides: 12,
          totalSlides: l.slideCount,
          seconds: 3000,
          correctAnswers: 8,
          score: 75,
          grade: 4,
          lastSlide: 5,
          status: 'started',
        },
      ]),
    ),
  };
  let reset: unknown;
  let deleted = false;
  await page.route('**/api/platform*', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      if (body.action === 'initializeStudentPasswords')
        return route.fulfill({ json: { completed: true, students: 1 } });
      reset = body;
      if (body.action === 'legacyDeleteStudent') deleted = true;
      return route.fulfill({ json: { ok: true } });
    }
    if (new URL(route.request().url()).searchParams.get('view') === 'siteSettings')
      return route.fulfill({
        json: { maintenance: false, publicLeaderboard: true, allowInitialCode: true },
      });
    if (new URL(route.request().url()).searchParams.get('view') === 'roster')
      return route.fulfill({ json: { users: deleted ? [] : [student] } });
    return route.fulfill({
      json: {
        courses: [course],
        modules,
        lessons,
        quizzes: [],
        settings,
        badges,
        mode: 'firebase',
        user: { ...demoUsers[2], uid: 'test-owner' },
        users: [],
        progress: [],
        attempts: [],
        transactions: [],
        earned: [],
        activity: [],
        notifications: [],
      },
    });
  });
  await page.goto('/#admin');
  await expect(page.getByRole('heading', { name: 'Talabalar va akademik baholar' })).toBeVisible();
  const row = page.locator('.academic-table tbody tr').first();
  await expect(row).toContainText('Ali Valiyev');
  await expect(row).toContainText('375.5');
  await page.getByRole('textbox', { name: 'Talabani qidirish' }).fill('Ali');
  await row.getByRole('button', { name: 'Natijalar', exact: true }).click();
  const details = page.getByRole('dialog', { name: 'Talaba natijalari', exact: true });
  await expect(details.locator('.academic-topic-card')).toHaveCount(15);
  await expect(details).toContainText('alice@example.test');
  await details.getByRole('button', { name: 'Yopish' }).click();
  await row.getByRole('button', { name: 'Parolni tiklash', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Talaba parolini tiklash', exact: true });
  await expect(form.getByLabel('Yangi parol', { exact: true })).toHaveValue('1111');
  await form.getByLabel('Yangi parol', { exact: true }).fill('NewPassword-123');
  await form.getByRole('button', { name: 'Yangi parolni saqlash', exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(reset).toEqual({
    action: 'legacyResetPassword',
    input: { id: 'alice', password: 'NewPassword-123' },
  });
  await expect(row).toContainText('375.5');
  await expect(page.locator('.credential-setup')).toContainText('Avvalgi shaxsiy kodlar saqlanadi');
  await page.screenshot({ path: 'tests/artifacts/admin-student-roster.png', fullPage: true });
  await row.getByRole('button', { name: 'Talabani o‘chirish', exact: true }).click();
  const removal = page.getByRole('dialog', { name: 'Talabani o‘chirish', exact: true });
  await removal.getByLabel('Tasdiqlash uchun ism-familiya', { exact: true }).fill('Ali');
  await expect(
    removal.getByRole('button', { name: 'Hisobni o‘chirish', exact: true }),
  ).toBeDisabled();
  await removal.getByLabel('Tasdiqlash uchun ism-familiya', { exact: true }).fill('Ali Valiyev');
  await removal.getByRole('button', { name: 'Hisobni o‘chirish', exact: true }).click();
  await expect(removal).toHaveCount(0);
  await expect(page.locator('.academic-table tbody tr')).toHaveCount(0);
  expect(reset).toEqual({
    action: 'legacyDeleteStudent',
    input: { id: 'alice', confirmation: 'Ali Valiyev' },
  });
  await page.getByRole('button', { name: 'Platforma', exact: true }).click();
  const publish = page.getByLabel('Umumiy akademik reytingni hammaga ko‘rsatish', { exact: true });
  await expect(publish).toBeChecked();
  await publish.uncheck();
  await page.getByRole('button', { name: 'Sozlamalarni saqlash', exact: true }).click();
  await expect
    .poll(() => reset)
    .toEqual({
      action: 'siteSettings',
      input: { maintenance: false, publicLeaderboard: false, allowInitialCode: true },
    });
});
