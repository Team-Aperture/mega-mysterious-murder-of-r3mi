import { blocked, type ClipDef } from '../../anim/clip';

/**
 * R-3MI clips. Values are deltas from the rest drawing (rotations in degrees, positive = the
 * part's lower end swings backwards for a rig facing right; negative raises an arm forwards).
 * Authored pose-to-pose: key poses first, then breakdowns, with curves on the keys.
 */

/** Cabin stoop: he never stands straight in here. Breathing and a slow weight shift. */
const idle: ClipDef = {
  name: 'idle', duration: 4, loop: true,
  tracks: {
    'torso.r': [{ t: 0, v: 4, e: 'sineInOut' }, { t: 1, v: 3.2, e: 'sineInOut' }, { t: 2, v: 4.2, e: 'sineInOut' }, { t: 3, v: 4.8, e: 'sineInOut' }],
    'torso.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 1.1, v: 1.014, e: 'sineInOut' }, { t: 2, v: 1, e: 'sineInOut' }, { t: 3.1, v: 1.012, e: 'sineInOut' }],
    'neck.r': [{ t: 0, v: 3, e: 'sineInOut' }, { t: 2.2, v: 4.5, e: 'sineInOut' }],
    'head.r': [{ t: 0.2, v: 1.5, e: 'sineInOut' }, { t: 1.3, v: 0, e: 'sineInOut' }, { t: 2.4, v: 2, e: 'sineInOut' }, { t: 3.4, v: 0.5, e: 'sineInOut' }],
    'pelvis.x': [{ t: 0, v: -2, e: 'sineInOut' }, { t: 2, v: 3, e: 'sineInOut' }],
    'pelvis.y': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 1, v: 2.5, e: 'sineInOut' }, { t: 2, v: 0, e: 'sineInOut' }, { t: 3, v: 2, e: 'sineInOut' }],
    'upperarm.near.r': [{ t: 0.3, v: -2, e: 'sineInOut' }, { t: 2.3, v: 1, e: 'sineInOut' }],
    'upperarm.far.r': [{ t: 0.6, v: 2, e: 'sineInOut' }, { t: 2.6, v: -1, e: 'sineInOut' }],
    'forearm.near.r': [{ t: 0.4, v: -3, e: 'sineInOut' }, { t: 2.4, v: -1, e: 'sineInOut' }],
    'forearm.far.r': [{ t: 0.8, v: -5, e: 'sineInOut' }, { t: 2.8, v: -8, e: 'sineInOut' }],
    'hand.near.r': [{ t: 0.5, v: 4, e: 'sineInOut' }, { t: 2.5, v: -2, e: 'sineInOut' }],
  },
};

/** Fidget variant: fingertips of both hands tap together in front of the chest. Nervous.
 *  (Angles solved for the 3/4 rig: the near arm reaches forward from the back, the far arm
 *  folds up at the front edge.) */
const fidget: ClipDef = blocked('fidget', 2.4, [
  [0, { 'torso.r': 6, 'neck.r': 6, 'head.r': 6, 'upperarm.near.r': -54, 'forearm.near.r': -74, 'hand.near.r': -18, 'upperarm.far.r': 18, 'forearm.far.r': -140, 'hand.far.r': -10, 'pelvis.y': 4 }, 'sineInOut'],
  [0.3, { 'upperarm.near.r': -50, 'forearm.near.r': -78, 'upperarm.far.r': 16, 'forearm.far.r': -136, 'head.r': 8 }, 'quadOut'],
  [0.5, { 'upperarm.near.r': -54, 'forearm.near.r': -74, 'upperarm.far.r': 18, 'forearm.far.r': -140 }, 'quadOut'],
  [0.7, { 'upperarm.near.r': -50, 'forearm.near.r': -78, 'upperarm.far.r': 16, 'forearm.far.r': -136 }, 'quadOut'],
  [0.9, { 'upperarm.near.r': -54, 'forearm.near.r': -74, 'upperarm.far.r': 18, 'forearm.far.r': -140, 'head.r': 4 }, 'sineInOut'],
  [1.5, { 'upperarm.near.r': -50, 'forearm.near.r': -78, 'upperarm.far.r': 16, 'forearm.far.r': -136, 'head.r': 9 }, 'quadOut'],
  [1.7, { 'upperarm.near.r': -54, 'forearm.near.r': -74, 'upperarm.far.r': 18, 'forearm.far.r': -140 }, 'quadOut'],
  [1.9, { 'upperarm.near.r': -50, 'forearm.near.r': -78, 'upperarm.far.r': 16, 'forearm.far.r': -136 }, 'quadOut'],
  [2.4, { 'upperarm.near.r': -54, 'forearm.near.r': -74, 'upperarm.far.r': 18, 'forearm.far.r': -140, 'head.r': 6 }, 'sineInOut'],
], { loop: true });

