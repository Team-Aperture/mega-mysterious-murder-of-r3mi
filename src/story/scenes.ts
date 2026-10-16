import type { Game } from '../game/game';
import { at, type SequenceDef } from './sequence';
import { CABIN, MARK, SEAT_FLOOR, rowX } from '../world/layout';
import { clamp, lerp } from '../engine/math';
import { EASES } from '../engine/ease';

/**
 * Chapter 0 cutscenes. Each `setup` puts the world into a complete start state, so any scene
 * can be replayed on its own (Animation Lab) or skipped into its exact end state.
 */
type S = SequenceDef<Game>;

/** Neutral world: lights, doors, props, everybody standing in the aisle. */
export function resetWorld(g: Game): void {
  g.tweens.length = 0;
  const c = g.cabin;
  c.lightsOn = 0;
  c.nightLevel = 1;
  c.lavOpen = 0;
  c.setLavSign(true);
  c.setBinOpen(0);
  for (const n of [13, 14, 15]) c.setRecline(n, 0);
  c.sprites.get('lav.door')!.scale.x = 1 / g.props.scale;
  for (const t of g.tosses.splice(0)) t.s.destroy();
  g.attached.length = 0;
  for (const s of [...g.cabin.stage.children]) if ((s as { label?: string }).label === 'prop') s.destroy();
  g.dialogue.reset();
  g.clearCards();
  const { ich, r3mi, vtgm } = g.cast;
  for (const a of [ich, r3mi, vtgm]) { a.reset(); a.root.visible = true; a.scale = a.spec.scale ?? 1; }
  g.placeInAisle(ich, MARK.meetIch); ich.face(-1, true);
  g.placeInAisle(r3mi, MARK.meetR3mi); r3mi.face(-1, true);
  g.placeInAisle(vtgm, MARK.meetVtgm); vtgm.face(1, true);
  g.cam.follow = null;
  g.cam.stop();
  g.cam.tx = g.cam.x; g.cam.ty = -430; g.cam.tz = 1;
}

/* ====================================================================== opening */
export const OPENING: S = {
  id: 'opening', title: 'Eröffnung: Flug 303 bei Nacht', duration: 22.5,
  setup(g) {
    resetWorld(g);
    const { ich, r3mi, vtgm } = g.cast;
    ich.root.visible = false;
    g.placeInAisle(ich, MARK.ichStart);
    r3mi.setExpression('anxious', true);
    vtgm.setExpression('deadpan', true);
    void g.cam.moveTo(-1180, -560, 1.75, 0);
  },
  events: [
    at(0, (g) => { g.audio.ambience(true); g.audio.music('night'); }, 'Ambiente'),
    at(0.2, (g) => void g.cam.moveTo(-200, -440, 1.0, 13.5, 'sineInOut'), 'Kamerafahrt durch die Kabine'),
    at(1.0, (g) => g.audio.sfx('chime'), 'Gong'),
    at(2.2, (g) => void g.dialogue.pa({ who: 'pa', text: 'Meine Damen und Herren, hier spricht Ihr Kapitän.', auto: 0.8 }), 'Durchsage 1'),
    at(6.2, (g) => void g.dialogue.pa({ who: 'pa', text: 'Wir befinden uns weiterhin in einer Warteposition.', auto: 0.8 }), 'Durchsage 2'),
    at(10.2, (g) => void g.dialogue.pa({ who: 'pa', text: 'Bitte bleiben Sie angeschnallt. Und genießen Sie die … äh … Ruhe.', auto: 0.6 }), 'Durchsage 3'),
    at(12.5, (g) => void g.cast.r3mi.play('point', { fade: 0.3 }), 'R-3MI zeigt auf den Sitz'),
    at(13.4, (g) => g.line('r3mi', 'Das ist kein Sitz. Das ist ein *Vorschlag* für einen Sitz.', { auto: 0.8 })),
    at(17.2, (g) => { g.cast.r3mi.idle(0.4); g.cast.vtgm.setExpression('deadpan'); g.line('vtgm', 'It is a seat.', { sub: 'Das ist ein Sitz.', auto: 0.6 }); }),
    at(19.4, (g) => { void g.cast.r3mi.play('shrug'); g.line('r3mi', 'Für wen? Für eine Kaffeetasse?', { auto: 0.7 }); }),
  ],
};

