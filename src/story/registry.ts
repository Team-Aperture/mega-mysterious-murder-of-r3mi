import type { Game } from '../game/game';
import type { SequenceDef } from './sequence';
import { ENTRANCE, OPENING, SEAT_STRUGGLE } from './scenes';

/** All replayable cutscenes (Animation Lab and dev routes). */
export const SCENES: Record<string, SequenceDef<Game>> = {
  opening: OPENING,
  entrance: ENTRANCE,
  seat: SEAT_STRUGGLE,
};
