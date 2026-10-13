import type { RigDef } from '../../anim/rig';
import type { GaitDef } from '../../anim/gait';
import type { CharacterSpec } from '../actor';
import { SpringBone } from '../features';
import { IchLetters } from '../ichLetters';
import { J, PLATE } from './geo';
import { ichSheet } from './sheet';
import { ICH_CLIPS } from './clips';

const b = (name: string, parent: string | null, p: readonly number[]) => ({ name, parent, x: p[0], y: p[1] });

/** Joint layout of an ICH design direction: the same joints as A, at its own positions. */
export type IchJoints = Record<keyof typeof J, readonly [number, number]>;

/** Bone names are shared by all three ICH design directions, so every clip works on each. */
export const ICH_BONES = (j: IchJoints) => [
  b('root', null, [0, 0]),
  b('pelvis', 'root', j.pelvis),
  b('torso', 'pelvis', j.torso),
  b('neck', 'torso', j.neck),
  b('head', 'neck', j.head),
  b('hat', 'head', j.hat),
  b('coat.front', 'pelvis', j.coatF),
  b('coat.back', 'pelvis', j.coatB),
  b('upperarm.near', 'torso', j.shN), b('forearm.near', 'upperarm.near', j.elN), b('hand.near', 'forearm.near', j.wrN),
  b('upperarm.far', 'torso', j.shF), b('forearm.far', 'upperarm.far', j.elF), b('hand.far', 'forearm.far', j.wrF),
  b('thigh.near', 'pelvis', j.hipN), b('shin.near', 'thigh.near', j.kneeN), b('foot.near', 'shin.near', j.ankleN),
  b('thigh.far', 'pelvis', j.hipF), b('shin.far', 'thigh.far', j.kneeF), b('foot.far', 'shin.far', j.ankleF),
];

export const ICH_SLOTS = [
  { name: 'hand.far', bone: 'hand.far', z: 1 },
  { name: 'forearm.far', bone: 'forearm.far', z: 2 },
  { name: 'upperarm.far', bone: 'upperarm.far', z: 3 },
  { name: 'coat.back', bone: 'coat.back', z: 4 },
  { name: 'foot.far', bone: 'foot.far', z: 5 },
  { name: 'shin.far', bone: 'shin.far', z: 6 },
  { name: 'knee.far', bone: 'shin.far', z: 7 },
  { name: 'thigh.far', bone: 'thigh.far', z: 8 },
  { name: 'thigh.near', bone: 'thigh.near', z: 10 },
  { name: 'shin.near', bone: 'shin.near', z: 11 },
  { name: 'knee.near', bone: 'shin.near', z: 12 },
  { name: 'foot.near', bone: 'foot.near', z: 13 },
  { name: 'coat.front', bone: 'coat.front', z: 16 },
  { name: 'neck', bone: 'neck', z: 18 },
  { name: 'torso', bone: 'torso', z: 20 },
  { name: 'plate.back', bone: 'head', z: 22 },
  { name: 'plate', bone: 'head', z: 24 },
  { name: 'plate.glare', bone: 'head', z: 26 },
  { name: 'hat', bone: 'hat', z: 28 },
  { name: 'upperarm.near', bone: 'upperarm.near', z: 32 },
  { name: 'forearm.near', bone: 'forearm.near', z: 33 },
  { name: 'hand.near', bone: 'hand.near', z: 34 },
  { name: 'magnifier', bone: 'hand.near', z: 35, part: null },
];

export const ICH_RIG: RigDef = { id: 'ich', bones: ICH_BONES(J), slots: ICH_SLOTS };

