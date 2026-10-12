import { Container, Graphics, Sprite } from 'pixi.js';
import { clamp } from '../engine/math';
import type { Actor, Feature } from './actor';
import { glowTexture } from './fx';

/**
 * The word ICH on the faceplate: custom slab letters, drawn live.
 *
 * Rules (character bible): always the same word, always readable, NEVER mirrored. The rig is
 * mirrored when ICH faces left, so the letter layer counter-flips itself. Brightness follows
 * `@letters` (proud = brighter), speech (each syllable pulses like a VU meter) and
 * `@flicker` (nervous: a cheap neon sign that cannot hold its voltage).
 */
export interface LettersDef {
  bone: string;
  z: number;
  x: number; y: number;
  /** Letter height (units). */
  size: number;
  color: number;
  core: number;
  glow: number;
  glowW: number;
}

/** Letter outlines in a unit box: height 1, baseline at +0.5, centred on x = 0. Exported for tests. */
export function ichGlyphs(): number[][][] {
  const s = 1 / 84; // authored on an 84-unit grid
  const R = (x: number, y: number, w: number, h: number): number[][] => [[(x - 7) * s, y * s, w * s, h * s]];
  // I: slab serifs + stem
  const I = [...R(-92, -42, 40, 14), ...R(-82, -42, 20, 84), ...R(-92, 28, 40, 14)];
  // C: blocky, open to the right with slab terminals
  const C = [...R(-38, -42, 64, 19), ...R(-38, 23, 64, 19), ...R(-38, -42, 21, 84), ...R(14, -42, 14, 30), ...R(14, 12, 14, 30)];
  // H: stems, crossbar, serifs
  const H = [...R(40, -42, 20, 84), ...R(80, -42, 20, 84), ...R(60, -10, 20, 20), ...R(34, -42, 32, 12), ...R(74, -42, 32, 12), ...R(34, 30, 32, 12), ...R(74, 30, 32, 12)];
  return [I, C, H];
}

export class IchLetters implements Feature {
  readonly outer = new Container();
  readonly inner = new Container();
  readonly g = new Graphics();
  readonly glow = new Sprite(glowTexture());
  private flick = 1;
  private flickT = 0;

  constructor(readonly actor: Actor, readonly d: LettersDef) {
    this.glow.anchor.set(0.5);
    this.glow.blendMode = 'add';
    this.inner.addChild(this.glow, this.g);
    this.outer.addChild(this.inner);
    actor.view.addLive({ name: 'letters', bone: d.bone, z: d.z, display: this.outer, ox: d.x, oy: d.y, emissive: true });
  }

  post(a: Actor, dt: number): void {
    const d = this.d;
    // counter-flip: readable whichever way he faces (and during the turn smear)
    this.inner.scale.x = a.facingScale() < 0 ? -1 : 1;
    const base = a.pose.params['letters'] ?? a.expr['letters'] ?? 1;
    const flicker = a.pose.params['flicker'] ?? a.expr['flicker'] ?? 0;
    const power = a.pose.params['power'] ?? a.expr['power'] ?? 1;
    this.flickT -= dt;
    if (this.flickT <= 0) {
      this.flickT = a.rng.range(0.03, 0.12);
      this.flick = a.rng.next() < flicker * 0.55 ? a.rng.range(0.15, 0.55) : 1;
    }
    const v = clamp(base * this.flick * power * (1 + a.talk * 0.4), 0, 1.6);
    const g = this.g;
    g.clear();
    const S = d.size;
    const glyphs = ichGlyphs();
    // the off state still shows the dark letter tubes, so the word is legible even when "off"
    for (const letter of glyphs) for (const [x, y, w, h] of letter) {
      g.roundRect(x * S - 2, y * S - 2, w * S + 4, h * S + 4, 4).fill({ color: 0x241a0c });
    }
    const lit = Math.min(1, v);
    for (const letter of glyphs) for (const [x, y, w, h] of letter) {
      g.roundRect(x * S, y * S, w * S, h * S, 3).fill({ color: d.color, alpha: 0.18 + 0.82 * lit });
    }
    // hot neon core lines through the strokes
    for (const letter of glyphs) for (const [x, y, w, h] of letter) {
      const cx = (x + w / 2) * S, cy = (y + h / 2) * S;
      if (w > h) g.moveTo(x * S + 4, cy).lineTo((x + w) * S - 4, cy);
      else g.moveTo(cx, y * S + 4).lineTo(cx, (y + h) * S - 4);
    }
    g.stroke({ color: d.core, width: Math.max(2, S * 0.05), alpha: 0.85 * lit, cap: 'round' });
    this.glow.tint = d.glow;
    this.glow.alpha = 0.55 * Math.min(1.2, v);
    this.glow.scale.set(d.glowW / 64, (d.glowW * 0.62) / 64);
    this.glow.visible = v > 0.02;
  }
}
