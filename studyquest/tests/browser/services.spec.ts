import { test, expect, type Page } from '@playwright/test';

/* 💼 Pullik xizmatlar: ishga tushguncha talaba «🚀 Tez orada» oynasida taklif yuboradi («Adminga xabar»ga tushadi);
   ishga tushgach talaba buyurtma beradi → jamoa narx aytadi → talaba «To'lov qildim» → jamoa to'lovni tasdiqlab
   tayyor ishni yuklaydi → talaba yuklab oladi va tuzatish so'raydi. Play Market ilovasida bo'lim yo'q. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
const svc = (page: Page, scope: 'me' | 'admin', input: unknown) =>
  page.request.post('/api/services', { data: { scope, input } });
/** Demo xotirasidagi hamma buyurtmalarni o'chirish (oldingi yugurishdan qolganlari ham). */
async function clearOrders(page: Page) {
  const board = await (await page.request.get('/api/services?admin=1')).json();
  for (const o of board.orders as { uk: string; id: string }[])
    await svc(page, 'admin', { op: 'remove', uk: o.uk, id: o.id });
}
const PDF = Buffer.from('%PDF-1.4\n% Pullik xizmatlar sinovi\n%%EOF\n');

test('a student orders, the team quotes and delivers, the student pays and downloads', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await clearOrders(page);
  expect((await svc(page, 'admin', { op: 'launch', open: true })).ok()).toBe(true);
  expect(
    (await svc(page, 'admin', { op: 'info', how: 'Click orqali 8600 … kartaga o‘tkazing' })).ok(),
  ).toBe(true);
  expect(
    (
      await svc(page, 'admin', {
        op: 'catalog',
        kind: 'taqdimot',
        price: '50 000 so‘mdan',
        days: '2–3 kun',
        off: false,
      })
    ).ok(),
  ).toBe(true);

  // talaba: yo'riqnoma, katalog va buyurtma shakli
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  await student.locator('.sidebar nav a[href="#services"]').click();
  await expect(student.getByRole('heading', { name: /Pullik xizmatlar/ })).toBeVisible();
  await expect(student.locator('.svc-steps li')).toHaveCount(4);
  await expect(student.locator('.svc-how .svc-honest')).toContainText('ishni o‘zingiz yozasiz');
  const cards = student.locator('.svc-card');
  await expect(cards.filter({ hasText: 'Kurs ishi' })).toContainText('Yordam');
  const slides = cards.filter({ has: student.getByText('Taqdimot', { exact: true }) });
  await expect(slides).toContainText('50 000 so‘mdan');
  await expect(slides).toContainText('2–3 kun');
  await slides.click();
  const form = student.getByRole('dialog', { name: /Taqdimot/ });
  await form.getByLabel('Mavzu yoki ish nomi').fill('Kichik biznesda marketing');
  await form.getByLabel(/Nima kerak/).fill('12 slayd, o‘zbek tilida, oxirida 3 ta savol bo‘lsin');
  await form.getByLabel('Qachongacha kerak?').fill('2030-12-01');
  await form.getByLabel(/Telefon yoki Telegram/).fill('@ali_test');
  await form
    .locator('input[type="file"]')
    .setInputFiles({ name: 'talablar.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(form).toContainText('talablar.pdf');
  await form.getByRole('button', { name: 'Buyurtma berish' }).click();
  await expect(student.getByText(/Buyurtma qabul qilindi/)).toBeVisible();
  const order = student.locator('.svc-order').filter({ hasText: 'Kichik biznesda marketing' });
  await expect(order.locator('.svc-status')).toHaveText(/Ko‘rib chiqilmoqda/);
  await expect(order.locator('.svc-details summary').first()).toContainText('📎 1');

  // jamoa: narx va muddat
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const card = page.locator('.svc-aorder').filter({ hasText: 'Kichik biznesda marketing' });
  await card.locator('.svc-aorder-head').click();
  await expect(card).toContainText('@ali_test');
  await expect(card).toContainText('talablar.pdf');
  await card.getByLabel('Narx', { exact: true }).fill('60 000 so‘m');
  await card.getByLabel('Tayyor bo‘lish muddati').fill('2 kun');
  await card.getByLabel(/Izoh/).fill('Dizayn ko‘k rangda bo‘ladi');
  await card.getByRole('button', { name: 'Narxni yuborish' }).click();
  await expect(card.locator('.svc-status')).toHaveText(/To‘lov kutilmoqda/);

  // talaba: to'lov
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(order.locator('.svc-status')).toHaveText(/To‘lov kutilmoqda/);
  await expect(order).toContainText('60 000 so‘m');
  await expect(order.locator('.svc-pay')).toContainText('Click orqali');
  await order.getByLabel(/Chek raqami/).fill('chek 777');
  await order.getByRole('button', { name: /To‘lov qildim/ }).click();
  await expect(order.locator('.svc-status')).toHaveText(/To‘lov tekshirilmoqda/);

  // jamoa: to'lovni tasdiqlash, natijani yuklash va topshirish
  await page.reload({ waitUntil: 'domcontentloaded' });
  await card.locator('.svc-aorder-head').click();
  await expect(card).toContainText('chek 777');
  await card.getByRole('button', { name: /To‘lovni tasdiqlash/ }).click();
  await expect(card.locator('.svc-status')).toHaveText(/Tayyorlanmoqda/);
  await card
    .locator('.svc-deliver input[type="file"]')
    .setInputFiles({ name: 'natija.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(card.locator('.svc-deliver .svc-files')).toContainText('natija.pdf');
  await card.getByRole('button', { name: /Tayyor — talabaga yuborish/ }).click();
  await expect(page.getByText('Talabaga yuborildi.')).toBeVisible();
  // tayyor buyurtma «Ochiq» ro'yxatidan «Tayyor»ga o'tadi
  await page
    .locator('.svc-admin-tools')
    .getByRole('button', { name: /^Tayyor/ })
    .click();
  await expect(card.locator('.svc-status')).toHaveText(/Tayyor/);

  // talaba: yuklab olish va tuzatish so'rash
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(order.locator('.svc-status')).toHaveText(/Tayyor/);
  const download = student.waitForEvent('download');
  await order
    .locator('.svc-result')
    .getByRole('button', { name: /Yuklab olish/ })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('natija.pdf');
  await order.getByRole('button', { name: /Tuzatish kerakmi/ }).click();
  await order.getByLabel('Nimani tuzatish kerak?').fill('3-slayddagi raqamni yangilang');
  await order.getByRole('button', { name: /Tuzatish so‘rash/ }).click();
  await expect(order.locator('.svc-status')).toHaveText(/Tayyorlanmoqda/);
  await expect(order.locator('.svc-msgs')).toContainText('Dizayn ko‘k rangda bo‘ladi');
  await expect(order.locator('.svc-msgs')).toContainText('3-slayddagi raqamni yangilang');

  // telefon kengligida ham sig'adi
  await student.setViewportSize({ width: 380, height: 760 });
  expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    381,
  );
  await student.context().close();

  // tozalash
  await clearOrders(page);
  await svc(page, 'admin', { op: 'info', how: '' });
  await svc(page, 'admin', { op: 'launch', open: false });
  await svc(page, 'admin', { op: 'catalog', kind: 'taqdimot', price: '', days: '', off: false });
});

test('guests see the guide and catalog; the Play Market app has no paid services', async ({
  page,
}) => {
  await page.context().clearCookies();
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  // bo'lim hali ishga tushmagan: mehmonga ham «tez orada» oynasi, taklif uchun — kirish
  const soon = page.getByRole('dialog', { name: /tez orada ishga tushadi/ });
  await expect(soon).toBeVisible();
  await expect(soon.getByRole('button', { name: 'Kirib taklif yuborish' })).toBeVisible();
  await soon.getByRole('button', { name: 'Keyinroq' }).click();
  await expect(page.locator('.svc-steps li')).toHaveCount(4);
  await expect(page.locator('.svc-card').first()).toContainText('Tez orada');
  // eski AI taqdimot havolasi ham shu bo'limga olib keladi
  await as(page, 'demo-student');
  await page.goto('/#slides', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Pullik xizmatlar/, level: 1 })).toBeVisible();
  // Play Market ilovasi saytni /?src=play bilan ochadi — menyu ham, bosh sahifadagi havola ham, bo'lim ham yo'q
  await page.goto('/?src=play#home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.quick-link.is-courses')).toBeVisible();
  await expect(page.locator('.quick-link.is-services')).toHaveCount(0);
  await expect(page.locator('.sidebar nav a[href="#services"]')).toHaveCount(0);
  await expect(page.locator('.bottom-nav a[href="#services"]')).toHaveCount(0);
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svc-grid')).toHaveCount(0);
});

