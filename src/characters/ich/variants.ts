import type { CharacterSpec } from '../actor';
import { ICH_A } from './index';
import { ICH_B } from './variantB';
import { ICH_C } from './variantC';

/**
 * The three ICH design directions share one skeleton (same bone names), so every clip, gag and
 * cutscene works with each of them. See docs/ICH_DESIGN_DIRECTIONS.md.
 */
const registry: Record<'a' | 'b' | 'c', () => CharacterSpec> = {
  a: () => ICH_A,
  b: () => ICH_B,
  c: () => ICH_C,
};

export function registerIchVariant(k: 'b' | 'c', f: () => CharacterSpec): void { registry[k] = f; }

export function ichSpec(design: 'a' | 'b' | 'c'): CharacterSpec {
  return registry[design]();
}
