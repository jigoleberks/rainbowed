/* The Giant: drops in, stomps shockwaves, throws stickmen (the first one glows and drops Rainbow Mode). */
function stompWaves(b) {
  const sp = 340 + b.level * 40;
  waves.push({x: b.x - 34, dir: -1, speed: sp, life: 3});
  waves.push({x: b.x + 34, dir: 1, speed: sp, life: 3});
}

function throwMinion(b) {
  const hx = b.x - b.facing * 20, hy = b.y - 235;
  const flight = 0.9;
  const vx = clamp((player.x - hx) / flight, -650, 650);
  const vy = Math.max(-900, ((player.y - hy) - 0.5 * GRAV * flight * flight) / flight);
  b.sinceGlow = (b.sinceGlow || 0) + 1;
  // the first throw of every Giant fight is always the glowing one
  const glow = rainbowT <= 0 && !pickups.length && !enemies.some(e => e.glow) && (b.sinceGlow === 1 && !b.gaveGlow || b.sinceGlow >= 3 || Math.random() < 0.3);
  if (glow) b.gaveGlow = true;
  if (glow) b.sinceGlow = 0;
  enemies.push({x: hx, y: hy, vx, vy, onGround:false, facing: Math.sign(vx) || 1, phase:0,
    speed: rand(90, 140), drop:0, jumpCd:0.6, thrown:true, spin:0, glow});
}

function updateGiant(b, dt, dx, fighting) {
  if (b.st === 'drop') {
    physics(b, dt, true);
    if (b.onGround) {
      shake = 18; stompWaves(b); dust(b.x, G, 30, 40);
      b.st = 'recover'; b.t = 0.9;
      banner = {title:'THE GIANT', sub:'Jump his shockwaves. Headshots do double damage.', life:2.8};
    }
    return;
  }
  b.phase += dt * Math.abs(b.vx) * 0.02;
  if (!fighting) { b.vx *= 0.9; b.pose = null; physics(b, dt, true); return; }
  switch (b.st) {
    case 'move': {
      b.facing = dx >= 0 ? 1 : -1;
      const tv = Math.abs(dx) < 50 ? 0 : (55 + b.level * 15) * b.facing;
      b.vx += (tv - b.vx) * Math.min(1, dt * 3);
      b.pose = null; b.cd -= dt;
      if (b.cd <= 0) {
        if (b.gaveGlow && Math.abs(dx) < 320 && Math.random() < 0.6) { b.st = 'stompWind'; b.t = 0.6; }
        else { b.st = 'throwWind'; b.t = 0.75; }
      }
      break;
    }
    case 'stompWind':
      b.vx *= 0.8; b.pose = 'stompWind'; b.t -= dt;
      if (b.t <= 0) { stompWaves(b); shake = Math.max(shake, 15); dust(b.x + b.facing * 30, G, 20, 30); b.st = 'recover'; b.t = 0.6; b.pose = null; }
      break;
    case 'throwWind':
      b.vx *= 0.8; b.pose = 'throwWind'; b.t -= dt;
      if (b.t <= 0) { throwMinion(b); b.st = 'recover'; b.t = 0.5; b.pose = 'throw'; }
      break;
    case 'recover':
      b.vx *= 0.85; b.t -= dt;
      if (b.t <= 0) { b.st = 'move'; b.cd = Math.max(0.6, rand(1.1, 1.9) - b.level * 0.2); b.pose = null; }
      break;
  }
  physics(b, dt, true);
  b.x = clamp(b.x, 40, W - 40);
  if (invuln <= 0 && Math.abs(player.x - b.x) < 30 && player.y > b.y - 225) hurt(b);
}


BOSSES.giant = {
  name: 'THE GIANT', ko: 'GIANT DOWN', pts: 5000, koZoom: 1.45,
  warning: 'Something huge is falling.',
  spawn(level) {
    const x = player.x < W / 2 ? W - 150 : 150;
    return {x, y:-320, vx:0, vy:0, onGround:false, facing: player.x < x ? -1 : 1, phase:0, scale:3,
      hp: 40 + level * 15, st:'drop', t:0, cd:1.2, hitT:0, spin:0, pose:null, name:'THE GIANT'};
  },
  update(b, dt, fighting, dx) { updateGiant(b, dt, dx, fighting); },
  drawUnder(b) {
    if (b.st !== 'drop') return;
    const k = clamp(1 - (G - b.y) / 700, 0.1, 1);
    ctx.fillStyle = 'rgba(21,22,26,0.18)';
    ctx.beginPath(); ctx.ellipse(b.x, G + 3, 50 * k, 7 * k, 0, 0, Math.PI * 2); ctx.fill();
  },
  afterExplode(b) { geyser = {x: b.x, y: b.y - 60, t: 1.8}; },
};
