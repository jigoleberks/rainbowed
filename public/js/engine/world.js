/* World rules: physics, spawning, effects, kills and damage, kicks, aiming. */
/* ---------- physics helpers ---------- */
function landY(x, prevBottom, bottom) {
  if (bottom >= G) return G;
  for (const p of PLATS) if (!(p.gone > 0) && x > p.x && x < p.x + p.w && prevBottom <= p.y + 0.5 && bottom >= p.y) return p.y;
  return null;
}
function physics(e, dt, dropThrough) {
  const py = e.y;
  e.vy += GRAV * dt;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  e.onGround = false;
  if (e.y >= G) { e.y = G; e.vy = 0; e.onGround = true; return; }
  if (e.vy >= 0 && !dropThrough) {
    for (const p of PLATS) {
      if (!(p.gone > 0) && e.x > p.x && e.x < p.x + p.w && py <= p.y + 0.5 && e.y >= p.y) { e.y = p.y; e.vy = 0; e.onGround = true; return; }
    }
  }
}
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- spawning & effects ---------- */
function spawn() {
  // arenas can choose where stickmen come in (doors, windows); default is both sides and the sky
  let sp;
  if (arena.spawnPoint) sp = arena.spawnPoint();
  else {
    const sky = Math.random() < 0.25, side = Math.random() < 0.5 ? -1 : 1;
    sp = {x: sky ? rand(60, W - 60) : (side < 0 ? -15 : W + 15), y: sky ? -20 : G, air: sky};
  }
  enemies.push({
    x: sp.x, y: sp.y, vx: sp.vx || 0, vy: sp.vy || 0, onGround: !sp.air, facing:1,
    phase: rand(0, 6), speed: rand(80, 150) + Math.min(70, kills * 1.6),
    drop:0, jumpCd: rand(0.3, 1)
  });
}

function burst(x, y, dvx, dvy, n) {
  const dir = Math.atan2(dvy, dvx);
  const hue0 = rand(0, 360);
  for (let i = 0; i < n; i++) {
    const a = dir + rand(-1.2, 1.2);
    const sp = rand(120, 560);
    parts.push({x, y, vx: Math.cos(a) * sp * 0.8 + rand(-90, 90), vy: Math.sin(a) * sp * 0.8 - rand(150, 380),
      h: (hue0 + i * 360 / n) % 360, r: rand(1.8, 4.2), life: 3, spark:false});
  }
  for (let i = 0; i < n / 3; i++) {
    parts.push({x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-50, 50), vy: rand(-90, -20),
      h: rand(0, 360), r: rand(1, 2.2), life: rand(0.6, 1.3), spark:true});
  }
  rings.push({x, y, r:6, life:0.35});
}

function inkPuff(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(60, 220);
    parts.push({x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, h:0, r: rand(1.5, 3.5), life: rand(0.3, 0.6), spark:true, ink:true});
  }
}

function dust(x, y, n = 6, spread = 8) {
  for (let i = 0; i < n; i++) parts.push({x: x + rand(-spread, spread), y: y - 2, vx: rand(-80, 80) * (spread / 8), vy: rand(-60, -10), h: 0, r: rand(1, 2.2), life: 0.45, spark: true, ink: true});
}

function limbs(e, dvx, dvy, s = 1) {
  const f = e.facing;
  const segs = [[0,-57,0,-30],[0,-52,13*f,-40],[0,-52,16*f,-46],[0,-30,8,0],[0,-30,-8,0]];
  for (const g of segs) {
    const len = Math.hypot(g[2] - g[0], g[3] - g[1]) * s;
    debris.push({x: e.x + (g[0] + g[2]) / 2 * s, y: e.y + (g[1] + g[3]) / 2 * s, ang: Math.atan2(g[3] - g[1], g[2] - g[0]), len, lw: 3.5 * s,
      vx: dvx * 0.25 + rand(-260, 260), vy: dvy * 0.15 - rand(220, 560), va: rand(-18, 18) / s, life: 4, head:false});
  }
  debris.push({x: e.x, y: e.y - 67 * s, ang:0, len:0, r: 9 * s, lw: 3.5 * s, vx: dvx * 0.35 + rand(-150, 150), vy: -rand(380, 640), va: rand(-10, 10), life: 4, head:true});
}

