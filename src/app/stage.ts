import { Application } from 'pixi.js';

/** One Pixi application for the whole game; scenes swap containers on its stage. */
export async function createStage(host: HTMLElement): Promise<Application> {
  const app = new Application();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  await app.init({
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: dpr,
    background: '#07081a',
    preference: 'webgl',
    powerPreference: 'high-performance',
  });
  app.canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(app.canvas);
  return app;
}

/**
 * Texel density for rasterised character parts: enough for the sharpest likely view
 * (device pixels per world unit at the closest camera zoom), capped for memory.
 */
export function atlasScale(): number {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const h = Math.max(window.innerHeight, Math.min(window.innerWidth, 1400) * 0.5625);
  const pxPerUnit = (h / 1080) * dpr;
  return Math.min(2.2, Math.max(1.0, pxPerUnit * 1.6));
}
