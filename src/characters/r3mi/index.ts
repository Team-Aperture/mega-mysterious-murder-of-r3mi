import type { RigDef } from '../../anim/rig';
import type { GaitDef } from '../../anim/gait';
import type { CharacterSpec } from '../actor';
import { Optic } from '../optic';
import { Handedness, Hose, Led, SpringBone, Tank } from '../features';
import { CROWN, EYE, HUB, J, SH_CAP, TANK, tankPt } from './geo';
import { r3miSheet } from './sheet';
import { R3MI_CLIPS } from './clips';

const b = (name: string, parent: string | null, p: readonly number[]) => ({ name, parent, x: p[0], y: p[1] });

export const R3MI_RIG: RigDef = {
  id: 'r3mi',
  bones: [
    b('root', null, [0, 0]),
    b('pelvis', 'root', J.pelvis),
    b('torso', 'pelvis', J.torso),
    b('neck', 'torso', J.neck),
    b('head', 'neck', J.head),
    b('tank', 'torso', J.tank),
    b('upperarm.near', 'torso', J.shN), b('forearm.near', 'upperarm.near', J.elN), b('hand.near', 'forearm.near', J.wrN),
    b('upperarm.far', 'torso', J.shF), b('forearm.far', 'upperarm.far', J.elF), b('hand.far', 'forearm.far', J.wrF),
    b('thigh.near', 'pelvis', J.hipN), b('shin.near', 'thigh.near', J.kneeN), b('foot.near', 'shin.near', J.ankleN),
    b('thigh.far', 'pelvis', J.hipF), b('shin.far', 'thigh.far', J.kneeF), b('foot.far', 'shin.far', J.ankleF),
  ],
  slots: [
    { name: 'hand.far', bone: 'hand.far', z: 2 },
    { name: 'forearm.far', bone: 'forearm.far', z: 3 },
    { name: 'elbow.far', bone: 'forearm.far', z: 4 },
    { name: 'upperarm.far', bone: 'upperarm.far', z: 5 },
    { name: 'shoulder.far', bone: 'upperarm.far', z: 6 },
    { name: 'foot.far', bone: 'foot.far', z: 8 },
    { name: 'shin.far', bone: 'shin.far', z: 9 },
    { name: 'knee.far', bone: 'shin.far', z: 10 },
    { name: 'thigh.far', bone: 'thigh.far', z: 11 },
    { name: 'tank.back', bone: 'tank', z: 12 },
    { name: 'tank.front', bone: 'tank', z: 14 },
    { name: 'thigh.near', bone: 'thigh.near', z: 20 },
    { name: 'shin.near', bone: 'shin.near', z: 21 },
    { name: 'knee.near', bone: 'shin.near', z: 22 },
    { name: 'foot.near', bone: 'foot.near', z: 23 },
    { name: 'neck', bone: 'neck', z: 25 },
    { name: 'pelvis', bone: 'pelvis', z: 26 },
    { name: 'waist', bone: 'torso', z: 27 },
    { name: 'torso', bone: 'torso', z: 28 },
    { name: 'head', bone: 'head', z: 31 },
    { name: 'upperarm.near', bone: 'upperarm.near', z: 35 },
    { name: 'forearm.near', bone: 'forearm.near', z: 36 },
    { name: 'hand.near', bone: 'hand.near', z: 37 },
    { name: 'elbow.near', bone: 'forearm.near', z: 38 },
    { name: 'shoulder.near', bone: 'upperarm.near', z: 39 },
    { name: 'cowl', bone: 'torso', z: 30 },
  ],
};

