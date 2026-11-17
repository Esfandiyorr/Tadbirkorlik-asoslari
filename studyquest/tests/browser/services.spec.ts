import { test, expect, type Page } from '@playwright/test';

/* 💼 Pullik xizmatlar (talabalar ish bozori): ishga tushguncha talaba «🚀 Tez orada» oynasida taklif yuboradi
   («Adminga xabar»ga tushadi); ishga tushgach talaba vazifa va summani yozadi → ijrochi talaba «Men qilaman» deydi →
   administrator ijrochini tasdiqlaydi → buyurtmachi to'laydi → administrator to'lovni tasdiqlaydi → ijrochi natijani
   topshiradi → buyurtmachi qabul qilib baho qo'yadi → administrator ijrochiga pulni o'tkazadi. Play Market ilovasida
   bo'lim yo'q. Administrator bo'limni vaqtincha yopishi mumkin (sozlama yo'q bo'lsa — yopiq): menyuda yo'q,
   talaba amallari qabul qilinmaydi. */
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

test('a student posts a task, a worker applies, the admin approves, the work is delivered and paid out', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  const ctx = () => browser.newContext({ baseURL: test.info().project.use.baseURL });
  await as(page, 'demo-admin');
  await clearOrders(page);
  for (const input of [
    { op: 'show', shown: true },
    { op: 'launch', open: true },
    { op: 'fee', fee: 10 },
    { op: 'info', how: 'Click orqali 8600 … kartaga o‘tkazing' },
    { op: 'catalog', kind: 'taqdimot', price: '50 000 so‘mdan', days: '2–3 kun', off: false },
  ])
    expect((await svc(page, 'admin', input)).ok()).toBe(true);

  // ijrochi talaba ro'yxatdan o'tadi
  const worker = await (await ctx()).newPage();
  await as(worker, 'demo-teacher');
  await svc(worker, 'me', { op: 'leave' });
  await worker.goto('/#services/work', { waitUntil: 'domcontentloaded' });
  await expect(worker.getByRole('heading', { name: 'Bilimingiz bilan pul ishlang' })).toBeVisible();
  const join = worker.locator('.mk-join-form');
  const joinBtn = join.getByRole('button', { name: /Ijrochi bo‘lish/ });
  await join.getByRole('button', { name: /Taqdimot/ }).click();
  await join.getByLabel('O‘zingiz haqingizda').fill('PowerPoint va Canva’da 2 yillik tajriba');
  await join.getByLabel(/Pul o‘tkazish uchun/).fill('8600 1234 5678 9012');
  await expect(joinBtn).toBeDisabled();
  await join.getByLabel('Qoidalarga roziman').check();
  await joinBtn.click();
  await expect(worker.getByText(/Siz endi ijrochisiz/)).toBeVisible();
  await expect(worker.locator('.mk-tiles')).toContainText('Ishlab topilgan');

  // buyurtmachi talaba vazifa beradi va summani o'zi yozadi
  const student = await (await ctx()).newPage();
  await as(student, 'demo-student');
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  await student.locator('.sidebar nav a[href="#services"]').click();
  await expect(student.getByRole('heading', { name: /Pullik xizmatlar/, level: 1 })).toBeVisible();
  await expect(student.locator('.svc-steps li')).toHaveCount(5);
  await expect(student.locator('.svc-how .svc-honest')).toContainText('administratorga to‘lanadi');
  const cards = student.locator('.svc-card');
  await expect(cards.filter({ hasText: 'Kurs ishi' })).toContainText('Yordam');
  const slides = cards.filter({ has: student.getByText('Taqdimot', { exact: true }) });
  await expect(slides).toContainText('50 000 so‘mdan');
  await slides.click();
  const form = student.getByRole('dialog', { name: /Taqdimot/ });
  await form.getByLabel('Mavzu yoki ish nomi').fill('Kichik biznesda marketing');
  await form.getByLabel(/Nima kerak/).fill('12 slayd, o‘zbek tilida, oxirida 3 ta savol bo‘lsin');
  await expect(form).toContainText('Odatdagi narx: 50 000 so‘mdan');
  const post = form.getByRole('button', { name: /E’lon qilish/ });
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
  await expect(student.getByText(/Vazifa e’lon qilindi/)).toBeVisible();
  await expect.poll(() => new URL(student.url()).hash).toBe('#services/mine');
  const order = student.locator('.svc-order').filter({ hasText: 'Kichik biznesda marketing' });
  await expect(order.locator('.svc-status')).toHaveText(/Ijrochi qidirilmoqda/);
  await expect(order).toContainText('120 000 so‘m');

  // ijrochi e'londa vazifani ko'radi va «Men qilaman» deydi (platforma ulushi 10% — 108 000 so'm oladi)
  await worker.goto('/#services/board', { waitUntil: 'domcontentloaded' });
  const task = worker.locator('.mk-task').filter({ hasText: 'Kichik biznesda marketing' });
  await expect(task).toContainText('120 000 so‘m');
  await expect(task).not.toContainText('@ali_test');
  await task.click();
  const modal = worker.getByRole('dialog', { name: 'Kichik biznesda marketing' });
  await expect(modal.locator('.mk-modal-sum')).toContainText('108 000 so‘m');
  await modal.getByLabel(/qisqa izoh/).fill('2 kunda tayyorlayman');
  await modal.getByRole('button', { name: /Men qilaman/ }).click();
  await expect(worker.getByText(/Ariza yuborildi/)).toBeVisible();
  await expect(task).toContainText('Ariza yuborilgan');

  // buyurtmachi arizani ko'radi
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(order.locator('.mk-apps')).toContainText('1 ta ijrochi tayyor');
  await expect(order.locator('.mk-apps')).toContainText('2 kunda tayyorlayman');

  // administrator ijrochini tasdiqlaydi
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const all = page.locator('.svc-admin-tools').getByRole('button', { name: /^Hammasi/ });
  const card = page.locator('.svc-aorder').filter({ hasText: 'Kichik biznesda marketing' });
  await expect(card).toHaveClass(/is-todo/);
  await all.click();
  await card.locator('.svc-aorder-head').click();
  await expect(card).toContainText('@ali_test');
  await expect(card).toContainText('talablar.pdf');
  await expect(card.locator('.mk-apps')).toContainText('2 kunda tayyorlayman');
  await card.getByRole('button', { name: /^✅ Tasdiqlash/ }).click();
  await expect(card.locator('.svc-status')).toHaveText(/To‘lov kutilmoqda/);

  // buyurtmachi to'laydi
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(order.locator('.svc-status')).toHaveText(/To‘lov kutilmoqda/);
  await expect(order.locator('.svc-pay')).toContainText('Click orqali');
  await order.getByLabel(/Chek raqami/).fill('chek 777');
  await order.getByRole('button', { name: /To‘lov qildim/ }).click();
  await expect(order.locator('.svc-status')).toHaveText(/To‘lov tekshirilmoqda/);

  // administrator to'lovni tasdiqlaydi — ish boshlanadi
  await page.reload({ waitUntil: 'domcontentloaded' });
  await all.click();
  await card.locator('.svc-aorder-head').click();
  await expect(card).toContainText('chek 777');
  await card.getByRole('button', { name: /To‘lovni tasdiqlash/ }).click();
  await expect(card.locator('.svc-status')).toHaveText(/Bajarilmoqda/);

  // ijrochi: talablarni ko'radi, savol beradi, natijani yuklab topshiradi
  await worker.goto('/#services/work', { waitUntil: 'domcontentloaded' });
  const job = worker.locator('.svc-order').filter({ hasText: 'Kichik biznesda marketing' });
  await expect(job.locator('.svc-status')).toHaveText(/Bajarilmoqda/);
  await expect(job).toContainText('talablar.pdf');
  await job.getByLabel('Xabar').fill('Qaysi rangda bo‘lsin?');
  await job.getByRole('button', { name: 'Yuborish' }).click();
  await expect(job.locator('.svc-msgs')).toContainText('Qaysi rangda bo‘lsin?');
  const deliver = job.getByRole('button', { name: /Ishni topshirish/ });
  await expect(deliver).toBeDisabled();
  await job
    .locator('.svc-deliver input[type="file"]')
    .setInputFiles({ name: 'natija.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(job.locator('.svc-deliver .svc-files')).toContainText('natija.pdf');
  await deliver.click();
  await expect(job.locator('.svc-status')).toHaveText(/Tekshirish kerak/);

  // buyurtmachi: yuklab oladi, tuzatish so'raydi
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(order.locator('.svc-status')).toHaveText(/Tekshirish kerak/);
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
  await expect(order.locator('.svc-status')).toHaveText(/Bajarilmoqda/);

  // ijrochi qayta topshiradi, buyurtmachi qabul qilib baho qo'yadi
  const ref = (
    (await (await page.request.get('/api/services?admin=1')).json()).orders as {
      uk: string;
      id: string;
      title: string;
    }[]
  ).find((o) => o.title === 'Kichik biznesda marketing')!;
  expect((await svc(worker, 'me', { op: 'deliver', uk: ref.uk, id: ref.id })).ok()).toBe(true);
  await student.reload({ waitUntil: 'domcontentloaded' });
  await order.getByRole('button', { name: /Qabul qilish/ }).click();
  await order.getByRole('radio', { name: '4 / 5' }).click();
  await order.getByRole('radio', { name: '5 / 5' }).click();
  await order.getByLabel('Fikringiz').fill('Zo‘r ish, rahmat!');
  await order.getByRole('button', { name: /Qabul qilaman/ }).click();
  await expect(order.locator('.svc-status')).toHaveText(/Yakunlandi/);
  await expect(order.locator('.mk-paid')).toContainText('Zo‘r ish, rahmat!');

  // ijrochi kabinetida: pul o'tkazilishi kutilmoqda
  await worker.reload({ waitUntil: 'domcontentloaded' });
  await expect(worker.locator('.mk-tiles .is-amber')).toContainText('108 000 so‘m');
  await expect(job).toContainText('administrator pulingizni o‘tkazadi');

  // administrator ijrochiga pulni o'tkazadi
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(card).toHaveClass(/is-todo/);
  await card.locator('.svc-aorder-head').click();
  await expect(card.getByLabel('Summa')).toHaveValue('108000');
  page.once('dialog', (d) => void d.accept());
  await card.getByRole('button', { name: 'O‘tkazildi' }).click();
  await expect(card.locator('.mk-payout')).toContainText('108 000 so‘m ijrochiga o‘tkazilgan');
  await page
    .locator('.bo-subtabs')
    .getByRole('tab', { name: /Ijrochilar/ })
    .click();
  await expect(page.locator('.mk-workers')).toContainText('8600 1234 5678 9012');

  // ijrochi: pul o'tkazildi, ishlab topilgan summa va baho
  await worker.reload({ waitUntil: 'domcontentloaded' });
  await expect(job).toContainText('108 000 so‘m hisobingizga o‘tkazildi');
  await expect(worker.locator('.mk-tiles .is-green')).toContainText('108 000 so‘m');
  await expect(worker.locator('.mk-tiles .is-blue')).toContainText('5');

  // telefon kengligida ham sig'adi
  for (const p of [student, worker]) {
    await p.setViewportSize({ width: 380, height: 760 });
    await p.goto('/#services/board', { waitUntil: 'domcontentloaded' });
    await expect(p.locator('.mk-tabs')).toBeVisible();
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(381);
  }
  await student.context().close();

  // tozalash
  await clearOrders(page);
  await svc(worker, 'me', { op: 'leave' });
  await worker.context().close();
  for (const input of [
    { op: 'info', how: '' },
    { op: 'fee', fee: 0 },
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
  // ishga tushguncha ham ijrochi bo'lib ro'yxatdan o'tish mumkin
  await soon.getByRole('button', { name: /ijrochi bo‘lib ro‘yxatdan o‘ting/ }).click();
  await expect(soon).toHaveCount(0);
  await expect.poll(() => new URL(student.url()).hash).toBe('#services/work');
  await expect(student.locator('.mk-join-form')).toBeVisible();

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
  await expect(student.locator('.svc-card').first()).toContainText('Vazifa berish');
  await student.context().close();
  // asl holiga qaytarish
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: /Tez orada.*qaytarish/ }).click();
  await expect(page.locator('.svc-launch:not(.svc-shown)')).toContainText('Tez orada');
  await show(page, false);
});

test('the administrator closes the section for a while: students lose it, the administrator reopens it', async ({
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
  const refused = await svc(student, 'me', { op: 'leave' });
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
