import { test, expect, type Page } from '@playwright/test';

async function demoTeacher(page: Page) {
  await page.route('**/legacy/demo-guard.js', async (route) => {
    const response = await route.fetch();
    // Isolated original-engine fixture only; never authenticates with live Firebase.
    const body = (await response.text()).replace(
      'var session = new Map();',
      'memory.delete("terdu_student"); var session = new Map(); session.set("terdu_tc","1");',
    );
    await route.fulfill({ response, body });
  });
  await page.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
}

for (const width of [320, 390, 768, 1280]) {
  test(`teacher action labels remain readable at ${width}px without letter columns`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await demoTeacher(page);
    await page.goto('/#admin');
    await page.getByRole('button', { name: 'Kursni boshqarish', exact: true }).click();
    await expect(page.locator('.native-document #rtCsv')).toBeAttached();
    await page.locator('.native-document .rt-tab[data-p="tc"]').click();
    const actions = page.locator('.native-document .rt-tc-common button');
    await expect(actions.first()).toBeVisible();
    expect(await actions.count()).toBeGreaterThanOrEqual(5);
    const issues = await actions.evaluateAll((buttons) => {
      const failures: string[] = [];
      for (const button of buttons) {
        const bounds = button.getBoundingClientRect();
        if (bounds.width < 75 || bounds.height > 110 || button.scrollWidth > button.clientWidth + 2)
          failures.push('Clipped or excessively narrow control: ' + button.textContent);
        const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          for (const word of (node.textContent || '').matchAll(/[\p{L}'’ʻʼ]{5,}/gu)) {
            const range = document.createRange();
            range.setStart(node, word.index!);
            range.setEnd(node, word.index! + word[0].length);
            const lines = new Set(Array.from(range.getClientRects(), (r) => Math.round(r.top)));
            if (lines.size > 1) failures.push('Word split into several lines: ' + word[0]);
          }
        }
      }
      return failures;
    });
    expect(issues).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    if (width === 390) {
      await actions.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'tests/artifacts/teacher-actions-mobile.png', fullPage: true });
    }
    // The controls still switch real original-engine panels after reflow.
    await page.locator('.native-document .rt-stab[data-p="ann"]').click();
    await expect(page.locator('.native-document .rt-tcpane[data-p="ann"]')).toBeVisible();
    await expect(page.locator('.native-document .rt-tcpane[data-p="stu"]')).not.toBeVisible();
  });

  test(`main pages fit ${width}px with long student names`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.request.post('/api/auth/demo', { data: { id: 'demo-admin' } });
    const original = (await (await page.request.get('/api/platform')).json()).user;
    const profile = async (name: string) => {
      const response = await page.request.post('/api/platform', {
        data: {
          action: 'profile',
          input: { name, leaderboardVisible: original.leaderboardVisible },
        },
      });
      expect(response.ok()).toBe(true);
    };
    await profile('Muhammadzokir Abdurahmonov Isfandiyor Sayfiddinov');
    try {
      for (const route of [
        'home',
        'courses',
        'course/tad-asoslari',
        'arena',
        'ranking',
        'badges',
        'profile',
        'admin',
      ]) {
        await page.goto('/#' + route);
        await expect(page.locator('.app-main')).toBeVisible();
        await expect(page.locator('.skeleton')).toHaveCount(0);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          route,
        ).toBe(true);
        const clipped = await page
          .locator('.page-heading button, .filter-row button')
          .evaluateAll((buttons) =>
            buttons.filter((n) => n.scrollWidth > n.clientWidth + 2).map((n) => n.textContent),
          );
        expect(clipped, route).toEqual([]);
      }
    } finally {
      // Only the isolated local demo profile changes, and its original value is restored.
      await profile(original.name);
    }
  });
}
