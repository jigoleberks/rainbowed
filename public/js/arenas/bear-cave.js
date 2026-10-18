/* Arena 4: The Bear Cave. A huge bear sleeps in the middle of the cave the whole time.
   - Its back is a shelf, and landing on its belly bounces you high.
   - It snores: big Zs drift up out of its mouth, and you can stand on them until they fade.
   - Gunfire is loud. Shoot too much and it grumbles in its sleep, the cave shakes and
     stalactites fall (on you, or on the stickmen). Kicks are quiet.
   - Stickmen walk in from the cave mouths, or drop through the crack in the roof.
   The bear never wakes up. The Cub (50) bursts out of it; the Clown Car (100) is every bear
   that was somehow in there. */

(() => {
  const BX = 392;                         // the middle of the sleeping bear
  const BACK = {x: 296, y: 286, w: 196};  // its back, as a shelf
  // over the ledges, the bear, and the gaps down to the floor (none over the crack in the roof)
  const STALS = [96, 210, 283, 340, 452, 511, 590, 704];
  const NOISE_MAX = 14;                   // shots (minus quiet time) before it grumbles

  // the bear's state, shared with the Cub and the Clown Car
  const bear = {breath: 0, squash: 0, stir: 0, bulge: 0, eye: 0, flipped: false, roll: 0, snoring: true};
  let noise = 0, lastShots = 0, snoreT = 2, stals = [], prevVy = 0, prevGround = true;

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
  // where the bear's mouth is (its head is on the right, or the left after it rolls over)
  const mouth = () => ({x: bear.flipped ? 2 * BX - 590 : 590, y: G - 52});

  // ---------- the sleeping bear ----------
  function drawBear() {
    const br = Math.sin(bear.breath) * 0.035 + bear.bulge * 0.06;
    const sq = bear.squash > 0 ? Math.sin(bear.squash * 30) * bear.squash * 0.25 : 0;
    const twitch = bear.stir > 0 ? Math.sin(bear.stir * 50) * 3 : 0;
    const rollShake = bear.roll > 0 ? Math.sin(bear.roll * 26) * 10 * bear.roll : 0;
    ctx.save();
    ctx.translate(BX + twitch + rollShake, G);
    if (bear.flipped) ctx.scale(-1, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // back leg and paw, tucked in front
    ctx.fillStyle = '#9a6a48'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    // body, breathing
    ctx.save(); ctx.scale(1, 1 + br - sq);
    ctx.beginPath(); ctx.ellipse(0, -58, 150, 62, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // fur strokes
    ctx.strokeStyle = '#6e4a30'; ctx.lineWidth = 2;
    for (const [fx, fy] of [[-110, -72], [-80, -96], [-40, -106], [0, -110], [40, -106], [80, -96], [-120, -45], [110, -60]])
      { line(fx, fy, fx + 8, fy - 6); line(fx + 10, fy + 2, fx + 18, fy - 4); }
    // the belly patch, and the bulge when something wants out
    ctx.fillStyle = '#c99c74'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    const wob = bear.bulge * Math.sin(clock * 22) * 5;
    ctx.beginPath(); ctx.ellipse(-10 + wob, -26 - bear.bulge * 10, 78 + bear.bulge * 14, 26 + bear.bulge * 30 + wob, 0, Math.PI, 0, true); ctx.fill(); ctx.stroke();
    ctx.restore();
    // paws
    for (const px of [-118, -70, 66, 104]) {
      ctx.fillStyle = '#9a6a48'; ctx.beginPath(); ctx.ellipse(px, -6, 20, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.lineWidth = 1.5; line(px - 6, -9, px - 6, -3); line(px, -10, px, -2); line(px + 6, -9, px + 6, -3);
    }
    // head, resting on its paws
    const hx = 158, hy = -52;
    ctx.fillStyle = '#9a6a48'; ctx.lineWidth = 3;
    for (const ex of [-22, 14]) { ctx.beginPath(); ctx.arc(hx + ex, hy - 34, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#c99c74'; for (const ex of [-22, 14]) { ctx.beginPath(); ctx.arc(hx + ex, hy - 34, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#9a6a48'; ctx.beginPath(); ctx.arc(hx, hy, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c99c74'; ctx.beginPath(); ctx.ellipse(hx + 24, hy + 10, 24, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(hx + 40, hy + 4, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2.5;
    // eye: shut, or (just once) open
    if (bear.eye > 0.05) {
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.ellipse(hx + 6, hy - 12, 9, 9 * bear.eye, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 6 + (bear.flipped ? 3 : -3), hy - 12, 3.5 * bear.eye, 0, Math.PI * 2); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(hx + 6, hy - 14, 8, 0.35, Math.PI - 0.35); ctx.stroke(); }
    // mouth, slightly open while snoring
    ctx.beginPath(); ctx.arc(hx + 30, hy + 20, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
    // grumbling
    if (bear.stir > 0) {
      const m = mouth();
      ctx.font = '20px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = INK;
      ctx.fillText('GRRMPH', m.x - (bear.flipped ? -20 : 20), m.y - 70);
    } else if (noise > NOISE_MAX * 0.6 && bear.snoring) {
      const m = mouth();
      ctx.font = '16px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = MUTED;
      ctx.fillText('mmh?', m.x, m.y - 64);
    }
  }

  // ---------- the cave ----------
  function drawCave() {
    // back wall
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(0, 0, W, G);
    // rock texture: a few cracks and strata
    ctx.strokeStyle = '#cfc6b4'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const [x, y, w] of [[60, 120, 90], [250, 80, 70], [520, 100, 110], [690, 140, 70], [140, 330, 60], [640, 340, 90], [240, 230, 50], [470, 220, 60]])
      { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y - 10, x + w, y + 4); ctx.stroke(); }
    // daylight through the crack in the roof
    ctx.fillStyle = 'rgba(255, 238, 170, 0.35)';
    ctx.beginPath(); ctx.moveTo(374, 0); ctx.lineTo(426, 0); ctx.lineTo(500, G); ctx.lineTo(300, G); ctx.closePath(); ctx.fill();
    // cave mouths on both sides: daylight outside
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? 0 : W;
      ctx.fillStyle = '#fbf6e2'; ctx.beginPath(); ctx.moveTo(x0, G); ctx.lineTo(x0, 200);
      ctx.quadraticCurveTo(x0 - s * 70, 190, x0 - s * 64, G); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, 200); ctx.quadraticCurveTo(x0 - s * 70, 190, x0 - s * 64, G); ctx.stroke();
      // a tuft of grass outside
      ctx.strokeStyle = '#4f9a5a'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { const gx = x0 - s * (14 + k * 12); line(gx, G, gx - 4, G - 12); line(gx, G, gx + 4, G - 10); }
    }
    // the ceiling and stalactites
    ctx.fillStyle = '#d8cfbd'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 22);
    for (let x = W; x >= 0; x -= 40) ctx.lineTo(x, 22 + Math.sin(x * 0.07) * 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(374, 0, 52, 30);       // the crack
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 22); for (let x = 0; x <= 374; x += 40) ctx.lineTo(x, 22 + Math.sin(x * 0.07) * 6); ctx.lineTo(374, 26); ctx.lineTo(384, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(416, 0); ctx.lineTo(426, 26); for (let x = 440; x <= W; x += 40) ctx.lineTo(x, 22 + Math.sin(x * 0.07) * 6); ctx.stroke();
    for (const s of stals) {
      if (s.st === 'gone' || s.st === 'fall') continue;
      const wob = s.st === 'shake' ? Math.sin(clock * 60) * 2 : 0, k = s.st === 'grow' ? s.grow : 1;
      shape([s.x - 12 + wob, 24, s.x + 12 + wob, 24, s.x + wob, 24 + 40 * k], '#cbbfa8', 2.5);
    }
    // glowing crystals in the walls, the cave's only colour
    const crystal = (x, y, h, c) => {
      ctx.fillStyle = `hsl(${c} 80% 70% / 0.35)`; ctx.beginPath(); ctx.arc(x, y - h / 2, h * 0.9, 0, Math.PI * 2); ctx.fill();
      shape([x - 6, y, x - 8, y - h * 0.6, x, y - h, x + 8, y - h * 0.6, x + 6, y], `hsl(${c} 75% 62%)`, 2);
    };
    crystal(40, 250, 26, 280); crystal(54, 252, 18, 190); crystal(744, 254, 24, 140); crystal(206, 176, 18, 320);
    crystal(588, 176, 20, 50); crystal(770, 250, 16, 200);
    // the floor
    ctx.fillStyle = '#d9cfbb'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#b9ad95'; ctx.lineWidth = 1.5;
    for (let x = -40; x < W; x += 16) line(x, G + 52, x + 40, G + 6);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);
    // a fish skeleton and an empty honey jar
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    line(150, G - 4, 196, G - 4); for (let k = 0; k < 4; k++) { line(160 + k * 9, G - 11, 160 + k * 9, G + 3); }
    ctx.beginPath(); ctx.arc(146, G - 4, 6, 0, Math.PI * 2); ctx.stroke(); shape([196, G - 4, 206, G - 12, 206, G + 4], null, 2);
    box(660, G - 26, 24, 26, '#f2c94c', 2.5); box(656, G - 32, 32, 7, '#c49a3a', 2);
    ctx.fillStyle = INK; ctx.font = '600 8px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('HONEY', 672, G - 10);
    // rock ledges
    for (const p of PLATS) {
      if (p.bear || p.z) continue;
      shape([p.x, p.y, p.x + p.w, p.y, p.x + p.w - 10, p.y + 16, p.x + 14, p.y + 22], '#cbbfa8', 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; line(p.x, p.y, p.x + p.w, p.y);
    }
    drawBear();
    // snores you can stand on: the bottom stroke of each Z is the ledge
    for (const p of PLATS) {
      if (!p.z) continue;
      ctx.globalAlpha = Math.min(1, p.life / 1.2, (p.age || 0) * 4);
      const h = 26, x0 = p.x + 4, x1 = p.x + p.w - 4;
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, p.y - h); ctx.lineTo(x1, p.y - h); ctx.lineTo(x0, p.y); ctx.lineTo(x1, p.y); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  }

  // falling stalactites (drawn in front of the action)
  function drawFalling() {
    for (const s of stals) if (s.st === 'fall') {
      shape([s.x - 12, s.y - 40, s.x + 12, s.y - 40, s.x, s.y], '#cbbfa8', 2.5);
    }
  }

  // ---------- behaviour ----------
  function grumble() {
    bear.stir = 1.1; noise = 0; shake = Math.max(shake, 10);
    // two or three stalactites come loose, nearest the noise first
    const hanging = stals.filter(s => s.st === 'hang').sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x));
    hanging.slice(0, 2 + (Math.random() < 0.5 ? 1 : 0)).forEach((s, i) => { s.st = 'shake'; s.t = 0.7 + i * 0.25; });
  }

  function updateStals(dt) {
    for (const s of stals) {
      if (s.st === 'shake') {
        s.t -= dt;
        if (Math.random() < dt * 20) parts.push({x: s.x + rand(-6, 6), y: 30, vx: rand(-10, 10), vy: rand(20, 60), h: 0, r: 1.2, life: 0.6, spark: true, ink: true, col: '#b9ad95'});
        if (s.t <= 0) { s.st = 'fall'; s.y = 64; s.vy = 0; }
      } else if (s.st === 'fall') {
        const py = s.y;
        s.vy += 1400 * dt; s.y += s.vy * dt;
        // stickmen underneath get rainbowed
        for (const e of enemies) if (!e.dead && Math.abs(e.x - s.x) < 16 && s.y > e.y - 80 && s.y < e.y) kill(e, 0, 300, true);
        if (state === 'play' && invuln <= 0 && rainbowT <= 0 && !player.dead && Math.abs(player.x - s.x) < 14 && s.y > player.y - 78 && s.y < player.y) {
          if (hp <= 1) deathTitle = 'Shh. You woke the ceiling.';
          hurt({x: s.x});
        }
        const ly = landY(s.x, py, s.y);
        if (ly !== null || s.y > G) {
          const y = ly !== null ? ly : G;
          // bonk, on the bear: it squishes and keeps sleeping
          if (Math.abs(y - BACK.y) < 1 && s.x > BACK.x && s.x < BACK.x + BACK.w) { bear.squash = 0.4; texts.push({x: s.x, y: y - 30, s: 'zzz', life: 0.8, big: false}); }
          for (let i = 0; i < 4; i++) debris.push({x: s.x + rand(-6, 6), y: y - 6, ang: rand(0, 3), len: rand(6, 12), lw: 4, vx: rand(-160, 160), vy: -rand(150, 300), va: rand(-12, 12), life: 1.5, head: false});
          dust(s.x, y, 10, 14);
          s.st = 'gone'; s.t = rand(6, 10);
        }
      } else if (s.st === 'gone') {
        s.t -= dt; if (s.t <= 0) { s.st = 'grow'; s.grow = 0; }
      } else if (s.st === 'grow') {
        s.grow += dt * 0.8; if (s.grow >= 1) s.st = 'hang';
      }
    }
  }

  function snore() {
    const m = mouth();
    const dir = bear.flipped ? 1 : -1;
    PLATS.push({x: m.x - 24 + dir * 10, y: m.y - 18, w: 48, z: true, life: 6.5, age: 0, drift: dir * rand(4, 10)});
  }

  function update(dt) {
    bear.breath += dt * (bear.snoring ? 1.6 : 0.6);
    bear.squash = Math.max(0, bear.squash - dt);
    bear.stir = Math.max(0, bear.stir - dt);
    bear.roll = Math.max(0, bear.roll - dt);
    // noise: every shot counts, quiet time lets it settle
    const shots = shotsFired - lastShots; lastShots = shotsFired;
    if (state === 'play' && bear.snoring) {
      noise = Math.max(0, noise + shots - dt * 3);
      if (noise >= NOISE_MAX && bear.stir <= 0) grumble();
    }
    // snoring
    if (bear.snoring && bear.stir <= 0) { snoreT -= dt; if (snoreT <= 0) { snoreT = rand(1.8, 2.8); snore(); } }
    for (const p of PLATS) if (p.z) { p.life -= dt; p.age += dt; p.y -= 28 * dt; p.x += p.drift * dt; }
    for (let i = PLATS.length - 1; i >= 0; i--) if (PLATS[i].z && (PLATS[i].life <= 0 || PLATS[i].y < 40)) PLATS.splice(i, 1);
    updateStals(dt);
    // the belly is a trampoline: land on it hard and it throws you back up
    const onBack = o => o.onGround && Math.abs(o.y - BACK.y) < 1 && o.x > BACK.x && o.x < BACK.x + BACK.w;
    if (!player.dead && onBack(player) && !prevGround && prevVy > 260) {
      player.vy = -Math.min(900, 560 + prevVy * 0.3); player.onGround = false; player.jumps = 1; player.airKick = true;
      bear.squash = 0.35;
    }
    prevVy = player.vy; prevGround = player.onGround;
    for (const e of enemies) {
      if (onBack(e) && e._pg === false && e._pvy > 260) { e.vy = -560; e.onGround = false; bear.squash = 0.3; }
      e._pg = e.onGround; e._pvy = e.vy;
    }
  }

  ARENAS['bear-cave'] = {
    id: 'bear-cave', number: 4, name: 'The Bear Cave',
    plats: [
      {x: 30, y: 262, w: 140},    // left ledge
      {x: 630, y: 262, w: 140},   // right ledge
      {x: 150, y: 168, w: 120},   // high left
      {x: 530, y: 168, w: 120},   // high right
      {...BACK, bear: true},      // the bear's back
    ],
    bossLoop: ['giant', 'cub', 'giant', 'clowncar'],
    bear, BX,
    belly: () => ({x: BX - 10, y: G - 40}),
    // in from the cave mouths, or dropping through the crack in the roof (sometimes onto the bear)
    spawnPoint() {
      if (Math.random() < 0.25) return {x: rand(378, 422), y: -20, air: true};
      return Math.random() < 0.5 ? {x: -15, y: G, air: false} : {x: W + 15, y: G, air: false};
    },
    drawStage: drawCave,
    // paint doesn't stick to the snores: they drift away and would leave streaks in mid-air
    onSplat(x, y) { return !PLATS.some(p => p.z && x > p.x && x < p.x + p.w && Math.abs(y - p.y) < 1); },
    setup() {
      Object.assign(bear, {breath: 0, squash: 0, stir: 0, bulge: 0, eye: 0, flipped: false, roll: 0, snoring: true});
      noise = 0; lastShots = shotsFired; snoreT = 1.5; prevVy = 0; prevGround = true;
      stals = STALS.map(x => ({x, st: 'hang', t: 0, y: 0, vy: 0, grow: 1}));
      PLATS = PLATS.filter(p => !p.z);
      props.push({update, draw: drawFalling, front: true});
    },
    // for tests and the curious: how close the bear is to grumbling
    get noise() { return noise; },
    grumble,
  };
})();
