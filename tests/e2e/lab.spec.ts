import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test('Animation Lab: clips, scene scrubbing and lineup', async ({ page }) => {
  test.setTimeout(3 * 60_000);
  const errors = watchErrors(page);
  await page.goto('/?lab&mode=clips&c=r3mi&clip=clap&t=0.6&skel=1');
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, null, { timeout: 60_000 });
  await expect(page.locator('.lab .tab.on')).toHaveText('Clips');
  await expect(page.locator('.lab .readout')).toContainText('0.60 /');
  // the clap clip shows its two sound events on the timeline
  await expect(page.locator('.lab .mark')).toHaveCount(2);

  // scenes: jumping to a marker re-simulates the cutscene to that moment
  await page.locator('.lab .tab', { hasText: 'Szenen' }).click();
  await page.locator('.lab .scene', { hasText: 'Gestolpert' }).click();
  await page.locator('.lab .mark').nth(1).click();
  await expect(page.locator('.lab .readout')).toContainText('Der Hut fliegt');
  const t = await page.evaluate(() => (window as unknown as { __game: { cast: { ich: { anim: { current(): string | null } } } } }).__game.cast.ich.anim.current());
  expect(t).toBe('trip');

  await page.locator('.lab .tab', { hasText: 'Aufstellung' }).click();
  await expect(page.locator('.lab-side')).toContainText('Kanon-Check');
  expect(errors).toEqual([]);
});
