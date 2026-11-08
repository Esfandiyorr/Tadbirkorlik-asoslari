import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

/* 8-mavzu: 📺 administrator qo'ygan YouTube video taqdimot slaydida va dars oynasidagi «Video» tugmasida ochiladi;
   🎨 talabaga alohida biznes beriladi, u logotip yuklab ta'rif yozadi, sun'iy intellekt (demo — sinov baholovchisi)
   baholaydi, o'qituvchi esa yakuniy bahoni qo'yadi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}

test('the administrator adds a YouTube video and it plays inside topic 8 and from the Video button', async ({
  page,
}) => {
  page.on('dialog', (d) => void d.accept());
  // YouTube'ning o'zi sinovda kerak emas — pleyer manzili to'g'riligi tekshiriladi.
  await page.route(/youtube(-nocookie)?\.com|ytimg\.com/, (route) => route.fulfill({ body: '' }));
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Mavzu videolari' }).click();
  const admin = page.locator('.video-admin');
  await expect(admin.getByRole('heading', { name: /M8/ })).toBeVisible();
  await admin.getByLabel('YouTube havolasi').fill('https://vimeo.com/123');
  await expect(admin.locator('.bo-bad')).toBeVisible();
  await expect(admin.getByRole('button', { name: 'Mavzuga qo‘shish' })).toBeDisabled();
  await admin.getByLabel('YouTube havolasi').fill('https://youtu.be/dQw4w9WgXcQ?t=5');
  await admin.getByLabel('Video nomi').fill('Reklama psixologiyasi');
  await expect(admin.locator('.video-admin-preview iframe')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&start=5',
  );
  await admin.getByRole('button', { name: 'Mavzuga qo‘shish' }).click();
  await expect(admin.locator('.video-admin-list')).toContainText('Reklama psixologiyasi');

  // Taqdimot: 21-slayd «📺 Video dars» — pleyer sahifada (yashirin dvigatelda esa manbasiz).
  await page.goto('/#lesson/m8');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  await page.locator('.reader-controls').getByRole('combobox').selectOption('20');
  const slideFrame = page.locator('.native-document iframe');
  await expect(slideFrame).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&start=5',
  );
  await expect(page.locator('.native-document')).toContainText('Reklama psixologiyasi');
  const engineFrame = page.frameLocator('iframe.native-engine').locator('#sqVideo iframe');
  await expect(engineFrame).toHaveAttribute('data-yt', 'dQw4w9WgXcQ');
  expect(await engineFrame.getAttribute('src')).toBeNull();

  // Dars oynasi tepasidagi «Video» tugmasi.
  await page.getByRole('button', { name: 'Video', exact: true }).click();
  const modal = page.getByRole('dialog', { name: /Reklama psixologiyasi/ });
  await expect(modal.locator('iframe')).toHaveAttribute(
    'src',
    /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/,
  );
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  // 22-slayd: topshiriq tugmasi talabani topshiriq sahifasiga olib boradi.
  await page.locator('.reader-controls').getByRole('combobox').selectOption('21');
  await page
    .locator('.native-document')
    .getByRole('link', { name: /Topshiriqni ochish/ })
    .click();
  await expect(page).toHaveURL(/#topshiriq\/m8$/);
  await expect(page.locator('.logo-brief h2')).toBeVisible();

  // Tozalash
  // (Sayt boshqaruvi oxirgi ochilgan bo'limni eslab qoladi — «Mavzu videolari» to'g'ridan-to'g'ri ochiladi.)
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.video-admin')).toBeVisible();
  await page
    .locator('.video-admin-list')
    .getByRole('button', { name: /O‘chirish/ })
    .click();
  await expect(page.locator('.video-admin-list')).toHaveCount(0);
});

test('a student gets a business, uploads a logo, the AI grades it and the teacher confirms the mark', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#topshiriq/m8', { waitUntil: 'domcontentloaded' });
  const brief = page.locator('.logo-brief');
  await expect(brief.locator('h2')).toContainText('«');
  const business = (await brief.locator('h2').textContent())!.replace(/[^«]*«|».*/g, '');
  await expect(brief).toContainText('Asosiy mijozlar');
  await expect(page.locator('.logo-result')).toContainText('Hali ish yuborilmagan');
  const send = page.getByRole('button', { name: 'Yuborish va baholatish' });
  await expect(send).toBeDisabled();
  await page
    .locator('input[type=file]')
    .setInputFiles(path.join(__dirname, '../../public/terdu-logo.png'));
  await expect(page.locator('.logo-drop img')).toBeVisible();
  await page
    .getByLabel('Logotip ta’rifi')
    .fill(
      'Ramz — biznesimiz faoliyatini bildiradigan sodda belgi va nomning bosh harfi. Ranglar: to‘q ko‘k va to‘q sariq — ishonch va iliqlik. Shrift qalin, oq-qora rangda ham yaxshi o‘qiladi. Mijozlar uchun tushunarli va esda qoladi.',
    );
  await expect(send).toBeEnabled();
  await send.click();
  const result = page.locator('.logo-result');
  await expect(result.locator('.logo-ai-title')).toContainText('Sun’iy intellekt bahosi');
  await expect(result.locator('.logo-parts li')).toHaveCount(5);
  await expect(result.locator('.logo-sent img')).toBeVisible();
  await expect(result.locator('.logo-tries')).toContainText('1)');
  await expect(page.locator('.logo-form h2')).toContainText('2 ta urinish qoldi');

  // O'qituvchi: panel → «🎨 Logotiplar» → talabaning ishi → baho 9.
  await as(page, 'demo-teacher');
  await page.goto('/#teacher', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '🎨 Logotiplar' }).click();
  const row = page.locator('.logo-admin-list > li').filter({ hasText: business });
  await row.locator('.logo-admin-row').click();
  await expect(row.locator('.logo-admin-desc')).toContainText('Ramz — biznesimiz');
  await row.getByLabel(/O‘qituvchi bahosi/).fill('9');
  await row.getByLabel(/Izoh/).fill('Zo‘r g‘oya');
  await row.getByRole('button', { name: 'Bahoni tasdiqlash' }).click();
  await expect(row.locator('.logo-admin-state .logo-score')).toContainText('9');

  // Talaba o'qituvchi bahosini ko'radi.
  await as(page, 'demo-student');
  await page.goto('/#topshiriq/m8', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.logo-final')).toContainText('O‘qituvchi bahosi: 9/10');
  await expect(page.locator('.logo-final')).toContainText('Zo‘r g‘oya');
});
