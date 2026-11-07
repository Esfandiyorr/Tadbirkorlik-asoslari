import { test, expect, type Page } from '@playwright/test';
import {
  MONTHS,
  bizOf,
  botDecision,
  earned,
  forecast,
  planCash,
  replay,
  type Decision,
  type Setup,
} from '../../lib/biznes';

/* 💼 «Biznes» o'yini: biznes-reja va bot bilan 12 oy, kursdosh bilan jonli bellashuv (ikki brauzer, bitta sinov
   bazasi), arena ro'yxatidan taklif va raqib chiqib ketganda bot. Jonli baza o'rniga https://arena.test (demo
   rejimida window.__sqArenaBase orqali) — arena-online.spec.ts dagi kabi, lekin bir nechta sahifa bitta bazani ko'radi. */
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
const saved = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('biz_bot_v2') || 'null'));
/** Shu oydagi qaror: vaziyat bo'lsa — variant tanlanadi, so'ng yuboriladi. */
async function decide(page: Page, option: 'first' | 'last' = 'last') {
  await expect(page.locator('.bz-decide')).toBeVisible();
  const opts = page.locator('.bz-options [role="radio"]');
  if (await opts.count()) await (option === 'first' ? opts.first() : opts.last()).click();
  await page.locator('.bz-go').click();
}

