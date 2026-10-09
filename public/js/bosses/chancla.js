/* La Chancla: Grandma's House finale. A tiny, unbothered grandma who lobs fuzzy slippers that
   burst into rainbow splats. She's after the mess, not the hero, so her slippers rainbow
   stickmen too. Survive 45 seconds and her show comes on. Knock her health to zero and she
   just sits down anyway. */

const CHANCLA_TIME = 45, SLIPPER = '#f2a7c3', DRESS = '#efe8f4', CARDI = '#c7b8d8';

// Grandma, feet at (x, y). pose: idle | mug | wind | throw | pocket | sit
function drawGrandma(x, y, f, pose, o = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(0.85, 0.85);
  ctx.strokeStyle = o.hit ? ACCENT : INK; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const sit = pose === 'sit', step = Math.sin(o.phase || 0) * 3;
  const slipper = (sx, sy) => { ctx.fillStyle = SLIPPER; ctx.beginPath(); ctx.ellipse(sx, sy, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 3.2; };
  // legs and slippers
  if (sit) {
    poly([-2, -10, f * 12, -8, f * 14, 14]); poly([2, -10, f * 16, -8, f * 18, 14]);
    slipper(f * 16, 16); slipper(f * 20, 16);
  } else {
    line(-4, -14, -4 + step, -2); line(4, -14, 4 - step, -2);
    slipper(-4 + step + f * 2, 0);
    if (!(o.bare > 0)) slipper(4 - step + f * 2, 0); else line(4 - step, -2, 4 - step + f * 4, -1);
  }
  const by = sit ? -10 : -14;           // hem
  // dress and cardigan
  ctx.beginPath(); ctx.moveTo(-7 + f * 3, by - 32); ctx.lineTo(7 + f * 3, by - 32); ctx.lineTo(15, by); ctx.lineTo(-15, by); ctx.closePath();
  ctx.fillStyle = DRESS; ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  for (const [dx, dy] of [[-6, -8], [5, -14], [-2, -22], [8, -5]]) { ctx.beginPath(); ctx.arc(dx, by + dy, 1.3, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = o.hit ? ACCENT : '#7d6a93'; ctx.lineWidth = 3;
  poly([-7 + f * 3, by - 32, -11, by - 10]); poly([7 + f * 3, by - 32, 11, by - 10]);
  ctx.strokeRect(f * 7 - 3, by - 12, 6, 5);
  ctx.strokeStyle = o.hit ? ACCENT : INK; ctx.lineWidth = 3.2;
  // hunched neck and head
  const sx = f * 3, sy = by - 32, hx = f * 10, hy = sy - 11;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(f * 2, sy - 8, hx - f * 3, hy + 5); ctx.stroke();
  ctx.fillStyle = '#c9c6c0'; ctx.beginPath(); ctx.arc(hx - f * 6, hy - 7, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(hx + f * 4.5, hy - 1, 3, 0, Math.PI * 2); ctx.stroke(); line(hx + f * 1.5, hy - 1.5, hx - f * 4, hy - 2.5);
  ctx.lineWidth = 3.2;
  // arms
  const A = (ex, ey, hx2, hy2) => poly([sx, sy + 2, ex, ey, hx2, hy2]);
  if (pose === 'wind') { A(-f * 6, sy - 6, -f * 12, sy - 18); slipper(-f * 12, sy - 22); }
  else if (pose === 'throw') A(f * 10, sy - 6, f * 18, sy - 14);
  else if (pose === 'pocket') A(f * 6, sy + 10, f * 7, by - 9);
  else if (pose === 'mug' || pose === 'sit') {
    A(f * 9, sy + 10, f * 14, sy + 6);
    if (pose === 'mug') { ctx.fillStyle = '#d9574a'; ctx.fillRect(f * 14 - 4, sy - 2, 8, 9); ctx.lineWidth = 2; ctx.strokeRect(f * 14 - 4, sy - 2, 8, 9); }
  } else A(f * 7, sy + 12, f * 11, sy + 20);
  ctx.restore();
}

function slipperBurst(s) {
  s.done = true;
  burst(s.x, s.y - 4, 0, -200, 34);
  rings.push({x: s.x, y: s.y - 4, r: 6, life: 0.3});
  shake = Math.max(shake, 5);
  for (const e of enemies) if (!e.dead && Math.hypot(e.x - s.x, e.y - 30 - s.y) < 60) kill(e, Math.sign(e.x - s.x) * 300 || 300, -300, false);
  if (state === 'play' && invuln <= 0 && rainbowT <= 0 && Math.hypot(player.x - s.x, player.y - 40 - s.y) < 58) {
    if (hp <= 1) deathTitle = "You got chancla'd.";
    hurt({x: s.x});
  }
}

function throwSlipper(b) {
  const T = 1.0 + rand(0, 0.25), sx = b.x + b.facing * 10, sy = b.y - 60;
  const aim = player.x + player.vx * 0.35;
  const spread = (b.level >= 1 || b.timer < 15) ? [-90, 0, 90] : [0];
  for (const off of spread) {
    const tx = clamp(aim + off + rand(-20, 20), 20, W - 20), ty = player.y;
    const sl = {x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * 1100 * T * T) / T, rot: 0};
    // trace the arc so the landing marker shows where it really lands (furniture gets in the way)
    let px = sl.x, py = sl.y, vy = sl.vy;
    sl.tx = tx; sl.ty = ty;
    for (let i = 0; i < 240; i++) {
      const dt = 1 / 60, oy = py;
      vy += 1100 * dt; px += sl.vx * dt; py += vy * dt;
      const ly = vy > 0 ? landY(px, oy, py) : null;
      if (ly !== null) { sl.tx = px; sl.ty = ly; break; }
    }
    b.slippers.push(sl);
  }
}

// After the fight she shuffles to the couch and watches her show for a while.
function grandmaRetires(x, f) {
  arena.tvT = 16;
  const seat = arena.seat || {x: x, y: G};
  const g = {x, f, sitting: false, life: 18, phase: 0};
  g.update = dt => {
    g.life -= dt;
    if (!g.sitting) {
      const d = seat.x - g.x;
      g.f = Math.sign(d) || 1; g.phase += dt * 6;
      g.x += clamp(d, -70 * dt, 70 * dt);
      if (Math.abs(d) < 2) g.sitting = true;
    }
    if (g.life <= 0) g.done = true;
  };
  g.draw = () => {
    ctx.globalAlpha = Math.min(1, g.life);
    if (g.sitting) drawGrandma(g.x, seat.y + 10, 1, 'sit');
    else drawGrandma(g.x, G, g.f, 'idle', {phase: g.phase});
    ctx.globalAlpha = 1;
  };
  props.push(g);
}

function updateChancla(b, dt, fighting) {
  b.hitT = Math.max(0, b.hitT - dt); b.bare -= dt;
  // slippers in flight
  for (const s of b.slippers) {
    const py = s.y;
    s.vy += 1100 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += dt * 12;
    if (Math.hypot(player.x - s.x, player.y - 40 - s.y) < 16) { slipperBurst(s); continue; }
    if (s.vy > 0) { const ly = landY(s.x, py, s.y); if (ly !== null) { s.y = ly; slipperBurst(s); continue; } }
    if (s.x < -40 || s.x > W + 40) s.done = true;
  }
  b.slippers = b.slippers.filter(s => !s.done);

  const f = b.facing;
  switch (b.st) {
    case 'enter':
      b.x -= 60 * dt; b.phase += dt * 6;
      if (b.x <= 640) { b.st = 'tea'; b.t = 1.1; }
      return;
    case 'tea':
      b.t -= dt;
      if (b.t < 0.5 && !b.mugDown) {
        b.mugDown = true;
        props.push({draw: () => { ctx.fillStyle = '#d9574a'; ctx.fillRect(572, 312, 9, 10); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(572, 312, 9, 10); ctx.beginPath(); ctx.arc(583, 317, 3, -1.4, 1.4); ctx.stroke(); }});
      }
      if (b.t <= 0) {
        b.st = 'idle'; b.cd = 1;
        banner = {title: 'LA CHANCLA', sub: 'Survive ' + CHANCLA_TIME + ' seconds. Watch where the slippers land.', life: 3};
      }
      return;
  }
  if (!fighting) return;
  b.timer -= dt;
  if (b.timer <= 0) {
    // her show is on
    const pts = 3000 * (b.level + 1);
    score += pts; hp = Math.min(maxHp(), hp + 1);
    nextBossAt += 25; spawnT = 1.8;
    grandmaRetires(b.x, b.facing);
    boss = null;
    banner = {title: 'HER SHOW CAME ON', sub: 'Survived   ·   +' + pts + '   ·   +1 life', life: 3};
    return;
  }
  const fast = b.timer < 20;
  switch (b.st) {
    case 'idle': {
      b.facing = player.x >= b.x ? 1 : -1;
      // shuffle to a comfortable lobbing distance, unbothered
      const want = clamp(player.x - b.facing * 260, 70, W - 70), d = want - b.x;
      if (Math.abs(d) > 20) { b.x += Math.sign(d) * 45 * dt; b.phase += dt * 6; }
      b.cd -= dt;
      if (b.cd <= 0) { b.st = 'wind'; b.t = 0.55; }
      break;
    }
    case 'wind':
      b.t -= dt;
      if (b.t <= 0) { throwSlipper(b); b.st = 'throw'; b.t = 0.3; b.bare = 0.8; }
      break;
    case 'throw':
      b.t -= dt;
      if (b.t <= 0) { b.st = 'pocket'; b.t = 0.45; }
      break;
    case 'pocket':
      b.t -= dt;
      if (b.t <= 0) { b.st = 'idle'; b.cd = (fast ? 0.9 : 1.4) - b.level * 0.1; }
      break;
  }
}

function drawChancla(b) {
  // where each slipper is headed
  ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = SLIPPER; ctx.lineWidth = 2.5;
  for (const s of b.slippers) { ctx.beginPath(); ctx.ellipse(s.tx, s.ty - 2, 22, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  for (const s of b.slippers) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    ctx.fillStyle = SLIPPER; ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  if (b.exploded) return;
  const pose = b.st === 'enter' || b.st === 'tea' && !b.mugDown ? 'mug' : b.st === 'wind' ? 'wind' : b.st === 'throw' ? 'throw' : b.st === 'pocket' ? 'pocket' : 'idle';
  drawGrandma(b.x, b.y, b.facing, pose, {phase: b.phase, bare: b.bare, hit: b.hitT > 0});
  if (b.st === 'wind') {
    ctx.font = '28px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT;
    ctx.fillText('!', b.x, b.y - 84);
  }
}

BOSSES.chancla = {
  name: 'LA CHANCLA', pts: 50000, koZoom: 2.2,
  ko: 'FINE.', koSub: 'Wipe your feet next time.', koCaption: "She's not mad. She's disappointed.",
  warning: 'Grandma heard the noise.',
  spawn(level) {
    return {x: W + 30, y: G, vx: 0, vy: 0, scale: 0.85, facing: -1, hp: 450 + level * 150, st: 'enter', t: 0,
      timer: CHANCLA_TIME, cd: 1, bare: 0, phase: 0, hitT: 0, slippers: [], name: 'LA CHANCLA'};
  },
  update(b, dt, fighting) { updateChancla(b, dt, fighting); },
  draw: drawChancla,
  // she doesn't get rainbowed: she shuffles off to the couch
  explode(b) { b.exploded = true; dustPoof(b.x, b.y - 30, 20); grandmaRetires(b.x, b.facing); },
};
