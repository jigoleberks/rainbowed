/* The main update step: player, enemies, hazards, bullets, effects. */
/* ---------- update ---------- */
function updatePlayer(dt) {
  const p = player;
  p.stunImm = Math.max(0, p.stunImm - dt);
  const stunned = p.stunT > 0;
  if (stunned) { p.stunT -= dt; jumpQ = 0; kickQ = 0; }
  const dir = stunned ? 0 : ((keys.right || btn.right) ? 1 : 0) - ((keys.left || btn.left) ? 1 : 0);
  p.kickCd -= dt;
  if (kickQ > 0 && p.kickT <= 0 && p.kickCd <= 0 && (p.onGround || p.airKick)) {
    if (dir) p.facing = dir;
    p.kickDir = p.facing;
    p.kickT = 0.32; p.kickCd = 0.3; p.spinT = 0; p.spin = 0;
    if (p.onGround) p.vy = -330; else { p.vy = -150; p.airKick = false; }
    kickQ = 0;
  }
  kickQ = Math.max(0, kickQ - dt);

  if (p.kickT > 0) {
    p.vx = p.kickDir * 560;
  } else {
    // weaker air control mid-backflip so the backward nudge carries
    const ctl = p.onGround ? 14 : (p.spinT > 0 ? 2 : 5);
    // props can slow you down where you stand (ink puddles)
    let spd = 1;
    for (const pr of props) if (pr.slowAt) spd = Math.min(spd, pr.slowAt(p.x, p.y));
    p.vx += (dir * 270 * spd - p.vx) * Math.min(1, dt * ctl);
  }

  if (jumpQ > 0 && p.kickT <= 0) {
    if (p.onGround) { p.vy = -650; p.jumps = 1; jumpQ = 0; dust(p.x, p.y); }
    else if (p.wallT > 0) {
      // backflip off the arena wall
      const side = p.wallSide;
      p.vy = -660; p.vx = -side * 390; p.flipSign = -side;
      p.spinT = 0.42; p.jumps = 1; p.airKick = true; p.wallT = 0; jumpQ = 0;
      for (let i = 0; i < 8; i++) parts.push({x: p.x + side * 6, y: p.y - rand(10, 60), vx: -side * rand(20, 120), vy: rand(-60, 40), h: 0, r: rand(1, 2.2), life: 0.4, spark: true, ink: true});
      if (!reduceMotion) shake = Math.max(shake, 3);
    }
    else if (p.jumps > 0) { p.vy = -600; p.vx = -p.facing * 170; p.flipSign = -p.facing; p.jumps = 0; p.spinT = 0.42; jumpQ = 0; }
  }
  jumpQ = Math.max(0, jumpQ - dt);
  if (keys.down || btn.down) p.drop = 0.22;
  p.drop -= dt;
  physics(p, dt, p.drop > 0);
  p.x = arena.wrap ? wrapX(p.x) : clamp(p.x, 12, W - 12);
  if (p.onGround) { p.jumps = 2; p.airKick = true; }
  p.wallT -= dt;
  if (!arena.wrap && !p.onGround && (p.x <= 18 || p.x >= W - 18)) { p.wallT = 0.12; p.wallSide = p.x < W / 2 ? -1 : 1; }
  p.phase += dt * Math.abs(p.vx) * 0.045;
  if (p.spinT > 0) { p.spinT -= dt; p.spin = (1 - Math.max(0, p.spinT) / 0.42) * Math.PI * 2; } else p.spin = 0;
  p.recoil = Math.max(0, p.recoil - dt * 10);

  const auto = btn.fire || keys.fire;
  let ang, aimD = 250;   // aimD: how far away the aim point is, so grenades can lob onto it
  if (auto) {
    const n = aimTarget();
    ang = n ? Math.atan2(n.y - (p.y - 52), n.x - p.x) : (p.facing > 0 ? 0 : Math.PI);
    if (n) aimD = Math.hypot(n.x - p.x, n.y - (p.y - 52));
  } else if (pointer.active) {
    ang = Math.atan2(pointer.y - (p.y - 52), pointer.x - p.x);
    aimD = Math.hypot(pointer.x - p.x, pointer.y - (p.y - 52));
  } else {
    if (dir) p.facing = dir;
    ang = p.facing > 0 ? 0 : Math.PI;
  }
  if (auto || pointer.active) p.facing = Math.cos(ang) >= 0 ? 1 : -1;
  p.aim = ang;

  if (p.kickT > 0) {
    p.kickT -= dt;
    p.facing = p.kickDir; p.pose = 'kick'; p.tilt = -0.35;
    if (Math.random() < dt * 40) parts.push({x: p.x - p.kickDir * 10, y: p.y - rand(20, 60), vx: -p.kickDir * rand(150, 260), vy: 0, h: 0, r: rand(0.8, 1.6), life: 0.15, spark: true, ink: true});
    kickHit(p);
    if (p.kickT <= 0) { p.pose = null; p.tilt = 0; }
  }

  if (rainbowT > 0) {
    rainbowT = Math.max(0, rainbowT - dt);
    if (Math.random() < dt * 60) parts.push({x: p.x + rand(-8, 8), y: p.y - rand(5, 70), vx: -p.vx * 0.2 + rand(-30, 30), vy: rand(-40, 20), h: (clock * 700) % 360, r: rand(1.5, 3), life: 0.5, spark: true});
    if (rainbowT === 0) texts.push({x: p.x, y: p.y - 92, s: 'back to normal', life: 0.8, big:false});
  }

  if (reloadT > 0) {
    reloadT -= dt;
    p.aim = p.facing > 0 ? 1.1 : Math.PI - 1.1;
    if (reloadT <= 0) { reloadT = 0; ammo = magSize(); for (let i = 0; i < 4; i++) parts.push({x: p.x + p.facing * 12, y: p.y - 48, vx: rand(-60, 60), vy: rand(-80, -20), h: 0, r: 1.2, life: 0.25, spark: true, ink: true}); }
  }

  fireCd -= dt;
  if (stunned) {}
  else if ((pointer.down || auto) && fireCd <= 0 && rainbowT <= 0 && grenades > 0) fireGrenade(ang, aimD);
  else if ((pointer.down || auto) && fireCd <= 0 && reloadT <= 0 && ammo > 0 && rainbowT <= 0) {
    fireCd = dual ? 0.065 : 0.13;
    if (!cheatSophy) ammo--;
    p.side = dual ? -(p.side || 1) : 0;
    parts.push({x: p.x + Math.cos(ang) * 10, y: p.y - 54, vx: -p.facing * rand(60, 130), vy: -rand(140, 220), h: 0, r: 1.6, life: 0.5, spark: true, ink: true});
    if (ammo === 0) startReload();
    const a = ang + rand(-0.035, 0.035);
    // with two guns, shots alternate between the hands
    const off = p.side * 4;
    const sx = p.x + Math.cos(a) * 32 - Math.sin(a) * off, sy = p.y - 52 + Math.sin(a) * 32 + Math.cos(a) * off;
    bullets.push({x:sx, y:sy, vx:Math.cos(a) * 1150, vy:Math.sin(a) * 1150, life:0.8});
    shotsFired++;
    flash = 0.05; p.recoil = 1;
    if (!reduceMotion) shake = Math.max(shake, 1.5);
  }
}

