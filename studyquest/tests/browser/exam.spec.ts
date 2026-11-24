import { test, expect, type Locator, type Page } from '@playwright/test';

/* 🎯 Yakuniy testga tayyorgarlik: administrator savollarni yuklaydi → talaba istalgan summani kartaga to'lab chek
   skrinshotini yuklaydi (narx belgilanmagan) → administrator chekni qabul qiladi → bo'lim o'zi ochiladi → mashq
   (javob darhol tekshiriladi) → yakuniy sinov → 60 % va undan ko'p — QR-kodli sertifikat. 💎 Premium ham shu yo'l
   bilan: administrator 1 oy yoki 1 yilga ochadi, obunachi profil bezagini tanlaydi va reytingda ajralib turadi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
const exam = (page: Page, scope: 'me' | 'admin', input: unknown) =>
  page.request.post('/api/exam', { data: { scope, input } });
const svc = (page: Page, scope: 'me' | 'admin', input: unknown) =>
  page.request.post('/api/services', { data: { scope, input } });
/** n ta savol (to'g'ri javob — B). */
const block = (topic: number, n: number) =>
  Array.from(
    { length: n },
    (_, i) => `${i + 1}. ${topic}-mavzu, ${i + 1}-savol?\nA) Yo‘q\n*B) Ha, to‘g‘ri\nC) Bilmayman`,
  ).join('\n\n');