/* ====================================================================== ICH's entrance */
export const ENTRANCE: S = {
  id: 'entrance', title: 'Auftritt ICH (Toilettentür)', duration: 15.5,
  setup(g) {
    resetWorld(g);
    const { ich, r3mi, vtgm } = g.cast;
    g.placeInAisle(ich, CABIN.lavDoor + 92);
    ich.face(-1, true);
    ich.root.visible = false;
    ich.root.zIndex = 9; // inside the doorway, behind the door frame
    ich.y = SEAT_FLOOR;
    r3mi.setExpression('anxious', true);
    vtgm.setExpression('deadpan', true);
    void g.cam.moveTo(-200, -440, 1.0, 0);
  },
  events: [
    at(0, (g) => void g.cam.moveTo(1640, -440, 1.12, 2.4, 'sineInOut'), 'Kamera zur Toilette'),
    at(2.6, (g) => g.audio.sfx('flush'), 'Spülung'),
    at(4.3, (g) => { g.cabin.setLavSign(false); g.audio.sfx('click'); }, 'FREI'),
    at(5.0, (g) => {
      g.audio.sfx('door');
      const ich = g.cast.ich;
      ich.root.visible = true;
      ich.setExpression('proud');
      void ich.play('pose', { fade: 0 });
      g.audio.music('detective');
    }, 'Tür auf: Gegenlicht-Pose'),
    at(5.6, (g) => g.audio.sfx('sting')),
    at(5.9, (g) => void g.card('DETEKTIV ICH', 'Spezialgebiet: alles', { comic: true, ms: 2200 }), 'Titelkarte'),
    at(8.6, (g) => {
      const ich = g.cast.ich;
      ich.root.zIndex = 50;
      ich.y = 0;
      ich.idle(0.3);
      void ich.walkTo(CABIN.lavDoor - 40);
    }, 'ICH tritt heraus'),
    at(9.9, (g) => { g.audio.sfx('door'); g.audio.sfx('klonk', { gain: 0.5 }); void g.cast.ich.play('yanked', { fade: 0.05 }); g.cast.ich.setExpression('shocked'); }, 'Tür schnappt zu: Mantel eingeklemmt'),
    at(12.2, (g) => {
      const ich = g.cast.ich;
      ich.x += ich.facing * 40; // the yank clip ends 40 units further on: take it over into the root
      ich.setExpression('neutral');
      void ich.play('hatAdjust', { fade: 0 });
    }),
    at(12.8, (g) => g.line('ich', 'Beabsichtigt.', { auto: 1.0 })),
    at(14.6, (g) => g.cast.ich.idle(0.3)),
  ],
  tick(g, t) {
    // the bi-fold lavatory door: folds open at 5.0, springs shut at 9.9
    const door = g.cabin.sprites.get('lav.door')!;
    const k = t < 5 ? 1 : t < 5.25 ? lerp(1, 0.16, EASES.backOut(clamp((t - 5) / 0.25))) : t < 9.75 ? 0.16 : lerp(0.16, 1, EASES.expoIn(clamp((t - 9.75) / 0.15)));
    door.scale.x = k / g.props.scale;
    g.cabin.lavOpen = t < 5 ? 0 : clamp((1 - k) / 0.84);
  },
};

/* ====================================================================== the seat */
/** Where everybody sits (actor roots). */
export const SEATS = {
  r3mi: { x: rowX(14) - 70, y: SEAT_FLOOR },
  vtgm: { x: rowX(13) - 101, y: SEAT_FLOOR - 172 },
  ich: { x: rowX(15) - 46, y: SEAT_FLOOR },
};

