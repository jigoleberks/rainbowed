# Ideas

Things to build later. Not started yet.

## Arenas (instead of levels)
There is no winning. Every run ends with "You got rainbowed."
- Pick an arena at the start. Each has its own shelf layout (maybe a center pillar
  to wall-flip off) and its own best score.
- Runs stay endless. Bosses loop: Giant at 25, Sensei at 50, Giant at 75, then the
  arena's own boss at 100, then the loop starts over.
- Each arena's 100-kill boss is deeply unserious and nearly impossible to kill, in the
  spirit of the SkiFree monster. Original designs, not copies. Ideas:
  - The Slow One: an ordinary stickman who strolls at you with 10,000 health. Immortal
    snail energy: you can't really kill him, just keep away forever. Touch = death.
  - La Chancla: tiny, unbothered grandma with more health than the Giant. Lobs
    slippers in arcs like grenades; they burst into rainbow splats on landing.
    Look: shorter than the hero and hunched (curved spine), hair bun, little round
    glasses, triangle stick-figure dress, cardigan lines over the shoulders, fuzzy
    pink slippers (her only color). Throws one, has one bare foot, pulls a new one
    from her cardigan pocket. Slow shuffle, sets down a mug of tea before the fight.
    Big overhand windup with a "!" before each throw.
    She's after the mess, not the hero: her slippers rainbow stickmen too.
    Survive the timer and a TV flickers on; she shuffles back to her armchair. If her
    health hits zero she doesn't get rainbowed, she just sits down: "Fine. Wipe your
    feet next time." Death message: "You got chancla'd."
