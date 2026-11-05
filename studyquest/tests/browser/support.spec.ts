import { test, expect } from '@playwright/test';

test('a student writes to the administrator and sees the reply on the chat page', async ({
  browser,
}) => {
  const student = await (await browser.newContext()).newPage();
  await student.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await student.goto('/#chat/admin', { waitUntil: 'domcontentloaded' });
  await expect(student.getByRole('tab', { name: 'Guruh chati' })).toBeVisible();
  await student.locator('.support-cats label', { hasText: 'Hisob, parol, guruh' }).click();
  const text = 'Parolimni unutdim, yangisini o‘rnatib bera olasizmi? ' + Date.now();
  await student.locator('.support-form textarea').fill(text);
  await student.getByRole('button', { name: 'Yuborish' }).click();
  await expect(student.locator('.support-item').filter({ hasText: text })).toContainText(
    'Yuborildi',
  );

  const admin = await (await browser.newContext()).newPage();
  await admin.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  // Students cannot read the administrator inbox.
  expect((await student.request.get('/api/support?view=inbox')).status()).toBe(403);
  await admin.goto('/#chat/admin', { waitUntil: 'domcontentloaded' });
  const item = admin.locator('.support-item').filter({ hasText: text });
  await expect(item).toContainText('Madina');
  await item.locator('textarea').fill('Yangi parol: guruh sardoringizdan oling.');
  await item.getByRole('button', { name: 'Javob berish' }).click();
  await expect(admin.locator('.support-item').filter({ hasText: text })).toHaveCount(0);

  await student.reload({ waitUntil: 'domcontentloaded' });
  const mine = student.locator('.support-item').filter({ hasText: text });
  await expect(mine).toContainText('Javob berildi');
  await expect(mine.locator('.support-reply')).toContainText('guruh sardoringizdan');
});

test('the chat page explains itself instead of showing an empty grey block', async ({ page }) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#chat', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Talabalar chati');
  await expect(page.locator('.chat-rules')).toBeVisible();
  // The demo reader is not an approved group member, so the page says why the chat is closed.
  await expect(page.locator('.chat-stuck')).toContainText('Chat ochilmadi', { timeout: 20000 });
  await expect(page.locator('.chat-card .native-loading')).toBeHidden();
});
