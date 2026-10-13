import { expect, type Page } from '@playwright/test';

export const PROGRESS_KEY = 'mmm-r3mi.progress.v1';
export const SETTINGS_KEY = 'mmm-r3mi.settings.v1';

export interface GameState {
  control: boolean; cine: boolean; talk: boolean; choices: boolean; panel: boolean;
  x: number; clues: number; phase: string; ich: string;
}

/** Collects page errors and console errors; assert on it at the end of a test. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return errors;
}

/** Opens the game with a clean save (and optional settings), returns once the boarding gate shows. */
export async function openGame(page: Page, settings: Record<string, unknown> | null = null): Promise<void> {
  await page.goto('/');
  await page.evaluate(([pk, sk, s]) => {
    localStorage.removeItem(pk as string);
    if (s) localStorage.setItem(sk as string, JSON.stringify(s));
  }, [PROGRESS_KEY, SETTINGS_KEY, settings] as const);
  await page.reload();
  await expect(page.locator('.gate')).toBeVisible({ timeout: 60_000 });
}

export async function state(page: Page): Promise<GameState> {
  return page.evaluate(() => {
    const g = (window as unknown as { __game: any }).__game;
    return {
      control: g.control, cine: g.inCutscene, talk: g.dialogue.busy, choices: !!document.querySelector('.choices'),
      panel: !!document.querySelector('.overlay .panel'), x: Math.round(g.cast.ich.x), clues: g.progress.clues.length,
      phase: g.progress.phase, ich: g.cast.ich.id,
    };
  });
}

/** Taps or clicks (touch-aware). */
export async function tap(page: Page, x: number, y: number): Promise<void> {
  const touch = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
}

/**
 * Clicks through dialogue (and skips cutscenes when asked) until `done` holds.
 * Waits on game state rather than fixed timings, so it also works on slow software rendering.
 */
export async function until(page: Page, label: string, done: (s: GameState) => boolean, o: { skip?: boolean; limit?: number; clickY?: number } = {}): Promise<GameState> {
  const vp = page.viewportSize()!;
  const end = Date.now() + (o.limit ?? 240_000);
  while (Date.now() < end) {
    const s = await state(page);
    if (done(s)) return s;
    if (o.skip && s.cine && (await page.locator('.skip.on').isVisible().catch(() => false))) await page.locator('.skip.on').click().catch(() => {});
    else if (s.talk && !s.choices) await tap(page, vp.width / 2, o.clickY ?? vp.height / 2);
    await page.waitForTimeout(250);
  }
  throw new Error(`timeout waiting for: ${label} (${JSON.stringify(await state(page))})`);
}

/** Uses a hotspot through the game API (the same path as a click on it). */
export async function useHotspot(page: Page, id: string): Promise<void> {
  await page.evaluate((id) => {
    const g = (window as unknown as { __game: any }).__game;
    const hs = g.hotspotList.find((x: { id: string }) => x.id === id);
    if (!hs) throw new Error(`no hotspot ${id}`);
    void g.useHotspot(hs);
  }, id);
}
