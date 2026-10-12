import type { Game } from '../game/game';
import { ENTRANCE, OPENING } from './scenes';

export async function runChapter(g: Game): Promise<void> {
  await g.cutscene(OPENING);
  await g.cutscene(ENTRANCE);
  g.setControl(true);
}
