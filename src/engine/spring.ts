/**
 * Damped springs for secondary motion (follow-through and overlap).
 *
 * Parameterised the way animators think about it: `freq` is how fast it wobbles (Hz),
 * `zeta` how quickly it settles (1 = no overshoot, 0.3 = bouncy). Integration is semi-implicit
 * Euler with fixed sub-steps, so the result does not depend on the frame rate.
 */
const MAX_H = 1 / 240;

export class Spring {
  value: number;
  velocity = 0;
  target: number;
  constructor(value = 0, public freq = 4, public zeta = 0.5) {
    this.value = value;
    this.target = value;
  }
  reset(v: number): void { this.value = v; this.target = v; this.velocity = 0; }
  step(dt: number): number {
    if (dt <= 0) return this.value;
    const w = 2 * Math.PI * this.freq;
    const n = Math.max(1, Math.ceil(dt / MAX_H));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const acc = w * w * (this.target - this.value) - 2 * this.zeta * w * this.velocity;
      this.velocity += acc * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }
  /** Adds an impulse (units per second), e.g. when something hits the hat. */
  kick(v: number): void { this.velocity += v; }
}

export class Spring2 {
  readonly x: Spring;
  readonly y: Spring;
  constructor(x = 0, y = 0, freq = 4, zeta = 0.5) {
    this.x = new Spring(x, freq, zeta);
    this.y = new Spring(y, freq, zeta);
  }
  setTarget(x: number, y: number): void { this.x.target = x; this.y.target = y; }
  reset(x: number, y: number): void { this.x.reset(x); this.y.reset(y); }
  step(dt: number): void { this.x.step(dt); this.y.step(dt); }
}
