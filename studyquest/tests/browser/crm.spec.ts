import { test, expect } from '@playwright/test';
test('CRM has 22 readable slides, original PDF artwork and independent reading persistence', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#course/tad-asoslari');
  await expect(page.locator('.lesson-card').filter({ hasText: 'CRM' })).toHaveCount(1);
  await page.goto('/#lesson/m7');
  await expect(page.locator('.reader-navigation')).toContainText('1 / 22');
  await expect(page.locator('.native-document h2')).toHaveText('CRM nima?');
  await expect(page.locator('.native-reading-note')).toContainText('0 / 22');
  await expect(page.locator('.crm-cover .crm-terdu-logo')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.crm-terdu-logo').evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(512);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'tests/artifacts/crm-terdu-cover-desktop.png', fullPage: true });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
  await page.screenshot({ path: 'tests/artifacts/crm-terdu-cover-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.locator('iframe[data-native-engine]').count()).toBe(0);
  await expect(page.locator('.native-reading-note')).toContainText('1 / 22', { timeout: 10000 });
  for (let slide = 2; slide <= 22; slide++) {
    await page.getByRole('button', { name: 'Next slide', exact: true }).click();
    await expect(page.locator('.reader-navigation')).toContainText(slide + ' / 22');
    await expect(page.locator('.native-document h2')).not.toHaveText('');
    await expect(page.locator('.crm-terdu-logo')).toBeVisible();
  }
  await page.screenshot({ path: 'tests/artifacts/crm-terdu-content-desktop.png', fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({ path: 'tests/artifacts/crm-terdu-content-dark.png', fullPage: true });
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.getByRole('button', { name: 'Asl slayd', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('.native-document img').evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(1000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'O‘qish ko‘rinishi', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  const pdf = await page.request.get('/crm/CRM-taqdimot.pdf');
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
  await page.screenshot({ path: 'tests/artifacts/crm-mobile.png', fullPage: true });
  await page.request.delete('/api/auth/demo');
  expect((await page.request.get('/api/crm-progress')).status()).toBe(401);
});
