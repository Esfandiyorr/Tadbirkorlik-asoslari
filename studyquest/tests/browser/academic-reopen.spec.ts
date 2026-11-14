import { test, expect } from '@playwright/test';

/* 🔁 Testga ikkinchi urinish — «Talabalar va baholar» bo'limida (eski «Kursni boshqarish» jadvalidan olib tashlangan).
   Demo muhit jonli talabalar bazasiga ulanmaydi, shuning uchun ro'yxat va saqlash javobi shu yerda beriladi. */
test('the teacher gives a second test attempt from “Talabalar va baholar”', async ({ page }) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  let reopened: Record<string, number> = {};
  const sent: unknown[] = [];
  await page.route('**/api/platform?view=roster', (route) =>
    route.fulfill({
      json: {
        users: [
          {
            id: 'legacy_ali',
            legacyId: 'ali',
            uid: 'legacy_ali',
            role: 'student',
            name: 'Ali Valiyev',
            classId: 'AP-223',
            learnerType: 'university',
            legacyStatus: 'ok',
            academicPoints: 42,
            academicTopics: { m3: { b: 3 } },
            manualMarks: {},
            reopened,
            readingHistory: {},
          },
        ],
      },
    }),
  );
  await page.route('**/api/platform', async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().method() !== 'POST' || body?.action !== 'legacyStudent')
      return route.continue();
    sent.push(body.input);
    reopened = { ...reopened, [body.input.reopen]: Date.now() };
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Talabalar va baholar', exact: true }).click();
  await expect(page.locator('.roster-reopen-hint')).toContainText('ikkinchi urinish');
  const btn = page.getByRole('button', { name: 'Ali Valiyev · 3-mavzu testiga ikkinchi urinish' });
  page.once('dialog', (d) => {
    expect(d.message()).toContain('3-mavzu testiga ikkinchi urinish berilsinmi');
    void d.accept();
  });
  await btn.click();
  await expect(btn).toHaveClass(/is-on/);
  expect(sent).toEqual([{ id: 'ali', reopen: 'm3' }]);
  // «Natijalar» oynasida ham: berilgan sana va tugma
  await page.getByRole('button', { name: 'Natijalar' }).click();
  const card = page.locator('.academic-topic-card').filter({ hasText: /^3\./ });
  await expect(card).toContainText('berilgan:');
  await expect(card.getByRole('button', { name: /Testga ikkinchi urinish/ })).toBeVisible();
});
