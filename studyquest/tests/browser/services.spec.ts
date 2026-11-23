import { test, expect, type Page } from '@playwright/test';

/* 💼 Pullik xizmatlar: ishga tushguncha foydalanuvchi «🚀 Tez orada» oynasida taklif yuboradi («Adminga xabar»ga
   tushadi); ishga tushgach buyurtma beradi → buyurtmasida «🤖 Sun'iy intellekt yordamida tayyorlanmoqda», buyurtma esa
   administratorga yozishma bo'lib keladi (Sayt boshqaruvi → Pullik xizmatlar → 💬 Buyurtmalar) → administrator savol
   beradi, to'lovni tasdiqlaydi, natijani yuklab «📤 Mijozga yuborish»ni bosadi → buyurtmachi yuklab oladi, tuzatish
   so'raydi yoki qabul qilib baho qo'yadi. Ijrochi talabalar bo'limi yo'q. Play Market ilovasida bo'lim yo'q.
   Administrator bo'limni vaqtincha yopishi mumkin (sozlama yo'q bo'lsa — yopiq). */
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
/** Bo'limni ochish/yopish (administrator sessiyasi kerak). */
const show = (page: Page, shown: boolean) => svc(page, 'admin', { op: 'show', shown });
const PDF = Buffer.from('%PDF-1.4\n% Pullik xizmatlar sinovi\n%%EOF\n');

