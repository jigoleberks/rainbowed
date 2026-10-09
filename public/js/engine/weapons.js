/* Supply crates and the rainbow grenade launcher.
   Every CRATE_EVERY kills a crate drifts down on a parachute onto a random shelf (or the
   floor). Walk into it to open it: a second gun, or a launcher with GRENADES shots that arc
   and burst into a huge rainbow, rainbowing everyone nearby. Then it's back to the pistol. */

function dropCrate() {
  const spots = PLATS.filter(p => !(p.gone > 0)).map(p => rand(p.x + 14, p.x + p.w - 14));
  spots.push(rand(60, W - 60));
  const x = spots[Math.floor(Math.random() * spots.length)];
  // already holding two guns? then it's a launcher
  const what = dual ? 'launcher' : Math.random() < 0.5 ? 'launcher' : 'gun';
  pickups.push({kind: 'crate', what, x, y: -40, vy: 0, life: 24, chute: true});
  texts.push({x: clamp(x, 70, W - 70), y: 110, s: 'SUPPLY DROP', life: 1.4, big: false});
}

function openCrate(k) {
  rings.push({x: k.x, y: k.y, r: 6, life: 0.35});
  burst(k.x, k.y, 0, -260, 30);
  for (let i = 0; i < 4; i++) debris.push({x: k.x + rand(-8, 8), y: k.y + rand(-8, 8), ang: rand(0, 3), len: 16, lw: 4,
    vx: rand(-220, 220), vy: -rand(200, 420), va: rand(-14, 14), life: 2, head: false});
  if (k.what === 'gun' && !dual) {
    dual = true; ammo = magSize(); reloadT = 0;
    banner = {title: 'TWO GUNS', sub: 'Double fire rate. Drop it if you get hit.', life: 2.6};
  } else {
    grenades = GRENADES;
    banner = {title: 'RAINBOW LAUNCHER', sub: GRENADES + ' grenades. Aim for the crowd.', life: 2.6};
  }
}

function fireGrenade(ang, dist = 250) {
  // lob it: aim a little high so it comes down on the spot you aimed at
  const p = player, t = Math.min(0.9, dist / 700);
  fireCd = 0.42; grenades--; shotsFired++;
  nades.push({x: p.x + Math.cos(ang) * 34, y: p.y - 52 + Math.sin(ang) * 34,
    vx: Math.cos(ang) * 700 + p.vx * 0.3, vy: Math.sin(ang) * 700 - 500 * t, life: 1.8, h: rand(0, 360), rot: 0});
  flash = 0.06; p.recoil = 1.6;
  p.vx -= Math.cos(ang) * 60;
  shake = Math.max(shake, 3);
  if (grenades === 0) texts.push({x: p.x, y: p.y - 110, s: 'OUT OF GRENADES', life: 1, big: false});
}

function updateNades(dt) {
  for (const g of nades) {
    g.life -= dt; g.rot += dt * 12;
    const py = g.y;
    g.vy += 1000 * dt; g.x += g.vx * dt; g.y += g.vy * dt;
    if (arena.wrap) g.x = wrapX(g.x);
    if (Math.random() < dt * 70) parts.push({x: g.x, y: g.y, vx: rand(-25, 25), vy: rand(-25, 25), h: (g.h + clock * 500) % 360, r: rand(1.2, 2.4), life: 0.4, spark: true});
    let boom = g.life <= 0 || g.y >= G || (!arena.wrap && (g.x < 4 || g.x > W - 4));
    if (!boom && g.vy > 0 && landY(g.x, py, g.y) !== null) boom = true;
    if (!boom) for (const e of enemies) if (!e.dead && Math.abs(wrapDx(g.x - e.x)) < 12 && g.y > e.y - 90 && g.y < e.y + 4) { boom = true; break; }
    if (!boom && bossZone(boss, g.x, g.y, 4)) boom = true;
    if (!boom) for (const pr of props) if (pr.target && pr.zone(g.x, g.y, 4)) { boom = true; break; }
    if (boom) { g.life = 0; explode(g.x, Math.min(g.y, G - 2)); }
  }
  nades = nades.filter(g => g.life > 0);
}

function explode(x, y) {
  const R = 95;
  for (let k = 0; k < 7; k++) rings.push({x, y, r: 6 + k * 7, life: 0.35 + k * 0.03});
  burst(x, y, 0, -420, 170);
  shake = Math.max(shake, 12);
  let n = 0, hit = false;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = wrapDx(e.x - x), dy = e.y - 40 - y;
    if (Math.hypot(dx, dy) < R) { kill(e, (Math.sign(dx) || 1) * 420, -520, false); n++; }
  }
  const z = bossZone(boss, x, y, R * 0.6) || bossZone(boss, x, y - 40, R * 0.6);
  if (z) { hitBoss(boss, x, y, 0, -1, bossDamage(boss, z, 'grenade')); hit = true; }
  for (const pr of props) {
    const pz = pr.target ? pr.zone(x, y, 40) || pr.zone(x, y - 40, 40) : 0;
    if (pz) { pr.hit(pz, 'grenade', x, y, 0, -1); hit = true; }
  }
  if (n || hit) shotsHit++;
  if (n >= 3) texts.push({x, y: y - 70, s: n + ' IN ONE!', life: 1.1, big: false});
}

function drawNades() {
  for (const g of nades) {
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `hsl(${i * 60} 85% 56%)`;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 6, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

// a wooden crate, on a rainbow parachute while it's falling
function drawCrate(k) {
  ctx.save(); ctx.translate(k.x, k.y);
  if (k.chute) {
    ctx.rotate(Math.sin(clock * 2.2) * 0.14);
    const cy = -54, R = 30;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `hsl(${i * 60} 85% 62%)`;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.arc(0, cy, R, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, cy, R, Math.PI, 0); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 1.2;
    line(-R, cy, -10, -11); line(-12, cy, -5, -11); line(12, cy, 5, -11); line(R, cy, 10, -11);
  }
  ctx.fillStyle = '#d9b77a'; ctx.fillRect(-12, -12, 24, 24);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(-12, -12, 24, 24);
  ctx.lineWidth = 1.5; line(-12, -4, 12, -4); line(-12, 4, 12, 4);
  // what's inside
  if (k.what === 'gun' && !dual) {
    ctx.fillStyle = ACCENT; ctx.font = '13px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText('x2', 0, 5);
  } else {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `hsl(${i * 60} 85% 56%)`;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 6, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  ctx.lineCap = 'round';
}