function updateEnemies(dt) {
  for (const e of enemies) {
    e.drop -= dt; e.jumpCd -= dt;
    const dx = wrapDx(player.x - e.x), dy = player.y - e.y;
    const chasing = state === 'play';
    if (e.launched) {
      e.spin += dt * 18; e.launchT -= dt;
      physics(e, dt, true);
      for (const o of enemies) {
        if (o === e || o.dead || o.launched) continue;
        if (Math.abs(o.x - e.x) < 20 && Math.abs(o.y - e.y) < 55) { launch(o, Math.sign(e.vx) || 1, e.chain + 1); e.launchT = 0; }
      }
      const b = boss;
      const lz = e.launchT > 0 ? bossZone(b, e.x, e.y - 40, 10) : 0;
      if (lz) {
        hitBoss(b, e.x, e.y - 40, e.vx, 0, bossDamage(b, lz, 'launch')); e.launchT = 0;
      }
      if (arena.wrap) e.x = wrapX(e.x);
      else if (e.x < 8 || e.x > W - 8) e.launchT = 0;
      if (e.launchT <= 0) {
        kill(e, e.vx, -300, false);
        if (e.chain >= 2) texts.push({x: e.x, y: e.y - 110, s: 'CHAIN x' + e.chain, life: 0.9, big:false});
      }
      continue;
    }
    if (e.thrown) {
      e.spin += dt * 14;
      physics(e, dt, false);
      e.x = clamp(e.x, 10, W - 10);
      if (e.onGround) { e.thrown = false; e.spin = 0; dust(e.x, e.y); }
    } else {
      e.facing = dx >= 0 ? 1 : -1;
      const tv = !chasing || Math.abs(dx) < 6 ? 0 : e.speed * e.facing;
      e.vx += (tv - e.vx) * Math.min(1, dt * 5);
      if (chasing && e.onGround && e.jumpCd <= 0) {
        if (dy < -40 && Math.abs(dx) < 230) { e.vy = -650; e.jumpCd = rand(0.8, 1.8); }
        else if (dy > 40 && e.y < G) { e.drop = 0.25; e.jumpCd = 0.6; }
      }
      physics(e, dt, e.drop > 0);
      if (arena.wrap) e.x = wrapX(e.x);
      e.phase += dt * Math.abs(e.vx) * 0.05;
    }
    if (chasing && rainbowT > 0 && Math.abs(dx) < 24 && Math.abs(dy) < 50) { kill(e, -dx * 8 || 200, -300, false); continue; }
    if (chasing && invuln <= 0 && player.kickT <= 0 && Math.abs(dx) < 20 && Math.abs(dy) < 46) hurt(e);
  }
  enemies = enemies.filter(e => !e.dead);
}

