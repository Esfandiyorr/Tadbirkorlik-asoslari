import { test, expect, type Page } from '@playwright/test';

/* 🍽️ Yangi fan — «Restoran xodimlari malakasini oshirish»: 💳 pullik kurs. Hamma ko'radi, darslarni faqat
   administrator va u ruxsat bergan qatnashchilar ochadi (🎬 animatsion video subtitr bilan). */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}

test('the administrator opens a restaurant lesson and plays the subtitled video', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#courses', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.course-card').filter({ hasText: 'Restoran xodimlari' });
  await expect(card).toBeVisible();
  await expect(card.locator('.course-paid-chip')).toHaveText('Sizga ochiq');
  await card.click();
  await expect(page).toHaveURL(/#course\/restoran$/);
  await expect(page.locator('.course-paid-note')).toContainText('faqat siz ruxsat bergan');
  await expect(page.locator('.course-gate.is-paid')).toHaveCount(0);
  const lesson = page.locator('.lesson-card').filter({ hasText: 'Kasbiy etika va xizmat sikli' });
  await expect(lesson).toBeVisible();
  await lesson.click();
  await expect(page).toHaveURL(/#lesson\/r1$/);

  // taqdimot: muqova, keyin 18-slayddagi video (manzillar /legacy ichidan, subtitr yo'li bilan)
  const doc = page.locator('.native-document');
  await expect(doc.locator('> .inner')).toBeVisible();
  await expect(doc).toContainText('KASBIY ETIKA VA XIZMAT SIKLI');
  await expect(page.locator('.reader-heading, .reader-toolbar').first()).toContainText('1-mavzu');
  await page.locator('.reader-controls').getByRole('combobox').selectOption('17');
  const video = doc.locator('figure.sq-film video');
  await expect(video).toHaveAttribute('src', /\/legacy\/fayllar\/video\/R1\.mp4$/);
  await expect(video).toHaveAttribute('poster', /\/legacy\/fayllar\/video\/R1\.jpg$/);
  await expect(video.locator('track')).toHaveAttribute('src', /\/legacy\/fayllar\/video\/R1\.vtt$/);
  // video haqiqatan yuklanadi va subtitr yo'li o'qiladi
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks.length))
    .toBeGreaterThan(0);

  // dars oynasi tepasidagi «Video» tugmasi — sayt ichidagi pleyer
  await page.getByRole('button', { name: 'Animatsion video' }).click();
  const modal = page.getByRole('dialog', { name: /Kasbiy etika va xizmat sikli/ });
  const player = modal.locator('video');
  await expect(player).toHaveAttribute('src', '/legacy/fayllar/video/R1.mp4');
  await expect(player.locator('track')).toHaveAttribute('srclang', 'uz');
  await expect
    .poll(() => player.evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 20000 })
    .toBeGreaterThanOrEqual(1);
  const seconds = await player.evaluate((v: HTMLVideoElement) => v.duration);
  expect(seconds).toBeGreaterThan(120);
  expect(seconds).toBeLessThan(420);
  await expect(modal.getByRole('link', { name: /MP4/ })).toHaveAttribute('download', '');
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  // test slaydi: 15 ta savol
  await page.locator('.reader-controls').getByRole('combobox').selectOption('19');
  await expect(doc).toContainText('15 ta savol');

  // fayllar: subtitr va video
  const vtt = await page.request.get('/legacy/fayllar/video/R1.vtt');
  expect(vtt.status()).toBe(200);
  expect((await vtt.text()).startsWith('WEBVTT')).toBe(true);
  const mp4 = await page.request.get('/legacy/fayllar/video/R1.mp4', {
    headers: { Range: 'bytes=0-15' },
  });
  expect([200, 206]).toContain(mp4.status());
  expect((await mp4.body()).subarray(4, 8).toString()).toBe('ftyp');
});

