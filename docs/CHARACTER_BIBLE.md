# Character bible: R-3MI, V-TGM, ICH

This is a working reference for writers, animators and programmers. R-3MI and V-TGM are **established
Team_Aperture characters**: everything marked *canon* comes from earlier projects (see
[REFERENCE_GUIDE.md](REFERENCE_GUIDE.md)). Everything marked *spin-off* is a comedic adaptation for this
game only and must not be fed back into the main series as canon.

The trio's shape and colour language is designed as one system:

| | Shape | Light colour | Height (rig units, 1 m = 400) | Role in a scene |
| --- | --- | --- | --- | --- |
| **V-TGM** | circle | red | ≈ 380 (0.95 m) | the one who notices |
| **ICH** | rectangle on a triangle | amber | ≈ 640 (1.6 m incl. hat) | the one who is sure |
| **R-3MI** | tall vertical line, egg on top | green | ≈ 880 (2.2 m) | the one who suffers |

Red, amber, green: the three of them standing in a row are a traffic light. Nobody in the game ever
mentions it.

---

## R-3MI

### Visual design (canon, adapted)
- Bone-white egg helmet with a centre seam and a graphite side plate; **one** green eye on the front.
- Bone-white chest shield, graphite ribbed waist with navy ribs, green slot light on the lower chest,
  toward the front (in front of the centre seam).
- Graphite limbs, bone-white thigh plates, dark joint discs.
- **Handedness (canon portrait faces left, three-quarter turned toward the viewer):** his **left** arm
  carries the asymmetric details: a big stepped black shoulder disk with a green ring on its end cap,
  and a green-ringed elbow. In the facing-left view that arm is the near one and hangs on the **back**
  side of the body, directly under the tank; the plain right arm hangs at the chest's front edge, half
  hidden. When he faces right the details stay on his left arm (now the far one).
- Green tank backpack, high on his back (top at mid-head height, bottom at the shoulder disk), leaning
  back about 10°; glint on its front side. Exactly **three hoses**: a round hoop from a port on the
  crown to a junction just behind the head, a second hoop from there to the tank-top socket, and a
  bright, fluid-filled green hose from the tank's back-bottom corner that bows out behind his left
  upper arm and plugs into the back of his left elbow.
- Adaptation: proportions pushed slightly lankier (longer shins and forearms) for airplane comedy.
  Rendering is clean cartoon cel shading instead of the portrait's painterly airbrush.

### Personality and dialogue tone
- *Canon*: speaks **German**, cheerful, chatty, optimistic, a bit obsessive about numbers, proud of tiny wins.
  Greets with „Hiii!". Personifies objects („Terminals haben Gefühle. Schlechte meistens.").
- *Spin-off*: he **hates flying**. His optimism keeps trying to start and keeps stalling, like an engine.
  He is tall, the seat is not, and he takes it personally. Under stress his jokes get drier and more
  absurd, never mean. He wants one thing: to sleep through all of this.
- Lines are short, spoken, a little breathless. Exclamation marks are earned, not default.
- Sample: „Das ist kein Sitz. Das ist ein Vorschlag für einen Sitz."

### Typical gestures
- Hunches, ducks, protects his head with one hand (ceilings are his enemy).
- Taps his fingertips together when nervous; counts on his fingers when listing complaints.
- Big open-arm „Hiii!" wave; leans in close when curious (eye fills the frame).
- Points at the floor/window when he means "down there", then regrets looking.

### Movement characteristics
- Long, loping stride, heel-heavy; the head bobs on a slight delay (neck is the spring).
- Leans forward from the hips; his walk "falls" forward and catches itself.
- His arms swing late and wide. Fingers trail.
- In the cabin he never stands at full height: a constant 10–15° stoop with the head cocked.

### Emotional reactions (optic + body)
| Emotion | Eye | Body |
| --- | --- | --- |
| happy | upward arc, glow up | bounce on the toes, arms open |
| curious | wide ring, iris drifts toward target | leans in, head tilts |
| anxious (spin-off) | iris shrinks, rapid micro-saccades, flicker | shoulders up, hands together, knees close |
| annoyed | flat slit | arms crossed, one foot taps |
| panic | ring oversized, shake | full-body flinch, hands to head |
| sleepy / standby | lids close slowly, glow dims to dark, chest light blinks slowly | head sinks, limbs go slack in stages |

