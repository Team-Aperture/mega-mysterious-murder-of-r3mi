import { expect, test } from '@playwright/test';
import { openGame, state, tap, until, useHotspot, watchErrors } from './helpers';

/**
 * The whole of Chapter 0, as a player would: title, opening, explore, the meeting with a
 * dialogue choice, the seat struggle, three clues, the trip over R-3MI's legs, the ending
 * and the end screen. Desktop clicks or phone taps depending on the project.
 */
test('Chapter 0 can be played from the gate to the end screen', async ({ page }) => {
  test.setTimeout(9 * 60_000);
  const errors = watchErrors(page);
  const vp = page.viewportSize()!;
  await openGame(page);
  await page.locator('.gate').click();
  await expect(page.locator('.menu.show')).toBeVisible({ timeout: 60_000 });
  await page.locator('.menu .btn').first().click();

  await until(page, 'control after opening and entrance', (s) => s.control && !s.cine, { skip: true });
  // walk left by tapping the floor until the meeting takes over
  for (let i = 0; i < 80 && (await state(page)).control; i++) {
    await tap(page, 30, vp.height * 0.86);
    await page.waitForTimeout(500);
  }
  await until(page, 'dialogue choice', (s) => s.choices);
  await expect(page.locator('.choice')).toHaveCount(3);
  await page.waitForTimeout(600); // choices ignore input for a moment after appearing
  await page.locator('.choice').nth(2).click();

  await until(page, 'investigation', (s) => s.control && !s.cine && s.phase === 'investigate', { skip: true });
  for (const id of ['window', 'seatbelt']) {
    await useHotspot(page, id);
    await expect(page.locator('.lens.show')).toBeVisible({ timeout: 60_000 });
    await until(page, `examined ${id}`, (s) => s.control && !s.talk, { clickY: 120 });
  }
  expect((await state(page)).clues).toBe(2);

  // the gag: walking left over R-3MI's legs in the aisle trips ICH
  await tap(page, 30, vp.height * 0.86);
  await until(page, 'trip cutscene', (s) => s.cine);
  await until(page, 'control after the trip', (s) => s.control && !s.cine, { clickY: 120 });

  await useHotspot(page, 'screen');
  await until(page, 'ending', (s) => s.cine && s.phase === 'ending', { clickY: 120 });
  await until(page, 'end screen', (s) => s.panel, { skip: true });
  await expect(page.locator('.overlay .panel h2')).toHaveText(/ENDE VON KAPITEL 0/);
  await expect(page.locator('.overlay .panel')).toContainText('3 von 7');
  await expect(page.locator('.overlay .panel')).toContainText('ja (beabsichtigt)');
  expect(errors).toEqual([]);
});