test('everyone sees the paid course, but without permission the lessons stay closed', async ({
  page,
}) => {
  for (const id of ['demo-student', 'demo-teacher']) {
    await as(page, id);
    await page.goto('/#courses', { waitUntil: 'domcontentloaded' });
    await page.reload();
    const card = page.locator('.course-card').filter({ hasText: 'Restoran xodimlari' });
    await expect(card.locator('.course-paid-chip')).toHaveText('💳 Pullik kurs');
    await card.click();
    await expect(page.locator('.course-gate.is-paid')).toContainText('Bu kurs pullik');
    await expect(page.locator('.lesson-card')).toHaveCount(12);
    // tayyor dars — qulf bilan; bosilsa dars emas, «Kurs pullik» oynasi
    const lesson = page.locator('.lesson-card').filter({ hasText: 'Kasbiy etika' });
    await expect(lesson).toContainText('💳 Pullik kurs');
    await lesson.click();
    await expect(page).toHaveURL(/#lesson\/r1$/);
    await expect(page.locator('.course-gate-page .course-gate.is-paid')).toBeVisible();
    await expect(page.locator('.native-document')).toHaveCount(0);
    // server ham bermaydi
    const api = await page.request.get('/api/platform?view=legacyLesson&lesson=r1');
    expect(api.status()).toBe(403);
    // yangi tayyorlangan dars ham shu pullik ruxsat bilan himoyalangan
    await page.goto('/#lesson/r5', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.course-gate-page .course-gate.is-paid')).toBeVisible();
    await expect(page.locator('.native-document')).toHaveCount(0);
    const newLesson = await page.request.get('/api/platform?view=legacyLesson&lesson=r5');
    expect(newLesson.status()).toBe(403);
  }
  // mehmonga ham kurs ko'rinadi — darslar uchun kirish so'raladi
  await page.request.delete('/api/auth/demo');
  const guest = await (await page.request.get('/api/platform')).json();
  expect(guest.courses.map((c: { id: string }) => c.id)).toContain('restoran');
  expect(guest.paid.restoran).toMatchObject({ ok: false });
  // asl fayl to'g'ridan-to'g'ri ochilsa — saytga qaytaradi (taqdimot ko'rinmaydi)
  await as(page, 'demo-student');
  await page.goto('/legacy/restoran-1.html');
  await expect(page).toHaveURL(/#lesson\/r1$/);
  await expect(page.locator('.native-document')).toHaveCount(0);
});

test('a student asks to join, the administrator approves in «Kursga ruxsat» and the lesson opens', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#course/restoran', { waitUntil: 'domcontentloaded' });
  await page.reload();
  const gate = page.locator('.course-gate.is-paid');
  await gate.getByRole('button', { name: 'Qatnashish uchun so‘rov' }).click();
  await gate.getByLabel(/Izoh/).fill('Ofitsiant, «Sharq» restorani');
  await gate.getByRole('button', { name: 'So‘rov yuborish' }).click();
  await expect(gate.locator('.course-gate-pending')).toContainText('So‘rov yuborilgan');

  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.reload();
  await page.locator('.bo-card-btn').filter({ hasText: 'Kursga ruxsat' }).click();
  await page.getByRole('tab', { name: /Restoran xodimlari/ }).click();
  const sec = page.locator('.bo-course-access.is-paid');
  // narx va to'lov yo'riqnomasi
  await sec.getByLabel(/Kurs narxi/).fill('450 000 so‘m');
  await sec.getByLabel('Qanday to‘lanadi').fill('Click orqali to‘lang.');
  await sec.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.locator('.toast')).toContainText('Saqlandi');
  const row = sec.locator('.bo-list li').filter({ hasText: 'Ofitsiant, «Sharq» restorani' });
  await row.getByRole('button', { name: /^Ruxsat berish:/ }).click();
  await expect(sec).toContainText('Yangi so‘rov yo‘q.');
  await expect(sec.getByRole('button', { name: /^Ruxsatni olish:/ })).toHaveCount(1);

  // talaba endi darsni ochadi
  await as(page, 'demo-student');
  await page.goto('/#course/restoran', { waitUntil: 'domcontentloaded' });
  await page.reload();
  await expect(page.locator('.course-card, .course-gate.is-paid')).toHaveCount(0);
  await page.locator('.lesson-card').filter({ hasText: 'Kasbiy etika' }).click();
  await expect(page.locator('.native-document')).toContainText('KASBIY ETIKA VA XIZMAT SIKLI');

  // asl holatga (boshqa sinovlar uchun): ruxsatni olib qo'yish, narxni tozalash
  await as(page, 'demo-admin');
  const view = await (
    await page.request.get('/api/platform?view=courseAccessAdmin&course=restoran')
  ).json();
  for (const g of view.grants)
    await page.request.post('/api/platform', {
      data: {
        action: 'courseAccessAdmin',
        input: { op: 'revoke', uid: g.uid, course: 'restoran' },
      },
    });
  await page.request.post('/api/platform', {
    data: {
      action: 'courseAccessAdmin',
      input: { op: 'shop', course: 'restoran', price: '', how: '' },
    },
  });
});

test('all 12 sessions are ready in four blocks; new lessons and exam materials open', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#course/restoran', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lesson-card')).toHaveCount(12);
  await expect(page.locator('.course-build-ready')).toContainText('12 ta dars tayyor');
  await expect(page.locator('.course-build-wait')).toHaveCount(0);
  await expect(page.locator('.course-build small')).toContainText('18/20 modul soati');
  // qo'shimcha fanda reyting yorlig'i yo'q (ball va reyting — asosiy fanniki)
  await expect(page.getByRole('tab', { name: 'Reyting' })).toHaveCount(0);
  for (const block of [
    'Xizmat asoslari va mehmon bilan muloqot',
    'Menyu bilan ishlash va xalqaro xizmat amaliyoti',
    'Hisob yuritish va smena amaliyoti',
    'Yakuniy imtihonlar',
  ])
    await expect(page.locator('.filter-row').getByRole('button', { name: block })).toBeVisible();
  await expect(page.locator('.lesson-card.is-draft')).toHaveCount(0);
  await expect(page.locator('.lesson-card').filter({ hasText: 'Yakuniy' })).toHaveCount(2);
  await page.locator('.lesson-card').filter({ hasText: 'Menyu va allergenlar' }).click();
  await expect(page).toHaveURL(/#lesson\/r5$/);
  const doc = page.locator('.native-document');
  await expect(doc).toContainText('MENYU VA ALLERGENLAR BILAN ISHLASH');
  await expect(doc).toContainText('1 soat nazariya · 1 soat amaliyot');
  await expect(page.locator('.reader-heading')).toContainText(
    'Restoran xodimlari malakasini oshirish',
  );
  await expect(page.locator('.reader-heading')).toContainText('5-mavzu / 12');
  // barcha yangi darslarda haqiqiy muqova va ishlaydigan slayd navigatsiyasi
  for (let n = 4; n <= 12; n++) {
    await page.goto('/#lesson/r' + n, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.reader-heading')).toContainText(`${n}-mavzu / 12`);
    await expect(doc.locator('h1')).toBeVisible();
    await expect(page.locator('.lesson-plan-body')).toHaveCount(0);
    const slides = page.locator('.reader-controls').getByRole('combobox');
    await slides.selectOption('1');
    await expect(doc.locator('h2')).toBeVisible();
  }
  // nazariy imtihonda o'tish mezoni va 35 daqiqalik 30 savolli mashq bor
  await page.goto('/#lesson/r11', { waitUntil: 'domcontentloaded' });
  await expect(doc.locator('h1')).toHaveText('YAKUNIY NAZARIY IMTIHON');
  await page.locator('.reader-controls').getByRole('combobox').selectOption('2');
  await expect(doc).toContainText('kamida 28/40');
  await page.locator('.reader-controls').getByRole('combobox').selectOption('23');
  await expect(doc.getByRole('button', { name: /Tayyorgarlik testini boshlash/ })).toContainText(
    '35 daqiqa',
  );
  // amaliy imtihon testsiz: kritik xato va 6 mezonli bayonnoma
  await page.goto('/#lesson/r12', { waitUntil: 'domcontentloaded' });
  await expect(doc.locator('h1')).toHaveText('YAKUNIY AMALIY IMTIHON');
  await page.locator('.reader-controls').getByRole('combobox').selectOption('10');
  await expect(doc).toContainText('Kritik xato');
  await page.locator('.reader-controls').getByRole('combobox').selectOption('12');
  await expect(doc).toContainText('Individual amaliy bayonnoma');
  await expect(doc.locator('#testWrap')).toHaveCount(0);
});

test('new practice answers survive slide changes and do not submit grades or scored attempts', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#lesson/r5', { waitUntil: 'domcontentloaded' });
  const before = await (await page.request.get('/api/platform')).json();
  const mutations: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/api\/platform/.test(r.url()))
      mutations.push(r.postData() || '');
  });
  const doc = page.locator('.native-document');
  await expect(doc.locator('h1')).toHaveText('MENYU VA ALLERGENLAR BILAN ISHLASH');
  await page.locator('.reader-controls').getByRole('combobox').selectOption('16');
  await doc.getByRole('button', { name: /Tayyorgarlik testini boshlash/ }).click();
  await page.locator('.native-dialog').getByRole('button', { name: 'Davom etish' }).click();
  await expect(doc.locator('.qbox')).toHaveCount(15);
  await doc.locator('.qbox').first().locator('.opt').first().click();
  await expect(doc.locator('#answered')).toHaveText('1');
  // Demo guard ataylab iframe xotirasini qayta yuklashda tozalaydi.
  // Brauzer localStorage tiklanishi restoran-practice.test.ts da tekshiriladi.
  await page.locator('.reader-controls').getByRole('combobox').selectOption('15');
  await expect(doc).toContainText('Xulosa va keyingi qadam');
  await page.locator('.reader-controls').getByRole('combobox').selectOption('16');
  await expect(doc.locator('#answered')).toHaveText('1');
  await expect(doc.locator('.qbox').first().locator('.opt:disabled')).toHaveCount(4);
  const after = await (await page.request.get('/api/platform')).json();
  expect(after.user.xp).toEqual(before.user.xp);
  expect(after.user.academicPoints).toEqual(before.user.academicPoints);
  expect(after.progress).toEqual(before.progress);
  expect(mutations.some((body) => /quizAnswer|quizSubmit|award|qBump/.test(body))).toBe(false);
});

test('the administrator opens a restaurant lesson from search and the server accepts enroll', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  // eski (keshdagi) sahifa ham «enroll» yuboradi — server endi rad etmaydi
  const r = await page.request.post('/api/platform', {
    data: { action: 'enroll', input: { courseId: 'restoran' } },
  });
  expect(r.status()).toBe(200);
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('combobox').first();
  await search.fill('Kasbiy etika');
  await page
    .getByRole('option', { name: /Kasbiy etika va xizmat sikli/ })
    .first()
    .click();
  await expect(page).toHaveURL(/#lesson\/r1$/);
  await expect(page.locator('.native-document')).toContainText('KASBIY ETIKA VA XIZMAT SIKLI');
  await expect(page.locator('.toast')).toHaveCount(0);
});
