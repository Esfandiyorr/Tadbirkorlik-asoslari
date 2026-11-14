import { test, expect, type Page } from '@playwright/test';

/* 🎭 Avatarlar: top-10 talaba bosh sahifadagi kartochka yoki reytingdagi o'z qatori orqali kutubxonani ochib
   qahramon tanlaydi; band avatarni boshqa talaba ololmaydi; talaba yangi avatar taklif qiladi;
   administrator ruxsat beradi va avatarni bo'shatadi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
async function reset(page: Page) {
  await as(page, 'demo-student');
  await page.request.post('/api/platform', {
    data: { action: 'avatarPick', input: { avatar: null } },
  });
}

test('a top-ten student picks an avatar from the home card and sees it in the ranking', async ({
  page,
}) => {
  await reset(page);
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.hero-avatar');
  await expect(card).toContainText('Avatar tanlang');
  await expect(card.locator('svg.av-empty')).toBeVisible();
  await card.click();
  const dialog = page.getByRole('dialog', { name: /Avatarlar kutubxonasi/ });
  await expect(dialog).toContainText('1-o‘rindasiz');
  await expect(dialog.locator('.av-card')).toHaveCount(10);
  await expect(dialog.locator('.av-card img')).toHaveCount(10);
  await dialog.getByRole('button', { name: /Mario — tanlash/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.toast')).toContainText('Mario');
  // Avatar tanlangach kartochkada yozuv yo'q — faqat qahramon; bosilsa almashtiriladi.
  await expect(card).toHaveAttribute('aria-label', /Mario — almashtirish/);
  await expect(card.locator('.hero-avatar-label')).toHaveCount(0);
  await expect(card.locator('img')).toHaveAttribute('src', '/avatars/mario.webp');

  await page.goto('/#ranking', { waitUntil: 'domcontentloaded' });
  const mine = page.locator('.rk-list > li[aria-current="true"]');
  await expect(mine.locator('.rk-slot img')).toHaveAttribute('src', '/avatars/mario.webp');
  await expect(page.locator('.rk-mine-avatar img')).toHaveAttribute('src', '/avatars/mario.webp');
  // O'z qatoridagi avatar — kutubxona tugmasi; almashtirsa eskisi bo'shaydi.
  await mine.getByRole('button', { name: 'Avatarlar kutubxonasi' }).click();
  await expect(dialog.locator('.av-card.is-mine')).toContainText('Mario');
  await dialog.getByRole('button', { name: /Quvonch — tanlash/ }).click();
  await expect(mine.locator('.rk-slot img')).toHaveAttribute('src', '/avatars/joy.webp');
  await page.locator('.rk-mine-avatar').click();
  await dialog.getByRole('button', { name: 'Avatarni olib tashlash' }).click();
  await expect(page.locator('.rk-mine-avatar svg.av-empty')).toBeVisible();
});

test('taken avatars are locked, places 11+ only browse, and students can suggest a new avatar', async ({
  page,
}) => {
  await reset(page);
  const rows = Array.from({ length: 12 }, (_, i) => ({
    id: i === 10 ? 'demo-student' : 'x' + i,
    name: i === 10 ? 'Madina Ergasheva' : 'Talaba ' + (i + 1),
    classId: 'AP-223',
    academicPoints: 600 - i * 20,
    today: 0,
    ...(i === 0 ? { avatar: 'sonic' } : {}),
  }));
  await page.route('**/api/platform?view=academic', (route) =>
    route.fulfill({
      json: {
        leaderboard: rows,
        avatars: {
          owners: { sonic: 'x0' },
          me: { place: 11, top: false, allowed: false, can: false, avatar: null },
        },
      },
    }),
  );
  await page.goto('/#ranking', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.rk-list > li').first().locator('.rk-slot img')).toHaveAttribute(
    'src',
    '/avatars/sonic.webp',
  );
  await page.locator('.rk-mine-avatar').click();
  const dialog = page.getByRole('dialog', { name: /Avatarlar kutubxonasi/ });
  await expect(dialog).toContainText('1–10-o‘rinlaridagi');
  await expect(dialog).toContainText('Siz hozir 11-o‘rindasiz');
  await expect(dialog.locator('.av-card.is-taken')).toContainText('Band · Talaba 1');
  await expect(dialog.locator('.av-card.is-locked')).toHaveCount(9);
  await expect(dialog.locator('.av-card button:not([disabled])')).toHaveCount(0);
  // Yangi avatar taklifi administratorga «Adminga xabar» orqali boradi.
  await dialog.getByLabel('Qahramon nomi').fill('Shrek (Shrek multfilmi)');
  await dialog.getByLabel('Izoh').fill('Hamma yaxshi ko‘radi');
  await dialog.getByRole('button', { name: /Taklif yuborish/ }).click();
  await expect(dialog.locator('.av-sent')).toBeVisible();
  const mine = await (await page.request.get('/api/support')).json();
  const idea = mine.messages.find((m: { cat: string }) => m.cat === 'avatar');
  expect(idea.text).toContain('Shrek (Shrek multfilmi)');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('the administrator allows students and frees avatars', async ({ page }) => {
  await reset(page);
  await page.request.post('/api/platform', {
    data: { action: 'avatarPick', input: { avatar: 'po' } },
  });
  await as(page, 'demo-admin');
  // «Boshqaruv» → 🛠 Sayt boshqaruvi → «🎭 Avatarlar» kartochkasi
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Avatarlar' }).click();
  const panel = page.locator('.avatar-admin');
  const po = panel.locator('.avatar-admin-grid li').filter({ hasText: 'Po' });
  await expect(po).toContainText('Madina Ergasheva');
  await expect(po).toContainText('1-o‘rin');
  await panel.getByLabel('Talabani qidirish').fill('Madina');
  await expect(panel.locator('.avatar-admin-allow')).toContainText('top-10 — ruxsat shart emas');
  await po.getByRole('button', { name: /Bo‘shatish/ }).click();
  await expect(po).toContainText('Bo‘sh');
});

