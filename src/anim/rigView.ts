import { Container, Matrix, Sprite } from 'pixi.js';
import type { Atlas, PartTexture } from './atlas';
import { Pose, Skeleton, type SlotDef } from './rig';

/**
 * Display side of a rig: one flat list of sprites (slots) whose transforms are copied from the
 * skeleton's world matrices every frame. Flat, because draw order must be free of the bone
 * hierarchy (the near arm in front of the torso, the far arm behind it), exactly like the
 * slot/draw-order model of Spine.
 *
 * Live features (eyes, letters, hoses) are ordinary containers registered with a bone and a z,
 * so they sort together with the parts.
 */
export interface Live {
  name: string;
  bone: string;
  z: number;
  display: Container;
  /** Local offset from the bone pivot (sheet units). */
  ox?: number;
  oy?: number;
  /** If false, the container is not positioned by the rig (e.g. hoses in character space). */
  follow?: boolean;
  emissive?: boolean;
}

interface SlotRuntime {
  def: SlotDef;
  bone: number;
  sprite: Sprite;
  part: string | null;
  baseZ: number;
}

const tmp = new Matrix();

export class RigView {
  readonly root = new Container();
  /** Holds parts and live features in draw order. */
  readonly layer = new Container();
  readonly slots: SlotRuntime[] = [];
  readonly live: (Live & { boneIndex: number })[] = [];
  /** Colour multiplier for non-emissive slots (scene light). */
  lightTint = 0xffffff;
  private lastTint = -1;
  private zDirty = true;

  constructor(readonly sk: Skeleton, readonly atlas: Atlas) {
    this.layer.sortableChildren = true;
    this.root.addChild(this.layer);
    for (const def of sk.def.slots) {
      const sprite = new Sprite();
      sprite.label = def.name;
      sprite.roundPixels = false;
      this.layer.addChild(sprite);
      const part = def.part === undefined ? def.name : def.part;
      sprite.visible = false;
      // sentinel so the first setAttachment always applies (even for an empty default)
      this.slots.push({ def, bone: sk.bone(def.bone), sprite, part: '\u0000', baseZ: def.z });
      this.setAttachment(this.slots[this.slots.length - 1], part);
      sprite.zIndex = def.z;
    }
  }

  addLive(l: Live): void {
    const boneIndex = this.sk.bone(l.bone);
    l.display.zIndex = l.z;
    l.display.label = l.name;
    this.layer.addChild(l.display);
    this.live.push({ ...l, boneIndex });
    this.zDirty = true;
  }

  private setAttachment(s: SlotRuntime, part: string | null): void {
    if (s.part === part) return;
    s.part = part;
    const pt = part ? this.atlas.parts.get(part) : undefined;
    if (part && !pt) console.warn(`rig ${this.sk.def.id}: missing part "${part}" for slot ${s.def.name}`);
    if (!pt) { s.sprite.visible = false; return; }
    s.sprite.texture = pt.texture;
    s.sprite.visible = true;
  }

  part(id: string): PartTexture | undefined { return this.atlas.parts.get(id); }

  /** Copies the solved skeleton into the display objects. */
  sync(pose: Pose): void {
    const bones = this.sk.def.bones;
    for (const s of this.slots) {
      const att = s.def.name in pose.attach ? pose.attach[s.def.name] : (s.def.part === undefined ? s.def.name : s.def.part);
      this.setAttachment(s, att ?? null);
      const z = pose.z[s.def.name] ?? s.baseZ;
      if (s.sprite.zIndex !== z) { s.sprite.zIndex = z; this.zDirty = true; }
      if (!s.sprite.visible) continue;
      const pt = this.atlas.parts.get(s.part!)!;
      const w = this.sk.world[s.bone];
      const b = bones[s.bone];
      const k = 1 / this.atlas.scale;
      // part matrix = boneWorld · translate(rect - pivot) · scale(1/texelScale)
      const lx = pt.x - b.x, ly = pt.y - b.y;
      tmp.set(w.a * k, w.b * k, w.c * k, w.d * k, w.a * lx + w.c * ly + w.tx, w.b * lx + w.d * ly + w.ty);
      s.sprite.setFromMatrix(tmp);
    }
    for (const l of this.live) {
      const z = pose.z[l.name] ?? l.z;
      if (l.display.zIndex !== z) { l.display.zIndex = z; this.zDirty = true; }
      if (l.follow === false) continue;
      const w = this.sk.world[l.boneIndex];
      const b = bones[l.boneIndex];
      const lx = (l.ox ?? b.x) - b.x, ly = (l.oy ?? b.y) - b.y;
      tmp.set(w.a, w.b, w.c, w.d, w.a * lx + w.c * ly + w.tx, w.b * lx + w.d * ly + w.ty);
      l.display.setFromMatrix(tmp);
    }
    if (this.zDirty) { this.layer.sortChildren(); this.zDirty = false; }
    if (this.lightTint !== this.lastTint) {
      this.lastTint = this.lightTint;
      for (const s of this.slots) s.sprite.tint = s.def.emissive ? 0xffffff : this.lightTint;
      for (const l of this.live) if (!l.emissive) l.display.tint = this.lightTint;
    }
  }
}