/** „Hiii!": up on the toes, big open-hand wave. */
const wave: ClipDef = blocked('wave', 1.9, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'torso.r': 4, 'head.r': 2, 'pelvis.y': 0 }, 'backIn'],
  [0.22, { 'upperarm.near.r': -150, 'forearm.near.r': -24, 'hand.near.r': 0, 'torso.r': -2, 'head.r': -8, 'pelvis.y': -10 }, 'quadOut'],
  [0.42, { 'forearm.near.r': 22, 'hand.near.r': 12 }, 'sineInOut'],
  [0.62, { 'forearm.near.r': -28, 'hand.near.r': -14 }, 'sineInOut'],
  [0.82, { 'forearm.near.r': 22, 'hand.near.r': 12 }, 'sineInOut'],
  [1.02, { 'forearm.near.r': -28, 'hand.near.r': -14 }, 'sineInOut'],
  [1.22, { 'forearm.near.r': 14, 'hand.near.r': 6, 'pelvis.y': -6 }, 'quadInOut'],
  [1.6, { 'upperarm.near.r': -20, 'forearm.near.r': -10, 'hand.near.r': 0, 'torso.r': 3, 'head.r': 1, 'pelvis.y': 0 }, 'sineOut'],
  [1.9, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'torso.r': 4, 'head.r': 2 }],
], { attach: { 'hand.near': [{ t: 0.12, v: 'hand.near#open' }, { t: 1.5, v: 'hand.near' }] }, tracks: { '@eye.shape': [{ t: 0.1, v: 1 }, { t: 1.6, v: 0 }], '@eye.arc': [{ t: 0, v: 1 }] } });

/** Points forward (at the window, at the seat, at the problem). Holds the end pose. */
const point: ClipDef = blocked('point', 0.9, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'torso.r': 4 }, 'backIn'],
  [0.28, { 'upperarm.near.r': -88, 'forearm.near.r': -6, 'hand.near.r': -8, 'torso.r': 8, 'head.r': 4 }, 'backOut'],
  [0.9, { 'upperarm.near.r': -82, 'forearm.near.r': -8, 'hand.near.r': -4, 'torso.r': 7, 'head.r': 3 }],
], { attach: { 'hand.near': [{ t: 0.1, v: 'hand.near#point' }] } });

/** Startled jolt: up, back, arms out, then settles. */
const flinch: ClipDef = blocked('flinch', 0.9, [
  [0, { 'pelvis.y': 0, 'torso.r': 4, 'head.r': 2, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6 }, 'expoOut'],
  [0.08, { 'pelvis.y': -26, 'torso.r': -10, 'head.r': -12, 'neck.r': -6, 'upperarm.near.r': -40, 'upperarm.far.r': 30, 'forearm.near.r': -50, 'forearm.far.r': -40 }, 'quadInOut'],
  [0.35, { 'pelvis.y': -8, 'torso.r': -4, 'head.r': -4, 'neck.r': 0 }, 'sineInOut'],
  [0.9, { 'pelvis.y': 0, 'torso.r': 4, 'head.r': 2, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6 }],
], { attach: { 'hand.near': [{ t: 0.05, v: 'hand.near#open' }, { t: 0.7, v: 'hand.near' }] } });

