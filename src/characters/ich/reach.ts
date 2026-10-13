import type { Atlas } from '../../anim/atlas';
import { Actor, type CharacterSpec } from '../actor';

export interface LensReach { examine: number; examineUp: number }

/** Direction A's measured values; also the fallback for a spec without a lens point. */
export const DEFAULT_REACH: LensReach = { examine: 335, examineUp: 108 };

/**
 * How far ahead of his feet the magnifier lens ends up in each examine pose (world units,
 * facing right). Measured on a hidden copy of the actual rig, so every ICH design direction
 * stands at the right distance to hold the lens over what he examines.
 */
export function measureLensReach(spec: CharacterSpec, atlas: Atlas): LensReach {
  const lens = spec.lens;
  if (!lens) return DEFAULT_REACH;
  const a = new Actor(spec, atlas, 1);
  const out = { ...DEFAULT_REACH };
  for (const clip of ['examine', 'examineUp'] as const) {
    if (!a.anim.has(clip)) continue;
    a.simulateTo(1.4, () => { a.x = 0; a.face(1, true); void a.play(clip, { fade: 0 }); }, 1 / 30);
    out[clip] = Math.round(a.worldPoint('hand.near', lens[0], lens[1]).x);
  }
  a.root.destroy({ children: true });
  return out;
}
