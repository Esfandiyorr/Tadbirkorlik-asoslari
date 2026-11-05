import { test, expect } from '@playwright/test';

test('the game page shows every original arena game as its own card', async ({ page }) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  await page.goto('/#arena', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.arena-card');
  await expect(cards.first()).toBeVisible();
  const names = (await page.locator('.arena-card-body b').allTextContents()).join(' | ');
  for (const name of [
    'Shashka',
    'Shaxmat',
    'To‘rttalik',
    'Sudoku',
    'Puzzle',
    'Jamoaviy puzzle',
    'So‘z topish',
    'Xotira kartalari',
    'Yozuv Marafoni',
    'Jonli test',
    'Krossvord yasash',
  ])
    expect(names).toContain(name);
  await expect(page.locator('.arena-feature')).toContainText('Brendni top');
  // Each card opens its own game inside the page.
  await cards.filter({ hasText: 'Krossvord yasash' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#arena/play/kross');
  await expect(page.locator('.native-arena .native-document')).toBeVisible();
  await page.getByRole('button', { name: 'Barcha o‘yinlar' }).click();
  await expect(page.locator('.arena-feature')).toBeVisible();
});

test('teachers and administrators enter the arena with their own player account', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-teacher' } });
  await page.goto('/#arena/play/puzzle', { waitUntil: 'domcontentloaded' });
  const arena = page.locator('.native-arena .native-document');
  await expect(arena).toContainText('Rasm tanlang');
  await expect(arena).not.toContainText('Mustaqil ta’lim');
  await expect(page.locator('.arena-note')).toContainText('o‘qituvchi sifatida');
  const player = await page.evaluate(() => JSON.parse(localStorage.getItem('terdu_staff_player')!));
  expect(player.id).toMatch(/^tc_/);
});

test('guess the brand: ten logos, timer, facts and a final score', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#arena/brand', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Boshlash/ }).click();
  await expect(page.locator('.bg-options button')).toHaveCount(4);
  await expect(page.locator('.bg-timer')).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.bg-progress')).toContainText(i + 1 + ' / 10');
    await page.keyboard.press('1');
    await expect(page.locator('.bg-fact')).toBeVisible();
    await expect(page.locator('.bg-fact p')).not.toBeEmpty();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.bg-done')).toContainText('10 tadan');
  await expect(page.locator('.bg-review > div')).toHaveCount(10);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