/** Ducks with a hand over his head (ceilings, overhead bins, life). Holds. */
const duck: ClipDef = blocked('duck', 0.7, [
  [0, { 'pelvis.y': 0, 'torso.r': 4, 'neck.r': 5, 'head.r': 3, 'upperarm.near.r': 0, 'forearm.near.r': -6 }, 'backIn'],
  [0.3, { 'pelvis.y': 46, 'torso.r': 20, 'neck.r': 14, 'head.r': 10, 'upperarm.near.r': -172, 'forearm.near.r': -62, 'hand.near.r': -30 }, 'backOut'],
  [0.7, { 'pelvis.y': 42, 'torso.r': 18, 'neck.r': 12, 'head.r': 9, 'upperarm.near.r': -168, 'forearm.near.r': -64, 'hand.near.r': -28 }],
], { z: { 'hand.near': [{ t: 0, v: 45 }], 'forearm.near': [{ t: 0, v: 44 }] } });

/** Small speaking accents (additive layer). */
const nod: ClipDef = {
  name: 'nod', duration: 0.6,
  tracks: {
    'head.r': [{ t: 0, v: 0, e: 'quadOut' }, { t: 0.15, v: 5, e: 'sineInOut' }, { t: 0.4, v: -1.5, e: 'sineInOut' }, { t: 0.6, v: 0 }],
    'neck.r': [{ t: 0, v: 0, e: 'quadOut' }, { t: 0.2, v: 2, e: 'sineInOut' }, { t: 0.6, v: 0 }],
  },
};
const beat: ClipDef = {
  name: 'beat', duration: 0.7,
  tracks: {
    'upperarm.near.r': [{ t: 0, v: 0, e: 'backOut' }, { t: 0.2, v: -24, e: 'sineInOut' }, { t: 0.7, v: 0 }],
    'forearm.near.r': [{ t: 0, v: 0, e: 'backOut' }, { t: 0.22, v: -40, e: 'sineInOut' }, { t: 0.7, v: 0 }],
    'head.r': [{ t: 0, v: 0 }, { t: 0.18, v: -4, e: 'sineInOut' }, { t: 0.7, v: 0 }],
  },
};

/** Shrug: shoulders up, palms out. */
const shrug: ClipDef = blocked('shrug', 1.2, [
  [0, { 'torso.r': 4, 'head.r': 2, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6, 'pelvis.y': 0 }, 'backIn'],
  [0.25, { 'torso.r': 0, 'torso.sy': 1.03, 'head.r': -6, 'neck.r': -4, 'upperarm.near.r': -24, 'upperarm.far.r': -18, 'forearm.near.r': -78, 'forearm.far.r': -70, 'hand.near.r': -30, 'pelvis.y': -6 }, 'sineInOut'],
  [0.75, { 'head.r': -9, 'torso.sy': 1.025 }, 'quadInOut'],
  [1.2, { 'torso.r': 4, 'torso.sy': 1, 'head.r': 2, 'neck.r': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6, 'hand.near.r': 0, 'pelvis.y': 0 }],
], { attach: { 'hand.near': [{ t: 0.1, v: 'hand.near#open' }, { t: 1.0, v: 'hand.near' }], 'hand.far': [{ t: 0.1, v: 'hand.far#open' }, { t: 1.0, v: 'hand.far' }] } });

/* ------------------------------------------------------------------ seated (FK legs, IK off)
 * Seated in 14C facing left. The tank on his back keeps him off the backrest, so he perches on
 * the front of the cushion and his knees end up in the seat in front. Angles were derived from
 * the rig's rest directions (thigh ≈ 87°, shin ≈ 93°) and then tuned by eye in the Lab.
 */
