import { test, expect, type Page } from '@playwright/test';

/* 🎯 Yakuniy testga tayyorgarlik: administrator savollarni yuklaydi → talaba bo'limni sotib oladi (pullik xizmat) →
   administrator to'lovni tasdiqlaydi → bo'lim ochiladi → mashq (javob darhol tekshiriladi) → yakuniy sinov → 60 % va
   undan ko'p — QR-kodli sertifikat. 💎 Premium ham shu yo'l bilan sotiladi: obunachi profil bezagini tanlaydi va
   reytingda ajralib turadi; yakuniy test unga yarim narxda. */
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
async function reset(page: Page) {
  for (let t = 1; t <= 15; t++) await exam(page, 'admin', { op: 'clear', topic: 'm' + t });
  const ex = await (await page.request.get('/api/exam?admin=1')).json();
  for (const b of ex.buyers as { uid: string }[])
    await exam(page, 'admin', { op: 'revoke', uid: b.uid });
  const v = await (await page.request.get('/api/services?admin=1')).json();
  for (const o of v.orders as { uk: string; id: string }[])
    await svc(page, 'admin', { op: 'remove', uk: o.uk, id: o.id });
}
async function confirmAll(page: Page, kind: string) {
  const v = await (await page.request.get('/api/services?admin=1')).json();
  for (const o of v.orders as { uk: string; id: string; kind: string; payOk?: number }[])
    if (o.kind === kind && !o.payOk)
      expect((await svc(page, 'admin', { op: 'confirm', uk: o.uk, id: o.id })).ok()).toBe(true);
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
  await expect(student.getByRole('button', { name: /Sotib olish/ })).toHaveCount(0);

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

  // talaba: bo'lim yopiq — nima borligi va narxi (10 000 so'm), sotib oladi va to'laydi
  await student.reload({ waitUntil: 'domcontentloaded' });
  const locked = student.locator('.ex-locked');
  await expect(locked).toContainText('450 ta test');
  await expect(locked.locator('.pb-price')).toContainText('10 000 so‘m');
  await locked.getByRole('button', { name: /Sotib olish/ }).click();
  await locked.getByLabel(/Chek raqami/).fill('chek 555');
  await locked.getByRole('button', { name: /To‘lov qildim/ }).click();
  await expect(locked).toContainText('To‘lov tekshirilmoqda');

  // administrator yozishmada to'lovni tasdiqlaydi — bo'lim o'zi ochiladi
  await page.goto('/#services', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Boshqarish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const thread = page.locator('.svc-thread').filter({ hasText: 'Yakuniy testga tayyorgarlik' });
  await expect(thread.locator('.svc-thread-flags')).toContainText('💳');
  await thread.click();
  const chat = page.locator('.svc-chat');
  await expect(chat).toContainText('chek 555');
  await expect(chat).toContainText('o‘zi ochiladi');
  await expect(chat.locator('.svc-deliver')).toHaveCount(0);
  await chat.getByRole('button', { name: /To‘lovni tasdiqlash/ }).click();
  await expect(chat.locator('.svc-pay')).toContainText('To‘lov tasdiqlangan');

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

test('Premium: buy a plan, pick one of 5 profile looks, stand out in the leaderboard and get 50 % off', async ({
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
  // obunasi yo'q: profilda taklif, rejalar — 5 000 so'm/oy va yillik
  await student.goto('/#profile', { waitUntil: 'domcontentloaded' });
  const card = student.locator('.premium-card');
  await expect(card).toContainText('Oyiga 5 000 so‘m');
  await card.getByRole('button', { name: /Obuna bo‘lish/ }).click();
  const offer = student.getByRole('dialog');
  await expect(offer).toContainText('Profil bezagi');
  await expect(offer).toContainText('50 % chegirma');
  const month = offer.locator('.premium-plans section').first();
  await expect(month.locator('.pb-price')).toContainText('5 000 so‘m');
  await expect(offer.locator('.premium-plans section').nth(1).locator('.pb-price')).toContainText(
    '45 000 so‘m',
  );
  await month.getByRole('button', { name: /Sotib olish/ }).click();
  await month.getByRole('button', { name: /To‘lov qildim/ }).click();
  await expect(month).toContainText('To‘lov tekshirilmoqda');
  await confirmAll(page, 'premium-oy');

  // obunachi: 5 xil bezakdan birini tanlaydi
  await student.reload({ waitUntil: 'domcontentloaded' });
  const looks = card.getByRole('radio');
  await expect(looks).toHaveCount(5);
  await expect(looks.first()).toHaveAttribute('aria-checked', 'true');
  await card.getByRole('radio', { name: /Olovli/ }).click();
  await expect(card.getByRole('radio', { name: /Olovli/ })).toHaveAttribute('aria-checked', 'true');
  await student.goto('/#course/tad-asoslari/ranking', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.rk-row.me')).toHaveClass(/pm-olov/);
  await expect(student.locator('.rk-row.me .pm-chip')).toHaveText('🔥');
  // yakuniy test — yarim narxda
  await student.goto('/#course/tad-asoslari/exam', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.pb-price')).toContainText('5 000 so‘m');
  await expect(student.locator('.pb-price s')).toHaveText('10 000 so‘m');
  await student.context().close();
  // tozalash: obunani olib tashlash
  const me = await (await page.request.get('/api/platform?view=premiumAdmin')).json();
  for (const g of me.grants as { uid: string }[])
    await page.request.post('/api/platform', {
      data: { action: 'premiumAdmin', input: { op: 'revoke', uid: g.uid } },
    });
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
