import { test, expect, type Page } from '@playwright/test';

/* 👥 «Talabalar bilan ishlash»: guruh yoki bitta talaba bilan ishlashning yagona joyi. */
const as = (page: Page, id: string) => page.request.post('/api/auth/demo', { data: { id } });
const limits = (page: Page, input: Record<string, unknown>) =>
  page.request.post('/api/platform', { data: { action: 'studentLimits', input } });

test('a group gets “reading only”: the student keeps only the presentations, without points', async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  await as(page, 'demo-admin');
  await limits(page, { op: 'clear', scope: 'g', key: 'AP-223' });
  await limits(page, { op: 'clear', scope: 'u', key: 'demo-student' });
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '👥 Talabalar bilan ishlash', exact: true }).click();
  const hub = page.locator('.students-hub');
  await expect(hub.getByRole('heading', { name: /Talabalar bilan ishlash/ })).toBeVisible();
  await expect(hub.locator('.hub-pick select')).toHaveValue('AP-223');
  // 🎚 Bo'limlar: «Faqat taqdimotlarni o'qish» → saqlash
  await hub.getByRole('button', { name: /Faqat taqdimotlarni o‘qish/ }).click();
  const arena = hub.locator('.hub-features li').filter({ hasText: 'Arena' });
  await expect(arena.getByRole('switch')).not.toBeChecked();
  await expect(
    hub.locator('.hub-features li').filter({ hasText: 'Taqdimotlarni o‘qish' }).getByRole('switch'),
  ).toBeChecked();
  await hub.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.locator('.toast')).toContainText('Guruh bo‘limlari saqlandi');

  const student = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(student, 'demo-student');
  const data = await (await student.request.get('/api/platform')).json();
  expect(data.user.closed).toEqual(expect.arrayContaining(['tests', 'arena', 'live', 'library']));
  expect(data.user.closed).not.toContain('lessons');
  expect(
    Object.values(data.lessonAccess as Record<string, { state: string }>).some(
      (a) => a.state === 'score',
    ),
  ).toBe(false);
  // menyu: yopilgan bo'limlar ko'rinmaydi; havola bilan ochilsa — «yopilgan»
  await student.setViewportSize({ width: 1280, height: 860 });
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  const nav = student.locator('.sidebar nav');
  await expect(nav).toContainText('Kurslar');
  await expect(nav).not.toContainText('O‘yin maydoni');
  await expect(nav).not.toContainText('Kutubxona');
  await student.goto('/#arena', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.feature-closed')).toContainText('siz uchun yopilgan');
  await student.goto('/#library', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('.feature-closed')).toContainText('Kutubxona');
  // server ham ochmaydi: jonli test, kutubxona, obuna
  expect((await student.request.post('/api/live', { data: {} })).status()).toBe(403);
  expect((await student.request.get('/api/platform?view=library')).status()).toBe(403);
  expect(
    (await student.request.post('/api/premium', { data: { op: 'subscribe', days: 30 } })).status(),
  ).toBe(403);
  // taqdimot ochiladi, lekin 📖 o'qish rejimida (ball berilmaydi)
  await student.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  await expect(student.locator('iframe.native-engine, iframe').first()).toHaveAttribute(
    'src',
    /sqRead=1/,
  );

  // 👤 bitta talabaga guruhdan farqli: Arena ochiq
  await hub.getByRole('button', { name: /Talaba bilan/ }).click();
  await hub.getByLabel('Talabani qidirish').fill('Madina');
  const row = hub.locator('.hub-table tbody tr').filter({ hasText: 'Madina Ergasheva' });
  await expect(row).toContainText('yopiq');
  await row.getByRole('button', { name: 'Madina Ergasheva' }).click();
  const own = hub
    .locator('.hub-card')
    .filter({ has: page.locator('h4', { hasText: /Bo‘limlar/ }) });
  await own.getByLabel('🎮 Arena (o‘yinlar)').selectOption('on');
  await own.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.locator('.toast')).toContainText('Talaba bo‘limlari saqlandi');
  await student.goto('/#home', { waitUntil: 'domcontentloaded' });
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(nav).toContainText('O‘yin maydoni');
  await expect(nav).not.toContainText('Kutubxona');

  // asl holatga
  await limits(page, { op: 'clear', scope: 'g', key: 'AP-223' });
  await limits(page, { op: 'clear', scope: 'u', key: 'demo-student' });
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(nav).toContainText('Kutubxona');
  expect((await student.request.get('/api/platform?view=library')).status()).toBe(200);
  await student.context().close();
});

