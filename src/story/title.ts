import type { Game } from '../game/game';

/** Title screen (placeholder until the animated title sequence is in). */
export async function startTitle(g: Game): Promise<void> {
  const { runChapter } = await import('./chapter0');
  await runChapter(g);
}