function kill(e, dvx, dvy, head) {
  e.dead = true;
  if (e.glow) {
    pickups.push({x: e.x, y: e.y - 30, vy: -320, life: 9});
    texts.push({x: e.x, y: e.y - 110, s: 'GRAB IT!', life: 1, big:false});
  }
  kills++; combo++; comboT = 1.7;
  const mult = Math.min(5, combo);
  const pts = (head ? 150 : 100) * mult;
  score += pts;
  burst(e.x, head ? e.y - 67 : e.y - 44, dvx, dvy, head ? 90 : 60);
  limbs(e, dvx, dvy);
  shake = Math.max(shake, head ? 9 : 6);
  texts.push({x: e.x, y: e.y - 92, s: head ? 'HEADSHOT +' + pts : '+' + pts, life: 0.9, big:false});
  if (combo >= 3 && combo % 3 === 0) {
    slow = 0.9;
    texts.push({x: W / 2, y: 150, s: 'RAINBOW TIME', life: 1.1, big:true});
  }
}

function hurt(from) {
  if (rainbowT > 0) return;
  hp--; invuln = 1.3; combo = 0;
  const away = Math.sign(player.x - from.x) || 1;
  player.vx = away * 420; player.vy = -380;
  shake = 12;
  burst(player.x, player.y - 44, away * 200, -100, 18);
  if (hp <= 0) {
    player.dead = true;
    state = 'dying';
    burst(player.x, player.y - 44, 0, -300, 140);
    limbs(player, away * 200, -200);
    slow = 1.4; overT = 1.6; shake = 16;
  }
}

// 0 = miss, 1 = body, 2 = weak spot. Bosses can define their own zone().
function bossZone(b, x, y, pad) {
  if (!b || b.dead || b.hidden || b.iframes > 0 || b.st === 'drop' || b.st === 'enter' || b.st === 'leave') return 0;
  const def = BOSSES[b.kind];
  if (def.zone) return def.zone(b, x, y, pad);
  const s = b.scale;
  if (Math.abs(x - b.x) < 11 * s + pad && y > b.y - 80 * s && y < b.y + 4) return y < b.y - 58 * s ? 2 : 1;
  return 0;
}

// Damage by source ('bullet', 'kick', 'launch') and zone. Bosses can override with damage().
function bossDamage(b, zone, src) {
  const def = BOSSES[b.kind];
  if (def.damage) return def.damage(zone, src);
  if (src === 'kick') return zone === 2 ? 4 : 3;
  if (src === 'launch') return 2;
  return zone;
}

function launch(e, dir, chain) {
  e.launched = true; e.thrown = false; e.launchT = 0.6; e.chain = chain;
  e.vx = dir * 720; e.vy = -260; e.spin = 0;
  rings.push({x: e.x, y: e.y - 40, r: 6, life: 0.25});
  shake = Math.max(shake, 6);
}

function kickHit(p) {
  const f = p.kickDir, fx = p.x + f * 30, fy = p.y - 38;
  for (const e of enemies) {
    if (e.dead || e.launched) continue;
    if (Math.abs(fx - e.x) < 22 && fy > e.y - 80 && fy < e.y + 4) {
      launch(e, f, 1);
      texts.push({x: e.x, y: e.y - 92, s: 'KICK!', life: 0.6, big:false});
      p.kickT = 0; p.pose = null; p.tilt = 0;
      p.vy = -300; p.vx = -f * 120; p.airKick = true;
      return;
    }
  }
  const b = boss, zone = bossZone(b, fx, fy, 10);
  if (zone) {
    hitBoss(b, fx, fy, f, 0, bossDamage(b, zone, 'kick'));
    p.kickT = 0; p.pose = null; p.tilt = 0;
    p.vx = -f * 320; p.vy = -380; p.airKick = true;
    shake = Math.max(shake, 8);
  }
}

function startReload() {
  if (cheatSophy || reloadT > 0 || ammo >= MAG || player.dead) return;
  reloadT = RELOAD_TIME;
  const f = player.facing;
  debris.push({x: player.x + f * 14, y: player.y - 44, ang: Math.PI / 2, len: 7, lw: 4, vx: f * rand(30, 80), vy: -rand(60, 140), va: rand(-8, 8), life: 2.5, head:false});
  texts.push({x: player.x, y: player.y - 92, s: 'RELOAD', life: 0.7, big:false});
}

function aimTarget() {
  let t = null, bd = Infinity;
  for (const e of enemies) {
    if (e.x < -5 || e.x > W + 5) continue;
    const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.3);
    if (d < bd) { bd = d; t = {x: e.x, y: e.y - 46}; }
  }
  if (boss && BOSSES[boss.kind].aimPoint) {
    const a = BOSSES[boss.kind].aimPoint(boss);
    if (a && a.d < bd) t = {x: a.x, y: a.y};
  } else if (boss && !boss.dead && !boss.hidden && boss.st !== 'drop') {
    const s = boss.scale;
    const d = Math.hypot(boss.x - player.x, (boss.y - player.y) * 1.3) - 20 * s;
    if (d < bd) t = {x: boss.x, y: boss.y - 46 * s};
  }
  return t;
}