/** Puts the three into their seated end state (used to resume the investigation). */
export function seatedState(g: Game): void {
  const { ich, r3mi, vtgm } = g.cast;
  r3mi.x = SEATS.r3mi.x; r3mi.y = SEATS.r3mi.y; r3mi.face(-1, true); r3mi.root.zIndex = 35; r3mi.idle(0);
  void r3mi.play('sleep', { fade: 0 }); r3mi.setExpression('off', true);
  vtgm.x = SEATS.vtgm.x; vtgm.y = SEATS.vtgm.y; vtgm.face(-1, true); vtgm.root.zIndex = 25;
  void vtgm.play('sitDangle', { fade: 0 }); vtgm.setExpression('deadpan', true);
  g.placeInAisle(ich, 300); ich.face(-1, true);
  g.cabin.setRecline(13, 14);
}

const seatVtgm = (g: Game) => {
  const v = g.cast.vtgm;
  v.root.zIndex = 25; v.face(-1, true); v.x = SEATS.vtgm.x; v.y = SEATS.vtgm.y;
  void v.play('sitDown', { fade: 0.05, onEnd: () => void v.play('sitDangle', { fade: 0.2 }) });
};

export const SEAT_STRUGGLE: S = {
  id: 'seat', title: 'R-3MI gegen den Sitz (und schläft ein)', duration: 76,
  setup(g) {
    resetWorld(g);
    const { ich, r3mi, vtgm } = g.cast;
    g.placeInAisle(ich, 300); ich.face(-1, true);
    r3mi.setExpression('anxious', true);
    vtgm.setExpression('deadpan', true);
    void g.cam.moveTo(-120, -440, 1.08, 0);
  },
  events: [
    at(0, (g) => { g.audio.sfx('chime'); g.audio.music(null); }, 'Gong'),
    at(0.8, (g) => void g.dialogue.pa({ who: 'pa', text: 'Meine Damen und Herren, bitte nehmen Sie Ihre Plätze ein. Die Anschnallzeichen bleiben … weiterhin … eingeschaltet.', auto: 0.6 })),
    at(6.6, (g) => { void g.cast.r3mi.play('fidget', { fade: 0.3 }); g.line('r3mi', 'Okay. Okay. Ich schaffe das. Ich bin quasi Profi im Sitzen.', { mood: 'anxious', auto: 0.9 }); }),
    // V-TGM: three steps, a hop, and she is in
    at(8.4, (g) => { const v = g.cast.vtgm; v.face(-1); void v.walkTo(-470); }, 'V-TGM geht zu 13C'),
    at(9.7, (g) => {
      const v = g.cast.vtgm;
      v.root.zIndex = 25;
      void v.play('hop', { fade: 0.05 });
      void g.tween(v, { x: SEATS.vtgm.x, y: SEATS.vtgm.y }, 0.5, 'sineInOut');
    }, 'Hüpfer in den Sitz'),
    at(10.5, (g) => { g.audio.sfx('thud', { gain: 0.5 }); seatVtgm(g); }),
    at(11.4, (g) => { void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.line('vtgm', 'Plenty of room down here.', { sub: 'Hier unten ist reichlich Platz.', auto: 0.8 }); }),
    // attempt 1
    at(14.0, (g) => {
      const r = g.cast.r3mi;
      g.cast.vtgm.anim.stop('face', 0.3);
      r.setExpression('anxious');
      // his knees end up in her back: he is drawn in front of her
      r.root.zIndex = 26;
      void g.tween(r, { x: SEATS.r3mi.x, y: SEATS.r3mi.y }, 0.4);
      void r.play('sitJam', { fade: 0.15 });
    }, 'Versuch 1: Tank gegen Lehne, Knie gegen Vordersitz'),
    at(14.85, (g) => g.cam.shake(3)),
    at(15.0, (g) => g.cast.vtgm.setExpression('suspicious')),
    at(16.4, (g) => g.line('r3mi', 'Au.', { auto: 0.5 })),
    // attempt 2
    at(17.6, (g) => void g.cast.r3mi.play('sitKneesUp', { fade: 0.1 }), 'Versuch 2: Knie bis zum Kinn'),
    at(19.0, (g) => { void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.cast.vtgm.setExpression('deadpan'); }, 'V-TGM, trocken in die Kamera'),
    at(19.6, (g) => g.line('vtgm', 'Comfortable?', { sub: 'Bequem?', auto: 0.7 })),
    at(21.4, (g) => g.line('r3mi', 'Sehr. Ich wohne jetzt hier.', { mood: 'annoyed', auto: 0.8 })),
    // the recline
    at(24.4, (g) => g.line('vtgm', 'Then you won\u2019t mind.', { sub: 'Dann stört dich das ja nicht.', auto: 0.6 })),
    at(26.2, (g) => void g.cast.vtgm.play('reclineReach', { fade: 0.15, onEnd: () => void g.cast.vtgm.play('sitDangle', { fade: 0.25 }) }), 'Sie drückt den Lehnenknopf'),
    at(26.8, (g) => { g.audio.sfx('creak'); void g.tween({ get r() { return 0; }, set r(v: number) { g.cabin.setRecline(13, v); } } as unknown as { r: number }, { r: 14 }, 0.35, 'backOut'); }),
    at(26.95, (g) => { void g.cast.r3mi.play('squished', { fade: 0.08 }); g.cast.r3mi.setExpression('panic'); g.audio.sfx('bonk', { gain: 0.6 }); }, 'R-3MI zerquetscht'),
    at(27.7, (g) => { g.cast.r3mi.setExpression('annoyed'); g.line('vtgm', 'Oops.', { sub: 'Hoppla.', auto: 0.6 }); }),
    at(29.0, (g) => g.line('r3mi', 'Das *WAREN* meine Knie.', { auto: 0.9 })),
    // attempt 3: legs into the aisle
    at(31.2, (g) => { const r = g.cast.r3mi; r.root.zIndex = 35; void r.play('legsOut', { fade: 0.1 }); }, 'Versuch 3: Beine in den Gang'),
    at(33.2, (g) => g.line('r3mi', 'Beinfreiheit. Ha. Das ist Bein-*Gefangenschaft*.', { auto: 0.9 })),
    at(36.4, (g) => { void g.cast.r3mi.play('complain', { layer: 'arms', fade: 0.15 }); g.line('r3mi', 'Wer hat diese Sitze kalibriert? Ich will einen Beschwerdebogen. In dreifacher Ausfertigung.', { auto: 1.0 }); }),
    at(41.6, (g) => { const r = g.cast.r3mi; r.setExpression('anxious'); r.look = { x: rowX(13) - 148, y: -600 }; g.line('r3mi', 'Ich hasse Fliegen. Ich hasse Höhe. Ich hasse, dass da unten *nichts* ist.', { auto: 0.9 }); }, 'Blick zum Fenster'),
    at(46.6, (g) => { g.cast.r3mi.look = null; void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.line('vtgm', 'Statistically, flying is the safest way to travel.', { sub: 'Statistisch gesehen ist Fliegen die sicherste Art zu reisen.', auto: 0.9 }); }),
    at(51.2, (g) => g.line('r3mi', 'Statistisch gesehen bin ich gerade sehr unglücklich.', { mood: 'sad', auto: 0.8 })),
    at(54.6, (g) => { g.cast.r3mi.setExpression('sleepy'); g.line('r3mi', 'Ich gehe in den Tiefschlafmodus. Da merke ich *absolut gar nichts* mehr. Weckt mich, wenn wir gelandet sind.', { auto: 1.0 }); }),
    at(60.6, (g) => { g.cast.vtgm.setExpression('fond'); void g.cast.vtgm.play('lookBack', { layer: 'face' }); }),
    at(61.0, (g) => { g.line('vtgm', 'Good night, R-3MI.', { sub: 'Gute Nacht, R-3MI.', auto: 0.8 }); }, 'Gute Nacht'),
    at(63.0, (g) => g.line('r3mi', 'Gute Nacht, V-TGM.', { auto: 0.7 })),
    at(64.6, (g) => void g.cast.r3mi.play('sleepSlump', { fade: 0.2, onEnd: () => void g.cast.r3mi.play('sleep', { fade: 0.4 }) }), 'Tiefschlafmodus'),
    at(69.0, (g) => { g.cast.r3mi.setExpression('off'); g.audio.sfx('snore', { gain: 0.6 }); g.cast.vtgm.setExpression('deadpan'); }),
    at(70.6, (g) => { void g.cast.ich.play('chinStroke', { fade: 0.3 }); g.line('ich', 'Interessant.', { auto: 0.8 }); }),
    at(72.4, (g) => { void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.line('vtgm', 'What is?', { sub: 'Was?', auto: 0.6 }); }),
    at(74.0, (g) => g.cast.ich.idle(0.4)),
  ],
};

