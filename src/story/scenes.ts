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
  for (const s of [...g.cabin.stage.children]) if ((s as { label?: string }).label === 'prop') s.destroy();
  g.dialogue.close();
  const { ich, r3mi, vtgm } = g.cast;
  for (const a of [ich, r3mi, vtgm]) { a.reset(); a.root.visible = true; a.scale = a.spec.scale ?? 1; }
  g.placeInAisle(ich, MARK.meetIch); ich.face(-1, true);
  g.placeInAisle(r3mi, MARK.meetR3mi); r3mi.face(-1, true);
  g.placeInAisle(vtgm, MARK.meetVtgm); vtgm.face(1, true);
  g.cam.follow = null;
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
    at(12.2, (g) => { g.cast.ich.setExpression('neutral'); void g.cast.ich.play('hatAdjust', { fade: 0.2 }); }),
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
  void v.play('sitDown', { fade: 0.05 }).then(() => void v.play('sitDangle', { fade: 0.2 }));
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
    at(26.2, (g) => void g.cast.vtgm.play('reclineReach', { fade: 0.15 }).then(() => void g.cast.vtgm.play('sitDangle', { fade: 0.25 })), 'Sie drückt den Lehnenknopf'),
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
    at(64.6, (g) => void g.cast.r3mi.play('sleepSlump', { fade: 0.2 }).then(() => void g.cast.r3mi.play('sleep', { fade: 0.4 })), 'Tiefschlafmodus'),
    at(69.0, (g) => { g.cast.r3mi.setExpression('off'); g.audio.sfx('snore', { gain: 0.6 }); g.cast.vtgm.setExpression('deadpan'); }),
    at(70.6, (g) => { void g.cast.ich.play('chinStroke', { fade: 0.3 }); g.line('ich', 'Interessant.', { auto: 0.8 }); }),
    at(72.4, (g) => { void g.cast.vtgm.play('toCamera', { layer: 'face' }); g.line('vtgm', 'What is?', { sub: 'Was?', auto: 0.6 }); }),
    at(74.0, (g) => g.cast.ich.idle(0.4)),
  ],
};
