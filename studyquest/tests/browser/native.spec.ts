import { test, expect } from '@playwright/test';

async function student(page: import('@playwright/test').Page) {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
}
async function scoredDemo(page: import('@playwright/test').Page) {
  await page.route('**/legacy/demo-guard.js', async (route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace(
        'var memory = new Map();',
        'var memory = new Map(); memory.set("terdu_acc",JSON.stringify(Object.fromEntries(Array.from({length:15},(_,i)=>["m"+(i+1),{lim:false,at:Date.now()}]))));',
      )
      .replace("learnerType: 'independent'", "learnerType: 'university'")
      .replace("status: 'pending'", "status: 'ok'")
      .replace('t.read = true', 't.read = false');
    await route.fulfill({ response, body });
  });
}
async function lastSlide(page: import('@playwright/test').Page) {
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  let counter = (await page.locator('.reader-counter').innerText()).match(/(\d+)\s*\/\s*(\d+)/)!;
  while (Number(counter[1]) < Number(counter[2])) {
    const next = Number(counter[1]) + 1;
    await page.locator('.reader-controls').getByRole('button', { name: 'Keyingi' }).click();
    await expect(page.locator('.reader-counter')).toContainText(next + ' / ' + counter[2]);
    counter = (await page.locator('.reader-counter').innerText()).match(/(\d+)\s*\/\s*(\d+)/)!;
  }
}

