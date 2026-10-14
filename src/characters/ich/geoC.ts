import type { IchJoints } from './index';

/**
 * ICH, design direction C „Das Periskop" (see docs/ICH_DESIGN_DIRECTIONS.md).
 * Sheet space, facing right, three-quarter view, feet on y = 0. Height ≈ 752 units incl. hat.
 * Silhouette: a square sign on a long telescopic neck above a small cone (a plum cape), thin
 * springy legs in big shoes. Same joints as A, at their own positions: the neck is the long bone
 * (A's is tiny), and it slides in and out of a fixed outer tube like a periscope (see variantC.ts).
 */
export const JC: IchJoints = {
  pelvis: [0, -280],
  // the cape's shoulder mantle bends here (the lower cape halves hang from the pelvis)
  torso: [2, -296],
  // the mouth of the fixed outer tube on top of the cape cone: the mast slides out of it
  neck: [7, -444],
  // the top of the telescope: the ball mount under the plate
  head: [8, -536],
  // top centre of the plate: the hat rests on the plate's corners
  hat: [10, -694],
  hipN: [12, -272], kneeN: [24, -150], ankleN: [16, -30],
  hipF: [-14, -274], kneeF: [-4, -152], ankleF: [-16, -32],
  shN: [30, -374], elN: [38, -278], wrN: [42, -182],
  shF: [-18, -376], elF: [-24, -280], wrF: [-28, -184],
  coatF: [22, -312],
  coatB: [-22, -312],
};

/** The square faceplate: outer bezel and glass, in sheet space. */
export const PLATE_C = { cx: 10, cy: -618, w: 162, h: 152, glassW: 146, glassH: 128, r: 30 } as const;

/** Letter height on the plate (A: 74). The word is 2.36 × this wide: fits the square glass. */
export const LETTERS_C = 56;

/**
 * The telescope. The widest tube is fixed to the cape (drawn with the torso, in front of the neck
 * slot), the three narrower tubes are the neck bone and slide out of it; their lowest end stays
 * hidden in the cape cone over the whole slide range (SCOPE_DOWN … SCOPE_UP).
 */
export const SCOPE = {
  /** lowest point of the sliding tubes at rest (hidden inside the cape) */
  bottom: -350,
  /** brass collar ring at the top of the cape cone */
  collar: -402,
  /** mouth of the fixed outer tube */
  base: -446,
  baseR: 21,
  ring1: -482,
  ring2: -510,
  top: -532,
  r: [16, 13, 10] as const,
} as const;

/** How far the telescope may slide out of the outer tube (up) or sink into it (down), in units. */
export const SCOPE_UP = 84;
export const SCOPE_DOWN = 58;

export const PAL_C = {
  // the cape
  plum: '#5e2c63',
  plumShade: '#46204c',
  plumDark: '#2e1433',
  plumHi: '#82468a',
  lining: '#c9923a',
  trim: '#d0a046',
  trimShade: '#a87b2c',
  // brass: plate bezel, collars, clasp, magnifier
  brass: '#d1a44a',
  brassShade: '#a87e2e',
  brassHi: '#f3da92',
  // gunmetal: the telescope tubes and the thin limbs
  steel: '#5d6a86',
  steelShade: '#434d66',
  steelDark: '#2a3042',
  steelHi: '#93a1c0',
  glass: '#10131a',
  glassHi: '#2a3140',
  glove: '#f4efe2',
  gloveShade: '#cfc7b4',
  shoe: '#8a3f2c',
  shoeShade: '#62291c',
  shoeHi: '#b56a4c',
  sole: '#2a1612',
  // the hat: sand felt, far too big
  hat: '#d6c08c',
  hatShade: '#ae9762',
  hatHi: '#efe0b6',
  hatBand: '#46204c',
  amber: '#ffb22e',
} as const;
