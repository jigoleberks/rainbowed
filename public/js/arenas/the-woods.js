/* Arena 8: The Woods. A clearing at night around a big bonfire, dark pines behind it, a tent and
   a log pile. The woods are full of the Trapper's booby traps, and the stickmen keep walking
   into them. A trap kill doesn't count for you ("THE WOODS GOT ONE"): you're racing the traps
   for your own score. The sign keeps count.
   The traps get you too:
   - the snare: yanks a stickman up a tree by the ankle. Shoot him before the rope snaps.
   - the leaf pit: looks like the floor until something steps on it.
   - the net: drops on a crowd and bundles them up, then gets hauled back into the tree.
   - the tripwire: lets the log go, tips a bucket of pinecones, or rattles the tin cans
     (which brings more stickmen running).
   - the swinging log: shoot its rope to let it go yourself, and whatever it hits counts as yours.
   - the bonfire: stickmen who wander in run around on fire and set the others alight.
   The Trapper (50) and the Wolf in a Backpack (100) live in bosses/trapper.js and bosses/wolf.js. */

(() => {
  const FIRE = {x: 410, hw: 22};
  const PIT = {x0: 206, x1: 262};
  const SNARE = {x: 140, top: 200, rope: 44};          // hangs from the left tree's branch
  const NET = {x: 692, y: 178, hw: 56};                // bundled up under the right tree's branch
  const WIRE = {x: 476};
  const LOG = {px: 410, py: -20, len: 360, rest: -1.12, tie: {x: 34, y: 150}};
  const TENT = {x0: 528, x1: 616, y: 322};

  const st = {woods: 0};
  let cones = [], embers = [], stars = [];

  const box = (x, y, w, h, fill, lw = 3) => {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  };
  const shape = (pts, fill, lw = 3) => {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const free = e => !e.dead && !e.launched && !e.thrown && !e.snared && !e.netted && !e.burn;
  const onFloor = e => e.onGround && e.y >= G - 1;
  const playerFree = () => state === 'play' && !player.dead;

  // the Trapper, off in the trees, every time one of his traps goes off
  const GRUMBLES = {
    snare: ['That was a GOOD snare!', 'Do you know how hard it is to tie those?', 'My SNARE!'],
    pit: ['Do you know how long that pit took?!', 'I dug that with a SPOON.', 'Three days. THREE DAYS.'],
    net: ["Those nets aren't free!", 'That net was my GRANDFATHER\'S!', 'Untangle that yourself.'],
    log: ['That log took all morning!', 'Do you know how heavy that is?!', 'Somebody has to tie that back up.'],
    wire: ['Watch where you step!', 'That wire was for a WOLF!', 'Oh, come ON.'],
    trap: ['That was a brand new trap!', 'Those cost money!', 'Stop stepping on my traps!'],
  };
  function sprung(kind, x) {
    if (typeof sfx !== 'undefined' && sfx.snap) sfx.snap();
    const def = boss && !boss.dead && BOSSES[boss.kind];
    if (def && def.grumble) { def.grumble(boss, pick(GRUMBLES[kind] || GRUMBLES.trap)); return; }
    // the rest of the time he's off in the trees somewhere, and you can hear him
    if (!boss && Math.random() < 0.3) {
      const side = x < W / 2 ? 1 : -1;
      texts.push({x: side > 0 ? W - 150 : 150, y: 110, s: pick(GRUMBLES[kind] || GRUMBLES.trap), life: 1.6, big: false});
    }
  }

  // a kill the woods get, not you: no points, no combo, and the sign goes up by one
  function woodsGot(e, dvx = 0, dvy = -300, s = 'THE WOODS GOT ONE') {
    if (e.dead) return;
    e.dead = true; e.snared = false; e.netted = false; e.burn = 0;
    st.woods++;
    if (e.glow) {
      pickups.push({x: e.x, y: e.y - 30, vy: -320, life: 9});
      texts.push({x: e.x, y: e.y - 110, s: 'GRAB IT!', life: 1, big: false});
    }
    burst(e.x, e.y - 44, dvx, dvy, 50);
    limbs(e, dvx, dvy);
    texts.push({x: e.x, y: e.y - 92, s, life: 0.9, big: false});
  }
  // the traps hurt you too
  function trapHurt(from, line = 'The woods got you.') {
    if (!playerFree() || invuln > 0 || rainbowT > 0) return false;
    if (hp <= 1) deathTitle = line;
    hurt(from);
    return true;
  }

  // ---------- the swinging log ----------
  const logPos = (a = st.log.a) => ({x: LOG.px + Math.sin(a) * LOG.len, y: LOG.py + Math.cos(a) * LOG.len});
  function releaseLog(mine) {
    const L = st.log;
    if (L.st !== 'tied') return false;
    L.st = 'swing'; L.va = 0; L.t = 6.5; L.mine = mine; L.hit = new Set();
    texts.push({x: 90, y: 120, s: mine ? 'TIMBER!' : 'LOOK OUT!', life: 1, big: false});
    sprung('log', 90);
    return true;
  }
  // the rope it's tied off with is a target
  const logRope = {
    target: true,
    zone(x, y, pad) {
      if (st.log.st !== 'tied') return 0;
      const p = logPos();
      return x > LOG.tie.x - 8 - pad && x < p.x + 6 + pad && y > Math.min(LOG.tie.y, p.y) - 14 - pad && y < Math.max(LOG.tie.y, p.y) + 14 + pad ? 1 : 0;
    },
    hit(z, src, x, y) { inkPuff(x, y, 6); releaseLog(true); },
  };
  function updateLog(dt) {
    const L = st.log;
    if (L.st === 'swing') {
      L.va += -(GRAV / LOG.len) * Math.sin(L.a) * dt; L.va *= 1 - dt * 0.08; L.a += L.va * dt;
      L.t -= dt;
      const p = logPos(), moving = Math.abs(L.va) > 0.6;
      if (moving) {
        const dir = Math.sign(L.va) || 1;
        for (const e of enemies) {
          if (e.dead || L.hit.has(e)) continue;
          if (Math.abs(e.x - p.x) < 44 && Math.abs(e.y - 40 - p.y) < 50) {
            L.hit.add(e);
            if (L.mine) { kill(e, dir * 500, -300, false); texts.push({x: e.x, y: e.y - 110, s: 'LOGGED', life: 0.8, big: false}); }
            else { e.snared = false; e.netted = false; woodsGot(e, dir * 500, -300); }
          }
        }
        if (playerFree() && Math.abs(player.x - p.x) < 40 && Math.abs(player.y - 40 - p.y) < 46 && trapHurt({x: p.x - dir * 30}, L.mine ? 'You walked into that one.' : 'The woods got you.')) player.vx = dir * 520;
      }
      if (L.t <= 0) { L.st = 'haul'; }
    } else if (L.st === 'haul') {
      // somebody up there hauls it back and ties it off again
      L.va = 0; L.a += (LOG.rest - L.a) * Math.min(1, dt * 1.5);
      if (Math.abs(L.a - LOG.rest) < 0.01) { L.a = LOG.rest; L.st = 'tied'; }
    }
  }

  // ---------- the other traps ----------
  function snareGrab(e) {
    const S = st.snare;
    S.st = 'up'; S.who = e; S.t = 0; e.snared = true; e.snT = 4.5; e.vx = 0; e.spin = Math.PI; e.flipSign = 1;
    texts.push({x: SNARE.x, y: SNARE.top - 10, s: 'SNARED!', life: 0.8, big: false});
    sprung('snare', SNARE.x);
  }
  function openPit(x) {
    st.pit.st = 'open'; st.pit.t = 4;
    for (let i = 0; i < 14; i++) parts.push({x: rand(PIT.x0, PIT.x1), y: G - 2, vx: rand(-120, 120), vy: -rand(120, 320), h: 0, r: rand(1.5, 3), life: 0.9, spark: true, ink: true, col: pick(['#b5652a', '#d9902f', '#8a5a2b'])});
    sprung('pit', x);
  }
  function dropNet() {
    const N = st.net;
    if (N.st !== 'up') return;
    N.st = 'fall'; N.y = NET.y; N.vy = 0;
    sprung('net', NET.x);
  }
  function tripWire(by) {
    const T = st.wire;
    T.st = 'reset'; T.t = 6;
    texts.push({x: WIRE.x, y: G - 60, s: 'twang', life: 0.6, big: false});
    // what does it set off this time?
    const r = Math.random();
    if (st.log.st === 'tied' && r < 0.4) { releaseLog(false); return; }
    if (r < 0.7 || boss) {
      // a bucket of pinecones, tipped out of the tree
      texts.push({x: WIRE.x, y: 120, s: 'PINECONES', life: 1, big: false});
      for (let i = 0; i < 9; i++) cones.push({x: WIRE.x + rand(-90, 90), y: rand(-60, 0), vy: rand(0, 200), rot: rand(0, 6), vr: rand(-10, 10)});
      sprung('wire', WIRE.x);
    } else {
      // the tin-can alarm: everyone in the woods heard that
      texts.push({x: WIRE.x, y: 140, s: 'CLANK CLANK CLANK', life: 1.2, big: false});
      shake = Math.max(shake, 5);
      for (let i = 0; i < 3; i++) if (enemies.length < 13) spawn();
      sprung('wire', WIRE.x);
    }
  }

  function update(dt) {
    const fighting = state === 'play';
    // embers off the bonfire
    if (Math.random() < dt * 14) embers.push({x: FIRE.x + rand(-14, 14), y: G - 30, vx: rand(-20, 20), vy: -rand(40, 110), life: rand(0.8, 1.8)});
    for (const m of embers) { m.life -= dt; m.x += m.vx * dt + Math.sin(clock * 3 + m.y * 0.05) * 0.4; m.y += m.vy * dt; }
    embers = embers.filter(m => m.life > 0);

    updateLog(dt);

    // the snare
    const S = st.snare;
    if (S.st === 'up') {
      S.t += dt;
      if (!S.who || S.who.dead) { S.st = 'reset'; S.t = 6; S.who = null; }
    } else if (S.st === 'reset') { S.t -= dt; if (S.t <= 0) S.st = 'set'; }
    else if (S.st === 'set') {
      const e = enemies.find(e => free(e) && onFloor(e) && Math.abs(e.x - SNARE.x) < 9);
      if (e) snareGrab(e);
      else if (playerFree() && player.onGround && player.y >= G - 1 && Math.abs(player.x - SNARE.x) < 9) {
        S.st = 'reset'; S.t = 6;
        texts.push({x: SNARE.x, y: SNARE.top - 10, s: 'SNARED!', life: 0.8, big: false});
        sprung('snare', SNARE.x);
        if (trapHurt({x: SNARE.x})) { player.vy = -900; player.vx = 0; }
      }
    }
    // the pit
    const P = st.pit;
    // open for a few seconds, then filled in, and a while later dug and covered again
    if (P.st === 'open') { P.t -= dt; if (P.t <= 0) { P.st = 'filled'; P.t = 12; } }
    else if (P.st === 'filled') { P.t -= dt; if (P.t <= 0) P.st = 'covered'; }
    const inPit = x => x > PIT.x0 + 4 && x < PIT.x1 - 4;
    if (P.st !== 'filled') for (const e of enemies) if (free(e) && onFloor(e) && inPit(e.x)) {
      if (P.st === 'covered') openPit(e.x);
      woodsGot(e, 0, -200, pick(['THE WOODS GOT ONE', 'AAAAaaaa...']));
    }
    if (P.st !== 'filled' && playerFree() && player.onGround && player.y >= G - 1 && inPit(player.x)) {
      if (P.st === 'covered') openPit(player.x);
      if (trapHurt({x: player.x})) { player.vy = -700; player.vx = (player.x < (PIT.x0 + PIT.x1) / 2 ? -1 : 1) * 260; }
    }
    // the net
    const N = st.net;
    if (N.st === 'up') {
      const under = x => Math.abs(x - NET.x) < NET.hw - 6;
      const crowd = enemies.filter(e => free(e) && onFloor(e) && under(e.x)).length;
      N.wait = under(player.x) && player.y >= G - 1 && playerFree() ? N.wait + dt : 0;
      if (crowd >= 2 || (crowd >= 1 && Math.random() < dt * 0.5) || N.wait > 0.35) dropNet();
    } else if (N.st === 'fall') {
      N.vy += GRAV * dt; N.y += N.vy * dt;
      if (N.y >= G - 4) {
        N.y = G - 4; N.st = 'down'; N.t = 4; dust(NET.x, G, 14, 40);
        for (const e of enemies) if (free(e) && e.y > G - 90 && Math.abs(e.x - NET.x) < NET.hw) { e.netted = true; e.vx = 0; e.pose = 'crouch'; }
        if (playerFree() && player.y > G - 90 && Math.abs(player.x - NET.x) < NET.hw && stun({x: NET.x}, 1.1)) texts.push({x: player.x, y: player.y - 110, s: 'NETTED', life: 0.8, big: false});
      }
    } else if (N.st === 'down') {
      N.t -= dt;
      if (N.t <= 0) {
        // hauled back up into the tree, with whoever's still in it
        for (const e of enemies) if (e.netted && !e.dead) woodsGot(e, 0, -400, 'HAULED OFF');
        N.st = 'haul';
      }
    } else if (N.st === 'haul') {
      N.y -= 420 * dt;
      if (N.y <= NET.y) { N.y = NET.y; N.st = 'rearm'; N.t = 7; }
    } else if (N.st === 'rearm') { N.t -= dt; if (N.t <= 0) { N.st = 'up'; N.wait = 0; } }
    // the tripwire
    const T = st.wire;
    if (T.st === 'reset') { T.t -= dt; if (T.t <= 0) T.st = 'set'; }
    else {
      const e = enemies.find(e => free(e) && onFloor(e) && Math.abs(e.x - WIRE.x) < 6);
      if (e) tripWire(e);
      else if (playerFree() && player.onGround && player.y >= G - 1 && Math.abs(player.x - WIRE.x) < 6) tripWire(player);
    }
    // pinecones
    for (const c of cones) {
      c.vy += 1300 * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
      for (const e of enemies) if (!e.dead && Math.abs(e.x - c.x) < 12 && c.y > e.y - 80 && c.y < e.y) { woodsGot(e, rand(-100, 100), 200, 'BONK'); c.done = true; break; }
      if (!c.done && playerFree() && Math.abs(player.x - c.x) < 12 && c.y > player.y - 80 && c.y < player.y) { stun(c, 0.4); c.done = true; }
      if (c.y >= G - 4) { c.done = true; dust(c.x, G, 3, 4); }
    }
    cones = cones.filter(c => !c.done);
    // the bonfire: about half of them think to jump it
    for (const e of enemies) if (e.fireLook && Math.abs(e.x - FIRE.x) > 120) e.fireLook = false;
    for (const e of enemies) if (free(e) && onFloor(e) && !e.fireLook && Math.abs(e.x - FIRE.x) < 60 && Math.sign(FIRE.x - e.x) === Math.sign(e.vx)) {
      e.fireLook = true;
      if (Math.random() < 0.5) { e.vy = -560; e.onGround = false; e.jumpCd = 0.8; }
    }
    for (const e of enemies) if (free(e) && e.y > G - 50 && Math.abs(e.x - FIRE.x) < FIRE.hw) ignite(e);
    for (const e of enemies) if (e.burn > 0 && !e.dead) for (const o of enemies) if (o !== e && free(o) && Math.abs(o.x - e.x) < 18 && Math.abs(o.y - e.y) < 40) ignite(o);
    if (playerFree() && player.y > G - 46 && Math.abs(player.x - FIRE.x) < FIRE.hw - 2 && trapHurt({x: FIRE.x})) player.vy = -600;
    // the tent roof is bouncy
    if (fighting && player.onGround && Math.abs(player.y - TENT.y) < 1 && player.x > TENT.x0 && player.x < TENT.x1) {
      player.vy = -860; player.onGround = false; player.jumps = 1;
      texts.push({x: player.x, y: player.y - 90, s: 'BOING', life: 0.5, big: false});
    }
  }
  function ignite(e) {
    e.burn = 2.4; e.burnDir = Math.random() < 0.5 ? -1 : 1; e.snared = false; e.netted = false;
    texts.push({x: e.x, y: e.y - 96, s: pick(['AAAA!', 'HOT HOT HOT', 'OW OW OW']), life: 0.7, big: false});
  }

  // keeps snared, netted and burning stickmen busy (see engine/update.js)
  function holdEnemy(e, dt) {
    if (!e.col) e.col = '#e8e2d2';   // pale stickmen, so they show up in the dark
    if (e.snared) {
      // hanging upside down by one ankle, swinging
      const S = st.snare, k = Math.min(1, S.t / 0.22);
      const ankle = SNARE.top + SNARE.rope;
      e.x = SNARE.x + Math.sin(clock * 3.1) * 7 * k; e.y = G + (ankle + 68 - G) * k;
      e.vx = 0; e.vy = -GRAV * dt; e.onGround = false;
      e.snT -= dt;
      if (e.snT <= 0) { woodsGot(e, 0, 200, 'THE ROPE SNAPPED'); }
      return true;
    }
    if (e.netted) { e.vx = 0; e.vy = -GRAV * dt; e.y = G; return true; }
    if (e.burn > 0) {
      // running around on fire
      e.burn -= dt;
      e.vx = e.burnDir * 300; e.facing = e.burnDir;
      if (e.x < 20) e.burnDir = 1; if (e.x > W - 20) e.burnDir = -1;
      if (Math.random() < dt * 2) e.burnDir *= -1;
      if (Math.random() < dt * 40) parts.push({x: e.x + rand(-6, 6), y: e.y - rand(40, 80), vx: rand(-20, 20), vy: -rand(40, 120), h: 0, r: rand(1.5, 3), life: 0.4, spark: true, col: pick(['#f39a1f', '#e8384f', '#f6d36a'])});
      if (e.burn <= 0) woodsGot(e, 0, -300, 'TOASTED');
      return true;
    }
    return false;
  }

  // ---------- drawing ----------
  function pine(x, base, h, w, fill) {
    ctx.fillStyle = fill;
    for (let k = 0; k < 3; k++) {
      const y0 = base - h * k * 0.28, ww = w * (1 - k * 0.25);
      ctx.beginPath(); ctx.moveTo(x - ww, y0); ctx.lineTo(x, y0 - h * 0.5); ctx.lineTo(x + ww, y0); ctx.closePath(); ctx.fill();
    }
  }
  function drawWoods() {
    // night sky
    const sky = ctx.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, '#141a2e'); sky.addColorStop(1, '#2b3550');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, G);
    ctx.fillStyle = '#e8ecf5';
    for (const s of stars) { ctx.globalAlpha = 0.5 + Math.sin(clock * 2 + s.p) * 0.3; ctx.fillRect(s.x, s.y, 2, 2); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f2efd8'; ctx.beginPath(); ctx.arc(600, 70, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b3550'; ctx.beginPath(); ctx.arc(610, 64, 21, 0, Math.PI * 2); ctx.fill();
    // far pines, then nearer ones
    for (let x = -20; x < W + 40; x += 46) pine(x, 300 + (x * 7 % 23), 150 + (x * 13 % 40), 34, '#1b2a2a');
    for (let x = 10; x < W + 40; x += 74) pine(x, 350 + (x * 5 % 17), 190 + (x * 11 % 50), 46, '#223631');

    // the big tree on the left: trunk, the branch with the snare, and the log tied off to it
    box(-6, 20, 46, G - 20, '#4a3424', 3);
    shape([30, 186, 172, 196, 172, 204, 30, 204], '#4a3424', 3);
    ctx.strokeStyle = '#2f2016'; ctx.lineWidth = 2; for (let y = 60; y < G; y += 46) line(6, y, 26, y + 12);
    // the TRESPASSERS sign on it
    ctx.save(); ctx.translate(48, 286); ctx.rotate(-0.05);
    box(-2, 0, 88, 40, '#c9a77c', 2.5);
    ctx.fillStyle = INK; ctx.font = '10px "Permanent Marker", cursive'; ctx.textAlign = 'center';
    ctx.fillText('TRESPASSERS', 42, 15); ctx.fillText('WILL BE TRAPPED', 42, 30);
    ctx.restore();
    // the big tree on the right, and the branch the net hangs from
    box(762, 0, 46, G, '#4a3424', 3);
    shape([630, 164, 764, 160, 764, 172, 630, 174], '#4a3424', 3);
    ctx.strokeStyle = '#2f2016'; ctx.lineWidth = 2; for (let y = 40; y < G; y += 52) line(772, y, 790, y + 12);
    // the scoreboard: how many the woods have got
    ctx.save(); ctx.translate(690, 300);
    ctx.strokeStyle = '#4a3424'; ctx.lineWidth = 5; line(0, 0, 0, G - 300);
    box(-44, -32, 88, 38, '#c9a77c', 2.5);
    ctx.fillStyle = INK; ctx.font = '10px "Permanent Marker", cursive'; ctx.textAlign = 'center';
    ctx.fillText('THE WOODS', 0, -18);
    ctx.font = '600 13px "IBM Plex Mono", monospace'; ctx.fillText(String(st.woods), 0, 0);
    ctx.restore();

    // the tent
    shape([TENT.x0 - 10, G, (TENT.x0 + TENT.x1) / 2, TENT.y - 20, TENT.x1 + 10, G], '#c98a3a', 3);
    shape([(TENT.x0 + TENT.x1) / 2 - 16, G, (TENT.x0 + TENT.x1) / 2, G - 48, (TENT.x0 + TENT.x1) / 2 + 16, G], '#3a2a1a', 2.5);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; line(TENT.x0 - 10, G, TENT.x0 - 24, G - 2); line(TENT.x1 + 10, G, TENT.x1 + 24, G - 2);
    // the log pile
    for (const [x, y] of [[294, G - 16], [326, G - 16], [310, G - 40], [342, G - 40], [358, G - 16]]) {
      ctx.fillStyle = '#8a5a34'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d9b07a'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
    }

    // the forest floor
    ctx.fillStyle = '#3d3326'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#5a4a36'; ctx.lineWidth = 1.5;
    for (let x = -30; x < W; x += 15) line(x, G + 50, x + 30, G + 8);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);

    // the pit: leaves over it, or a hole
    if (st.pit.st === 'open') {
      ctx.fillStyle = '#0e0c10'; ctx.beginPath(); ctx.ellipse((PIT.x0 + PIT.x1) / 2, G + 4, (PIT.x1 - PIT.x0) / 2, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    } else if (st.pit.st === 'filled') {
      ctx.fillStyle = '#5a4a36'; ctx.beginPath(); ctx.ellipse((PIT.x0 + PIT.x1) / 2, G, (PIT.x1 - PIT.x0) / 2, 5, 0, Math.PI, 0); ctx.fill();
    } else {
      for (let x = PIT.x0; x < PIT.x1; x += 7) {
        ctx.fillStyle = ['#b5652a', '#d9902f', '#8a5a2b'][(x / 7 | 0) % 3];
        ctx.beginPath(); ctx.ellipse(x + 3, G - 1 + (x % 3), 5, 2.4, (x % 5) * 0.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // the snare: a loop on the ground, or the rope up to whoever's in it
    const S = st.snare;
    ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 2;
    if (S.st === 'set') {
      line(SNARE.x, SNARE.top, SNARE.x + 4, SNARE.top + 30);
      ctx.beginPath(); ctx.moveTo(SNARE.x + 4, SNARE.top + 30); ctx.bezierCurveTo(SNARE.x + 24, G - 120, SNARE.x + 26, G - 4, SNARE.x + 10, G - 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(SNARE.x, G - 2, 11, 3, 0, 0, Math.PI * 2); ctx.stroke();
      // the bent sapling that does the yanking
    } else if (S.st === 'up' && S.who) {
      line(SNARE.x, SNARE.top, S.who.x, S.who.y - 68);
    } else {
      line(SNARE.x, SNARE.top, SNARE.x + Math.sin(clock * 2) * 4, SNARE.top + SNARE.rope);
    }
    // the tripwire
    if (st.wire.st === 'set') {
      ctx.strokeStyle = 'rgba(220, 225, 240, 0.55)'; ctx.lineWidth = 1; line(WIRE.x - 26, G - 7, WIRE.x + 26, G - 7);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; line(WIRE.x - 26, G, WIRE.x - 26, G - 12); line(WIRE.x + 26, G, WIRE.x + 26, G - 12);
    } else { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; line(WIRE.x - 26, G, WIRE.x - 26, G - 12); line(WIRE.x + 26, G, WIRE.x + 26, G - 12); }

    // the bonfire
    ctx.fillStyle = '#5a4a3a'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(FIRE.x + k * 10, G - 2, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#4a3424'; ctx.lineWidth = 6; line(FIRE.x - 22, G - 2, FIRE.x + 18, G - 18); line(FIRE.x + 22, G - 2, FIRE.x - 18, G - 18);
    for (let i = 0; i < 5; i++) {
      const fx = FIRE.x - 16 + i * 8, fh = 34 + Math.sin(clock * 10 + i * 1.7) * 10 + (i === 2 ? 14 : 0);
      ctx.fillStyle = ['#e8384f', '#f39a1f', '#f6d36a', '#f39a1f', '#e8384f'][i];
      ctx.beginPath(); ctx.moveTo(fx - 8, G - 6); ctx.quadraticCurveTo(fx + Math.sin(clock * 7 + i) * 4, G - 6 - fh * 1.5, fx + 8, G - 6); ctx.fill();
    }
    ctx.fillStyle = '#f6d36a';
    for (const m of embers) { ctx.globalAlpha = Math.min(1, m.life); ctx.fillRect(m.x, m.y, 2, 2); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  }

  // in front of the stickmen: the log, the net, pinecones, flames on whoever's burning
  function drawFront() {
    // the log and its ropes
    const L = st.log, p = logPos();
    ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 2.5;
    line(LOG.px - 12, LOG.py, p.x - 12, p.y - 10); line(LOG.px + 12, LOG.py, p.x + 12, p.y - 10);
    if (L.st === 'tied') line(LOG.tie.x, LOG.tie.y, p.x - 30, p.y);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-L.a * 0.3);
    ctx.fillStyle = '#7a5230'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-40, -14, 80, 28, 13) : ctx.rect(-40, -14, 80, 28); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d9b07a'; ctx.beginPath(); ctx.ellipse(40, 0, 6, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a3424'; ctx.lineWidth = 1.5; line(-30, -4, 20, -4); line(-24, 5, 28, 5);
    ctx.restore();
    // the net
    const N = st.net;
    ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 1.5;
    if (N.st === 'up' || N.st === 'rearm') {
      line(NET.x, 170, NET.x, NET.y); ctx.fillStyle = 'rgba(217, 201, 160, 0.35)';
      ctx.beginPath(); ctx.ellipse(NET.x, NET.y + 12, 16, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let k = -12; k <= 12; k += 6) line(NET.x + k, NET.y, NET.x + k * 0.8, NET.y + 25);
    } else {
      const top = N.st === 'down' ? G - 70 : N.y - 70, bot = N.st === 'down' ? G : N.y;
      line(NET.x, 170, NET.x, top);
      ctx.beginPath(); ctx.moveTo(NET.x, top); ctx.quadraticCurveTo(NET.x - NET.hw - 10, bot - 30, NET.x - NET.hw, bot); ctx.lineTo(NET.x + NET.hw, bot); ctx.quadraticCurveTo(NET.x + NET.hw + 10, bot - 30, NET.x, top); ctx.stroke();
      for (let k = -NET.hw + 10; k < NET.hw; k += 12) line(NET.x, top, NET.x + k, bot);
      for (let y = top + 16; y < bot; y += 14) { const w = (y - top) / (bot - top) * NET.hw; line(NET.x - w, y, NET.x + w, y); }
    }
    // pinecones
    for (const c of cones) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = '#7a5230'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      line(-5, -2, 5, -2); line(-5, 3, 5, 3);
      ctx.restore();
    }
    // flames on anyone who's on fire
    for (const e of enemies) if (e.burn > 0 && !e.dead) {
      for (let i = 0; i < 3; i++) {
        const fx = e.x - 6 + i * 6, fh = 16 + Math.sin(clock * 14 + i * 2) * 5;
        ctx.fillStyle = ['#e8384f', '#f6d36a', '#f39a1f'][i];
        ctx.beginPath(); ctx.moveTo(fx - 6, e.y - 50); ctx.quadraticCurveTo(fx, e.y - 50 - fh * 1.8, fx + 6, e.y - 50); ctx.fill();
      }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  }

  // ---------- night ----------
  const dark = document.createElement('canvas'); dark.width = W * 2; dark.height = H * 2;
  const dctx = dark.getContext('2d'); dctx.scale(2, 2);
  function drawOver() {
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = 'rgba(10, 12, 30, 0.42)';
    dctx.fillRect(0, 0, W, H);
    dctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => {
      const g = dctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g; dctx.beginPath(); dctx.arc(x, y, r, 0, Math.PI * 2); dctx.fill();
    };
    hole(FIRE.x, G - 40, 300 + Math.sin(clock * 9) * 10, 1);
    if (!player.dead) hole(player.x, player.y - 40, 90, 0.8);
    if (flash > 0) hole(player.x + Math.cos(player.aim) * 40, player.y - 52, 120, 0.8);
    for (const e of enemies) if (e.burn > 0) hole(e.x, e.y - 50, 70, 0.8);
    dctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(dark, 0, 0, W, H);
    // warm firelight
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(FIRE.x, G - 30, 0, FIRE.x, G - 30, 330);
    g.addColorStop(0, `rgba(255, 140, 40, ${0.26 + Math.sin(clock * 11) * 0.03})`); g.addColorStop(1, 'rgba(255, 140, 40, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  ARENAS['the-woods'] = {
    id: 'the-woods', number: 8, name: 'The Woods',
    night: true,
    plats: [
      {x: 30, y: 196, w: 142},     // the left tree's branch
      {x: 282, y: 352, w: 92},     // the log pile
      {x: TENT.x0 + 8, y: TENT.y, w: TENT.x1 - TENT.x0 - 16},   // the tent roof (bouncy)
      {x: 630, y: 166, w: 132},    // the right tree's branch
    ],
    bossLoop: ['giant', 'trapper', 'giant', 'wolf'],
    st, FIRE, PIT, SNARE, NET, WIRE, TENT, LOG,
    woodsGot, releaseLog, sprung, dropNet, logPos,
    // out of the trees at either side, down out of the branches, or out of the tent
    spawnPoint() {
      const r = Math.random();
      if (r < 0.3) return {x: -15, y: G, air: false};
      if (r < 0.6) return {x: W + 15, y: G, air: false};
      if (r < 0.75) return {x: rand(60, 160), y: 150, air: true, vx: rand(-40, 80), vy: -100};
      if (r < 0.9) return {x: rand(650, 750), y: 130, air: true, vx: rand(-80, 40), vy: -100};
      return {x: (TENT.x0 + TENT.x1) / 2, y: G, air: false};
    },
    holdEnemy,
    drawStage: drawWoods,
    drawOver,
    setup() {
      Object.assign(st, {woods: 0,
        log: {st: 'tied', a: LOG.rest, va: 0, t: 0, mine: false, hit: new Set()},
        snare: {st: 'set', t: 0, who: null},
        pit: {st: 'covered', t: 0},
        net: {st: 'up', y: NET.y, vy: 0, t: 0, wait: 0},
        wire: {st: 'set', t: 0}});
      cones = []; embers = [];
      if (!stars.length) for (let i = 0; i < 40; i++) stars.push({x: rand(0, W), y: rand(0, 200), p: rand(0, 6)});
      props.push({update}, logRope, {draw: drawFront, front: true});
    },
  };
})();
