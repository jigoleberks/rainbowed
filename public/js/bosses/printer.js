/* The Printer: the Waiting Room's sub-boss. The office printer on the filing cabinet wakes up,
   beeps angrily, hops down and scoots around on its little wheels firing sheets of paper at
   you like throwing stars. Every so often it jams: PAPER JAM, it stops dead, and it takes
   double damage. That's your moment. Beaten, it's OUT OF TONER, smoking on the cabinet. */

function printerTouch(b) {
  if (state !== 'play' || invuln > 0 || player.kickT > 0 || rainbowT > 0) return;
  if (hp <= 1) deathTitle = 'Paper cut.';
  hurt(b);
}

function updatePrinter(b, dt, fighting) {
  const dx = player.x - b.x;
  b.blink += dt;
  // flying paper
  for (const s of b.sheets) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.rot += dt * 14; s.life -= dt;
    for (const e of enemies) if (!e.dead && Math.abs(e.x - s.x) < 12 && s.y > e.y - 78 && s.y < e.y) { kill(e, s.vx, s.vy, false); s.life = 0; }
    if (state === 'play' && s.life > 0 && invuln <= 0 && rainbowT <= 0 && Math.abs(player.x - s.x) < 12 && s.y > player.y - 78 && s.y < player.y + 2) {
      if (hp <= 1) deathTitle = 'Paper cut.';
      hurt({x: s.x - s.vx * 0.01}); s.life = 0;
    }
    if (s.y > G || s.x < -20 || s.x > W + 20) s.life = 0;
  }
  b.sheets = b.sheets.filter(s => s.life > 0);
  const pr = arena.wr ? arena.wr.printer : {};
  switch (b.st) {
    case 'wake':
      // beep. beep. BEEP.
      b.t -= dt;
      if (b.t < 1.4 && !b.beeped) { b.beeped = true; texts.push({x: b.x, y: b.y - 80, s: 'BEEP', life: 0.5, big: false}); }
      if (b.t < 0.9 && !b.beeped2) { b.beeped2 = true; texts.push({x: b.x, y: b.y - 90, s: 'BEEP BEEP', life: 0.5, big: false}); }
      if (b.t <= 0) {
        b.st = 'move'; b.vy = -420; b.vx = -160; b.onGround = false; b.cd = 1.2; b.jamT = rand(6, 8);
        banner = {title: 'THE PRINTER', sub: 'It woke up. It has paper. Kick it when it jams.', life: 2.8};
      }
      return;
    case 'move': {
      if (!fighting) break;
      b.facing = Math.sign(dx) || b.facing;
      // keep a comfortable firing distance, and now and then just ram you
      const want = clamp(player.x - b.facing * 220, 50, W - 50);
      b.vx += ((Math.abs(want - b.x) > 12 ? Math.sign(want - b.x) * (170 + b.level * 25) : 0) - b.vx) * Math.min(1, dt * 4);
      b.cd -= dt; b.jamT -= dt;
      if (b.jamT <= 0) { b.st = 'jam'; b.t = 2.6; b.vx = 0; texts.push({x: b.x, y: b.y - 80, s: 'PAPER JAM', life: 1.2, big: false}); }
      else if (b.cd <= 0) { b.st = Math.random() < 0.25 ? 'ram' : 'feed'; b.t = b.st === 'ram' ? 0.35 : 0.45; b.vx = 0; }
      break;
    }
    case 'feed':
      // paper sticks out... then it fires
      b.t -= dt; b.vx = 0;
      if (b.t <= 0) {
        const a0 = Math.atan2(player.y - 40 - (b.y - 30), dx), n = 3 + (b.level > 0 ? 2 : 0);
        for (let i = 0; i < n; i++) {
          const a = a0 + (i - (n - 1) / 2) * 0.16;
          b.sheets.push({x: b.x + Math.cos(a) * 30, y: b.y - 30, vx: Math.cos(a) * (380 + b.level * 40), vy: Math.sin(a) * (380 + b.level * 40), rot: 0, life: 3});
        }
        b.st = 'move'; b.cd = rand(1.2, 1.9) - b.level * 0.2;
      }
      break;
    case 'ram':
      b.t -= dt;
      if (b.t <= 0 && !b.ramming) { b.ramming = true; b.vx = b.facing * (520 + b.level * 40); b.t = 0.7; texts.push({x: b.x, y: b.y - 70, s: '!', life: 0.4, big: false}); }
      else if (b.t <= 0) { b.ramming = false; b.st = 'move'; b.cd = 1.4; }
      break;
    case 'jam':
      b.t -= dt; b.vx = 0;
      if (b.t <= 0) { b.st = 'move'; b.cd = 0.8; b.jamT = rand(6, 8.5) - b.level * 0.5; }
      break;
  }
  physics(b, dt, false);
  if (b.x < 40) { b.x = 40; b.vx = Math.abs(b.vx); }
  if (b.x > W - 40) { b.x = W - 40; b.vx = -Math.abs(b.vx); }
  if (b.st !== 'wake' && Math.abs(player.x - b.x) < 40 && player.y > b.y - 46 && player.y - 70 < b.y) printerTouch(b);
}