### Animation requirements
- Idle (stooped breathing, eye saccades, tank bubbling), walk, talk accent, wave, point, head-bonk,
  flinch, arms-crossed, the full **seat struggle** sequence, fall-asleep (eye power-down), sleeping idle.
- Secondary motion: the three hoses (rope simulation), tank fluid slosh, head lag on the neck.
- Needs authored art eventually for: a front view and a back view, a true profile head, and hand poses.

---

## V-TGM

### Visual design (canon, adapted)
- One sphere for head and body, bone-white with seams and scratches; red slit lamp on top.
- **One** very large red eye in a black bezel; red ring light; white-hot core.
- Dark side hubs with red rings, long ribbed black arms, big hands; short legs with red bellows and
  red-ringed knees; heavy boots. Red tank on the back with a hose arching over the top.
- Adaptation: the sphere is pushed a few percent larger relative to the legs, so squash and stretch
  on the body reads clearly. The eye is never smaller than in the portrait.

### Personality and dialogue tone
- *Canon*: speaks **English** (always shown with a German subtitle), terse, exact, deadpan, observant.
  Corrects people. Speaks German only to annoy R-3MI.
- *Spin-off*: she is the only competent passenger on Flight 303, and ICH is her personal test of patience.
  Her sarcasm escalates in clean steps: correction → one-word answer → eye-roll → facepalm → silence.
  With R-3MI she stays dry but kind; she is the one who says good night.
- Sample: *"It's written on his face. In font size nine hundred."* / „Es steht ihm im Gesicht. In Schriftgröße neunhundert."

### Typical gestures
- The **eye-roll**: the iris travels a full circle around the socket. Her signature.
- The **facepalm**: one huge hand covers most of the sphere.
- Eye narrows to a slit, and holds. The longer the hold, the funnier.
- Arms folded *behind* the sphere (she cannot fold them in front; there is no front to fold over).
- The top lamp flares like a raised eyebrow.
- A small hop to get onto seats and armrests.

### Movement characteristics
- Quick short steps, a waddle with a sideways body roll (the sphere rocks over the hips).
- The sphere lags slightly behind the legs on starts and overshoots on stops.
- Arms swing low and long; hands nearly brush the floor.
- When still, she is **very** still. Stillness is her acting choice.

### Emotional reactions
| Emotion | Eye | Body |
| --- | --- | --- |
| deadpan (default) | calm ring, minimal movement | still, weight centred |
| suspicious | half lid, iris to the side | sphere tilts away |
| exasperated | slit, then eye-roll | sigh: sphere squashes down and slowly re-inflates |
| amused (rare) | slight upward arc, glow up | tiny bounce, then she suppresses it |
| alarmed | ring oversized | sphere stretches up, arms out |
| fond (towards R-3MI only) | soft glow, slow blink | turns fully toward him |

### Animation requirements
- Idle (still, slow eye drift, tank bubbles), waddle walk, talk accent, eye-roll, facepalm, sigh,
  hop up/down, seat-recline gag, look-around-the-seat.
- Secondary motion: the over-the-top hose, tank slosh, arm drag.
- Eye drawn as live vector graphics, projected onto the sphere, so head turns are true rotations.

---

## ICH (new, spin-off only)

### Visual design (recommended direction A, "Das Namensschild"; see [ICH_DESIGN_DIRECTIONS.md](ICH_DESIGN_DIRECTIONS.md))
- Head: a wide landscape **faceplate** (≈ 1.6 : 1) in an ochre/brass bezel with rivets, dark glass, and
  the word **ICH** in huge glowing amber block letters. No eyes, no mouth, nothing else, ever.
- A tiny fedora perched on the top edge of the plate. It is too small for him. He does not know.
- Torso: a trench-coat chassis in ochre plating with lapels, belt and a flared coat skirt that swings.
- Limbs: thin navy tubes with ball joints; **big white cartoon gloves** (his face is his hands);
  large polished brown shoes.
- Props: brass magnifying glass (lives in the coat), a notebook ("Fallakte").

### Personality and dialogue tone
- Takes detective work absolutely seriously; has done almost none of it.
- Confident, pompous, formal German, slightly old-fashioned vocabulary, likes the word „zwingend".
- Draws enormous conclusions from trivia. Delivers them with a dramatic pause and a pose.
- Not a joker: he never knows he's being funny. When a line lands, he takes it as respect.
- Occasionally right by accident, and then talks himself out of it.
- Always refers to himself as ICH, which in German is also just "I". This produces grammar that is both
  correct and absurd: „ICH bin ICH." He finds this perfectly normal.
