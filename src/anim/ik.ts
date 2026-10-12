/**
 * Analytic two-bone IK in a y-down plane.
 *
 * Returns the absolute directions of the upper and lower segment so that the chain starting at
 * (hx, hy) ends at (tx, ty). `bend` = +1 puts the middle joint on the +x side of the line
 * (knees forward for a rig facing right), -1 on the other side (elbows).
 */
export interface IkResult {
  /** Absolute angle of the upper segment (radians, atan2 convention, y down). */
  a1: number;
  /** Absolute angle of the lower segment. */
  a2: number;
  /** Middle joint position. */
  mx: number;
  my: number;
  /** True when the target was out of reach and the chain was straightened. */
  clamped: boolean;
}

export function solveTwoBone(
  hx: number, hy: number, tx: number, ty: number, l1: number, l2: number, bend = 1,
): IkResult {
  let dx = tx - hx, dy = ty - hy;
  let d = Math.hypot(dx, dy);
  const maxD = l1 + l2 - 1e-4;
  const minD = Math.abs(l1 - l2) + 1e-4;
  let clamped = false;
  if (d < 1e-6) { dx = 0; dy = 1; d = 1e-6; }
  if (d > maxD) { clamped = true; }
  const dc = Math.min(maxD, Math.max(minD, d));
  const base = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc);
  const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
  // y-down: subtracting rotates the upper segment toward +x when the chain points down.
  const a1 = base - a * bend;
  const mx = hx + Math.cos(a1) * l1;
  const my = hy + Math.sin(a1) * l1;
  const ex = hx + Math.cos(base) * dc, ey = hy + Math.sin(base) * dc;
  const a2 = Math.atan2(ey - my, ex - mx);
  return { a1, a2, mx, my, clamped };
}
