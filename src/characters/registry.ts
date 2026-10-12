import { buildAtlas, type Atlas } from '../anim/atlas';
import type { CharacterSpec } from './actor';
import { R3MI } from './r3mi';
import { VTGM } from './vtgm';
import { ICH_A } from './ich';

/**
 * All characters by id, and their atlases (built once per session).
 * An artist-authored sheet in `art/authored/<id>.svg` replaces the generated one, no code change.
 */
export const CHARACTERS: Record<string, CharacterSpec> = {
  r3mi: R3MI,
  vtgm: VTGM,
  ich: ICH_A,
};

const authored = import.meta.glob('/art/authored/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function sheetFor(spec: CharacterSpec): { svg: string; authored: boolean } {
  const key = `/art/authored/${spec.id}.svg`;
  if (authored[key]) return { svg: authored[key], authored: true };
  return { svg: spec.sheet(), authored: false };
}

const atlases = new Map<string, Promise<Atlas>>();
export function atlasFor(spec: CharacterSpec, scale: number, onProgress?: (d: number, t: number) => void): Promise<Atlas> {
  const key = `${spec.id}@${scale}`;
  let p = atlases.get(key);
  if (!p) {
    p = buildAtlas(spec.id, sheetFor(spec).svg, { scale, onProgress });
    atlases.set(key, p);
  }
  return p;
}
