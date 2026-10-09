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

## Share results button (zero maintenance)
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
