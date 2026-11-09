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

test('a student gets a business and uploads a logo; the teacher sees it in the list and gives up to 25 points', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#topshiriq/m8', { waitUntil: 'domcontentloaded' });
  const brief = page.locator('.logo-brief');
  await expect(brief.locator('h2')).toContainText('«');
  const business = (await brief.locator('h2').textContent())!.replace(/[^«]*«|».*/g, '');
  await expect(brief).toContainText('Asosiy mijozlar');
  await expect(page.locator('.logo-result')).toContainText('Hali ish yuborilmagan');
  const send = page.getByRole('button', { name: 'O‘qituvchiga yuborish' });
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
  await expect(result.locator('.logo-sent-note')).toContainText('Ishingiz yuborildi');
  await expect(result.locator('.logo-sent img')).toBeVisible();
  // Baholanguncha yangi variant yuborish mumkin.
  await expect(page.locator('.logo-form h2')).toContainText('Yangi variant yuborish');

  // O'qituvchi: panel → «🎨 Logotiplar» → yuklaganlar ro'yxati → 21 ball.
  await as(page, 'demo-teacher');
  await page.goto('/#teacher', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '🎨 Logotiplar' }).click();
  await expect(page.getByRole('tab', { name: /Yuklaganlar/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const card = page.locator('.logo-admin-card').filter({ hasText: business });
  await expect(card.locator('.logo-admin-img img')).toBeVisible();
  await expect(card).toContainText('Ramz — biznesimiz');
  await expect(card.locator('.logo-admin-tag')).toContainText('baho kutmoqda');
  await card.getByLabel(/Baho \(0–25\)/).fill('26');
  await expect(card.getByRole('button', { name: 'Baholash' })).toBeDisabled();
  await card.getByLabel(/Baho \(0–25\)/).fill('21');
  await card.getByLabel(/Izoh/).fill('Zo‘r g‘oya');
  await card.getByRole('button', { name: 'Baholash' }).click();
  await expect(card.locator('.logo-score')).toContainText('21');
  await page.getByRole('tab', { name: /Baholanganlar/ }).click();
  await expect(page.locator('.logo-admin-card').filter({ hasText: business })).toBeVisible();

  // Talaba o'qituvchi bahosini ko'radi; endi qayta yubora olmaydi.
  await as(page, 'demo-student');
  await page.goto('/#topshiriq/m8', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.logo-final')).toContainText('O‘qituvchi bahosi: 21/25');
  await expect(page.locator('.logo-final')).toContainText('Zo‘r g‘oya');
  await expect(page.locator('.logo-form')).toHaveCount(0);
  await expect(page.locator('.logo-closed')).toContainText('Ishingiz baholandi');
});

test('the teacher downloads topic 8 as a PDF from the lesson toolbar; students do not see the button', async ({
  page,
}) => {
  await as(page, 'demo-teacher');
  await page.goto('/#lesson/m8');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  const pdf = page.locator('.reader-toolbar a', { hasText: 'PDF' });
  await expect(pdf).toHaveAttribute('href', '/legacy/fayllar/M8-mavzu.pdf');
  const [download] = await Promise.all([page.waitForEvent('download'), pdf.click()]);
  expect(download.suggestedFilename()).toBe('M8-mavzu.pdf');
  const res = await page.request.get('/legacy/fayllar/M8-mavzu.pdf');
  expect(res.status()).toBe(200);
  expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');

  await as(page, 'demo-student');
  await page.goto('/#lesson/m7');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  await expect(page.locator('.reader-toolbar a', { hasText: 'PDF' })).toHaveCount(0);
});

test('while reading, the lesson shows how many points the slide, the test and the logo give', async ({
  page,
}) => {
  await as(page, 'demo-teacher');
  await page.goto('/#lesson/m8');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  const strip = page.locator('.reader-points');
  await expect(strip).toContainText('Bu slayd: +1,25 ball');
  await expect(strip).toContainText('🎨 logotip 25');
  const select = page.locator('.reader-controls').getByRole('combobox');
  await select.selectOption('23');
  await expect(strip).toContainText('Test: 25 ball · har to‘g‘ri javob +1,25');
  await select.selectOption('21');
  await expect(strip).toContainText('Logotip topshirig‘i: 25 ball');
  await strip.getByRole('button', { name: 'Ochish →' }).click();
  await expect(page).toHaveURL(/#topshiriq\/m8$/);
  await expect(page.locator('.logo-points')).toContainText('25');

  // boshqa mavzu: test 50 ball
  await page.goto('/#lesson/m7');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  await page.locator('.reader-controls').getByRole('combobox').selectOption('23');
  await expect(page.locator('.reader-points')).toContainText(
    'Test: 50 ball · har to‘g‘ri javob +2,5',
  );

  // talaba: o'qish rejimidagi mavzuda ball berilmasligi aytiladi
  // (faqat # o'zgarsa ilova qayta yuklanmaydi — yangi foydalanuvchi ma'lumotlari uchun sahifa yangilanadi)
  await as(page, 'demo-student');
  await page.goto('/#lesson/m2');
  await page.reload();
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  await expect(page.locator('.reader-points')).toContainText('O‘qish rejimi');
});
