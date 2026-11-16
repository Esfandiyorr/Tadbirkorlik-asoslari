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
    const action = page.locator('.continue-hero .hero-button');
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