function updateHazards(dt) {
  for (const w of waves) {
    w.x += w.dir * w.speed * dt; w.life -= dt;
    if (w.x < -30 || w.x > W + 30) w.life = 0;
    if (Math.random() < dt * 30) dust(w.x - w.dir * 10, G, 1, 4);
    if (state === 'play' && invuln <= 0 && player.onGround && player.y >= G - 1 && Math.abs(player.x - w.x) < 16) hurt({x: w.x - w.dir * 20});
  }
  waves = waves.filter(w => w.life > 0);
  for (const p of eproj) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 20; p.life -= dt;
    if (state === 'play' && invuln <= 0 && Math.abs(player.x - p.x) < 11 && p.y > player.y - 78 && p.y < player.y + 2) { hurt({x: p.x - p.vx * 0.01}); p.life = 0; }
    if (p.y > G || p.x < -20 || p.x > W + 20) { if (p.y > G) inkPuff(p.x, G - 2, 5); p.life = 0; }
  }
  eproj = eproj.filter(p => p.life > 0);
}

function updateBullets(dt) {
  for (const b of bullets) {
    b.life -= dt;
    for (let s = 0; s < 3 && b.life > 0; s++) {
      b.x += b.vx * dt / 3; b.y += b.vy * dt / 3;
      if (arena.wrap) b.x = wrapX(b.x);
      for (const e of enemies) {
        if (!e.dead && b.x > e.x - 10 && b.x < e.x + 10 && b.y > e.y - 78 && b.y < e.y + 2) {
          kill(e, b.vx, b.vy, b.y < e.y - 58); shotsHit++;
          b.life = 0; break;
        }
      }
      const bs = boss, zone = b.life > 0 ? bossZone(bs, b.x, b.y, 0) : 0;
      if (zone) {
        hitBoss(bs, b.x, b.y, b.vx, b.vy, bossDamage(bs, zone, 'bullet')); shotsHit++;
        b.life = 0;
      }
      // props that can be shot (the Slow One)
      if (b.life > 0) for (const pr of props) {
        const z = pr.target ? pr.zone(b.x, b.y, 0) : 0;
        if (z) { pr.hit(z, 'bullet', b.x, b.y, b.vx, b.vy); shotsHit++; b.life = 0; break; }
      }
    }
    if (b.y > G || (!arena.wrap && (b.x < -30 || b.x > W + 30)) || b.y < -30) {
      if (b.y > G && b.life > 0) for (let i = 0; i < 3; i++) parts.push({x:b.x, y:G - 1, vx:rand(-60, 60), vy:rand(-120, -40), h:0, r:1.3, life:0.3, spark:true, ink:true});
      b.life = 0;
    }
  }
  bullets = bullets.filter(b => b.life > 0);
}

function splat(x, y, h, r) {
  if (arena && arena.onSplat) arena.onSplat(x, y, h, r);
  sctx.fillStyle = `hsl(${h} 85% 58% / 0.9)`;
  sctx.beginPath();
  sctx.ellipse(x, y - 0.5, r * rand(1.4, 2.4), r * 0.55, 0, 0, Math.PI * 2);
  sctx.fill();
}