type PoseVals = Record<string, number>;
const JAM: PoseVals = {
  '@ik': 0, 'pelvis.x': 60, 'pelvis.y': 182, 'torso.r': 16, 'neck.r': 12, 'head.r': 8,
  'thigh.near.r': -98, 'shin.near.r': 104, 'foot.near.r': -6, 'thigh.far.r': -100, 'shin.far.r': 106, 'foot.far.r': -6,
  'upperarm.near.r': -40, 'forearm.near.r': -42, 'hand.near.r': -10, 'upperarm.far.r': -36, 'forearm.far.r': -46, 'hand.far.r': -10,
};
const KNEES_UP: PoseVals = {
  '@ik': 0, 'pelvis.x': 42, 'pelvis.y': 186, 'torso.r': 8, 'neck.r': 4, 'head.r': -4,
  'thigh.near.r': -156, 'shin.near.r': 164, 'foot.near.r': -8, 'thigh.far.r': -152, 'shin.far.r': 160, 'foot.far.r': -8,
  'upperarm.near.r': -64, 'forearm.near.r': -74, 'hand.near.r': -20, 'upperarm.far.r': -58, 'forearm.far.r': -80, 'hand.far.r': -16,
};
const SQUISHED: PoseVals = {
  ...KNEES_UP, 'pelvis.x': 26, 'torso.r': 4, 'torso.sy': 0.86, 'neck.r': 8, 'head.r': -6,
  'thigh.near.r': -166, 'shin.near.r': 170, 'thigh.far.r': -162, 'shin.far.r': 168,
  'upperarm.near.r': -70, 'forearm.near.r': -88, 'upperarm.far.r': -66, 'forearm.far.r': -92,
};
const LEGS_OUT: PoseVals = {
  '@ik': 0, 'pelvis.x': 120, 'pelvis.y': 200, 'torso.r': -12, 'torso.sy': 1, 'neck.r': -2, 'head.r': -8,
  'thigh.near.r': -67, 'shin.near.r': 50, 'foot.near.r': 16, 'thigh.far.r': -61, 'shin.far.r': 46, 'foot.far.r': 15,
  'upperarm.near.r': 18, 'forearm.near.r': -14, 'hand.near.r': 8, 'upperarm.far.r': -24, 'forearm.far.r': -40, 'hand.far.r': -10,
};
const ASLEEP: PoseVals = {
  ...LEGS_OUT, 'torso.r': -16, 'neck.r': 22, 'head.r': 26,
  'upperarm.near.r': 26, 'forearm.near.r': -2, 'hand.near.r': 12, 'upperarm.far.r': -10, 'forearm.far.r': -22,
};

/** Attempt 1: sits, the tank klonks into the backrest, knees bonk the seat in front. */
const sitJam: ClipDef = blocked('sitJam', 2.2, [
  [0, { '@ik': 0, 'pelvis.x': 0, 'pelvis.y': 0, 'torso.r': 4, 'neck.r': 5, 'head.r': 3, 'thigh.near.r': 0, 'shin.near.r': 0, 'foot.near.r': 0, 'thigh.far.r': 0, 'shin.far.r': 0, 'foot.far.r': 0, 'upperarm.near.r': 0, 'forearm.near.r': -6, 'upperarm.far.r': 0, 'forearm.far.r': -6 }, 'sineInOut'],
  [0.35, { 'pelvis.y': 60, 'pelvis.x': 6, 'torso.r': 24, 'thigh.near.r': -34, 'shin.near.r': 44, 'thigh.far.r': -30, 'shin.far.r': 40, 'foot.near.r': -10, 'foot.far.r': -10, 'upperarm.near.r': -30, 'upperarm.far.r': -24 }, 'quadIn'],
  [0.72, { 'pelvis.y': 156, 'pelvis.x': -12, 'torso.r': 8, 'thigh.near.r': -84, 'shin.near.r': 90, 'thigh.far.r': -82, 'shin.far.r': 88 }, 'expoOut'],
  [0.84, { 'pelvis.x': 74, 'pelvis.y': 170, 'torso.r': 30, 'head.r': 16, 'neck.r': 14, 'upperarm.near.r': -50, 'upperarm.far.r': 20, 'forearm.near.r': -30 }, 'quadIn'],
  [0.97, { 'thigh.near.r': -104, 'thigh.far.r': -106, 'shin.near.r': 110, 'shin.far.r': 112, 'head.r': -10, 'torso.r': 10, 'pelvis.x': 64 }, 'backOut'],
  [1.35, JAM, 'sineInOut'],
  [2.2, { ...JAM, 'torso.r': 15, 'head.r': 7 }],
], {
  events: [{ t: 0.82, name: 'sfx', data: 'klonk' }, { t: 0.96, name: 'sfx', data: 'bonk' }],
  tracks: { '@eye.shape': [{ t: 0, v: 0 }, { t: 0.83, v: 4 }, { t: 1.7, v: 0 }], '@eye.shake': [{ t: 0.83, v: 1 }, { t: 1.4, v: 0 }] },
});

