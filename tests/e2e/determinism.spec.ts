import { expect, test } from '@playwright/test';

/**
 * Cutscenes are deterministic: re-simulating a sequence from zero to the same time renders the
 * same frame. This is what makes "skip", Lab scrubbing and these screenshots trustworthy.
 */
test('a cutscene frame re-simulates identically', async ({ page }) => {
  test.setTimeout(3 * 60_000);
  const shoot = async () => {
    await page.goto('/?dev=seq&id=trip&t=2.4');
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, null, { timeout: 60_000 });
    await page.waitForTimeout(300);
    return page.screenshot();
  };
  const a = await shoot();
  const b = await shoot();
  expect(a.equals(b)).toBe(true);
});