function updateFx(dt) {
  if (geyser) {
    geyser.t -= dt;
    const n = Math.ceil(dt * 420);
    for (let i = 0; i < n; i++) parts.push({x: geyser.x + rand(-14, 14), y: geyser.y, vx: rand(-170, 170), vy: rand(-980, -600), h: (clock * 500 + i * 25) % 360, r: rand(2, 4.5), life: 3, spark:false});
    if (geyser.t <= 0) geyser = null;
  }
  for (const p of parts) {
    p.life -= dt;
    if (p.spark) { p.vy += (p.ink ? 300 : -40) * dt; p.x += p.vx * dt; p.y += p.vy * dt; continue; }
    p.vy += 1100 * dt; p.vx *= 1 - dt * 0.7;
    const py = p.y;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.vy > 0) {
      const ly = landY(p.x, py, p.y);
      if (ly !== null) { splat(p.x, ly, p.h, p.r); p.life = 0; }
    }
    if (p.x < -20 || p.x > W + 20) p.life = 0;
  }
  parts = parts.filter(p => p.life > 0);
  if (parts.length > 2600) parts.splice(0, parts.length - 2600);

  for (const d of debris) {
    d.life -= dt;
    d.vy += GRAV * dt;
    const halfH = d.head ? d.r : Math.abs(Math.sin(d.ang)) * d.len / 2;
    const pb = d.y + halfH;
    d.x += d.vx * dt; d.y += d.vy * dt; d.ang += d.va * dt;
    const nb = d.y + (d.head ? d.r : Math.abs(Math.sin(d.ang)) * d.len / 2);
    if (d.vy > 0) {
      const ly = landY(d.x, pb, nb);
      if (ly !== null) {
        d.y -= nb - ly;
        d.vy *= -0.32; d.vx *= 0.6; d.va *= 0.5;
        if (Math.abs(d.vy) < 40) d.vy = 0;
      }
    }
    if (d.life > 3 && Math.random() < dt * 25) parts.push({x:d.x, y:d.y, vx:rand(-30, 30), vy:rand(-40, 20), h:rand(0, 360), r:rand(1.4, 2.6), life:2, spark:false});
  }
  debris = debris.filter(d => d.life > 0);

  if (boss && boss.ghosts) {
    for (const g of boss.ghosts) g.life -= dt;
    boss.ghosts = boss.ghosts.filter(g => g.life > 0);
  }
  for (const r of rings) { r.life -= dt; r.r += 420 * dt; }
  rings = rings.filter(r => r.life > 0);
  for (const t of texts) { t.life -= dt; t.y -= (t.big ? 10 : 50) * dt; }
  texts = texts.filter(t => t.life > 0);
}

function update(rdt) {
  clock += rdt;
  if (state === 'play') runTime += rdt;
  shake = reduceMotion ? 0 : Math.max(0, shake - rdt * 32);
  flash = Math.max(0, flash - rdt);
  if (banner) { banner.life -= rdt; if (banner.life <= 0) banner = null; }
  if (cine) { updateCine(rdt); updateFx(rdt * 0.25); updateCam(rdt); return; }
  slow = Math.max(0, slow - rdt);
  timeScale += ((slow > 0 ? 0.3 : 1) - timeScale) * Math.min(1, rdt * 7);
  const dt = rdt * timeScale;
  if (state === 'play') {
    invuln = Math.max(0, invuln - dt);
    comboT -= dt; if (comboT <= 0) combo = 0;
    updatePlayer(dt);
    if (kills >= nextCrateAt) { nextCrateAt = (Math.floor(kills / CRATE_EVERY) + 1) * CRATE_EVERY; dropCrate(); }
    if (!boss && bossWarn <= 0 && kills >= nextBossAt) bossWarn = 2;
    if (bossWarn > 0) { bossWarn -= rdt; if (bossWarn <= 0) spawnBoss(); }
    else if (!boss) {
      spawnT -= dt;
      if (spawnT <= 0) {
        if (enemies.length < 10) spawn();
        spawnT = Math.max(0.45, 1.9 - kills * 0.035) * rand(0.7, 1.3);
      }
    }
  }
  for (const pl of PLATS) if (pl.gone > 0) pl.gone = Math.max(0, pl.gone - dt);
  for (const k of pickups) {
    k.life -= dt;
    const pb = k.y;
    k.vy += 1100 * dt;
    if (k.chute) { k.vy = Math.min(k.vy, 75); k.x += Math.cos(clock * 2.2) * 9 * dt; }   // drifting down on its parachute
    k.y += k.vy * dt;
    if (k.vy > 0) { const ly = landY(k.x, pb + 10, k.y + 10); if (ly !== null) { k.y = ly - 10; k.vy = 0; if (k.chute) { k.chute = false; dust(k.x, ly); } } }
    if (state === 'play' && !player.dead && Math.abs(wrapDx(player.x - k.x)) < 24 && k.y > player.y - 85 && k.y < player.y + 12) {
      k.life = 0;
      if (k.kind === 'crate') openCrate(k);
      else if (k.kind === 'gun') {
        dual = true; ammo = magSize(); reloadT = 0;
        rings.push({x: k.x, y: k.y, r: 6, life: 0.3});
        banner = {title: 'TWO GUNS', sub: 'Double fire rate. Drop it if you get hit.', life: 2.6};
      } else {
        rainbowT = RAINBOW_TIME;
        burst(k.x, k.y, 0, -200, 40);
        banner = {title: 'RAINBOW MODE', sub: 'Kicks only. Nothing can hurt you. Go kick him in the face.', life: 2.2};
      }
    }
  }
  pickups = pickups.filter(k => k.life > 0);
  for (const pr of props) if (pr.update) pr.update(dt);
  props = props.filter(pr => !pr.done);
  updateEnemies(dt);
  updateBoss(dt);
  updateHazards(dt);
  updateBullets(dt);
  updateNades(dt);
  updateFx(dt);
  updateCam(rdt);
  if (state === 'dying') { overT -= rdt; if (overT <= 0) showOver(); }
}

