import { test, expect, type Page } from '@playwright/test';
import { MONTHS, botDecision, replay, type Decision } from '../../lib/biznes';

/* 💼 «Biznes» o'yini: bot bilan 12 oy, kursdosh bilan jonli bellashuv (ikki brauzer, bitta sinov bazasi),
   arena ro'yxatidan taklif va raqib chiqib ketganda bot. Jonli baza o'rniga https://arena.test (demo rejimida
   window.__sqArenaBase orqali) — arena-online.spec.ts dagi kabi, lekin bir nechta sahifa bitta bazani ko'radi. */
type Tree = Record<string, any>;
async function fakeArena(page: Page, db: Tree) {
  const at = (path: string[], make = false) => {
    let node: Tree = db;
    for (const key of path.slice(0, -1)) {
      if (typeof node[key] !== 'object' || node[key] === null) {
        if (!make) return null;
        node[key] = {};
      }
      node = node[key];
    }
    return node;
  };
  const resolve = (v: any): any =>
    Array.isArray(v)
      ? v.map(resolve)
      : v && typeof v === 'object'
        ? v['.sv'] === 'timestamp'
          ? Date.now()
          : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x)]))
        : v;
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  await page.addInitScript(() => {
    (window as unknown as { __sqArenaBase: string }).__sqArenaBase = 'https://arena.test';
  });
  await page.route('https://arena.test/**', async (route) => {
    const req = route.request(),
      path = decodeURIComponent(new URL(req.url()).pathname)
        .replace(/^\/|\.json$/g, '')
        .split('/');
    const method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const parent = at(path, method === 'PUT'),
      key = path[path.length - 1];
    let body: any = null;
    // haqiqiy bazadagi kabi har javob — alohida nusxa (sahifa obyekti bazani o'zgartirib yubormasin)
    if (method === 'GET') body = parent ? (parent[key] ?? null) : null;
    else if (method === 'PUT') body = parent![key] = resolve(req.postDataJSON());
    else if (method === 'DELETE' && parent) delete parent[key];
    return route.fulfill({ status: 200, headers: cors, json: body });
  });
}
const login = (page: Page, id: string) => page.request.post('/api/auth/demo', { data: { id } });
const hash = (page: Page) => new URL(page.url()).hash;
/** Shu oydagi qaror: vaziyat bo'lsa — variant tanlanadi, so'ng yuboriladi. */
async function decide(page: Page, option: 'first' | 'last' = 'last') {
  await expect(page.locator('.bz-decide')).toBeVisible();
  const opts = page.locator('.bz-options [role="radio"]');
  if (await opts.count()) await (option === 'first' ? opts.first() : opts.last()).click();
  await page.locator('.bz-go').click();
}

