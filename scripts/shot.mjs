// Usage: node scripts/shot.mjs <url-query> <out.png> [width] [height]
// Renders one page of the running dev/preview server in headless Chromium and saves a PNG.
import { chromium } from '@playwright/test';
const [, , query = '', out = 'shot.png', w = '1280', h = '720'] = process.argv;
const base = process.env.BASE ?? 'http://localhost:5173/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: Number(process.env.DPR ?? 1) });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(base + query, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 }).catch(() => logs.push('timeout waiting for __ready'));
await page.waitForTimeout(Number(process.env.WAIT ?? 300));
await page.screenshot({ path: out });
if (logs.length) console.log(logs.join('\n'));
await browser.close();