BOSSES.printer = {
  name: 'THE PRINTER', ko: 'OUT OF TONER', koSub: 'Someone call IT.', koCaption: 'Have you tried turning it off and on again?', pts: 7500, koZoom: 2.2,
  warning: 'The printer is making a noise.',
  spawn(level) {
    const p = arena.PRINTER || {x: W - 170, y: 290};
    if (arena.wr) arena.wr.printer = {st: 'boss'};
    return {x: p.x, y: p.y, vx: 0, vy: 0, onGround: true, facing: -1, phase: 0, scale: 1, hp: 45 + level * 14,
      st: 'wake', t: 1.8, cd: 1, jamT: 7, blink: 0, sheets: [], hitT: 0, name: 'THE PRINTER'};
  },
  update(b, dt, fighting) { updatePrinter(b, dt, fighting); },
  draw(b) {
    for (const s of b.sheets) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.scale(1, Math.abs(Math.cos(s.rot * 0.7)) * 0.8 + 0.2);
      ctx.fillStyle = PAPER; ctx.fillRect(-9, -11, 18, 22); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(-9, -11, 18, 22);
      ctx.strokeStyle = MUTED; ctx.lineWidth = 1; for (let k = -6; k < 8; k += 4) line(-6, k, 6, k);
      ctx.restore();
    }
    if (b.exploded || !arena.drawPrinterBox) return;
    const jam = b.st === 'jam', wake = b.st === 'wake';
    const light = jam ? (Math.floor(b.blink * 6) % 2 ? '#f39a1f' : '#1d1b22') : wake ? (Math.floor(b.blink * 8) % 2 ? '#e8384f' : '#4fb35a') : '#4fb35a';
    const paper = b.st === 'feed' ? 1 - b.t / 0.45 : jam ? 0.5 : 0;
    arena.drawPrinterBox(b.x, b.y, {hit: b.hitT > 0, light, screen: jam ? 'PAPER JAM' : wake ? 'WARMING' : b.st === 'ram' ? '!!!' : 'PRINTING', paper, wheels: true});
    if (jam) { ctx.font = '13px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = '#f39a1f'; ctx.fillText('JAMMED', b.x, b.y - 66); }
  },
  zone(b, x, y, pad) {
    if (b.st === 'wake') return 0;
    if (Math.abs(x - b.x) < 36 + pad && y > b.y - 56 && y < b.y + 4) return y < b.y - 44 ? 2 : 1;
    return 0;
  },
  // jammed, it takes double
  onHit(b, dmg) { return b.st === 'jam' ? dmg * 2 : dmg; },
  aimPoint(b) { return b.st === 'wake' ? null : {x: b.x, y: b.y - 28, d: Math.hypot(b.x - player.x, (b.y - player.y) * 1.3)}; },
  koY(b) { return b.y - 28; },
  explode(b) {
    b.exploded = true;
    burst(b.x, b.y - 28, 0, -300, 100);
    for (let i = 0; i < 16; i++) parts.push({x: b.x + rand(-20, 20), y: b.y - 30, vx: rand(-260, 260), vy: -rand(150, 420), h: 0, r: rand(2.5, 4), life: 1.6, spark: true, ink: true, col: PAPER});
    shake = 14;
    for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 28, r: 6 + i * 26, life: 0.35 + i * 0.1});
    // back on its cabinet, smoking, for a while
    if (arena.wr) arena.wr.printer = {st: 'broken', t: 10};
  },
};