/** Attempt 2: knees up to his chin, feet on the cushion edge. */
const sitKneesUp: ClipDef = blocked('sitKneesUp', 1.6, [
  [0, JAM, 'backIn'],
  [0.45, KNEES_UP, 'sineInOut'],
  [1.6, { ...KNEES_UP, 'torso.r': 27, 'head.r': 12 }],
]);

/** V-TGM reclines into his knees. */
const squished: ClipDef = blocked('squished', 1.2, [
  [0, KNEES_UP, 'expoOut'],
  [0.18, SQUISHED, 'sineInOut'],
  [1.2, { ...SQUISHED, 'head.r': 20 }],
], { tracks: { '@eye.squash': [{ t: 0, v: 1 }, { t: 0.18, v: 0.45 }, { t: 1.2, v: 0.5 }], '@eye.open': [{ t: 0, v: 1 }, { t: 0.18, v: 0.7 }] } });

/** Attempt 3: swings both legs out into the aisle and slumps. */
const legsOut: ClipDef = blocked('legsOut', 2.4, [
  [0, SQUISHED, 'backIn'],
  [0.45, { ...LEGS_OUT, 'thigh.near.r': -40, 'shin.near.r': 30, 'thigh.far.r': -36, 'shin.far.r': 26, 'pelvis.x': 90, 'torso.r': -4, 'torso.sy': 1, 'head.r': -4 }, 'quadIn'],
  [0.8, LEGS_OUT, 'backOut'],
  [1.3, { ...LEGS_OUT, 'torso.r': -16, 'head.r': -10 }, 'sineInOut'],
  [2.4, { ...LEGS_OUT, 'torso.r': -15, 'head.r': -9 }],
], { events: [{ t: 0.4, name: 'sfx', data: 'whoosh' }, { t: 0.8, name: 'sfx', data: 'thud' }] });

/** Seated complaining: arm gestures (play on the 'arms' layer over a seated pose). */
const complain: ClipDef = blocked('complain', 2.6, [
  [0, { 'upperarm.near.r': 18, 'forearm.near.r': -14, 'hand.near.r': 8 }, 'backOut'],
  [0.3, { 'upperarm.near.r': -70, 'forearm.near.r': -50, 'hand.near.r': -10 }, 'sineInOut'],
  [0.7, { 'upperarm.near.r': -46, 'forearm.near.r': -70 }, 'sineInOut'],
  [1.1, { 'upperarm.near.r': -84, 'forearm.near.r': -40, 'hand.near.r': -20 }, 'sineInOut'],
  [1.6, { 'upperarm.near.r': -50, 'forearm.near.r': -64 }, 'sineInOut'],
  [2.0, { 'upperarm.near.r': -78, 'forearm.near.r': -44 }, 'sineInOut'],
  [2.6, { 'upperarm.near.r': 18, 'forearm.near.r': -14, 'hand.near.r': 8 }],
], { attach: { 'hand.near': [{ t: 0.2, v: 'hand.near#open' }, { t: 2.3, v: 'hand.near' }] } });

