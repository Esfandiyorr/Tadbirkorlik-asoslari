import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';

async function as(page: Page, id: string) {
  expect((await page.request.post('/api/auth/demo', { data: { id } })).ok()).toBe(true);
}

async function show(page: Page, shown: boolean) {
  const response = await page.request.post('/api/services', {
    data: { scope: 'admin', input: { op: 'show', shown } },
  });
  expect(response.ok()).toBe(true);
}

const PDF = Buffer.from('%PDF-1.4\n% Pullik xizmatlar sinovi\n%%EOF\n');

test('the user sends a request with files and receives the administrator’s reply in My orders', async ({
  page: admin,
  browser,
}) => {
  await as(admin, 'demo-admin');
  await show(admin, true);
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const student = await context.newPage();
    await as(student, 'demo-student');
    await student.setViewportSize({ width: 375, height: 812 });
    await student.goto('/#services', { waitUntil: 'domcontentloaded' });
    await expect(student.getByRole('heading', { name: 'Qanday ishlaydi?' })).toBeVisible();
    await expect(student.locator('.svc-card')).toHaveCount(13);
    await expect(student.locator('.svc-page')).not.toContainText(
      /ijrochi|kishi kutmoqda|ochiq vazifa/i,
    );
    expect(
      await student
        .locator('.svc-card')
        .first()
        .evaluate((card) => card.clientHeight),
    ).toBeLessThan(95);
    expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );

    await student.getByRole('button', { name: 'Taqdimot', exact: true }).click();
    const form = student.getByRole('dialog', { name: 'Taqdimot' });
    const submit = form.getByRole('button', { name: 'Buyurtmani yuborish' });
    await expect(submit).toBeDisabled();
    const orderText = 'Marketing bo‘yicha 12 ta slayd, 3 ta savol. Sinov ' + Date.now();
    await form.getByLabel('Nima kerak?').fill(orderText);
    await form.locator('input[type="file"]').setInputFiles({
      name: 'talablar.pdf',
      mimeType: 'application/pdf',
      buffer: PDF,
    });
    await expect(form.getByText('talablar.pdf')).toBeVisible();
    await submit.click();
    await expect(student.getByRole('heading', { name: 'Buyurtmalarim', level: 1 })).toBeVisible();
    await expect(student.getByText('Buyurtmangiz adminga yuborildi.')).toBeVisible();
    await expect(student.getByText(/AI javobini kuting/)).toBeVisible();
    await expect(student.getByText(orderText, { exact: true })).toBeVisible();

    await admin.goto('/#admin/services', { waitUntil: 'domcontentloaded' });
    await expect(admin.getByRole('heading', { name: 'Kelgan buyurtmalar' })).toBeVisible();
    const incoming = admin.locator('.svc-admin-order').filter({ hasText: orderText });
    await expect(incoming).toContainText('talablar.pdf');
    const [original] = await Promise.all([
      admin.waitForEvent('download'),
      incoming.getByRole('button', { name: 'Yuklab olish' }).click(),
    ]);
    expect(original.suggestedFilename()).toBe('talablar.pdf');
    expect(await readFile(await original.path())).toEqual(PDF);

    await incoming
      .getByLabel('Javob', { exact: true })
      .fill('Taqdimot tayyor, pastdagi faylni yuklab oling.');
    await incoming.getByLabel('Natija havolasi (ixtiyoriy)').fill('https://example.com/result');
    await incoming.locator('input[type="file"]').setInputFiles({
      name: 'taqdimot-natija.pdf',
      mimeType: 'application/pdf',
      buffer: PDF,
    });
    await incoming.getByRole('button', { name: 'Javob yuborish' }).click();
    await expect(incoming.locator('.svc-status')).toHaveText('Javob tayyor');

    await student.reload({ waitUntil: 'domcontentloaded' });
    const returned = student.locator('.svc-order').filter({ hasText: orderText });
    await expect(returned.getByText(/Taqdimot tayyor/)).toBeVisible();
    await expect(returned.getByText(/AI javobini kuting/)).toHaveCount(0);
    await expect(returned.getByRole('link', { name: 'Natijani ochish' })).toHaveAttribute(
      'href',
      'https://example.com/result',
    );
    const [download] = await Promise.all([
      student.waitForEvent('download'),
      returned.locator('.svc-result').getByRole('button', { name: 'Yuklab olish' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('taqdimot-natija.pdf');
    expect(await readFile(await download.path())).toEqual(PDF);

    student.once('dialog', (dialog) => void dialog.accept());
    await returned.getByRole('button', { name: 'Buyurtmani olib tashlash' }).click();
    await expect(returned).toHaveCount(0);
  } finally {
    await context.close();
    await show(admin, false);
  }
});

test('guests see the guide and catalog, and the Play Store app omits services', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await show(page, true);
  try {
    await page.context().clearCookies();
    await page.goto('/#services/work', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Qanday ishlaydi?' })).toBeVisible();
    await page.getByRole('button', { name: 'Taqdimot', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Buyurtma berish uchun kiring' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Taqdimot' })).toHaveCount(0);
    await page.goto('/#slides', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Pullik xizmatlar', level: 1 })).toBeVisible();

    await as(page, 'demo-student');
    await page.goto('/?src=play#home', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.quick-link.is-courses')).toBeVisible();
    await expect(page.locator('.quick-link.is-services')).toHaveCount(0);
    await expect(page.locator('.sidebar nav a[href="#services"]')).toHaveCount(0);
    await page.goto('/#services', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.svc-grid')).toHaveCount(0);
  } finally {
    await as(page, 'demo-admin');
    await show(page, false);
  }
});

test('administrators can reopen or close order intake', async ({ page: admin, browser }) => {
  await as(admin, 'demo-admin');
  await show(admin, false);
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const student = await context.newPage();
    await as(student, 'demo-student');
    await student.goto('/#services', { waitUntil: 'domcontentloaded' });
    await expect(
      student.getByRole('heading', { name: 'Pullik xizmatlar vaqtincha yopiq' }),
    ).toBeVisible();

    await admin.goto('/#admin/services', { waitUntil: 'domcontentloaded' });
    await admin.getByText('Katalog va sozlamalar', { exact: true }).click();
    await admin.getByRole('button', { name: 'Bo‘limni ochish' }).click();
    await expect(admin.getByText('Buyurtmalar qabul qilinmoqda')).toBeVisible();
    await student.reload({ waitUntil: 'domcontentloaded' });
    await expect(student.getByRole('heading', { name: 'Xizmatlar katalogi' })).toBeVisible();

    await admin.getByRole('button', { name: 'Vaqtincha yopish' }).click();
    await expect(admin.getByText('Bo‘lim vaqtincha yopiq')).toBeVisible();
    await student.goto('/#services/mine', { waitUntil: 'domcontentloaded' });
    await expect(student.getByRole('heading', { name: 'Buyurtmalarim' })).toBeVisible();
  } finally {
    await context.close();
    await show(admin, false);
  }
});
