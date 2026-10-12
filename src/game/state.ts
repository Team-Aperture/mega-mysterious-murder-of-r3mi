/**
 * Chapter progress and settings, saved in localStorage (nothing leaves the browser).
 * Every read is defensive: a missing, corrupt or old save falls back to defaults.
 */
export type Phase = 'title' | 'intro' | 'explore' | 'meet' | 'investigate' | 'ending' | 'done';

export interface Progress {
  v: 1;
  phase: Phase;
  /** Clue ids examined during the investigation. */
  clues: string[];
  /** Flavour objects looked at (no clue value). */
  seen: string[];
  tripped: boolean;
  binOpened: boolean;
  choice: number;
}

export interface Settings {
  v: 1;
  music: number;
  sfx: number;
  voice: number;
  textSpeed: number;
  /** Canon: V-TGM speaks English with German subtitles. This switches her to German only. */
  vtgmGerman: boolean;
  reducedMotion: boolean;
  /** ICH design direction for the whole chapter: 'a' | 'b' | 'c'. */
  ichDesign: 'a' | 'b' | 'c';
  muted: boolean;
}

export const CLUES_NEEDED = 3;

const PK = 'mmm-r3mi.progress.v1';
const SK = 'mmm-r3mi.settings.v1';

export function defaultProgress(): Progress {
  return { v: 1, phase: 'intro', clues: [], seen: [], tripped: false, binOpened: false, choice: -1 };
}

export function defaultSettings(): Settings {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { v: 1, music: 0.6, sfx: 0.8, voice: 0.7, textSpeed: 1, vtgmGerman: false, reducedMotion: reduced, ichDesign: 'a', muted: false };
}

function read<T>(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable: play without saving */ }
}

const PHASES: Phase[] = ['title', 'intro', 'explore', 'meet', 'investigate', 'ending', 'done'];

/** Normalises anything into a valid Progress (exported for tests). */
export function normaliseProgress(x: unknown): Progress {
  const d = defaultProgress();
  if (!x || typeof x !== 'object') return d;
  const o = x as Record<string, unknown>;
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').slice(0, 32) : []);
  const phase = PHASES.includes(o.phase as Phase) ? (o.phase as Phase) : d.phase;
  return {
    v: 1,
    phase,
    clues: Array.from(new Set(strs(o.clues))),
    seen: Array.from(new Set(strs(o.seen))),
    tripped: o.tripped === true,
    binOpened: o.binOpened === true,
    choice: typeof o.choice === 'number' && o.choice >= -1 && o.choice <= 2 ? o.choice : -1,
  };
}

export function normaliseSettings(x: unknown): Settings {
  const d = defaultSettings();
  if (!x || typeof x !== 'object') return d;
  const o = x as Record<string, unknown>;
  const num = (v: unknown, lo: number, hi: number, f: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : f);
  return {
    v: 1,
    music: num(o.music, 0, 1, d.music),
    sfx: num(o.sfx, 0, 1, d.sfx),
    voice: num(o.voice, 0, 1, d.voice),
    textSpeed: num(o.textSpeed, 0.5, 2.5, d.textSpeed),
    vtgmGerman: o.vtgmGerman === true,
    reducedMotion: typeof o.reducedMotion === 'boolean' ? o.reducedMotion : d.reducedMotion,
    ichDesign: o.ichDesign === 'b' || o.ichDesign === 'c' ? o.ichDesign : 'a',
    muted: o.muted === true,
  };
}

export const loadProgress = (): Progress | null => {
  const raw = read<Progress>(PK);
  return raw ? normaliseProgress(raw) : null;
};
export const saveProgress = (p: Progress): void => write(PK, p);
export const clearProgress = (): void => { try { localStorage.removeItem(PK); } catch { /* ignore */ } };
export const loadSettings = (): Settings => normaliseSettings(read<Settings>(SK));
export const saveSettings = (s: Settings): void => write(SK, s);