test('grades, second attempts, status and Premium for a group in one place', async ({ page }) => {
  await as(page, 'demo-admin');
  // Demo jonli talabalar bazasiga ulanmaydi: ro'yxat va saqlash javobi shu yerda beriladi
  let reopened: Record<string, number> = {};
  let marks: Record<string, number> = {};
  const sent: unknown[] = [];
  const student = () => ({
    id: 'legacy_ali',
    legacyId: 'ali',
    uid: 'legacy_ali',
    role: 'student',
    name: 'Ali Valiyev',
    classId: 'AP-223',
    learnerType: 'university',
    legacyStatus: 'ok',
    academicPoints: 42 + Object.values(marks).reduce((n, m) => n + m * 2, 0),
    academicTopics: { m3: { b: 3 } },
    manualMarks: marks,
    reopened,
    readingHistory: {},
  });
  await page.route('**/api/platform?view=studentsHub', async (route) => {
    const real = await (await route.fetch()).json();
    await route.fulfill({ json: { ...real, students: [student()] } });
  });
  await page.route('**/api/platform', async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().method() !== 'POST' || body?.action !== 'legacyStudent')
      return route.continue();
    sent.push(body.input);
    if (body.input.reopen) reopened = { ...reopened, [body.input.reopen]: Date.now() };
    if (body.input.topic) marks = { ...marks, [body.input.topic]: body.input.mark };
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '👥 Talabalar bilan ishlash', exact: true }).click();
  const hub = page.locator('.students-hub');
  // 📝 Baholar: kunlik mavzuga amaliy baho (5 → +10 ball) va 🔁 ikkinchi urinish
  await hub.getByRole('tab', { name: /Baholar/ }).click();
  await expect(hub).toContainText('5 baho = 10 ball');
  await hub.locator('.hub-pick select').nth(1).selectOption('m3');
  const row = hub.locator('.hub-table tbody tr').filter({ hasText: 'Ali Valiyev' });
  await expect(row).toContainText('3');
  await row.getByLabel('Ali Valiyev · 3-mavzu amaliy baho').selectOption('5');
  await expect(row).toContainText('52');
  const again = row.getByRole('button', { name: 'Ali Valiyev · 3-mavzu testiga ikkinchi urinish' });
  page.once('dialog', (d) => {
    expect(d.message()).toContain('3-mavzu testiga ikkinchi urinish berilsinmi');
    void d.accept();
  });
  await again.click();
  await expect(again).toHaveClass(/is-on/);
  expect(sent).toEqual([
    { id: 'ali', topic: 'm3', mark: 5 },
    { id: 'ali', reopen: 'm3' },
  ]);
  // 💎 Obuna: guruhda kimda bor va kimda yo'q
  await hub.getByRole('tab', { name: /Obuna/ }).click();
  await expect(hub).toContainText('1 ta talabadan 0 tasida obuna bor');
  await expect(hub.locator('.hub-table tbody tr')).toContainText('Obuna yo‘q');
  // 👤 Talabalar → talaba kartasi: hamma sozlama bitta joyda
  await hub.getByRole('tab', { name: /Talabalar/ }).click();
  await hub.getByRole('button', { name: 'Ali Valiyev' }).click();
  for (const h of [
    '🪪 Hisob',
    '🎚 Bo‘limlar',
    '📝 Baholar',
    '💎 Obuna',
    '🔑 Kursga ruxsat',
    '🎭 Avatar',
  ])
    await expect(hub.locator('.hub-card h4', { hasText: h })).toBeVisible();
  await expect(hub.getByRole('button', { name: 'Parolni tiklash' })).toBeVisible();
  const card = hub.locator('.academic-topic-card').filter({ hasText: /^3\./ });
  await expect(card).toContainText('berilgan:');
});