export const R3MI_GAIT: GaitDef = {
  pelvis: 'pelvis', torso: 'torso', head: 'head',
  legs: [
    { thigh: 'thigh.near', shin: 'shin.near', foot: 'foot.near', phase: 0 },
    { thigh: 'thigh.far', shin: 'shin.far', foot: 'foot.far', phase: 0.5 },
  ],
  arms: [
    { upper: 'upperarm.near', fore: 'forearm.near', phase: 0 },
    { upper: 'upperarm.far', fore: 'forearm.far', phase: 0.5 },
  ],
  stride: 410, speed: 300, duty: 0.6, lift: 42, bob: 11, bobPhase: 0.22, drop: 20,
  lean: 6, heel: 16, toe: 26, footLen: 70, armSwing: 18, elbow: 14, armLag: 0.09,
  flavor: {
    name: 'r3mi.walkFlavor', duration: 1, loop: true,
    tracks: {
      // his head floats on the long neck and nods a beat late
      'neck.r': [{ t: 0, v: 3 }, { t: 0.25, v: -1 }, { t: 0.5, v: 3 }, { t: 0.75, v: -1 }],
      'head.r': [{ t: 0.08, v: -2 }, { t: 0.33, v: 3 }, { t: 0.58, v: -2 }, { t: 0.83, v: 3 }],
      // loose wrists
      'hand.near.r': [{ t: 0.1, v: 8 }, { t: 0.6, v: -10 }],
      'hand.far.r': [{ t: 0.6, v: 8 }, { t: 0.1, v: -10 }],
    },
  },
};

const NEUTRAL = {
  open: 1, squash: 1, arc: 0, shape: 0, glow: 0.62, tilt: 0, size: 1, lookX: 0, lookY: 0,
  power: 1, shake: 0, chestLed: 1, jointLights: 1,
};

