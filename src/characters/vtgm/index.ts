import type { RigDef } from '../../anim/rig';
import type { GaitDef } from '../../anim/gait';
import type { CharacterSpec } from '../actor';
import { Optic } from '../optic';
import { Hose, Led, SpringBone, Tank } from '../features';
import { SphereFace } from '../sphereFace';
import { EYE_PITCH, EYE_YAW, J, PAL, SPHERE, TANK } from './geo';
import { vtgmSheet } from './sheet';
import { VTGM_CLIPS } from './clips';

const b = (name: string, parent: string | null, p: readonly number[]) => ({ name, parent, x: p[0], y: p[1] });

export const VTGM_RIG: RigDef = {
  id: 'vtgm',
  bones: [
    b('root', null, [0, 0]),
    b('pelvis', 'root', J.pelvis),
    b('body', 'pelvis', J.body),
    b('tank', 'body', J.tank),
    b('upperarm.near', 'body', J.shN), b('forearm.near', 'upperarm.near', J.elN), b('hand.near', 'forearm.near', J.wrN),
    b('upperarm.far', 'body', J.shF), b('forearm.far', 'upperarm.far', J.elF), b('hand.far', 'forearm.far', J.wrF),
    b('thigh.near', 'pelvis', J.hipN), b('shin.near', 'thigh.near', J.kneeN), b('foot.near', 'shin.near', J.ankleN),
    b('thigh.far', 'pelvis', J.hipF), b('shin.far', 'thigh.far', J.kneeF), b('foot.far', 'shin.far', J.ankleF),
  ],
  slots: [
    { name: 'tank.back', bone: 'tank', z: 1 },
    { name: 'tank.front', bone: 'tank', z: 3 },
    { name: 'hand.far', bone: 'hand.far', z: 5 },
    { name: 'forearm.far', bone: 'forearm.far', z: 6 },
    { name: 'upperarm.far', bone: 'upperarm.far', z: 7 },
    { name: 'foot.far', bone: 'foot.far', z: 8 },
    { name: 'shin.far', bone: 'shin.far', z: 9 },
    { name: 'knee.far', bone: 'shin.far', z: 10 },
    { name: 'thigh.far', bone: 'thigh.far', z: 11 },
    { name: 'upperarm.near', bone: 'upperarm.near', z: 12 },
    { name: 'hub.near', bone: 'body', z: 13 },
    { name: 'pelvis', bone: 'pelvis', z: 14 },
    { name: 'thigh.near', bone: 'thigh.near', z: 15 },
    { name: 'shin.near', bone: 'shin.near', z: 16 },
    { name: 'knee.near', bone: 'shin.near', z: 17 },
    { name: 'foot.near', bone: 'foot.near', z: 18 },
    { name: 'body', bone: 'body', z: 20 },
    { name: 'hub.far', bone: 'body', z: 24 },
    { name: 'forearm.near', bone: 'forearm.near', z: 30 },
    { name: 'hand.near', bone: 'hand.near', z: 31 },
  ],
};

export const VTGM_GAIT: GaitDef = {
  pelvis: 'pelvis', torso: 'body',
  legs: [
    { thigh: 'thigh.near', shin: 'shin.near', foot: 'foot.near', phase: 0 },
    { thigh: 'thigh.far', shin: 'shin.far', foot: 'foot.far', phase: 0.5 },
  ],
  arms: [
    { upper: 'upperarm.near', fore: 'forearm.near', phase: 0 },
    { upper: 'upperarm.far', fore: 'forearm.far', phase: 0.5 },
  ],
  stride: 170, speed: 210, duty: 0.56, lift: 20, bob: 5, bobPhase: 0.15, drop: 8,
  lean: 2, heel: 10, toe: 20, footLen: 52, armSwing: 16, elbow: 8, armLag: 0.14,
  flavor: {
    name: 'vtgm.walkFlavor', duration: 1, loop: true,
    tracks: {
      // the sphere rocks over the stepping hip, and lands a little heavy on each contact
      'body.r': [{ t: 0, v: -4, e: 'sineInOut' }, { t: 0.5, v: 4, e: 'sineInOut' }],
      'body.sy': [{ t: 0.04, v: 0.975, e: 'quadOut' }, { t: 0.22, v: 1.012, e: 'sineInOut' }, { t: 0.54, v: 0.975, e: 'quadOut' }, { t: 0.72, v: 1.012, e: 'sineInOut' }],
      'body.sx': [{ t: 0.04, v: 1.02, e: 'quadOut' }, { t: 0.22, v: 0.995, e: 'sineInOut' }, { t: 0.54, v: 1.02, e: 'quadOut' }, { t: 0.72, v: 0.995, e: 'sineInOut' }],
      'hand.near.r': [{ t: 0.15, v: 10 }, { t: 0.65, v: -12 }],
      'hand.far.r': [{ t: 0.65, v: 10 }, { t: 0.15, v: -12 }],
    },
  },
};

