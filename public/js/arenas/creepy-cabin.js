/* Arena 6: Uncle's Creepy Cabin (Casey's idea). A dark log cabin at night, lit by the fireplace,
   a table lamp and lightning through the windows. The stickmen have glowing eyes here.
   - You get a shotgun instead of the pistol (see engine/core.js: arena.shotgun).
   - Stickmen climb up through the trap door in the floor, come in the front door, or through
     the window. Stand on the trap door too long and something in the cellar grabs your ankle.
   - SPOOKY TIME: the lamp starts laughing, then the deer head on the wall, then the whole cabin.
     Everything shakes, books fall off the shelf onto the stickmen, and the stickmen get faster
     while it laughs. With the sound on, you hear it.
   The Hand (50) and the Tree (100) live in bosses/hand.js and bosses/tree.js. */

(() => {
  const TRAP = {x0: 470, x1: 540};
  const LAMP = {x: 362, y: 330}, DEER = {x: 232, y: 112}, SHELF = {x: 466, w: 80, y: 232};
  const OPENINGS = [{x: 92, y: 196, kind: 'window'}, {x: 606, y: 176, kind: 'window'}, {x: 734, y: 318, kind: 'door'}];

  // darkness, with light cut out of it (like the hallway)
  const dark = document.createElement('canvas'); dark.width = W * 2; dark.height = H * 2;
  const dctx = dark.getContext('2d'); dctx.scale(2, 2);

  const st = {flash: 0, nextFlash: 8, thunderT: -1, laugh: null, lampLaugh: 0, deerLaugh: 0, cabinLaugh: 0,
    trap: 0, trapStand: 0, hand: null, doorOpen: 0, dawn: 0, boosted: []};
  let books = [];

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
  const shakeOf = k => k > 0 ? Math.sin(clock * 55) * 2.5 * Math.min(1, k) : 0;

  function windowPane(x, y, w, h) {
    // night outside, or a lightning flash, or (after the Tree) dawn
    const sky = st.flash > 0 ? '#f4f7ff' : st.dawn > 0 ? `hsl(${20 + st.dawn * 20} ${60 * st.dawn}% ${18 + st.dawn * 55}%)` : '#1f2233';
    box(x, y, w, h, sky, 3);
    if (st.flash <= 0 && st.dawn < 0.5) {
      ctx.strokeStyle = '#3a3f55'; ctx.lineWidth = 2;   // bare branches outside
      line(x + 6, y + h, x + w * 0.4, y + h * 0.4); line(x + w * 0.4, y + h * 0.4, x + w * 0.7, y + 8); line(x + w * 0.4, y + h * 0.4, x + 4, y + h * 0.2);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 3; line(x + w / 2, y, x + w / 2, y + h); line(x, y + h / 2, x + w, y + h / 2);
  }

  function drawCabin() {
    // log walls
    ctx.fillStyle = '#c9a77c'; ctx.fillRect(0, 0, W, G);
    ctx.strokeStyle = '#9c7a52'; ctx.lineWidth = 2;
    for (let y = 22; y < G; y += 26) { line(0, y, W, y); for (let x = (y / 26 % 2) * 60 + 20; x < W; x += 120) { ctx.beginPath(); ctx.arc(x, y - 13, 4, 0, Math.PI * 2); ctx.stroke(); } }
    // ceiling beam
    box(0, 0, W, 16, '#7a5a3a', 3);
    // windows and the front door
    windowPane(40, 148, 104, 100);
    windowPane(560, 128, 92, 92);
    const d = st.doorOpen > 0 ? Math.min(1, st.doorOpen / 0.3) : 0;
    box(690, 230, 84, 170, '#1d1b22', 3);
    box(690, 230, 84 * (1 - d * 0.75), 170, '#6b4a2c', 3);
    ctx.fillStyle = '#e0c46a'; if (d < 0.5) { ctx.beginPath(); ctx.arc(760, 322, 4, 0, Math.PI * 2); ctx.fill(); }
    // the fireplace, and its fire
    box(160, 262, 140, 12, '#8f8a82', 3);                       // mantel
    box(172, 274, 116, 126, '#a59e94', 3);
    box(196, 310, 68, 90, '#2a2324', 3);
    for (let i = 0; i < 4; i++) {
      const fx = 212 + i * 12, fh = 26 + Math.sin(clock * 9 + i * 2) * 8;
      ctx.fillStyle = i % 2 ? '#f39a1f' : '#e8384f';
      ctx.beginPath(); ctx.moveTo(fx - 7, 398); ctx.quadraticCurveTo(fx, 398 - fh * 1.4, fx + 7, 398); ctx.fill();
    }
    // the deer head over the fireplace
    drawDeer();
    // table and the lamp
    box(330, 330, 120, 10, '#7a5230', 3); line(340, 340, 340, 400); line(440, 340, 440, 400);
    drawLamp();
    // the bookshelf
    const bs = shakeOf(st.cabinLaugh);
    box(SHELF.x + bs, SHELF.y, SHELF.w, G - SHELF.y, '#7a5230', 3);
    for (let r = 0; r < 4; r++) {
      const y = SHELF.y + 14 + r * 40; ctx.strokeStyle = INK; ctx.lineWidth = 2; line(SHELF.x + 4 + bs, y + 30, SHELF.x + SHELF.w - 4 + bs, y + 30);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#8f2f28', '#2b4a6b', '#4f6b3a', '#6b4a2c', '#5a3a6b', '#8a6a2a'][(k + r) % 6]; ctx.fillRect(SHELF.x + 8 + k * 11 + bs, y + 6 + (k % 3), 9, 24 - (k % 3)); }
    }
    // uncle's armchair, rocking with nobody in it
    ctx.save(); ctx.translate(624, G); ctx.rotate(Math.sin(clock * 1.7) * 0.07 + shakeOf(st.cabinLaugh) * 0.02);
    shape([-30, -4, -32, -82, 28, -82, 30, -4], '#6b2f2a', 3); box(-36, -44, 72, 18, '#7d3a33', 3);
    ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, -2); ctx.quadraticCurveTo(0, 8, 40, -2); ctx.stroke();
    ctx.restore();
    // floor boards and the rug over... no, next to the trap door
    ctx.fillStyle = '#8a6440'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 1.5; for (let x = 0; x < W; x += 46) line(x, G, x, H);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);
    // the trap door: flips open when something comes up, rattles when something wants you
    const rat = st.hand && st.hand.st === 'rattle' ? Math.sin(clock * 70) * 2 : 0;
    const open = st.trap > 0 ? Math.min(1, st.trap / 0.3) : 0;
    box(TRAP.x0, G - 3 + rat, TRAP.x1 - TRAP.x0, 6, '#5a3a22', 2.5);
    if (open > 0) { ctx.save(); ctx.translate(TRAP.x0, G); ctx.rotate(-open * 1.6); box(0, -3, TRAP.x1 - TRAP.x0, 6, '#6b4a2c', 2.5); ctx.restore(); }
    ctx.fillStyle = '#e0c46a'; ctx.beginPath(); ctx.arc((TRAP.x0 + TRAP.x1) / 2, G + rat, 3, 0, Math.PI * 2); ctx.fill();
    // the hand from the cellar
    if (st.hand && st.hand.st === 'grab') {
      const k = Math.min(1, st.hand.t / 0.15), hx = st.hand.x;
      ctx.strokeStyle = '#6b7d5a'; ctx.lineWidth = 7; line(hx, G + 4, hx, G - 40 * k);
      ctx.lineWidth = 3; for (const fx of [-8, -3, 3, 8]) line(hx, G - 40 * k, hx + fx, G - 52 * k);
    }
    // falling books
    for (const b of books) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); box(-8, -5, 16, 10, b.c, 2); ctx.restore(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  }

  function drawDeer() {
    const s = shakeOf(st.deerLaugh + st.cabinLaugh), x = DEER.x + s, y = DEER.y, laughing = st.deerLaugh > 0 || st.cabinLaugh > 0;
    shape([x - 22, y + 30, x + 22, y + 30, x + 16, y + 44, x - 16, y + 44], '#7a5230', 2.5);   // plaque
    ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 4;                                             // antlers
    for (const sd of [-1, 1]) { line(x + sd * 10, y - 14, x + sd * 30, y - 40); line(x + sd * 22, y - 28, x + sd * 34, y - 26); line(x + sd * 27, y - 36, x + sd * 22, y - 50); }
    ctx.fillStyle = '#9a6a48'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 16, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sd * 18, y - 12, 9, 4, sd * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y + 22, 4, 0, Math.PI * 2); ctx.fill();
    if (laughing) {
      // head thrown back, mouth wide open
      ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.ellipse(x, y + 16, 7, 6 + Math.abs(Math.sin(clock * 22)) * 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2; line(x - 9, y - 6, x - 3, y - 2); line(x + 9, y - 6, x + 3, y - 2);
    } else { ctx.beginPath(); ctx.arc(x - 6, y - 4, 2, 0, Math.PI * 2); ctx.arc(x + 6, y - 4, 2, 0, Math.PI * 2); ctx.fill(); }
  }

  function drawLamp() {
    const k = st.lampLaugh + st.cabinLaugh, s = shakeOf(k), x = LAMP.x, y = LAMP.y;
    ctx.strokeStyle = INK; ctx.lineWidth = 3; line(x + s, y, x + s * 2, y - 40);
    box(x - 10, y - 4, 20, 4, '#8f8a82', 2);
    ctx.save(); ctx.translate(x + s * 2, y - 40); ctx.rotate(k > 0 ? Math.sin(clock * 30) * 0.18 : 0);
    shape([-12, 0, 12, 0, 22, 22, -22, 22], '#f1d9a6', 2.5);
    if (k > 0) {
      // the shade has a face, and it's laughing
      ctx.fillStyle = INK; ctx.lineWidth = 2;
      line(-10, 7, -4, 9); line(10, 7, 4, 9);
      ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.ellipse(0, 15, 6, 3 + Math.abs(Math.sin(clock * 26)) * 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- light, dark, and the eyes in it ----------
  function drawOver() {
    const lit = st.flash > 0;
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = `rgba(12, 10, 24, ${lit ? 0.05 : 0.62 - st.dawn * 0.5})`;
    dctx.fillRect(0, 0, W, H);
    dctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => {
      const g = dctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g; dctx.beginPath(); dctx.arc(x, y, r, 0, Math.PI * 2); dctx.fill();
    };
    hole(230, 350, 170 + Math.sin(clock * 9) * 8, 0.95);           // the fire
    hole(LAMP.x, LAMP.y - 30, 120, 0.85);                             // the lamp
    if (!player.dead) hole(player.x, player.y - 40, 85, 0.8);
    if (flash > 0) hole(player.x + Math.cos(player.aim) * 40, player.y - 52, 130, 0.8);
    dctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(dark, 0, 0, W, H);
    // stickmen's eyes glow in the dark
    ctx.fillStyle = '#c6ff5a';
    for (const e of enemies) {
      if (e.dead) continue;
      const f = e.facing || 1, ex = e.x + f * 3, ey = e.y - 68;
      ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(ex - 3, ey, 1.6, 0, Math.PI * 2); ctx.arc(ex + 3, ey, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- SPOOKY TIME ----------
  function spookyTime() {
    st.laugh = {t: 0, stage: 0};
  }
  function updateLaugh(dt) {
    const L = st.laugh;
    if (!L) return;
    L.t += dt;
    if (L.stage === 0) { L.stage = 1; st.lampLaugh = 1.8; sfx.laugh('lamp'); texts.push({x: LAMP.x, y: LAMP.y - 80, s: 'hehehe', life: 1, big: false}); }
    if (L.stage === 1 && L.t > 1.0) { L.stage = 2; st.deerLaugh = 2.2; sfx.laugh('deer'); texts.push({x: DEER.x, y: DEER.y - 60, s: 'HAHAHA', life: 1, big: false}); }
    if (L.stage === 2 && L.t > 2.1) {
      L.stage = 3; st.cabinLaugh = 3.2; sfx.laugh('all'); shake = Math.max(shake, 10);
      banner = {title: 'SPOOKY TIME', sub: 'The whole cabin is laughing at you.', life: 3};
      // books fly off the shelf
      for (let i = 0; i < 4; i++) books.push({x: SHELF.x + 10 + rand(0, SHELF.w - 20), y: SHELF.y + 20 + rand(0, 100), vx: rand(-260, -80), vy: -rand(150, 350), rot: 0, vr: rand(-12, 12), c: ['#8f2f28', '#2b4a6b', '#4f6b3a', '#5a3a6b'][i]});
      // and the stickmen get a second wind
      for (const e of enemies) if (!e.dead && !e.spooked) { e.spooked = true; e.speed *= 1.5; st.boosted.push(e); }
    }
    if (L.stage === 3 && L.t > 7.5) {
      for (const e of st.boosted) if (!e.dead) { e.speed /= 1.5; e.spooked = false; }
      st.boosted = []; st.laugh = null;
    }
  }

  function update(dt) {
    st.flash = Math.max(0, st.flash - dt);
    st.lampLaugh = Math.max(0, st.lampLaugh - dt); st.deerLaugh = Math.max(0, st.deerLaugh - dt); st.cabinLaugh = Math.max(0, st.cabinLaugh - dt);
    st.trap = Math.max(0, st.trap - dt); st.doorOpen = Math.max(0, st.doorOpen - dt);
    // lightning, then thunder
    st.nextFlash -= dt;
    if (st.nextFlash <= 0 && st.dawn <= 0) { st.flash = 0.16; st.nextFlash = rand(7, 14); st.thunderT = rand(0.3, 0.9); }
    if (st.thunderT > 0) { st.thunderT -= dt; if (st.thunderT <= 0) { sfx.thunder(); shake = Math.max(shake, 3); } }
    updateLaugh(dt);
    if (state === 'play' && !boss && !cine && !banner && !st.laugh) {
      st.nextLaugh -= dt;
      if (st.nextLaugh <= 0) { st.nextLaugh = rand(24, 34); spookyTime(); }
    }
    // falling books rainbow whoever they land on
    for (const b of books) {
      const py = b.y;
      b.vy += 1100 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
      for (const e of enemies) if (!e.dead && Math.abs(e.x - b.x) < 16 && b.y > e.y - 80 && b.y < e.y) { kill(e, b.vx, 300, true); b.done = true; }
      if (b.vy > 0 && landY(b.x, py, b.y) !== null) b.done = true;
      if (b.done) { dust(b.x, b.y, 6, 8); texts.push({x: b.x, y: b.y - 30, s: 'THUD', life: 0.6, big: false}); }
    }
    books = books.filter(b => !b.done);
    // the trap door: stand on it too long and something grabs your ankle
    const onTrap = state === 'play' && !player.dead && player.onGround && player.y >= G - 1 && player.x > TRAP.x0 - 4 && player.x < TRAP.x1 + 4;
    if (!st.hand) {
      st.trapStand = onTrap ? st.trapStand + dt : 0;
      if (st.trapStand > 1.2) { st.hand = {st: 'rattle', t: 0.6, x: player.x}; st.trapStand = 0; }
    } else {
      const h = st.hand; h.t -= dt;
      if (h.st === 'rattle' && h.t <= 0) {
        h.st = 'grab'; h.t = 0.5; h.x = clamp(player.x, TRAP.x0 + 8, TRAP.x1 - 8); st.trap = 0.5;
        if (onTrap && invuln <= 0 && rainbowT <= 0) { if (hp <= 1) deathTitle = 'Something in the cellar got you.'; hurt({x: h.x}); }
      } else if (h.st === 'grab' && h.t <= 0) st.hand = null;
    }
  }

  ARENAS['creepy-cabin'] = {
    id: 'creepy-cabin', number: 6, name: "Uncle's Creepy Cabin",
    shotgun: true,
    plats: [
      {x: 160, y: 262, w: 140},   // mantel
      {x: 330, y: 330, w: 120},   // table
      {x: SHELF.x, y: SHELF.y, w: SHELF.w},   // bookshelf
      {x: 380, y: 150, w: 170},   // rafter
      {x: 36, y: 252, w: 112},    // window sill
      {x: 594, y: 318, w: 60},    // armchair
    ],
    bossLoop: ['giant', 'hand', 'giant', 'tree'],
    OPENINGS, TRAP, st,
    // up through the trap door, in the front door, or through the window
    spawnPoint() {
      const r = Math.random();
      if (r < 0.4) { st.trap = 0.6; return {x: rand(TRAP.x0 + 10, TRAP.x1 - 10), y: G, air: true, vx: rand(-80, 80), vy: -650}; }
      if (r < 0.7) { st.doorOpen = 0.8; return {x: 732, y: G, air: false}; }
      return {x: 92, y: 240, air: true, vx: rand(80, 160), vy: -120};
    },
    drawStage: drawCabin,
    drawOver,
    spookyTime,
    setup() {
      Object.assign(st, {flash: 0, nextFlash: rand(3, 6), thunderT: -1, laugh: null, lampLaugh: 0, deerLaugh: 0, cabinLaugh: 0,
        trap: 0, trapStand: 0, hand: null, doorOpen: 0, dawn: 0, boosted: [], nextLaugh: rand(14, 20)});
      books = [];
      props.push({update});
    },
  };
})();