/** The pompous strut: high knees, a held float at the top, leaning back, chest out. */
export const ICH_GAIT: GaitDef = {
  pelvis: 'pelvis', torso: 'torso', head: 'head',
  legs: [
    { thigh: 'thigh.near', shin: 'shin.near', foot: 'foot.near', phase: 0 },
    { thigh: 'thigh.far', shin: 'shin.far', foot: 'foot.far', phase: 0.5 },
  ],
  arms: [
    { upper: 'upperarm.near', fore: 'forearm.near', phase: 0 },
    { upper: 'upperarm.far', fore: 'forearm.far', phase: 0.5 },
  ],
  stride: 270, speed: 235, duty: 0.55, lift: 52, bob: 13, bobPhase: 0.3, drop: 16,
  lean: -6, heel: 22, toe: 30, footLen: 58, armSwing: 28, elbow: 4, armLag: 0.03,
  flavor: {
    name: 'ich.walkFlavor', duration: 1, loop: true,
    tracks: {
      // the plate stays level and proud: it counter-rotates the bob, with a little "hm-hm" nod
      'head.r': [{ t: 0.05, v: -3, e: 'sineInOut' }, { t: 0.3, v: 1, e: 'sineInOut' }, { t: 0.55, v: -3, e: 'sineInOut' }, { t: 0.8, v: 1, e: 'sineInOut' }],
      'torso.r': [{ t: 0, v: -1.5, e: 'sineInOut' }, { t: 0.5, v: 1.5, e: 'sineInOut' }],
      // stiff arms that flick at the wrist on the forward swing
      'hand.near.r': [{ t: 0.45, v: -18, e: 'backOut' }, { t: 0.62, v: 4, e: 'sineInOut' }, { t: 0.95, v: 6 }],
      'hand.far.r': [{ t: 0.95, v: -18, e: 'backOut' }, { t: 0.12, v: 4, e: 'sineInOut' }, { t: 0.45, v: 6 }],
      'hat.r': [{ t: 0.1, v: 2, e: 'sineInOut' }, { t: 0.35, v: -2, e: 'sineInOut' }, { t: 0.6, v: 2, e: 'sineInOut' }, { t: 0.85, v: -2, e: 'sineInOut' }],
    },
  },
};

export const ICH_EXPRESSIONS = {
  neutral: { letters: 1, flicker: 0, power: 1 },
  proud: { letters: 1.3 },
  nervous: { letters: 0.85, flicker: 0.8 },
  shocked: { letters: 1.5 },
  embarrassed: { letters: 0.6, flicker: 0.2 },
  sleepy: { letters: 0.25 },
  off: { letters: 0.06, power: 0.3 },
};

export function ichFeatures(plate: { cx: number; cy: number; size: number; glowW: number }): CharacterSpec['build'] {
  return (a) => {
    a.features.push(new SpringBone(a, { bone: 'coat.front', freq: 2.4, zeta: 0.22, gainX: 0.0012, gainY: 0.0008, limit: 22 }));
    a.features.push(new SpringBone(a, { bone: 'coat.back', freq: 2.1, zeta: 0.2, gainX: 0.0014, gainY: 0.0009, limit: 26 }));
    a.features.push(new SpringBone(a, { bone: 'hat', freq: 3.2, zeta: 0.25, gainX: 0.0005, gainY: 0.0007, limit: 14 }));
    a.features.push(new SpringBone(a, { bone: 'head', freq: 3.4, zeta: 0.4, gainX: 0.00018, gainY: 0.00025, limit: 5 }));
    a.features.push(new IchLetters(a, { bone: 'head', z: 25, x: plate.cx, y: plate.cy, size: plate.size, color: 0xffb22e, core: 0xfff1c9, glow: 0xff9a1a, glowW: plate.glowW }));
  };
}

export const ICH_A: CharacterSpec = {
  id: 'ich',
  name: 'ICH',
  rig: ICH_RIG,
  sheet: ichSheet,
  clips: ICH_CLIPS,
  gait: ICH_GAIT,
  idle: 'idle',
  walkBase: 'stand',
  height: 690,
  headTop: [40, -688],
  headBone: 'head',
  lens: [J.wrN[0] + 4, J.wrN[1] + 128],
  shadow: 64,
  expressions: ICH_EXPRESSIONS,
  build: ichFeatures({ cx: PLATE.cx, cy: PLATE.cy, size: 74, glowW: 300 }),
};
