import { test, expect, type Browser, type Page } from '@playwright/test';
import BANK from '../../lib/race-questions.json';

/* 🏁 Jamoaviy poyga (/poyga): talabalar havola bilan kirib ismini yozadi — boshlanganda 2–5 kishilik jamoalarga
   avtomatik bo'linadi (yoki o'zlari tanlaydi); javoblar mashinalarni yuritadi; administrator bugungi jonli testni
   poyga bilan almashtiradi — u o'sha vaqtda o'zi boshlanadi. */
type Q = { q: string; a: string[]; c: number };
const bank = BANK as Q[];
const tashkent = (ms: number) => {
  const iso = new Date(ms + 18000000).toISOString();
  return { d: iso.slice(0, 10), t: iso.slice(11, 16) };
};
async function open(browser: Browser, who?: string, phone = false) {
  const context = await browser.newContext(
    phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {},
  );
  const page = await context.newPage();
  if (who) await page.request.post('/api/auth/demo', { data: { id: who } });
  await page.goto('/poyga', { waitUntil: 'domcontentloaded' });
  return page;
}
/** Ko'rinib turgan savolning to'g'ri (yoki ataylab noto'g'ri) varianti. */
async function choose(page: Page, right: boolean) {
  const card = page.locator('.race-question');
  await expect(card).toBeVisible();
  const text = (await card.locator('h2').textContent())!.trim();
  const shown = (await card.locator('.race-opt span').allTextContents()).map((s) => s.trim());
  const q = bank.find((x) => x.q === text && x.a.every((o) => shown.includes(o)))!;
  expect(q, text).toBeTruthy();
  const pick = right ? q.a[q.c] : q.a.find((o, k) => k !== q.c)!;
  await card.locator('.race-opt').filter({ hasText: pick }).first().click();
}

test('auto teams: students only type a name, the start splits them into teams of 2–5 and answers move the cars', async ({
  browser,
}) => {
  const teacher = await open(browser, 'demo-teacher');
  // oldingi poyga hali ketayotgan bo'lsa «Yangi o'yin» va «To'xtatish» tasdiq so'raydi
  teacher.on('dialog', (d) => d.accept());
  await expect(teacher.getByRole('heading', { name: 'O‘qituvchi boshqaruvi' })).toBeVisible();
  await expect(teacher.getByLabel(/Jamoalarga avtomatik bo‘lish/)).toBeChecked();
  await teacher.getByRole('button', { name: 'Yangi o‘yin' }).click();
  await expect(teacher.locator('.race-track.is-empty')).toContainText('avtomatik tuziladi');

  // 4 talaba: faqat ism — jamoa tanlanmaydi
  const names = ['Ali Valiyev', 'Bek', 'Gulnoza', 'Dilshod'];
  const students: Page[] = [];
  for (const [i, n] of names.entries()) {
    const p = await open(browser, undefined, i === 1);
    await expect(p.getByRole('heading', { name: 'Poygaga qo‘shiling' })).toBeVisible();
    await expect(p.locator('.race-team-btn')).toHaveCount(0);
    await p.getByLabel('Ismingiz').fill(n);
    await p.getByRole('button', { name: /Poygaga qo‘shilish/ }).click();
    await expect(p.locator('.race-lobby h2')).toContainText('Siz ro‘yxatdasiz');
    students.push(p);
  }
  await expect(students[0].locator('.race-joined li')).toHaveCount(4);
  await expect(teacher.locator('.race-host > .race-note')).toContainText('4 kishi qo‘shildi');
  expect(
    await students[1].evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);

  // boshlanadi — 4 kishi → 2 jamoa, 2 kishidan
  await teacher.getByRole('button', { name: 'Boshlash' }).click();
  await expect(teacher.locator('.race-lane')).toHaveCount(2);
  await expect(teacher.locator('.race-team-list')).toHaveCount(2);
  for (const list of await teacher.locator('.race-team-list ol').all())
    await expect(list.locator('li')).toHaveCount(2);
  const ali = students[0];
  await expect(ali.locator('.race-q-head')).toContainText('1 / 30');
  await expect(ali.locator('.race-myteam')).toContainText(/jamoa/);
  await expect(ali.locator('.race-lane.is-mine')).toHaveCount(1);
  await choose(ali, true);
  await expect(ali.locator('.race-fb')).toContainText(/To‘g‘ri! \+\d+ ball/);
  await expect
    .poll(async () =>
      (
        await teacher
          .locator('.race-car-pos')
          .evaluateAll((els) => els.map((e) => (e as HTMLElement).style.left))
      ).some((l) => !l.includes('* 0)')),
    )
    .toBe(true);

  // kech kelgan ham qo'shila oladi — darhol savol
  const late = await open(browser);
  await late.getByLabel('Ismingiz').fill('Kech qolgan');
  await late.getByRole('button', { name: /Poygaga qo‘shilish/ }).click();
  await expect(late.locator('.race-question')).toBeVisible();

  // o'qituvchi to'xtatadi — Ali jamoasi yutadi
  await teacher.getByRole('button', { name: 'To‘xtatish' }).click();
  await expect(ali.locator('.race-finish-card')).toContainText('yutdi!');
  await expect(ali.locator('.race-finish-card')).toContainText('jamoangiz g‘olib');
  await expect(teacher.locator('.race-lane.is-winner')).toHaveCount(1);
});

