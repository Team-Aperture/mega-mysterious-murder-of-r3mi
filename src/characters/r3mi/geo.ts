/**
 * R-3MI joint layout in sheet space (facing right, three-quarter view, feet on y = 0).
 * Height ≈ 888 units ≈ 2.2 m. Shared by the rig sheet (drawing) and the rig (bones),
 * so the rest pose renders exactly like the drawing.
 *
 * Proportions measured on the canon portrait (anlage-ii r3mi_neutral.png, standing height ≈ 905 px):
 * head ≈ 22–25 % of the height, shoulders ≈ 22 % wide, fingertips at ≈ 75 % from the top,
 * hip at ≈ 57 % from the top. The legs are kept a touch longer than the portrait for the
 * legroom comedy; everything else follows it.
 */
export const J = {
  pelvis: [0, -392],
  hipN: [20, -378], kneeN: [30, -204], ankleN: [22, -46],
  hipF: [-22, -380], kneeF: [-14, -206], ankleF: [-26, -46],
  torso: [4, -452],
  neck: [10, -668],
  head: [14, -698],
  shN: [72, -628], elN: [80, -472], wrN: [84, -338],
  shF: [-56, -634], elF: [-64, -478], wrF: [-68, -344],
  tank: [-70, -642],
} as const;

export const HEAD = { cx: 18, cy: -790, rx: 78, ry: 100 } as const;
export const EYE = { x: 56, y: -800 } as const;
export const TANK = { x: -134, y: -762, w: 50, h: 176 } as const;

export const PAL = {
  shell: '#e7e3d9',
  shade: '#bcb7ac',
  shade2: '#9a958c',
  limb: '#2a2733',
  limbHi: '#3f3b49',
  limbHi2: '#5a566b',
  accent: '#2ecf62',
  eye: '#5dff9a',
  navy: '#2b3f6b',
  navyHi: '#46619a',
  glass: '#1d3428',
  fluid: '#45e07a',
  fluidHi: '#9dffc4',
} as const;
