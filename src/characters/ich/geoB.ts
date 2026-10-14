import type { IchJoints } from './index';

/**
 * ICH, design direction B „Der Aktenschrank" (see docs/ICH_DESIGN_DIRECTIONS.md).
 * Sheet space, facing right, three-quarter view, feet on y = 0. Height ≈ 676 units incl. cap.
 * Silhouette: ONE upright brick (an olive office-steel filing cabinet with three drawers) on
 * stubby legs, a flat cap too small for it perched on top.
 *
 * Bones (same names as A):
 *   head   = the top drawer section (its drawer front is the faceplate), hinged at the seam above
 *            the middle drawer; the neck is a dark bellows only visible when that seam opens;
 *   torso  = the cabinet carcass with the middle drawer, pivoting on the plinth, so the whole
 *            brick tips like a plank (deadpan stiffness) instead of bending;
 *   pelvis = the leg unit under the plinth; its bottom drawer front rides on `coat.front`, and
 *            `coat.back` carries the file-folder tabs sticking out of the top drawer. Both are
 *            re-parented at runtime (see variantB.ts, CabinetFit) so they stay in the cabinet.
 */

/** The cabinet box: front face, oblique depth (side panel recedes up and to the left). */
export const CAB = {
  x0: -88, x1: 128, cx: 20,
  top: -624, bottom: -140,
  /** Oblique depth offset of the back edges (side panel and top face). */
  dx: -40, dy: -16,
  /** Drawer fronts [top, bottom] y: top drawer (head), middle (torso), bottom (coat.front). */
  drawers: [[-624, -476], [-470, -322], [-316, -168]] as const,
  /** Recessed plinth under the bottom drawer. */
  plinth: [-168, -140] as const,
  /** Seam between top and middle drawer (the head hinge). */
  seam: -473,
} as const;

export const JB: IchJoints = {
  pelvis: [18, -146],
  // the carcass pivots on the plinth: torso.r tips the whole brick
  torso: [18, -156],
  neck: [20, -464],
  head: [20, -473],
  // centre of the flat cap's band, perched on the front half of the lid
  hat: [62, -630],
  hipN: [46, -150], kneeN: [52, -94], ankleN: [48, -38],
  hipF: [-20, -152], kneeF: [-16, -96], ankleF: [-22, -40],
  // short jointed rods bolted to the front corners of the carcass (near: front, far: back)
  shN: [122, -430], elN: [126, -362], wrN: [128, -296],
  shF: [-120, -438], elF: [-126, -370], wrF: [-130, -304],
  // bottom drawer front (centre) and the folder tabs' base on the lid
  coatF: [20, -242],
  coatB: [-52, -636],
};

/** The brass label holder on the top drawer: the faceplate the letters glow in. */
export const PLATE_B = { cx: 20, cy: -550, w: 190, h: 108, glassW: 174, glassH: 92 } as const;

/** Letter height on the label holder (A: 74). */
export const LETTERS_B = 68;

/** Magnifier lens centre on hand.near (sheet space). */
export const LENS_B: [number, number] = [JB.wrN[0] + 4, JB.wrN[1] + 112];

export const PAL_B = {
  // office steel, olive
  olive: '#78814b',
  oliveShade: '#5f673a',
  oliveDark: '#3f4527',
  oliveHi: '#9aa46a',
  oliveLid: '#8d975c',
  gap: '#1f2216',
  // brass label holders, screws, magnifier
  brass: '#d1a44a',
  brassShade: '#a87e2e',
  brassHi: '#f3da92',
  // chrome cup pulls
  chrome: '#c9ccc4',
  chromeShade: '#8e928a',
  chromeHi: '#f2f3ee',
  glass: '#10131a',
  glassHi: '#2a3140',
  card: '#efe6cc',
  cardInk: '#8e8468',
  // limbs: gunmetal rods with dark joints
  rod: '#5d6574',
  rodHi: '#8d96a8',
  rodDark: '#363b47',
  joint: '#2c303a',
  glove: '#f4efe2',
  gloveShade: '#cfc7b4',
  // chunky shoes
  shoe: '#4b2e1d',
  shoeHi: '#74482e',
  sole: '#211510',
  // the flat cap: rust corduroy, a size too small
  cap: '#a3532c',
  capShade: '#7c3c1d',
  capDark: '#5a2913',
  capHi: '#c7774a',
  // folder tabs
  manila: '#e8cf8f',
  manilaShade: '#c4a865',
  folderRed: '#c0483a',
  folderTeal: '#3f8c8a',
  amber: '#ffb22e',
} as const;
