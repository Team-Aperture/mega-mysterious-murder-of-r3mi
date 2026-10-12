import type { Game } from '../game/game';
import type { SequenceDef } from './sequence';
import { AVALANCHE, ENDING, ENTRANCE, NOCH_NICHT, OPENING, SEAT_STRUGGLE, TRIP } from './scenes';

/** All replayable cutscenes (Animation Lab and dev routes). */
export const SCENES: Record<string, SequenceDef<Game>> = {
  opening: OPENING,
  entrance: ENTRANCE,
  seat: SEAT_STRUGGLE,
  noch: NOCH_NICHT,
  avalanche: AVALANCHE,
  trip: TRIP,
  ending: ENDING,
};
