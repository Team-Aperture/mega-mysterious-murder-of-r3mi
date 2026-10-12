// Automated playthrough of Chapter 0 against a running server (dev or preview).
// Usage: node scripts/play.mjs <outDir> [width] [height] [touch]
// Waits on game state (control, dialogue, cutscenes) rather than fixed timings, so it also works
// on slow software-rendered headless browsers. Exits non-zero if any step fails or errors are logged.
import { chromium } from '@playwright/test';
const [, , out = '.', w = '1280', h = '720', touch = ''] = process.argv;
const W = +w, H = +h;
const base = process.env.BASE ?? 'http://localhost:5173/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const t0 = Date.now();
const log = (s) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${s}`);
const tap = async (x, y) => (touch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
const state = () => page.evaluate(() => {
  const g = window.__game;
  return { control: g.control, cine: g.inCutscene, talk: g.dialogue.busy, choices: !!document.querySelector('.choices'), panel: !!document.querySelector('.overlay .panel'), x: Math.round(g.cast.ich.x), clues: g.progress.clues.length, phase: g.progress.phase };
});
/** Clicks through dialogue (and skips cutscenes if asked) until `done(state)` holds. */
async function until(label, done, { skip = false, limit = 240000, clickY = H * 0.5 } = {}) {
  const end = Date.now() + limit;
  while (Date.now() < end) {
    const s = await state();
    if (done(s)) return s;
    if (skip && s.cine && (await page.locator('.skip.on').isVisible().catch(() => false))) await page.locator('.skip.on').click().catch(() => {});
    else if (s.talk && !s.choices) await tap(W / 2, clickY);
    await page.waitForTimeout(250);
  }
  throw new Error(`timeout: ${label} (${JSON.stringify(await state())})`);
}
let failed = false;
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('mmm-r3mi.progress.v1'));
  await page.waitForSelector('.gate', { timeout: 60000 });
  log('gate'); await shot('01-gate');
  await (touch ? page.locator('.gate').tap() : page.locator('.gate').click());
  await page.waitForTimeout(2600);
  await shot('02-title-board');
  await page.waitForSelector('.menu.show', { timeout: 60000 });
  await page.waitForTimeout(400);
  await shot('03-title-menu'); log('menu');
  await page.locator('.menu .btn').first().click();
  await page.waitForTimeout(3500);
  await shot('04-opening');
  await until('explore control', (s) => s.control && !s.cine, { skip: true });
  log('control: explore');
  await page.waitForTimeout(600);
  await shot('05-explore');
  // walk left by tapping the floor until the meeting takes over
  for (let i = 0; i < 60; i++) {
    const s = await state();
    if (!s.control) break;
    await tap(40, H * 0.86);
    await page.waitForTimeout(500);
  }
  log('meeting');
  await page.waitForTimeout(1200);
  await shot('06-meeting');
  await until('choices', (s) => s.choices);
  await page.waitForTimeout(700);
  await shot('07-choices');
  await page.locator('.choice').nth(2).click();
  log('chose pose');
  await until('seat struggle', (s) => s.cine);
  await page.waitForTimeout(6000);
  await shot('08-seat');
  await until('investigate control', (s) => s.control && !s.cine && s.phase === 'investigate', { skip: true });
  log('control: investigate');
  await page.waitForTimeout(600);
  await shot('09-investigate');
  const useHs = (id) => page.evaluate((id) => { const g = window.__game; const hs = g.hotspotList.find((x) => x.id === id); void g.useHotspot(hs); }, id);
  for (const id of ['window', 'seatbelt']) {
    await useHs(id);
    await page.waitForSelector('.lens.show', { timeout: 60000 });
    await page.waitForTimeout(1500);
    await shot(`10-examine-${id}`);
    await until(`examined ${id}`, (s) => s.control && !s.talk, { clickY: 120 });
    log(`examined ${id}`);
  }
  // walk left over R-3MI's legs: the trip
  await tap(30, H * 0.86);
  await until('trip', (s) => s.cine);
  await page.waitForTimeout(1500);
  await shot('11-trip');
  await until('after trip', (s) => s.control && !s.cine, { clickY: 120 });
  log('after trip');
  await useHs('screen');
  await until('ending', (s) => s.cine && s.phase === 'ending', { clickY: 120 });
  log('ending');
  await page.waitForTimeout(5000);
  await shot('12-ending');
  await until('end panel', (s) => s.panel, { skip: true });
  await page.waitForTimeout(600);
  await shot('13-end');
  log('end');
} catch (e) {
  failed = true;
  console.log(String(e));
  await shot('99-failure').catch(() => {});
}
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
