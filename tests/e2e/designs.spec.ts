import { expect, test } from '@playwright/test';
import { SETTINGS_KEY } from './helpers';

/** Each ICH design direction loads as the playable ICH and gets its own measured lens reach. */
for (const design of ['a', 'b', 'c'] as const) {
  test(`ICH design direction ${design.toUpperCase()} loads`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.evaluate(([k, d]) => localStorage.setItem(k, JSON.stringify({ v: 1, ichDesign: d })), [SETTINGS_KEY, design] as const);
    await page.reload();
    await page.waitForFunction(() => !!(window as unknown as { __game?: { cast?: unknown } }).__game?.cast, null, { timeout: 60_000 });
    const info = await page.evaluate(() => {
      const g = (window as unknown as { __game: { cast: { ich: { id: string } }; lensReach: { examine: number; examineUp: number } } }).__game;
      return { id: g.cast.ich.id, reach: g.lensReach };
    });
    expect(info.id).toBe(design === 'a' ? 'ich' : `ich-${design}`);
    expect(info.reach.examine).toBeGreaterThan(40);
    expect(info.reach.examineUp).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}
