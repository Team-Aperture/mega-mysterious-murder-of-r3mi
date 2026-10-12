/**
 * Easing curves. Animation keys name their curve; the name is data, so clips stay serialisable
 * (and could be exported to Spine, which uses the same idea of per-segment curves).
 */
export type EaseFn = (t: number) => number;

const backS = 1.70158;

export const EASES = {
  linear: (t: number) => t,
  /** Hold the start value until the next key (a "stepped" key, as in pose-to-pose blocking). */
  step: (t: number) => (t < 1 ? 0 : 1),
  in: (t: number) => t * t * t,
  out: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  sineIn: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t: number) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  quadIn: (t: number) => t * t,
  quadOut: (t: number) => 1 - (1 - t) * (1 - t),
  quadInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoIn: (t: number) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  /** Anticipation: dips below 0 before going. */
  backIn: (t: number) => (backS + 1) * t * t * t - backS * t * t,
  /** Overshoot: passes 1 and settles. */
  backOut: (t: number) => 1 + (backS + 1) * (t - 1) ** 3 + backS * (t - 1) ** 2,
  backInOut: (t: number) => {
    const c2 = backS * 1.525;
    return t < 0.5
      ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
      : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  elasticOut: (t: number) => {
    if (t <= 0 || t >= 1) return t <= 0 ? 0 : 1;
    return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  bounceOut: (t: number) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
} satisfies Record<string, EaseFn>;

export type EaseName = keyof typeof EASES;

/** CSS-style cubic bezier (x1, y1, x2, y2), solved by Newton iterations with a bisection fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EaseFn {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x;
      const d = dsx(t);
      if (Math.abs(e) < 1e-6) return sy(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

export type EaseSpec = EaseName | [number, number, number, number];

const bezierCache = new Map<string, EaseFn>();
export function ease(spec: EaseSpec | undefined): EaseFn {
  if (spec === undefined) return EASES.inOut;
  if (typeof spec === 'string') return EASES[spec];
  const k = spec.join(',');
  let f = bezierCache.get(k);
  if (!f) { f = cubicBezier(spec[0], spec[1], spec[2], spec[3]); bezierCache.set(k, f); }
  return f;
}
