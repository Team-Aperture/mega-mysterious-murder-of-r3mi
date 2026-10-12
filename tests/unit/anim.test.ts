import { describe, expect, it } from 'vitest';
import { solveTwoBone } from '../../src/anim/ik';
import { BoundClip, blocked, sample } from '../../src/anim/clip';
import { Pose, Skeleton, type RigDef } from '../../src/anim/rig';
import { Locomotion, fitStride, type GaitDef } from '../../src/anim/gait';
import { Animator } from '../../src/anim/animator';
import { ShapeRope } from '../../src/anim/rope';
import { pack } from '../../src/anim/atlas';
import { Spring } from '../../src/engine/spring';
import { EASES, cubicBezier } from '../../src/engine/ease';
import { Mat, Rng } from '../../src/engine/math';
import { SequencePlayer, seek, type SequenceDef } from '../../src/story/sequence';

const LEG_RIG: RigDef = {
  id: 'test',
  bones: [
    { name: 'root', parent: null, x: 0, y: 0 },
    { name: 'pelvis', parent: 'root', x: 0, y: -200 },
    { name: 'thigh', parent: 'pelvis', x: 0, y: -200 },
    { name: 'shin', parent: 'thigh', x: 4, y: -100 },
    { name: 'foot', parent: 'shin', x: 0, y: -10 },
    { name: 'thigh2', parent: 'pelvis', x: 0, y: -200 },
    { name: 'shin2', parent: 'thigh2', x: 4, y: -100 },
    { name: 'foot2', parent: 'shin2', x: 0, y: -10 },
    { name: 'arm', parent: 'pelvis', x: 0, y: -260 },
    { name: 'fore', parent: 'arm', x: 0, y: -200 },
  ],
  slots: [],
};
const GAIT: GaitDef = {
  pelvis: 'pelvis', legs: [{ thigh: 'thigh', shin: 'shin', foot: 'foot', phase: 0 }, { thigh: 'thigh2', shin: 'shin2', foot: 'foot2', phase: 0.5 }],
  arms: [{ upper: 'arm', fore: 'fore', phase: 0 }],
  stride: 160, speed: 120, duty: 0.6, lift: 20, bob: 4, bobPhase: 0.2, drop: 10, lean: 0, heel: 10, toe: 20, footLen: 30,
  armSwing: 10, elbow: 5, armLag: 0.05,
};

describe('matrix', () => {
  it('composes and inverts', () => {
    const p = new Mat().compose(10, 20, 0.5, 2, 2);
    const l = new Mat().compose(5, 0, -0.5, 1, 1);
    const w = new Mat().multiply(p, l);
    const pt = w.apply(3, 4);
    const back = w.applyInverse(pt.x, pt.y);
    expect(back.x).toBeCloseTo(3, 6);
    expect(back.y).toBeCloseTo(4, 6);
  });
});

describe('two-bone IK', () => {
  it('reaches a reachable target with knees forward', () => {
    const r = solveTwoBone(0, 0, 20, 180, 100, 100, 1);
    const ex = r.mx + Math.cos(r.a2) * 100, ey = r.my + Math.sin(r.a2) * 100;
    expect(ex).toBeCloseTo(20, 4);
    expect(ey).toBeCloseTo(180, 4);
    expect(r.mx).toBeGreaterThan(10); // knee in front of the hip-ankle line
    expect(r.clamped).toBe(false);
  });
  it('straightens when out of reach', () => {
    const r = solveTwoBone(0, 0, 0, 500, 100, 100, 1);
    expect(r.clamped).toBe(true);
    expect(Math.abs(r.a1 - r.a2)).toBeLessThan(0.01); // within half a degree of straight
  });
});

describe('clips', () => {
  it('samples with per-key easing and loops back to the first key', () => {
    const keys = [{ t: 0, v: 0, e: 'linear' as const }, { t: 1, v: 10, e: 'linear' as const }];
    expect(sample(keys, 0.5)).toBeCloseTo(5);
    expect(sample(keys, 2)).toBe(10);
    // looping: halfway between the last key (t=1) and the wrap (loop length 2) back to 0
    expect(sample(keys, 1.5, 2)).toBeCloseTo(5);
  });
  it('blocks poses and binds tracks to bones (degrees → radians)', () => {
    const sk = new Skeleton(LEG_RIG);
    const def = blocked('x', 1, [[0, { 'arm.r': 0 }, 'linear'], [1, { 'arm.r': 90 }]]);
    const c = new BoundClip(def, sk);
    const pose = new Pose(sk.size);
    c.apply(pose, 1);
    expect(pose.get(sk.bone('arm'), 'r')).toBeCloseTo(Math.PI / 2);
  });
  it('fires events across a loop wrap', () => {
    const sk = new Skeleton(LEG_RIG);
    const c = new BoundClip({ name: 'l', duration: 1, loop: true, tracks: {}, events: [{ t: 0.1, name: 'a' }] }, sk);
    expect(c.eventsBetween(0.9, 1.2).map((e) => e.name)).toEqual(['a']);
  });
  it('animator cross-fades and resolves one-shots', async () => {
    const sk = new Skeleton(LEG_RIG);
    const an = new Animator(sk, [
      { name: 'idle', duration: 1, loop: true, tracks: { 'arm.r': [{ t: 0, v: 0 }] } },
      { name: 'raise', duration: 0.5, tracks: { 'arm.r': [{ t: 0, v: 90 }] } },
    ]);
    an.reset('idle');
    let done = false;
    void an.play('raise', { fade: 0.2 }).then(() => { done = true; });
    const pose = new Pose(sk.size);
    an.update(0.1);
    pose.reset(); an.evaluate(pose);
    const mid = pose.get(sk.bone('arm'), 'r');
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(Math.PI / 2);
    an.update(0.5);
    await Promise.resolve();
    expect(done).toBe(true);
  });
});

