import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';

/* 📄 Ma'ruzalar: administrator mavzuga fayl yuklaydi (2,5 MB dan katta fayl bo'laklarga bo'linib boradi),
   talaba dars oynasidagi «Ma'ruza» tugmasidan aynan o'sha faylni yuklab oladi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}

test('the administrator uploads a lecture and a student downloads the same file from the lesson', async ({
  page,
}) => {
  page.on('dialog', (d) => void d.accept());
  const bytes = Buffer.alloc(3 * 1024 * 1024 + 123, 7);
  bytes.write('%PDF-1.7\n', 0, 'latin1');
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Ma’ruzalar' }).click();
  const admin = page.locator('.lecture-admin');
  await admin.getByRole('heading', { name: /M8/ }).waitFor();
  await page.getByRole('button', { name: /M7 · CRM nima\?/ }).click();
  await expect(admin.getByRole('heading', { name: /M7/ })).toBeVisible();
  // noto'g'ri tur
  await admin.getByLabel('Ma’ruza fayli').setInputFiles({
    name: 'virus.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('MZ'),
  });
  await expect(admin.locator('.bo-bad')).toContainText('Faqat PDF');
  await admin.getByLabel('Ma’ruza fayli').setInputFiles({
    name: '7-mavzu-maruza.pdf',
    mimeType: 'application/pdf',
    buffer: bytes,
  });
  await admin.getByLabel('Fayl nomi').fill('CRM — ma’ruza matni');
  await admin.getByRole('button', { name: 'Mavzuga yuklash' }).click();
  await expect(admin.locator('.lecture-list')).toContainText('CRM — ma’ruza matni');
  await expect(admin.locator('.lecture-list')).toContainText('PDF · 3 MB');

  // Talaba: 7-mavzu → «Ma'ruza» → yuklab olish
  await as(page, 'demo-student');
  await page.goto('/#lesson/m7');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  await page.getByRole('button', { name: 'Ma’ruza', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ma’ruza fayllari' });
  await expect(dialog).toContainText('CRM — ma’ruza matni');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: /Yuklab olish/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('7-mavzu-maruza.pdf');
  const saved = await fs.readFile((await download.path())!);
  expect(saved.equals(bytes)).toBe(true);
  await page.keyboard.press('Escape');

  // Tozalash (bo'lim eslab qolingan — to'g'ridan-to'g'ri ochiladi)
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /M7 · CRM nima\?/ }).click();
  await page
    .locator('.lecture-admin .lecture-list')
    .getByRole('button', { name: /O‘chirish/ })
    .click();
  await expect(page.locator('.lecture-admin .lecture-list')).toHaveCount(0);
});