test('a student plays a full 12-month Biznes game against the bot', async ({ page }) => {
  test.setTimeout(120000);
  await login(page, 'demo-student');
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  const banner = page.locator('.arena-feature-biz');
  await expect(banner).toContainText('Biznes');
  await banner.getByText('O‘ynash').click();
  await expect.poll(() => hash(page)).toBe('#arena/biznes');
  await page.getByRole('button', { name: 'Barcha o‘yinlar' }).click();
  await page.getByRole('button', { name: /^Biznes 12 oylik tadbirkorlik bellashuvi/ }).click();
  await expect.poll(() => hash(page)).toBe('#arena/biznes');
  await expect(page.locator('.bz-hero h2')).toContainText('12 oy — 12 raund');
  await page.getByRole('radio', { name: /Fast-fud/ }).click();
  await expect(page.getByRole('radio', { name: /Fast-fud/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('button', { name: '«Tez Start» (oson)' }).click();

  // 1-oy: xaridni o'yinchining o'zi hisoblaydi — standart xarid taxminiy talabdan kam, maslahatchi ogohlantiradi.
  await expect(page.locator('.bz-head h2')).toContainText('Fast-fud');
  await expect(page.locator('.bz-month')).toHaveText('Yanvar · 1 / 12');
  await expect(page.locator('.bz-tip')).toContainText('Zaxira taxminiy talabdan kam');
  const buy = page.getByRole('spinbutton', { name: /^Xarid/ });
  await buy.fill('4500');
  await expect(page.locator('.bz-tip')).not.toContainText('Zaxira taxminiy talabdan kam');
  await expect(page.locator('.bz-plan')).toContainText('63 mln');
  await page.locator('.bz-go').click();
  const report = page.locator('.bz-report');
  await expect(report.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti');
  await expect(report.locator('.bz-pl')).toContainText('Aylanma solig‘i (4%)');
  await expect(report.locator('.bz-pl-total')).toContainText('Sof foyda');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('biz_bot_v1')!));
  expect(saved).toMatchObject({ biz: 'fastfud', level: 0, seen: 0 });
  expect(saved.months[0][0]).toMatchObject({ buy: 4500, choice: 0 });

  // Sahifa yangilansa ham o'yin saqlanadi.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bz-continue')).toContainText('Tugallanmagan o‘yin: Fast-fud, 2-oy');
  await page.getByRole('button', { name: /Davom ettirish/ }).click();
  await expect(report.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti');
  await page.getByRole('button', { name: /Keyingi oy/ }).click();

  let warned = false;
  for (let m = 2; m <= 12; m++) {
    await expect(page.locator('.bz-month')).toContainText(m + ' / 12');
    const opts = page.locator('.bz-options [role="radio"]');
    // vaziyat tanlanmasa — oy boshlanmaydi
    if (!warned && (await opts.count())) {
      await page.locator('.bz-go').click();
      await expect(page.getByRole('alert').filter({ hasText: 'Avval vaziyat' })).toBeVisible();
      await expect(page.locator('.bz-event')).toHaveClass(/is-warn/);
      warned = true;
    }
    await decide(page, m % 2 ? 'first' : 'last');
    await expect(report.locator('#bz-rh')).toContainText('oy hisoboti');
    await page.getByRole('button', { name: m === 12 ? /Yakuniy natija/ : /Keyingi oy/ }).click();
  }
  expect(warned).toBe(true);
  const final = page.locator('.bz-final');
  await expect(final.locator('.bz-verdict')).toBeVisible();
  await expect(final.locator('.bz-verdict')).toHaveClass(/is-(win|loss|tie)/);
  await expect(final.locator('svg.bz-chart polyline')).toHaveCount(2);
  await expect(final.locator('.bz-compare')).toContainText('Sof kapital');
  await expect(final.locator('.bz-lessons li').first()).toBeVisible();
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('biz_best_v1')!));
  expect(typeof best.fastfud).toBe('number');
  await page.getByRole('button', { name: /Yana o‘ynash/ }).click();
  await expect(page.locator('.bz-continue')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /Fast-fud/ })).toContainText(
    'Eng yaxshi natijangiz',
  );
});