test('all fifteen presentations render in the native document with no visible old interface', async ({
  page,
}) => {
  test.setTimeout(180000);
  await student(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (let n = 1; n <= 15; n++) {
    await page.goto('/#lesson/m' + n);
    await expect(page.locator('.native-document > .inner')).toBeVisible();
    expect((await page.locator('.native-document').innerText()).length).toBeGreaterThan(80);
    expect(
      await page
        .locator('.native-document script, .native-document style, .native-document .topbar')
        .count(),
    ).toBe(0);
    // 7-mavzu ham endi boshqa taqdimotlar kabi asl dvigatel orqali ochiladi (PDF o'quvchisi olib tashlandi).
    const engine = await page.locator('iframe[data-native-engine]').boundingBox();
    expect(engine!.x + engine!.width).toBeLessThan(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: 'tests/artifacts/native-presentation-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('original timed quiz runs through native controls and preserves answer locking', async ({
  page,
}) => {
  await student(page);
  await scoredDemo(page);
  await page.goto('/#lesson/m1');
  await lastSlide(page);
  await page.locator('.native-document #qtGo').click();
  await page
    .locator('.native-dialog')
    .getByRole('button', { name: 'Davom etish', exact: true })
    .click();
  await expect(page.locator('.native-document .qbox')).toHaveCount(15);
  await page.locator('.native-document .qbox').first().locator('button.opt').first().click();
  await expect(
    page.locator('.native-document .qbox').first().locator('button.opt').first(),
  ).toBeDisabled();
  await expect(page.locator('.native-document .qbox').first().locator('.fb')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/native-quiz-desktop.png', fullPage: true });
});

test('answering a question lower in the quiz keeps the page where it was', async ({ page }) => {
  await student(page);
  await scoredDemo(page);
  await page.goto('/#lesson/m1');
  await lastSlide(page);
  await page.locator('.native-document #qtGo').click();
  await page
    .locator('.native-dialog')
    .getByRole('button', { name: 'Davom etish', exact: true })
    .click();
  const scroller = page.locator('.native-surface').first();
  // Test har javobdan keyin barcha savollarni qayta chizadi — sahifa tepaga sakramasligi kerak.
  for (const n of [5, 12]) {
    const question = page.locator('.native-document .qbox').nth(n - 1);
    await question.scrollIntoViewIfNeeded();
    const top = await scroller.evaluate((el) => el.scrollTop);
    const y = (await question.boundingBox())!.y;
    expect(top).toBeGreaterThan(500);
    await question.locator('button.opt').nth(1).click();
    await expect(question.locator('button.opt').nth(1)).toBeDisabled();
    await expect(question.locator('.fb')).toBeVisible();
    expect(Math.abs((await scroller.evaluate((el) => el.scrollTop)) - top)).toBeLessThan(4);
    expect(Math.abs((await question.boundingBox())!.y - y)).toBeLessThan(4);
  }
  // Fokus hujjat ichida qoladi (sahifa boshiga qaytmaydi).
  expect(await page.evaluate(() => !!document.activeElement?.closest('.native-document'))).toBe(
    true,
  );
});

test('class arena is rendered in the new native design', async ({ page }) => {
  await student(page);
  await page.goto('/#arena/live');
  await expect(page.locator('.native-arena .native-document #app')).toBeVisible();
  expect((await page.locator('.native-arena .native-document').innerText()).length).toBeGreaterThan(
    100,
  );
  expect(await page.locator('.native-arena .native-document .topbar').count()).toBe(0);
});

test('picture puzzle retains images and playable tiles in the native arena', async ({ page }) => {
  await student(page);
  await scoredDemo(page);
  await page.goto('/?arena=%23%2Fpuzzle#arena/live');
  const surface = page.locator('.native-arena .native-document');
  const picture = surface.locator('.pzg-i').first();
  await expect(picture).toBeVisible();
  await expect(picture.locator('.pzg-im')).not.toHaveCSS('background-image', 'none');
  await surface.locator('[data-lv="16"]').click();
  await picture.click();
  const tiles = surface.locator('.pzt');
  await expect(tiles).toHaveCount(16);
  await expect(tiles.first()).not.toHaveCSS('background-image', 'none');
  const movable = surface.locator('.pzt:not(.ok)');
  await movable.first().click();
  await expect(surface.locator('.pzt.sel')).toHaveCount(1);
  await movable.nth(1).click();
  await expect(surface.locator('.pzt.sel')).toHaveCount(0);
  await page.screenshot({ path: 'tests/artifacts/native-puzzle.png', fullPage: true });
});

test('every original slide remains readable in the native reader', async ({ page }) => {
  test.setTimeout(240000);
  await student(page);
  for (let n = 1; n <= 15; n++) {
    await page.goto('/#lesson/m' + n);
    await expect(page.locator('.native-document > .inner')).toBeVisible();
    await page.waitForFunction(() => {
      const current = Number(
        document.querySelector('.reader-counter')?.textContent?.match(/(\d+)\s*\//)?.[1],
      );
      return (
        current ===
        Number(
          (document.querySelector('[data-native-content]') as HTMLElement)?.dataset.nativeIndex,
        ) +
          1
      );
    });
    let current = Number(
      (await page.locator('.reader-counter').innerText()).match(/(\d+)\s*\//)![1],
    );
    while (current > 1) {
      await page.locator('.reader-controls').getByRole('button', { name: 'Oldingi' }).click();
      current--;
      await expect(page.locator('[data-native-content]')).toHaveAttribute(
        'data-native-index',
        String(current - 1),
      );
    }
    const count = Number(
      (await page.locator('.reader-counter').innerText()).match(/\/\s*(\d+)/)![1],
    );
    for (let slide = 2; slide <= count; slide++) {
      await page.locator('.reader-controls').getByRole('button', { name: 'Keyingi' }).click();
      await expect(page.locator('.reader-counter')).toContainText(slide + ' / ' + count);
      await expect(page.locator('[data-native-content]')).toHaveAttribute(
        'data-native-index',
        String(slide - 1),
      );
      await expect(page.locator('.native-document > .inner')).toBeVisible();
      await expect(page.locator('.native-document')).not.toHaveText('');
    }
  }
});

test('crossword input and the financial exercise run in native form controls', async ({ page }) => {
  await student(page);
  await scoredDemo(page);
  await page.goto('/#lesson/m4');
  await lastSlide(page);
  await page.locator('.native-document #xwGo').click();
  const cell = page.locator('.native-document #xwGrid input').first();
  await expect(cell).toBeEditable();
  await cell.fill('A');
  await expect(cell).toHaveValue('A');
  await expect(page.locator('.native-document #xwCells')).toContainText('1');
  await page.screenshot({ path: 'tests/artifacts/native-crossword.png', fullPage: true });
  await page.goto('/#lesson/m5');
  await lastSlide(page);
  await page.locator('.native-document #msGo').click();
  const number = page.locator('.native-document #taskWrap input').first();
  await expect(number).toBeEditable();
  await number.fill('123');
  await page.locator('.native-document #taskWrap button[data-k]').first().click();
  await expect(page.locator('.native-document #taskWrap .task').first()).toContainText('123');
});

test('native rendering strips scripts and event handlers even from a corrupted engine payload', async ({
  page,
}) => {
  await student(page);
  await page.goto('/#lesson/m2');
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  const engine = page.frames().find((f) => f.url().includes('/legacy/mavzu-2.html'))!;
  await engine.evaluate(() => {
    parent.postMessage(
      {
        source: 'tadbirkorlik-native',
        type: 'render',
        html: '<div class="inner"><p>Sanitized content</p><img src="x" onerror="window.nativeXss=true"><script>window.nativeXss=true</script><iframe src="https://invalid.example/"></iframe></div>',
      },
      location.origin,
    );
  });
  await expect(page.locator('.native-document')).toContainText('Sanitized content');
  expect(
    await page
      .locator('.native-document script, .native-document [onerror], .native-document iframe')
      .count(),
  ).toBe(0);
  expect(await page.evaluate(() => (window as any).nativeXss)).toBeUndefined();
});
