import { CanvasSource, Rectangle, Texture } from 'pixi.js';

/**
 * Rig sheet → texture atlas.
 *
 * RIG SHEET FORMAT (what an artist delivers, or what `src/characters/<id>/sheet*.ts` generates):
 *   - one SVG document, the character in its rest pose, facing right, feet on y = 0,
 *     1080p reference units (400 units = 1 m), viewBox covering the character;
 *   - one top-level-or-nested `<g id="part:<partId>">` per drawable part, drawn in place
 *     (no transform on the part group itself; children may have transforms);
 *   - alternative drawings for the same slot (hand poses, smears) are just more parts,
 *     e.g. `part:hand.near#point`, marked `data-alt` so the preview sheet can hide them;
 *   - shared gradients, clip paths and filters go in `<defs>`;
 *   - no `<text>` (fonts are not available when SVG is rasterised as an image): convert to paths.
 * Pivots are not stored in the sheet: a part rotates around its bone's pivot (rig definition).
 *
 * Each part is rasterised once at `scale` (texels per unit) and shelf-packed into atlas pages.
 * A raster pipeline (Krita/Photoshop: one PNG per part + its sheet-space rectangle) produces the
 * same `PartTexture` records, so the runtime does not care how a part was drawn.
 */
export interface PartTexture {
  id: string;
  /** Rectangle in sheet space (units). */
  x: number; y: number; w: number; h: number;
  texture: Texture;
}

export interface Atlas {
  id: string;
  scale: number;
  parts: Map<string, PartTexture>;
  pages: HTMLCanvasElement[];
}

export interface AtlasOptions {
  scale: number;
  /** Extra margin around each measured part (units); covers strokes and filters. */
  pad?: number;
  onProgress?: (done: number, total: number) => void;
  maxPage?: number;
}

const XMLNS = 'http://www.w3.org/2000/svg';

export async function buildAtlas(id: string, svgText: string, opts: AtlasOptions): Promise<Atlas> {
  const pad = opts.pad ?? 8;
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;left:-20000px;top:0;width:8px;height:8px;overflow:hidden;pointer-events:none;';
  host.innerHTML = svgText;
  document.body.appendChild(host);
  try {
    const svg = host.querySelector('svg');
    if (!svg) throw new Error(`rig sheet ${id}: no <svg> root`);
    const defs = svg.querySelector('defs');
    const defsXml = defs ? new XMLSerializer().serializeToString(defs) : '';
    const groups = Array.from(svg.querySelectorAll<SVGGElement>('g[id^="part:"]'));
    const measured = groups.map((g) => {
      const b = g.getBBox();
      const extra = Number(g.getAttribute('data-pad') ?? pad);
      return { g, id: g.id.slice(5), x: b.x - extra, y: b.y - extra, w: b.width + 2 * extra, h: b.height + 2 * extra };
    }).filter((m) => m.w > 2 * pad - 0.01 && m.h > 0);

    const total = measured.length;
    let done = 0;
    const images = await mapLimit(measured, 6, async (m) => {
      const clone = m.g.cloneNode(true) as SVGGElement;
      clone.removeAttribute('data-alt');
      clone.removeAttribute('style');
      clone.removeAttribute('opacity');
      const body = new XMLSerializer().serializeToString(clone);
      const W = Math.max(1, Math.ceil(m.w * opts.scale));
      const H = Math.max(1, Math.ceil(m.h * opts.scale));
      const doc = `<svg xmlns="${XMLNS}" viewBox="${m.x} ${m.y} ${m.w} ${m.h}" width="${W}" height="${H}">${defsXml}${body}</svg>`;
      const img = await loadSvgImage(doc);
      done++;
      opts.onProgress?.(done, total);
      return { m, img, W, H };
    });

    const pages = pack(images.map((i) => ({ w: i.W, h: i.H })), opts.maxPage ?? 4096);
    const canvases = pages.sizes.map(([w, h]) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      return c;
    });
    images.forEach((im, i) => {
      const p = pages.places[i];
      const ctx = canvases[p.page].getContext('2d')!;
      ctx.drawImage(im.img, p.x, p.y, im.W, im.H);
    });
    const sources = canvases.map((c) => new CanvasSource({ resource: c, autoGenerateMipmaps: true, scaleMode: 'linear' }));
    const parts = new Map<string, PartTexture>();
    images.forEach((im, i) => {
      const p = pages.places[i];
      const texture = new Texture({ source: sources[p.page], frame: new Rectangle(p.x, p.y, im.W, im.H) });
      parts.set(im.m.id, { id: im.m.id, x: im.m.x, y: im.m.y, w: im.W / opts.scale, h: im.H / opts.scale, texture });
    });
    return { id, scale: opts.scale, parts, pages: canvases };
  } finally {
    host.remove();
  }
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg part failed to rasterise')); };
    img.src = url;
  });
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Shelf packer: tallest first, 2 px gutters, as many pages as needed. Exported for tests. */
export function pack(rects: { w: number; h: number }[], max: number): {
  places: { page: number; x: number; y: number }[];
  sizes: [number, number][];
} {
  const G = 2;
  const order = rects.map((r, i) => ({ ...r, i })).sort((a, b) => b.h - a.h || b.w - a.w);
  const area = rects.reduce((s, r) => s + (r.w + G) * (r.h + G), 0);
  const widest = rects.reduce((m, r) => Math.max(m, r.w + G), 0);
  let width = Math.min(max, Math.max(widest, Math.pow(2, Math.ceil(Math.log2(Math.sqrt(area * 1.15))))));
  width = Math.max(width, Math.min(max, widest));
  const places: { page: number; x: number; y: number }[] = new Array(rects.length);
  const sizes: [number, number][] = [];
  let page = 0, x = G, y = G, shelf = 0, usedW = 0;
  for (const r of order) {
    if (x + r.w + G > width) { x = G; y += shelf + G; shelf = 0; }
    if (y + r.h + G > max) {
      sizes.push([usedW, Math.min(max, y + shelf + G)]);
      page++; x = G; y = G; shelf = 0; usedW = 0;
    }
    places[r.i] = { page, x, y };
    x += r.w + G;
    usedW = Math.max(usedW, x);
    shelf = Math.max(shelf, r.h);
  }
  sizes.push([Math.max(usedW, 1), Math.max(1, y + shelf + G)]);
  return { places, sizes };
}
