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
  expect(mine.messages[0]).toMatchObject({ cat: 'avatar' });
  expect(mine.messages[0].text).toContain('Shrek (Shrek multfilmi)');
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
