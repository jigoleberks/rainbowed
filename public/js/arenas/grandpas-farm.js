/* Arena 5: Grandpa's Farm. Grandma's House, but outside. A red barn, hay bales, the tractor,
   the chicken coop, a cornfield along the back, and Grandpa asleep in his rocking chair on the
   porch the whole time. Stickmen come out of the barn doors, up the lane, or pop out of the corn.

   Buster, Grandpa's border collie, is the farm's chaos agent (chaotic good, unlike Sophy).
   Every so often "BUSTER!" flashes up and he:
   - naps on the porch next to Grandpa (most often),
   - gets the zoomies: laps of the yard at full speed, bowling stickmen over, leaping over you,
   - herds the stickmen into one tight bunch (perfect for a kick chain or a grenade),
   - brings you his frisbee: your next shot throws it, he tears off after it bowling over
     everything in his way, brings it back, and wants you to throw it again.
   He can't be hurt. In Grandpa's finale he runs alongside the mower, barking. */

(() => {
  const PORCH = {x: 628, chairX: 724, y: G};   // the porch, and where Grandpa's chair sits
  const BARN_DOOR = 128, COOP_X = 586;
  const grandpa = {st: 'chair', rock: 0};       // 'chair' | 'away' (the finale has him)
  let tufts = [], buster = null, frisbee = null;

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

  // ---------- Grandpa (also used by his finale) ----------
  // feet at (x, y). pose: 'chair' (asleep, hat over his face) | 'stand' | 'sit' (on the mower)
  function drawGrandpa(x, y, f, pose, o = {}) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const sit = pose !== 'stand', step = Math.sin(o.phase || 0) * 4;
    // legs
    if (sit) { poly([-3, -26, f * 14, -26, f * 15, -6]); poly([3, -26, f * 18, -24, f * 19, -4]); }
    else { line(-4, -28, -4 + step, 0); line(4, -28, 4 - step, 0); }
    const hip = sit ? -26 : -28, sh = hip - 30;
    // overalls
    ctx.fillStyle = '#5b7fb3'; ctx.beginPath(); ctx.moveTo(-9, sh + 8); ctx.lineTo(9, sh + 8); ctx.lineTo(10, hip + 4); ctx.lineTo(-10, hip + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2; line(-6, sh + 8, -4, sh); line(6, sh + 8, 4, sh);
    ctx.fillStyle = '#e0c46a'; for (const bx of [-5, 5]) { ctx.beginPath(); ctx.arc(bx, sh + 10, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineWidth = 3.2;
    // arms
    if (pose === 'sit') { poly([0, sh + 2, f * 12, sh + 10, f * 22, sh + 8]); poly([0, sh + 2, f * 10, sh + 14, f * 20, sh + 12]); }
    else if (pose === 'chair') { poly([0, sh + 2, f * 10, sh + 16, f * 6, hip]); poly([0, sh + 2, -f * 6, sh + 16, -f * 2, hip]); }
    else { poly([0, sh + 2, f * 8, sh + 14, f * 10, sh + 26]); poly([0, sh + 2, -f * 6, sh + 14, -f * 8, sh + 26]); }
    // head, white beard
    const hy = sh - 11, hx = pose === 'chair' ? -f * 2 : f * 2;
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4f1ea'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - 7, hy + 3); ctx.quadraticCurveTo(hx + f * 2, hy + 18, hx + 7, hy + 3); ctx.fill(); ctx.stroke();
    if (pose !== 'chair') { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + f * 4, hy - 2, 1.5, 0, Math.PI * 2); ctx.fill(); }
    // straw hat (over his face when he's asleep)
    ctx.save(); ctx.translate(hx, pose === 'chair' ? hy - 1 : hy - 7); ctx.rotate(pose === 'chair' ? -f * 0.35 : 0);
    ctx.fillStyle = '#e8c76a'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-9, -11, 0, -11); ctx.quadraticCurveTo(9, -11, 9, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5; line(-9, -3, 9, -3);
    ctx.restore();
    if (o.say) { ctx.fillStyle = INK; ctx.font = '15px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText(o.say, hx, hy - 26); }
    ctx.restore();
  }

  function drawRocker(x, rock) {
    ctx.save(); ctx.translate(x, G); ctx.rotate(Math.sin(rock) * 0.06);
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-26, -2); ctx.quadraticCurveTo(0, 6, 26, -2); ctx.stroke();
    line(-14, 0, -14, -26); line(14, 0, 14, -26); line(-16, -26, 16, -26); line(-16, -26, -18, -66); line(-12, -46, -15, -66);
    ctx.restore();
  }

  // ---------- the farm ----------
  function drawFarm() {
    // sky and a far field
    ctx.fillStyle = '#eaf2f7'; ctx.fillRect(0, 0, W, G);
    ctx.fillStyle = '#f6d36a'; ctx.beginPath(); ctx.arc(520, 66, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e9b949'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + clock * 0.2; line(520 + Math.cos(a) * 34, 66 + Math.sin(a) * 34, 520 + Math.cos(a) * 44, 66 + Math.sin(a) * 44); }
    ctx.fillStyle = '#cfe2b8'; ctx.beginPath(); ctx.moveTo(0, 260); ctx.quadraticCurveTo(250, 220, 520, 250); ctx.quadraticCurveTo(680, 262, W, 240); ctx.lineTo(W, G); ctx.lineTo(0, G); ctx.closePath(); ctx.fill();
    // windmill, far back
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    line(392, 250, 402, 132); line(412, 250, 402, 132); line(395, 200, 409, 200); line(398, 170, 406, 170);
    ctx.save(); ctx.translate(402, 128); ctx.rotate(clock * 0.8);
    for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); shape([0, 0, 6, -30, -2, -30], '#f4f1ea', 2); }
    ctx.restore();
    // cornfield along the back
    for (let x = 250; x < 640; x += 13) {
      const sw = Math.sin(clock * 1.5 + x * 0.05) * 3;
      ctx.strokeStyle = '#6f9a4a'; ctx.lineWidth = 2.5; line(x, G - 30, x + sw, G - 96);
      ctx.lineWidth = 2; line(x + sw * 0.5, G - 60, x + 9, G - 70); line(x + sw * 0.6, G - 74, x - 8, G - 84);
      ctx.fillStyle = '#e9c400'; ctx.beginPath(); ctx.ellipse(x + sw + 2, G - 96, 2.5, 6, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    // fence
    ctx.fillStyle = '#f4f1ea';
    for (let x = 236; x < 640; x += 40) box(x, G - 46, 7, 46, '#efe6d6', 2);
    box(236, G - 40, 404, 5, '#efe6d6', 2); box(236, G - 22, 404, 5, '#efe6d6', 2);

    // the barn
    shape([10, 400, 10, 150, 125, 80, 240, 150, 240, 400], '#c94a3e', 3);
    shape([0, 156, 125, 76, 250, 156, 240, 162, 125, 92, 10, 162], '#8f2f28', 2.5);
    box(70, 158, 116, 26, '#5a3a2a', 2.5);                     // the loft door
    ctx.strokeStyle = '#f4f1ea'; ctx.lineWidth = 3; line(74, 162, 182, 180); line(74, 180, 182, 162);
    box(58, 268, 140, 132, '#a63a30', 3);                       // the big doors
    ctx.strokeStyle = '#f4f1ea'; ctx.lineWidth = 4; line(128, 268, 128, 400);
    line(62, 272, 124, 396); line(124, 272, 62, 396); line(132, 272, 194, 396); line(194, 272, 132, 396);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(58, 268, 140, 132);
    // the farmhouse porch, and Grandpa
    box(620, 150, 180, 250, '#f2eadc', 3);
    shape([606, 236, 800, 236, 800, 222, 612, 222], '#9c6b47', 2.5);   // porch roof
    box(640, 290, 30, 110, '#7a5230', 2.5); box(690, 266, 40, 46, '#bcd6e8', 2.5);   // door and window
    for (const px of [624, 792]) box(px - 4, 236, 8, 164, '#e8dcc8', 2);
    if (grandpa.st === 'chair') {
      drawRocker(PORCH.chairX, grandpa.rock);
      drawGrandpa(PORCH.chairX, G - 2 + Math.sin(grandpa.rock) * 1, -1, 'chair');
      ctx.fillStyle = INK; ctx.font = '12px "Permanent Marker", cursive'; ctx.textAlign = 'center';
      const zt = (clock * 0.5) % 1; ctx.globalAlpha = 1 - zt; ctx.fillText('z', PORCH.chairX - 14 - zt * 10, G - 92 - zt * 22); ctx.globalAlpha = 1;
    } else drawRocker(PORCH.chairX, 0);
    // the chicken coop
    box(COOP_X - 36, G - 62, 72, 62, '#e3c98f', 2.5);
    shape([COOP_X - 44, G - 60, COOP_X, G - 82, COOP_X + 44, G - 60], '#9c6b47', 2.5);
    box(COOP_X - 10, G - 30, 20, 30, '#5a3a2a', 2);
    // the tractor
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(440, G - 24, 24, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(518, G - 14, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a8f99'; ctx.beginPath(); ctx.arc(440, G - 24, 9, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(518, G - 14, 5, 0, Math.PI * 2); ctx.fill();
    box(458, G - 64, 76, 34, '#3f8a4a', 3);                      // hood
    box(420, G - 112, 46, 66, '#3f8a4a', 3); box(426, G - 104, 34, 26, '#cfe6f2', 2);   // cab
    box(500, G - 82, 7, 18, '#5a5f69', 2);                       // exhaust
    // hay bales
    for (const [x, y, w, h] of [[254, G - 34, 50, 34], [306, G - 34, 50, 34], [280, G - 68, 50, 34]]) {
      box(x, y, w, h, '#e8c76a', 2.5); ctx.strokeStyle = '#b8902f'; ctx.lineWidth = 1.5;
      for (let k = 8; k < w - 4; k += 9) line(x + k, y + 4, x + k - 3, y + h - 4); ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; line(x + 4, y + h / 2, x + w - 4, y + h / 2);
    }
    // the yard: grass that the mower can cut
    ctx.fillStyle = '#b9d38f'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#94b46a'; ctx.lineWidth = 1.5;
    for (let x = -40; x < W; x += 16) line(x, G + 52, x + 40, G + 6);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);
    ctx.strokeStyle = '#5f8f3e'; ctx.lineWidth = 2;
    for (const t of tufts) if (t.h > 1) { line(t.x, G, t.x - 3, G - t.h); line(t.x + 3, G, t.x + 5, G - t.h * 0.8); }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  }

  // ---------- Buster ----------
  function drawBuster(b) {
    const f = b.f, run = b.mode === 'run' || b.mode === 'zoom' || b.mode === 'herd' || b.mode === 'fetch' || b.mode === 'return' || b.mode === 'mower';
    const ph = b.phase, gait = run ? Math.sin(ph) * 7 : 0;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK;
    if (b.mode === 'nap') {
      // curled up
      ctx.fillStyle = '#1d1b22'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -9, 20, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.ellipse(f * 10, -6, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = INK; ctx.font = '11px "Permanent Marker", cursive'; ctx.textAlign = 'center';
      const zt = (clock * 0.7) % 1; ctx.globalAlpha = 1 - zt; ctx.fillText('z', f * 16 + zt * 6, -22 - zt * 14); ctx.globalAlpha = 1;
      ctx.restore(); return;
    }
    // legs
    ctx.lineWidth = 3.5;
    for (const [lx, s] of [[-12, gait], [-6, -gait], [9, -gait], [15, gait]]) line(lx * f, -12, (lx + s * 0.6) * f, 0);
    // tail, wagging
    const wag = Math.sin(clock * (run ? 30 : 14)) * 0.5;
    ctx.save(); ctx.translate(-16 * f, -18); ctx.rotate(f * (-0.6 + wag));
    ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.ellipse(-f * 9, 0, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(-f * 17, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // body: black with a white chest
    ctx.fillStyle = '#1d1b22'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -18, 19, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.ellipse(13 * f, -16, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
    // head
    const hx = 22 * f, hy = b.mode === 'stare' ? -32 : -28;
    ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.ellipse(hx + 6 * f, hy + 3, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();   // white muzzle
    ctx.fillStyle = PAPER; ctx.fillRect(hx - 1, hy - 8, 2.5, 10);   // white blaze
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 11 * f, hy + 2, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 3 * f, hy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    // ears: one up, one flopped
    ctx.fillStyle = '#1d1b22'; shape([hx - 5 * f, hy - 6, hx - 2 * f, hy - 16, hx + 2 * f, hy - 7], '#1d1b22', 2);
    shape([hx - 6 * f, hy - 4, hx - 13 * f, hy - 7, hx - 9 * f, hy + 1], '#1d1b22', 2);
    // tongue out when he's running
    if (run) { ctx.fillStyle = '#e86f86'; ctx.beginPath(); ctx.ellipse(hx + 9 * f, hy + 8, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    // the frisbee in his mouth
    if (b.hasDisc) { ctx.fillStyle = '#e8384f'; ctx.beginPath(); ctx.ellipse(hx + 12 * f, hy + 5, 8, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); }
    if (b.mode === 'stare') { ctx.fillStyle = ACCENT; ctx.font = '18px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText('!', hx, hy - 16); }
    if (b.bark > 0) { ctx.fillStyle = INK; ctx.font = '14px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText('WOOF', hx + 8 * f, hy - 18); }
    ctx.restore();
  }

  function drawDisc() {
    const fr = frisbee;
    if (!fr) return;
    if (fr.st === 'ready') {
      // at your feet, waiting
      ctx.fillStyle = '#e8384f'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      const x = player.x + player.facing * 14, y = player.y - 3;
      ctx.beginPath(); ctx.ellipse(x, y, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = '600 9px "IBM Plex Mono", monospace'; ctx.fillStyle = ACCENT; ctx.textAlign = 'center';
      if (Math.floor(clock * 3) % 2) ctx.fillText('THROW IT', player.x, player.y - 100);
    } else if (fr.st === 'fly' || fr.st === 'ground') {
      ctx.save(); ctx.translate(fr.x, fr.y); ctx.rotate(Math.sin(clock * 20) * 0.15);
      ctx.fillStyle = '#e8384f'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  function makeBuster() {
    const b = {x: PORCH.chairX - 52, y: G, f: -1, mode: 'nap', phase: 0, timer: rand(12, 20), t: 0, vx: 0, laps: 0,
      dest: null, hasDisc: false, throws: 0, bark: 0, front: true};
    const announce = sub => { banner = {title: 'BUSTER!', sub, life: 4}; };
    const pick = list => list[Math.floor(Math.random() * list.length)];
    // knock over any stickman he runs into
    const bowl = () => {
      for (const e of enemies) if (!e.dead && !e.launched && Math.abs(e.x - b.x) < 22 && Math.abs(e.y - b.y) < 40) {
        launch(e, b.f, 1); texts.push({x: e.x, y: e.y - 92, s: 'BOWLED!', life: 0.6, big: false});
      }
    };
    const runTo = (x, speed, dt) => {
      const d = x - b.x; b.f = Math.sign(d) || b.f;
      b.x += clamp(d, -speed * dt, speed * dt); b.phase += dt * speed * 0.06;
      return Math.abs(d) < 4;
    };

    function nap() { announce(pick(['He went to lie down by Grandpa.', 'Good boy. Very tired good boy.', 'He has earned a nap.'])); b.mode = 'run'; b.dest = PORCH.chairX - 52; b.then = 'nap'; }
    function zoomies() { announce(pick(['ZOOMIES.', 'He has too much energy.', 'Nobody knows why. He just has to.'])); b.mode = 'zoom'; b.laps = 4; b.f = b.x < W / 2 ? 1 : -1; }
    function herd() {
      if (enemies.filter(e => !e.dead).length < 3) return zoomies();
      announce(pick(["Herding. It's what he does.", 'He is rounding them up.', 'Everyone get in a nice tidy group.']));
      b.mode = 'herd'; b.t = 3.5;
      const live = enemies.filter(e => !e.dead);
      b.herdX = clamp(live.reduce((s, e) => s + e.x, 0) / live.length, 120, W - 120);
    }
    function fetch() {
      announce(pick(['He brought his frisbee. Throw it.', 'He would like you to throw this.', 'Throw it. THROW IT.']));
      b.mode = 'run'; b.hasDisc = true; b.then = 'give'; b.throws = 0;
    }
    const EVENTS = {nap, zoomies, herd, fetch};
    arena.busterTime = kind => (EVENTS[kind] || nap)();

    b.update = dt => {
      b.bark = Math.max(0, b.bark - dt);
      // the finale: run alongside Grandpa's mower, barking
      if (arena.mower && arena.mower.on) {
        b.mode = 'mower'; b.hasDisc = false; frisbee = null; b.y = G;
        runTo(clamp(arena.mower.x - arena.mower.dir * 70, 20, W - 20), 420, dt);
        b.f = arena.mower.dir;
        if (Math.random() < dt * 1.2) b.bark = 0.5;
        return;
      }
      if (b.mode === 'mower') { b.mode = 'run'; b.dest = PORCH.chairX - 52; b.then = 'nap'; }
      if (b.mode === 'run') {
        const tx = b.then === 'give' ? clamp(player.x - player.facing * 30, 20, W - 20) : b.dest;
        if (runTo(tx, 460, dt) || (b.then === 'give' && Math.abs(player.x - b.x) < 40)) {
          if (b.then === 'nap') { b.mode = 'nap'; }
          else if (b.then === 'give') { b.hasDisc = false; frisbee = {st: 'ready', t: 9}; b.mode = 'stare'; b.f = Math.sign(player.x - b.x) || 1; }
        }
      } else if (b.mode === 'zoom') {
        b.x += b.f * 620 * dt; b.phase += dt * 36;
        // leap over you
        if (!b.jump && Math.abs(player.x - b.x) < 70 && Math.sign(player.x - b.x) === b.f && Math.abs(player.y - G) < 30) b.jump = {t: 0};
        if (b.jump) { b.jump.t += dt; b.y = G - Math.sin(Math.min(1, b.jump.t / 0.4) * Math.PI) * 90; if (b.jump.t >= 0.4) { b.jump = null; b.y = G; } }
        bowl();
        if (b.x < 20 || b.x > W - 20) { b.x = clamp(b.x, 20, W - 20); b.f *= -1; b.laps--; if (b.laps <= 0) { b.mode = 'run'; b.dest = PORCH.chairX - 52; b.then = 'nap'; } }
      } else if (b.mode === 'herd') {
        b.t -= dt;
        // circle the group, pushing everyone toward the middle of it
        const side = Math.sin(clock * 3) > 0 ? 1 : -1;
        runTo(b.herdX + side * 90, 520, dt);
        for (const e of enemies) if (!e.dead && !e.launched) { e.x += (b.herdX + (e.x > b.herdX ? 8 : -8) - e.x) * Math.min(1, dt * 3); e.vx *= 0.5; }
        if (Math.random() < dt * 2) b.bark = 0.4;
        if (b.t <= 0) { texts.push({x: b.herdX, y: G - 120, s: 'HERDED', life: 1, big: false}); b.mode = 'sit'; b.timer = Math.min(b.timer, rand(14, 20)); }
      } else if (b.mode === 'stare') {
        b.f = Math.sign(player.x - b.x) || b.f;
        if (Math.abs(player.x - b.x) > 60) runTo(player.x - b.f * 40, 300, dt);
        if (frisbee && frisbee.st === 'ready') {
          frisbee.t -= dt;
          if (frisbee.t <= 0) { frisbee = null; texts.push({x: b.x, y: b.y - 50, s: '...', life: 1, big: false}); b.mode = 'run'; b.dest = PORCH.chairX - 52; b.then = 'nap'; }
        }
      } else if (b.mode === 'fetch') {
        // after the frisbee: anything in his way gets bowled over
        if (frisbee) {
          const done = runTo(frisbee.x, 560, dt); bowl();
          if (frisbee.st === 'fly' && frisbee.y < G - 30 && Math.abs(frisbee.x - b.x) < 60 && !b.jump) b.jump = {t: 0};
          if (b.jump) { b.jump.t += dt; b.y = G - Math.sin(Math.min(1, b.jump.t / 0.45) * Math.PI) * Math.min(160, G - frisbee.y); if (b.jump.t >= 0.45) { b.jump = null; b.y = G; } }
          if (frisbee.age > 0.45 && (done || Math.abs(frisbee.x - b.x) < 16) && Math.abs(frisbee.y - (b.y - 20)) < 60) {
            frisbee = null; b.hasDisc = true; b.mode = 'return'; b.jump = null; b.y = G;
            texts.push({x: b.x, y: b.y - 60, s: 'CAUGHT IT!', life: 0.9, big: false});
          }
        }
      } else if (b.mode === 'return') {
        if (runTo(clamp(player.x - player.facing * 30, 20, W - 20), 460, dt) || Math.abs(player.x - b.x) < 40) {
          b.hasDisc = false; b.throws++;
          if (b.throws >= 3) { texts.push({x: b.x, y: b.y - 50, s: 'pant pant', life: 1, big: false}); b.mode = 'run'; b.dest = PORCH.chairX - 52; b.then = 'nap'; }
          else { frisbee = {st: 'ready', t: 9}; b.mode = 'stare'; }
        }
      }
      // the frisbee in flight
      if (frisbee && frisbee.st === 'fly') {
        frisbee.age += dt; frisbee.vy += 120 * dt; frisbee.x += frisbee.vx * dt; frisbee.y += frisbee.vy * dt; frisbee.vx *= 1 - dt * 0.35;
        if (frisbee.x < 12 || frisbee.x > W - 12) { frisbee.vx *= -0.5; frisbee.x = clamp(frisbee.x, 12, W - 12); }
        if (frisbee.y >= G - 4) { frisbee.y = G - 4; frisbee.st = 'ground'; }
      }
      // pick a new thing to do
      if (state !== 'play' || cine || banner || boss) return;
      if (b.mode !== 'nap' && b.mode !== 'sit') return;
      b.timer -= dt;
      if (b.timer > 0) return;
      b.timer = rand(18, 28);
      const r = Math.random();
      if (r < 0.35) nap(); else if (r < 0.6) zoomies(); else if (r < 0.8) herd(); else fetch();
    };
    b.draw = () => drawBuster(b);
    return b;
  }

  ARENAS['grandpas-farm'] = {
    id: 'grandpas-farm', number: 5, name: "Grandpa's Farm",
    plats: [
      {x: 70, y: 158, w: 116},    // the barn's loft door
      {x: 254, y: 332, w: 102},   // hay bales
      {x: 280, y: 298, w: 50},    // the top bale
      {x: 420, y: 288, w: 46},    // tractor cab roof
      {x: 458, y: 336, w: 76},    // tractor hood
      {x: 542, y: 340, w: 88},    // chicken coop roof
      {x: 606, y: 222, w: 194},   // porch roof
    ],
    bossLoop: ['giant', 'rooster', 'giant', 'grandpa'],
    grandpa, PORCH, COOP_X, drawGrandpa,
    get buster() { return buster; },
    // out of the barn doors, up the lane on the right, or popping out of the corn
    spawnPoint() {
      const r = Math.random();
      if (r < 0.4) return {x: BARN_DOOR + rand(-30, 30), y: G, air: false};
      if (r < 0.75) return {x: W + 15, y: G, air: false};
      return {x: rand(270, 620), y: G - 40, air: true, vx: rand(-60, 60), vy: -420};
    },
    drawStage: drawFarm,
    // the mower cuts the grass it passes over (Grandpa's finale)
    mowGrass(x0, x1) { for (const t of tufts) if (t.x > x0 && t.x < x1) t.h = 0; },
    // a shot can throw Buster's frisbee instead
    fireHook(ang) {
      if (!frisbee || frisbee.st !== 'ready') return false;
      frisbee = {st: 'fly', age: 0, x: player.x + Math.cos(ang) * 20, y: player.y - 50, vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 520 - 90};
      if (buster) { buster.mode = 'fetch'; buster.jump = null; }
      texts.push({x: player.x, y: player.y - 96, s: 'GO BUSTER!', life: 0.8, big: false});
      return true;
    },
    get frisbee() { return frisbee; },
    setup() {
      grandpa.st = 'chair'; grandpa.rock = 0;
      tufts = []; for (let x = 6; x < W; x += 14) tufts.push({x: x + rand(-3, 3), h: rand(7, 12), max: rand(8, 13)});
      frisbee = null; this.mower = null;
      buster = makeBuster();
      props.push({update: dt => {
        grandpa.rock += dt * 1.4;
        for (const t of tufts) if (t.h < t.max) t.h = Math.min(t.max, t.h + dt * 0.6);
      }, draw: drawDisc, front: true}, buster);
    },
  };
})();
