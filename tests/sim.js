// Headless gameplay tests. Run with: node tests/sim.js
// Loads the real game files (in the order index.html lists them) into a fake browser,
// plays scripted runs at 60fps, and checks that the main features still behave.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUBLIC = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const source = scripts.map(src => fs.readFileSync(path.join(PUBLIC, src), 'utf8')).join('\n;\n');

function boot(hash = '') {
  const drawn = [];
  const listeners = {}, winListeners = {};
  const ctx2d = () => new Proxy({}, {
    get: (t, k) => {
      if (k === 'measureText') return s => ({width: String(s).length * 10});
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({addColorStop() {}});
      if (k === 'fillText') return s => drawn.push(String(s));
      return k in t ? t[k] : () => {};
    },
    set: (t, k, v) => (t[k] = v, true),
  });
  const els = {};
  const el = id => els[id] || (els[id] = {
    id, hidden: false, textContent: '', dataset: {},
    addEventListener: (t, f) => (listeners[id + ':' + t] = listeners[id + ':' + t] || []).push(f),
    getContext: ctx2d, getBoundingClientRect: () => ({width: 800, height: 450, left: 0, top: 0}),
    classList: {add() {}, remove() {}}, setPointerCapture() {},
    children: [], appendChild(c) { this.children.push(c); return c; },
  });
  let raf = null, now = 0;
  const sandbox = {
    document: {getElementById: el, createElement: () => el('_c' + Math.random()), querySelectorAll: () => [], activeElement: null},
    matchMedia: () => ({matches: false}),
    localStorage: {getItem: () => null, setItem() {}},
    ResizeObserver: class { observe() {} },
    location: {hash},
    addEventListener: (t, f) => (winListeners[t] = winListeners[t] || []).push(f),
    requestAnimationFrame: f => (raf = f),
    performance: {now: () => now},
    Math, console,
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(source, context, {filename: 'game.js'});
  const g = {
    get: expr => vm.runInContext(expr, context),
    run: code => vm.runInContext(code, context),
    drawn,
    step(n = 1) { for (let i = 0; i < n; i++) { now += 1000 / 60; raf(now); } },
    seconds(s, each) { for (let i = 0; i < s * 60; i++) { now += 1000 / 60; raf(now); if (each) each(i); } },
    start() { (listeners['go:click'] || []).forEach(f => f()); },
    key(code, down = true, key = '', target) { (winListeners[down ? 'keydown' : 'keyup'] || []).forEach(f => f({code, key, target, repeat: false, preventDefault() {}})); },
    tap(code) { this.key(code, true); this.key(code, false); },
    type(word) { for (const c of word) this.key('Key' + c.toUpperCase(), true, c); },
    pointer(type, o) { (listeners['game:' + type] || []).forEach(f => f(Object.assign({pointerType: 'mouse', clientX: 500, clientY: 200, pointerId: 1, preventDefault() {}}, o))); },
    saw: re => drawn.some(s => re.test(s)),
    godMode() { this.run('hurt = function () {};'); },
    el,
    click(id) { (listeners[id + ':click'] || []).forEach(f => f()); },
  };
  return g;
}

const results = [];
function test(name, fn) {
  try { fn(); results.push([true, name]); }
  catch (e) { results.push([false, name + ': ' + e.message]); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }

test('boots to the title screen on Page One', () => {
  const g = boot();
  ok(g.get('state') === 'title', 'state is ' + g.get('state'));
  ok(g.get('arena.id') === 'page-one', 'arena is ' + g.get('arena.id'));
  ok(g.get('PLATS.length') === 3, 'expected 3 shelves');
});

test('start screen lists the arenas, and Arenas goes back to it', () => {
  const g = boot();
  const cards = g.el('arena-list').children;
  ok(cards.length >= 2, 'cards: ' + cards.length);
  ok(cards[0].disabled === false && cards[0].children[1].textContent === 'Page One', 'first card should be a playable Page One');
  ok(cards.some(c => !c.disabled && c.children[1].textContent === "Grandma's House"), "Grandma's House should be playable");
  g.run("pickArena('page-one')");
  ok(g.get('state') === 'play', 'picking an arena did not start a run');
  g.run('showOver()');
  ok(g.el('ov-actions').hidden === false && g.el('arena-list').hidden === true, 'game over should show Again and Arenas');
  g.click('to-arenas');
  ok(g.get('state') === 'title' && g.el('arena-list').hidden === false, 'Arenas did not return to the picker');
});

test('skip links start one kill before the boss', () => {
  for (const [hash, kills, kind] of [['#giant', 24, 'giant'], ['#sensei', 49, 'sensei'], ['#giant2', 74, 'giant'], ['#eraser', 99, 'eraser']]) {
    const g = boot(hash); g.start();
    ok(g.get('kills') === kills, hash + ' kills ' + g.get('kills'));
    ok(g.get('nextBossKind()') === kind, hash + ' next boss ' + g.get('nextBossKind()'));
  }
});

test('full boss loop: Giant, Sensei, Giant, Eraser, then Giant again', () => {
  const g = boot('#giant'); g.start(); g.godMode(); g.run('eraseMe = function () {};'); g.type('sophy'); g.key('KeyJ');
  const order = [];
  g.seconds(400, i => {
    const k = g.get('boss && boss.kind');
    if (k && order[order.length - 1] !== k) order.push(k);
    if (i % 45 === 0) g.tap('KeyW');
  });
  const want = ['giant', 'sensei', 'giant', 'eraser', 'giant'];
  ok(want.every((k, i) => order[i] === k), 'got ' + order.join(','));
});

test('the first Giant throw glows and drops Rainbow Mode', () => {
  const g = boot('#giant'); g.start(); g.godMode(); g.key('KeyJ');
  let glow = false, pickup = false;
  g.seconds(40, () => { if (g.get('enemies.some(e => e.glow)')) glow = true; if (g.get('pickups.length')) pickup = true; });
  ok(glow, 'no glowing stickman'); ok(pickup, 'no rainbow pickup dropped');
});

test('Rainbow Mode: invincible, no gun, touching rainbows stickmen', () => {
  const g = boot(); g.start(); g.step(5);
  g.run('rainbowT = RAINBOW_TIME; hp = 5;');
  g.run("enemies.push({x: player.x + 10, y: player.y, vx:0, vy:0, onGround:true, facing:-1, phase:0, speed:100, drop:0, jumpCd:1});");
  const k0 = g.get('kills');
  g.key('KeyJ'); g.step(10);
  ok(g.get('kills') > k0, 'touch did not rainbow the stickman');
  ok(g.get('hp') === 5, 'lost health in Rainbow Mode');
  ok(g.get('ammo') === 12, 'gun fired in Rainbow Mode');
});

test('kicks launch stickmen into chains', () => {
  const g = boot(); g.start(); g.godMode();
  g.seconds(60, i => { if (i % 20 === 0) g.tap('KeyK'); });
  ok(g.saw(/^KICK!$/), 'no kick landed'); ok(g.saw(/^CHAIN x[2-9]/), 'no chain');
});

test('right click kicks, alone and while holding fire', () => {
  const g = boot(); g.start(); g.step(10);
  g.pointer('pointerdown', {button: 2, buttons: 2}); g.step(2);
  ok(g.get('player.kickT') > 0, 'right click alone did not kick');
  g.pointer('pointerup', {button: 2, buttons: 0}); g.step(40);
  g.pointer('pointerdown', {button: 0, buttons: 1}); g.pointer('pointermove', {button: 2, buttons: 3}); g.step(2);
  ok(g.get('player.kickT') > 0, 'right click while firing did not kick');
});

test('wall flip pushes you away from the wall', () => {
  const g = boot(); g.start(); g.godMode(); g.run('spawn = function () {}; enemies = [];');
  g.key('KeyA'); g.step(130); g.tap('KeyW'); g.step(10); g.tap('KeyW'); g.step(3); g.key('KeyA', false);
  ok(g.get('player.vx') > 250, 'vx ' + g.get('player.vx'));
});

test('the gun reloads after 12 shots', () => {
  const g = boot(); g.start(); g.key('KeyJ'); g.step(100);
  ok(g.saw(/^RELOADING$/), 'never reloaded');
});

test('hidden code box: five taps reveal it; codes and boss names work; typing in it is ignored by the game', () => {
  const g = boot();
  ok(g.el('code-form').hidden === true, 'code box should start hidden');
  for (let i = 0; i < 5; i++) g.click('ov-arena');
  ok(g.el('code-form').hidden === false, 'five taps did not reveal the code box');
  ok(/Sophy mode on/.test(g.get("applyCode('SOPHY')")) && g.get('cheatSophy') === true, 'sophy via the box');
  g.get("applyCode('sophy')");
  ok(g.get('applyCode("banana")') === 'Nothing happened.', 'unknown code');
  g.get("applyCode('chancla')");
  ok(g.get('state') === 'play' && g.get('arena.id') === 'grandmas-house' && g.get('kills') === 99, 'chancla code: ' + g.get('arena.id') + ' ' + g.get('kills'));
  ok(g.el('code-form').hidden === true, 'code box should hide once a run starts');
  const h = boot(); h.start();
  h.key('KeyS', true, 's', {tagName: 'INPUT'});
  ok(h.get('keys.down') !== true, 'typing in the code box moved the player');
});

test('game over shows time survived and accuracy', () => {
  const g = boot(); g.start(); g.key('KeyJ');
  g.seconds(20, () => {});
  const fired = g.get('shotsFired'), hit = g.get('shotsHit');
  ok(fired > 50 && hit > 0 && hit <= fired, 'fired ' + fired + ' hit ' + hit);
  ok(Math.abs(g.get('runTime') - 20) < 0.5, 'runTime ' + g.get('runTime'));
  const stats = g.get('runStats()');
  ok(stats[0][1] === '0:20' && /^\d+%$/.test(stats[1][1]), JSON.stringify(stats));
  g.run('showOver()');
  ok(g.el('ov-stats').hidden === false && g.el('ov-stats').children.length === 3, 'stats not shown on game over');
});

test('sophy code: bottomless magazine and no saved score', () => {
  const g = boot(); g.start(); g.type('sophy'); g.key('KeyJ'); g.step(240);
  ok(g.get('ammo') === 12 && g.get('reloadT') === 0, 'ammo ' + g.get('ammo'));
  ok(g.get('runCheated') === true, 'run not marked as cheated');
});

test('loaf code: 10 hearts, and the Eraser costs 5 instead of the run', () => {
  const g = boot('#eraser'); g.start(); g.type('loaf');
  ok(g.get('hp') === 10, 'hp ' + g.get('hp'));
  g.godMode(); g.key('KeyJ');
  let saved = false;
  g.seconds(60, () => { if (g.get('hp') === 5 && g.get('state') === 'play') saved = true; });
  ok(saved, 'the Eraser touch did not cost exactly 5 hearts');
});

test('Eraser: survive 45 seconds and it gets bored', () => {
  const g = boot('#eraser'); g.start(); g.godMode(); g.run('eraseMe = function () {}; dropCrate = function () {};'); g.key('KeyJ');
  g.seconds(60, () => {});
  ok(g.saw(/THE ERASER GOT BORED/), 'eraser never left');
});

test('Eraser: first sweep is the floor, and the floor comes up every round', () => {
  for (let run = 0; run < 5; run++) {
    const g = boot('#eraser'); g.start(); g.godMode(); g.run('eraseMe = function () {}; dropCrate = function () {};'); g.key('KeyJ');
    const rows = [];
    g.seconds(60, () => { const r = g.get("boss && boss.kind === 'eraser' && boss.st === 'sweep' ? boss.row : null"); if (r !== null && rows[rows.length - 1] !== r) rows.push(r); });
    ok(rows[0] === 400, 'first sweep row ' + rows[0]);
    for (let k = 0; k + 4 <= rows.length; k++) ok(rows.slice(k, k + 4).includes(400), 'no floor sweep in ' + rows.slice(k, k + 4));
  }
});

test('Eraser: touching it ends the run with its own message', () => {
  const g = boot('#eraser'); g.start(); g.godMode(); g.key('KeyJ');
  g.seconds(60, () => {});
  ok(g.get('deathTitle') === 'You got erased.', 'deathTitle ' + g.get('deathTitle'));
});

/* ---------- Grandma's House ---------- */

test("Grandma's House: picking it loads its furniture, Sophy and the boss loop", () => {
  const g = boot(); g.run("pickArena('grandmas-house')");
  ok(g.get('state') === 'play', 'did not start');
  ok(g.get('PLATS.length') === 5, 'expected 5 pieces of furniture, got ' + g.get('PLATS.length'));
  ok(g.get("arena.bossLoop.join()") === 'giant,dustbunny,giant,chancla', 'boss loop ' + g.get('arena.bossLoop.join()'));
  ok(g.get('props.some(p => p.front)'), 'Sophy is missing');
  g.seconds(20, () => {});
  ok(g.get('enemies.length') > 0, 'no stickmen came in');
});

test("Grandma's House: skip links switch arenas", () => {
  const g = boot('#chancla'); g.start();
  ok(g.get('arena.id') === 'grandmas-house' && g.get('kills') === 99, 'arena ' + g.get('arena.id') + ' kills ' + g.get('kills'));
  const h = boot('#dustbunny'); h.start();
  ok(h.get('arena.id') === 'grandmas-house' && h.get('kills') === 49, 'dustbunny link');
});

test("Grandma's House: full boss loop, Giant, Dust Bunny, Giant, La Chancla, Giant", () => {
  const g = boot('#giant'); g.run("pickArena('grandmas-house')"); g.godMode(); g.type('sophy'); g.key('KeyJ');
  const order = [];
  g.seconds(420, i => {
    const k = g.get('boss && boss.kind');
    if (k && order[order.length - 1] !== k) order.push(k);
    if (i % 45 === 0) g.tap('KeyW');
  });
  const want = ['giant', 'dustbunny', 'giant', 'chancla', 'giant'];
  ok(want.every((k, i) => order[i] === k), 'got ' + order.join(','));
});

test('Dust Bunny splits into smaller bunnies and the swarm can be cleared', () => {
  const g = boot('#dustbunny'); g.start(); g.godMode(); g.type('sophy'); g.key('KeyJ');
  let most = 0, split = false;
  g.seconds(90, () => { const n = g.get("boss && boss.kind === 'dustbunny' ? boss.bunnies.length : 0"); most = Math.max(most, n); if (g.saw(/^SPLIT!$/)) split = true; });
  ok(split && most >= 3, 'max bunnies at once ' + most);
  ok(g.saw(/^DUST BUSTED$/), 'never cleared the swarm');
});

test("La Chancla: survive and her show comes on", () => {
  const g = boot('#chancla'); g.start(); g.godMode(); g.key('KeyJ');
  g.seconds(70, () => {});
  ok(g.saw(/^HER SHOW CAME ON$/), 'show never came on');
  ok(g.get('arena.tvT') > 0 || g.saw(/^HER SHOW CAME ON$/), 'tv');
});

test("La Chancla: her slippers rainbow stickmen, and can chancla you", () => {
  const g = boot('#chancla'); g.start();
  g.seconds(3, () => {});
  // no furniture, so nothing can shelter the player from the slippers
  g.run('enemies = []; kills = 100; hp = 1; invuln = 0; PLATS = [];');
  for (let i = 0; i < 40 * 60 && g.get('state') === 'play'; i++) { g.run('enemies = []'); g.step(1); }
  ok(g.get('deathTitle') === "You got chancla'd.", 'death title ' + g.get('deathTitle'));
  const h = boot('#chancla'); h.start(); h.godMode();
  h.run('kills = 100;');
  let k0 = null;
  for (let i = 0; i < 20 * 60; i++) {
    h.step(1);
    // when a slipper is in the air, put a stickman right where it will land
    if (k0 === null && h.get('boss && boss.slippers && boss.slippers.length > 0')) {
      k0 = h.get('kills');
      h.run("{ const s = boss.slippers[0]; enemies.push({x: s.tx + 20, y: s.ty, vx:0, vy:0, onGround:true, facing:-1, phase:0, speed:0, drop:0, jumpCd:9}); }");
    }
  }
  ok(k0 !== null, 'no slipper thrown');
  ok(h.get('kills') > k0, 'slippers never rainbowed a stickman');
});

test('La Chancla: knocking her to zero makes her sit down, not explode', () => {
  const g = boot('#chancla'); g.start(); g.godMode(); g.key('KeyJ');
  g.seconds(6, () => {});
  g.run('if (boss) { boss.hp = 1; hitBoss(boss, boss.x, boss.y - 30, 1, 0, 1); }');
  g.seconds(4, () => {});
  ok(g.saw(/^FINE\.$/), 'no FINE. banner');
  ok(g.get('props.some(p => p.sitting !== undefined)'), 'grandma did not retire to the couch');
});

test('Sophy brings a second gun: double fire rate, 24 rounds, dropped when hit', () => {
  const g = boot(); g.run("pickArena('grandmas-house')");
  g.run('spawn = function () {}; enemies = [];');
  g.seconds(2, () => {});
  g.run("banner = null; arena.sophyTime('gift')");
  let gun = false;
  g.seconds(5, () => { if (g.get("pickups.some(k => k.kind === 'gun')")) gun = true; });
  ok(gun, 'Sophy never dropped a gun');
  g.run("{ const k = pickups.find(k => k.kind === 'gun'); if (k) { player.x = k.x; player.y = G; } }");
  g.seconds(2, () => {});
  ok(g.get('dual') === true && g.get('ammo') === 24, 'dual ' + g.get('dual') + ' ammo ' + g.get('ammo'));
  const before = g.get('bullets.length'); g.key('KeyJ'); g.step(30); g.key('KeyJ', false);
  ok(g.get('24 - ammo') >= 8, 'fired only ' + g.get('24 - ammo') + ' shots in half a second');
  g.run('invuln = 0; hurt({x: player.x + 10});');
  ok(g.get('dual') === false && g.get('ammo') <= 12, 'still dual after getting hit');
});

test("Sophy: every kind of SOPHY TIME works, including the chandelier", () => {
  const g = boot(); g.run("pickArena('grandmas-house')"); g.godMode();
  g.seconds(3, () => {});
  for (const kind of ['nap', 'knock', 'swat']) { g.run("banner = null; arena.sophyTime('" + kind + "')"); g.seconds(4, () => {}); }
  ok(g.saw(/^SOPHY TIME$/), 'no SOPHY TIME');
  ok(g.saw(/^CRASH!$/), 'knock never crashed anything');
  for (let i = 0; i < 5; i++) g.run("enemies.push({x: 470 + " + i * 12 + ", y: G, vx:0, vy:0, onGround:true, facing:-1, phase:0, speed:0, drop:0, jumpCd:9})");
  const k0 = g.get('kills');
  g.run("banner = null; arena.sophyTime('light')");
  g.seconds(8, () => {});
  ok(g.saw(/^CHANDELIERED/), 'chandelier never fell');
  ok(g.get('kills') > k0, 'chandelier hit nobody');
});

/* ---------- The Long Hallway ---------- */

test('Long Hallway: loads, loops at the edges, no wall flips, stickmen come out of doors', () => {
  const g = boot(); g.run("pickArena('long-hallway')"); g.godMode();
  ok(g.get('arena.wrap') === true && g.get("arena.bossLoop.join()") === 'giant,inkblob,giant,slowone', 'arena setup');
  g.run('player.x = 790; player.vx = 300;'); g.step(5);
  ok(g.get('player.x') < 100, 'walking off the right edge should come back on the left, x=' + g.get('player.x'));
  g.run('player.x = 5; player.y = 300; player.vy = 0; player.onGround = false; player.wallT = 0;'); g.step(1);
  ok(!(g.get('player.wallT') > 0), 'no wall flips in a looping arena');
  let opened = false;
  g.seconds(12, () => { if (g.get('arena.doors.some(d => d.open > 0)')) opened = true; });
  ok(opened && g.get('enemies.length') > 0, 'no door opened');
});

test('Long Hallway: rainbow splats glow, and bullets loop around too', () => {
  const g = boot(); g.run("pickArena('long-hallway')"); g.godMode();
  g.run('spawn = function () {}; enemies = [];');
  g.run('bullets.push({x: 795, y: 300, vx: 1150, vy: 0, life: 0.8})'); g.step(2);
  ok(g.get('bullets.length') === 1 && g.get('bullets[0].x') < 100, 'bullet should wrap, not vanish');
  let calls = 0; g.run('const _o = arena.onSplat; arena.onSplat = function (...a) { globalThis.__glow = (globalThis.__glow || 0) + 1; return _o.apply(this, a); }');
  g.run("burst(400, 300, 0, -100, 40)"); g.seconds(2, () => {});
  ok(g.get('globalThis.__glow') > 5, 'splats did not glow');
});

test('Ink Blob: swallows lights, leaves slowing puddles, splits nothing, and the lights come back on', () => {
  const g = boot('#inkblob'); g.start(); g.godMode(); g.type('sophy');
  ok(g.get('arena.id') === 'long-hallway', 'inkblob link should switch to the hallway');
  g.run('kills = 50;');
  let dark = 0, puddle = false;
  g.seconds(14, () => {
    dark = Math.max(dark, g.get('arena.lights.filter(l => l.dead).length'));
    if (g.get('props.some(p => p.slowAt)')) puddle = true;
  });
  ok(g.get('boss && boss.kind') === 'inkblob', 'no ink blob');
  ok(dark >= 1, 'never swallowed a light');
  ok(puddle, 'no ink puddles');
  g.run('{ const pd = props.find(p => p.slowAt); player.x = pd.x; player.y = pd.y; }');
  ok(g.get('props.filter(p => p.slowAt).some(p => p.slowAt(player.x, player.y) < 1)'), 'puddle does not slow you');
  g.key('KeyJ'); g.seconds(60, () => {});
  ok(g.saw(/^LIGHTS BACK ON$/), 'never beat the blob');
  ok(g.get('arena.lights.every(l => !l.dead)'), 'lights did not come back on');
});

test('The Slow One: steps out of a door, stays forever while the loop carries on, and touching him ends the run', () => {
  const g = boot('#slowone'); g.start(); g.godMode(); g.run('slowOneTouch = function () {};'); g.type('sophy'); g.key('KeyJ');
  g.run('kills = 100;');
  g.seconds(8, () => {});
  ok(g.get('props.filter(p => p.slowOne).length') === 1, 'he should be out and walking');
  ok(g.get('boss') === null && g.get('nextBossAt') === 125, 'boss slot should free up, next boss at 125');
  const h0 = g.get('props.find(p => p.slowOne).health');
  g.seconds(5, () => {});
  ok(g.get('props.find(p => p.slowOne).health') < h0, 'shooting him does nothing');
  g.run('kills = 125;'); g.seconds(6, () => {});
  ok(g.get('boss && boss.kind') === 'giant' && g.get('props.some(p => p.slowOne)'), 'the Giant should come while he is still here');
  // touching him: no god mode for this part
  const t = boot('#slowone'); t.start(); t.run('kills = 100; spawn = function () {}; enemies = [];');
  t.seconds(5, () => {});
  t.run('{ const s = props.find(p => p.slowOne); player.x = s.x; player.y = s.y; invuln = 0; }'); t.step(2);
  ok(t.get('deathTitle') === 'He was always going to get you.', 'deathTitle ' + t.get('deathTitle'));
});

test('The Slow One: loaf costs 5 hearts instead of the run', () => {
  const g = boot('#slowone'); g.start(); g.type('loaf'); g.run('kills = 100; spawn = function () {}; enemies = [];');
  g.seconds(5, () => {});
  g.run('{ const s = props.find(p => p.slowOne); player.x = s.x; player.y = s.y; invuln = 0; }'); g.step(2);
  ok(g.get('state') === 'play' && g.get('hp') === 5, 'hp ' + g.get('hp') + ' state ' + g.get('state'));
});

test('a supply crate parachutes in every 15 kills and can hold two guns', () => {
  const g = boot(); g.start(); g.godMode(); g.run('spawn = function () {}; PLATS = []; kills = 15;');
  g.step(2);
  ok(g.get("pickups.some(k => k.kind === 'crate' && k.chute)"), 'no crate falling');
  ok(g.get('nextCrateAt') === 30, 'nextCrateAt ' + g.get('nextCrateAt'));
  g.seconds(7, () => {});
  ok(g.get("pickups.some(k => k.kind === 'crate' && !k.chute && k.y === G - 10)"), 'crate should land on the floor');
  g.run("{ const k = pickups.find(k => k.kind === 'crate'); k.what = 'gun'; player.x = k.x; player.y = G; }"); g.step(2);
  ok(g.get('dual') === true && g.get('pickups.length') === 0, 'crate should give two guns');
});

test('the rainbow launcher: 6 grenades that rainbow a crowd, then back to the pistol', () => {
  const g = boot(); g.start(); g.godMode(); g.run('spawn = function () {}; PLATS = []; kills = 15;');
  g.step(2);
  g.run("{ const k = pickups.find(k => k.kind === 'crate'); k.what = 'launcher'; k.chute = false; k.y = G - 10; player.x = k.x; player.y = G; }"); g.step(2);
  ok(g.get('grenades') === 6, 'grenades ' + g.get('grenades'));
  g.run(`enemies = []; player.x = 200; player.facing = 1;
    for (const x of [330, 345, 360]) enemies.push({x, y: G, vx: 0, vy: 0, onGround: true, facing: -1, phase: 0, speed: 0, drop: 0, jumpCd: 9});`);
  const k0 = g.get('kills');
  g.run('fireGrenade(0);');
  g.seconds(1, () => {});
  ok(g.get('kills') - k0 === 3, 'one grenade should rainbow all three, got ' + (g.get('kills') - k0));
  ok(g.get('grenades') === 5 && g.get('ammo') === 12, 'pistol ammo should be untouched');
  g.run('for (let i = 0; i < 5; i++) fireGrenade(0);'); g.seconds(2, () => {});
  ok(g.get('grenades') === 0 && g.get('nades.length') === 0, 'should be out of grenades');
});

test('Rainbow Time stacks during a big combo instead of restarting', () => {
  const g = boot(); g.start(); g.godMode(); g.run('spawn = function () {}; PLATS = []; dropCrate = function () {};');
  const mk = "enemies.push({x: 600, y: G, vx: 0, vy: 0, onGround: true, facing: -1, phase: 0, speed: 0, drop: 0, jumpCd: 9}); kill(enemies[enemies.length - 1], 1, 0, false);";
  g.run(mk + mk + mk);
  ok(Math.abs(g.get('slow') - 1) < 0.01, 'first combo starts it: ' + g.get('slow'));
  g.step(20);
  g.run(mk + mk + mk);
  ok(g.get('slow') > 1.5, 'second combo should add on: ' + g.get('slow'));
  ok(g.get("texts.filter(t => t.s === 'RAINBOW TIME').length") <= 1, 'only one RAINBOW TIME banner');
  g.run('for (let i = 0; i < 30; i++) { ' + mk + ' }');
  ok(g.get('slow') <= 4, 'capped at 4s: ' + g.get('slow'));
});

let failed = 0;
for (const [pass, name] of results) { console.log((pass ? 'PASS  ' : 'FAIL  ') + name); if (!pass) failed++; }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
