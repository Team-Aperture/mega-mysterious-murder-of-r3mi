import type { CharacterSpec } from '../actor';
import { ICH_A } from './index';

/**
 * ICH, design direction C „Das Periskop" (see docs/ICH_DESIGN_DIRECTIONS.md).
 * PLACEHOLDER: reuses direction A until its own sheet exists.
 */
export const ICH_C: CharacterSpec = { ...ICH_A, id: 'ich-c' };
