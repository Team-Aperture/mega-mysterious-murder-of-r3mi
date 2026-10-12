import { Defs, capsule, circle, ellipse, fillOnly, line, mix, part, path, rr, sheet, smooth, solid, EDGE } from '../../art/svg';
import { HEAD, J, PAL, TANK } from './geo';

/**
 * R-3MI rig sheet (procedural placeholder art, see docs/ANIMATION_PIPELINE.md).
 * Model reference: Team-Aperture/anlage-ii assets/portraits/r3mi_neutral.png — egg helmet with
 * one green eye and a graphite side plate, wide bone-white chest shield, navy-ribbed waist,
 * bone-white pelvis and thigh plates, graphite limbs, green-ringed shoulder/elbow joints,
 * chunky boots, green tank backpack. Eye, LEDs, hoses and fluid are live features, not parts.
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
    const panel = smooth([
      [cx - 140, cy - 160], [cx - rx * 0.42, cy - ry * 0.95], [cx - rx * 0.18, cy - ry * 0.5], [cx - rx * 0.12, cy],
      [cx - rx * 0.2, cy + ry * 0.5], [cx - rx * 0.36, cy + ry * 0.95], [cx - 140, cy + 160],
    ]);
    parts.push(part('head', solid(d, 'head', head, PAL.shade, [
      fillOnly(ellipse(cx + 12, cy - 10, rx * 0.92, ry * 0.94), PAL.shell),
      fillOnly(smooth([[cx + 30, cy - ry * 0.86], [cx + rx * 0.72, cy - ry * 0.62], [cx + rx * 0.66, cy - ry * 0.5], [cx + 26, cy - ry * 0.74]]), '#ffffff', 0.6),
      fillOnly(ellipse(cx + 26, cy + ry * 0.86, rx * 0.6, 16), PAL.shade2, 0.45),
      fillOnly(panel, PAL.limb),
      fillOnly(smooth([[cx - rx * 0.5, cy - ry * 0.7], [cx - rx * 0.26, cy - ry * 0.4], [cx - rx * 0.3, cy - ry * 0.1], [cx - rx * 0.6, cy - ry * 0.4]]), PAL.limbHi, 0.9),
      line(`M${cx - rx * 0.42} ${cy - ry * 0.95}C${cx - rx * 0.16} ${cy - ry * 0.5} ${cx - rx * 0.1} ${cy} ${cx - rx * 0.2} ${cy + ry * 0.5}S${cx - rx * 0.36} ${cy + ry * 0.95} ${cx - rx * 0.36} ${cy + ry * 0.95}`, PAL.limbHi2, 3),
      line(`M${cx + 10} ${cy - ry}C${cx + 24} ${cy - ry * 0.5} ${cx + 26} ${cy + ry * 0.4} ${cx + 22} ${cy + ry * 0.98}`, PAL.shade2, 2.5),
    ]) +
      // ear disc on the side plate
      path(circle(cx - rx * 0.42, cy - 4, 19), PAL.limbHi, { sw: 3.5 }) +
      path(circle(cx - rx * 0.42, cy - 4, 10), PAL.limb, { sw: 2.5 }) +
      // the socket rim pressed into the shell (the optic itself is live)
      fillOnly(circle(J.head[0] + 44, -796, 44), PAL.shade2, 0.55) +
      path(circle(J.head[0] + 42, -800, 41), PAL.shade, { sw: 3.5 }),
    { 'data-bone': 'head' }));
  }

  /* ---------------------------------------------------------------- neck */
  parts.push(part('neck',
    path(capsule(13, -710, 17, 8, -640, 19), PAL.limb) +
    line('M-6 -692H32M-8 -676H30M-9 -660H29', PAL.limbHi2, 3),
    { 'data-bone': 'neck' }));

  /* ---------------------------------------------------------------- torso */
  {
    const shield = smooth([
      [-62, -650], [10, -666], [86, -654], [92, -606], [80, -550], [58, -500], [24, -466],
      [-4, -470], [-32, -506], [-54, -560], [-66, -612],
    ]);
    const yoke = smooth([[-70, -640], [-58, -676], [10, -686], [84, -678], [96, -640], [56, -652], [10, -660], [-36, -652]]);
    parts.push(part('torso',
      solid(d, 'shield', shield, PAL.shade, [
        fillOnly(ellipse(28, -594, 70, 104), PAL.shell),
        fillOnly(smooth([[44, -650], [76, -638], [80, -604], [60, -620]]), '#ffffff', 0.55),
        line('M10 -664C16 -600 18 -530 18 -468', PAL.shade2, 2.5),
        line('M-44 -560L4 -508M80 -560L32 -508', PAL.shade2, 2.5, 0.75),
        fillOnly(ellipse(10, -476, 52, 12), PAL.shade2, 0.45),
      ]) +
      path(rr(9, -548, 18, 48, 9), '#14161a', { sw: 3.5 }) +
      solid(d, 'yoke', yoke, PAL.limb, [fillOnly(smooth([[-40, -672], [10, -682], [70, -674], [10, -668]]), PAL.limbHi)]),
      { 'data-bone': 'torso' }));
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
    parts.push(part(`shoulder.${side}`,
      path(circle(S[0], S[1], 31), c(PAL.limb)) +
      path(circle(S[0], S[1], 18), c(PAL.limbHi), { sw: 3.5 }) +
      fillOnly(circle(S[0] - 8, S[1] - 9, 6), c(PAL.limbHi2)),
      { 'data-bone': `upperarm.${side}` }));
    parts.push(part(`upperarm.${side}`,
      solid(d, `uarm-${side}`, capsule(S[0], S[1], 21, E[0], E[1], 18), c(PAL.limb), [
        fillOnly(capsule(S[0] + 8, S[1], 8, E[0] + 6, E[1], 6), c(PAL.limbHi)),
      ]) +
      line(`M${S[0] - 18} ${S[1] + 56}h36M${S[0] - 17} ${S[1] + 106}h35`, c(PAL.limbHi2), 3),
      { 'data-bone': `upperarm.${side}` }));
    parts.push(part(`elbow.${side}`,
      path(circle(E[0], E[1], 22), c(PAL.limb)) + path(circle(E[0], E[1], 11), c(PAL.limbHi), { sw: 3 }),
      { 'data-bone': `forearm.${side}` }));
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
    const palmSvg = solid(d, `palm-${side}`, palm, c(PAL.limb), [fillOnly(ellipse(hx + 5, hy + 20, 10, 17), c(PAL.limbHi))], { sw: 3.5 });
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
    parts.push(part('tank.back',
      path(rr(-90, -700, 34, 20, 6), PAL.limb, { sw: 3.5 }) +
      path(rr(-90, -620, 34, 20, 6), PAL.limb, { sw: 3.5 }) +
      path(rr(T.x - 3, T.y, T.w + 6, T.h, 14), PAL.glass, { sw: 4 }),
      { 'data-bone': 'tank' }));
    parts.push(part('tank.front',
      fillOnly(rr(T.x + 7, T.y + 12, 9, T.h - 24, 4.5), '#ffffff', 0.32) +
      fillOnly(rr(T.x + T.w - 12, T.y + 16, 4, T.h - 34, 2), '#ffffff', 0.2) +
      `<path d="${rr(T.x - 3, T.y, T.w + 6, T.h, 14)}" fill="none" stroke="${EDGE}" stroke-width="4"/>` +
      solid(d, 'cap-top', rr(T.x - 9, T.y - 22, T.w + 18, 30, 10), PAL.limb, [fillOnly(rr(T.x - 3, T.y - 17, T.w + 6, 6, 3), PAL.limbHi2)]) +
      solid(d, 'cap-bot', rr(T.x - 9, T.y + T.h - 8, T.w + 18, 30, 10), PAL.limb, [fillOnly(rr(T.x - 3, T.y + T.h - 3, T.w + 6, 6, 3), PAL.limbHi2)]) +
      path(circle(T.x + 13, T.y - 27, 8), PAL.limbHi, { sw: 3.5 }) +
      path(circle(T.x + 37, T.y - 27, 8), PAL.limbHi, { sw: 3.5 }) +
      path(circle(T.x + T.w / 2, T.y + T.h + 27, 8), PAL.limbHi, { sw: 3.5 }),
      { 'data-bone': 'tank' }));
  }

  return sheet('r3mi', d, parts, [-200, -910, 340, 925]);
}