test('an order shows «prepared with AI», reaches the administrator as a chat and gets the result back', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  await as(page, 'demo-admin');
  await clearOrders(page);
  for (const input of [
    { op: 'show', shown: true },
    { op: 'launch', open: true },
    { op: 'info', how: 'Click orqali 8600 … kartaga o‘tkazing' },
    { op: 'catalog', kind: 'taqdimot', price: '50 000 so‘mdan', days: '2–3 kun', off: false },
  ])
    expect((await svc(page, 'admin', input)).ok()).toBe(true);

  // buyurtmachi: katalogdan xizmatni tanlab buyurtma beradi
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  await student.locator('.sidebar nav a[href="#services"]').click();
  await expect(student.getByRole('heading', { name: /Pullik xizmatlar/, level: 1 })).toBeVisible();
  await expect(student.locator('.svc-hero')).toContainText('SUN’IY INTELLEKT YORDAMIDA');
  // ijrochi talabalar bo'limi yo'q: faqat «Buyurtma berish» va «Buyurtmalarim»
  await expect(student.locator('.mk-tabs a')).toHaveText([/Buyurtma berish/, /Buyurtmalarim/]);
  await expect(student.getByText(/Ishlab topish|ijrochi/i)).toHaveCount(0);
  await expect(student.locator('.svc-steps li')).toHaveCount(5);
  await expect(student.locator('.svc-how .svc-honest')).toContainText(
    'faqat administrator ko‘radi',
  );
  const cards = student.locator('.svc-card');
  await expect(cards.filter({ hasText: 'Kurs ishi' })).toContainText('Yordam');
  const slides = cards.filter({ has: student.getByText('Taqdimot', { exact: true }) });
  await expect(slides).toContainText('50 000 so‘mdan');
  await slides.click();
  const form = student.getByRole('dialog', { name: /Taqdimot/ });
  await form.getByLabel('Mavzu yoki ish nomi').fill('Kichik biznesda marketing');
  await form.getByLabel(/Nima kerak/).fill('12 slayd, o‘zbek tilida, oxirida 3 ta savol bo‘lsin');
  await expect(form).toContainText('Odatdagi narx: 50 000 so‘mdan');
  const post = form.getByRole('button', { name: /Buyurtma berish/ });
  await expect(post).toBeDisabled();
  await form.getByLabel(/Qancha to‘lay olasiz/).fill('120000');
  await expect(form.getByLabel(/Qancha to‘lay olasiz/)).toHaveValue('120 000');
  await form.getByLabel('Qachongacha kerak?').fill('2030-12-01');
  await form.getByLabel(/Telefon yoki Telegram/).fill('@ali_test');
  await form
    .locator('input[type="file"]')
    .setInputFiles({ name: 'talablar.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(form).toContainText('talablar.pdf');
  await post.click();
  await expect(student.getByText(/Buyurtma qabul qilindi/)).toBeVisible();
  await expect.poll(() => new URL(student.url()).hash).toBe('#services/mine');
  const order = student.locator('.svc-order').filter({ hasText: 'Kichik biznesda marketing' });
  await expect(order.locator('.svc-status')).toHaveText(
    /Sun’iy intellekt yordamida tayyorlanmoqda/,
  );
  await expect(order.locator('.svc-ai')).toContainText('Sun’iy intellekt yordamida tayyorlanmoqda');
  await expect(order).toContainText('120 000 so‘m');
  // to'lov ishni to'xtatmaydi
  await expect(order.locator('.svc-pay')).toContainText('Click orqali');
  await order.getByLabel(/Chek raqami/).fill('chek 777');
  await order.getByRole('button', { name: /To‘lov qildim/ }).click();
  await expect(order.locator('.svc-pay')).toContainText('To‘lov tekshirilmoqda');
  await expect(order.locator('.svc-ai')).toBeVisible();

  // administrator: buyurtma yozishma bo'lib kelgan — qaysi xizmat, nima yozilgan, fayl, aloqa, to'lov
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const thread = page.locator('.svc-thread').filter({ hasText: 'Kichik biznesda marketing' });
  await expect(thread).toHaveClass(/is-unread/);
  await expect(thread).toContainText('Taqdimot');
  await expect(thread.locator('.svc-thread-flags')).toContainText('💳');
  await thread.click();
  const chat = page.locator('.svc-chat');
  const lead = chat.locator('.svc-msgs li.is-lead');
  await expect(lead).toContainText('🎞 Taqdimot · Kichik biznesda marketing');
  await expect(lead).toContainText('12 slayd, o‘zbek tilida');
  await expect(lead).toContainText('talablar.pdf');
  await expect(chat.locator('.svc-chat-head')).toContainText('@ali_test');
  await expect(chat.locator('.svc-pay')).toContainText('chek 777');
  await chat.getByLabel('Xabar').fill('Qaysi rangda bo‘lsin?');
  await chat.getByRole('button', { name: 'Yuborish', exact: true }).click();
  await expect(chat.locator('.svc-msgs')).toContainText('Qaysi rangda bo‘lsin?');
  await chat.getByRole('button', { name: /To‘lovni tasdiqlash/ }).click();
  await expect(chat.locator('.svc-pay')).toContainText('To‘lov tasdiqlangan');
  const send = chat.getByRole('button', { name: /Mijozga yuborish/ });
  await expect(send).toBeDisabled();
  await chat
    .locator('.svc-deliver input[type="file"]')
    .setInputFiles({ name: 'natija.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(chat.locator('.svc-deliver .svc-files')).toContainText('natija.pdf');
  await send.click();
  await expect(chat.locator('.svc-status')).toHaveText(/Tayyor — tekshiring/);

  // buyurtmachi: savolni va natijani ko'radi, yuklab oladi, tuzatish so'raydi
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(order.locator('.svc-status')).toHaveText(/Tayyor — tekshiring/);
  await expect(order.locator('.svc-ai')).toHaveCount(0);
  await expect(order.locator('.svc-pay')).toContainText('To‘lov tasdiqlangan');
  await expect(order.locator('.svc-msgs')).toContainText('Qaysi rangda bo‘lsin?');
  const download = student.waitForEvent('download');
  await order
    .locator('.svc-result')
    .getByRole('button', { name: /Yuklab olish/ })
    .click();
  expect((await download).suggestedFilename()).toBe('natija.pdf');
  await order.getByRole('button', { name: /Tuzatish kerak/ }).click();
  await order.getByLabel('Nimani tuzatish kerak?').fill('3-slayddagi raqamni yangilang');
  await order.getByRole('button', { name: /Tuzatish so‘rash/ }).click();
  await expect(order.locator('.svc-status')).toHaveText(
    /Sun’iy intellekt yordamida tayyorlanmoqda/,
  );

  // administrator tuzatish so'rovini ko'radi va qayta yuboradi; buyurtmachi qabul qilib baho qo'yadi
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(thread).toHaveClass(/is-unread/);
  await expect(thread).toContainText('3-slayddagi raqamni yangilang');
  await thread.click();
  await chat.getByRole('button', { name: /Mijozga yuborish/ }).click();
  await expect(chat.locator('.svc-status')).toHaveText(/Tayyor — tekshiring/);
  await student.reload({ waitUntil: 'domcontentloaded' });
  await order.getByRole('button', { name: /Qabul qilish/ }).click();
  await order.getByRole('radio', { name: '4 / 5' }).click();
  await order.getByRole('radio', { name: '5 / 5' }).click();
  await order.getByLabel('Fikringiz').fill('Zo‘r ish, rahmat!');
  await order.getByRole('button', { name: /Qabul qilaman/ }).click();
  await expect(order.locator('.svc-status')).toHaveText(/Yakunlandi/);
  await expect(order.locator('.mk-paid')).toContainText('Zo‘r ish, rahmat!');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page
    .locator('.svc-admin-tools')
    .getByRole('button', { name: /^Hammasi/ })
    .click();
  await thread.click();
  await expect(chat).toContainText('⭐ 5/5 — Zo‘r ish, rahmat!');

  // eski havolalar (ijrochilar bo'limi) buyurtma sahifasini ochadi
  await student.goto('/#services/board', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.svc-grid')).toBeVisible();
  // telefon kengligida ham sig'adi; administrator yozishmasi navbat bilan ochiladi
  await student.setViewportSize({ width: 380, height: 760 });
  await student.goto('/#services/mine', { waitUntil: 'domcontentloaded' });
  await expect(order).toBeVisible();
  expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    381,
  );
  await page.setViewportSize({ width: 380, height: 760 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page
    .locator('.svc-admin-tools')
    .getByRole('button', { name: /^Hammasi/ })
    .click();
  await thread.click();
  await expect(chat).toBeVisible();
  await expect(thread).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(381);
  await chat.getByRole('button', { name: 'Ro‘yxatga qaytish' }).click();
  await expect(thread).toBeVisible();
  await student.context().close();

  // tozalash
  await clearOrders(page);
  for (const input of [
    { op: 'info', how: '' },
    { op: 'launch', open: false },
    { op: 'catalog', kind: 'taqdimot', price: '', days: '', off: false },
    { op: 'show', shown: false },
  ])
    await svc(page, 'admin', input);
});

test('guests see the guide and catalog; the Play Market app has no paid services', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await show(page, true);
  await page.context().clearCookies();
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  // bo'lim hali ishga tushmagan: mehmonga ham «tez orada» oynasi, taklif uchun — kirish
  const soon = page.getByRole('dialog', { name: /tez orada ishga tushadi/ });
  await expect(soon).toBeVisible();
  await expect(soon.getByRole('button', { name: 'Kirib taklif yuborish' })).toBeVisible();
  await soon.getByRole('button', { name: 'Keyinroq' }).click();
  await expect(page.locator('.svc-steps li')).toHaveCount(5);
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
  await as(page, 'demo-admin');
  await show(page, false);
});

test('before the launch a student sees «Launching soon» and sends a suggestion to the administrator', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await show(page, true);
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
    budget: 50000,
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
  await expect(soon.getByText(/ijrochi/i)).toHaveCount(0);
  await soon.getByRole('button', { name: 'Keyinroq' }).click();
  await expect(soon).toHaveCount(0);

  // administrator ishga tushiradi — talaba buyurtma bera oladi
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svc-soon.is-admin')).toContainText('hali ishga tushmagan');
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: /Ishga tushirish/ }).click();
  await expect(page.locator('.svc-launch:not(.svc-shown)')).toContainText('Ishlayapti');
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.svc-soon')).toHaveCount(0);
  await student.locator('.mk-tabs a[href="#services"]').click();
  await expect(student.locator('.svc-card').first()).toContainText('Buyurtma berish');
  await student.context().close();
  // asl holiga qaytarish
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: /Tez orada.*qaytarish/ }).click();
  await expect(page.locator('.svc-launch:not(.svc-shown)')).toContainText('Tez orada');
  await show(page, false);
});