test('two classmates play Biznes live and see the same results', async ({ browser }) => {
  test.setTimeout(150000);
  const db: Tree = {};
  const a = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  const b = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await fakeArena(a, db);
  await fakeArena(b, db);
  await login(a, 'demo-student');
  await login(b, 'demo-teacher');

  // Madina xona ochadi va biznes turini tanlaydi.
  await a.goto('/#arena/biznes', { waitUntil: 'domcontentloaded' });
  await a.getByRole('button', { name: /Xona ochish/ }).click();
  await expect.poll(() => hash(a)).toMatch(/^#arena\/biznes\/[A-HJ-NP-Z2-9]{4}$/);
  const code = hash(a).slice('#arena/biznes/'.length);
  await expect(a.locator('.bz-code')).toContainText(code);
  expect(db.arena.biz[code].meta).toMatchObject({ v: 1, biz: 'kofe', host: 'demo-student' });
  expect(typeof db.arena.bizidx[code]).toBe('number');
  await a.getByRole('radio', { name: /Kiyim do‘koni/ }).click();
  await expect.poll(() => db.arena.biz[code].meta.biz).toBe('kiyim');

  // Ustoz kodni kiritib qo'shiladi — o'yin ikkalasida ham boshlanadi.
  await b.goto('/#arena/biznes', { waitUntil: 'domcontentloaded' });
  await b.getByRole('textbox', { name: 'Xona kodi' }).fill(code.toLowerCase());
  await b.getByRole('button', { name: /Qo‘shilish/ }).click();
  await expect.poll(() => hash(b)).toBe('#arena/biznes/' + code);
  for (const p of [a, b]) {
    await expect(p.locator('.bz-head h2')).toContainText('Kiyim do‘koni', { timeout: 20000 });
    await expect(p.getByRole('timer')).toContainText(/[12]:\d\d/);
  }
  await expect(a.locator('.bz-vs')).toContainText('Isfandiyor Sayfiddinov');
  await expect(b.locator('.bz-vs')).toContainText('Madina Ergasheva');
  expect(Object.keys(db.arena.biz[code].p).sort()).toEqual(['demo-student', 'tc_demo-teacher']);

  // Yanvar: Madina yuboradi va kutadi, so'ng ustoz yuboradi — ikkalasi bir xil hisobotni ko'radi.
  await decide(a);
  await expect(a.locator('.bz-wait')).toContainText('Isfandiyor Sayfiddinov qaror qilmoqda');
  expect(db.arena.biz[code].d.m1['demo-student']).toMatchObject({ choice: 0 });
  await decide(b);
  for (const p of [a, b])
    await expect(p.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti', { timeout: 20000 });
  const worthOf = async (p: Page) =>
    (await p.locator('.bz-report-top > div').nth(2).locator('b').textContent())!;
  const rivalOf = async (p: Page) =>
    (await p.locator('.bz-report-top > div').nth(2).locator('small').textContent())!;
  expect(await rivalOf(a)).toBe('Isfandiyor Sayfiddinov: ' + (await worthOf(b)));
  expect(await rivalOf(b)).toBe('Madina Ergasheva: ' + (await worthOf(a)));

  // Fevral–noyabr qarorlari bazaga yoziladi (ikkala tomonda bot) — sahifalar oyma-oy hisobotlarni ko'rsatadi.
  const room = db.arena.biz[code];
  const order = ['demo-student', 'tc_demo-teacher'];
  const months: [Decision, Decision][] = [[room.d.m1[order[0]], room.d.m1[order[1]]]];
  for (let m = 2; m <= 11; m++) {
    const g = replay(room.meta.biz, room.meta.seed, months);
    const pair: [Decision, Decision] = [botDecision(g, 0, 1), botDecision(g, 1, 2)];
    months.push(pair);
    room.d['m' + m] = { [order[0]]: pair[0], [order[1]]: pair[1] };
  }
  for (const p of [a, b])
    for (const [name] of MONTHS.slice(0, 11)) {
      await expect(p.locator('#bz-rh')).toHaveText('📊 ' + name + ': oy hisoboti', {
        timeout: 20000,
      });
      await p.getByRole('button', { name: /Keyingi oy/ }).click();
    }
  // Dekabr — oxirgi raund.
  for (const p of [a, b]) await expect(p.locator('.bz-month')).toHaveText('Dekabr · 12 / 12');
  await decide(a, 'first');
  await decide(b, 'first');
  for (const p of [a, b]) {
    await expect(p.locator('#bz-rh')).toHaveText('📊 Dekabr: oy hisoboti', { timeout: 20000 });
    await p.getByRole('button', { name: /Yakuniy natija/ }).click();
  }
  const verdict = async (p: Page) =>
    (await p.locator('.bz-verdict').getAttribute('class'))!.match(/is-(win|loss|tie)/)![1];
  const [va, vb] = [await verdict(a), await verdict(b)];
  expect({ win: 'loss', loss: 'win', tie: 'tie' }[va]).toBe(vb);
  // yakuniy jadval ikkala tomonda bir xil (ustunlar o'rni almashgan)
  const row = async (p: Page) =>
    (await p.locator('.bz-compare tbody tr').first().locator('td').allTextContents()).map((x) =>
      x.trim(),
    );
  expect(await row(a)).toEqual((await row(b)).reverse());
  await a.context().close();
  await b.context().close();
});

test('a classmate is invited to Biznes from the online list and invites open the game', async ({
  page,
}) => {
  const db: Tree = {};
  await fakeArena(page, db);
  const now = Date.now();
  db.arena = { on: { s1: { n: 'Ali', s: 'Valiyev', g: 'AP-223', st: 'idle', at: now } } };
  await login(page, 'demo-student');
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  const row = page.locator('.arena-online-list li').first();
  await row.getByRole('button', { name: /Taklif/ }).click();
  await row
    .getByRole('group', { name: 'O‘yinni tanlang' })
    .getByRole('button', { name: /Biznes/ })
    .click();
  await expect.poll(() => hash(page)).toMatch(/^#arena\/biznes\/[A-HJ-NP-Z2-9]{4}$/);
  const code = hash(page).slice('#arena/biznes/'.length);
  expect(db.arena.biz[code].meta).toMatchObject({
    host: 'demo-student',
    biz: 'kofe',
    to: 's1',
    toName: 'Ali Valiyev',
  });
  expect(db.arena.binv.s1['demo-student']).toMatchObject({ g: 'biz', code, n: 'Madina' });
  // eski arena o'qiydigan takliflar (arena/inv) ga yozilmaydi
  expect(db.arena.inv).toBeUndefined();
  const lobby = page.locator('.bz-lobby');
  await expect(lobby).toContainText('Ali Valiyevga taklif yuborildi');
  await lobby.getByRole('radio', { name: /Fast-fud/ }).click();
  await expect.poll(() => db.arena.biz[code].meta.biz).toBe('fastfud');
  db.arena.biz[code].meta.dec = 'Ali Valiyev';
  await expect(lobby.getByRole('alert')).toContainText('Ali Valiyev taklifni rad etdi.');
  await expect(lobby.getByRole('radio')).toHaveCount(0);
  await lobby.getByRole('button', { name: 'Bekor qilish' }).click();
  await expect.poll(() => hash(page)).toBe('#arena/biznes');
  expect(db.arena.biz[code]).toBeUndefined();

  // Kelgan «Biznes» taklifi: qabul qilinsa — o'yin ochiladi va talaba xonaga qo'shiladi.
  db.arena.biz.WXYZ = {
    meta: {
      v: 1,
      biz: 'kiyim',
      seed: 99,
      host: 's2',
      at: now,
      to: 'demo-student',
      toName: 'Madina Ergasheva',
    },
    p: { s2: { n: 'Olim', s: 'Karimov', g: 'AP-224', at: now } },
  };
  db.arena.binv = {
    'demo-student': {
      s2: { g: 'biz', code: 'WXYZ', n: 'Olim', s: 'Karimov', gr: 'AP-224', at: Date.now() },
    },
  };
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Olim Karimov');
  await expect(dialog).toContainText('Biznes');
  await dialog.getByRole('button', { name: /Qabul qilish/ }).click();
  await expect.poll(() => hash(page)).toBe('#arena/biznes/WXYZ');
  expect(db.arena.binv['demo-student'].s2).toBeUndefined();
  await expect(page.locator('.bz-head h2')).toContainText('Kiyim do‘koni');
  await expect(page.locator('.bz-vs')).toContainText('Olim Karimov');
  expect(db.arena.biz.WXYZ.p['demo-student']).toMatchObject({ n: 'Madina', s: 'Ergasheva' });
});

test('if the classmate disconnects, a bot can finish their moves', async ({ page }) => {
  const db: Tree = {};
  await fakeArena(page, db);
  const now = Date.now();
  db.arena = {
    biz: {
      QRST: {
        meta: { v: 1, biz: 'kofe', seed: 1234, host: 'demo-student', at: now },
        p: {
          'demo-student': { n: 'Madina', s: 'Ergasheva', at: now },
          s1: { n: 'Ali', s: 'Valiyev', at: now },
        },
        s: { s1: now - 120000 },
      },
    },
  };
  await login(page, 'demo-student');
  await page.goto('/#arena/biznes/QRST', { waitUntil: 'domcontentloaded' });
  await decide(page);
  const wait = page.locator('.bz-wait');
  await expect(wait).toContainText('Ali Valiyev qaror qilmoqda');
  await expect(wait.locator('.bz-alert')).toContainText('Ali Valiyev javob bermayapti');
  await wait.getByRole('button', { name: /Uning o‘rniga bot o‘ynasin/ }).click();
  await expect(page.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti', { timeout: 20000 });
  expect(db.arena.biz.QRST.d.m1.s1).toMatchObject({ bot: true });
  await page.getByRole('button', { name: /Keyingi oy/ }).click();
  await expect(page.locator('.bz-month')).toHaveText('Fevral · 2 / 12');
});