test('a student makes a business plan and plays 12 months of Biznes against the bot', async ({
  page,
}) => {
  test.setTimeout(150000);
  await login(page, 'demo-student');
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  const banner = page.locator('.arena-feature-biz');
  await expect(banner).toContainText('biznes-reja');
  await banner.getByText('O‘ynash').click();
  await expect.poll(() => hash(page)).toBe('#arena/biznes');
  await page.getByRole('button', { name: 'Barcha o‘yinlar' }).click();
  await page.getByRole('button', { name: /^Biznes 12 oylik tadbirkorlik bellashuvi/ }).click();
  await expect.poll(() => hash(page)).toBe('#arena/biznes');
  await expect(page.locator('.bz-hero h2')).toContainText('100 mln so‘m');
  const shop = page.getByRole('radio', { name: /Gadjet do‘koni/ });
  await shop.click();
  await expect(shop).toHaveAttribute('aria-checked', 'true');
  await expect(shop).toContainText('Savdo · zaxira eskiradi');
  await expect(page.locator('.bz-bot')).toHaveCount(4);
  await page.getByRole('button', { name: /^Ehtiyotkor Anvar/ }).click();

  // 0-raund: biznes-reja. O'yin natijasi bir xil chiqishi uchun urug' (seed) sinovda belgilanadi —
  // sahifa yangilansa ham saqlangan o'yin davom etadi.
  await expect(page.locator('.bz-month')).toHaveText('Biznes-reja');
  const seed = 4242;
  await page.evaluate((s) => {
    const x = JSON.parse(localStorage.getItem('biz_bot_v2')!);
    localStorage.setItem('biz_bot_v2', JSON.stringify({ ...x, seed: s }));
  }, seed);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bz-continue')).toContainText(
    'Tugallanmagan o‘yin: Gadjet do‘koni, biznes-reja, raqib Ehtiyotkor Anvar',
  );
  await page.getByRole('button', { name: /Davom ettirish/ }).click();
  await expect(page.locator('.bz-head h2')).toContainText('Gadjet do‘koni');
  const budget = page.locator('.bz-plan');
  const left = budget.locator('.bz-total');
  await expect(left).toContainText('77,3 mln'); // bozor yonida, lizing, 3 kishi, 8 mln reklama
  await page.getByRole('radio', { name: /Universitet yonida/ }).click();
  await page.getByRole('radio', { name: /Yangi uskuna/ }).click();
  const more = page.getByRole('button', { name: 'Ko‘paytirish' }),
    less = page.getByRole('button', { name: 'Kamaytirish' });
  await more.click();
  await page.getByRole('spinbutton', { name: 'Ochilish reklamasi (mln)' }).fill('10');
  await expect(left).toContainText('56 mln');
  await expect(left).not.toHaveClass(/is-bad/);
  // pulni hammasini sarflab yuborsa — aylanma mablag' qolmaydi, maslahatchi ogohlantiradi
  for (let k = 0; k < 5; k++) await more.click();
  await expect(budget.locator('.bz-tip')).toContainText('Aylanma mablag‘ juda kam');
  await expect(left).toHaveClass(/is-bad/);
  for (let k = 0; k < 5; k++) await less.click();
  await expect(left).toContainText('56 mln');
  await page.getByRole('button', { name: /Biznesni ochish/ }).click();
  let save = await saved(page);
  expect(save).toMatchObject({ biz: 'gadjet', bot: 0, seed, months: [], seen: 0 });
  expect(save.setup[0]).toEqual({ loc: 'uni', equip: 'new', staff: 4, launch: 10 });

  // 1-oy: raqibning biznes-rejasi ko'rinadi. Hajmni o'yinchi o'zi hisoblaydi — standart hajm talabdan kam.
  await expect(page.locator('.bz-month')).toHaveText('Yanvar · 1 / 12');
  await expect(page.locator('.bz-rivalsetup')).toContainText('Ehtiyotkor Anvar ham ochildi');
  const plan = page.locator('.bz-plan');
  await expect(plan.locator('.bz-tip')).toContainText('Hajm taxminiy talabdan kam');
  await expect(page.locator('.bz-inv-eff').first()).toBeVisible();
  const g0 = replay('gadjet', seed, save.setup, []),
    b = bizOf('gadjet');
  const base: Decision = {
    price: b.price.ref,
    grade: 1,
    volume: 0,
    mkt: [2, 2, 2],
    staff: 4,
    buy: [],
    loan: 0,
    repay: 0,
    choice: 0,
  };
  const f = forecast(g0, 0, base);
  const fit = Math.round(Math.min(f.demand, f.capacity) / b.volStep) * b.volStep;
  await page.getByRole('spinbutton', { name: /^Xarid/ }).fill(String(fit));
  await expect(plan.locator('.bz-tip')).not.toContainText('Hajm taxminiy talabdan kam');
  const research = page.getByRole('button', { name: /Bozor tadqiqoti/ });
  await research.click();
  await expect(research).toHaveAttribute('aria-pressed', 'true');
  // pul yetmasa — reja ogohlantiradi va kerakli kreditni bir bosishda olish mumkin
  const cash = planCash(g0, 0, { ...base, volume: fit, buy: ['research'] });
  expect(cash.left).toBeLessThan(0);
  const short = Math.ceil(-cash.left / 5) * 5;
  await expect(plan.getByRole('alert')).toContainText('yetmayapti');
  await plan.getByRole('button', { name: `🏦 ${short} mln kredit olish` }).click();
  await expect(plan.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: /Oyni boshlash/ }).click();

  const report = page.locator('.bz-report');
  await expect(report.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti');
  await expect(report.locator('.bz-seg')).toHaveCount(3);
  await expect(report.locator('.bz-pl')).toContainText('Aylanma solig‘i (4%)');
  await expect(report.locator('.bz-pl-total')).toContainText('Sof foyda');
  await report.getByRole('tab', { name: 'Pul oqimi (kassa)' }).click();
  await expect(report.getByRole('tab', { name: 'Pul oqimi (kassa)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(report.locator('.bz-pl')).toContainText('Oy boshidagi kassa');
  await expect(report.locator('.bz-pl')).toContainText('Olingan kredit');
  await expect(report.locator('.bz-report-top > div').nth(2).locator('small')).toContainText(
    'Ehtiyotkor Anvar:',
  );
  save = await saved(page);
  expect(save.months[0][0]).toMatchObject({
    volume: fit,
    buy: ['research'],
    loan: short,
    choice: 0,
  });

  // Sahifa yangilansa ham o'yin saqlanadi; tadqiqot keyingi oy prognozini aniqlashtiradi.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bz-continue')).toContainText('Gadjet do‘koni, 2-oy');
  await page.getByRole('button', { name: /Davom ettirish/ }).click();
  await expect(report.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti');
  await page.getByRole('button', { name: /Keyingi oy/ }).click();
  await expect(page.locator('.bz-decide')).toContainText('tadqiqot: aniq');

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
    await expect(report.locator('.bz-lesson, .bz-pl').first()).toBeVisible();
    await page.getByRole('button', { name: m === 12 ? /Yakuniy natija/ : /Keyingi oy/ }).click();
  }
  expect(warned).toBe(true);
  const final = page.locator('.bz-final');
  await expect(final.locator('.bz-verdict')).toBeVisible();
  await expect(final.locator('.bz-verdict')).toHaveClass(/is-(win|loss|tie)/);
  await expect(final.locator('.bz-verdict')).toContainText('Sizning strategiyangiz');
  await expect(final.locator('svg.bz-chart polyline')).toHaveCount(2);
  await expect(final.locator('.bz-compare')).toContainText('Ishlab topilgan pul');
  await expect(final.locator('.bz-compare')).toContainText('Sof kapital');
  await expect(final.locator('.bz-skills')).toContainText('biznes-reja');
  // brauzer va server bir xil hisoblaydi: eng yaxshi natija — dvigatel natijasi bilan teng
  save = await saved(page);
  const end = replay('gadjet', seed, save.setup as [Setup, Setup], save.months);
  expect(end.over).toBe(true);
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('biz_best_v2')!));
  expect(best.gadjet).toBeCloseTo(earned(end.players[0]), 1);
  await page.getByRole('button', { name: /Yana o‘ynash/ }).click();
  await expect(page.locator('.bz-continue')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /Gadjet do‘koni/ })).toContainText(
    'Eng yaxshi natijangiz',
  );
});