/* ====================================================================== „NOCH nicht." */
export const NOCH_NICHT: S = {
  id: 'noch', title: '„NOCH nicht."', duration: 13,
  setup(g) { resetWorld(g); seatedState(g); void g.cam.moveTo(-60, -440, 1.08, 0); },
  events: [
    at(0, (g) => { void g.cast.ich.play('beat', { layer: 'accent', additive: true }); g.line('ich', 'Alles. Ein Detektiv findet alles interessant.', { auto: 0.8 }); }),
    at(3.6, (g) => { void g.cast.ich.play('aha', { fade: 0.15 }); g.line('ich', 'ICH werde jetzt ermitteln.', { mood: 'proud', auto: 0.8 }); }),
    at(6.2, (g) => { g.cast.ich.idle(0.4); void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.line('vtgm', 'There is no crime.', { sub: 'Es gibt kein Verbrechen.', auto: 0.7 }); }),
    at(8.4, (g) => { void g.cam.moveTo(g.cast.ich.x - 60, -520, 1.55, 1.1, 'expoOut'); void g.cast.ich.play('pose', { fade: 0.1 }); g.cast.ich.setExpression('proud'); }, 'Kamerafahrt auf ICH'),
    at(9.0, (g) => { g.audio.sfx('sting'); g.line('ich', '*NOCH* nicht.', { auto: 1.0 }); }, '„NOCH nicht."'),
    at(11.0, (g) => { void g.cast.vtgm.play('eyeRoll', { layer: 'face' }); g.cast.vtgm.setExpression('exasperated'); }, 'Augenrollen'),
    at(11.4, (g) => void g.cam.moveTo(-60, -440, 1.08, 1.5, 'sineInOut')),
    at(12.6, (g) => { g.cast.ich.idle(0.4); g.cast.ich.setExpression('neutral'); g.cast.vtgm.setExpression('deadpan'); }),
  ],
};

