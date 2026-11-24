import { test, expect } from '@playwright/test';

/* 🎬 Tadbirkorlik asoslari · 10-mavzu: yangilangan taqdimot (21 slayd) va animatsion video — taqdimotdagi
   «🎬 Video dars» slaydida ham, dars oynasidagi «Animatsion video» tugmasida ham. */
test('topic 10: the reworked presentation and its subtitled video play inside the site', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  await page.goto('/#lesson/m10', { waitUntil: 'domcontentloaded' });
  const doc = page.locator('.native-document');
  await expect(doc).toContainText('SAVDO JARAYONINI TASHKIL ETISH');
  const slides = page.locator('.reader-controls').getByRole('combobox');
  await expect(slides.locator('option')).toHaveCount(21);
  // yangi slaydlar: sodda lug'at va to'liq suhbat namunasi
  await slides.selectOption('2');
  await expect(doc).toContainText('Yangi so');
  await expect(doc).toContainText('Qiziqish bildirgan, lekin hali sotib olmagan odam');
  await slides.selectOption('11');
  await expect(doc).toContainText('Nilufar va Dilnoza');
  // 18-slayd: video (manzillar /legacy ichidan, subtitr bilan)
  await slides.selectOption('17');
  const video = doc.locator('figure.sq-film video');
  await expect(video).toHaveAttribute('src', /\/legacy\/fayllar\/video\/M10\.mp4$/);
  await expect(video).toHaveAttribute('poster', /\/legacy\/fayllar\/video\/M10\.jpg$/);
  await expect(doc.locator('figure.sq-film figcaption')).toContainText('O‘zbekcha ovoz va subtitr');
  await expect(video.locator('track')).toHaveAttribute(
    'src',
    /\/legacy\/fayllar\/video\/M10\.vtt$/,
  );

  // dars oynasi tepasidagi tugma — sayt ichidagi pleyer
  await page.getByRole('button', { name: 'Animatsion video' }).click();
  const modal = page.getByRole('dialog', { name: /Savdo jarayonini tashkil etish/ });
  const player = modal.locator('video');
  await expect(player).toHaveAttribute('src', '/legacy/fayllar/video/M10.mp4');
  await expect(player.locator('track')).toHaveAttribute('srclang', 'uz');
  await expect
    .poll(() => player.evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 20000 })
    .toBeGreaterThanOrEqual(1);
  const seconds = await player.evaluate((v: HTMLVideoElement) => v.duration);
  expect(seconds).toBeGreaterThan(200);
  expect(seconds).toBeLessThan(400);
  expect(await player.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
  await expect(modal.locator('.topic-film-note')).toContainText(/Subtitr ko‘rinmasa/);
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  // test slaydi: 15 ta savol avvalgidek
  await slides.selectOption('20');
  await expect(doc).toContainText('15 ta savol');
  const vtt = await page.request.get('/legacy/fayllar/video/M10.vtt');
  expect(vtt.status()).toBe(200);
  expect(await vtt.text()).toContain('Shirin kun');

  // «📥 PDF» — taqdimotning PDF nusxasi
  await page.getByRole('button', { name: 'Mening ballim', exact: true }).click();
  await expect(
    page.locator('.reader-details').getByRole('link', { name: 'PDF', exact: true }),
  ).toHaveAttribute('href', '/legacy/fayllar/M10-mavzu.pdf');
  const pdf = await page.request.get('/legacy/fayllar/M10-mavzu.pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
});
