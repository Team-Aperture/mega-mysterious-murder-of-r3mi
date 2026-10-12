/**
 * Tiny SVG authoring kit for the procedural rig sheets.
 *
 * The output is ordinary SVG an artist can open in Inkscape/Illustrator. House style:
 * coloured ink outline (`EDGE`), flat base colour, one cel-shadow shape and one highlight shape
 * clipped to the part, and thin panel lines. Light comes from the upper left.
 */
export const EDGE = '#1b1620';
export const OUTLINE = 4.5;

export const n = (v: number): string => (Math.round(v * 100) / 100).toString();
type P = [number, number];

export function rr(x: number, y: number, w: number, h: number, r: number | [number, number, number, number]): string {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
  const k = (v: number) => Math.min(v, w / 2, h / 2);
  const a = k(tl), b = k(tr), c = k(br), d = k(bl);
  return `M${n(x + a)} ${n(y)}H${n(x + w - b)}A${n(b)} ${n(b)} 0 0 1 ${n(x + w)} ${n(y + b)}V${n(y + h - c)}A${n(c)} ${n(c)} 0 0 1 ${n(x + w - c)} ${n(y + h)}H${n(x + d)}A${n(d)} ${n(d)} 0 0 1 ${n(x)} ${n(y + h - d)}V${n(y + a)}A${n(a)} ${n(a)} 0 0 1 ${n(x + a)} ${n(y)}Z`;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)}Z`;
}
export const circle = (cx: number, cy: number, r: number): string => ellipse(cx, cy, r, r);

/** Convex hull of two circles: a tapered limb segment. */
export function capsule(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  if (d < Math.abs(r1 - r2) + 0.01) return circle(r1 > r2 ? x1 : x2, r1 > r2 ? y1 : y2, Math.max(r1, r2));
  const th = Math.atan2(dy, dx);
  const al = Math.acos((r1 - r2) / d);
  const pt = (cx: number, cy: number, r: number, a: number): P => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const a1 = pt(x1, y1, r1, th + al), b1 = pt(x2, y2, r2, th + al);
  const b2 = pt(x2, y2, r2, th - al), a2 = pt(x1, y1, r1, th - al);
  const large2 = al > Math.PI / 2 ? 1 : 0;
  const large1 = al < Math.PI / 2 ? 1 : 0;
  return `M${n(a1[0])} ${n(a1[1])}L${n(b1[0])} ${n(b1[1])}A${n(r2)} ${n(r2)} 0 ${large2} 0 ${n(b2[0])} ${n(b2[1])}L${n(a2[0])} ${n(a2[1])}A${n(r1)} ${n(r1)} 0 ${large1} 0 ${n(a1[0])} ${n(a1[1])}Z`;
}

export function poly(pts: P[], closed = true): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join('') + (closed ? 'Z' : '');
}

/** Catmull-Rom spline through the points, as cubic Beziers. */
export function smooth(pts: P[], closed = true, tension = 1): string {
  const N = pts.length;
  const get = (i: number): P => closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))];
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  const segs = closed ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const k = tension / 6;
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

export interface Stroke { stroke?: string; sw?: number; opacity?: number; extra?: string }

export function path(d: string, fill: string, o: Stroke = {}): string {
  const stroke = o.stroke === undefined ? EDGE : o.stroke;
  const sw = o.sw ?? OUTLINE;
  const op = o.opacity !== undefined ? ` opacity="${o.opacity}"` : '';
  const st = stroke === 'none' ? ' stroke="none"' : ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
  return `<path d="${d}" fill="${fill}"${st}${op}${o.extra ? ' ' + o.extra : ''}/>`;
}

/** Fill-only shape (shading inside a clip). */
export const fillOnly = (d: string, fill: string, opacity = 1): string =>
  `<path d="${d}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;

/** Open line (panel lines, seams). */
export const line = (d: string, stroke: string, sw = 2, opacity = 1): string =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;

/** Collects <defs> (clip paths, gradients) while a sheet is being built. */
export class Defs {
  private readonly items: string[] = [];
  private readonly ids = new Set<string>();
  constructor(readonly prefix: string) {}
  id(name: string): string { return `${this.prefix}-${name}`; }
  clip(name: string, d: string): string {
    const id = this.id(`clip-${name}`);
    if (!this.ids.has(id)) { this.ids.add(id); this.items.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); }
    return id;
  }
  linear(name: string, x1: number, y1: number, x2: number, y2: number, stops: [number, string, number?][]): string {
    const id = this.id(`lg-${name}`);
    if (!this.ids.has(id)) {
      this.ids.add(id);
      this.items.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`);
    }
    return `url(#${id})`;
  }
  radial(name: string, cx: number, cy: number, r: number, stops: [number, string, number?][], fx?: number, fy?: number): string {
    const id = this.id(`rg-${name}`);
    if (!this.ids.has(id)) {
      this.ids.add(id);
      this.items.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${fx !== undefined ? ` fx="${n(fx)}" fy="${n(fy ?? cy)}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`);
    }
    return `url(#${id})`;
  }
  toString(): string { return `<defs>${this.items.join('')}</defs>`; }
}

/**
 * A shaded solid: outline + base + clipped shadow/highlight/detail layers.
 * The outline is drawn last as a stroke-only path so inner shading never covers it.
 */
export function solid(defs: Defs, name: string, d: string, base: string, inner: string[] = [], o: Stroke = {}): string {
  const clip = defs.clip(name, d);
  const sw = o.sw ?? OUTLINE;
  return `<path d="${d}" fill="${base}"/>` +
    (inner.length ? `<g clip-path="url(#${clip})">${inner.join('')}</g>` : '') +
    (o.stroke === 'none' ? '' : `<path d="${d}" fill="none" stroke="${o.stroke ?? EDGE}" stroke-width="${sw}" stroke-linejoin="round"/>`);
}

export function part(id: string, inner: string, attrs: Record<string, string | number> = {}): string {
  const a = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
  return `<g id="part:${id}"${a}>${inner}</g>`;
}

export function sheet(id: string, defs: Defs, parts: string[], view: [number, number, number, number]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" data-rig="${id}" data-units-per-meter="400" viewBox="${view.join(' ')}" width="${view[2]}" height="${view[3]}">` +
    `<style>[data-alt]{opacity:0}</style>${defs}${parts.join('')}</svg>`;
}

/** Colour helpers. */
export function mix(a: string, b: string, t: number): string {
  const pa = hex(a), pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
function hex(c: string): number[] {
  const h = c.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