const NEUTRAL = {
  open: 1, squash: 1, arc: 0, shape: 0, glow: 0.7, tilt: 0, size: 1, lookX: 0, lookY: 0,
  power: 1, shake: 0, yaw: 0, pitch: 0, lamp: 1, hubLight: 1,
};

export const VTGM: CharacterSpec = {
  id: 'vtgm',
  name: 'V-TGM',
  rig: VTGM_RIG,
  sheet: vtgmSheet,
  clips: VTGM_CLIPS,
  gait: VTGM_GAIT,
  idle: 'idle',
  height: 380,
  headBone: 'body',
  shadow: 84,
  // canon: in the Team_Aperture emblem she stands at roughly 55–60 % of R-3MI's height
  scale: 1.25,
  expressions: {
    neutral: NEUTRAL,
    // her default is deadpan: a calm ring, the lid just slightly lowered
    deadpan: { open: 0.82, glow: 0.62 },
    suspicious: { open: 0.5, squash: 0.8, tilt: 0.16, lookX: -0.5, yaw: -0.08, glow: 0.55 },
    annoyed: { open: 0.3, squash: 0.62, tilt: -0.2, glow: 0.5, lamp: 1.4 },
    exasperated: { open: 0.22, squash: 0.7, lookY: -0.6, glow: 0.45 },
    amused: { shape: 1, arc: 1, glow: 0.85 },
    alarmed: { size: 1.3, glow: 1, lamp: 1.5 },
    fond: { open: 0.86, glow: 0.95 },
    sad: { shape: 1, arc: -1, glow: 0.4 },
    off: { open: 0, power: 0, glow: 0, lamp: 0, hubLight: 0 },
    happy: { shape: 1, arc: 1, glow: 0.9 },
    curious: { size: 1.08, glow: 0.8, lookX: 0.3 },
    panic: { size: 1.3, glow: 1, shake: 1, lamp: 1.5 },
  },
  build(a) {
    a.features.push(new SpringBone(a, { bone: 'tank', freq: 3, zeta: 0.25, gainX: 0.0003, gainY: 0.0004, limit: 6 }));
    a.features.push(new SphereFace(a, { bone: 'body', z: 21, x: SPHERE.x, y: SPHERE.y, r: SPHERE.r, baseYaw: EYE_YAW, basePitch: EYE_PITCH, seamColor: 0x8f897f, lampColor: 0xff6f61, lampGlow: 0xc0322c }));
    a.features.push(new Optic(a, {
      bone: 'body', x: SPHERE.x, y: SPHERE.y, z: 22, socketR: 46, irisR: 26, bezelR: 60,
      bezelColor: 0x1a1720, bezelHi: 0x6b6575, socketColor: 0x120c0e,
      ringColor: 0xc0322c, irisColor: 0xff6f61, coreColor: 0xfff2ee, glowColor: 0xc0322c, glowSize: 170,
      ringLight: 5, sphere: { x: SPHERE.x, y: SPHERE.y, r: SPHERE.r, yaw: EYE_YAW, pitch: EYE_PITCH },
      saccades: 0.35, blink: [3.5, 8],
    }));
    a.features.push(new Tank(a, { bone: 'tank', z: 2, ...TANK, level: 0.66, fluid: 0xd8443c, fluidHi: 0xff9b90, glow: 0xc0322c }));
    a.features.push(new Hose(a, {
      name: 'top', z: 19, a: { bone: 'tank', x: TANK.x + TANK.w / 2, y: TANK.y - 26 }, b: { bone: 'body', x: -43, y: SPHERE.y - SPHERE.r - 6 },
      c: { bone: 'tank', x: -150, y: -470 }, width: 24, base: '#2a2630', accent: PAL.accent,
    }));
    a.features.push(new Led(a, { name: 'hub', bone: 'body', z: 25, x: J.shF[0] + 2, y: J.shF[1], w: 44, h: 5, color: 0xff6f61, glow: 0xc0322c, param: 'hubLight', ring: true }));
  },
};
