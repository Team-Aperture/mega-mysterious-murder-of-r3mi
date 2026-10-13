import { Defs, capsule, circle, ellipse, fillOnly, line, mix, part, path, rr, sheet, smooth, solid, EDGE } from '../../art/svg';
import { CROWN, HEAD, HUB, J, MOUNT, PAL, SH_CAP, TANK, TANK_C, tankPt } from './geo';

/**
 * R-3MI rig sheet (procedural placeholder art, see docs/ANIMATION_PIPELINE.md).
 * Model reference: Team-Aperture/anlage-ii assets/portraits/r3mi_neutral.png — egg helmet with
 * one green eye and a graphite side plate, wide bone-white chest shield, navy-ribbed waist,
 * bone-white pelvis and thigh plates, graphite limbs, green-ringed shoulder/elbow joints,
 * chunky boots, green tank backpack. Eye, LEDs, hoses and fluid are live features, not parts.
 * Handedness follows the canon (see geo.ts): ringed near arm at the back under the tank.
 */
type P = [number, number];
const add = (p: readonly number[], dx: number, dy = 0): P => [p[0] + dx, p[1] + dy];

export function r3miSheet(): string {
  const d = new Defs('r3mi');
  const parts: string[] = [];
  const far = (c: string) => mix(c, EDGE, 0.3);

  /* ---------------------------------------------------------------- head */
  {
    const { cx, cy, rx, ry } = HEAD;
    // egg: fuller at the crown, narrowing to the chin, the face turned toward +x
    const head = smooth([
      [cx - 6, cy - ry], [cx + rx * 0.55, cy - ry * 0.9], [cx + rx * 0.92, cy - ry * 0.55], [cx + rx, cy - ry * 0.05],
      [cx + rx * 0.86, cy + ry * 0.45], [cx + rx * 0.5, cy + ry * 0.84], [cx + 2, cy + ry * 0.98],
      [cx - rx * 0.46, cy + ry * 0.82], [cx - rx * 0.82, cy + ry * 0.4], [cx - rx * 0.95, cy - ry * 0.1],
      [cx - rx * 0.78, cy - ry * 0.6], [cx - rx * 0.42, cy - ry * 0.92],
    ]);
    // graphite panel inset in the BACK quarter of the shell (white continues over the crown)
    const panel = smooth([[-20, -856], [-12, -792], [-20, -728], [-62, -722], [-96, -792], [-62, -862]]);
    parts.push(part('head', solid(d, 'head', head, PAL.shade, [
      fillOnly(ellipse(cx + 12, cy - 10, rx * 0.92, ry * 0.94), PAL.shell),
      // brightest streak on the upper shell between the face seam and the panel
      fillOnly(smooth([[8, -880], [38, -876], [40, -852], [12, -842]]), '#ffffff', 0.6),
      fillOnly(ellipse(cx + 26, cy + ry * 0.86, rx * 0.6, 16), PAL.shade2, 0.45),
      fillOnly(panel, PAL.limb),
      path(rr(-60, -848, 34, 112, 13), 'none', { stroke: PAL.limbHi2, sw: 2.5 }),
      line('M-26 -842V-742', PAL.limbHi2, 2, 0.8),
      fillOnly(smooth([[-52, -838], [-36, -826], [-40, -790], [-56, -804]]), PAL.limbHi, 0.9),
      line('M-20 -856C-10 -820 -10 -764 -20 -728', PAL.limbHi2, 3),
      // the face seam runs on the eye's vertical axis (the socket hides its middle)
      line('M46 -888C58 -850 60 -760 50 -694', PAL.shade2, 2.5),
    ]) +
      fillOnly(circle(0, -820, 3.2), PAL.shade2) +
      // the socket rim pressed into the shell (the optic itself is live)
      fillOnly(circle(J.head[0] + 44, -796, 44), PAL.shade2, 0.55) +
      path(circle(J.head[0] + 42, -800, 41), PAL.shade, { sw: 3.5 }) +
      // hose port on the crown, a little behind the top, its mouth tipped up and back
      `<g transform="rotate(-35 ${CROWN[0]} ${CROWN[1]})">` +
      solid(d, 'crown', rr(CROWN[0] - 17, CROWN[1] - 16, 34, 26, 9), PAL.limb, [fillOnly(rr(CROWN[0] - 11, CROWN[1] - 12, 22, 6, 3), PAL.limbHi2)]) +
      '</g>',
    { 'data-bone': 'head' }));
  }

  /* ---------------------------------------------------------------- neck */
  parts.push(part('neck',
    path(capsule(24, -712, 17, 18, -640, 19), PAL.limb) +
    line('M5 -690Q23 -683 41 -690M4 -676Q22 -669 40 -676M3 -662Q21 -655 39 -662', PAL.limbHi2, 3),
    { 'data-bone': 'neck' }));

  /* ---------------------------------------------------------------- torso */
  {
    // front lobe rises toward the chin, a U opening shows the neck, the back rises into the cowl
    const shield = smooth([
      [-26, -676], [16, -648], [78, -684], [94, -650], [92, -606], [80, -550], [60, -500], [48, -474],
      [22, -470], [-6, -470], [-24, -500], [-40, -560], [-56, -612], [-50, -652],
    ]);
    parts.push(part('torso',
      // his flank shows behind the plate (three-quarter view): dark, ribbed
      solid(d, 'flank', rr(-82, -606, 60, 132, 16), PAL.limb, [line('M-76 -566H-30M-76 -540H-30M-76 -514H-30', PAL.limbHi, 3)]) +
      solid(d, 'shield', shield, PAL.shade, [
        fillOnly(ellipse(30, -596, 70, 104), PAL.shell),
        fillOnly(smooth([[48, -668], [80, -664], [84, -620], [62, -634]]), '#ffffff', 0.55),
        // body centre line: from the neck opening straight down to the top of the slot
        line('M24 -650C30 -612 34 -580 35 -534', PAL.shade2, 2.5),
        fillOnly(ellipse(-14, -486, 30, 12), PAL.shade2, 0.45),
        fillOnly(circle(-8, -610, 3.5), PAL.shade2),
      ]) +
      // the green slot is a notch in the plate's lower edge, opening into the waist
      path(rr(21, -532, 24, 60, 10), '#14161a', { sw: 3.5 }),
      { 'data-bone': 'torso' }));
    // the white cowl of the chest plate arcs over the big near shoulder disk (in front of it);
    // a tighter one fits the plain shoulder (used while he faces right, see Handedness)
    const cowlPart = (id: string, ri: number, ro: number, alt: boolean) => {
      const S = J.shN, a0 = (-24 * Math.PI) / 180, a1 = (-150 * Math.PI) / 180;
      const pt = (r: number, a: number) => `${S[0] + r * Math.cos(a)} ${S[1] + r * Math.sin(a)}`;
      // the front end flares down into the chest plate so the two read as one piece of armour
      const d0 = `M${pt(ro, a0)}A${ro} ${ro} 0 0 0 ${pt(ro, a1)}L${pt(ri, a1)}A${ri} ${ri} 0 0 1 ${pt(ri, a0)}` +
        `L${S[0] + ri * 0.95} ${S[1] + 10}L${S[0] + ro * 0.8} ${S[1] + 4}Z`;
      parts.push(part(id,
        solid(d, id.replace('#', '-'), d0, PAL.shade, [
          fillOnly(ellipse(S[0] + 4, S[1] - (ri + ro) / 2, ro * 0.7, (ro - ri) * 0.42), PAL.shell),
          line(`M${pt(ri + 5, a0 - 0.12)}A${ri + 5} ${ri + 5} 0 0 0 ${pt(ri + 5, a1 + 0.1)}`, PAL.shade2, 2, 0.75),
        ]),
        alt ? { 'data-bone': 'torso', 'data-alt': 1 } : { 'data-bone': 'torso' }));
    };
    cowlPart('cowl', 44, 72, false);
    cowlPart('cowl#plain', 28, 52, true);
  }

  /* ---------------------------------------------------------------- waist */
  parts.push(part('waist',
    path(rr(-22, -490, 60, 104, 20), PAL.limb) +
    [0, 1, 2].map((i) => path(rr(-28, -476 + i * 26, 72, 17, 8.5), PAL.navy, { sw: 3.5 }) +
      fillOnly(rr(-20, -472 + i * 26, 54, 5, 2.5), PAL.navyHi, 0.9)).join(''),
    { 'data-bone': 'torso' }));

  /* ---------------------------------------------------------------- pelvis */
  {
    const pel = smooth([[-54, -424], [8, -434], [66, -422], [64, -388], [44, -360], [10, -350], [-22, -358], [-46, -386]]);
    parts.push(part('pelvis', solid(d, 'pelvis', pel, PAL.shade, [
      fillOnly(ellipse(20, -400, 50, 38), PAL.shell),
      line('M10 -432C12 -404 11 -372 10 -351', PAL.shade2, 2.5),
      fillOnly(circle(-34, -404, 4.5), PAL.shade2),
      fillOnly(circle(52, -404, 4.5), PAL.shade2),
    ]), { 'data-bone': 'pelvis' }));
  }

  /* ---------------------------------------------------------------- legs */
  const leg = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const H = side === 'near' ? J.hipN : J.hipF;
    const K = side === 'near' ? J.kneeN : J.kneeF;
    const A = side === 'near' ? J.ankleN : J.ankleF;
    const c = (x: string) => (dark ? far(x) : x);
    const thigh = capsule(H[0], H[1], 32, K[0], K[1], 23);
    const plate = smooth([add(H, -6, 6), add(H, 22, -2), add(H, 38, 40), add(K, 26, -60), add(K, 12, -24), add(K, -4, -44), add(H, -10, 60)]);
    parts.push(part(`thigh.${side}`,
      solid(d, `thigh-${side}`, thigh, c(PAL.limb), [fillOnly(capsule(H[0] + 12, H[1], 12, K[0] + 8, K[1], 8), c(PAL.limbHi))]) +
      solid(d, `thighplate-${side}`, plate, c(PAL.shade), [fillOnly(ellipse(H[0] + 22, H[1] + 70, 24, 74), c(PAL.shell)), fillOnly(ellipse(H[0] + 28, H[1] + 34, 7, 22), '#ffffff', dark ? 0.15 : 0.5)]),
      { 'data-bone': `thigh.${side}` }));
    parts.push(part(`knee.${side}`,
      path(circle(K[0], K[1], 24), c(PAL.limb)) +
      path(circle(K[0], K[1], 13), c(PAL.limbHi), { sw: 3 }) +
      fillOnly(circle(K[0] - 6, K[1] - 7, 5), c(PAL.limbHi2)),
      { 'data-bone': `shin.${side}` }));
    const shin = capsule(K[0], K[1], 23, A[0], A[1], 17);
    const guard = smooth([add(K, 8, 20), add(K, 20, 56), add(K, 18, 110), add(A, 13, -26), add(A, 5, -44), add(K, 2, 100), add(K, 0, 40)]);
    parts.push(part(`shin.${side}`,
      solid(d, `shin-${side}`, shin, c(PAL.limb), [fillOnly(capsule(K[0] + 8, K[1], 9, A[0] + 5, A[1], 6), c(PAL.limbHi))]) +
      solid(d, `guard-${side}`, guard, c(PAL.limbHi2), [fillOnly(ellipse(K[0] + 14, K[1] + 70, 5, 44), c('#77738a'))], { sw: 3.5 }),
      { 'data-bone': `shin.${side}` }));
    const boot = smooth([add(A, -40, -14), add(A, 6, -18), add(A, 34, -4), add(A, 70, 22), add(A, 78, 40), add(A, 72, 46), add(A, -46, 46), add(A, -50, 30), add(A, -48, 4)]);
    parts.push(part(`foot.${side}`,
      path(circle(A[0], A[1], 17), c(PAL.limbHi)) +
      solid(d, `boot-${side}`, boot, c(PAL.limb), [
        fillOnly(rr(A[0] - 54, A[1] + 34, 140, 14, 3), c('#141218')),
        fillOnly(smooth([add(A, 10, -10), add(A, 42, 4), add(A, 60, 22), add(A, 30, 12)]), c(PAL.limbHi2), 0.9),
        fillOnly(rr(A[0] - 40, A[1] + 6, 8, 26, 3), c(PAL.limbHi), 0.8),
      ]),
      { 'data-bone': `foot.${side}` }));
  };
  leg('far');
  leg('near');

  /* ---------------------------------------------------------------- arms */
  const arm = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const S = side === 'near' ? J.shN : J.shF;
    const E = side === 'near' ? J.elN : J.elF;
    const W = side === 'near' ? J.wrN : J.wrF;
    const c = (x: string) => (dark ? far(x) : x);
    // the big shoulder disk (canon: his left shoulder) and a plain joint; Handedness swaps them
    // stepped cylinder seen in 3/4: outer disk, drum, end cap (its ring is a live LED)
    const cx = S[0] + SH_CAP[0], cy = S[1] + SH_CAP[1];
    const disk = path(circle(S[0], S[1], 46), c(PAL.limb)) +
      line(`M${S[0] - 30} ${S[1] - 34}A46 46 0 0 1 ${S[0] + 34} ${S[1] - 30}`, c(PAL.limbHi2), 3, 0.8) +
      path(circle(S[0] + SH_CAP[0] * 0.55, S[1] + SH_CAP[1] * 0.6, 33), c(PAL.limbHi), { sw: 3.5 }) +
      path(circle(cx, cy, 24), c(PAL.limb), { sw: 3.5 }) +
      path(circle(cx, cy, 9), c('#141218'), { sw: 2.5 }) +
      fillOnly(circle(S[0] + 16, S[1] - 22, 7), c(PAL.limbHi2), 0.9);
    const plain = path(circle(S[0], S[1], 29), c(PAL.limb)) +
      path(circle(S[0], S[1], 17), c(PAL.limbHi), { sw: 3.5 }) +
      fillOnly(circle(S[0] - 8, S[1] - 9, 6), c(PAL.limbHi2));
    parts.push(part(`shoulder.${side}`, side === 'near' ? disk : plain, { 'data-bone': `upperarm.${side}` }));
    parts.push(part(`shoulder.${side}#${side === 'near' ? 'plain' : 'disk'}`, side === 'near' ? plain : disk, { 'data-bone': `upperarm.${side}`, 'data-alt': 1 }));
    parts.push(part(`upperarm.${side}`,
      solid(d, `uarm-${side}`, capsule(S[0], S[1], 21, E[0], E[1], 18), c(PAL.limb), [
        fillOnly(capsule(S[0] + 8, S[1], 8, E[0] + 6, E[1], 6), c(PAL.limbHi)),
      ]) +
      line(`M${S[0] - 18} ${S[1] + 56}h36M${S[0] - 17} ${S[1] + 106}h35`, c(PAL.limbHi2), 3),
      { 'data-bone': `upperarm.${side}` }));
    const elbowRinged = path(circle(E[0], E[1], 25), c(PAL.limb)) + path(circle(E[0] - 6, E[1] - 2, 15), c(PAL.limbHi), { sw: 3 });
    const elbowPlain = path(circle(E[0] - 11, E[1], 14), c(PAL.limb)) + path(circle(E[0] + 11, E[1], 14), c(PAL.limb)) +
      fillOnly(circle(E[0] - 14, E[1] - 4, 4), c(PAL.limbHi2)) + fillOnly(circle(E[0] + 8, E[1] - 4, 4), c(PAL.limbHi2));
    parts.push(part(`elbow.${side}`, side === 'near' ? elbowRinged : elbowPlain, { 'data-bone': `forearm.${side}` }));
    parts.push(part(`elbow.${side}#${side === 'near' ? 'plain' : 'ringed'}`, side === 'near' ? elbowPlain : elbowRinged, { 'data-bone': `forearm.${side}`, 'data-alt': 1 }));
    parts.push(part(`forearm.${side}`,
      solid(d, `farm-${side}`, capsule(E[0], E[1], 18, W[0], W[1], 14), c(PAL.limb), [
        fillOnly(smooth([add(E, 6, 20), add(E, 15, 46), add(W, 11, -40), add(W, 5, -18), add(W, -3, -50), add(E, -3, 50)]), c(PAL.limbHi2)),
      ]) +
      path(rr(W[0] - 18, W[1] - 14, 36, 17, 6), c(PAL.limbHi), { sw: 3.5 }),
      { 'data-bone': `forearm.${side}` }));
    // hands: relaxed (default) + poses as alternates
    const hx = W[0], hy = W[1];
    const palm = smooth([[hx - 17, hy], [hx + 17, hy], [hx + 22, hy + 28], [hx + 17, hy + 54], [hx - 14, hy + 56], [hx - 21, hy + 28]]);
    const finger = (x0: number, y0: number, x1: number, y1: number, r = 7.5) => path(capsule(x0, y0, r, x1, y1, r - 1), c(PAL.limb), { sw: 3.5 }) +
      fillOnly(capsule(x0 + 2, y0, 2.4, x1 + 2, y1, 2), c(PAL.limbHi2), 0.8);
    const palmSvg = side === 'near'
      ? solid(d, `palm-${side}`, rr(hx - 21, hy - 2, 43, 58, 12), c(PAL.limb), [path(rr(hx - 12, hy + 10, 25, 32, 7), c(PAL.limbHi), { sw: 2.5 })], { sw: 3.5 })
      : solid(d, `palm-${side}`, palm, c(PAL.limb), [fillOnly(ellipse(hx + 5, hy + 20, 10, 17), c(PAL.limbHi))], { sw: 3.5 });
    const thumb = finger(hx + 18, hy + 18, hx + 30, hy + 52, 7.5);
    parts.push(part(`hand.${side}`,
      thumb + palmSvg +
      finger(hx - 10, hy + 52, hx - 13, hy + 104) + finger(hx + 1, hy + 54, hx + 1, hy + 112, 8) + finger(hx + 12, hy + 52, hx + 16, hy + 102),
      { 'data-bone': `hand.${side}` }));
    parts.push(part(`hand.${side}#point`,
      palmSvg +
      path(rr(hx - 18, hy + 46, 38, 28, 11), c(PAL.limb), { sw: 3.5 }) +
      finger(hx + 7, hy + 54, hx + 11, hy + 122, 7.6) + thumb,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#fist`,
      solid(d, `fist-${side}`, rr(hx - 20, hy - 4, 42, 64, 17), c(PAL.limb), [fillOnly(rr(hx - 13, hy + 32, 30, 7, 3.5), c(PAL.limbHi2))], { sw: 3.5 }) +
      line(`M${hx - 15} ${hy + 44}h32M${hx - 15} ${hy + 54}h30`, c(PAL.limbHi), 2.5) + thumb,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#open`,
      finger(hx + 18, hy + 12, hx + 42, hy + 42, 7.5) + palmSvg +
      finger(hx - 10, hy + 50, hx - 27, hy + 100) + finger(hx + 0, hy + 54, hx - 2, hy + 114, 8) +
      finger(hx + 10, hy + 52, hx + 20, hy + 110) + finger(hx + 17, hy + 46, hx + 37, hy + 92, 7),
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
  };
  arm('far');
  arm('near');

  /* ---------------------------------------------------------------- tank */
  {
    const T = TANK;
    const lean = (inner: string) => `<g transform="rotate(${T.tilt} ${TANK_C[0]} ${TANK_C[1]})">${inner}</g>`;
    const [bx, by] = tankPt(T.x - 2, T.y + T.h + 12);
    const [tx, ty] = tankPt(T.x + T.w / 2 - 6, T.y - 28);
    parts.push(part('tank.back',
      // mount (all behind the head): a strut from the yoke to a box at neck level that clamps
      // the glass, and a tube from the box up to the junction where the two upper hoses meet
      path(capsule(-70, -688, 13, MOUNT[0], MOUNT[1] + 10, 13), PAL.limb) +
      solid(d, 'mast', capsule(MOUNT[0] + 2, MOUNT[1] - 10, 10, HUB[0], HUB[1] + 6, 9), PAL.limb, [fillOnly(capsule(MOUNT[0] + 5, MOUNT[1] - 14, 3.5, HUB[0] + 3, HUB[1] + 10, 3), PAL.limbHi)]) +
      lean(path(rr(T.x - 3, T.y, T.w + 6, T.h, 16), PAL.glass, { sw: 4 }) +
        path(rr(T.x + T.w - 6, T.y + T.h / 2 - 22, 50, 22, 6), PAL.limb, { sw: 3.5 })) +
      solid(d, 'mount', rr(MOUNT[0] - 22, MOUNT[1] - 20, 44, 40, 10), PAL.limb, [fillOnly(rr(MOUNT[0] - 15, MOUNT[1] - 13, 30, 7, 3.5), PAL.limbHi2)]) +
      path(rr(HUB[0] - 15, HUB[1] - 12, 30, 24, 8), PAL.limb, { sw: 3.5 }),
      { 'data-bone': 'tank' }));
    parts.push(part('tank.front',
      lean(
        // glint on the front-top (toward the head), a thin rim on the back edge
        fillOnly(rr(T.x + T.w - 21, T.y + 12, 11, T.h - 24, 5.5), '#ffffff', 0.34) +
        fillOnly(rr(T.x + 4, T.y + 16, 4, T.h - 34, 2), '#b9ff7a', 0.5) +
        `<path d="${rr(T.x - 3, T.y, T.w + 6, T.h, 16)}" fill="none" stroke="${EDGE}" stroke-width="4"/>` +
        solid(d, 'cap-top', rr(T.x - 10, T.y - 22, T.w + 20, 32, 11), PAL.limb, [fillOnly(rr(T.x - 4, T.y - 17, T.w + 8, 6, 3), PAL.limbHi2)]) +
        solid(d, 'cap-bot', rr(T.x - 10, T.y + T.h - 10, T.w + 20, 32, 11), PAL.limb, [fillOnly(rr(T.x - 4, T.y + T.h - 5, T.w + 8, 6, 3), PAL.limbHi2)])) +
      // hose sockets: on top slightly behind the centre, and at the back-bottom corner
      path(rr(tx - 10, ty - 10, 20, 18, 5), PAL.limbHi, { sw: 3.5 }) +
      path(circle(bx, by, 10), PAL.limbHi, { sw: 3.5 }),
      { 'data-bone': 'tank' }));
  }

  return sheet('r3mi', d, parts, [-260, -960, 400, 975]);
}