test('two classmates make business plans and play Biznes live with the same results', async ({
  browser,
}) => {
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
  expect(db.arena.biz[code].meta).toMatchObject({ v: 2, biz: 'somsa', host: 'demo-student' });
  expect(typeof db.arena.bizidx[code]).toBe('number');
  db.arena.biz[code].meta.seed = 777; // natija oldindan ma'lum bo'lsin
  await a.getByRole('radio', { name: /O‘quv markazi/ }).click();
  await expect.poll(() => db.arena.biz[code].meta.biz).toBe('markaz');

  // Ustoz kodni kiritib qo'shiladi — ikkalasida ham biznes-reja bosqichi boshlanadi.
  await b.goto('/#arena/biznes', { waitUntil: 'domcontentloaded' });
  await b.getByRole('textbox', { name: 'Xona kodi' }).fill(code.toLowerCase());
  await b.getByRole('button', { name: /Qo‘shilish/ }).click();
  await expect.poll(() => hash(b)).toBe('#arena/biznes/' + code);
  for (const p of [a, b]) {
    await expect(p.locator('.bz-head h2')).toContainText('O‘quv markazi', { timeout: 20000 });
    await expect(p.locator('.bz-month')).toHaveText('Biznes-reja');
    await expect(p.getByRole('timer')).toContainText(/[34]:\d\d/);
  }
  await expect(a.locator('.bz-vs')).toContainText('Isfandiyor Sayfiddinov');
  await expect(b.locator('.bz-vs')).toContainText('Madina Ergasheva');
  expect(Object.keys(db.arena.biz[code].p).sort()).toEqual(['demo-student', 'tc_demo-teacher']);

  // Biznes-reja: Madina mahallada ochadi, ustoz — standart reja.
  await a.getByRole('radio', { name: /Mahalla ichida/ }).click();
  await a.getByRole('button', { name: /Biznes-rejani yuborish/ }).click();
  await expect(a.locator('.bz-wait')).toContainText('Isfandiyor Sayfiddinov biznes-reja tuzmoqda');
  expect(db.arena.biz[code].d.m0['demo-student']).toEqual({
    loc: 'mahalla',
    equip: 'lease',
    staff: 3,
    launch: 8,
  });
  await b.getByRole('button', { name: /Biznes-rejani yuborish/ }).click();
  for (const p of [a, b])
    await expect(p.locator('.bz-month')).toHaveText('Yanvar · 1 / 12', { timeout: 20000 });
  await expect(b.locator('.bz-rivalsetup')).toContainText('Madina Ergasheva ham ochildi');
  await expect(b.locator('.bz-rivalsetup')).toContainText('Mahalla ichida');
  await expect(a.locator('.bz-rivalsetup')).toContainText('Markaziy bozor yonida');

  // Yanvar: Madina yuboradi va kutadi, so'ng ustoz yuboradi — ikkalasi bir xil hisobotni ko'radi.
  await decide(a);
  await expect(a.locator('.bz-wait')).toContainText('Isfandiyor Sayfiddinov qaror qilmoqda');
  expect(db.arena.biz[code].d.m1['demo-student']).toMatchObject({ choice: 0, volume: 0 });
  await decide(b);
  for (const p of [a, b])
    await expect(p.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti', { timeout: 20000 });
  const moneyOf = async (p: Page) =>
    (await p.locator('.bz-report-top > div').nth(2).locator('b').textContent())!;
  const rivalOf = async (p: Page) =>
    (await p.locator('.bz-report-top > div').nth(2).locator('small').textContent())!;
  expect(await rivalOf(a)).toBe('Isfandiyor Sayfiddinov: ' + (await moneyOf(b)));
  expect(await rivalOf(b)).toBe('Madina Ergasheva: ' + (await moneyOf(a)));

  // Fevral–noyabr qarorlari bazaga yoziladi (ikkala tomonda bot) — sahifalar oyma-oy hisobotlarni ko'rsatadi.
  const room = db.arena.biz[code];
  const order = ['demo-student', 'tc_demo-teacher'];
  const setups = [room.d.m0[order[0]], room.d.m0[order[1]]] as [Setup, Setup];
  const months: [Decision, Decision][] = [[room.d.m1[order[0]], room.d.m1[order[1]]]];
  for (let m = 2; m <= 11; m++) {
    const g = replay(room.meta.biz, room.meta.seed, setups, months);
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
  // natija dvigatel bilan bir xil: 12 oy, g'olib ham bir xil
  const end = replay(room.meta.biz, room.meta.seed, setups, [
    ...months,
    [room.d.m12[order[0]], room.d.m12[order[1]]],
  ]);
  expect(end.over).toBe(true);
  expect(va).toBe(end.winner === 0 ? 'win' : end.winner === 1 ? 'loss' : 'tie');
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
    v: 2,
    host: 'demo-student',
    biz: 'somsa',
    to: 's1',
    toName: 'Ali Valiyev',
  });
  expect(db.arena.binv.s1['demo-student']).toMatchObject({ g: 'biz', code, n: 'Madina' });
  // eski arena o'qiydigan takliflar (arena/inv) ga yozilmaydi
  expect(db.arena.inv).toBeUndefined();
  const lobby = page.locator('.bz-lobby');
  await expect(lobby).toContainText('Ali Valiyevga taklif yuborildi');
  await lobby.getByRole('radio', { name: /Gadjet do‘koni/ }).click();
  await expect.poll(() => db.arena.biz[code].meta.biz).toBe('gadjet');
  db.arena.biz[code].meta.dec = 'Ali Valiyev';
  await expect(lobby.getByRole('alert')).toContainText('Ali Valiyev taklifni rad etdi.');
  await expect(lobby.getByRole('radio')).toHaveCount(0);
  await lobby.getByRole('button', { name: 'Bekor qilish' }).click();
  await expect.poll(() => hash(page)).toBe('#arena/biznes');
  expect(db.arena.biz[code]).toBeUndefined();

  // Kelgan «Biznes» taklifi: qabul qilinsa — o'yin ochiladi, talaba xonaga qo'shiladi va biznes-reja tuzadi.
  db.arena.biz.WXYZ = {
    meta: {
      v: 2,
      biz: 'markaz',
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
  await expect(page.locator('.bz-head h2')).toContainText('O‘quv markazi');
  await expect(page.locator('.bz-month')).toHaveText('Biznes-reja');
  await expect(page.locator('.bz-vs')).toContainText('Olim Karimov');
  expect(db.arena.biz.WXYZ.p['demo-student']).toMatchObject({ n: 'Madina', s: 'Ergasheva' });

  // Eski versiyadagi xona ochilmaydi — yangi xona ochish so'raladi.
  db.arena.biz.ESKV = {
    meta: { v: 1, biz: 'kofe', seed: 5, host: 's2', at: now },
    p: { s2: { n: 'Olim', s: 'Karimov', at: now } },
  };
  await page.goto('/#arena/biznes/ESKV', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/eski versiyasida ochilgan/)).toBeVisible();
  await expect(page.locator('.bz-month')).toHaveCount(0);
  expect(db.arena.biz.ESKV.p['demo-student']).toBeUndefined();
});

test('if the classmate disconnects, a bot makes their plan and moves', async ({ page }) => {
  const db: Tree = {};
  await fakeArena(page, db);
  const now = Date.now();
  db.arena = {
    biz: {
      QRST: {
        meta: { v: 2, biz: 'somsa', seed: 1234, host: 'demo-student', at: now },
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
  await page.getByRole('button', { name: /Biznes-rejani yuborish/ }).click();
  const wait = page.locator('.bz-wait');
  await expect(wait).toContainText('Ali Valiyev biznes-reja tuzmoqda');
  await expect(wait.locator('.bz-alert')).toContainText('Ali Valiyev javob bermayapti');
  await wait.getByRole('button', { name: /Uning o‘rniga bot o‘ynasin/ }).click();
  await expect(page.locator('.bz-month')).toHaveText('Yanvar · 1 / 12', { timeout: 20000 });
  expect(db.arena.biz.QRST.d.m0.s1).toMatchObject({ bot: true });
  await expect(page.locator('.bz-rivalsetup')).toContainText('Ali Valiyev ham ochildi');
  // bot keyingi oylarda ham uning o'rniga o'ynaydi
  await decide(page);
  await expect(page.locator('#bz-rh')).toHaveText('📊 Yanvar: oy hisoboti', { timeout: 20000 });
  expect(db.arena.biz.QRST.d.m1.s1).toMatchObject({ bot: true });
  await page.getByRole('button', { name: /Keyingi oy/ }).click();
  await expect(page.locator('.bz-month')).toHaveText('Fevral · 2 / 12');
});