/* ====================================================================== the overhead bin */
export const BIN_X = rowX(15) - 112;
export const AVALANCHE: S = {
  id: 'avalanche', title: 'Das Gepäckfach (Lawine)', duration: 24,
  setup(g) {
    resetWorld(g); seatedState(g);
    g.placeInAisle(g.cast.ich, BIN_X); g.cast.ich.face(-1, true);
    void g.cam.moveTo(BIN_X, -420, 1.1, 0);
  },
  events: [
    at(0, (g) => { const ich = g.cast.ich; void g.cam.moveTo(ich.x, -420, 1.1, 1.0); g.line('ich', 'Das Gepäckfach. Verschlossen.', { auto: 0.6 }); }),
    at(2.2, (g) => { void g.cast.ich.play('reachUp', { fade: 0.2 }); g.line('ich', 'Was verbirgt es?', { auto: 0.5 }); }),
    at(3.3, (g) => { g.audio.sfx('latch'); g.audio.sfx('creak'); void g.tween({ get k() { return 0; }, set k(v: number) { g.cabin.setBinOpen(v); } } as unknown as { k: number }, { k: 1 }, 0.4, 'backOut'); g.cabin.lightsOn = 0; }, 'Klappe auf'),
    at(4.0, (g) => { void g.cast.ich.play('stand', { fade: 0.5 }); }, 'Nichts passiert'),
    at(5.6, (g) => {
      // a single pillow, onto the hat
      const ich = g.cast.ich;
      // lands on top of his hat, whichever ICH design is active
      const top = ich.headTop().y + 2;
      const p = g.spawnProp('pillow', ich.x + 20, top - 54, 61);
      g.toss({ s: p, x0: ich.x + 20, y0: top - 54, x1: ich.x + 6, y1: top, arc: 10, dur: 0.35, spin: 0.25, bounce: 6, sound: 'pop' });
      (g as unknown as { _pillow: unknown })._pillow = p;
    }, 'Ein Kissen'),
    at(6.6, (g) => g.line('ich', '… Ein Kissen.', { style: 'whisper', auto: 0.7 })),
    at(8.6, (g) => { void g.cast.ich.play('buried', { fade: 0.08 }); g.cast.ich.setExpression('nervous'); }, 'Lawine'),
    ...([
      ['suitcase', -60, -730, -20, -112, 0.5, 'thud'],
      ['duffel', 70, -720, 60, -150, -0.4, 'thud'],
      ['backpack', 0, -720, -40, -232, 0.8, 'thud'],
      ['duck', 10, -740, 16, -300, 2.6, 'squeak'],
      ['travelbug', 14, -740, 22, -334, 4.2, 'clink'],
    ] as const).map(([id, sx, sy, ex, ey, spin, snd], i) => at<Game>(8.7 + i * (i < 3 ? 0.26 : 0.7), (g) => {
      const ich = g.cast.ich;
      const sp = g.spawnProp(id, ich.x + sx, sy, 61 + i);
      g.toss({ s: sp, x0: ich.x + sx, y0: sy, x1: ich.x + ex, y1: ey, arc: 20, dur: 0.42 + i * 0.03, spin, bounce: i < 3 ? 14 : 6, sound: snd, shake: i < 3 ? 3 : 0 });
      (g as unknown as Record<string, unknown>)[`_lug${i}`] = sp;
    })),
    at(9.0, (g) => {
      const p = (g as unknown as { _pillow: import('pixi.js').Sprite })._pillow;
      g.toss({ s: p, x0: p.x, y0: p.y, x1: p.x + 140, y1: -40, arc: 60, dur: 0.6, spin: 2, bounce: 8 });
    }),
    at(11.6, (g) => g.line('ich', 'Interessant.', { style: 'whisper', auto: 0.8 })),
    at(13.4, (g) => { void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.line('vtgm', 'Smooth.', { sub: 'Elegant.', auto: 0.7 }); }),
    at(15.2, (g) => {
      const ich = g.cast.ich;
      ich.setExpression('proud');
      void ich.play('popOut', { fade: 0.05 });
      g.audio.sfx('whoosh');
      const L = g as unknown as Record<string, import('pixi.js').Sprite>;
      const out: [string, number, number][] = [['_lug0', -170, -30], ['_lug1', 200, -40], ['_lug2', -280, -30], ['_lug3', 110, -20]];
      out.forEach(([k, dx, y], i) => { const sp = L[k]; sp.zIndex = 45; g.toss({ s: sp, x0: sp.x, y0: sp.y, x1: ich.x + dx, y1: y, arc: 90 + i * 20, dur: 0.55, spin: dx > 0 ? 1.5 : -1.5, bounce: 10, sound: 'thud' }); });
      const tb = L._lug4;
      const [wx, wy] = ich.rest('hand.near');
      void g.tween(tb, { x: ich.x, y: -560 }, 0.25, 'quadOut', () => g.attach(tb, ich, 'hand.near', wx + 2, wy + 48));
    }, 'Er taucht auf, mit Fund'),
    at(16.6, (g) => g.line('ich', 'Ein Travel Bug. Er reist um die Welt, von Hand zu Hand.', { auto: 0.8 })),
    at(20.0, (g) => g.line('ich', 'Genau wie wir.', { auto: 0.6 })),
    at(21.6, (g) => g.line('ich', 'Zufall? … Ja.', { auto: 0.9 })),
    at(23.6, (g) => {
      const ich = g.cast.ich;
      const tb = (g as unknown as Record<string, import('pixi.js').Sprite>)._lug4;
      g.detach(tb); tb.destroy();
      ich.idle(0.3); ich.setExpression('neutral');
      (g as unknown as { _pillow: unknown })._pillow = null;
    }),
  ],
};