/** Falls asleep: two nods, a jerk awake, then the power-down (eye dark, standby blink). */
const sleepSlump: ClipDef = blocked('sleepSlump', 4.6, [
  [0, LEGS_OUT, 'sineInOut'],
  [0.8, { ...LEGS_OUT, 'neck.r': 10, 'head.r': 12 }, 'expoOut'],
  [1.3, { ...LEGS_OUT, 'neck.r': -2, 'head.r': -6 }, 'sineInOut'],
  [2.3, { ...LEGS_OUT, 'neck.r': 18, 'head.r': 22, 'upperarm.near.r': 22 }, 'sineInOut'],
  [3.2, ASLEEP, 'sineInOut'],
  [4.6, ASLEEP],
], {
  tracks: {
    '@eye.open': [{ t: 0, v: 0.8 }, { t: 0.8, v: 0.35 }, { t: 1.3, v: 0.9 }, { t: 2.3, v: 0.2, e: 'sineInOut' }, { t: 3.0, v: 0.05 }],
    '@eye.power': [{ t: 0, v: 1 }, { t: 2.9, v: 1, e: 'sineIn' }, { t: 4.0, v: 0 }],
    '@jointLights': [{ t: 0, v: 1 }, { t: 2.9, v: 1 }, { t: 4.0, v: 0 }],
    '@chestLed': [{ t: 0, v: 1 }, { t: 3.0, v: 1 }, { t: 4.0, v: 0.05 }, { t: 4.4, v: 0.8 }, { t: 4.6, v: 0.4 }],
    '@tank.bubbles': [{ t: 0, v: 1 }, { t: 3.0, v: 1 }, { t: 4.4, v: 0.15 }],
  },
  events: [{ t: 3.0, name: 'sfx', data: 'powerdown' }],
});

/** Asleep in the seat: slow breathing, the standby light pulses once every 4 s. */
const sleep: ClipDef = {
  name: 'sleep', duration: 4, loop: true,
  tracks: {
    ...Object.fromEntries(Object.entries(ASLEEP).map(([k, v]) => [k, [{ t: 0, v }]])),
    'torso.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 2, v: 1.012, e: 'sineInOut' }],
    'head.r': [{ t: 0, v: 26, e: 'sineInOut' }, { t: 2, v: 28, e: 'sineInOut' }],
    '@eye.power': [{ t: 0, v: 0 }], '@eye.open': [{ t: 0, v: 0 }], '@jointLights': [{ t: 0, v: 0 }],
    '@chestLed': [{ t: 0, v: 0.05, e: 'sineIn' }, { t: 0.5, v: 0.85, e: 'sineOut' }, { t: 1.6, v: 0.05 }, { t: 3.99, v: 0.05 }],
    '@tank.bubbles': [{ t: 0, v: 0.15 }],
  },
};

/** Deep sleep (later that night): no standby blink any more. Looks… very off. */
const deepSleep: ClipDef = {
  ...sleep, name: 'deepSleep',
  tracks: { ...sleep.tracks, '@chestLed': [{ t: 0, v: 0 }], '@tank.bubbles': [{ t: 0, v: 0 }], 'torso.sy': [{ t: 0, v: 1 }] },
};

/** Two slow claps (for ICH's silent pose). The far hand waits in front of the chest, the near
 *  one swings up into it (contact solved for the 3/4 rig at about x 170, y −560). */
const clap: ClipDef = blocked('clap', 1.8, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'upperarm.far.r': 0, 'forearm.far.r': -6 }, 'sineInOut'],
  [0.35, { 'upperarm.near.r': -48, 'forearm.near.r': -50, 'upperarm.far.r': 18, 'forearm.far.r': -124 }, 'sineInOut'],
  [0.6, { 'upperarm.near.r': -56, 'forearm.near.r': -56 }, 'quadIn'],
  [0.68, { 'upperarm.near.r': -48, 'forearm.near.r': -50 }, 'sineInOut'],
  [1.1, { 'upperarm.near.r': -56, 'forearm.near.r': -56 }, 'quadIn'],
  [1.18, { 'upperarm.near.r': -48, 'forearm.near.r': -50 }, 'sineInOut'],
  [1.8, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'upperarm.far.r': 0, 'forearm.far.r': -6 }],
], { events: [{ t: 0.6, name: 'sfx', data: 'clap' }, { t: 1.1, name: 'sfx', data: 'clap' }] });

export const R3MI_CLIPS: ClipDef[] = [clap, idle, fidget, wave, point, flinch, duck, nod, beat, shrug, sitJam, sitKneesUp, squished, legsOut, complain, sleepSlump, sleep, deepSleep];