test('pick mode: the teacher turns automatic teams off and students choose one of two teams', async ({
  browser,
}) => {
  const teacher = await open(browser, 'demo-teacher');
  teacher.on('dialog', (d) => d.accept());
  await teacher.getByLabel(/Jamoalarga avtomatik bo‘lish/).uncheck();
  await teacher.getByRole('button', { name: 'Yangi o‘yin' }).click();
  await expect(teacher.locator('.race-lane')).toHaveCount(2);
  const s = await open(browser);
  await s.getByLabel('Ismingiz').fill('Ali');
  await s.getByRole('button', { name: /Yashil jamoa/ }).click();
  await expect(s.locator('.race-lobby h2')).toContainText('Yashil jamoa');
  await s.getByRole('button', { name: 'Binafsha jamoaga o‘tish' }).click();
  await expect(s.locator('.race-lobby h2')).toContainText('Binafsha jamoa');
  // tozalash: keyingi sinovlar uchun avtomatik o'yin
  await teacher.getByLabel(/Jamoalarga avtomatik bo‘lish/).check();
  await teacher.getByRole('button', { name: 'Yangi o‘yin' }).click();
});

test('the administrator replaces today’s live quiz with a race: it is announced and starts by itself at that time', async ({
  page,
  browser,
}) => {
  await page.route('**/api/platform?view=news', (route) => route.continue());
  await page.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
  const live = (input: unknown) =>
    page.request.post('/api/platform', { data: { action: 'liveAdmin', input } });
  // jonli test: 45 daqiqadan keyin
  expect(
    (
      await live({
        op: 'import',
        questions: Array.from({ length: 5 }, (_, i) => ({
          t: `Poyga sinovi savoli ${i + 1}: qaysi javob to‘g‘ri?`,
          o: ['To‘g‘ri ' + i, 'Xato A' + i, 'Xato B' + i, 'Xato C' + i],
          c: 0,
          tp: 'm1',
        })),
      })
    ).ok(),
  ).toBe(true);
  const at = tashkent(Date.now() + 45 * 60000);
  const bankIds = (
    (await (await page.request.get('/api/platform?view=liveAdmin')).json()) as {
      bank: { id: string; t: string }[];
    }
  ).bank
    .filter((q) => q.t.startsWith('Poyga sinovi'))
    .map((q) => q.id);
  expect(
    (await live({ op: 'create', date: at.d, time: at.t, qsec: 15, note: '', ids: bankIds })).ok(),
  ).toBe(true);
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Jonli test' }).click();
  const row = page.locator('.bo-list li').filter({ hasText: at.t }).first();
  await expect(row).toContainText('Siz tuzgan o‘yin');
  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: /Poyga bilan almashtirish/ }).click();
  await expect(page.getByText(/Jonli test o‘rniga jamoaviy poyga qo‘yildi/)).toBeVisible();
  await expect(page.locator('.bo-list li').filter({ hasText: at.t })).toHaveCount(0);

  // e'lonlar: keyingi o'yin — poyga; talaba sahifasida boshlanish vaqti va teskari sanoq
  const news = await (await page.request.get('/api/platform?view=news')).json();
  expect(news.live).toMatchObject({ type: 'race' });
  const s = await open(browser, 'demo-student');
  await expect(s.locator('.race-plan')).toContainText(at.t);
  await expect(s.locator('.race-timer.is-soon')).toBeVisible();
  await s.getByLabel('Ismingiz').fill('Madina');
  await s.getByRole('button', { name: /Poygaga qo‘shilish/ }).click();
  await expect(s.locator('.race-lobby')).toContainText(`${at.t} da o‘zi boshlanadi`);
  // bosh sahifadagi «Eslatmalar»da ham poyga (agar bugun bo'lsa)
  if (at.d === tashkent(Date.now()).d) {
    await s.goto('/#home', { waitUntil: 'domcontentloaded' });
    await expect(s.locator('.home-banner')).toContainText('Jamoaviy poyga');
  }

  // tozalash: rejali poyga o'rniga oddiy o'yin (e'lonlarda poyga qolmasin)
  const t = await open(browser, 'demo-teacher');
  t.on('dialog', (d) => d.accept());
  await t.getByRole('button', { name: 'Yangi o‘yin' }).click();
  await expect(t.locator('.race-host > .race-note')).toContainText('Kutish xonasi');
  const after = await (await page.request.get('/api/platform?view=news')).json();
  expect(after.live?.type).not.toBe('race');
});
