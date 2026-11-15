import { test, expect, type Page } from '@playwright/test';

/* 🍽️ Yangi fan — «Restoran xodimlari malakasini oshirish»: hozircha hammaga yopiq. O'qituvchi va administrator
   fanni, mavzularini va 🎬 animatsion videoni (subtitr bilan) ko'radi; talaba fanni umuman ko'rmaydi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}

test('the teacher sees the closed restaurant course, opens a lesson and plays the subtitled video', async ({
  page,
}) => {
  await as(page, 'demo-teacher');
  await page.goto('/#courses', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.course-card').filter({ hasText: 'Restoran xodimlari' });
  await expect(card).toBeVisible();
  await expect(card.locator('.course-closed-chip')).toHaveText('Hammaga yopiq');
  await card.click();
  await expect(page).toHaveURL(/#course\/restoran$/);
  await expect(page.locator('.course-closed-note')).toContainText('talabalar uni ko‘rmaydi');
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

test('students do not see the closed restaurant course and cannot open its lessons', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#courses', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.course-card').first()).toBeVisible();
  // boshqa sinovlar yaratgan demo kurslar bo'lishi mumkin — muhimi: restoran kursi yo'q
  await expect(
    page.locator('.course-card').filter({ hasText: 'Tadbirkorlik asoslari' }),
  ).toHaveCount(1);
  await expect(page.getByText('Restoran xodimlari')).toHaveCount(0);
  // to'g'ridan-to'g'ri havola ham ochmaydi
  await page.goto('/#lesson/r1');
  await page.reload();
  await expect(page.locator('.native-document')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Kurslar' }).first()).toBeVisible();
  const api = await page.request.get('/api/platform?view=legacyLesson&lesson=r1');
  expect(api.status()).toBe(403);
  // bosh ma'lumotda fan ham, mavzusi ham yo'q
  const data = await (await page.request.get('/api/platform')).json();
  expect(data.courses.map((c: { id: string }) => c.id)).not.toContain('restoran');
  expect(data.lessons.some((l: { id: string }) => l.id === 'r1')).toBe(false);
  // asl fayl to'g'ridan-to'g'ri ochilsa — saytga qaytaradi (taqdimot ko'rinmaydi)
  await page.goto('/legacy/restoran-1.html');
  await expect(page).toHaveURL(/#lesson\/r1$/);
  await expect(page.locator('.native-document')).toHaveCount(0);
});

test('the whole course is laid out: 12 sessions in 4 blocks, unfinished ones show their plan', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#course/restoran', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.lesson-card')).toHaveCount(12);
  await expect(page.locator('.course-build-ready')).toContainText('3 ta dars tayyor');
  await expect(page.locator('.course-build-wait')).toContainText('9 tasi tayyorlanmoqda');
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
  await expect(page.locator('.lesson-card.is-draft')).toHaveCount(9);
  await expect(page.locator('.lesson-card.is-exam')).toHaveCount(2);
  // tayyorlanayotgan dars — o'quv dasturidagi reja
  await page.locator('.lesson-card').filter({ hasText: 'Menyu va allergenlar' }).click();
  await expect(page).toHaveURL(/#lesson\/r5$/);
  const plan = page.locator('.lesson-plan-body');
  await expect(plan).toContainText('Tayyorlanmoqda');
  await expect(plan).toContainText('1 soat nazariya · 1 soat amaliyot');
  await expect(plan).toContainText('Yong‘oqqa allergiyasi bor mehmon');
  await expect(page.locator('.reader-heading')).toContainText(
    'Restoran xodimlari malakasini oshirish',
  );
  await expect(page.locator('.reader-heading')).toContainText('5-mavzu / 12');
  // imtihon — shartlari va o'tish bali
  await page.goto('/#lesson/r11', { waitUntil: 'domcontentloaded' });
  await expect(plan).toContainText('Yakuniy imtihon');
  await expect(plan).toContainText('30 ta test savoli');
  await expect(plan).toContainText('kamida 28/40 ball');
  await page.getByRole('button', { name: 'Kursga qaytish' }).click();
  await expect(page).toHaveURL(/#course\/restoran$/);
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