export const R3MI: CharacterSpec = {
  id: 'r3mi',
  name: 'R-3MI',
  rig: R3MI_RIG,
  sheet: r3miSheet,
  clips: R3MI_CLIPS,
  gait: R3MI_GAIT,
  idle: 'idle',
  height: 888,
  headTop: [18, -900],
  headBone: 'head',
  shadow: 92,
  expressions: {
    neutral: NEUTRAL,
    happy: { shape: 1, arc: 1, glow: 0.95 },
    curious: { size: 1.1, glow: 0.78, lookX: 0.35 },
    suspicious: { open: 0.5, squash: 0.8, tilt: -0.18, lookX: -0.55, glow: 0.5 },
    annoyed: { open: 0.34, squash: 0.6, tilt: 0.24, glow: 0.45 },
    panic: { size: 1.28, glow: 1, shake: 1 },
    anxious: { size: 0.7, glow: 0.55, shake: 0.22, lookY: 0.2 },
    sad: { shape: 1, arc: -1, glow: 0.4 },
    sleepy: { open: 0.22, squash: 0.9, glow: 0.3, lookY: 0.3 },
    off: { open: 0, power: 0, glow: 0, chestLed: 0.12, jointLights: 0 },
    proud: { shape: 3, glow: 1 },
    error: { shape: 4, glow: 0.9 },
  },
  build(a) {
    a.features.push(new SpringBone(a, { bone: 'head', freq: 2.6, zeta: 0.35, gainX: 0.00035, gainY: 0.0004, limit: 9 }));
    a.features.push(new SpringBone(a, { bone: 'tank', freq: 3.2, zeta: 0.3, gainX: 0.00025, gainY: 0.0003, limit: 5 }));
    a.features.push(new Optic(a, {
      bone: 'head', x: EYE.x, y: EYE.y, z: 32, socketR: 33, irisR: 24, bezelR: 0,
      bezelColor: 0x9a958c, bezelHi: 0xffffff, socketColor: 0x0e1410,
      ringColor: 0x2ecf62, irisColor: 0x5dff9a, coreColor: 0xeafff1, glowColor: 0x2ecf62, glowSize: 150,
      saccades: 1.6, blink: [2.2, 5.5],
    }));
    a.features.push(new Tank(a, { bone: 'tank', z: 13, ...TANK, level: 0.58, fluid: 0x45e07a, fluidHi: 0x9dffc4, glow: 0x2ecf62 }));
    const hose = { base: '#1f2a1e', accent: '#b6e05a' };
    // the elbow hose is fluid-filled: translucent green, glowing like the tank
    const fluidHose = { base: '#3dbb55', accent: '#d6ffd9', emissive: true };
    const T = TANK;
    const top = tankPt(T.x + T.w / 2 - 6, T.y - 26), corner = tankPt(T.x - 2, T.y + T.h + 10);
    const at = (bone: string, p: readonly number[], dx = 0, dy = 0) => ({ bone, x: p[0] + dx, y: p[1] + dy });
    // canon: exactly three hoses. Two round hoops over the top: crown → junction behind the head
    // (the taller one) and junction → tank-top socket (in front where they meet) …
    a.features.push(new Hose(a, { name: 'a', z: 15, a: at('head', CROWN, -9, -12), b: at('tank', HUB, 0, -4), c: { bone: 'head', x: -14, y: -968 }, c2: { bone: 'tank', x: -78, y: -952 }, width: 16, segments: 22, ...hose }));
    a.features.push(new Hose(a, { name: 'b', z: 16, a: at('tank', HUB, -6, -8), b: at('tank', top), c: { bone: 'tank', x: -74, y: -904 }, c2: { bone: 'tank', x: top[0] - 6, y: -906 }, width: 16, segments: 22, ...hose }));
    // … and one from the tank's back-bottom corner, straight down, then a ')' bow behind the
    // near upper arm, plugging into the back of his (left) elbow under the ringed disk. Its twin
    // goes to the far elbow while he faces right (Handedness), so it is always the left elbow.
    a.features.push(new Hose(a, { name: 'c', z: 34, a: at('tank', corner), b: at('forearm.near', J.elN, -28, 26), c: { bone: 'tank', x: corner[0] - 6, y: corner[1] + 70 }, c2: { bone: 'forearm.near', x: J.elN[0] - 85, y: J.elN[1] - 10 }, width: 18, segments: 22, ...fluidHose }));
    // (facing right the left elbow is the far one: the twin drops behind his back and comes round low)
    a.features.push(new Hose(a, { name: 'cFar', z: 6.5, a: at('tank', corner), b: at('forearm.far', J.elF, -28, 26), c: { bone: 'tank', x: corner[0] + 14, y: corner[1] + 170 }, c2: { bone: 'forearm.far', x: J.elF[0] - 80, y: J.elF[1] + 70 }, width: 18, segments: 22, ...fluidHose }));
    // chest slot: a notch at the bottom of the plate on the body centre line, two lit cells (canon)
    a.features.push(new Led(a, { name: 'chest', bone: 'torso', z: 29, x: 33, y: -514, w: 11, h: 26, color: 0x7dffae, glow: 0x2ecf62, param: 'chestLed' }));
    a.features.push(new Led(a, { name: 'chest2', bone: 'torso', z: 29, x: 33, y: -487, w: 10, h: 10, color: 0x7dffae, glow: 0x2ecf62, param: 'chestLed' }));
    // green rings on the big shoulder disk and the elbow of his left arm
    a.features.push(new Led(a, { name: 'shoulder', bone: 'upperarm.near', z: 40, x: J.shN[0] + SH_CAP[0], y: J.shN[1] + SH_CAP[1], w: 36, h: 5.5, color: 0x5dff9a, glow: 0x2ecf62, param: 'jointLights', ring: true }));
    a.features.push(new Led(a, { name: 'elbow', bone: 'forearm.near', z: 41, x: J.elN[0] - 10, y: J.elN[1] - 2, w: 24, h: 4.5, color: 0x5dff9a, glow: 0x2ecf62, param: 'jointLights', ring: true }));
    a.features.push(new Led(a, { name: 'shoulderFar', bone: 'upperarm.far', z: 6.8, x: J.shF[0] + SH_CAP[0], y: J.shF[1] + SH_CAP[1], w: 36, h: 5.5, color: 0x5dff9a, glow: 0x2ecf62, param: 'jointLights', ring: true }));
    a.features.push(new Led(a, { name: 'elbowFar', bone: 'forearm.far', z: 6.9, x: J.elF[0] - 6, y: J.elF[1] - 2, w: 24, h: 4.5, color: 0x5dff9a, glow: 0x2ecf62, param: 'jointLights', ring: true }));
    // the sheet is the canon mirrored (it faces right); facing right, the left arm is the far one
    a.features.push(new Handedness(a, {
      swapWhen: 1,
      attach: { 'shoulder.near': 'shoulder.near#plain', 'shoulder.far': 'shoulder.far#disk', 'elbow.near': 'elbow.near#plain', 'elbow.far': 'elbow.far#ringed', cowl: 'cowl#plain' },
      canon: ['led.shoulder', 'led.elbow', 'hose.c'],
      swapped: ['led.shoulderFar', 'led.elbowFar', 'hose.cFar'],
    }));
  },
};