- Boss loop per arena: the Giant at 25 and 75 in every arena (with Rainbow Mode),
  the arena's own sub-boss at 50, and its joke finale at 100.
  - Arena 1, Page One: Sensei (50), The Eraser (100). Built.
  - Arena 2, Grandma's House: Dust Bunny (50), La Chancla (100), plus Sophy. Built.
  - Arena 3, The Long Hallway: Ink Blob (50), The Slow One (100). The darker arena. Built.
  - Arena 4, The Bear Cave: a huge bear sleeps in the middle the whole time (bouncy belly,
    snore Zs you can stand on, gunfire makes it grumble and drop stalactites). The Cub (50)
    bursts out of it; the Clown Car (100) is every bear that was in there. It never wakes. Built.
  - Arena 5, Grandpa's Farm: barn, hay, tractor, coop, cornfield, Grandpa asleep on the porch,
    and Buster (Grandpa's real border collie): frisbee, zoomies, herding, naps. The Rooster (50)
    crows shockwaves; Grandpa (100) mows the lawn until Grandma rings the dinner bell.
    "Get off my lawn." Built.
  - Arena 6, Uncle's Creepy Cabin (Casey's idea): dark cabin, lightning, glowing-eyed
    stickmen, a shotgun instead of the pistol, the trap door, and SPOOKY TIME (the lamp, the
    deer head and the whole cabin laugh, with real sound). The Hand (50) and the Tree (100). Built.
    Casey's recordings of the laughs are coming to replace the synthesized ones.
  - Arena 7, The Waiting Room (Claude's pick): stickmen take a number and only come when called,
    every kill calls the next; hold music; Doug on the phone puts stickmen on hold. The Printer
    (50, PAPER JAM) and the Clerk (100, DENIED stamps, closes at 5:00). Built.
- The Long Hallway (arena 3), built:
  - Dim hotel hallway in ink: identical numbered doors, runner carpet, flickering
    fluorescent tubes with light cones, darker paper. Shelves: vending machine,
    luggage cart, radiators, overhead pipes.
  - The hallway loops: walk off one side and come back on the other. No walls, so no
    wall flips here; the first arena that changes the rules, not just the scenery.
  - Stickmen come out of the doors (any door can creak open).
  - Rainbow splats glow faintly: the more mess you make, the more you can see.
  - Ink Blob (50) swallows the lights one by one; the hallway goes dark.
  - The Slow One (100) never leaves. No timer: he keeps strolling after you for the
    rest of the run while the loop continues around him. 10,000 health, touch = death.
    Death message idea: "He was always going to get you."
- Dust Bunny: a huge dust ball rolls out from under the couch. Every hit splits it
  into smaller, faster dust bunnies until the floor is a fluffy swarm.
- Ink Blob: spreads instead of splitting. Oozes along the floor leaving ink puddles
  that slow you, drips from the ceiling, swallows the hallway lights and lurks in
  the dark between flickers. Your rainbow splats are the only light.
- Code is split into a shared engine plus one file per arena and boss (see README).
- Start screen with an arena picker and a best score per arena: built.

## Share results button (zero maintenance): built
On the game-over screen, a Share button that copies text (or opens the phone's share
sheet) like: "I got rainbowed by the Sensei at 154 kills on Page One. rainbowed.ca"
No server needed, and every share is a link back to the game.
- Arena idea, The House: shelves are real furniture (bookshelf, kitchen counter, top
  of the fridge), with mugs, plants and books on them and a ceiling light overhead.
  This is Sophy's home arena. La Chancla is the natural 100-kill boss here.
- A better gun hidden somewhere hard to reach in each arena still fits here.
- Difficulty currently stops ramping around 45 kills. Fine for now; revisit if it
  gets too easy or someone crushes a leaderboard.

## Numpad controls (Lode Runner style)
Keep WASD too, since many laptops have no numpad. Read the physical key so it works
with Num Lock on or off.
- 4 / 6: move left / right
- 8: jump (press again in the air to backflip)
- 2: crouch / drop through a shelf
- 5: fire, auto-aimed at the nearest enemy (no mouse in this layout)
- 7 / 9: rising kick up-left / up-right. Good for reaching the Giant's face.
- 1 / 3: low sweep kick left / right that trips enemies

## Sophy (the cat), chaotic neutral
Only appears in The House arena, not every arena.
Sophy is a real cat: a torbie (tortoiseshell tabby), brown tabby stripes with warm
orange patches, dark stripes down her forehead, round face, solid loaf build.
- Drawn as an ink-outlined loaf with her orange patches. The only colored character
  besides the rainbows, so she stands out on the paper.
- Untouchable: bullets and rainbows go around her, enemies leave her alone.
- Now and then "SOPHY TIME" appears in big text and she rolls one of:
  - Nothing. Curls up on a shelf and naps. The most common outcome.
  - Swats the nearest stickman across the arena.
  - Knocks something off a shelf onto a crowd, or knocks the good gun down to you.
  - Very rare: she climbs the ceiling light that's been hanging there all along and
    drags it down on everyone.

## Better guns that change the reload
Started: supply crates parachute in every 15 kills with two guns or the rainbow
grenade launcher (6 shots). More crate contents can go in engine/weapons.js.
The base gun holds 12 shots and pauses to reload. Hidden or hard-to-reach guns on
each level could improve on that: a bigger magazine, a faster reload, or a gun that
barely needs to reload at all. That gives players a reason to go climb for them.

## Other ideas from the first night
- Shared leaderboard so friends can compete for the top score: built (arcade style,
  top 10 per arena, three initials)
- Power-ups dropped by enemies: shotgun, dual pistols, a "prism beam" laser
- Daily challenge: same enemy waves for everyone each day
- Spare boss: the Rainbow Thief (eats floor splats to heal)

## Google Play (maybe)
Wrap the web app as a Trusted Web Activity (PWABuilder or Bubblewrap). Needs a $25
developer account, 12 testers for 14 days, a privacy page and an assetlinks.json on the
site. Rename Sophy for the public build.

## Next arenas (fleshed out, not built yet)

### The Bluenose
On the deck of the Bluenose, the Nova Scotia racing schooner (the one on the dime), out at sea.
- The arena rocks: the deck slowly tilts with the swell, so you slide a little downhill and
  stickmen do too. Now and then a big wave crashes over the rail, shoves everyone across the
  deck and washes some of the rainbow paint off.
- Shelves: the cargo hatch, stacked lobster traps, the boom, the rigging, and the crow's nest
  way up top. The boom swings across the deck every so often: duck or get swept off your feet.
- Stickmen climb over the rails dripping wet, or swing in on ropes from the rigging.
- Sharks leap clean over the ship now and then, in an arc, and snap up anything in the air:
  stickmen, you, a grenade. A fin circling alongside warns you which side.
- Chaos agent, a seagull: steals things (your second gun, a crate) and flies off with them,
  or drops something on a stickman's head. "MINE." Gulls only take, never give... usually.
- The supply crate is a lobster trap on a rope.
- Sub-boss (50), the Lobster: a huge lobster hauls itself up over the rail. Hard shell from
  the front (bullets ping off), soft from behind, so you have to get round it. Scuttles
  sideways, snaps with both claws, and grabs you if you get close. KO: "BUTTERED".
- Finale (100), the Shark: a shark the size of the ship. Unkillable. It circles, then leaps
  across the deck jaws first; sometimes it rams the hull and the whole ship lurches. Survive
  until the lighthouse at Peggy's Cove comes into view: "LAND HO!"
- Death lines: "Man overboard." (the Shark), "You got chummed." (sharks), "Snip snip." (the
  Lobster).

### The Valley (dinosaurs)
A prehistoric valley: ferns, a smoking volcano in the background, a river and tar pits.
- Tar pits slow you down like the hallway's ink, and the volcano spits glowing rocks that
  land as hazards (and burst into rainbows when they hit stickmen).
- Shelves: a fallen log, rocky ledges, a giant fern, and the back of a sleeping Brontosaurus
  that sometimes stands up and wanders a few steps (the shelf moves).
- Stickmen are cavemen with clubs, coming out of the cave and down the ledges.
- Chaos agent, a little dinosaur (tiny, fast, very brave) that charges whatever's nearest,
  stickman or you, and occasionally steals an egg from a nest and runs off with it, starting
  a stampede of whoever wanted the egg.
- A pterodactyl now and then swoops down and carries a stickman off (or you, briefly, then
  drops you somewhere unhelpful).
- Sub-boss (50), the Triceratops: charges across the valley like a bull with a "!" first. Jump
  it or get launched; it hits the far wall and staggers, and that's your window.
- Finale (100), the T. rex: unkillable, enormous, stomping shockwaves, and a roar that knocks
  you back. The joke: its arms are too short. Get right underneath it and it can't reach you;
  it just flails its little arms. Survive until the meteor arrives: a giant rainbow meteor
  streaks in and wipes the whole valley in a rainbow ("EXTINCT"), and the run carries on.
- Death lines: "You got fossilized." (the T. rex), "Trampled." (Triceratops).

### Leonardo's Workshop (Casey's idea)
A Renaissance artist's workshop: parchment walls covered in sepia sketches, easels, a
half-finished painting, a hanging flying machine, notebooks of mirror writing.
- The stickmen are sepia sketches that step off the parchment, and they leave a blank spot
  on the wall where they were drawn. In this arena the rainbows are the only real colour.
- Shelves: the workbench, the easels, a scaffold, and the flying machine hanging from the
  ceiling (it swings when you land on it).
- Running gag, the portrait on the easel: her eyes follow you around the room, and her smile
  changes depending on how you're doing. Now and then she does something (a wink turns a
  stickman back into a sketch and it falls apart).
- Sub-boss (50), the Flying Machine: the hanging ornithopter breaks loose and flaps around the
  workshop, dropping paint pots and swooping at you. KO: "GROUNDED".
- Finale (100), the Vitruvian Man, who (in Casey's words) is trying to kick your ass. He
  steps out of his circle-and-square drawing with four arms and four legs. In his square
  stance he does a four-legged kick flurry; in his circle he cartwheels across the workshop
  like a wheel. Unkillable. Survive until the drawing is finished and he's pulled back onto
  the page: "BACK TO THE DRAWING BOARD."
- Death lines: "Perfectly proportioned." (the Vitruvian Man), "Grounded." (the Flying Machine).
