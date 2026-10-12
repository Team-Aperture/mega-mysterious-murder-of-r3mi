import { Container, Graphics, Sprite } from 'pixi.js';
import { clamp } from '../engine/math';
import type { Actor, Feature } from './actor';
import { glowTexture } from './fx';

/**
 * Surface details of a spherical body (V-TGM): panel seams and the top slit lamp, projected
 * with the same yaw/pitch as the eye. When she turns, the seams sweep across the sphere and
 * the lamp slides over the crown, so the whole ball reads as rotating, not as a sticker moving.
 */
export interface SphereFaceDef {
  bone: string;
  z: number;
  x: number; y: number; r: number;
  baseYaw: number;
  basePitch: number;
  seamColor: number;
  lampColor: number;
  lampGlow: number;
}

export class SphereFace implements Feature {
  readonly g = new Graphics();
  readonly glow = new Sprite(glowTexture());
  constructor(readonly actor: Actor, readonly d: SphereFaceDef) {
    const c = new Container();
    this.glow.anchor.set(0.5);
    this.glow.blendMode = 'add';
    c.addChild(this.g, this.glow);
    actor.view.addLive({ name: 'sphereface', bone: d.bone, z: d.z, display: c, ox: d.x, oy: d.y });
  }

  post(a: Actor): void {
    const d = this.d;
    const param = (k: string, f: number) => a.pose.params[`eye.${k}`] ?? a.expr[k] ?? f;
    const yaw = d.baseYaw + param('yaw', 0);
    const pitch = d.basePitch + param('pitch', 0);
    const R = d.r;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    // (lon, lat) relative to the eye direction → screen, plus depth
    const proj = (lon: number, lat: number): [number, number, number] => {
      const x = Math.cos(lat) * Math.sin(lon + yaw);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon + yaw);
      const y2 = y * cp + z * sp;
      const z2 = -y * sp + z * cp;
      return [x * R, -y2 * R, z2];
    };
    const g = this.g;
    g.clear();
    const curve = (fn: (t: number) => [number, number], n: number) => {
      let pen = false;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const [lon, lat] = fn(t);
        const [x, y, z] = proj(lon, lat);
        if (z > 0.04) {
          if (!pen) g.moveTo(x, y); else g.lineTo(x, y);
          pen = true;
        } else pen = false;
      }
    };
    // meridians behind and beside the eye, and a belt below it
    curve((t) => [-1.15, -1.25 + 2.5 * t], 30);
    curve((t) => [1.25, -1.25 + 2.5 * t], 30);
    curve((t) => [-Math.PI + 2 * Math.PI * t, -0.48], 60);
    g.stroke({ color: d.seamColor, width: 2.6, alpha: 0.75, cap: 'round' });
    curve((t) => [-1.12, -1.2 + 2.4 * t], 30);
    g.stroke({ color: 0xffffff, width: 1.2, alpha: 0.35 });
    // top slit lamp (a small rectangle in lon/lat space, so it foreshortens naturally)
    const lampLon = -0.12, lampLat = 1.0;
    const pts: number[] = [];
    const ring: [number, number][] = [];
    for (let i = 0; i <= 8; i++) ring.push([lampLon - 0.22 + 0.44 * (i / 8), lampLat - 0.07]);
    for (let i = 0; i <= 3; i++) ring.push([lampLon + 0.22, lampLat - 0.07 + 0.14 * (i / 3)]);
    for (let i = 8; i >= 0; i--) ring.push([lampLon - 0.22 + 0.44 * (i / 8), lampLat + 0.07]);
    for (let i = 3; i >= 0; i--) ring.push([lampLon - 0.22, lampLat - 0.07 + 0.14 * (i / 3)]);
    let vis = 0, mx = 0, my = 0;
    for (const [lo, la] of ring) {
      const [x, y, z] = proj(lo, la);
      pts.push(x, y);
      if (z > 0) { vis++; mx += x; my += y; }
    }
    const power = param('power', 1);
    const lamp = clamp((a.pose.params['lamp'] ?? a.expr['lamp'] ?? 1) * power, 0, 1.6);
    if (vis > ring.length * 0.6) {
      g.poly(pts).fill({ color: 0x14111a }).stroke({ color: 0x0b0a10, width: 3 });
      // inner light
      const inner: number[] = [];
      for (let i = 0; i < pts.length; i += 2) inner.push(mx / vis + (pts[i] - mx / vis) * 0.72, my / vis + (pts[i + 1] - my / vis) * 0.62);
      g.poly(inner).fill({ color: d.lampColor, alpha: 0.2 + 0.8 * Math.min(1, lamp) });
      this.glow.visible = true;
      this.glow.position.set(mx / vis, my / vis);
      this.glow.tint = d.lampGlow;
      this.glow.alpha = 0.6 * Math.min(1, lamp);
      this.glow.scale.set((40 + 30 * lamp) / 64);
    } else this.glow.visible = false;
  }
}
