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
      if (k === 'createLinearGradient') return () => ({addColorStop() {}});
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
    key(code, down = true, key = '') { (winListeners[down ? 'keydown' : 'keyup'] || []).forEach(f => f({code, key, repeat: false, preventDefault() {}})); },
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
  const g = boot('#eraser'); g.start(); g.godMode(); g.run('eraseMe = function () {};'); g.key('KeyJ');
  g.seconds(60, () => {});
  ok(g.saw(/THE ERASER GOT BORED/), 'eraser never left');
});

test('Eraser: first sweep is the floor, and the floor comes up every round', () => {
  for (let run = 0; run < 5; run++) {
    const g = boot('#eraser'); g.start(); g.godMode(); g.run('eraseMe = function () {};'); g.key('KeyJ');
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

let failed = 0;
for (const [pass, name] of results) { console.log((pass ? 'PASS  ' : 'FAIL  ') + name); if (!pass) failed++; }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
