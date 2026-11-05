import { test, expect } from '@playwright/test';

test('reader navigation supports touch, keys and slide selection across phone and desktop sizes', async ({
  page,
}) => {
  await page.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  for (const topic of [1, 7]) {
    await page.goto('/#lesson/m' + topic);
    await expect(page.locator('.native-document > .inner')).toBeVisible();
    const controls = page.locator('.reader-controls');
    const select = controls.getByRole('combobox');
    await expect(select).toBeEnabled();
    await select.selectOption('0');
    await expect(controls.getByRole('button', { name: 'Oldingi' })).toBeDisabled();
    await controls.getByRole('button', { name: 'Keyingi' }).click();
    await expect(select).toHaveValue('1');
    await page.keyboard.press('ArrowRight');
    await expect(select).toHaveValue('2');
    await select.selectOption('4');
    await expect(page.locator('.native-document')).toHaveAttribute('data-native-index', '4');
    // Gestures on reading content must not interfere with ordinary vertical scrolling.
    const content = page.locator('.native-document > .inner');
    await content.dispatchEvent('touchstart', {
      touches: [{ identifier: 1, clientX: 250, clientY: 250 }],
    });
    await content.dispatchEvent('touchend', {
      changedTouches: [{ identifier: 1, clientX: 250, clientY: 100 }],
    });
    await expect(select).toHaveValue('4');
    await content.dispatchEvent('touchstart', {
      touches: [{ identifier: 1, clientX: 250, clientY: 250 }],
    });
    await content.dispatchEvent('touchend', {
      changedTouches: [{ identifier: 1, clientX: 100, clientY: 255 }],
    });
    await expect(select).toHaveValue('5');
    await controls.getByRole('button', { name: 'Oldingi' }).click();
    await expect(select).toHaveValue('4');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.locator('.reader-heading')).toContainText('Tadbirkorlik asoslari');
      await expect(page.locator('.reader-heading')).toContainText(topic + '-mavzu / 15');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      const bounds = await controls.boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(845);
      expect(bounds!.y).toBeGreaterThan(350);
      for (const button of await controls.getByRole('button').all())
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      const heading = page.locator('.reader-heading h1');
      expect(await heading.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: `tests/artifacts/reader-${topic}-${width}.png`,
          fullPage: true,
        });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await select.selectOption('0');
    const last = String((await select.locator('option').count()) - 1);
    await select.selectOption(last);
    await expect(controls.getByRole('button', { name: 'Keyingi' })).toBeDisabled();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});
