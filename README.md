# Rainbowed

A Flash-era stickman shooter where every enemy bursts into rainbows. Play it at https://rainbowed.ca

Plain static files, no build step. Cloudflare serves the `public/` folder (see `wrangler.jsonc`), and every push to `main` redeploys it.

## Layout

```
public/
  index.html          page markup; loads the scripts below in order
  style.css
  js/engine/          shared game engine
    core.js           constants, canvas, state, the ARENAS and BOSSES registries
    input.js          keyboard, mouse, touch, secret codes, start and game-over screens
    world.js          physics, spawning, effects, damage, kicks, aiming
    bosses.js         boss loop, spawning, knockouts, cutscene camera
    update.js         the per-frame update
    draw.js           drawing and HUD
  js/arenas/          one file per arena (shelves, name, boss loop)
  js/bosses/          one file per boss
  js/main.js          picks the arena and starts the game
tests/sim.js          headless gameplay tests
tools/bundle.py       bundles everything into one HTML file (previews, offline play)
IDEAS.md              what's next
```

## Adding an arena

Create `public/js/arenas/<name>.js`:

```js
ARENAS['grandmas-house'] = {
  id: 'grandmas-house', number: 2, name: "Grandma's House",
  plats: [{x: 90, y: 305, w: 170}, ...],          // shelves: left edge, top, width
  bossLoop: ['giant', 'dustbunny', 'giant', 'chancla'],
  drawStage() { ... },                            // optional: custom background and furniture
};
```

and add a `<script>` tag for it in `index.html`, after the engine core.

## Adding a boss

Create `public/js/bosses/<name>.js` and register it:

```js
BOSSES.dustbunny = {
  name: 'THE DUST BUNNY', ko: 'DUST BUSTED', pts: 7500, koZoom: 2,
  warning: 'Something is stirring under the couch.',
  spawn(level) { return {x, y, hp, scale: 1, st: 'enter', ...}; },
  update(b, dt, fighting, dx, dy) { ... },
  // optional: draw, drawUnder, zone, damage, aimPoint, intro, koY, explode, afterExplode
};
```

A boss with a `timer` field gets a "SURVIVE 0:45" countdown under its health bar. See `bosses/eraser.js` for a full example.

## Testing

```
node tests/sim.js
```

Runs scripted games against the real files and checks the boss loop, Rainbow Mode, kicks, right-click, wall flips, reloading, the secret codes and the Eraser. Run it before pushing.

For playtesting, add a boss name to the address to start one kill before it: `#giant`, `#sensei`, `#giant2`, `#eraser` on Page One, or `#dustbunny`, `#chancla` for Grandma's House (the link switches arenas). In Grandma's House, `arena.sophyTime('light')` in the browser console makes Sophy go for the ceiling light. Secret codes, typed during a run: `sophy` (no reloading), `loaf` (10 hearts). Runs with a code on don't save a best score.
