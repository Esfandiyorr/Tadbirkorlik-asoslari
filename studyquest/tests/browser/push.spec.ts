import { test, expect, type Page } from '@playwright/test';

/* 🔔 Bildirishnomalar: talaba bosh sahifadagi taklifdan yoqadi, qo'ng'iroqcha menyusida holatni ko'radi, sinab ko'radi
   va o'chiradi. Haqiqiy push xizmati (Google) sinovda yo'q — brauzer obunasi taqlid qilinadi (to'g'ri ko'rinishdagi
   kalitlar bilan); server uni qabul qilib saqlaydi va o'qituvchi qurilmalar sonini ko'radi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
const FAKE_PUSH = () => {
  const b64u = (n: number, first?: number) => {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    if (first !== undefined) a[0] = first;
    return btoa(String.fromCharCode(...a))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  const w = window as unknown as { __perm: string; __sub: unknown };
  w.__perm = 'default';
  const sub = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/sinov-' + Math.random().toString(36).slice(2),
    options: { applicationServerKey: null as ArrayBuffer | null },
    toJSON() {
      return { endpoint: this.endpoint, keys: { p256dh: b64u(65, 4), auth: b64u(16) } };
    },
    unsubscribe() {
      w.__sub = null;
      return Promise.resolve(true);
    },
  };
  Object.defineProperty(Notification, 'permission', { configurable: true, get: () => w.__perm });
  Notification.requestPermission = () => {
    w.__perm = 'granted';
    return Promise.resolve('granted' as NotificationPermission);
  };
  PushManager.prototype.getSubscription = function () {
    return Promise.resolve(w.__sub as PushSubscription | null);
  };
  PushManager.prototype.subscribe = function (o?: PushSubscriptionOptionsInit) {
    sub.options.applicationServerKey = (o?.applicationServerKey as ArrayBuffer) || null;
    w.__sub = sub;
    return Promise.resolve(sub as unknown as PushSubscription);
  };
};

test('a student turns notifications on from the home page, tests them and turns them off', async ({
  page,
}) => {
  await page.addInitScript(FAKE_PUSH);
  await as(page, 'demo-student');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const invite = page.locator('.push-invite');
  await expect(invite).toContainText('Jonli testni o‘tkazib yubormang');
  await expect(invite).toContainText('15 daqiqa oldin');
  await invite.getByRole('button', { name: 'Yoqish' }).click();
  await expect(page.getByText('🔔 Yoqildi')).toBeVisible();
  await expect(invite).toHaveCount(0);

  // ochiq kalit — brauzer obunasi shu kalit bilan qilinadi
  const key = (await (await page.request.get('/api/push?view=key')).json()).pub as string;
  expect(Buffer.from(key, 'base64url')).toHaveLength(65);

  // qo'ng'iroqcha menyusi: «Bildirishnomalar yoqilgan», sinov xabari
  await page.getByRole('button', { name: 'Bildirishnomalar' }).first().click();
  const box = page.locator('.notification-menu .push-box');
  await expect(box).toContainText('Bildirishnomalar yoqilgan');
  await box.getByRole('button', { name: /Sinab ko‘rish/ }).click();
  await expect(page.getByText('📲 Sinov xabari yuborildi')).toBeVisible();

  // o'chirish (menyu ochiq turibdi)
  await box.getByRole('button', { name: 'O‘chirish' }).click();
  await expect(box).toContainText('Telefonga bildirishnoma');
  await expect(box.getByRole('button', { name: 'Yoqish' })).toBeVisible();

  // qurilmalar sonini faqat o'qituvchi va administrator ko'radi
  expect((await page.request.get('/api/push?view=stats')).status()).toBe(403);
  await as(page, 'demo-teacher');
  const s = await (await page.request.get('/api/push?view=stats')).json();
  expect(s).toMatchObject({ devices: expect.any(Number), students: expect.any(Number) });
  await as(page, 'demo-student');

  // jonli test eslatmasi tekshiruvi ochiq va xavfsiz: o'yin bo'lmasa hech narsa yuborilmaydi
  const tick = await (await page.request.get('/api/push?view=tick')).json();
  expect(tick).toMatchObject({ ok: true, sent: 0 });
  // noma'lum manzilga obuna qabul qilinmaydi
  const bad = await page.request.post('/api/push', {
    data: {
      op: 'subscribe',
      sub: { endpoint: 'https://evil.example/x', keys: { p256dh: 'a', auth: 'b' } },
    },
  });
  expect(bad.status()).toBe(400);
});

test('the administrator can send an announcement to phones as well', async ({ page }) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  const push = page.getByLabel(/Telefonlarga ham yuborilsin/);
  await expect(push).toBeChecked();
  // katta oyna kerak emas — u keyingi sinovlarda boshqa foydalanuvchilarning ekranini to'sib qo'yadi
  await page.getByRole('checkbox', { name: /katta oynada ko‘rsatish/ }).uncheck();
  await page.getByLabel('E’lon matni').fill('Ertaga jonli test 09:30 da bo‘ladi.');
  await page.getByRole('button', { name: 'E’lon joylash' }).click();
  const list = page.locator('.news-admin-list');
  await expect(list).toContainText('Ertaga jonli test 09:30 da');
  // tozalash
  await list.getByRole('button', { name: /O‘chirish: .*Ertaga jonli test/ }).click();
  await expect(list).not.toContainText('Ertaga jonli test 09:30 da');
});

test('the administrator sends a notification from its own section and controls automatic ones', async ({
  page,
}) => {
  await page.addInitScript(FAKE_PUSH);
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Bildirishnomalar' }).click();
  const sec = page.locator('.bo-push');
  await expect(sec.locator('.bo-status').first()).toContainText('ilovada');
  // o'z qurilmasida yoqadi — «Avval o'zimga» ochiladi
  await sec.locator('.push-box').getByRole('button', { name: 'Yoqish' }).click();
  await expect(sec.locator('.push-box')).toContainText('Bildirishnomalar yoqilgan');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sec.getByLabel('Sarlavha').fill('📢 Ertaga dars 2-binoda');
  await sec.getByLabel('Matn').fill('Soat 9:30 da, 214-xona.');
  await expect(sec.locator('.bo-push-preview')).toContainText('Ertaga dars 2-binoda');
  await sec.getByRole('button', { name: /Avval o‘zimga/ }).click();
  await expect(page.getByText(/🧪 1 ta qurilmaga yetkazildi/)).toBeVisible();
  page.once('dialog', (d) => void d.accept());
  await sec.getByRole('button', { name: /^Yuborish/ }).click();
  await expect(page.getByText(/✅ \d+ ta qurilmaga yetkazildi/)).toBeVisible();
  await sec.getByRole('tab', { name: /Tarix/ }).click();
  await expect(sec.locator('.bo-push-log li').first()).toContainText('Ertaga dars 2-binoda');
  await expect(sec.locator('.bo-push-log li').first()).toContainText('hammaga');

  // avtomatik xabarlar: «Yangi e'lon» o'chirilsa — E'lonlar bo'limida belgi odatda o'chiq
  await sec.getByRole('tab', { name: /Avtomatik/ }).click();
  const news = sec.getByRole('checkbox', { name: /Yangi e’lon/ });
  await expect(news).toBeChecked();
  await expect(sec.getByRole('checkbox', { name: /Jonli test e’loni/ })).toBeChecked();
  await sec.getByLabel('Necha daqiqa oldin').selectOption('30');
  await expect(page.getByText('💾 Saqlandi').first()).toBeVisible();
  await news.uncheck();
  await expect(news).not.toBeChecked();
  await page.locator('.bo-head').getByRole('button', { name: 'Sayt boshqaruvi' }).click();
  await page.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  await expect(page.getByLabel(/Telefonlarga ham yuborilsin/)).not.toBeChecked();
  // asl holiga qaytariladi (boshqa sinovlar uchun)
  const res = await page.request.post('/api/platform', {
    data: {
      action: 'pushAdmin',
      input: {
        op: 'settings',
        auto: { live: true, liveMin: 15, liveNew: true, topics: true, news: true, videos: true },
      },
    },
  });
  expect(res.ok()).toBe(true);
  // talaba bu bo'limni ko'ra olmaydi
  await as(page, 'demo-student');
  expect((await page.request.get('/api/platform?view=pushAdmin')).status()).toBe(403);
});
