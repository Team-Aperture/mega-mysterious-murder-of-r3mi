import type { Vec2 } from '../engine/math';

/**
 * Shape-keeping rope for hoses and cables.
 *
 * A pure Verlet rope would sag into a U, but R-3MI's and V-TGM's hoses hold an arch. So every
 * point is pulled toward a *rest shape* (a Bezier between the two attachment points with control
 * points that move with the body: quadratic with one, cubic with two for round loops), while
 * distance constraints keep the hose from stretching. Result: it keeps its silhouette, but lags,
 * swings and wobbles when the body moves.
 */
export class ShapeRope {
  readonly pts: Vec2[];
  private readonly prev: Vec2[];
  private readonly target: Vec2[];
  private restLen = 0;

  constructor(
    readonly n: number,
    /** Pull toward the rest shape per second (higher = stiffer). */
    public stiffness = 18,
    /** Velocity kept per second (0..1). Lower = more damping. */
    public keep = 0.04,
    public gravity = 900,
  ) {
    this.pts = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    this.prev = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    this.target = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
  }

  private shape(a: Vec2, c: Vec2, b: Vec2, c2?: Vec2): void {
    let len = 0;
    for (let i = 0; i < this.n; i++) {
      const t = i / (this.n - 1);
      const u = 1 - t;
      const p = this.target[i];
      if (c2) {
        p.x = u * u * u * a.x + 3 * u * u * t * c.x + 3 * u * t * t * c2.x + t * t * t * b.x;
        p.y = u * u * u * a.y + 3 * u * u * t * c.y + 3 * u * t * t * c2.y + t * t * t * b.y;
      } else {
        p.x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
        p.y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
      }
      if (i > 0) len += Math.hypot(p.x - this.target[i - 1].x, p.y - this.target[i - 1].y);
    }
    this.restLen = len / (this.n - 1);
  }

  /** Snap to the rest shape (no motion). */
  reset(a: Vec2, c: Vec2, b: Vec2, c2?: Vec2): void {
    this.shape(a, c, b, c2);
    for (let i = 0; i < this.n; i++) {
      this.pts[i].x = this.prev[i].x = this.target[i].x;
      this.pts[i].y = this.prev[i].y = this.target[i].y;
    }
  }

  /** a, b: attachment points; c (and c2 for a cubic): Bezier controls, all in the same space. */
  step(dt: number, a: Vec2, c: Vec2, b: Vec2, c2?: Vec2): void {
    if (dt <= 0) return;
    this.shape(a, c, b, c2);
    const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / sub;
    const keep = Math.pow(this.keep, h);
    const pull = 1 - Math.exp(-this.stiffness * h);
    for (let s = 0; s < sub; s++) {
      for (let i = 1; i < this.n - 1; i++) {
        const p = this.pts[i], q = this.prev[i], t = this.target[i];
        const vx = (p.x - q.x) * keep, vy = (p.y - q.y) * keep;
        q.x = p.x; q.y = p.y;
        p.x += vx;
        p.y += vy + this.gravity * h * h;
        p.x += (t.x - p.x) * pull;
        p.y += (t.y - p.y) * pull;
      }
      const first = this.pts[0], last = this.pts[this.n - 1];
      first.x = a.x; first.y = a.y; last.x = b.x; last.y = b.y;
      for (let it = 0; it < 3; it++) {
        for (let i = 0; i < this.n - 1; i++) {
          const p = this.pts[i], q = this.pts[i + 1];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.hypot(dx, dy) || 1e-6;
          const diff = (d - this.restLen) / d;
          const wp = i === 0 ? 0 : 0.5, wq = i + 1 === this.n - 1 ? 0 : 0.5;
          const sum = wp + wq || 1;
          p.x += dx * diff * (wp / sum); p.y += dy * diff * (wp / sum);
          q.x -= dx * diff * (wq / sum); q.y -= dy * diff * (wq / sum);
        }
      }
    }
  }
}
