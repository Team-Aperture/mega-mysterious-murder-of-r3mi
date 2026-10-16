# ICH: three design directions

ICH is new. Before he is final, here are three original directions with clearly different silhouettes.
All three share the same fixed rules:

- The word **ICH**, huge, on a featureless faceplate. No eyes or mouth.
- His light colour is **amber**, the missing middle of the red/green Team_Aperture pair.
- Detective kit: a hat that is slightly wrong, a brass magnifying glass, a notebook (in the prototype the
  notebook exists only as the UI case file, *Fallakte*; none of the three designs draws it yet).
- He must not look like V-TGM (circle) or R-3MI (tall line), so all three are built from rectangles and triangles.
- Nothing is borrowed from an existing detective character: no deerstalker-and-pipe silhouette, no
  trench-coat-and-gadget-arms, no cartoon dog, no hat brim covering the face.

All three are built on **the same skeleton** in this prototype. In the **Animation Lab** they stand side by
side, idling, in *Animationslabor → Aufstellung*; *Clips* shows one at a time (Figur „ICH · A/B/C"), walking
or in any clip. Side by side walking: `?dev=pose&c=ich,ich-b,ich-c&clip=walk&face=-1`. You can also play the
whole chapter with any of them (*Einstellungen → ICH-Entwurf*). Direction A is the default.

| | A · „Das Namensschild" | B · „Der Aktenschrank" | C · „Das Periskop" |
| --- | --- | --- | --- |
| Silhouette | a wide flat sign on top of a flared coat: **T on an A** | one upright **brick** with stubby legs | a square sign on a long neck above a small **cone** |
| Faceplate | wide landscape screen, amber letters on dark glass, ochre bezel | top drawer front, brass label letters | square plate on a telescopic neck |
| Hat | tiny fedora clipped to the plate's top edge | flat cap with ear flaps folded up | wide-brim hat, much too big, rests on the plate corners |
| Body | ochre trench-coat chassis, swinging coat skirt | olive office-steel cabinet with three drawers | dark plum cape over a cone, springy legs |
| Signature gag | the wide head does not fit the aisle: he tilts it to pass, and it hits the overhead bins | he stores evidence in his own drawers, which jam, and he pulls the magnifier out of his chest | the neck extends to snoop over seat backs and gets stuck |
| Comedy strength | posing, struts, falls (long limbs, big coat) | deadpan stiffness, mechanical gags | snooping, surprise, peekaboo |
| Legibility of ICH | **best**: largest plate, wide letters survive 3/4 foreshortening | good, but the plate is part of the body, so bending hides it | good when facing front; the neck tilts the plate |
| Animation cost | medium (coat secondary motion) | low (rigid body, drawers) | high (neck stretch, cape cloth) |
| Risk | the head width needs care in tight framing | can read as "furniture" rather than "detective" | the long neck can read as creepy at night |

## Recommendation: A, „Das Namensschild"

1. **Legibility.** The landscape plate is the largest flat surface of any of the three, so the word stays
   readable on a phone in landscape at the smallest camera zoom the chapter uses (letters ≈ 22–26 CSS px
   tall on a typical landscape phone at zoom 0.85–1; B's ≈ 20–24, C's ≈ 16–20).
2. **Contrast with the canon pair.** A wide rectangle over a triangle is the furthest silhouette from both
   a sphere and a vertical line. In a lineup the three read as three different shapes from across the room.
3. **Body comedy.** The faceless joke needs a body that can act. Long thin limbs, big gloves, big shoes and a
   swinging coat give the most expressive range; B is too rigid, C spends its expressiveness on the neck.
4. **Airplane comedy.** A head that is wider than an airplane aisle is a gag generator for the whole game.
5. **Cost.** Medium. The coat is one spring chain.

B and C are playable through the whole chapter, so the decision can be made on movement, not only on a
drawing. Be aware that they run **A's clips** (with small adapters that fit them to their bodies) and that
**none of the signature gags in the table is implemented yet** for any direction; the in-game comparison
therefore favours A, whose clips they are.
Whichever you choose, the final art for ICH should be drawn by an artist on top of the chosen rig
(see [ANIMATION_PIPELINE.md](ANIMATION_PIPELINE.md)); the current art is a procedural placeholder.
