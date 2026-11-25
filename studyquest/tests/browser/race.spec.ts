import { test, expect, type Browser, type Page } from '@playwright/test';
import BANK from '../../lib/race-questions.json';

/* 🏁 Jamoaviy poyga (/poyga): talabalar havola bilan kirib jamoa tanlaydi, o'qituvchi boshlaydi,
   javoblar mashinalarni yuritadi, o'qituvchi to'xtatsa — g'olib chiqadi. */
type Q = { q: string; a: string[]; c: number };
const bank = BANK as Q[];
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

test('two teams race: students join by link, the teacher starts and stops, answers move the cars', async ({
  browser,
}) => {
  const teacher = await open(browser, 'demo-teacher');
  // oldingi poyga hali ketayotgan bo'lsa «Yangi o'yin» va «To'xtatish» tasdiq so'raydi
  teacher.on('dialog', (d) => d.accept());
  await expect(teacher.getByRole('heading', { name: 'O‘qituvchi boshqaruvi' })).toBeVisible();
  await expect(teacher.locator('.race-link')).toContainText('/poyga');
  await teacher.getByRole('button', { name: 'Yangi o‘yin' }).click();
  await expect(teacher.getByRole('button', { name: 'Boshlash' })).toBeEnabled();
  await expect(teacher.locator('.race-lane')).toHaveCount(2);

  // talabalar kirmasdan, havola bilan qo'shiladi
  const ali = await open(browser);
  await expect(ali.getByRole('heading', { name: 'Poygaga qo‘shiling' })).toBeVisible();
  await ali.getByRole('button', { name: /Yashil jamoa/ }).click();
  await expect(ali.locator('.race-err')).toContainText('ismingizni');
  await ali.getByLabel('Ismingiz').fill('Ali Valiyev');
  await ali.getByRole('button', { name: /Yashil jamoa/ }).click();
  await expect(ali.locator('.race-lobby h2')).toContainText('Yashil jamoa');

  const bek = await open(browser, undefined, true);
  await bek.getByLabel('Ismingiz').fill('Bek');
  await bek.getByRole('button', { name: /Yashil jamoa/ }).click();
  // kutish xonasida jamoani almashtirsa bo'ladi
  await bek.getByRole('button', { name: 'Binafsha jamoaga o‘tish' }).click();
  await expect(bek.locator('.race-lobby h2')).toContainText('Binafsha jamoa');
  expect(await bek.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await expect(teacher.locator('.race-host > .race-note')).toContainText('2 kishi qo‘shildi');
  await teacher.getByRole('button', { name: 'Boshlash' }).click();
  await expect(teacher.locator('.race-timer')).toContainText(/⏱ [56]:\d\d/);

  // Ali to'g'ri javob beradi — ball oladi, yashil mashina oldinga yuradi
  await expect(ali.locator('.race-q-head')).toContainText('1 / 30');
  await choose(ali, true);
  await expect(ali.locator('.race-fb')).toContainText(/To‘g‘ri! \+\d+ ball/);
  await expect(ali.locator('.race-q-head')).toContainText('2 / 30');
  await choose(ali, true);
  await expect(ali.locator('.race-mine')).toContainText(/^(1[0-9]|20) ball$/);
  await expect
    .poll(() =>
      teacher.locator('.race-lane').first().locator('.race-car-pos').getAttribute('style'),
    )
    .not.toContain('* 0)');

  // Bek noto'g'ri javob beradi — to'g'risi ko'rsatiladi
  await choose(bek, false);
  await expect(bek.locator('.race-fb')).toContainText('Noto‘g‘ri');
  await expect(bek.locator('.race-opt.is-right')).toHaveCount(1);
  await expect(bek.locator('.race-opt.is-wrong')).toHaveCount(1);

  // o'qituvchi to'xtatadi — oldindagi jamoa yutadi
  await teacher.getByRole('button', { name: 'To‘xtatish' }).click();
  await expect(ali.locator('.race-finish-card h2')).toContainText('Yashil jamoa yutdi!');
  await expect(ali.locator('.race-finish-card')).toContainText('jamoangiz g‘olib');
  await expect(bek.locator('.race-finish-card')).toContainText('keyingi safar');
  await expect(teacher.locator('.race-lane.is-winner')).toHaveCount(1);
});