test('before the launch a student sees «Launching soon» and sends a suggestion to the administrator', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await svc(page, 'admin', { op: 'launch', open: false });
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  await student.goto('/#services', { waitUntil: 'domcontentloaded' });
  // kirganda oyna o'zi chiqadi
  const soon = student.getByRole('dialog', { name: /tez orada ishga tushadi/ });
  await expect(soon).toBeVisible();
  const send = soon.getByRole('button', { name: 'Taklif yuborish' });
  await expect(send).toBeDisabled();
  await soon.getByRole('button', { name: /Taqdimot/ }).click();
  await soon.getByRole('button', { name: /Sayt yaratish/ }).click();
  await expect(soon.getByRole('button', { name: /Taqdimot/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await soon.getByLabel('Taklifingiz yoki istagingiz').fill('Diplom himoyasi uchun taqdimot kerak');
  await send.click();
  await expect(student.getByText(/Taklifingiz administratorga yuborildi/)).toBeVisible();
  await expect(soon).toHaveCount(0);
  await expect(student.locator('.svc-soon')).toContainText('yetib bordi');
  // kartada — nechta odam shu xizmatni kutayotgani
  await expect(
    student.locator('.svc-card').filter({ has: student.getByText('Taqdimot', { exact: true }) }),
  ).toContainText(/\d+ kishi kutmoqda/);
  await expect(student.locator('.svc-hero-stats')).toContainText('kishi kutmoqda');
  // taklif «Adminga xabar»ga 💡 bilan tushdi
  const mine = await (await student.request.get('/api/support')).json();
  const idea = (mine.messages as { text: string; cat: string }[]).at(-1)!;
  expect(idea.cat).toBe('idea');
  expect(idea.text).toContain('💡 PULLIK XIZMATLAR — TAKLIF');
  expect(idea.text).toContain('Kerakli xizmatlar: Taqdimot, Sayt yaratish');
  expect(idea.text).toContain('Diplom himoyasi uchun taqdimot kerak');
  const inbox = await (await page.request.get('/api/support?view=inbox')).json();
  expect(JSON.stringify(inbox)).toContain('PULLIK XIZMATLAR');
  // buyurtma hali qabul qilinmaydi
  const refused = await svc(student, 'me', {
    op: 'order',
    kind: 'taqdimot',
    title: 'Sinov',
    text: 'Sinov buyurtmasining matni',
  });
  expect(refused.status()).toBe(409);
  // qayta kirganda oyna o'zi chiqmaydi (taklif yuborilgan), lekin tugma bilan ochiladi
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.svc-soon')).toBeVisible();
  await expect(soon).toHaveCount(0);
  // katalog kartasi ham shu oynani ochadi — yo'nalish oldindan belgilangan
  await student
    .locator('.svc-card')
    .filter({ has: student.getByText('Dizayn', { exact: true }) })
    .click();
  await expect(soon.getByRole('button', { name: /Dizayn/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await soon.getByRole('button', { name: 'Keyinroq' }).click();

  // administrator ishga tushiradi — talaba buyurtma bera oladi
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svc-soon.is-admin')).toContainText('hali ishga tushmagan');
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: /Ishga tushirish/ }).click();
  await expect(page.locator('.svc-launch')).toContainText('Ishlayapti');
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.svc-soon')).toHaveCount(0);
  await expect(student.locator('.svc-card').first()).toContainText('Buyurtma berish');
  await student.context().close();
  // asl holiga qaytarish
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: /Tez orada.*qaytarish/ }).click();
  await expect(page.locator('.svc-launch')).toContainText('Tez orada');
});