/* ====================================================================== the trip */
export const TRIP: S = {
  id: 'trip', title: 'Gestolpert über R-3MIs Beine', duration: 10.4,
  setup(g) {
    resetWorld(g); seatedState(g);
    g.placeInAisle(g.cast.ich, -150); g.cast.ich.face(-1, true);
    void g.cam.moveTo(-420, -420, 1.0, 0);
  },
  events: [
    at(0, (g) => {
      const ich = g.cast.ich;
      ich.stopWalking();
      void ich.play('trip', { fade: 0.05 });
      ich.setExpression('shocked');
      void g.cam.moveTo(ich.x + ich.facing * 380, -330, 1.05, 1.6, 'sineInOut');
    }, 'Fuß bleibt hängen'),
    at(0.58, (g) => {
      const ich = g.cast.ich;
      const hp = ich.worldPoint('hat');
      const [hx, hy] = ich.rest('hat');
      const hat = g.spawnPart(ich, 'hat', hx, hy, hp.x, hp.y, 52);
      (g as unknown as { _hat: unknown })._hat = hat;
      g.toss({ s: hat, x0: hp.x, y0: hp.y, x1: ich.x + ich.facing * 470, y1: -66, arc: 260, dur: 1.5, spin: ich.facing * 9.5, bounce: 10, sound: 'pop' });
    }, 'Der Hut fliegt'),
    at(3.4, (g) => { void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.cast.vtgm.setExpression('deadpan'); }),
    at(4.3, (g) => {
      const ich = g.cast.ich;
      const hat = (g as unknown as { _hat: import('pixi.js').Sprite })._hat;
      const end = ich.x + ich.facing * 300;
      const [hx, hy] = ich.rest('hat');
      void g.tween(hat, { x: end + ich.facing * (hx - 14) * ich.scale, y: (hy - 12) * ich.scale, rotation: 0 }, 0.6, 'sineInOut', () => hat.destroy());
    }, 'Hut zurück'),
    at(5.6, (g) => {
      const ich = g.cast.ich;
      ich.x += ich.facing * 300; // TRIP_ADVANCE: take the clip's travel over into the root
      void ich.play('brushOff', { fade: 0 });
      ich.setExpression('embarrassed');
    }),
    at(7.0, (g) => { void g.cast.ich.play('hatAdjust', { fade: 0.15 }); g.cast.ich.setExpression('neutral'); }),
    at(7.4, (g) => g.line('ich', 'Beabsichtigt.', { auto: 0.9 })),
    at(8.9, (g) => g.line('vtgm', 'Of course.', { sub: 'Natürlich.', auto: 0.6 })),
    at(10.2, (g) => g.cast.ich.idle(0.3)),
  ],
};

