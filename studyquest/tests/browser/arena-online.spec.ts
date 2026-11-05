import { test, expect, type Page } from '@playwright/test';

/* «Hozir arenada onlayn»: yangi sahifa eski arena bilan bir xil yozuvlardan foydalanadi (arena/on, arena/inv, arena/rooms).
   Jonli baza o'rniga sinov bazasi: https://arena.test (faqat demo rejimida window.__sqArenaBase orqali). */
type Tree = Record<string, any>;
async function fakeArena(page: Page) {
  const db: Tree = {};
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
    if (method === 'GET') body = parent ? (parent[key] ?? null) : null;
    else if (method === 'PUT') body = parent![key] = resolve(req.postDataJSON());
    else if (method === 'DELETE' && parent) delete parent[key];
    return route.fulfill({ status: 200, headers: cors, json: body });
  });
  return db;
}

test('students see who is online in the arena and invite one of them to a duel', async ({
  page,
}) => {
  const db = await fakeArena(page);
  const now = Date.now();
  db.arena = {
    on: {
      s1: { n: 'Ali', s: 'Valiyev', g: 'AP-223', st: 'idle', at: now },
      s2: { n: 'Olim', s: 'Karimov', g: 'AP-224', st: 'busy', at: now },
      old: { n: 'Eski', s: 'Kirish', g: 'AP-223', st: 'idle', at: now - 120000 },
    },
  };
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  const panel = page.locator('.arena-online');
  await expect(panel.locator('h2')).toContainText('Hozir arenada onlayn');
  await expect(panel.locator('.arena-online-count')).toHaveText('2');
  const rows = panel.locator('.arena-online-list li');
  await expect(rows).toHaveCount(2);
  // Bo'sh talaba birinchi, o'yindagisiga taklif yuborib bo'lmaydi, 45 soniyadan eski yozuv ko'rinmaydi.
  await expect(rows.nth(0)).toContainText('Ali Valiyev');
  await expect(rows.nth(0)).toContainText('bo‘sh');
  await expect(rows.nth(1)).toContainText('o‘yinda');
  await expect(rows.nth(1).getByRole('button', { name: /Taklif/ })).toBeDisabled();
  await expect(panel).not.toContainText('Eski');
  // Men ham onlayn ro'yxatdaman (server vaqti bilan).
  await expect.poll(() => db.arena.on['demo-student']?.st).toBe('idle');
  expect(db.arena.on['demo-student']).toMatchObject({ n: 'Madina', s: 'Ergasheva', g: 'AP-223' });

  await rows
    .nth(0)
    .getByRole('button', { name: /Taklif/ })
    .click();
  const pick = rows.nth(0).getByRole('group', { name: 'O‘yinni tanlang' });
  await expect(pick.getByRole('button')).toHaveText([
    /Shashka/,
    /Shaxmat/,
    /To‘rttalik/,
    /Puzzle duel/,
    '',
  ]);
  await pick.getByRole('button', { name: /Shashka/ }).click();
  await expect.poll(() => new URL(page.url()).hash).toMatch(/^#arena\/room\/[A-HJ-NP-Z2-9]{4}$/);
  const code = new URL(page.url()).hash.slice('#arena/room/'.length);
  expect(db.arena.rooms[code].meta).toMatchObject({
    host: 'demo-student',
    games: ['dama'],
    max: 2,
    pub: false,
    duel: { to: 's1', toName: 'Ali Valiyev' },
    status: 'lobby',
  });
  expect(db.arena.rooms[code].players['demo-student'].ready).toBe(1);
  expect(db.arena.inv.s1['demo-student']).toMatchObject({ g: 'dama', code, n: 'Madina' });
  expect(typeof db.arena.inv.s1['demo-student'].at).toBe('number');
  // Eski arena shu xonani ochadi; sahifadan chiqqanda «onlayn» yozuvi o'chiriladi.
  await expect(page.locator('.arena-bar h1')).toContainText('Juftlik o‘yini');
  await expect(page.locator('.native-arena iframe')).toHaveAttribute(
    'src',
    new RegExp('#/room/' + code + '$'),
  );
  await expect.poll(() => db.arena.on['demo-student']).toBeUndefined();
});

test('an invite pops up with accept and decline, and stale invites are dropped', async ({
  page,
}) => {
  const db = await fakeArena(page);
  db.arena = { on: {}, inv: {}, rooms: { ABCD: { meta: { host: 's1' } } } };
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.arena-online-empty')).toContainText('boshqa hech kim');
  db.arena.inv['demo-student'] = {
    s1: { g: 'chess', code: 'ABCD', n: 'Ali', s: 'Valiyev', gr: 'AP-223', at: Date.now() },
    s9: { g: 'dama', code: 'ZZZZ', n: 'Kech', s: 'Qolgan', gr: '', at: Date.now() - 120000 },
  };
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Ali Valiyev');
  await expect(dialog).toContainText('Shaxmat');
  await expect(dialog.getByRole('button', { name: /Qabul qilish/ })).toBeFocused();
  await expect.poll(() => db.arena.inv['demo-student'].s9).toBeUndefined();
  await dialog.getByRole('button', { name: /Rad etish/ }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => db.arena.rooms.ABCD.meta.dec).toBe('Madina Ergasheva');
  expect(db.arena.inv['demo-student'].s1).toBeUndefined();

  db.arena.inv['demo-student'].s2 = {
    g: 'c4',
    code: 'EFGH',
    n: 'Olim',
    s: 'Karimov',
    gr: 'AP-224',
    at: Date.now(),
  };
  await expect(dialog).toContainText('To‘rttalik');
  await dialog.getByRole('button', { name: /Qabul qilish/ }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#arena/room/EFGH');
  expect(db.arena.inv['demo-student'].s2).toBeUndefined();
});
