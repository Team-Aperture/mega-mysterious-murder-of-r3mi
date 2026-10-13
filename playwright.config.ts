import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests (headless Chromium with software WebGL). They drive the real game:
 *   npm run test:e2e                    all projects (desktop + phone landscape)
 *   npx playwright test --project=desktop
 * They run against a production build served by `vite preview` on :4173 (built first; an
 * already running preview is reused). Not the dev server: its hot reload would restart the page
 * whenever a source file changes during a run.
 * Software rendering is slow, so the game's fixed-step loop runs behind real time here and the
 * full-chapter tests take a few minutes.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE ?? 'http://localhost:4173/',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 720 } } },
    // dpr 1 keeps software rendering fast enough; layout and touch input are what this project checks
    { name: 'phone', use: { ...devices['Pixel 7 landscape'], deviceScaleFactor: 1 }, testIgnore: [/lab\.spec/, /determinism\.spec/] },
  ],
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
