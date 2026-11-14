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
  await page.selectOption('.language-switch', 'ru');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('.sidebar nav').first()).toContainText('Главная');
  await page.selectOption('.language-switch', 'en');
  await expect(page.locator('.sidebar nav')).toContainText('Courses');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveClass('dark');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.selectOption('.language-switch', 'uz');
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
  // Qidiruv natijalari sahifa almashmasdan, ochiladigan ro'yxatda chiqadi.
  await page.locator('.search-box input').fill('Mijoz');
  const options = page.locator('.search-results [role="option"]');
  await expect(options.first()).toBeVisible();
  expect((await options.allTextContents()).every((x) => x.toLowerCase().includes('mijoz'))).toBe(
    true,
  );
  await page.locator('.search-box input').fill('6-mavzu');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toContainText('Biznes-model');
  await page.locator('.search-box input').press('Escape');
  await expect(page.locator('.search-results')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('course catalog contains one entrepreneurship course with 15 ordered topics inside', async ({
  page,
}) => {
  await login(page.request, 'student');
  // Firestore returns document IDs lexicographically: m1, m10, ... m2.
  await page.route('**/api/platform', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const state = await response.json();
    state.courses = state.courses.filter((c: any) => c.id === 'tad-asoslari');
    state.lessons = state.lessons
      .filter((l: any) => l.courseId === 'tad-asoslari')
      .sort((a: any, b: any) => a.id.localeCompare(b.id));
    await route.fulfill({ response, json: state });
  });
  await page.goto('/#courses', { waitUntil: 'domcontentloaded' });
  const course = page.locator('.course-card').filter({ hasText: 'Tadbirkorlik asoslari' });
  await expect(course).toHaveCount(1);
  await expect(page.locator('.course-card')).toHaveCount(1);
  await expect(course.getByText('15 ta mavzu', { exact: true })).toBeVisible();
  await expect(page.locator('.lesson-card')).toHaveCount(0);
  await page.screenshot({ path: 'tests/artifacts/course-catalog.png', fullPage: true });
  await course.click();
  await expect(page.locator('h1')).toHaveText('Tadbirkorlik asoslari');
  await expect(page.locator('.lesson-card')).toHaveCount(15);
  await expect(page.locator('.lesson-card').nth(1).locator('h3')).toContainText('Mijoz muammosi');
  await expect(page.locator('.lesson-card').nth(9).locator('h3')).toContainText('Savdo jarayonini');
  expect(await page.locator('.mini-cover .topic-art-number').allTextContents()).toEqual(
    Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0')),
  );
  await page.screenshot({ path: 'tests/artifacts/course-topics.png', fullPage: true });
  await page.getByRole('button', { name: 'Bozorni o‘rganish', exact: true }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(1);
  await expect(page.locator('.mini-cover .topic-art-number')).toHaveText('07');
  await page.getByRole('button', { name: 'Hammasi', exact: true }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(15);
  await page.locator('.app-main').getByRole('button', { name: 'Kurslar', exact: true }).click();
  await expect(course).toBeVisible();
  await expect(page.locator('.lesson-card')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: 'tests/artifacts/course-catalog-mobile.png', fullPage: true });
});
test('API rejects escalation, forged cookies, wrong origins and private answer reads', async ({
  request,
  baseURL,
}) => {
  await login(request, 'student');
  expect((await act(request, 'syncLegacy', {})).status()).toBe(403);
  expect((await act(request, 'legacyStudent', { id: 'alice', status: 'ok' })).status()).toBe(403);
  expect((await request.get('/api/platform?view=roster')).status()).toBe(403);
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
  await page.getByRole('button', { name: 'Mening ballim', exact: true }).click();
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
  const liveRequests: string[] = [],
    firestoreWrites: string[] = [];
  page.on('request', (r) => {
    if (/firebasedatabase|firebaseio|identitytoolkit|securetoken/.test(r.url()))
      liveRequests.push(r.url());
    if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/platform')
      firestoreWrites.push(r.postDataJSON()?.action);
  });
  await login(page.request, 'student');
  const before = await (await page.request.get('/api/platform')).json();
  const position = before.progress.find((p: any) => p.lessonId === 'm1')?.last || 0;
  const slideCount = before.lessons.find((l: any) => l.id === 'm1').slideCount;
  const nextPosition = position < slideCount - 1 ? position + 1 : position - 1;
  await page.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  const frame = page.locator('.native-viewer .native-document');
  await expect(frame.locator(':scope > .inner')).toBeVisible();
  await expect(page.locator('.reader-counter')).toContainText(String(position + 1) + ' / ');
  await expect(frame.locator('.topbar')).toBeHidden();
  await expect(frame.locator('.navbar')).toBeHidden();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await page
    .locator('.reader-controls')
    .getByRole('button', { name: nextPosition > position ? 'Keyingi' : 'Oldingi' })
    .click();
  await expect(page.locator('.reader-counter')).toContainText(String(nextPosition + 1) + ' / ');
  // Asl taqdimot Firestore'ga yozmaydi (kunlik kvota): o'qish joyi va ballar asl dvigatelda saqlanadi.
  await page.waitForTimeout(800);
  expect(firestoreWrites).toEqual([]);
  expect(liveRequests).toEqual([]);
  await page.getByRole('button', { name: 'Mening ballim', exact: true }).click();
  await expect(
    page.locator('.reader-details').getByRole('link', { name: 'PDF', exact: true }),
  ).toHaveAttribute('href', '/legacy/fayllar/M1-mavzu.pdf');
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
  await page.selectOption('.demo-banner select', 'admin');
  await expect(page.locator('.sidebar a[href="#admin"]')).toBeVisible();
  await page.locator('.sidebar a[href="#admin"]').click();
  await expect(page.locator('h1')).toHaveText('Administrator paneli');
  await page.getByRole('button', { name: 'Platforma', exact: true }).click();
  await expect(page.locator('form')).toBeVisible();
});

test('all original presentations use a complete viewport with no legacy topbar', async ({
  page,
}) => {
  test.setTimeout(180000);
  await login(page.request, 'student');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (let i = 1; i <= 15; i++) {
    await page.goto('/#lesson/m' + i, { waitUntil: 'domcontentloaded' });
    const frame = page.locator('.native-viewer .native-document');
    await expect(frame.locator(':scope > .inner')).toBeVisible();
    await expect(frame.locator('.topbar')).toBeHidden();
    await expect(frame.locator('.navbar')).toBeHidden();
    await expect(page.locator('.app-header')).toHaveCount(0);
    await expect(page.locator('.reader-counter')).toBeVisible();
    expect(
      await page
        .locator('.focus-reader')
        .evaluate((el) => Math.abs(el.getBoundingClientRect().height - innerHeight) < 2),
    ).toBe(true);
  }
  await page.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  const frame = page.locator('.native-viewer .native-document');
  await expect(frame.locator(':scope > .inner')).toBeVisible();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'tests/artifacts/focus-presentation-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: 'tests/artifacts/focus-presentation-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('the original arena stays inside the game page and the new app can be installed', async ({
  page,
}) => {
  await login(page.request, 'student');
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Guruh musobaqalari', exact: true }).click();
  await expect(page.locator('.native-arena .native-document')).toBeVisible();
  await expect(page.locator('.native-arena .native-document').locator('.topbar')).toBeHidden();
  await expect(page.locator('.sidebar')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#arena/live');
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt');
    Object.assign(event, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await page.goto('/#app', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Ilovani o‘rnatish', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ilova o‘rnatilgan', exact: true })).toBeDisabled();
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.name).toBe('Tadbirkorlik asoslari');
  expect(manifest.shortcuts.some((s: any) => s.url === '/#arena')).toBe(true);
});

test('student entry asks for the existing first name, surname and code', async ({ page }) => {
  await page.route('**/api/platform', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const state = await response.json();
    state.mode = 'legacy';
    delete state.user;
    await route.fulfill({ response, json: state });
  });
  await page.route('**/legacy/index.html*', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace(
      '<script src="embed.js"></script>',
      '<script>localStorage.removeItem("terdu_student");</script><script src="embed.js"></script>',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/#login', { waitUntil: 'domcontentloaded' });
  // 🎓 birinchi savol: «Talabamisiz?» → talaba bo'limi
  await page.getByRole('button', { name: /Ha, TerDU talabasiman/ }).click();
  const frame = page.locator('.native-login .native-document');
  await expect(frame.locator('#lgN')).toBeVisible();
  await expect(frame.locator('#lgS')).toBeVisible();
  await expect(frame.locator('#lgB')).toBeVisible();
  await expect(frame.locator('.topbar')).toBeHidden();
  await frame.locator('#lgN').fill('Ali');
  await frame.locator('#lgS').fill('Valiyev');
  await frame.locator('#lgB').fill('1234');
  expect(await frame.locator('#lgB').inputValue()).toBe('1234');
  await page.screenshot({ path: 'tests/artifacts/student-code-login.png', fullPage: true });
});

test('existing academic points remain visible on the dashboard, profile and academic ranking', async ({
  page,
}) => {
  await login(page.request, 'student');
  await page.route('**/api/platform*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const view = new URL(route.request().url()).searchParams.get('view');
    // E'lonlar va boshqa ko'rinishlar o'zgarmaydi; faqat reyting va asosiy holat soxtalashtiriladi.
    if (view && view !== 'academic') return route.continue();
    if (view === 'academic')
      return route.fulfill({
        json: {
          leaderboard: [
            { id: 'legacy_other', name: 'Bobur Aliyev', classId: 'AP-223', academicPoints: 450 },
            { id: 'legacy_alice', name: 'Ali Valiyev', classId: 'AP-223', academicPoints: 375.5 },
          ],
        },
      });
    const response = await route.fetch(),
      state = await response.json();
    state.user = {
      ...state.user,
      id: 'legacy_alice',
      name: 'Ali Valiyev',
      academicPoints: 375.5,
      academicTopics: { m1: { p: 75, b: 4 } },
      readingHistory: Object.fromEntries(
        state.lessons
          .filter((l: any) => l.courseId === 'tad-asoslari')
          .map((l: any) => [
            l.id,
            {
              seenSlides: l.id === 'm1' ? 12 : 0,
              totalSlides: l.slideCount,
              lastSlide: 0,
              seconds: l.id === 'm1' ? 3000 : 0,
              correctAnswers: l.id === 'm1' ? 8 : 0,
              score: l.id === 'm1' ? 75 : 0,
              grade: l.id === 'm1' ? 4 : 0,
              status: l.id === 'm1' ? 'started' : 'new',
            },
          ]),
      ),
      classId: 'AP-223',
    };
    await route.fulfill({ response, json: state });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.stats-grid .stat-card').first()).toContainText('Umumiy ball');
  await expect(page.locator('.stats-grid .stat-card').first().locator('strong')).toHaveText(
    '375,5',
  );
  // Reyting endi kurs ichida: «Kurslar → fan → Reyting»
  await page.locator('.sidebar a[href="#courses"]').click();
  await page.locator('.course-card').first().click();
  await page.getByRole('tab', { name: 'Reyting' }).click();
  await expect(page.locator('.ranking-list')).toContainText('Ali Valiyev');
  await expect(page.locator('.ranking-list')).toContainText('375,5');
  await page.goto('/#profile', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.profile-hero-stats b').first()).toHaveText('375,5');
  // Ochilmagan va boshlanmagan mavzular alohida kartochka emas, bitta qatorda sanaladi.
  const cards = await page.locator('.academic-topic-card').count();
  const closed = await page.locator('.academic-closed').count();
  expect(cards + (closed ? 1 : 0)).toBeGreaterThan(1);
  await expect(page.locator('.academic-topic-card').first()).toContainText('75');
  await expect(page.locator('.academic-topic-card').first()).toContainText('Baho: 4');
});

test('class chat remains in the new navigation and opens the existing chat interface', async ({
  page,
}) => {
  await login(page.request, 'student');
  await page.route('**/legacy/index.html*', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace(
      '<script src="embed.js"></script>',
      '<script>if(new URLSearchParams(location.search).get("sqEmbed")==="chat"){var s=JSON.parse(localStorage.getItem("terdu_student"));s.learnerType="university";s.status="ok";s.group="AP-223";localStorage.setItem("terdu_student",JSON.stringify(s));}</script><script src="embed.js"></script>',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/#chat', { waitUntil: 'domcontentloaded' });
  const frame = page.locator('.native-workspace .native-document');
  await expect(frame.locator('#chPanel')).toBeVisible();
  await expect(frame.locator('.topbar')).toBeHidden();
  await expect(page.locator('.sidebar')).toBeVisible();
});

test('standalone copied lesson and game links return to the new application', async ({ page }) => {
  await login(page.request, 'student');
  await page.goto('/legacy/mavzu-7.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => new URL(page.url()).hash).toBe('#lesson/m7');
  await expect(page.locator('.focus-reader')).toBeVisible();
  await page.goto('/legacy/arena.html#/room/ABCD', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => new URL(page.url()).hash).toBe('#arena/live');
  expect(new URL(page.url()).searchParams.get('arena')).toBe('#/room/ABCD');
  await expect(page.locator('.native-arena .native-document')).toBeVisible();
});

test('quota fallback preserves academic points and opens original slides without XP writes', async ({
  page,
}) => {
  await login(page.request, 'student');
  const writes: string[] = [];
  await page.route('**/api/platform*', async (route) => {
    if (route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON().action);
      return route.continue();
    }
    // Faqat asosiy holat javobi kvota rejimiga o'tkaziladi; boshqa ko'rinishlar (dars, reyting/avatar) o'zgarmaydi.
    if (new URL(route.request().url()).searchParams.has('view')) return route.continue();
    const response = await route.fetch(),
      state = await response.json();
    state.mode = 'firebase';
    state.limited = true;
    state.serviceMessage = 'Ma’lumotlar bazasi kvotasi tugagan.';
    state.user.academicPoints = 375.5;
    state.progress = [];
    delete state.user.xp;
    await route.fulfill({ response, json: state });
  });
  await page.goto('/');
  await expect(
    page.locator('[role="status"]').filter({ hasText: 'kvotasi tugagan' }),
  ).toBeVisible();
  await expect(page.locator('.stat-card').filter({ hasText: 'Umumiy ball' })).toContainText(
    '375,5',
  );
  await page.goto('/#course/tad-asoslari');
  await page.locator('.lesson-card').first().click();
  const frame = page.locator('.native-viewer .native-document');
  await expect(frame.locator(':scope > .inner')).toBeVisible();
  await page.locator('.reader-controls').getByRole('button', { name: 'Keyingi' }).click();
  await expect(page.locator('.reader-counter')).toContainText('2 / 18');
  expect(writes).toEqual([]);
});

test('class reports load only on request or for CSV and are reused between tabs', async ({
  page,
}) => {
  await login(page.request, 'admin');
  let reports = 0;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/platform' && url.searchParams.get('reports') === '1') reports++;
  });
  await page.goto('/#admin');
  await expect(
    page.getByRole('button', { name: 'Talabalar va baholar', exact: true }),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(reports).toBe(0);
  await page.getByRole('button', { name: 'Platforma', exact: true }).click();
  expect(reports).toBe(0);
  // «Tahlil» ochilganda hisobot o'zi yuklanmaydi (Firestore kvotasi) — faqat tugma bilan.
  await page.getByRole('button', { name: 'Tahlil', exact: true }).click();
  await expect(page.locator('.report-gate')).toContainText('kvotasidan');
  await page.waitForLoadState('networkidle');
  expect(reports).toBe(0);
  await page.getByRole('button', { name: /Hisobotni yuklash/ }).click();
  await expect(page.locator('.analytics-panel')).toBeVisible();
  expect(reports).toBe(1);
  await page.getByRole('button', { name: 'O‘quvchilar', exact: true }).click();
  await page.getByRole('button', { name: 'Tahlil', exact: true }).click();
  await expect(page.locator('.analytics-panel')).toBeVisible();
  expect(reports).toBe(1);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('tadbirkorlik-asoslari-natijalar.csv');
  expect(reports).toBe(1);
});