/** 1×1 PNG — to'lov cheki skrinshoti o'rnida */
const RECEIPT = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
/** Sodda to'lov formasi: summa → chek skrinshoti → «Chekni yuborish». */
async function payForm(box: Locator, amount: string, note = '') {
  const send = box.getByRole('button', { name: /Chekni yuborish/ });
  await expect(send).toBeDisabled();
  await box.getByLabel(/Qancha to‘ladingiz/).fill(amount);
  await box
    .locator('.receipt-pick input[type="file"]')
    .setInputFiles({ name: 'chek.png', mimeType: 'image/png', buffer: RECEIPT });
  await expect(box.locator('.receipt-pick .image-pick-thumb img')).toBeVisible();
  if (note) await box.getByLabel('Izoh').fill(note);
  await send.click();
}
async function reset(page: Page) {
  for (let t = 1; t <= 15; t++) await exam(page, 'admin', { op: 'clear', topic: 'm' + t });
  const ex = await (await page.request.get('/api/exam?admin=1')).json();
  for (const b of ex.buyers as { uid: string }[])
    await exam(page, 'admin', { op: 'revoke', uid: b.uid });
  const v = await (await page.request.get('/api/services?admin=1')).json();
  for (const o of v.orders as { uk: string; id: string }[])
    await svc(page, 'admin', { op: 'remove', uk: o.uk, id: o.id });
}
test('final exam prep: upload questions, buy the section, practise, pass the final exam and get a certificate', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  await as(page, 'demo-admin');
  await reset(page);
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');

  // savollar hali yo'q: bo'lim ko'rinadi, lekin sotuvda emas
  await student.goto('/#course/tad-asoslari/exam', { waitUntil: 'domcontentloaded' });
  await expect(student.getByRole('tab', { name: 'Yakuniy test' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(student.locator('.ex-locked')).toContainText('Testlar tez orada yuklanadi');
  await expect(student.getByRole('button', { name: /Chekni yuborish/ })).toHaveCount(0);

  // administrator: Sayt boshqaruvi → 🎯 Yakuniy test savollari — matnni qo'yib saqlaydi
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: /Yakuniy test savollari/ })
    .first()
    .click();
  const box = page.locator('.exa-topic');
  await expect(box).toContainText('1. ');
  await box.getByRole('textbox').fill(block(1, 3) + '\n\n4. Javobsiz savol?\nA) bir\nB) ikki');
  await expect(page.locator('.exa-parse')).toContainText('O‘qildi: 3 ta savol');
  await expect(page.locator('.exa-parse')).toContainText('4-savol');
  await box.getByRole('button', { name: /Saqlash/ }).click();
  await expect(page.getByText(/Saqlandi: 3 ta yangi/)).toBeVisible();
  await expect(page.locator('.exa-topics button').first()).toContainText('3');
  for (const t of [2, 3])
    expect(
      (
        await exam(page, 'admin', {
          op: 'import',
          topic: 'm' + t,
          text: block(t, 3),
          replace: true,
        })
      ).ok(),
    ).toBe(true);

  // talaba: bo'lim yopiq — nima borligi; narx belgilanmagan: karta, istalgan summa, chek skrinshoti
  await student.reload({ waitUntil: 'domcontentloaded' });
  const locked = student.locator('.ex-locked');
  await expect(locked).toContainText('450 ta test');
  await expect(locked).toContainText('Karta orqali to‘lang');
  await expect(locked.locator('.pb-price')).toHaveCount(0);
  await payForm(locked, '10000', 'chek 555');
  // administrator qabul qilguncha kutadi
  await expect(locked.locator('.pb.is-wait')).toContainText('Chekingiz yuborildi: 10 000 so‘m');
  await expect(locked.locator('.pb.is-wait .receipts img')).toBeVisible();

  // administrator yozishmada chekni ko'rib qabul qiladi — bo'lim o'zi ochiladi
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const thread = page.locator('.svc-thread').filter({ hasText: 'Yakuniy testga tayyorgarlik' });
  await expect(thread.locator('.svc-thread-flags')).toContainText('💳');
  await thread.click();
  const chat = page.locator('.svc-chat');
  await expect(chat.locator('.svc-pay')).toContainText('Chek keldi — tekshiring: 10 000 so‘m');
  await expect(chat.locator('.svc-pay')).toContainText('chek 555');
  await expect(chat.locator('.svc-pay .receipts img')).toBeVisible();
  await expect(chat.locator('.svc-deliver')).toHaveCount(0);
  await expect(chat.getByRole('button', { name: /Soxta chek — bloklash/ })).toBeVisible();
  await chat.getByRole('button', { name: /Qabul qilish — ochish/ }).click();
  await expect(chat.locator('.svc-pay')).toContainText('To‘lov qabul qilingan');

  // talaba: bo'lim ochiq — 1-mavzu bo'yicha mashq
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.ex-tiles')).toContainText('0/9');
  const topics = student.locator('.ex-topics li');
  await expect(topics).toHaveCount(15);
  await topics.first().getByRole('button', { name: 'Mashq' }).click();
  const run = student.locator('.ex-run');
  await expect(run.locator('legend')).toContainText('1-mavzu');
  await run.getByRole('button', { name: /Yo‘q/ }).click();
  await expect(run.locator('.ex-feedback')).toContainText('To‘g‘ri javob: B) Ha, to‘g‘ri');
  await run.getByRole('button', { name: /Keyingi/ }).click();
  await run.getByRole('button', { name: /Ha, to‘g‘ri/ }).click();
  await expect(run.locator('.ex-feedback')).toContainText('To‘g‘ri!');
  await run.getByRole('button', { name: /Chiqish/ }).click();
  await expect(student.locator('.ex-tiles')).toContainText('2/9');
  await expect(student.getByRole('button', { name: /Xatolar ustida ishlash/ })).toContainText(
    '1 ta savol',
  );

  // yakuniy sinov: 9 savol, hammasiga to'g'ri javob → sertifikat
  student.once('dialog', (d) => void d.accept());
  await student.getByRole('button', { name: /Yakuniy sinov/ }).click();
  const final = student.locator('.ex-run.is-final');
  await expect(final.locator('.ex-timer')).toContainText(/(59|60):\d\d/);
  await expect(final.locator('fieldset')).toHaveCount(9);
  for (const q of await final.locator('fieldset').all())
    await q.getByRole('button', { name: /Ha, to‘g‘ri/ }).click();
  await expect(final.locator('.ex-run-head')).toContainText('9/9');
  await final.getByRole('button', { name: /Topshirish/ }).click();
  const done = student.locator('.ex-done');
  await expect(done).toContainText('9/9 · 100 %');
  await expect(done).toContainText('sertifikat oldingiz');
  await done.getByRole('button', { name: /Sertifikatni ko‘rish/ }).click();
  await expect.poll(() => new URL(student.url()).hash).toMatch(/^#sertifikat\/TA-/);
  const cert = student.locator('.cert');
  await expect(cert).toContainText('SERTIFIKAT');
  await expect(cert).toContainText(
    '«Tadbirkorlik asoslari» fanidan yakuniy testni muvaffaqiyatli topshirgani uchun berildi.',
  );
  await expect(cert).toContainText('9 / 9');
  await expect(cert.locator('.cert-qr svg')).toBeVisible();
  // QR-kod olib keladigan sahifa mehmonga ham ochiladi
  const url = student.url();
  const guest = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await guest.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(guest.locator('.cert-valid')).toContainText('Sertifikat haqiqiy');
  await guest.goto('/#sertifikat/TA-NOPE-0000', { waitUntil: 'domcontentloaded' });
  await expect(guest.getByText('Sertifikat topilmadi')).toBeVisible();
  await guest.context().close();

  // telefon kengligida sig'adi
  await student.setViewportSize({ width: 380, height: 760 });
  await student.goto('/#course/tad-asoslari/exam', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.ex-actions')).toBeVisible();
  expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    381,
  );
  await student.context().close();
  await reset(page);
});

test('Premium: shown in the news box with its perks; any amount and a receipt; on the Premium admin page the administrator rejects or accepts it for 1 month or 1 year and sees the period and amount; pick one of 5 looks', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await as(page, 'demo-admin');
  await reset(page);
  await exam(page, 'admin', { op: 'import', topic: 'm1', text: block(1, 2), replace: true });
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  // obunasi yo'q: o'ng tomondagi e'lonlar qutisida Premium — nimalar ochilishi bilan
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  const news = student.locator('.news-box').first();
  const dots = news.locator('.news-dots button');
  if (await dots.count()) await dots.last().click();
  const slide = news.locator('.news-premium');
  await expect(slide).toContainText('Obuna bo‘ling');
  await expect(slide.locator('.premium-perks li')).toHaveCount(5);
  await slide.getByRole('button', { name: /Obuna bo‘lish/ }).click();
  await expect(student.getByRole('dialog')).toContainText('Profil bezagi');
  await student.keyboard.press('Escape');
  // profilda ham: obuna bo'lganlarga nimalar ochiladi
  await student.goto('/#profile', { waitUntil: 'domcontentloaded' });
  const card = student.locator('.premium-card');
  const profileMark = student
    .locator('.profile-hero-id')
    .getByRole('img', { name: 'Faol Premium obuna' });
  await expect(card).toContainText('Obuna bo‘lganlarga quyidagilar ochiladi');
  await expect(profileMark).toHaveCount(0);
  await expect(card).toContainText('Profil bezagi');
  await card.getByRole('button', { name: /Obuna bo‘lish/ }).click();
  const offer = student.getByRole('dialog');
  await expect(offer).toContainText('Kutubxonadagi 💎');
  await expect(offer).not.toContainText('chegirma');
  const plans = offer.locator('.premium-plans');
  await expect(plans).not.toContainText('5 000 so‘m');
  await payForm(plans, '1000');
  await expect(plans).toContainText('Chekingiz yuborildi: 1 000 so‘m');
  // administrator: Sayt boshqaruvi → 💎 Obuna — chek yuborganlar (summa, chek): qabul qilish yoki qilmaslik
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: /Obuna \(pullik imkoniyatlar\)/ })
    .first()
    .click();
  const pending = page.locator('.pm-admin-pending .pm-admin-list > li');
  await expect(pending).toHaveCount(1);
  await expect(pending).toContainText('1 000 so‘m');
  await expect(pending.locator('.receipts img')).toBeVisible();
  await expect(pending.getByRole('button', { name: /1 yilga qabul qilish/ })).toBeVisible();
  page.once('dialog', (d) => void d.accept('summa kam'));
  await pending.getByRole('button', { name: /Qabul qilmaslik/ }).click();
  await expect(pending).toHaveCount(0);
  // foydalanuvchi: sababini ko'radi va yangi chek yuboradi
  await student.reload({ waitUntil: 'domcontentloaded' });
  await card.getByRole('button', { name: /Obuna bo‘lish/ }).click();
  await expect(plans.locator('.pb-note.is-rejected')).toContainText(
    'Chek qabul qilinmadi: summa kam',
  );
  await payForm(plans, '5000');
  await expect(plans).toContainText('Chekingiz yuborildi: 5 000 so‘m');
  // administrator 1 oyga qabul qiladi — obuna o'zi yoqiladi; ro'yxatda muddat va to'langan summa
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(pending).toHaveCount(1);
  await pending.getByRole('button', { name: /1 oyga qabul qilish/ }).click();
  await expect(pending).toHaveCount(0);
  const sub = page.locator('.pm-admin-subs > li').first();
  await expect(sub).toContainText('Muddat: 1 oy');
  await expect(sub).toContainText('To‘lagan: 5 000 so‘m');
  await expect(sub).toContainText('gacha');
  await expect(page.locator('.bo-status')).toContainText('jami to‘langan: 5 000 so‘m');
  await expect(sub.getByRole('button', { name: /Obunani bekor qilish/ })).toBeVisible();

  // obunachi: 5 xil bezakdan birini tanlaydi
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(profileMark).toBeVisible();
  const looks = card.getByRole('radio');
  await expect(looks).toHaveCount(5);
  await expect(looks.first()).toHaveAttribute('aria-checked', 'true');
  await card.getByRole('radio', { name: /Olovli/ }).click();
  await expect(card.getByRole('radio', { name: /Olovli/ })).toHaveAttribute('aria-checked', 'true');
  await student.goto('/#course/tad-asoslari/ranking', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.rk-row.me')).toHaveClass(/pm-olov/);
  await expect(student.locator('.rk-row.me .pm-chip')).toHaveText('🔥');
  // obunachiga e'lonlar qutisida Premium taklifi chiqmaydi
  await student.setViewportSize({ width: 390, height: 844 });
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  const homeMark = student
    .locator('.home-heading h1')
    .getByRole('img', { name: 'Faol Premium obuna' });
  await expect(homeMark).toBeInViewport();
  await expect(student.locator('.news-premium')).toHaveCount(0);
  // tozalash: obunani olib tashlash
  const me = await (await page.request.get('/api/platform?view=premiumAdmin')).json();
  for (const g of me.grants as { uid: string }[])
    await page.request.post('/api/platform', {
      data: { action: 'premiumAdmin', input: { op: 'revoke', uid: g.uid } },
    });
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.hero-avatar:visible')).toBeVisible();
  await expect(homeMark).toHaveCount(0);
  await student.context().close();
  await reset(page);
});

