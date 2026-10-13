import { expect, test } from '@playwright/test';
import { openGame, watchErrors } from './helpers';

test('boarding gate, title sequence and menu', async ({ page }) => {
  const errors = watchErrors(page);
  await openGame(page);
  await page.locator('.gate').click();
  // the departure board never says "departed": it flips to BOARDING BEENDET
  await expect(page.locator('.board.show')).toBeVisible();
  await expect(page.locator('.menu.show')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.ttl')).toHaveAttribute('aria-label', 'THE MEGA MYSTERIOUS MURDER OF R-3MI');
  await expect(page.locator('.menu .btn').first()).toHaveText(/Neuer Fall/i);
  // one element per flap: read the raw text (innerText would space the letters apart)
  const board = ((await page.locator('.board').textContent()) ?? '').replace(/[\s\u00a0]+/g, ' ');
  expect(board).toContain('BOARDING BEENDET');
  expect(board).not.toMatch(/GESTARTET|ABGEFLOGEN|DEPARTED/);
  // settings open and close
  await page.locator('.menu .btn', { hasText: 'Einstellungen' }).click();
  await expect(page.locator('.overlay .panel')).toBeVisible();
  await page.locator('.overlay .btn', { hasText: 'Fertig' }).click();
  await expect(page.locator('.overlay')).toHaveCount(0);
  expect(errors).toEqual([]);
});
