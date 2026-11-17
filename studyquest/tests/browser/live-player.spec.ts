import { test, expect, type Page } from '@playwright/test';
import { khDay, khHM, makeGame, type Game } from '../../lib/live-quiz';

test('a guest joins through the real server API and keeps the same place after reloading', async ({
  page,
  playwright,
}) => {
  test.setTimeout(120000);
  const admin = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3200' });
  await admin.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  expect((await (await admin.get('/api/platform')).json()).mode).toBe('demo');
  const mutate = async (input: unknown) => {
    const r = await admin.post('/api/platform', { data: { action: 'liveAdmin', input } });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  const before = await (await admin.get('/api/platform?view=liveAdmin')).json();
  const marker = 'Live access ' + Date.now();
  const start = Math.ceil((Date.now() + 120000) / 60000) * 60000,
    day = khDay(start);
  let ids: string[] = [],
    created = false;
  try {
    const v = await mutate({
      op: 'import',
      questions: Array.from({ length: 4 }, (_, i) => ({
        t: marker + ' ' + i,
        o: ['Birinchi', 'Ikkinchi', 'Uchinchi', 'To‘rtinchi'],
        c: 0,
        tp: 'm9',
      })),
    });
    ids = v.bank
      .filter((x: { t: string }) => x.t.startsWith(marker))
      .map((x: { id: string }) => x.id);
    await mutate({ op: 'create', date: day, time: khHM(start), qsec: 15, note: marker, ids });
    created = true;
    await page.goto('/#arena');
    await page.locator('.arena-card').filter({ hasText: 'Jonli test' }).click();
    await expect(page).toHaveURL(/#arena\/play\/live$/);
    const stage = page.frameLocator('.arena-live-frame');
    await expect(stage.getByLabel('Ismingiz', { exact: true })).toBeVisible({ timeout: 35000 });
    await stage.getByLabel('Ismingiz', { exact: true }).fill('Guruhsiz mehmon');
    await stage.getByRole('button', { name: /⚡ Qo.shilish/, exact: true }).click();
    await expect(stage.locator('.lv-h')).toContainText(/Siz o.yindasiz/);
    const session = await (await page.request.get('/api/live?path=session')).json();
    const players = await (
      await page.request.get('/api/live?path=' + encodeURIComponent(`games/${day}/p`))
    ).json();
    expect(players.value[session.player.id]).toMatchObject({ n: 'Guruhsiz mehmon', g: '' });
    await page.reload();
    await expect(stage.locator('.lv-h')).toContainText(/Siz o.yindasiz/);
    expect((await (await page.request.get('/api/live?path=session')).json()).player.id).toBe(
      session.player.id,
    );
    await page.screenshot({ path: 'tests/artifacts/live-guest-lobby.png' });
  } finally {
    if (created) await mutate({ op: 'cancel', d: day });
    if (ids.length) await mutate({ op: 'delete', ids });
    // Keep the existing bank/configuration. Only this test's game and questions are removed.
    expect((await (await admin.get('/api/platform?view=liveAdmin')).json()).bank.length).toBe(
      before.bank.length,
    );
    await admin.dispose();
  }
});

async function stageFixture(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const initial = await (await page.request.get('/api/live?path=session')).json();
  const player = initial.player;
  const day = khDay(Date.now());
  const g = makeGame(
    day,
    { time: '20:00', qsec: 15 },
    Array.from({ length: 4 }, (_, i) => ({
      t: 'Restoran yoki kichik biznesda mijozga xizmat ko‘rsatishning ' + (i + 1) + '-savoli?',
      o: [
        'Mehmon ehtiyojini aniqlash',
        'Taxmin bilan javob berish',
        'Narxni aytmaslik',
        'Savolni e’tiborsiz qoldirish',
      ],
      c: 0,
    })),
    () => 0.4,
  );
  let now = g.meta.start - 60000;
  g.meta.open = now - 1000;
  g.p = {
    p2: { n: 'Boshqa ishtirokchi', g: '', at: now - 2000 },
    p3: { n: 'Uchinchi ishtirokchi', g: '', at: now - 1000 },
  };
  await page.clock.install({ time: now });
  await page.route('**/api/live**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      if (body.path === `games/${day}/p/${player.id}`) {
        g.p![player.id] = { n: body.value.n, g: '', at: now };
        await route.fulfill({ json: { value: g.p![player.id], now } });
        return;
      }
      const match = /\/a\/(\d+)\//.exec(body.path);
      expect(match).not.toBeNull();
      const i = Number(match![1]);
      ((g.a ??= {})[i] ??= {})[player.id] = { c: body.value.c, t: now };
      await route.fulfill({ json: { value: g.a![i][player.id], now } });
      return;
    }
    const path = new URL(req.url()).searchParams.get('path');
    let value: unknown;
    if (path === 'session') {
      await route.fulfill({ json: { player, now } });
      return;
    }
    if (path === 'clock') value = now;
    else if (path === 'idx') value = { [day]: { ...g.meta } };
    else if (path === `games/${day}/meta`) value = g.meta;
    else if (path === `games/${day}/p`) value = g.p;
    else if (path === `games/${day}/mine`) value = { joined: !!g.p?.[player.id], answers: {} };
    else if (path === `games/${day}`) value = g;
    else {
      const m = /\/(q|k|a)\/(\d+)$/.exec(path || '');
      expect(m).not.toBeNull();
      const kind = m![1] as 'q' | 'k' | 'a';
      value = g[kind]?.[Number(m![2])] || {};
    }
    await route.fulfill({ json: { value, now } });
  });
  return {
    g,
    player,
    advance: async (t: number) => {
      now = t;
      await page.clock.setSystemTime(t);
      await page.clock.runFor(1500);
    },
  };
}