/* ====================================================================== the ending (teaser) */
export const ENDING: S = {
  id: 'ending', title: 'Ende: „R-3MI wurde ermordet!"', duration: 43,
  setup(g) { resetWorld(g); seatedState(g); g.placeInAisle(g.cast.ich, 360); g.cast.ich.face(-1, true); void g.cam.moveTo(80, -440, 1.05, 0); },
  events: [
    at(0, (g) => { g.audio.sfx('chime'); g.audio.music(null); void g.cam.moveTo(80, -440, 1.05, 1.2); }),
    at(0.8, (g) => void g.dialogue.pa({ who: 'pa', text: 'Meine Damen und Herren, wir dimmen nun das Kabinenlicht. Wir wünschen Ihnen eine angenehme Nachtruhe. Bitte bleiben Sie angeschnallt.', auto: 0.6 })),
    at(7.0, (g) => { const ich = g.cast.ich; void ich.walkTo(SEATS.ich.x + 10); }, 'ICH geht zu 15C'),
    at(8.6, (g) => {
      const ich = g.cast.ich;
      ich.face(-1); ich.root.zIndex = 25;
      void g.tween(ich, { x: SEATS.ich.x, y: SEATS.ich.y }, 0.4);
      void ich.play('sitDown', { fade: 0.1, onEnd: () => void ich.play('sit', { fade: 0.2 }) });
    }),
    at(10.0, (g) => g.line('ich', 'Ein Detektiv schläft nie.', { mood: 'proud', auto: 0.8 })),
    at(12.6, (g) => { const ich = g.cast.ich; ich.setExpression('neutral'); void ich.play('doze', { fade: 0.2, onEnd: () => void ich.play('dozing', { fade: 0.3 }) }); }, 'Hut über die Platte'),
    at(13.2, (g) => { void g.tween(g.cabin, { nightLevel: 0.22 }, 3.2, 'sineInOut'); g.audio.ambience(true, 0.6); }, 'Licht aus'),
    at(16.4, (g) => void g.card('SPÄTER.', '', { ms: 2000 }), 'SPÄTER.'),
    at(17.0, (g) => void g.cam.moveTo(-160, -460, 1.3, 3.5, 'sineInOut')),
    at(21.0, (g) => {
      // a shadow passes in the foreground. Whose? (Not answered in Chapter 0.)
      const sh = g.shadowFigure();
      sh.position.set(-200 * 1.3 + 900, 180);
      void g.tween(sh, { x: -200 * 1.3 - 1000 }, 3.4, 'linear', () => sh.destroy());
    }, 'Ein Schatten'),
    ...[0, 1, 2, 3, 4, 5].map((i) => at<Game>(21.4 + i * 0.48, (g) => g.audio.sfx('step.vtgm', { gain: 0.25 }))),
    at(24.2, (g) => g.audio.sfx('click', { gain: 1.2 }), 'Klick'),
    at(24.8, (g) => void g.cast.r3mi.play('deepSleep', { fade: 0.6 }), 'Das Standby-Licht erlischt'),
    at(28.4, (g) => { g.audio.sfx('scream'); g.line('voice', 'AAAAAAAAH!', { auto: 0.4 }); }, 'Schrei'),
    at(29.4, (g) => {
      g.cabin.lightsOn = 1; g.cabin.nightLevel = 1;
      g.audio.sfx('lightson');
      const { ich, vtgm } = g.cast;
      ich.root.zIndex = 50;
      void g.tween(ich, { y: 0, x: SEATS.ich.x + 60 }, 0.3, 'quadOut');
      void ich.play('shocked', { fade: 0.05 }); ich.setExpression('shocked');
      void vtgm.play('startle', { fade: 0.05 }); vtgm.setExpression('alarmed');
      void vtgm.play('lookBack', { layer: 'face' });
    }, 'Licht an!'),
    at(30.6, (g) => g.line('voice', 'ER IST TOT! R-3MI WURDE *ERMORDET*!', { auto: 1.2 })),
    at(33.6, (g) => {
      const r = g.cast.r3mi;
      const e = r.worldPoint('head', 56, -800);
      g.audio.sfx('sting');
      void g.cam.moveTo(e.x, e.y + 60, 2.6, 1.4, 'expoOut');
      g.cast.vtgm.idle(0.5);
    }, 'Auf das dunkle Auge'),
    at(37.4, (g) => { const ich = g.cast.ich; void g.cam.moveTo(ich.x - 40, -560, 1.7, 1.2, 'sineInOut'); ich.idle(0.3); ich.setExpression('proud'); }),
    at(38.8, (g) => g.line('ich', '… Ein Fall.', { auto: 1.2 }), '„… Ein Fall."'),
    at(41.4, (g) => { g.audio.music('detective'); void g.card('FORTSETZUNG FOLGT', 'Kapitel 1: Tatort Reihe 14', { comic: true, ms: 3200 }); }),
  ],
  tick(g, t) {
    // R-3MI never reacts to any of it
    if (t > 29) g.cast.r3mi.setExpression('off');
  },
};