test('the administrator closes the section for a while: users lose it, the administrator reopens it', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await show(page, false);
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  // talabada: menyu, pastki panel va bosh sahifada bo'lim yo'q
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.quick-link.is-courses')).toBeVisible();
  await expect(student.locator('.quick-link.is-services')).toHaveCount(0);
  await expect(student.locator('.sidebar nav a[href="#services"]')).toHaveCount(0);
  await expect(student.locator('.bottom-nav a[href="#services"]')).toHaveCount(0);
  // eski havola yoki bildirishnoma orqali kelsa — «vaqtincha yopiq» xabari
  await student.goto('/#services/mine', { waitUntil: 'domcontentloaded' });
  await expect(
    student.getByRole('heading', { name: 'Pullik xizmatlar vaqtincha yopiq', level: 1 }),
  ).toBeVisible();
  await expect(student.locator('.svc-grid')).toHaveCount(0);
  // server ham qabul qilmaydi
  const refused = await svc(student, 'me', {
    op: 'order',
    kind: 'taqdimot',
    title: 'Sinov',
    text: 'Sinov buyurtmasining matni',
    budget: 50000,
  });
  expect(refused.status()).toBe(403);
  expect((await refused.json()).error).toContain('vaqtincha yopiq');

  // administrator bo'limni ko'radi va qayta ochadi
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svc-closed-note')).toContainText('vaqtincha yopiq');
  await expect(page.locator('.sidebar nav a[href="#services"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  const box = page.locator('.svc-launch.svc-shown');
  await expect(box).toContainText('Vaqtincha yopiq');
  page.once('dialog', (d) => void d.accept());
  await box.getByRole('button', { name: /Bo‘limni ochish/ }).click();
  await expect(box).toContainText('Menyuda');
  await expect(page.locator('.sidebar nav a[href="#services"]')).toBeVisible();
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.sidebar nav a[href="#services"]')).toBeVisible();
  await student.goto('/#services', { waitUntil: 'domcontentloaded' });
  await expect(student.getByRole('heading', { name: /Pullik xizmatlar/, level: 1 })).toBeVisible();
  await student.context().close();
  // asl holiga — yana yopiq
  page.once('dialog', (d) => void d.accept());
  await box.getByRole('button', { name: /Vaqtincha yopish/ }).click();
  await expect(box).toContainText('Vaqtincha yopiq');
});
