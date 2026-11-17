import { test, expect, type APIRequestContext } from '@playwright/test';
const videoId = 'ABcdEFghI_1'; // Faqat sinov pleyeri; YouTube'ga haqiqiy so'rov yuborilmaydi.
const as = (request: APIRequestContext, id: string) =>
  request.post('/api/auth/demo', { data: { id } });
test.afterEach(async ({ request }) => {
  await as(request, 'demo-admin');
  const { topics } = await (await request.get('/api/platform?view=videos')).json();
  for (const topic of topics || [])
    for (const v of topic.videos)
      if (v.id === videoId)
        await request.post('/api/platform', {
          data: { action: 'videos', input: { op: 'remove', t: topic.id, key: v.key } },
        });
});

test('administrator chooses the restaurant course and its YouTube player opens only on demand', async ({
  page,
}) => {
  await page.route(/youtube(-nocookie)?\.com|ytimg\.com/, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Isolated test player</p>' }),
  );
  await as(page.request, 'demo-admin');
  await page.goto('/#admin');
  await page.locator('.bo-card-btn').filter({ hasText: 'Mavzu videolari' }).click();
  await expect(page.locator('.bo-topics li')).toHaveCount(15);
  await page.getByLabel('Video kursi', { exact: true }).selectOption('restoran');
  await expect(page.locator('.bo-topics li')).toHaveCount(12);
  await page.locator('.bo-topic').filter({ hasText: 'R4 ·' }).click();
  const form = page.locator('.video-admin');
  await form
    .getByLabel('YouTube havolasi', { exact: true })
    .fill('https://youtu.be/' + videoId + '?t=12');
  await form.getByLabel('Video nomi', { exact: true }).fill('R4 — Muloqot mashqi');
  await form.getByRole('button', { name: 'Mavzuga qo‘shish', exact: true }).click();
  await expect(form.locator('.video-admin-list')).toContainText('R4 — Muloqot mashqi');
  await page.goto('/#lesson/r4');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  await expect(page.locator('.topic-video-frame iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Video', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: /R4 — Muloqot mashqi/ });
  await expect(dialog.locator('iframe')).toHaveAttribute(
    'src',
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&start=12&cc_load_policy=1&cc_lang_pref=uz`,
  );
  await expect(dialog.getByRole('link', { name: /YouTube’da ochish/ })).toHaveAttribute(
    'href',
    `https://www.youtube.com/watch?v=${videoId}&t=12s`,
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('paid video URLs stay private for guests and students without restaurant access', async ({
  request,
}) => {
  await as(request, 'demo-admin');
  const before = await (await request.get('/api/platform')).json();
  await request.post('/api/platform', {
    data: { action: 'videos', input: { op: 'add', t: 'r5', url: 'https://youtu.be/' + videoId } },
  });
  await request.delete('/api/auth/demo');
  expect((await request.get('/api/site/video?t=r5')).status()).toBe(401);
  await as(request, 'demo-student');
  const denied = await request.get('/api/site/video?t=r5');
  expect(denied.status()).toBe(403);
  expect(denied.headers()['cache-control']).toBe('private, no-store');
  expect(await denied.text()).not.toContain(videoId);
  expect(await (await request.get('/api/site/quiz?t=r5')).text()).not.toContain(videoId);
  await as(request, 'demo-admin');
  const allowed = await request.get('/api/site/video?t=r5');
  expect(allowed.ok()).toBe(true);
  expect(allowed.headers()['cache-control']).toBe('private, no-store');
  const after = await (await request.get('/api/platform')).json();
  expect(after.user.academicPoints).toEqual(before.user.academicPoints);
  expect(after.user.readingHistory).toEqual(before.user.readingHistory);
});

test('a configured YouTube video takes priority; the original MP4 remains the fallback', async ({
  page,
}) => {
  await page.route(/youtube(-nocookie)?\.com|ytimg\.com/, (route) => route.fulfill({ body: '' }));
  await as(page.request, 'demo-admin');
  await page.request.post('/api/platform', {
    data: { action: 'videos', input: { op: 'add', t: 'r1', url: 'https://youtu.be/' + videoId } },
  });
  await page.goto('/#lesson/r1');
  await expect(page.getByRole('button', { name: 'Video', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Animatsion video', exact: true })).toHaveCount(0);
  const { videos } = await (await page.request.get('/api/site/video?t=r1')).json();
  await page.request.post('/api/platform', {
    data: { action: 'videos', input: { op: 'remove', t: 'r1', key: videos[0].key } },
  });
  await page.reload();
  await page.getByRole('button', { name: 'Animatsion video', exact: true }).click();
  await expect(page.locator('.topic-video video')).toHaveAttribute(
    'src',
    '/legacy/fayllar/video/R1.mp4',
  );
  await expect(page.locator('.topic-video video track')).toHaveAttribute(
    'src',
    '/legacy/fayllar/video/R1.vtt',
  );
});
