/* Arena 9: The Fishing Cabin (from a real fishing trip). 3 a.m. in the living room of a fishing
   cabin. You're on the couch and can't sleep, because the guy on the air mattress in the middle
   of the floor is snoring like a chainsaw. He never wakes up and can't be hurt.
   - Every snore rolls across the floor both ways. It doesn't take a heart; it just stuns you
     for a moment (and trips the stickmen). Jump it. The snores build up as the night goes on.
   - Big Z's float up off him. Stand on one and ride it up until it pops.
   - The air mattress is bouncy. Land on it and he snorts, rolls over, and squashes whatever's
     lying there with him.
   - Stickmen trip over the tackle box and the rods on the floor.
   - Every so often the mounted fish on the wall starts singing, and the stickmen stop to dance.
   The Mosquito (50) and THE SNORE (100) live in bosses/mosquito.js and bosses/snore.js.
   The snore sound is synthesized for now (sound.js: sfx.snore); a real recording can replace it. */

(() => {
  const MAT = {x0: 296, x1: 476, y: 378};          // the air mattress
  const HEAD = {x: 452, y: 360};                   // where the snoring comes out
  const TRIPS = [{x: 236, w: 30, kind: 'box'}, {x: 590, w: 44, kind: 'rods'}];
  const DOOR = {x: 694, w: 72};
  const FISH = {x: 112, y: 150};

  const st = {};
  let zs = [], snores = [];

  const box = (x, y, w, h, fill, lw = 3) => {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const free = e => !e.dead && !e.launched && !e.thrown && !(e.trip > 0) && !e.dance;
  const playing = () => state === 'play' && !player.dead;

  // ---------- the snoring ----------
  // big: the finale's snores. Both only ever stun you.
  function snore(big) {
    const S = st.snorer;
    S.mouth = 0.5;
    const sp = (big ? 390 : 320) + Math.min(80, kills * 0.8);
    snores.push({x: HEAD.x - 30, dir: -1, speed: sp, big, life: 3}, {x: HEAD.x + 10, dir: 1, speed: sp, big, life: 3});
    texts.push({x: HEAD.x, y: HEAD.y - 50, s: big ? pick(['HHHNNNGGKKK', 'SKRRRAAAWWNK', 'GRRAAAAWWWK']) : pick(['SNNRRRK', 'HHNNNKK', 'ZZRRRRK']), life: 1, big: false});
    shake = Math.max(shake, big ? 9 : 4);
    if (typeof sfx !== 'undefined' && sfx.snore) sfx.snore(big);
    // and a Z or two you can ride
    zs.push(makeZ(big ? 54 : 42));
    if (big && Math.random() < 0.6) zs.push(makeZ(40));
  }
  function makeZ(w) {
    const p = {x: HEAD.x - w / 2 + rand(-20, 20), y: HEAD.y - 30, w, z: true, gone: 0, vx: rand(-40, 30), life: rand(5, 7)};
    PLATS.push(p);
    return p;
  }
  function updateSnores(dt) {
    for (const w of snores) {
      w.x += w.dir * w.speed * dt; w.life -= dt;
      if (w.x < -30 || w.x > W + 30) w.life = 0;
      if (Math.random() < dt * 30) dust(w.x - w.dir * 10, G, 1, 4);
      // it doesn't hurt: it rattles you for a moment
      if (playing() && player.onGround && player.y >= G - 1 && Math.abs(player.x - w.x) < 18 && !w.gotYou) {
        w.gotYou = true;
        if (stun({x: w.x - w.dir * 20}, w.big ? 0.55 : 0.4)) texts.push({x: player.x, y: player.y - 110, s: 'RATTLED', life: 0.6, big: false});
      }
      for (const e of enemies) if (free(e) && e.onGround && e.y >= G - 1 && Math.abs(e.x - w.x) < 16) tripUp(e, 1);
    }
    snores = snores.filter(w => w.life > 0);
    // Z's float up and drift, carrying whoever's standing on them, and pop
    for (const z of zs) {
      const dy = -45 * dt, dx = z.vx * dt + Math.sin(clock * 1.3 + z.w) * 12 * dt;
      const riding = player.onGround && Math.abs(player.y - z.y) < 1 && player.x > z.x && player.x < z.x + z.w;
      z.y += dy; z.x = clamp(z.x + dx, 4, W - z.w - 4); z.life -= dt;
      if (riding) { player.y = z.y; player.x += dx; }
      if (z.life <= 0 || z.y < 50) {
        z.popped = true;
        for (let i = 0; i < 8; i++) parts.push({x: z.x + rand(0, z.w), y: z.y - 10, vx: rand(-80, 80), vy: rand(-80, 20), h: 0, r: rand(1, 2.2), life: 0.4, spark: true, ink: true, col: PAPER});
        texts.push({x: z.x + z.w / 2, y: z.y - 14, s: 'pop', life: 0.5, big: false});
      }
    }
    if (zs.some(z => z.popped)) { zs = zs.filter(z => !z.popped); PLATS = PLATS.filter(p => !p.z || zs.includes(p)); }
  }

  // ---------- trips, the mattress, the fish ----------
  function tripUp(e, t = 1.2) {
    e.trip = t; e.vx = 0; e.pose = 'crouch'; e.tilt = 1.25;
    texts.push({x: e.x, y: e.y - 80, s: pick(['TRIP', 'OOF', 'WHOA']), life: 0.6, big: false});
  }
  function bounce() {
    const S = st.snorer;
    player.vy = -900; player.onGround = false; player.jumps = 1;
    texts.push({x: player.x, y: player.y - 90, s: 'BOING', life: 0.5, big: false});
    if (S.rollCd > 0 || S.back) { texts.push({x: HEAD.x, y: HEAD.y - 40, s: 'snrk', life: 0.6, big: false}); return; }
    // he snorts, rolls over, and squashes whatever's lying there with him
    S.rollCd = 3; S.roll = 0.5; S.side *= -1;
    texts.push({x: HEAD.x - 40, y: HEAD.y - 56, s: 'SNORT', life: 0.8, big: false});
    for (const e of enemies) if (!e.dead && e.x > MAT.x0 - 10 && e.x < MAT.x1 + 10 && e.y > G - 60) {
      kill(e, rand(-200, 200), -300, false);
      texts.push({x: e.x, y: e.y - 110, s: 'SQUASHED', life: 0.8, big: false});
    }
  }
  function fishTime() {
    st.fish = 4.5;
    banner = {title: 'THE FISH IS SINGING', sub: 'Everybody stops to dance.', life: 2.4};
    if (typeof sfx !== 'undefined' && sfx.fishSong) sfx.fishSong();
    for (const e of enemies) if (free(e)) { e.dance = true; e.vx = 0; }
  }

  function update(dt) {
    const S = st.snorer;
    S.breath += dt * (S.back ? 2.4 : 1.6);
    S.mouth = Math.max(0, S.mouth - dt); S.roll = Math.max(0, S.roll - dt); S.rollCd = Math.max(0, S.rollCd - dt);
    st.fish = Math.max(0, st.fish - dt);
    if (st.fish <= 0) for (const e of enemies) if (e.dance) { e.dance = false; e.pose = null; }
    // snoring all night, building up (the finale takes over the snoring itself)
    const finale = boss && boss.kind === 'snore';
    if (!finale && (state === 'play' || state === 'dying')) {
      st.snoreT -= dt;
      if (st.snoreT < 1.1 && !S.inhale) { S.inhale = true; texts.push({x: HEAD.x, y: HEAD.y - 40, s: 'hhhnnn...', life: 0.9, big: false}); }
      if (st.snoreT <= 0) { S.inhale = false; snore(false); st.snoreT = Math.max(4.5, 8.5 - kills * 0.04) * rand(0.85, 1.15); }
    }
    updateSnores(dt);
    // the mattress is bouncy
    if (playing() && st.py < MAT.y - 1 && player.y >= MAT.y - 1 && player.x > MAT.x0 && player.x < MAT.x1) bounce();
    st.py = player.y;
    // tripping over the gear
    for (const e of enemies) if (free(e) && e.onGround && e.y >= G - 1) for (const t of TRIPS) if (Math.abs(e.x - t.x) < t.w / 2 && Math.abs(e.vx) > 40 && !(e.tripCd > 0)) { tripUp(e); e.tripCd = 2.5; }
    for (const e of enemies) if (e.tripCd > 0) e.tripCd -= dt;
    // the singing fish
    if (state === 'play' && !boss && !cine && !banner) { st.fishT -= dt; if (st.fishT <= 0) { st.fishT = rand(26, 36); fishTime(); } }
    st.doorOpen = Math.max(0, st.doorOpen - dt);
  }

  function holdEnemy(e, dt) {
    if (e.trip > 0) {
      e.trip -= dt; e.vx = 0;
      if (e.trip <= 0) { e.pose = null; e.tilt = 0; }
      return true;
    }
    if (e.dance) {
      e.vx = 0; e.pose = Math.floor(clock * 4 + e.phase) % 2 ? 'beckon' : null;
      e.facing = Math.floor(clock * 2 + e.phase) % 2 ? 1 : -1;
      if (e.onGround && Math.random() < dt * 2) e.vy = -220;
      return true;
    }
    return false;
  }

  // ---------- drawing ----------
  function drawSnorer() {
    const S = st.snorer, b = Math.sin(S.breath) * 3 + (S.inhale ? 4 : 0);
    // the mattress
    ctx.fillStyle = '#4f7fb8'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(MAT.x0, MAT.y, MAT.x1 - MAT.x0, G - MAT.y, 8) : ctx.rect(MAT.x0, MAT.y, MAT.x1 - MAT.x0, G - MAT.y); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a6496'; ctx.lineWidth = 1.5; for (let x = MAT.x0 + 22; x < MAT.x1; x += 22) line(x, MAT.y + 4, x, G - 4);
    // pillow
    ctx.fillStyle = '#f4f1ea'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(HEAD.x + 4, MAT.y - 4, 22, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // him, under a plaid blanket: a big lump, rising and falling
    const hump = S.back ? 30 : 22, rollK = S.roll > 0 ? Math.sin((0.5 - S.roll) / 0.5 * Math.PI) * 10 : 0;
    ctx.fillStyle = '#8f2f28';
    ctx.beginPath(); ctx.moveTo(MAT.x0 + 8, MAT.y + 2);
    ctx.quadraticCurveTo(MAT.x0 + 40, MAT.y - 10 - b * 0.5, MAT.x0 + 90, MAT.y - hump - b - rollK);
    ctx.quadraticCurveTo(HEAD.x - 30, MAT.y - hump - 4 - b - rollK, HEAD.x - 14, MAT.y - 6);
    ctx.lineTo(HEAD.x - 14, MAT.y + 2); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(20, 16, 20, 0.45)'; ctx.lineWidth = 3;
    for (let x = MAT.x0; x < HEAD.x; x += 12) line(x, MAT.y - 60, x, MAT.y + 4);
    for (let y = MAT.y - 50; y < MAT.y; y += 11) line(MAT.x0, y, HEAD.x, y);
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(MAT.x0 + 8, MAT.y + 2);
    ctx.quadraticCurveTo(MAT.x0 + 40, MAT.y - 10 - b * 0.5, MAT.x0 + 90, MAT.y - hump - b - rollK);
    ctx.quadraticCurveTo(HEAD.x - 30, MAT.y - hump - 4 - b - rollK, HEAD.x - 14, MAT.y - 6); ctx.stroke();
    // his head: face up and mouth wide open, or on his side
    const hx = HEAD.x, hy = MAT.y - 14;
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(hx, hy, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b4a2c'; ctx.beginPath(); ctx.arc(hx + 2, hy - 4, 11, Math.PI * 1.05, Math.PI * 1.9); ctx.fill();   // hair
    ctx.lineWidth = 2; line(hx - 6, hy - 1, hx - 2, hy - 1); line(hx + 3, hy - 1, hx + 7, hy - 1);   // shut eyes
    const open = 2 + (S.mouth > 0 ? 5 : 0) + (S.back ? 2 : 0) + Math.max(0, Math.sin(S.breath)) * 1.5;
    ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.ellipse(hx + 1, hy + 5, 3.5, open * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    if (S.back) { ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + 1, hy - 1, 3, 0, Math.PI * 2); ctx.stroke(); }   // nose up
    // little z's while he's just sleeping
    ctx.fillStyle = '#dfe6f5'; ctx.font = '14px "Permanent Marker", cursive'; ctx.textAlign = 'center';
    const zt = (clock * 0.5) % 1; ctx.globalAlpha = 1 - zt; ctx.fillText('z', hx + 16 + zt * 10, hy - 18 - zt * 26); ctx.globalAlpha = 1;
  }

  function drawCabinRoom() {
    // knotty pine paneling, moonlit
    ctx.fillStyle = '#9c7a52'; ctx.fillRect(0, 0, W, G);
    ctx.strokeStyle = '#7d5f3e'; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 34) { line(x, 0, x, G); ctx.beginPath(); ctx.ellipse(x + 17, (x * 7) % 300 + 40, 3, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
    box(0, 0, W, 14, '#5a4128', 3);
    // the ceiling fan, wobbling
    const fan = boss && boss.kind === 'snore' && boss.fanGone ? null : clock * (boss && boss.kind === 'snore' ? 9 : 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; line(400, 14, 400, 34);
    if (fan !== null) {
      ctx.fillStyle = '#5a4128'; ctx.beginPath(); ctx.arc(400, 38, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let k = 0; k < 4; k++) { const a = fan + k * Math.PI / 2, c = Math.cos(a); ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(400 + c * 34, 40, Math.abs(c) * 30 + 3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    // the window, the moon, curtains
    box(500, 120, 110, 120, '#1c2340', 3);
    ctx.fillStyle = '#f2efd8'; ctx.beginPath(); ctx.arc(578, 152, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16304a'; for (let x = 504; x < 606; x += 20) { ctx.beginPath(); ctx.moveTo(x, 238); ctx.lineTo(x + 10, 196); ctx.lineTo(x + 20, 238); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 3; line(555, 120, 555, 240); line(500, 180, 610, 180);
    ctx.fillStyle = '#b8862f'; for (const cx of [492, 604]) { ctx.beginPath(); ctx.moveTo(cx, 112); ctx.quadraticCurveTo(cx + 12, 180, cx + (cx < 550 ? 2 : 10), 250); ctx.lineTo(cx + 14, 250); ctx.lineTo(cx + 14, 112); ctx.fill(); ctx.stroke(); }
    box(494, 240, 122, 8, '#7a5a3a', 2.5);   // the sill
    // the loft beam
    box(280, 190, 220, 14, '#6b4a2c', 3);
    ctx.fillStyle = '#e8384f'; ctx.fillRect(310, 172, 26, 18); ctx.strokeRect(310, 172, 26, 18);   // a tackle box up there
    box(440, 168, 34, 22, '#3f6db0', 2.5);   // and a cooler
    // the mounted fish over the couch
    const sing = st.fish > 0, flap = sing ? Math.sin(clock * 16) * 0.25 : 0;
    box(FISH.x - 50, FISH.y - 26, 100, 52, '#7a5a3a', 3);
    ctx.save(); ctx.translate(FISH.x, FISH.y); ctx.rotate(sing ? Math.sin(clock * 8) * 0.12 : 0);
    ctx.fillStyle = '#6f9a4a'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 34, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-32, 0); ctx.rotate(flap); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -11); ctx.lineTo(-14, 11); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(22, -4, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.ellipse(31, 3, 4, sing ? 3 + Math.abs(Math.sin(clock * 14)) * 4 : 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (sing) { ctx.fillStyle = PAPER; ctx.font = '16px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText('♪', FISH.x + 50 + Math.sin(clock * 5) * 6, FISH.y - 30 - (clock * 30 % 30)); ctx.fillText('♫', FISH.x + 70, FISH.y - 10 - ((clock * 30 + 15) % 30)); }
    // the couch, with your blanket and pillow
    box(22, 292, 186, 50, '#4f6b3a', 3);                 // back
    box(30, 330, 172, 30, '#5d7d45', 3);                 // seat
    box(14, 306, 22, 76, '#4f6b3a', 3); box(196, 306, 22, 76, '#4f6b3a', 3);   // arms
    box(26, 360, 180, 28, '#3f5a2e', 3);
    ctx.fillStyle = '#f4f1ea'; ctx.beginPath(); ctx.ellipse(56, 324, 20, 8, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c98a3a'; ctx.beginPath(); ctx.moveTo(80, 330); ctx.quadraticCurveTo(140, 318, 196, 330); ctx.lineTo(190, 352); ctx.lineTo(84, 352); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the door, with waders hanging on it, and a shelf over it
    const d = st.doorOpen > 0 ? Math.min(1, st.doorOpen / 0.25) : 0;
    box(DOOR.x, 236, DOOR.w, G - 236, '#1c2340', 3);
    box(DOOR.x, 236, DOOR.w * (1 - d * 0.75), G - 236, '#6b4a2c', 3);
    if (d < 0.4) { ctx.fillStyle = '#3a5a3a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(DOOR.x + 20, 250); ctx.lineTo(DOOR.x + 50, 250); ctx.lineTo(DOOR.x + 48, 330); ctx.lineTo(DOOR.x + 22, 330); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    box(DOOR.x - 6, 204, DOOR.w + 12, 8, '#7a5a3a', 2.5);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(DOOR.x + 6, 186, 22, 18); ctx.strokeRect(DOOR.x + 6, 186, 22, 18);   // a hat and a lantern on the shelf
    // the cooler by the door
    box(636, 362, 54, 38, '#3f6db0', 3); box(632, 356, 62, 8, '#f4f1ea', 2.5);
    // the floor
    ctx.fillStyle = '#6b4a2c'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#553a22'; ctx.lineWidth = 1.5; for (let x = 0; x < W; x += 52) line(x, G, x, H);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);
    // a rag rug
    ctx.fillStyle = '#a9583d'; ctx.beginPath(); ctx.ellipse(400, G + 18, 150, 12, 0, 0, Math.PI * 2); ctx.fill();
    // the gear on the floor: the tackle box, and rods lying everywhere
    box(TRIPS[0].x - 15, G - 16, 30, 16, '#e8384f', 2.5); ctx.fillStyle = '#c9ccd4'; ctx.fillRect(TRIPS[0].x - 4, G - 20, 8, 4);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2.5; line(TRIPS[1].x - 40, G - 2, TRIPS[1].x + 34, G - 9); line(TRIPS[1].x - 30, G - 6, TRIPS[1].x + 40, G - 1);
    ctx.fillStyle = '#c9ccd4'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(TRIPS[1].x - 22, G - 6, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // him
    drawSnorer();
    // the snores rolling across the floor
    ctx.strokeStyle = '#dfe6f5'; ctx.lineCap = 'round';
    for (const w of snores) {
      const h = w.big ? 30 : 22;
      ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(w.x - 16, G); ctx.quadraticCurveTo(w.x, G - h, w.x + 16, G); ctx.stroke();
      ctx.lineWidth = 2; line(w.x - w.dir * 22, G - 8, w.x - w.dir * 34, G - 8); line(w.x - w.dir * 24, G - 16, w.x - w.dir * 32, G - 16);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
  }

  // the Z's are drawn in front, so you can see what you're standing on
  function drawZs() {
    for (const z of zs) {
      ctx.save(); ctx.globalAlpha = Math.min(1, z.life);
      ctx.font = Math.round(z.w * 1.3) + 'px "Permanent Marker", cursive'; ctx.textAlign = 'left';
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeText('Z', z.x + z.w * 0.08, z.y + z.w * 0.95);
      ctx.fillStyle = '#dfe6f5'; ctx.fillText('Z', z.x + z.w * 0.08, z.y + z.w * 0.95);
      ctx.restore();
    }
  }

  // night: a cool blue dark, with a little light around you
  const dark = document.createElement('canvas'); dark.width = W * 2; dark.height = H * 2;
  const dctx = dark.getContext('2d'); dctx.scale(2, 2);
  function drawOver() {
    dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = 'rgba(14, 20, 52, 0.4)'; dctx.fillRect(0, 0, W, H);
    dctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => {
      const g = dctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g; dctx.beginPath(); dctx.arc(x, y, r, 0, Math.PI * 2); dctx.fill();
    };
    hole(555, 260, 260, 0.6);                                   // moonlight from the window
    if (!player.dead) hole(player.x, player.y - 40, 100, 0.7);
    if (flash > 0) hole(player.x + Math.cos(player.aim) * 40, player.y - 52, 120, 0.8);
    dctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(dark, 0, 0, W, H);
  }

  ARENAS['fishing-cabin'] = {
    id: 'fishing-cabin', number: 9, name: 'The Fishing Cabin',
    night: true,
    plats: [
      {x: 30, y: 330, w: 172},     // the couch
      {x: 280, y: 190, w: 220},    // the loft beam
      {x: 494, y: 240, w: 122},    // the window sill
      {x: 632, y: 356, w: 62},     // the cooler
      {x: DOOR.x - 6, y: 204, w: DOOR.w + 12},   // the shelf over the door
    ],
    bossLoop: ['giant', 'mosquito', 'giant', 'snore'],
    st, MAT, HEAD, TRIPS, snore, fishTime, tripUp,
    get zs() { return zs; },
    // in the door, through the window, or up from behind the couch
    spawnPoint() {
      const r = Math.random();
      if (r < 0.4) { st.doorOpen = 0.7; return {x: DOOR.x + DOOR.w / 2, y: G, air: false}; }
      if (r < 0.65) return {x: 555, y: 250, air: true, vx: rand(-160, -60), vy: -150};
      if (r < 0.85) return {x: rand(40, 190), y: 300, air: true, vx: rand(40, 120), vy: -520};
      return {x: -15, y: G, air: false};
    },
    holdEnemy,
    // splats don't stick to Z's (they float away)
    onSplat(x, y) { return !zs.some(z => Math.abs(z.y - y) < 2 && x > z.x && x < z.x + z.w); },
    drawStage: drawCabinRoom,
    drawOver,
    setup() {
      Object.assign(st, {snorer: {breath: 0, mouth: 0, inhale: false, roll: 0, rollCd: 0, side: 1, back: false},
        snoreT: rand(4, 6), py: G, fish: 0, fishT: rand(20, 28), doorOpen: 0});
      zs = []; snores = [];
      PLATS = PLATS.filter(p => !p.z);
      props.push({update}, {draw: drawZs, front: true});
    },
  };
})();
