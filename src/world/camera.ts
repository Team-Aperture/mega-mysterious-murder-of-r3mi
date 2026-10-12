import { Container } from 'pixi.js';
import { clamp, damp, lerp } from '../engine/math';
import { ease, type EaseSpec } from '../engine/ease';

/**
 * Stage camera with weight: it eases toward its target, leads a walking character in the
 * direction of travel, frames groups for dialogue, and plays scripted moves.
 * Parallax layers move with `factor` (outside < 1 < foreground).
 *
 * Framing: the visible height is ~1100 units in landscape; on narrow (portrait) screens the
 * camera keeps at least ~1150 units of width, so a conversation always fits (letterboxed).
 */
export interface ParallaxLayer { c: Container; factor: number; yFactor?: number }

interface Move { fromX: number; fromY: number; fromZ: number; toX: number; toY: number; toZ: number; t: number; dur: number; e: EaseSpec; resolve: () => void }

export class Camera {
  x = 0;
  y = -430;
  zoom = 1;
  /** Desired framing; the camera eases toward it unless a scripted move runs. */
  tx = 0;
  ty = -430;
  tz = 1;
  /** Follow target (world x getter) and look-ahead (units, signed by facing). */
  follow: (() => { x: number; lead: number }) | null = null;
  bounds = { left: -Infinity, right: Infinity };
  rate = 3.2;
  private move: Move | null = null;
  readonly layers: ParallaxLayer[] = [];
  viewW = 1280;
  viewH = 720;
  /** World units per screen pixel at zoom 1, recomputed on resize. */
  base = 1;
  /** Screen-space shake (pixels), decays. Used only for real impacts. */
  private shakeA = 0;
  private shakeT = 0;

  resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
    this.base = Math.min(h / 1100, w / 1150);
  }

  get scale(): number { return this.base * this.zoom; }
  /** Half the visible world width at the current zoom. */
  get halfW(): number { return this.viewW / this.scale / 2; }
  get halfH(): number { return this.viewH / this.scale / 2; }

  /** Eased scripted move; resolves when done. */
  moveTo(x: number, y: number, zoom: number, dur: number, e: EaseSpec = 'inOut'): Promise<void> {
    this.move?.resolve();
    if (dur <= 0) {
      this.x = this.tx = x; this.y = this.ty = y; this.zoom = this.tz = zoom;
      this.move = null;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.move = { fromX: this.x, fromY: this.y, fromZ: this.zoom, toX: x, toY: y, toZ: zoom, t: 0, dur, e, resolve };
    });
  }

  /** Frames a set of world x positions (with padding) at a vertical centre. */
  frame(xs: number[], y = -430, pad = 260, minZoom = 0.8, maxZoom = 1.5): { x: number; zoom: number } {
    const lo = Math.min(...xs) - pad, hi = Math.max(...xs) + pad;
    const x = (lo + hi) / 2;
    const wantW = hi - lo;
    const zoom = clamp(this.viewW / this.base / wantW, minZoom, maxZoom);
    this.tx = x; this.ty = y; this.tz = zoom;
    return { x, zoom };
  }

  shake(px: number): void { this.shakeA = Math.max(this.shakeA, px); this.shakeT = 0; }

  update(dt: number): void {
    if (this.move) {
      const m = this.move;
      m.t += dt;
      const k = ease(m.e)(clamp(m.t / m.dur));
      this.x = lerp(m.fromX, m.toX, k);
      this.y = lerp(m.fromY, m.toY, k);
      this.zoom = lerp(m.fromZ, m.toZ, k);
      this.tx = this.x; this.ty = this.y; this.tz = this.zoom;
      if (m.t >= m.dur) { this.move = null; m.resolve(); }
    } else {
      if (this.follow) {
        const f = this.follow();
        this.tx = f.x + f.lead;
      }
      this.x = damp(this.x, this.tx, this.rate, dt);
      this.y = damp(this.y, this.ty, this.rate, dt);
      this.zoom = damp(this.zoom, this.tz, this.rate * 0.8, dt);
    }
    // keep inside the cabin
    const hw = this.halfW;
    const lo = this.bounds.left + hw, hi = this.bounds.right - hw;
    if (lo < hi) this.x = clamp(this.x, lo, hi); else this.x = (this.bounds.left + this.bounds.right) / 2;
    this.shakeT += dt;
    this.shakeA *= Math.exp(-dt * 9);
    this.apply();
  }

  apply(): void {
    const s = this.scale;
    const sx = this.shakeA > 0.2 ? Math.sin(this.shakeT * 70) * this.shakeA : 0;
    const sy = this.shakeA > 0.2 ? Math.cos(this.shakeT * 53) * this.shakeA * 0.6 : 0;
    for (const l of this.layers) {
      l.c.scale.set(s);
      l.c.position.set(this.viewW / 2 - this.x * l.factor * s + sx, this.viewH / 2 - this.y * (l.yFactor ?? 1) * s + sy);
    }
  }

  /** World → screen (layer factor 1). */
  toScreen(x: number, y: number): { x: number; y: number } {
    const s = this.scale;
    return { x: this.viewW / 2 + (x - this.x) * s, y: this.viewH / 2 + (y - this.y) * s };
  }
  /** Screen → world (layer factor 1). */
  toWorld(px: number, py: number): { x: number; y: number } {
    const s = this.scale;
    return { x: this.x + (px - this.viewW / 2) / s, y: this.y + (py - this.viewH / 2) / s };
  }
}