- Sample: „Der Kaffee bewegt sich nicht. Kein Wackeln. Keine Welle. Daraus folgt zwingend: Dieser Pilot ist ein Genie."

### Typical gestures
- The Pose: weight on one leg, coat flared, magnifier raised, faceplate turned to the camera.
- Raised index finger for „Aha!", followed by a pause in which nothing happens.
- Chin-stroke on a face that has no chin (he strokes the bottom edge of the plate).
- Peering through the magnifier: the lens enlarges **ICH** and fills it.
- Tipping the hat; adjusting the hat after any failure („Beabsichtigt.").
- Nervous: fingers drum on the plate edge, knees knock, the letters flicker like a cheap neon sign.

### Movement characteristics
- Pompous strut: high knee lift, chest out, a held "float" at the top of each step, toes pointed,
  arms swinging stiffly with the magnifier hand leading.
- The faceplate stays level and **turned toward the camera** as much as anatomy allows:
  he walks sideways but performs forwards.
- Sneak mode: tiptoe with exaggerated knee bends (used when stepping over R-3MI's legs).
- Falls are big and long: he windmills, hops, loses the hat, and lands flat. Then gets up with dignity.

### Emotional reactions (all body; the face never changes)
| Emotion | Faceplate | Body |
| --- | --- | --- |
| proud | letters a touch brighter | chest out, chin (plate) up, hands on hips |
| deducing | steady | crouch, magnifier, slow lean, then snap upright |
| nervous | letters flicker | hunch, hands wring, plate tilts down, knees knock |
| offended | steady | rigid, plate tilts back, one finger raised |
| embarrassed | hat pulled down over one corner of the plate | shrinks, shuffles |
| shocked | letters flash once | whole body jolts up, hat pops off, coat flares |

### Animation requirements
- Idle (pompous breathing, fidgets), strut walk, sneak walk, talk accent, the Pose, Aha!, chin-stroke,
  magnifier peek, examine (lean in + magnify), hat tip, nervous loop, shocked, the **overhead-bin avalanche**,
  the **trip over R-3MI's legs**, the dignified recovery, sitting with hat over plate.
- Secondary motion: coat skirt (spring chain), hat (spring, can detach as a free body).
- The letters are drawn as vector shapes, never mirrored, never scaled below legibility, never covered for
  more than a moment (the hat-over-face gag covers one corner, not the word).

---

## Relationship dynamics

- **R-3MI ↔ V-TGM** (*canon*): an old double act. He talks, she edits. She teases him but protects him; he
  complains about her but relies on her. They use designations only, and they never explain their
  relationship to anyone.
- **ICH → R-3MI**: ICH treats R-3MI as a witness, then (later chapters) as a victim. R-3MI is
  polite to ICH and immediately gives him a cheerful „Hiii, ICH!", which ICH files as suspicious.
- **ICH → V-TGM**: ICH thinks she is his assistant. She is not. He keeps giving her tasks; she keeps
  not doing them. Her deadpan is the comic straight line under his theatrics.
- **V-TGM → ICH**: exasperation with a fuse that gets shorter each scene, but also a hint of curiosity,
  because occasionally he is right and she is the only one who notices.

## Things that must NEVER change

**R-3MI**
- One green eye. Tall. Egg helmet. Green tank backpack. Speaks German.
- The ringed shoulder disk, the ringed elbow and the fluid hose belong to his **left** arm, under the
  tank (never mirrored onto the right arm, never on the front edge of the chest).
- Uses only V-TGM's designation. Never cruel.

**V-TGM**
- One red eye. Sphere body. Short. Red tank backpack. Speaks English (with German subtitle).
- Uses only R-3MI's designation. Never stupid, never panicked without reason.

**ICH**
- The word **ICH** on the faceplate, always readable, always the same word, never mirrored.
- No eyes, no mouth, no face, ever; all acting is in the body, hands, hat and light.
- Confidently incompetent, never deliberately funny, never malicious.

**Everyone**
- This is a loving, absurd spin-off. Canon characters stay recognisably themselves; only the situation is
  absurd. No horror, no actual murder, nobody humiliated for real.
- Nobody in the dialogue states that the plane is on the ground (see the spoiler file).
