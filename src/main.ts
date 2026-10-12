import './ui/base.css';
import { createStage } from './app/stage';

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
  if (dev === 'pose') {
    const { showPose } = await import('./dev/devViews');
    await showPose(app, params);
    return;
  }
  ui.textContent = '';
}

boot().catch((err) => {
  console.error(err);
  ui.innerHTML = `<pre style="color:#ff6f61;padding:16px;white-space:pre-wrap">${String(err?.stack ?? err)}</pre>`;
});