test('places 11+ see why the avatar was freed and the ways to get one: Premium or buying it', async ({
  page,
}) => {
  await reset(page);
  const now = Date.now();
  const rows = Array.from({ length: 12 }, (_, i) => ({
    id: i === 10 ? 'demo-student' : 'x' + i,
    name: i === 10 ? 'Madina Ergasheva' : 'Talaba ' + (i + 1),
    classId: 'AP-223',
    academicPoints: 600 - i * 20,
    today: 0,
  }));
  const shop = { on: true, price: '10 000 so‘m', days: 30, how: 'Click orqali 8600 … kartaga.' };
  const state = (order: number | null) => ({
    leaderboard: rows,
    avatars: {
      owners: {},
      shop,
      me: {
        place: 11,
        top: false,
        allowed: false,
        can: false,
        avatar: null,
        lost: { a: 'po', at: now - 3600000 },
        order,
        canBuy: true,
      },
    },
  });
  const sent: unknown[] = [];
  await page.route('**/api/platform?view=academic', (route) =>
    route.fulfill({ json: state(null) }),
  );
  await page.route('**/api/platform', async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().method() !== 'POST' || body?.action !== 'avatarOrder')
      return route.continue();
    sent.push(body.input);
    await route.fulfill({ json: state(body.input.op === 'order' ? Date.now() : null) });
  });
  await page.goto('/#ranking', { waitUntil: 'domcontentloaded' });
  await page.locator('.rk-mine-avatar').click();
  const dialog = page.getByRole('dialog', { name: /Avatarlar kutubxonasi/ });
  await expect(dialog.locator('.av-lost')).toContainText('«Po» avatari bo‘shatildi');
  const ways = dialog.locator('.av-ways');
  await expect(ways).toContainText('hozir 11-o‘rindasiz');
  await expect(ways).toContainText('10 000 so‘m · 30 kunga');
  // 💎 obuna oynasida avatar ham sanaladi
  await ways.getByRole('button', { name: 'Obuna', exact: true }).click();
  const offer = page.getByRole('dialog', { name: /Obuna bilan/ });
  await expect(offer).toContainText('Avatar — top-10 ga kirmasangiz ham');
  await offer.getByRole('button', { name: 'Keyinroq' }).click();
  // 💳 sotib olish: yo'riqnoma → «To'lov qildim» so'rovi → kutilmoqda → bekor qilish
  await ways.getByRole('button', { name: 'Sotib olish' }).click();
  await expect(ways.locator('.av-buy')).toContainText('Click orqali 8600');
  await ways.getByLabel(/Izoh/).fill('Chek №123');
  await ways.getByRole('button', { name: /To‘lov qildim/ }).click();
  await expect(ways.locator('.av-buy.is-pending')).toContainText('So‘rovingiz yuborilgan');
  await ways.getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(ways.getByRole('button', { name: 'Sotib olish' })).toBeVisible();
  expect(sent).toEqual([{ op: 'order', note: 'Chek №123' }, { op: 'cancel' }]);
  await page.keyboard.press('Escape');
  // bosh sahifa kartochkasida ham: avatar bo'shatildi
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-avatar')).toContainText('Avatar bo‘shatildi');
  // Play Market ilovasida sotib olish (tashqi to'lov) ko'rsatilmaydi
  await page.goto('/?src=play#ranking', { waitUntil: 'domcontentloaded' });
  await page.locator('.rk-mine-avatar').click();
  await expect(dialog.locator('.av-ways')).toContainText('Obuna bo‘ling');
  await expect(dialog.getByRole('button', { name: 'Sotib olish' })).toHaveCount(0);
});

test('the administrator sets the avatar price and manages bought passes', async ({ page }) => {
  await reset(page);
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Avatarlar' }).click();
  const shop = page.locator('.avatar-admin-shop');
  await expect(shop).toContainText('Yangi so‘rov yo‘q.');
  await shop.getByLabel('Narx (talabaga ko‘rinadi)').fill('10 000 so‘m');
  await shop.locator('.avatar-admin-shopform select').selectOption('14');
  await shop.getByLabel('Qanday to‘lanadi').fill('Click orqali to‘lang.');
  await shop.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.locator('.toast')).toContainText('Saqlandi');
  // sotib olingan muddat (to'lov tasdiqlangandek) — ro'yxatda chiqadi va olib tashlanadi
  const r = await page.request.post('/api/platform', {
    data: { action: 'avatarAdmin', input: { op: 'grantPass', student: 'demo-student', days: 14 } },
  });
  expect(r.ok()).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const passes = page.locator('.avatar-admin-shop');
  await expect(passes).toContainText('Sotib olganlar');
  await expect(passes.getByLabel('Narx (talabaga ko‘rinadi)')).toHaveValue('10 000 so‘m');
  await expect(passes.locator('.avatar-admin-shopform select')).toHaveValue('14');
  await passes.getByRole('button', { name: 'Muddatni olib tashlash: Madina Ergasheva' }).click();
  await expect(passes).not.toContainText('Sotib olganlar');
  // asl holatga qaytarish (boshqa sinovlar uchun)
  await page.request.post('/api/platform', {
    data: { action: 'avatarAdmin', input: { op: 'shop', on: true, price: '', days: 30, how: '' } },
  });
});