test('the logo assignment is closed: no upload page or grading tab, old links open topic 8', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#topshiriq/m8', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.native-document')).toContainText('REKLAMA');
  await expect(page.getByRole('button', { name: 'Logotip topshirig‘i' })).toHaveCount(0);
  expect((await page.request.get('/api/task')).status()).toBe(404);
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /Yakuniy test savollari/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Logotip topshirig/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Logotiplar/ })).toHaveCount(0);
  await expect(page.getByText('Baholanmagan logotiplar')).toHaveCount(0);
});

test('a fake receipt: the administrator rejects and blocks — the section stays closed and paid services are refused', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await as(page, 'demo-admin');
  await reset(page);
  await exam(page, 'admin', { op: 'import', topic: 'm1', text: block(1, 2), replace: true });
  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  await student.goto('/#course/tad-asoslari/exam', { waitUntil: 'domcontentloaded' });
  const locked = student.locator('.ex-locked');
  await payForm(locked, '10000');
  await expect(locked.locator('.pb.is-wait')).toBeVisible();
  // administrator: chek soxta (to'lov kelmagan) — rad etib bloklaydi
  await page.goto('/#admin/services', { waitUntil: 'domcontentloaded' });
  await page.locator('.svc-thread').filter({ hasText: 'Yakuniy testga tayyorgarlik' }).click();
  const chat = page.locator('.svc-chat');
  page.once('dialog', (d) => void d.accept());
  await chat.getByRole('button', { name: /Soxta chek — bloklash/ }).click();
  await expect(chat.locator('.svc-status')).toContainText('Bekor');
  // talabada: bo'lim yana yopiq, sotib olish o'rniga — blok haqida xabar
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.ex-locked .pb-note.is-banned')).toContainText(
    'Sizga pullik xizmatlar yopilgan',
  );
  await student.goto('/#services/mine', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.svc-banned')).toBeVisible();
  // administrator «To'lov yo'riqnomasi» bo'limida blokdan chiqaradi
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: /To‘lov yo‘riqnomasi/ }).click();
  const bans = page.locator('.svc-bans');
  await expect(bans).toContainText('Yakuniy testga tayyorgarlik');
  page.once('dialog', (d) => void d.accept());
  await bans.getByRole('button', { name: 'Blokdan chiqarish' }).click();
  await expect(bans).toHaveCount(0);
  await student.goto('/#course/tad-asoslari/exam', { waitUntil: 'domcontentloaded' });
  await expect(
    student.locator('.ex-locked').getByRole('button', { name: /Chekni yuborish/ }),
  ).toBeVisible();
  await student.context().close();
  await reset(page);
});
