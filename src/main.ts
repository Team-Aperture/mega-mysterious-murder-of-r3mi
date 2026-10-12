import './ui/base.css';
import './ui/game.css';
import { createStage } from './app/stage';

/**
 * Routes:
 *   (default)            title screen → Chapter 0
 *   ?lab                 Animation Lab
 *   ?dev=sheet&c=r3mi    raw rig sheet (art iteration)
 *   ?dev=pose|cabin      deterministic frames (screenshots)
 *   ?dev=seq&id=opening&t=10   one frame of a cutscene, re-simulated from zero
 */
const params = new URLSearchParams(location.search);
const ui = document.getElementById('ui')!;

async function boot(): Promise<void> {
  const dev = params.get('dev');
  if (dev === 'sheet') {
    const { showSheet } = await import('./dev/devViews');
    showSheet(ui, params.get('c') ?? 'r3mi');
    return;
  }
  const app = await createStage(document.getElementById('stage')!);
  if (dev === 'cabin' || dev === 'pose') {
    const v = await import('./dev/devViews');
    await (dev === 'cabin' ? v.showCabin(app, params) : v.showPose(app, params));
    return;
  }
  const { Game } = await import('./game/game');
  const { loadFonts } = await import('./dev/devViews');
  const g = new Game(app, ui);
  g.showLoading(0.05, 'Bordkarten werden geprüft …');
  await loadFonts();
  await g.load((k, label) => g.showLoading(k, label));
  g.hideLoading();
  (window as unknown as { __game: unknown }).__game = g;
  if (dev === 'seq') {
    const { SCENES } = await import('./story/registry');
    const { seek } = await import('./story/sequence');
    const { resetWorld } = await import('./story/scenes');
    const def = SCENES[params.get('id') ?? 'opening'];
    g.running = false;
    g.audio.silent = true;
    seek(def, g, () => resetWorld(g), (dt) => g.step(dt), Number(params.get('t') ?? 0));
    (window as unknown as { __ready: boolean }).__ready = true;
    return;
  }
  if (params.has('lab')) {
    const { startLab } = await import('./lab/lab');
    await startLab(g, params);
    return;
  }
  const { startTitle } = await import('./story/title');
  g.start();
  await startTitle(g);
}

boot().catch((err) => {
  console.error(err);
  ui.innerHTML = `<pre style="color:#ff6f61;padding:16px;white-space:pre-wrap">${String(err?.stack ?? err)}</pre>`;
});