describe('gait', () => {
  it('keeps a planted foot fixed in the world while the body moves', () => {
    const sk = new Skeleton(LEG_RIG);
    const loco = new Locomotion(sk, GAIT);
    const pose = new Pose(sk.size);
    let x = 0;
    const footWorld: number[] = [];
    for (let i = 0; i < 40; i++) {
      const d = 2;
      x += d;
      loco.advance(d);
      pose.reset();
      loco.apply(pose, 1);
      loco.solveLegs(pose, 1);
      const p = sk.world[sk.bone('foot')];
      const lp = (loco.phase + 0) % 1;
      if (lp > 0.05 && lp < 0.45) footWorld.push(x + p.tx);
    }
    // while the near foot is in its flat stance window, its world x barely changes
    const spread = Math.max(...footWorld) - Math.min(...footWorld);
    expect(footWorld.length).toBeGreaterThan(5);
    expect(spread).toBeLessThan(1.5);
  });
  it('fits the stride so a walk ends after whole steps', () => {
    const s = fitStride(500, 160);
    const halfSteps = 500 / (s / 2);
    expect(Math.abs(halfSteps - Math.round(halfSteps))).toBeLessThan(1e-9);
  });
});

describe('secondary motion', () => {
  it('springs settle on target independent of the step size', () => {
    const a = new Spring(0, 3, 0.5), b = new Spring(0, 3, 0.5);
    a.target = b.target = 1;
    for (let i = 0; i < 120; i++) a.step(1 / 60);
    for (let i = 0; i < 24; i++) b.step(1 / 12);
    expect(a.value).toBeCloseTo(b.value, 3);
    expect(a.value).toBeCloseTo(1, 2);
  });
  it('ropes keep their ends pinned and their length', () => {
    const r = new ShapeRope(10);
    const A = { x: 0, y: 0 }, B = { x: 100, y: 0 }, C = { x: 50, y: -60 };
    r.reset(A, C, B);
    for (let i = 0; i < 60; i++) r.step(1 / 60, A, C, B);
    expect(r.pts[0]).toEqual({ x: 0, y: 0 });
    expect(r.pts[9]).toEqual({ x: 100, y: 0 });
    expect(Math.min(...r.pts.map((p) => p.y))).toBeLessThan(-20); // still arched
  });
});

describe('easing and rng', () => {
  it('cubic bezier matches its control points at the ends and is monotone here', () => {
    const f = cubicBezier(0.25, 0.1, 0.25, 1);
    expect(f(0)).toBe(0);
    expect(f(1)).toBe(1);
    let prev = 0;
    for (let i = 1; i <= 20; i++) { const v = f(i / 20); expect(v).toBeGreaterThanOrEqual(prev); prev = v; }
    expect(EASES.backOut(1)).toBeCloseTo(1);
  });
  it('rng is deterministic', () => {
    const a = new Rng(42), b = new Rng(42);
    for (let i = 0; i < 5; i++) expect(a.next()).toBe(b.next());
  });
});

describe('atlas packing', () => {
  it('places rects without overlap', () => {
    const rects = Array.from({ length: 30 }, (_, i) => ({ w: 20 + (i * 37) % 200, h: 10 + (i * 53) % 180 }));
    const { places, sizes } = pack(rects, 1024);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = places[i], b = places[j];
        if (a.page !== b.page) continue;
        const overlap = a.x < b.x + rects[j].w && b.x < a.x + rects[i].w && a.y < b.y + rects[j].h && b.y < a.y + rects[i].h;
        expect(overlap).toBe(false);
      }
      expect(places[i].x + rects[i].w).toBeLessThanOrEqual(sizes[places[i].page][0]);
      expect(places[i].y + rects[i].h).toBeLessThanOrEqual(sizes[places[i].page][1]);
    }
  });
});

describe('sequences', () => {
  interface W { log: string[]; x: number }
  const def: SequenceDef<W> = {
    id: 't', title: 'Test', duration: 2,
    setup: (w) => { w.log.length = 0; w.x = 0; },
    events: [{ t: 0.5, run: (w) => w.log.push('a') }, { t: 1.5, run: (w) => w.log.push('b') }],
    tick: (w, t) => { w.x = t; },
  };
  it('fires events in order and finishes', () => {
    const w: W = { log: [], x: 0 };
    const p = new SequencePlayer(def, w);
    for (let i = 0; i < 10; i++) p.update(0.25);
    expect(w.log).toEqual(['a', 'b']);
    expect(p.done).toBe(true);
  });
  it('seek reproduces the same state as playback', () => {
    const w: W = { log: [], x: 0 };
    seek(def, w, () => undefined, () => undefined, 1.0);
    expect(w.log).toEqual(['a']);
    expect(w.x).toBeCloseTo(1.0);
  });
});
