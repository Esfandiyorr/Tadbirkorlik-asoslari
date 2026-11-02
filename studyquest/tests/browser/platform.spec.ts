import { test, expect, type APIRequestContext } from '@playwright/test';
async function login(api: APIRequestContext, role: string) {
  const r = await api.post('/api/auth/demo', { data: { id: 'demo-' + role } });
  expect(r.status()).toBe(200);
}
async function act(api: APIRequestContext, action: string, input: unknown) {
  return api.post('/api/platform', { data: { action, input } });
}
test('responsive dashboard, search, theme and three interface languages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await login(page.request, 'student');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.welcome-hero')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/student-desktop.png', fullPage: true });
  await page.selectOption('[aria-label="Language"]', 'ru');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('.sidebar nav').first()).toContainText('Главная');
  await page.selectOption('[aria-label="Language"]', 'en');
  await expect(page.locator('.sidebar nav')).toContainText('Courses');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveClass('dark');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.selectOption('[aria-label="Language"]', 'uz');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await expect(page.locator('.bottom-nav')).toBeVisible();
  expect(
    (await page.locator('.sidebar').boundingBox())!.x +
      (await page.locator('.sidebar').boundingBox())!.width,
  ).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'tests/artifacts/student-mobile.png', fullPage: true });
  await page.locator('.search-box input').fill('Mijoz');
  await expect(page.locator('.lesson-card').first()).toBeVisible();
  expect(
    (await page.locator('.lesson-card').allTextContents()).every((x) =>
      x.toLowerCase().includes('mijoz'),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test('API rejects escalation, forged cookies, wrong origins and private answer reads', async ({
  request,
  baseURL,
}) => {
  await login(request, 'student');
  expect((await act(request, 'role', { userId: 'demo-student', role: 'admin' })).status()).toBe(
    403,
  );
  expect(
    (await act(request, 'getQuizForEdit', { quizId: 'entrepreneurship-check' })).status(),
  ).toBe(403);
  expect(
    (await act(request, 'enroll', { courseId: 'tad-asoslari', userId: 'demo-admin' })).status(),
  ).toBe(403);
  const foreign = await request.post('/api/platform', {
    headers: { Origin: 'https://foreign.example' },
    data: { action: 'profile', input: { name: 'Attack', leaderboardVisible: true } },
  });
  expect(foreign.status()).toBe(403);
  const seed = await (await request.get('/api/platform')).json();
  expect(seed.quizzes.every((q: any) => !('questions' in q))).toBe(true);
  expect(
    (
      await act(request, 'profile', {
        name: 'Madina Ergasheva',
        leaderboardVisible: true,
        xp: 999999,
        role: 'admin',
      })
    ).status(),
  ).toBe(200);
  const updated = await (await request.get('/api/platform')).json();
  expect(updated.user.role).toBe('student');
  const forged = await request.get('/api/platform', {
    headers: { cookie: 'sq-demo=eyJpZCI6ImRlbW8tYWRtaW4ifQ.invalid' },
  });
  expect(forged.status()).toBe(401);
});
test('teacher can publish a course and lesson; students earn a reward only after actual criteria', async ({
  page,
  browser,
}) => {
  const teacher = await browser.newContext();
  await login(teacher.request, 'teacher');
  const suffix = Date.now().toString();
  let r = await act(teacher.request, 'saveCourse', {
    title: 'Demo amaliy kurs ' + suffix,
    description: 'Local automated test fixture',
    published: true,
    difficulty: 'Boshlang‘ich',
    category: 'Biznes',
  });
  expect(r.ok()).toBe(true);
  const courseId = (await r.json()).id;
  r = await act(teacher.request, 'saveModule', { courseId, title: 'Amaliy modul', order: 0 });
  expect(r.ok()).toBe(true);
  const moduleId = (await r.json()).id;
  r = await act(teacher.request, 'saveLesson', {
    courseId,
    moduleId,
    title: 'Mijoz muammosini tushunish',
    order: 0,
    minSeconds: 30,
    published: true,
    slides: [
      {
        title: 'Mijozning ehtiyoji',
        body: 'Tadbirkor avval mijozning haqiqiy muammosini o‘rganadi.',
      },
    ],
  });
  expect(r.ok()).toBe(true);
  const lessonId = (await r.json()).id;
  await login(page.request, 'student');
  await page.goto('/#lesson/' + lessonId, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.slide-content h2')).toHaveText('Mijozning ehtiyoji');
  const before = (await (await page.request.get('/api/platform')).json()).user.xp;
  expect((await act(page.request, 'completeLesson', { lessonId })).status()).toBe(409);
  await page.waitForTimeout(31000);
  await page.getByRole('button', { name: 'Darsni yakunlash', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yakunlangan', exact: true })).toBeDisabled();
  const after = await (await page.request.get('/api/platform')).json();
  expect(after.user.xp - before).toBe(220);
  await act(page.request, 'completeLesson', { lessonId });
  expect((await (await page.request.get('/api/platform')).json()).user.xp).toBe(after.user.xp);
  await teacher.close();
});
test('original presentation stays usable and demo never contacts the live database', async ({
  page,
}) => {
  const liveRequests: string[] = [];
  page.on('request', (r) => {
    if (/firebasedatabase|firebaseio|identitytoolkit|securetoken/.test(r.url()))
      liveRequests.push(r.url());
  });
  await login(page.request, 'student');
  const before = await (await page.request.get('/api/platform')).json();
  const position = before.progress.find((p: any) => p.lessonId === 'm1')?.last || 0;
  const slideCount = before.lessons.find((l: any) => l.id === 'm1').slideCount;
  const nextPosition = position < slideCount - 1 ? position + 1 : position - 1;
  await page.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  const frame = page.frameLocator('.legacy-viewer iframe');
  await expect(frame.locator('.slide.active')).toBeVisible();
  await expect(frame.locator('#cur')).toHaveText(String(position + 1));
  await frame.locator(nextPosition > position ? '#btnNext' : '#btnPrev').click();
  await expect(frame.locator('#cur')).toHaveText(String(nextPosition + 1));
  await expect
    .poll(async () => {
      const d = await (await page.request.get('/api/platform')).json();
      return d.progress.find((p: any) => p.lessonId === 'm1')?.last === nextPosition;
    })
    .toBe(true);
  expect(liveRequests).toEqual([]);
});
test('teacher editing, upload validation and administrator controls are real server actions', async ({
  page,
}) => {
  await login(page.request, 'teacher');
  await page.goto('/#teacher', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveText('O‘qituvchi paneli');
  await page.getByRole('button', { name: 'Testlar', exact: true }).click();
  await expect(page.locator('.question-editor')).toBeVisible();
  const student = await page.context().browser()!.newContext();
  await login(student.request, 'student');
  const invalid = await student.request.post('/api/upload', {
    multipart: {
      courseId: 'tad-asoslari',
      file: {
        name: 'fake.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\nnot-a-course-document'),
      },
    },
  });
  expect(invalid.status()).toBe(403);
  await student.close();
  const upload = await page.request.post('/api/upload', {
    multipart: {
      courseId: 'tad-asoslari',
      file: {
        name: 'attack.html',
        mimeType: 'application/pdf',
        buffer: Buffer.from('<script>alert(1)</script>'),
      },
    },
  });
  expect(upload.status()).toBe(400);
  await page.selectOption('[aria-label="Demo role"]', 'admin');
  await expect(page.locator('.sidebar a[href="#admin"]')).toBeVisible();
  await page.locator('.sidebar a[href="#admin"]').click();
  await expect(page.locator('h1')).toHaveText('Administrator paneli');
  await page.getByRole('button', { name: 'Sozlamalar', exact: true }).click();
  await expect(page.locator('form')).toBeVisible();
});
