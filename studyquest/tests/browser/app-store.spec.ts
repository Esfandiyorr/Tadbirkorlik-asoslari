import { test, expect, type Page } from '@playwright/test';

/* 📱 Play Market talablari: ochiq maxfiylik siyosati va hisobni o'chirish sahifalari, ilova imzosi (assetlinks.json),
   profilidan hisobni o'chirishni so'rash va administratorning javobi, chatda shikoyat qilish. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
const SHA =
  '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5';

test('the privacy policy and the deletion guide open without signing in, in three languages', async ({
  page,
}) => {
  await page.goto('/privacy', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Maxfiylik siyosati');
  await expect(page.locator('.legal-doc')).toContainText('Qanday ma’lumot yig‘iladi');
  await expect(page.locator('.legal-doc')).toContainText('Google Firebase');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy');
  await page.getByRole('link', { name: 'Delete account' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Delete your account and data');
  await page.getByRole('link', { name: 'Русский' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Удаление аккаунта и данных');
  // telefon kengligida gorizontal aylantirish yo'q
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto('/privacy?lang=uz', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  // kirish oynasidan havola
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.auth-legal a')).toHaveAttribute('href', /^\/privacy\?lang=/);
});

test('the administrator fills in the app details and the site publishes asset links', async ({
  page,
}) => {
  expect(await (await page.request.get('/.well-known/assetlinks.json')).json()).toEqual([]);
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Ilova (Play Market)' }).click();
  const sec = page.locator('.bo-app');
  await expect(sec.locator('.bo-app-steps li.is-todo')).toHaveCount(2);
  await sec.getByLabel('Operator (kim javobgar)').fill('Sinov Operatori');
  await sec.getByLabel('Murojaat uchun email').fill('aloqa@example.uz');
  await sec.getByLabel('Paket nomi (Package name)').fill('uz.terdu.tadbirkorlik');
  await sec.getByLabel(/SHA-256 izlari/).fill(SHA.toLowerCase());
  await sec.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.getByText('💾 Saqlandi')).toBeVisible();
  await expect(sec.locator('.bo-app-steps li.is-ok')).toHaveCount(3);
  await expect(sec.locator('.bo-app-links')).toContainText('/.well-known/assetlinks.json');
  const links = await (await page.request.get('/.well-known/assetlinks.json')).json();
  expect(links[0].target).toEqual({
    namespace: 'android_app',
    package_name: 'uz.terdu.tadbirkorlik',
    sha256_cert_fingerprints: [SHA],
  });
  await page.goto('/privacy', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.legal-doc')).toContainText('Sinov Operatori');
  await expect(page.locator('.legal-doc')).toContainText('aloqa@example.uz');
  // tozalash
  const r = await page.request.post('/api/platform', {
    data: { action: 'appAdmin', input: { op: 'save', operator: '', email: '', pkg: '', sha: [] } },
  });
  expect(r.ok()).toBe(true);
});

test('a student asks to delete the account from the profile and the administrator answers', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#profile', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.account-delete');
  await card.getByRole('button', { name: 'Hisobni o‘chirish' }).click();
  const ask = card.getByRole('button', { name: 'O‘chirishni so‘rash' });
  await expect(ask).toBeDisabled(); // belgilamaguncha yuborilmaydi
  await card.getByLabel('Sabab (ixtiyoriy)').fill('Sinov uchun');
  await card.getByLabel(/Tushundim/).check();
  await ask.click();
  await expect(card.locator('.account-delete-pending')).toContainText(
    'O‘chirish so‘rovi yuborilgan',
  );

  // administrator so'rovni ko'radi va rad etadi (demo hisob o'chmasin)
  const admin = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(admin, 'demo-admin');
  await admin.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await admin.locator('.bo-card-btn').filter({ hasText: 'Ilova (Play Market)' }).click();
  const req = admin.locator('.bo-app-requests li');
  await expect(req).toHaveCount(1);
  await expect(req).toContainText('Sinov uchun');
  await req.getByRole('button', { name: 'Rad etish' }).click();
  await expect(admin.locator('.bo-app-requests li')).toHaveCount(0);
  await admin.context().close();

  // talaba yana so'raydi va o'zi bekor qiladi
  await page.reload({ waitUntil: 'domcontentloaded' });
  await card.getByRole('button', { name: 'Hisobni o‘chirish' }).click();
  await card.getByLabel(/Tushundim/).check();
  await card.getByRole('button', { name: 'O‘chirishni so‘rash' }).click();
  await card.getByRole('button', { name: 'So‘rovni bekor qilish' }).click();
  await expect(card.getByRole('button', { name: 'Hisobni o‘chirish' })).toBeVisible();
  // administratorning o'zida bu bo'lim yo'q
  await as(page, 'demo-admin');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.profile-card').first()).toBeVisible();
  await expect(page.locator('.profile-hero')).toContainText('Administrator');
  await expect(page.locator('.account-delete')).toHaveCount(0);
});

test('a student reports a chat message and the administrator sees it in the inbox', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.goto('/#chat', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Shikoyat qilish/ }).click();
  const form = page.locator('.chat-report');
  await form.getByLabel('Kimning xabari?').fill('Sardor Aliyev');
  await form.getByLabel('Sabab').selectOption('spam');
  await form.getByLabel('Izoh (ixtiyoriy)').fill('Chatga reklama havolasi tashladi');
  await form.getByRole('button', { name: 'Yuborish' }).click();
  await expect(page.getByText(/Shikoyat yuborildi/)).toBeVisible();
  await as(page, 'demo-admin');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.goto('/#chat/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main').first()).toContainText('SHIKOYAT');
});
