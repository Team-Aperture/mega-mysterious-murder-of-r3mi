/**
 * R-3MI joint layout in sheet space (facing right, three-quarter view, feet on y = 0).
 * Height ≈ 888 units ≈ 2.2 m. Shared by the rig sheet (drawing) and the rig (bones),
 * so the rest pose renders exactly like the drawing.
 *
 * Handedness. The canon portrait faces LEFT, three-quarter turned toward the viewer, and that
 * is how he stands in the cabin (the game mirrors the sheet to face left). So the sheet is the
 * canon mirrored: the NEAR arm and leg (his left side in canon) are on the BACK side of the body,
 * the near shoulder is the big black disk with the green ring, right under the tank, and the
 * far arm hangs at the chest's front edge, half hidden. The tank sits high (top at mid-head,
 * bottom at the shoulder disk) and leans back. When he faces right the decorations move to the
 * other arm (see `Handedness` in features.ts), so the ringed arm is always his left.
 *
 * Proportions measured on the canon portrait (anlage-ii r3mi_neutral.png, standing height ≈ 905 px):
 * head ≈ 22–25 % of the height, shoulders ≈ 22 % wide, fingertips at ≈ 75 % from the top,
 * hip at ≈ 57 % from the top. The legs are kept a touch longer than the portrait for the
 * legroom comedy; everything else follows it.
 */
export const J = {
  pelvis: [0, -392],
  hipN: [-28, -378], kneeN: [-24, -204], ankleN: [-30, -46],
  hipF: [24, -380], kneeF: [36, -206], ankleF: [30, -46],
  torso: [4, -452],
  neck: [10, -668],
  head: [14, -698],
  // the arms hang in a slight A: the near one angled back under the tank, the far forearm forward
  shN: [-76, -626], elN: [-110, -480], wrN: [-112, -344],
  shF: [70, -632], elF: [80, -480], wrF: [100, -348],
  tank: [-92, -664],
} as const;

export const HEAD = { cx: 18, cy: -790, rx: 78, ry: 100 } as const;
export const EYE = { x: 56, y: -800 } as const;
/** Glass interior (unrotated) and its lean in degrees (negative = top leans back). */
// tilt −14 at rest: the idle stoop leans him 4° forward, so the tank reads at the canon ≈10°
export const TANK = { x: -172, y: -794, w: 60, h: 156, tilt: -14 } as const;
/** Centre of the tank glass, the pivot of its lean. */
export const TANK_C = [TANK.x + TANK.w / 2, TANK.y + TANK.h / 2] as const;
/** A point given relative to the upright tank, leaned with it (sheet space). */
export function tankPt(x: number, y: number): [number, number] {
  const a = (TANK.tilt * Math.PI) / 180;
  const dx = x - TANK_C[0], dy = y - TANK_C[1];
  return [TANK_C[0] + dx * Math.cos(a) - dy * Math.sin(a), TANK_C[1] + dx * Math.sin(a) + dy * Math.cos(a)];
}
/** Where the two upper hoses meet, just behind the head's back edge. */
export const HUB = [-71, -813] as const;
/** Tank mount box at neck level (behind the head); a tube runs up from it to the hub. */
export const MOUNT = [-73, -731] as const;
/** Hose port on the crown of the head (slightly behind the top). */
export const CROWN = [-6, -890] as const;
/** The near shoulder is a stepped cylinder whose end cap (with the green ring) faces out of his
 *  left side, i.e. toward the back in this view: offset of the cap from the joint. */
export const SH_CAP = [-24, -5] as const;

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
