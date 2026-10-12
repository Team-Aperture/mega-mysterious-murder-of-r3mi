/** Small, dependency-free math helpers shared by the animation runtime and the game. */

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (v: number, a = 0, b = 1): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number): number => (b === a ? 0 : (v - a) / (b - a));
export const remap = (v: number, a0: number, a1: number, b0: number, b1: number, clamped = true): number => {
  const t = invLerp(a0, a1, v);
  return lerp(b0, b1, clamped ? clamp(t) : t);
};
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp(invLerp(a, b, v));
  return t * t * (3 - 2 * t);
};
/** Fractional part, always in [0, 1). */
export const fract = (v: number): number => v - Math.floor(v);
/** Wraps an angle to (-PI, PI]. */
export const wrapAngle = (a: number): number => {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
};
/** Frame-rate independent exponential approach: fraction of the remaining distance covered in dt. */
export const damp = (current: number, target: number, rate: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-rate * dt));

export interface Vec2 { x: number; y: number }
export const v2 = (x = 0, y = 0): Vec2 => ({ x, y });
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.y - a.y);

/** Deterministic PRNG (mulberry32). Every random choice in animation uses a seeded instance. */
export class Rng {
  private s: number;
  constructor(seed = 1) { this.s = seed >>> 0 || 1; }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number { return a + (b - a) * this.next(); }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length) % arr.length]; }
  get seed(): number { return this.s; }
  set seed(v: number) { this.s = v >>> 0 || 1; }
}

/**
 * 2D affine matrix in Pixi's layout: x' = a*x + c*y + tx, y' = b*x + d*y + ty.
 * Kept separate from Pixi so the rig math is unit-testable in Node.
 */
export class Mat {
  constructor(
    public a = 1, public b = 0, public c = 0, public d = 1, public tx = 0, public ty = 0,
  ) {}
  set(a: number, b: number, c: number, d: number, tx: number, ty: number): this {
    this.a = a; this.b = b; this.c = c; this.d = d; this.tx = tx; this.ty = ty;
    return this;
  }
  copyFrom(m: Mat): this { return this.set(m.a, m.b, m.c, m.d, m.tx, m.ty); }
  identity(): this { return this.set(1, 0, 0, 1, 0, 0); }
  /** Local transform: translate(x,y) · rotate(r) · scale(sx,sy). */
  compose(x: number, y: number, r: number, sx: number, sy: number): this {
    const cs = Math.cos(r), sn = Math.sin(r);
    return this.set(cs * sx, sn * sx, -sn * sy, cs * sy, x, y);
  }
  /** this = p · l */
  multiply(p: Mat, l: Mat): this {
    const a = p.a * l.a + p.c * l.b;
    const b = p.b * l.a + p.d * l.b;
    const c = p.a * l.c + p.c * l.d;
    const d = p.b * l.c + p.d * l.d;
    const tx = p.a * l.tx + p.c * l.ty + p.tx;
    const ty = p.b * l.tx + p.d * l.ty + p.ty;
    return this.set(a, b, c, d, tx, ty);
  }
  apply(x: number, y: number, out: Vec2 = { x: 0, y: 0 }): Vec2 {
    out.x = this.a * x + this.c * y + this.tx;
    out.y = this.b * x + this.d * y + this.ty;
    return out;
  }
  applyInverse(x: number, y: number, out: Vec2 = { x: 0, y: 0 }): Vec2 {
    const id = 1 / (this.a * this.d - this.b * this.c);
    const dx = x - this.tx, dy = y - this.ty;
    out.x = (this.d * dx - this.c * dy) * id;
    out.y = (-this.b * dx + this.a * dy) * id;
    return out;
  }
  /** World rotation of the local x axis. */
  get rotation(): number { return Math.atan2(this.b, this.a); }
  /** Determinant sign: -1 when the matrix mirrors. */
  get flip(): number { return this.a * this.d - this.b * this.c < 0 ? -1 : 1; }
}