test('the lobby, question, timer, result bars and winners keep their design on desktop and phone', async ({
  page,
}) => {
  const { g, player, advance } = await stageFixture(page);
  await page.goto('/#arena/play/live');
  const stage = page.frameLocator('.arena-live-frame');
  await stage.getByLabel('Ismingiz', { exact: true }).fill('Dizayn sinovi');
  await stage.getByRole('button', { name: /⚡ Qo.shilish/, exact: true }).click();
  await expect(stage.locator('.lv-h')).toContainText(/Siz o.yindasiz/);
  await expect(stage.locator('.lv')).not.toHaveCSS('background-image', 'none');
  await advance(g.q[0].at + 1000);
  await expect(stage.locator('.lv-a')).toHaveCount(4);
  for (const [i, color] of [
    'rgb(226, 27, 60)',
    'rgb(19, 104, 206)',
    'rgb(216, 158, 0)',
    'rgb(38, 137, 12)',
  ].entries())
    await expect(stage.locator('.lv-a').nth(i)).toHaveCSS('background-color', color);
  await expect(stage.locator('.lv-timer circle.fg')).toHaveCSS('fill', 'none');
  await expect(stage.locator('.lv-timer circle.fg')).toHaveCSS('stroke', 'rgb(255, 255, 255)');
  await page.screenshot({ path: 'tests/artifacts/live-question-desktop.png' });
  await stage.locator('.lv-a').nth(g.k[0].c).click();
  await expect(stage.locator('.lv-a:enabled')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(stage.locator('body')).toBeVisible();
  expect(
    await stage.locator('body').evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'tests/artifacts/live-question-mobile.png' });
  await page.setViewportSize({ width: 320, height: 640 });
  const frameBox = (await page.locator('.arena-live-frame').boundingBox())!;
  const navBox = (await page.locator('.bottom-nav').boundingBox())!;
  expect(frameBox.y + frameBox.height).toBeLessThanOrEqual(navBox.y);
  expect(
    await stage.locator('body').evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'tests/artifacts/live-question-small-phone.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await advance(g.k[0].cl + 2000);
  await expect(stage.locator('.lv-bars .lv-bar')).toHaveCount(4);
  await expect(stage.locator('.lv-okans')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/live-results-mobile.png' });
  for (let i = 0; i < g.meta.nq; i++) {
    ((g.a ??= {})[i] ??= {})[player.id] = { c: g.k[i].c, t: g.q[i].at + 500 };
    g.a![i].p2 = { c: g.k[i].c, t: g.q[i].at + 2000 };
    g.a![i].p3 = { c: (g.k[i].c + 1) % 4, t: g.q[i].at + 2000 };
  }
  await advance(g.meta.end + 1000);
  await expect(stage.getByRole('heading', { name: /G.oliblar/ })).toBeVisible();
  await expect(stage.locator('.lv-col.p1')).toContainText('Dizayn sinovi');
  await expect(stage.locator('.lv')).not.toContainText(/asosiy reytingga qo.shildi/);
  await page.screenshot({ path: 'tests/artifacts/live-winners-mobile.png' });
});

test('independent learners and every old live link reach the same styled page and can exit', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.route(/\/api\/platform(?:\?|$)/, async (route) => {
    const response = await route.fetch(),
      body = await response.json();
    if (body.user) {
      body.user.learnerType = 'independent';
      body.user.classId = '';
    }
    await route.fulfill({ response, json: body });
  });
  await stageFixture(page);
  await page.goto('/#arena');
  const card = page.locator('.arena-card').filter({ hasText: 'Jonli test' });
  await expect(card).toBeEnabled();
  await card.click();
  await expect(page.frameLocator('.arena-live-frame').locator('.lv')).toBeVisible();
  // The old class-arena entrance used to trap groupless learners on «Mustaqil ta’lim».
  await page.goto('/#arena/live');
  await page
    .locator('.native-arena')
    .getByRole('link', { name: 'Jonli testga o‘tish', exact: true })
    .click();
  await expect(page).toHaveURL(/#arena\/play\/live$/);
  for (const url of [
    '/arena.html#/live',
    '/legacy/arena.html#/live',
    '/?arena=%23%2Flive#arena/live',
    '/#arena/play/live',
  ]) {
    await page.goto(url);
    await expect(page).toHaveURL(/#arena\/play\/live$/);
    const stage = page.frameLocator('.arena-live-frame');
    await expect(stage.locator('.lv')).toBeVisible();
    await expect(page.locator('.native-arena')).toHaveCount(0);
    await stage.getByRole('link', { name: 'Arenaga qaytish', exact: true }).click();
    await expect(page).toHaveURL(/#arena$/);
  }
});
