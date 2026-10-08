/* Boss engine: boss loop, spawning, damage, knockouts and cutscene camera. Boss behaviour lives in js/bosses/. */
/* ---------- bosses ---------- */
function nextBossKind() { return arena.bossLoop[bossCount % arena.bossLoop.length]; }

function spawnBoss() {
  const loop = arena.bossLoop, kind = loop[bossCount % loop.length];
  // level = how many times this boss already appeared in this run
  let level = 0;
  for (let i = 0; i < bossCount; i++) if (loop[i % loop.length] === kind) level++;
  bossCount++;
  boss = BOSSES[kind].spawn(level);
  boss.kind = kind; boss.level = level; boss.maxHp = boss.hp;
}

function updateBoss(dt) {
  const b = boss;
  if (!b || b.dead) return;
  b.hitT = Math.max(0, b.hitT - dt);
  const fighting = state === 'play';
  const dx = player.x - b.x, dy = player.y - b.y;
  BOSSES[b.kind].update(b, dt, fighting, dx, dy);
}

function hitBoss(b, x, y, dx, dy, dmg) {
  b.hp -= dmg; b.hitT = 0.08; score += 10 * dmg;
  const dir = Math.atan2(dy, dx);
  for (let i = 0; i < 6 + dmg * 2; i++) {
    const a = dir + Math.PI + rand(-0.9, 0.9);
    parts.push({x, y, vx: Math.cos(a) * rand(100, 280), vy: Math.sin(a) * rand(100, 280) - rand(60, 160), h: rand(0, 360), r: rand(1.5, 3), life: 2, spark:false});
  }
  if (dmg > 1) texts.push({x, y: y - 14, s: 'x' + dmg, life: 0.5, big:false});
  if (b.hp <= 0) killBoss(b);
}

function killBoss(b) {
  b.dead = true; b.hp = 0; b.pose = null; b.spin = 0; b.hidden = false; b.hitT = 0;
  eproj = []; waves = [];
  const def = BOSSES[b.kind], s = b.scale;
  const pts = def.pts * (b.level + 1);
  score += pts; b.pts = pts;
  nextBossAt += 25; bossesBeaten++;
  const ky = def.koY ? def.koY(b) : b.y - 40 * s;
  cine = {kind:'ko', t:0, dur:1.7, x: clamp(b.x, 0, W), y: ky, z: def.koZoom || 2, boss:b, burst:false};
}

function bossExplode(b) {
  b.exploded = true;
  const def = BOSSES[b.kind];
  if (def.explode) { def.explode(b); return; }
  const s = b.scale;
  burst(b.x, b.y - 44 * s, 0, -300, b.kind === 'giant' ? 150 : 110);
  burst(b.x, b.y - 44 * s, 0, -100, 60);
  limbs(b, 0, -260, s);
  shake = 20;
  if (def.afterExplode) def.afterExplode(b);
  for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 44 * s, r: 6 + i * 30, life: 0.35 + i * 0.1});
}

function updateCine(rdt) {
  const c = cine;
  c.t += rdt;
  if (c.kind === 'intro') {
    BOSSES[boss.kind].intro(c, rdt);
  } else {
    if (!c.burst && c.t > 0.45) { c.burst = true; bossExplode(c.boss); }
    if (c.t >= c.dur) {
      const b = c.boss;
      cine = null; boss = null;
      hp = Math.min(maxHp(), hp + 1);
      banner = {title: BOSSES[b.kind].ko, sub: '+' + b.pts + '   ·   +1 life', life: 2.6};
      spawnT = 1.8;
    }
  }
}

function updateCam(rdt) {
  let tx = W / 2, ty = H / 2, tz = 1;
  if (cine && cine.t < cine.dur - 0.35) { tx = cine.x; ty = cine.y; tz = cine.z; }
  const k = Math.min(1, rdt * 7);
  cam.z += (tz - cam.z) * k; cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  const hw = W / 2 / cam.z, hh = H / 2 / cam.z;
  cam.x = clamp(cam.x, hw, W - hw); cam.y = clamp(cam.y, hh, H - hh);
}

