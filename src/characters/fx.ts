import { CanvasSource, Texture } from 'pixi.js';

/** Runtime-generated textures shared by characters and the world (no image files). */

let glow: Texture | null = null;
/** Soft white radial falloff, used with additive blending for every light glow. */
export function glowTexture(): Texture {
  if (glow) return glow;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // smooth, roughly inverse-square-looking falloff that reaches zero at the edge
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const a = Math.pow(1 - t, 2.2) * (1 - t * 0.15);
    grd.addColorStop(t, `rgba(255,255,255,${a.toFixed(3)})`);
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  glow = new Texture({ source: new CanvasSource({ resource: c, autoGenerateMipmaps: true }) });
  return glow;
}

const hoseCache = new Map<string, Texture>();
/**
 * Ribbed hose texture, repeated along a MeshRope. `base` is the tube colour, `accent` the colour
 * that shows between the ribs (R-3MI green, V-TGM red), `edge` the outline.
 */
export function hoseTexture(base: string, accent: string, edge = '#1b1620'): Texture {
  const key = base + accent + edge;
  const hit = hoseCache.get(key);
  if (hit) return hit;
  // one rib per tile; the rope repeats the tile every `width` units along its length
  const W = 32, H = 32;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const tube = (x: number, w: number, k: number) => {
    const grd = g.createLinearGradient(0, 2, 0, H - 2);
    grd.addColorStop(0, shade(base, 1.9 * k));
    grd.addColorStop(0.3, shade(base, 1.35 * k));
    grd.addColorStop(0.65, shade(base, 1.0 * k));
    grd.addColorStop(1, shade(base, 0.55 * k));
    g.fillStyle = grd;
    g.fillRect(x, 3, w, H - 6);
  };
  g.fillStyle = edge;
  g.fillRect(0, 0, W, H);
  // groove (narrower, darker, with the glowing accent showing through)
  tube(0, W, 0.75);
  g.fillStyle = accent;
  g.globalAlpha = 0.9;
  g.fillRect(21, 11, 6, H - 22);
  g.globalAlpha = 1;
  // rib (raised band)
  tube(2, 16, 1.25);
  g.fillStyle = edge;
  g.globalAlpha = 0.85;
  g.fillRect(18, 3, 2, H - 6);
  g.fillRect(0, 3, 2, H - 6);
  g.globalAlpha = 1;
  // outline top and bottom
  g.fillStyle = edge;
  g.fillRect(0, 0, W, 3);
  g.fillRect(0, H - 3, W, 3);
  const tex = new Texture({ source: new CanvasSource({ resource: c, addressMode: 'repeat', autoGenerateMipmaps: false, scaleMode: 'linear' }) });
  hoseCache.set(key, tex);
  return tex;
}

function shade(hex: string, k: number): string {
  const h = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * k))));
  return `rgb(${v[0]},${v[1]},${v[2]})`;
}

let cone: Texture | null = null;
/** A soft vertical light cone (bright at the top, fading down and to the sides). */
export function coneTexture(): Texture {
  if (cone) return cone;
  const W = 128, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    const spread = 0.12 + 0.88 * v; // cone widens downwards
    for (let x = 0; x < W; x++) {
      const u = Math.abs((x + 0.5) / W - 0.5) * 2 / spread;
      const side = u >= 1 ? 0 : Math.pow(1 - u * u, 1.5);
      const fall = Math.pow(1 - v, 1.4) * (0.35 + 0.65 * Math.min(1, v * 6));
      const a = side * fall;
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  cone = new Texture({ source: new CanvasSource({ resource: c, autoGenerateMipmaps: true }) });
  return cone;
}
