import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test('personal learning APIs require sign-in, reject forged owners and disallow cross-origin writes', async ({
  request,
}) => {
  expect((await request.get('/api/learning?lesson=m1')).status()).toBe(401);
  expect((await request.get('/api/push?view=preferences')).status()).toBe(401);
  await request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  const before = await (await request.get('/api/learning?lesson=m1')).json();
  const input = { lessonId: 'm1', text: 'Yozilmasin', bookmarks: [], version: before.version };
  expect(
    (
      await request.post('/api/learning', {
        headers: { Origin: 'https://unrelated.example' },
        data: input,
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post('/api/learning', { data: { ...input, userId: 'demo-admin' } })).status(),
  ).toBe(400);
  expect(await (await request.get('/api/learning?lesson=m1')).json()).toEqual(before);
});

test('private notes and bookmarks persist, offline drafts sync, and another account cannot read them', async ({
  page,
  context,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  const old = await (await page.request.get('/api/learning?lesson=m1')).json();
  await page.request.post('/api/learning', {
    data: { lessonId: 'm1', text: '', bookmarks: [], version: old.version },
  });
  await page.goto('/#lesson/m1');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  await page.getByRole('button', { name: /O‘qish va qaydlar/ }).click();
  const field = page.getByLabel('Shaxsiy qaydlar', { exact: true });
  await expect(field).toBeEnabled();
  const text = 'Shaxsiy qayd ' + Date.now();
  await field.fill(text);
  await page.getByRole('button', { name: 'Joriy slayd', exact: false }).click();
  await page.getByRole('button', { name: 'Hisobga saqlash', exact: true }).click();
  await expect(page.locator('.reading-preferences')).toContainText('Hisobingizga saqlandi.');
  await page.reload();
  await page.getByRole('button', { name: /O‘qish va qaydlar/ }).click();
  await expect(field).toHaveValue(text);
  await expect(page.locator('.reading-bookmarks')).toContainText('★ 1');
  await context.setOffline(true);
  await field.fill(text + ' internetsiz');
  await page.getByRole('button', { name: 'Hisobga saqlash', exact: true }).click();
  await expect(page.locator('.reading-preferences')).toContainText('Qoralama qurilmada saqlandi');
  await expect(page.locator('.connection-notice')).toContainText('Internet yo‘q');
  await context.setOffline(false);
  await expect(page.locator('.reading-preferences')).toContainText('Hisobingizga saqlandi.');
  expect((await (await page.request.get('/api/learning?lesson=m1')).json()).text).toBe(
    text + ' internetsiz',
  );
  await page.request.post('/api/auth/demo', { data: { id: 'demo-teacher' } });
  expect((await (await page.request.get('/api/learning?lesson=m1')).json()).text).not.toContain(
    text,
  );
});

test('continuous text is adjustable and offline downloads contain no runnable assessment or account data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  await page.goto('/#lesson/r5');
  await expect(page.locator('.native-document h1')).toHaveText(
    'MENYU VA ALLERGENLAR BILAN ISHLASH',
  );
  await page.getByRole('button', { name: 'Uzluksiz matn', exact: true }).click();
  const article = page.locator('.continuous-reading');
  await expect(article).toContainText('allergen');
  expect(await article.locator('script, iframe, video, input, form, button').count()).toBe(0);
  await page.getByRole('button', { name: /O‘qish va qaydlar/ }).click();
  await page.getByLabel('Matn o‘lchami', { exact: true }).fill('24');
  await page.getByLabel('Satr oralig‘i', { exact: true }).selectOption('2.2');
  await expect(article).toHaveCSS('font-size', '24px');
  await expect(page.locator('.reader-toolbar').getByRole('combobox')).toHaveCount(1);
  expect(
    await page.locator('.reader-toolbar').getByRole('combobox').locator('option').allTextContents(),
  ).toEqual(['UZ']);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Internetsiz o‘qish/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Unistay-r5.html');
  const html = await fs.readFile((await download.path())!, 'utf8');
  expect(html).toContain('MENYU VA ALLERGENLAR');
  expect(html).not.toMatch(/<script|<iframe|<form|sq-demo|Authorization|__FIREBASE/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const footer = (await page.locator('.reader-controls').boundingBox())!;
  expect(footer.y + footer.height).toBeLessThanOrEqual(845);
  await page.getByRole('button', { name: /O‘qish va qaydlar/ }).click();
  await page.getByRole('button', { name: 'Slaydlarga qaytish', exact: true }).click();
  await page.locator('.reader-controls').getByRole('combobox').selectOption('16');
  await expect(page.locator('.native-document')).toContainText('15 ta savol');
});

test('notification choices survive reload and remain scoped to an account', async ({ page }) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#profile');
  await page.locator('.notification-preferences summary').click();
  const topic = page.getByLabel('Mavzular ochilishi va muddatlar', { exact: true });
  await expect(topic).toBeVisible();
  await topic.uncheck();
  await page.getByRole('button', { name: 'Tanlovni saqlash', exact: true }).click();
  await expect(page.locator('.notification-preferences')).toContainText('Tanlov saqlandi.');
  await page.reload();
  await page.locator('.notification-preferences summary').click();
  await expect(topic).not.toBeChecked();
  const mine = await (await page.request.get('/api/push?view=preferences')).json();
  expect(mine.topics).toBe(false);
  await page.request.post('/api/push', {
    data: { op: 'preferences', preferences: { ...mine, topics: true } },
  });
});

test('guest can request sign-in help, staff can reply, and student cannot open the staff inbox', async ({
  page,
}) => {
  await page.route('**/api/platform', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch(),
      state = await response.json();
    state.mode = 'legacy';
    state.user = null;
    await route.fulfill({ response, json: state });
  });
  await page.goto('/#login');
  await page.locator('.account-help summary').click();
  const name = 'Yordam sinovi ' + Date.now();
  await page.getByLabel('Ism va familiya', { exact: true }).fill(name);
  await page.getByLabel('Email yoki telefon', { exact: true }).fill('sinov@example.uz');
  await page
    .getByLabel('Nima yordam kerak?', { exact: true })
    .fill('Hisobga kirishni tiklash kerak');
  await page.getByRole('button', { name: 'Yordam so‘rash', exact: true }).click();
  await expect(page.locator('.account-help')).toContainText('So‘rovingiz saqlangan.');
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  expect((await page.request.get('/api/account-help?view=inbox')).status()).toBe(403);
  expect((await page.request.get('/api/staff-summary')).status()).toBe(403);
  await page.request.post('/api/auth/demo', { data: { id: 'demo-teacher' } });
  const { rows } = await (await page.request.get('/api/account-help?view=inbox')).json();
  const row = rows.find((r: { name: string }) => r.name === name);
  expect(row).toBeTruthy();
  expect(
    (
      await page.request.patch('/api/account-help', {
        data: { id: row.id, status: 'resolved', reply: 'O‘qituvchingizga murojaat qiling.' },
      })
    ).ok(),
  ).toBe(true);
  await page.getByRole('button', { name: 'So‘rov holatini tekshirish', exact: true }).click();
  await expect(page.locator('.account-help')).toContainText('O‘qituvchingizga murojaat qiling.');
});

test('staff overview links to real tasks and administrator cards are grouped', async ({ page }) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  await page.goto('/#admin');
  await expect(page.locator('.staff-tasks')).toContainText('Bugungi ishlar');
  await expect(page.locator('.bo-category')).toHaveCount(3);
  await page
    .locator('.staff-tasks')
    .getByRole('button', { name: /Kirish bo‘yicha so‘rovlar/ })
    .click();
  await expect(page.locator('.account-help-inbox')).toBeVisible();
  await page
    .locator('.staff-tasks')
    .getByRole('button', { name: /Kursga kirish so‘rovlari/ })
    .click();
  await expect(page.locator('.bo-section')).toContainText('Kursga ruxsat');
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
