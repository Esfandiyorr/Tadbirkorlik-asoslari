import { test, expect, type Page } from '@playwright/test';

/* 🔑 Ro'yxatdan o'tish «Talabamisiz?» savolidan boshlanadi; talaba bo'lmaganlar kurs darslarini faqat 💎 obuna yoki
   administrator ruxsati bilan ochadi. Demo muhitda faqat talaba/o'qituvchi/administrator hisoblari bor, shuning
   uchun «talaba bo'lmagan» holat server javobini o'zgartirib ko'rsatiladi (server qoidasi — unit testlarda). */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
const noScroll = (page: Page) =>
  expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(0);

test('registration first asks whether you are a TerSU student', async ({ page }) => {
  await page.route('**/api/platform', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const state = await response.json();
    state.mode = 'legacy';
    delete state.user;
    await route.fulfill({ response, json: state });
  });
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto('/#login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Talabamisiz?' })).toBeVisible();
  await expect(page.locator('.native-login')).toHaveCount(0);
  await noScroll(page);
  // talaba emas → email / Google bilan oddiy ro'yxatdan o'tish
  await page.getByRole('button', { name: /Yo‘q, talaba emasman/ }).click();
  await expect(page.getByRole('button', { name: 'Ro‘yxatdan o‘tish' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Ism va familiya')).toBeVisible();
  await expect(page.locator('.auth-kind-note')).toContainText('obunachilarga');
  await expect(page.locator('.auth-google')).toBeVisible();
  // orqaga → talaba bo'limi: guruh bilan kirish/ro'yxatdan o'tish (asl talaba oynasi)
  await page.locator('.auth-kind-back').click();
  await page.getByRole('button', { name: /Ha, TerDU talabasiman/ }).click();
  await expect(page.locator('.native-login')).toBeVisible();
  await expect(page.locator('.auth-google')).toHaveCount(0);
  await noScroll(page);
  // tanlov eslab qolinadi; talaba bo'limidan email yo'liga o'tish mumkin
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.native-login')).toBeVisible();
  await page.getByRole('button', { name: /Talaba emasmisiz/ }).click();
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('a non-student without Premium sees the subscription offer instead of lessons', async ({
  page,
}) => {
  await as(page, 'demo-student');
  const asked: unknown[] = [];
  await page.route('**/api/platform', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      if (body?.action !== 'courseRequest') return route.continue();
      asked.push(body.input);
      return route.fulfill({
        json:
          body.input.op === 'cancel'
            ? { ok: false, pending: null }
            : { ok: false, pending: Date.now() },
      });
    }
    const response = await route.fetch();
    const state = await response.json();
    if (state.user) {
      state.user.learnerType = 'independent';
      state.course = { ok: false, pending: null };
      state.lessonAccess = Object.fromEntries(
        state.lessons.map((l: { id: string }) => [l.id, { state: 'locked' }]),
      );
    }
    await route.fulfill({ response, json: state });
  });
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.course-gate')).toBeVisible();
  await page.goto('/#courses', { waitUntil: 'domcontentloaded' });
  await page.locator('.course-card').first().click();
  const gate = page.locator('.course-gate');
  await expect(gate.getByRole('heading')).toHaveText('Kurs darslari obunachilar uchun');
  await expect(page.locator('.lesson-grid')).toBeVisible();
  // 💎 obuna oynasida kurs darslari ham sanaladi
  await gate.getByRole('button', { name: 'Obuna bo‘lish' }).click();
  const offer = page.getByRole('dialog');
  await expect(offer).toContainText('kursining barcha ochiq darslari');
  await offer.getByRole('button', { name: 'Keyinroq' }).click();
  await expect(offer).toHaveCount(0);
  // 🙋 ruxsat so'rash (izoh bilan) va bekor qilish
  await gate.getByRole('button', { name: 'Ruxsat so‘rash' }).click();
  await gate.getByLabel(/Izoh/).fill('Iqtisodiyot fakulteti, 2-kurs');
  await gate.getByRole('button', { name: 'So‘rov yuborish' }).click();
  await expect(gate.locator('.course-gate-pending')).toContainText('Ruxsat so‘ralgan');
  expect(asked).toEqual([{ op: 'request', note: 'Iqtisodiyot fakulteti, 2-kurs' }]);
  await gate.getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(gate.getByRole('button', { name: 'Ruxsat so‘rash' })).toBeVisible();
  expect(asked).toHaveLength(2);
  // dars sahifasi ochilmaydi — o'rniga shu oyna
  await page.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.course-gate-page .course-gate')).toBeVisible();
  await expect(page.locator('.native-viewer')).toHaveCount(0);
  await page.setViewportSize({ width: 360, height: 760 });
  await noScroll(page);
});

test('the administrator approves access requests and can open the course to everyone', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Kursga ruxsat' }).click();
  const sec = page.locator('.bo-course-access');
  const pill = sec.locator('.bo-status .bo-pill');
  await expect(pill).toContainText('Yoqilgan');
  await expect(sec).toContainText('Yangi so‘rov yo‘q.');
  // demo rejimida email bo'yicha qidiruv yo'q
  await expect(sec.getByLabel('Email')).toBeDisabled();
  await sec.getByRole('button', { name: '🟢 Vaqtincha hammaga ochish' }).click();
  await expect(pill).toContainText('Hammaga ochiq');
  await sec.getByRole('button', { name: '🔒 Faqat obuna/ruxsat bilan' }).click();
  await expect(pill).toContainText('Yoqilgan');

  // so'rovlar ro'yxati (talaba bo'lmagan foydalanuvchi so'ragan holat)
  const at = Date.now() - 3600000;
  const request = { uid: 'uidX', name: 'Dilnoza Karimova', email: 'dilnoza@example.com', at };
  const view = (grants: unknown[], requests: unknown[]) => ({
    gate: { off: false },
    grants,
    requests,
    email: false,
  });
  const sent: unknown[] = [];
  await page.route('**/api/platform?view=courseAccessAdmin', (route) =>
    route.fulfill({ json: view([], [{ ...request, note: 'Iqtisodiyot, 2-kurs' }]) }),
  );
  await page.route('**/api/platform', async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().method() !== 'POST' || body?.action !== 'courseAccessAdmin')
      return route.continue();
    sent.push(body.input);
    await route.fulfill({ json: view([{ ...request, at: Date.now(), by: 'demo-admin' }], []) });
  });
  await page.getByRole('button', { name: 'Sayt boshqaruvi', exact: true }).click();
  await page.locator('.bo-card-btn').filter({ hasText: 'Kursga ruxsat' }).click();
  const row = sec.locator('.bo-list li').filter({ hasText: 'Dilnoza Karimova' });
  await expect(row).toContainText('dilnoza@example.com');
  await expect(row).toContainText('💬 Iqtisodiyot, 2-kurs');
  await row.getByRole('button', { name: 'Ruxsat berish: Dilnoza Karimova' }).click();
  await expect(sec).toContainText('Yangi so‘rov yo‘q.');
  await expect(sec.getByRole('button', { name: 'Ruxsatni olish: Dilnoza Karimova' })).toBeVisible();
  expect(sent).toEqual([{ op: 'approve', uid: 'uidX' }]);
});
