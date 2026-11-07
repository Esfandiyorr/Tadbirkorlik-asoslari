import { test, expect } from '@playwright/test';

test('a student and the administrator chat like in Telegram, with history and replies', async ({
  browser,
}) => {
  const ctx = () => browser.newContext({ baseURL: test.info().project.use.baseURL });
  const student = await (await ctx()).newPage();
  await student.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await student.goto('/#chat/admin', { waitUntil: 'domcontentloaded' });
  await expect(student.getByRole('tab', { name: 'Guruh chati' })).toBeVisible();
  const chat = student.locator('.tg-chat');
  await expect(chat).toContainText('Xabarlar 7 kundan keyin avtomatik o‘chadi');
  const box = student.getByLabel('Xabar', { exact: true });
  const tag = String(Date.now()).slice(-6);
  const q1 = 'Parolimni unutdim, yordam bera olasizmi? #' + tag;
  await box.fill(q1);
  await box.press('Enter');
  await expect(chat.locator('.tg-msg.mine').filter({ hasText: q1 })).toBeVisible();
  // Shift+Enter — yangi qator, Enter — yuborish
  await box.fill('Guruhim AP-223');
  await box.press('Shift+Enter');
  await box.pressSequentially('Rahmat!');
  await box.press('Enter');
  const q2 = chat.locator('.tg-msg.mine').filter({ hasText: 'Rahmat!' });
  await expect(q2.locator('.tg-text')).toHaveText('Guruhim AP-223\nRahmat!');
  await expect(q2.locator('.tg-ticks')).toHaveAttribute('aria-label', 'Yuborildi');

  // Talabalar administrator suhbatlarini o'qiy olmaydi.
  expect((await student.request.get('/api/support?view=inbox')).status()).toBe(403);

  // Administrator: chapda suhbatlar, o'qilmagan xabarlar soni; suhbat ochilsa — o'qildi.
  const admin = await (await ctx()).newPage();
  await admin.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  await admin.goto('/#chat/admin', { waitUntil: 'domcontentloaded' });
  const row = admin.locator('.tg-thread-btn').filter({ hasText: 'Madina' });
  await expect(row.locator('.tg-unread')).toHaveText(/\d+/);
  await row.click();
  const pane = admin.locator('.tg-chat');
  await expect(pane.locator('.tg-head')).toContainText('Madina Ergasheva');
  await expect(row.locator('.tg-unread')).toHaveCount(0);
  // Aynan birinchi xabarga javob (iqtibos bilan).
  const first = pane.locator('.tg-msg.theirs').filter({ hasText: q1 });
  await first.hover();
  await first.getByRole('button', { name: /^Javob berish/ }).click();
  await expect(pane.locator('.tg-replying')).toContainText('Parolimni unutdim');
  await pane.getByLabel('Xabar', { exact: true }).fill('Yangi parol: guruh sardoringizdan oling.');
  await pane.getByRole('button', { name: 'Yuborish' }).click();
  const answer = pane.locator('.tg-msg.mine').filter({ hasText: 'guruh sardoringizdan' });
  await expect(answer.locator('.tg-quote')).toContainText(q1);
  await expect(pane.locator('.tg-replying')).toHaveCount(0);

  // Talaba: butun yozishma tarixi joyida, xabarlari «o'qildi», javob iqtibos bilan; u ham javob qaytaradi.
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(chat.locator('.tg-msg.mine').filter({ hasText: q1 })).toBeVisible();
  await expect(q2.locator('.tg-ticks')).toHaveAttribute('aria-label', 'O‘qildi');
  const reply = chat.locator('.tg-msg.theirs').filter({ hasText: 'guruh sardoringizdan' });
  await expect(reply.locator('.tg-author')).toHaveText('Platforma administratori');
  await expect(reply.locator('.tg-quote')).toContainText(q1);
  // iqtibos bosilsa — asl xabarga o'tadi va u bir zum ajralib turadi
  await reply.locator('.tg-quote').click();
  await expect(chat.locator('.tg-msg.is-flash')).toContainText(q1);
  await reply.hover();
  await reply.getByRole('button', { name: /^Javob berish/ }).click();
  await box.fill('Oldim, katta rahmat!');
  await box.press('Enter');
  await expect(
    chat.locator('.tg-msg.mine').filter({ hasText: 'Oldim, katta rahmat!' }).locator('.tg-quote'),
  ).toContainText('guruh sardoringizdan');

  // Administrator oynasi o'zi yangilanadi (10 soniyada) — yangi xabar keladi.
  await expect(
    pane.locator('.tg-msg.theirs').filter({ hasText: 'Oldim, katta rahmat!' }),
  ).toBeVisible({ timeout: 20000 });
  await student.context().close();
  await admin.context().close();
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
