import { test, expect, type Page } from '@playwright/test';
import { course, modules, lessons, quiz, settings, badges } from '../../lib/seed';
import config from '../../../_reyting-manba/config.json';

const student = {
  id: 'test_existing',
  name: 'Ali',
  surname: 'Valiyev',
  group: 'AP-223',
  status: 'ok',
  at: 100,
  total: 375.5,
};
const publicData = {
  courses: [course],
  modules,
  lessons,
  quizzes: [quiz],
  settings,
  badges,
  mode: 'firebase',
};
const userData = {
  ...publicData,
  user: {
    id: 'legacy_' + student.id,
    uid: 'test-owner',
    name: 'Ali Valiyev',
    role: 'student',
    learnerType: 'university',
    classId: 'AP-223',
    xp: 0,
    streak: 0,
    academicPoints: student.total,
    // server avvalgi talabaga o'qish tarixini ham beradi (lib/server/academic.ts) — ballar kartasi shu bilan chiqadi
    readingHistory: {},
  },
  progress: [],
  attempts: [],
  transactions: [],
  earned: [],
  activity: [],
  notifications: [],
};
for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`the sign-in page fills the window without horizontal scrolling at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await services(page);
    await page.route('**/api/platform*', (route) => route.fulfill({ json: publicData }));
    await page.goto('/#login');
    await expect(page.getByLabel('Ism familiya')).toBeVisible();
    await expect(page.locator('.app-shell, .sidebar, .bottom-nav')).toHaveCount(0);
    const bounds = await page.locator('.la-page').boundingBox();
    expect(bounds!.x).toBe(0);
    expect(bounds!.width).toBe(viewport.width);
    expect(bounds!.height).toBeGreaterThanOrEqual(viewport.height);
    await expect(page.getByRole('button', { name: 'Kirish', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Mehmon' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Ro‘yxatdan o‘tish' }).click();
    await expect(page.getByRole('button', { name: 'Google orqali kirish' })).toBeVisible();
    if (viewport.width === 390)
      await page.screenshot({
        path: 'tests/artifacts/auth-registration-mobile.png',
        fullPage: true,
      });
    if (viewport.width === 1440)
      await page.screenshot({
        path: 'tests/artifacts/auth-registration-desktop.png',
        fullPage: true,
      });
  });
}

test('catalog sign-in opens the sign-in page and closes back to the course', async ({ page }) => {
  await services(page);
  await page.route('**/api/platform*', (route) => route.fulfill({ json: publicData }));
  await page.goto('/#course/tad-asoslari');
  await page.locator('.lesson-card').first().click();
  await expect(page.locator('.la-page')).toBeVisible();
  await expect(page.locator('.app-shell, .legacy-modal')).toHaveCount(0);
  await page.getByRole('button', { name: 'Yopish', exact: true }).click();
  await expect(page.locator('.la-page')).toHaveCount(0);
  await expect(page.locator('.lesson-card').first()).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#course/tad-asoslari');
});

/** Yashirin talaba oynasi bazaga ulangunicha kutadi. */
async function legacyReady(page: Page) {
  await expect
    .poll(
      () =>
        page
          .frames()
          .find((f) => f.url().includes('/legacy/index.html'))
          ?.evaluate(() => !!(window as any).RT?.cloud().on)
          .catch(() => false) ?? false,
    )
    .toBe(true);
}

async function signIn(page: Page, name: string, password: string) {
  await page.getByLabel('Ism familiya').fill(name);
  await page.getByLabel('Parol').fill(password);
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
}

async function services(page: Page) {
  // No live student data, authentication, or database mutations in these checks.
  await page.addInitScript(() => {
    // Simulate only Google's cross-origin helper transport. Firebase's popup and
    // auth-state logic still run normally, including the actual window.open call.
    const iframe = {
      restyle: async () => {},
      ping: (ready: () => void) => {
        ready();
        return Promise.resolve();
      },
      register: () => {},
      send: () => {},
    };
    (window as any).gapi = {
      iframes: {
        Iframe: function () {},
        getContext: () => ({
          open: (_options: unknown, ready: (frame: unknown) => unknown) => ready(iframe),
        }),
        CROSS_ORIGIN_IFRAMES_FILTER: () => true,
      },
    };
  });
  await page.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === '127.0.0.1' && u.pathname === '/api/student-login')
      return route.fulfill({ json: { ok: true } });
    if (u.hostname === '127.0.0.1') return route.continue();
    if (u.hostname === 'identitytoolkit.googleapis.com' && u.pathname.endsWith('accounts:signUp'))
      return route.fulfill({
        json: {
          idToken: 'test-token',
          localId: 'test-owner',
          refreshToken: 'test-refresh',
          expiresIn: '3600',
        },
      });
    if (/firebasedatabase.app|firebaseio.com/.test(u.hostname)) {
      if (u.pathname === '/students.json')
        return route.fulfill({ json: { [student.id]: student } });
      if (u.pathname.startsWith('/owners/') && route.request().method() === 'PUT')
        return route.fulfill({ json: 'test-claim' });
      if (u.pathname === '/students/' + student.id + '.json')
        return route.fulfill({ json: student });
      if (u.pathname.endsWith('/status.json')) return route.fulfill({ json: 'ok' });
      return route.fulfill({ json: null });
    }
    return route.abort();
  });
}

test('Google sign-in opens an account popup directly from the first sign-in screen', async ({
  page,
  context,
}) => {
  await services(page);
  await context.route('https://**/*', (route) => route.abort());
  await page.route('**/api/platform', (route) => route.fulfill({ json: publicData }));
  await page.goto('/#login');
  const popup = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Google orqali kirish' }).click();
  const opened = await popup;
  expect(opened).not.toBe(page);
  await opened.close();
});

test('blocked Google popups show a persistent explanation', async ({ page }) => {
  await services(page);
  await page.addInitScript(() => {
    window.open = () => null;
  });
  await page.route('**/api/platform', (route) => route.fulfill({ json: publicData }));
  await page.goto('/#login');
  await page.getByRole('button', { name: 'Ro‘yxatdan o‘tish' }).click();
  await page.getByRole('button', { name: 'Google orqali kirish' }).click();
  await expect(page.locator('.la-error')).toContainText('Brauzer Google oynasini blokladi');
});

test('expired saved session still allows reopening the student and Google sign-in options', async ({
  page,
}) => {
  await services(page);
  await page.addInitScript((s) => {
    if (window !== window.parent) return;
    localStorage.setItem('terdu_student', JSON.stringify(s));
    localStorage.setItem('terdu_sa', JSON.stringify({ uid: 'old-owner', tok: 'expired', exp: 0 }));
  }, student);
  await page.route('**/api/platform', (route) => route.fulfill({ json: publicData }));
  await page.goto('/#login');
  await expect(page.getByLabel('Ism familiya')).toBeVisible();
  // A saved legacy record is emitted every second, even when its token is invalid.
  await page.waitForTimeout(2200);
  expect(new URL(page.url()).hash).toBe('#login');
  await page.getByRole('button', { name: 'Ro‘yxatdan o‘tish' }).click();
  await expect(page.getByRole('button', { name: 'Google orqali kirish' })).toBeVisible();
});

test('a rejected saved token shows public content and keeps sign-in reachable', async ({
  page,
}) => {
  await services(page);
  await page.addInitScript((s) => {
    localStorage.setItem('terdu_student', JSON.stringify(s));
    localStorage.setItem(
      'terdu_sa',
      JSON.stringify({ uid: 'test-owner', tok: 'revoked', exp: Date.now() + 3600000 }),
    );
  }, student);
  let rejections = 0;
  await page.route('**/api/platform', (route) => {
    if (route.request().headers().authorization) {
      rejections++;
      return route.fulfill({ status: 401, json: { error: 'Seans tugagan. Qayta kiring.' } });
    }
    return route.fulfill({ json: publicData });
  });
  await page.goto('/#login');
  await expect(page.getByLabel('Ism familiya')).toBeVisible();
  await expect.poll(() => rejections).toBeGreaterThan(0);
  await page.waitForTimeout(2200);
  expect(new URL(page.url()).hash).toBe('#login');
  expect(rejections).toBeLessThan(4);
});

test('sign-in remains available when the platform API is unavailable', async ({ page }) => {
  await services(page);
  await page.route('**/api/platform', (route) =>
    route.fulfill({ status: 503, json: { error: 'Temporary outage' } }),
  );
  await page.goto('/');
  await page.locator('a[href="#login"]').click();
  await expect(page.getByLabel('Parol')).toBeVisible();
});

test('1111 login with «Familiya Ism» establishes the legacy session and displays the original academic points', async ({
  page,
}) => {
  await services(page);
  let authenticatedRequests = 0;
  await page.route('**/api/platform*', (route) => {
    const h = route.request().headers();
    const signedIn =
      h['x-legacy-student'] === student.id && h.authorization === 'Bearer test-token';
    if (signedIn) authenticatedRequests++;
    if (new URL(route.request().url()).searchParams.get('view') === 'academic')
      return route.fulfill({
        json: {
          leaderboard: [
            { id: 'legacy_other', name: 'Bobur Aliyev', classId: 'AP-224', academicPoints: 450 },
            {
              id: userData.user.id,
              name: userData.user.name,
              classId: 'AP-223',
              academicPoints: 375.5,
            },
          ],
        },
      });
    return route.fulfill({ json: signedIn ? userData : publicData });
  });
  await page.goto('/#login');
  await legacyReady(page);
  await signIn(page, student.surname + ' ' + student.name, '1111');
  await expect(page.locator('h1')).toContainText('Ali');
  await expect(page.locator('.stat-card').filter({ hasText: 'Umumiy ball' })).toContainText(
    /375[.,]5/,
  );
  expect(authenticatedRequests).toBeGreaterThan(0);
  await page.goto('/#ranking');
  await expect(page.getByRole('heading', { name: 'Reyting', exact: true })).toBeVisible();
  await expect(page.locator('.ranking-list')).toContainText('AP-224');
  await expect(page.locator('.ranking-list')).toContainText('AP-223');
});

test('a slow guest response cannot replace a restored Google account', async ({ page }) => {
  await services(page);
  const google = {
    localId: 'test-google',
    email: 'teacher@example.test',
    displayName: 'Test Teacher',
    emailVerified: true,
    providerUserInfo: [
      {
        providerId: 'google.com',
        rawId: 'test-google',
        email: 'teacher@example.test',
        displayName: 'Test Teacher',
      },
    ],
  };
  const now = Math.floor(Date.now() / 1000);
  const token = [
    'eyJhbGciOiJSUzI1NiJ9',
    Buffer.from(
      JSON.stringify({
        sub: google.localId,
        aud: config.fbWeb.projectId,
        iss: 'https://securetoken.google.com/' + config.fbWeb.projectId,
        iat: now,
        exp: now + 3600,
        auth_time: now,
        firebase: { sign_in_provider: 'google.com' },
      }),
    ).toString('base64url'),
    'test-signature',
  ].join('.');
  await page.addInitScript(
    ({ google, token, apiKey }) => {
      localStorage.setItem(
        'firebase:authUser:' + apiKey + ':[DEFAULT]',
        JSON.stringify({
          uid: google.localId,
          email: google.email,
          displayName: google.displayName,
          emailVerified: true,
          isAnonymous: false,
          providerData: google.providerUserInfo.map((p) => ({ ...p, uid: p.rawId })),
          stsTokenManager: {
            accessToken: token,
            refreshToken: 'mock-refresh',
            expirationTime: Date.now() + 3600000,
          },
          apiKey,
          appName: '[DEFAULT]',
        }),
      );
    },
    { google, token, apiKey: config.fbWeb.apiKey },
  );
  await page.route('**/identitytoolkit.googleapis.com/**', (route) =>
    route.fulfill({ json: { users: [google] } }),
  );
  let authenticated = 0;
  await page.route('**/api/platform', async (route) => {
    if (route.request().headers().authorization === 'Bearer ' + token) {
      authenticated++;
      return route.fulfill({
        json: {
          ...userData,
          user: { ...userData.user, id: google.localId, name: google.displayName, role: 'teacher' },
        },
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ json: publicData });
  });
  await page.goto('/');
  await expect.poll(() => authenticated).toBeGreaterThan(0);
  await expect(page.locator('.header-profile')).toContainText('Test');
  await page.waitForTimeout(2000);
  await expect(page.locator('.header-profile')).toContainText('Test');
});

test('student changes the initial password in Profile and returns to sign-in', async ({ page }) => {
  await services(page);
  let authenticated = true,
    changed: unknown;
  await page.route('**/api/platform*', (route) => {
    if (route.request().method() === 'POST') {
      changed = route.request().postDataJSON();
      authenticated = false;
      return route.fulfill({ json: { ok: true, reauthenticate: true } });
    }
    return route.fulfill({
      json: authenticated
        ? { ...userData, user: { ...userData.user, mustChangePassword: true } }
        : publicData,
    });
  });
  await page.goto('/#profile');
  const form = page.locator('.password-editor');
  await expect(form).toContainText('Boshlang‘ich parolingiz 1111');
  await form.getByLabel('Joriy parol', { exact: true }).fill('1111');
  await form.getByLabel('Yangi parol', { exact: true }).fill('Personal-Password-123');
  await form.getByLabel('Yangi parolni takrorlang', { exact: true }).fill('mismatched-password');
  await form.getByRole('button', { name: 'Parolni o‘zgartirish', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('mos kelmadi');
  expect(changed).toBeUndefined();
  await form.getByLabel('Yangi parolni takrorlang', { exact: true }).fill('Personal-Password-123');
  await form.getByRole('button', { name: 'Parolni o‘zgartirish', exact: true }).click();
  await expect(page).toHaveURL(/#login$/);
  expect(changed).toEqual({
    action: 'legacyChangePassword',
    input: { currentPassword: '1111', newPassword: 'Personal-Password-123' },
  });
});

test('new student registration asks «Are you a student?», saves the group and uses the 1111 initial password', async ({
  page,
}) => {
  await services(page);
  let created: any;
  await page.route('**/api/platform*', (route) => route.fulfill({ json: publicData }));
  await page.route('**/students/*.json*', (route) => {
    if (route.request().method() === 'PUT') {
      created = route.request().postDataJSON();
      return route.fulfill({ json: created });
    }
    return route.fallback();
  });
  const activated: unknown[] = [];
  await page.route('**/api/student-activate', (route) => {
    activated.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true, status: 'ok' } });
  });
  await page.goto('/#login');
  await legacyReady(page);
  await page.getByRole('button', { name: 'Ro‘yxatdan o‘tish' }).click();
  await page.getByLabel('Ism', { exact: true }).fill('New');
  await page.getByLabel('Familiya').fill('Learner');
  await page.getByRole('button', { name: 'Davom etish' }).click();
  await page.getByRole('button', { name: /Ha, talabaman/ }).click();
  await page.getByLabel('Ro‘yxatdan tanlang').selectOption('AP-223');
  await page.getByRole('button', { name: 'Ro‘yxatdan o‘tish' }).click();
  // o'qituvchi tasdig'i yo'q: hisob shu zahoti faollashadi va sayt ochiladi
  await expect.poll(() => activated.length).toBe(1);
  expect(activated).toEqual([{ id: created.id }]);
  await expect(page.getByRole('button', { name: 'Kirilmoqda…' })).toBeVisible();
  expect(created.authVersion).toBe(1);
  expect(created.mustChangePassword).toBe(true);
  expect(created.credentialSetupVersion).toBe('default1111-v1');
  expect(created.total).toBe(0);
  expect(created).toMatchObject({
    name: 'New',
    surname: 'Learner',
    group: 'AP-223',
    learnerType: 'university',
  });
});

test('matching student names require an explicit group/account choice for 1111', async ({
  page,
}) => {
  await services(page);
  await page.route('**/students.json*', (route) =>
    route.fulfill({
      json: {
        test_other: { ...student, id: 'test_other', group: 'AP-224', total: 999 },
        [student.id]: student,
      },
    }),
  );
  await page.route('**/api/platform*', (route) =>
    route.fulfill({
      json: route.request().headers()['x-legacy-student'] === student.id ? userData : publicData,
    }),
  );
  await page.goto('/#login');
  await legacyReady(page);
  await signIn(page, student.name + ' ' + student.surname, '1111');
  const choice = page.getByLabel('Guruhingiz');
  await expect(choice).toBeVisible();
  await expect(choice.locator('option')).toHaveCount(3);
  expect(new URL(page.url()).hash).toBe('#login');
  await choice.selectOption(student.id);
  await page.getByRole('button', { name: 'Kirish', exact: true }).click();
  await expect(page.locator('.stat-card').filter({ hasText: 'Umumiy ball' })).toContainText(
    /375[.,]5/,
  );
});

test('a guest visiting ranking sees login without requesting any ranking data', async ({
  page,
}) => {
  await services(page);
  let rankingRequests = 0;
  await page.route('**/api/platform*', (route) => {
    if (new URL(route.request().url()).searchParams.get('view') === 'academic') rankingRequests++;
    return route.fulfill({ json: publicData });
  });
  // #ranking endi kurs ichidagi reytingga olib boradi; mehmon uchun reyting ma'lumoti so'ralmaydi
  await page.goto('/#ranking');
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.locator('.ranking-list')).toHaveCount(0);
  expect(rankingRequests).toBe(0);
});

test('an existing personal code continues to use the original credential verification path', async ({
  page,
}) => {
  await services(page);
  let sharedRequests = 0;
  await page.route('**/api/student-login', (route) => {
    sharedRequests++;
    return route.fulfill({ status: 403, json: { error: 'Not expected for personal code' } });
  });
  await page.route('**/api/platform*', (route) =>
    route.fulfill({
      json: route.request().headers()['x-legacy-student'] === student.id ? userData : publicData,
    }),
  );
  await page.goto('/#login');
  await legacyReady(page);
  await signIn(page, student.name + ' ' + student.surname, '1234');
  await expect(page.locator('.stat-card').filter({ hasText: 'Umumiy ball' })).toContainText(
    /375[.,]5/,
  );
  expect(sharedRequests).toBe(0);
});
