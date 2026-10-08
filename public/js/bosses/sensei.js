/* The Sensei: slow-mo intro, dodges bullets, dash punches, teleport kicks, throwing stars. */
function throwStars(b) {
  const a0 = Math.atan2((player.y - 45) - (b.y - 52), player.x - b.x);
  for (const k of [-1, 0, 1]) {
    const a = a0 + k * 0.17;
    eproj.push({x: b.x + b.facing * 14, y: b.y - 52, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, life: 2, rot: 0});
  }
}

function dodge(b) {
  b.dodgeCd = 0.6; b.iframes = 0.25;
  if (b.onGround && Math.random() < 0.5) {
    b.vy = -620; b.vx = (Math.random() < 0.5 ? -1 : 1) * 150; b.spinT = 0.45;
  } else {
    inkPuff(b.x, b.y - 40, 10);
    b.ghosts.push({x:b.x, y:b.y, facing:b.facing, spin:0, pose:null, life:0.35, ghost:true});
    const dir = Math.random() < 0.5 ? -1 : 1;
    let nx = b.x + dir * 130;
    if (nx < 30 || nx > W - 30) nx = b.x - dir * 130;
    b.x = clamp(nx, 30, W - 30);
    inkPuff(b.x, b.y - 40, 10);
  }
  texts.push({x: b.x, y: b.y - 95, s: 'dodged', life: 0.6, big:false});
}


function updateSensei(b, dt, dx, dy, fighting) {
  b.dodgeCd -= dt; b.iframes -= dt; b.jumpCd -= dt; b.drop -= dt;
  if (b.spinT > 0) { b.spinT -= dt; b.spin = (1 - Math.max(0, b.spinT) / 0.45) * Math.PI * 2; } else b.spin = 0;
  b.ghostT -= dt;
  if ((b.st === 'dash' || b.spinT > 0) && b.ghostT <= 0) {
    b.ghosts.push({x:b.x, y:b.y, facing:b.facing, spin:b.spin, pose:b.pose, life:0.3, ghost:true});
    b.ghostT = 0.035;
  }
  b.phase += dt * Math.abs(b.vx) * 0.05;
  if (!fighting) { b.vx *= 0.9; b.pose = null; physics(b, dt, false); return; }
  const fast = b.hp < b.maxHp / 2 ? 0.7 : 1;
  switch (b.st) {
    case 'move': {
      b.facing = dx >= 0 ? 1 : -1; b.pose = null;
      const ad = Math.abs(dx);
      let tv = 0;
      if (ad > 210) tv = 170 * b.facing; else if (ad < 110) tv = -150 * b.facing;
      b.vx += (tv - b.vx) * Math.min(1, dt * 6);
      if (b.onGround && b.jumpCd <= 0) {
        if (dy < -40) { b.vy = -650; b.jumpCd = rand(0.6, 1.2); }
        else if (dy > 40 && b.y < G) { b.drop = 0.25; b.jumpCd = 0.6; }
      }
      if (b.dodgeCd <= 0) {
        for (const bu of bullets) {
          const rx = bu.x - b.x, ry = bu.y - (b.y - 40);
          if (Math.hypot(rx, ry) < 120 && rx * bu.vx + ry * bu.vy < 0) { dodge(b); break; }
        }
      }
      b.cd -= dt;
      if (b.cd <= 0) {
        const r = Math.random();
        if (r < 0.4) { b.st = 'dashWind'; b.t = 0.45 * fast; b.lock = b.facing; }
        else if (r < 0.75) { b.st = 'tpOut'; b.t = 0.35; inkPuff(b.x, b.y - 40, 18); b.hidden = true; }
        else { b.st = 'starWind'; b.t = 0.4 * fast; }
      }
      break;
    }
    case 'dashWind':
      b.vx *= 0.7; b.pose = 'crouch'; b.t -= dt;
      if (b.t <= 0) { b.st = 'dash'; b.t = 0.32; b.facing = b.lock; }
      break;
    case 'dash':
      b.pose = 'dash'; b.vx = b.lock * 760; b.t -= dt;
      if (invuln <= 0 && Math.abs(dx) < 26 && Math.abs(dy) < 50) hurt(b);
      if (b.t <= 0 || b.x < 25 || b.x > W - 25) { b.st = 'recover'; b.t = 0.6; b.pose = 'tired'; b.vx *= 0.3; }
      break;
    case 'tpOut':
      b.vx = 0; b.t -= dt;
      if (b.t <= 0) {
        b.x = clamp(player.x - player.facing * 55, 25, W - 25);
        b.y = player.y; b.vy = 0; b.hidden = false;
        inkPuff(b.x, b.y - 40, 18);
        b.facing = player.x >= b.x ? 1 : -1;
        b.st = 'kickWind'; b.t = 0.32 * fast + 0.08;
      }
      break;
    case 'kickWind':
      b.vx = 0; b.pose = 'crouch'; b.t -= dt;
      if (b.t <= 0) { b.st = 'kick'; b.t = 0.22; b.vx = b.facing * 260; b.hitDone = false; }
      break;
    case 'kick': {
      b.pose = 'kick'; b.t -= dt; b.vx *= 0.9;
      const kdx = player.x - b.x;
      if (!b.hitDone && invuln <= 0 && kdx * b.facing > -5 && Math.abs(kdx) < 48 && Math.abs(dy) < 55) { hurt(b); b.hitDone = true; }
      if (b.t <= 0) { b.st = 'recover'; b.t = 0.55; b.pose = 'tired'; }
      break;
    }
    case 'starWind':
      b.vx *= 0.7; b.facing = dx >= 0 ? 1 : -1; b.pose = 'starWind'; b.t -= dt;
      if (b.t <= 0) { throwStars(b); b.st = 'recover'; b.t = 0.4; b.pose = 'throw'; }
      break;
    case 'recover':
      b.vx *= 0.85; b.t -= dt;
      if (b.t <= 0) { b.st = 'move'; b.cd = rand(0.8, 1.5) * fast; b.pose = null; }
      break;
  }
  physics(b, dt, b.drop > 0);
  b.x = clamp(b.x, 15, W - 15);
}


function updateSenseiIntro(c, rdt) {
    const b = boss, sdt = rdt * 0.7;
    b.facing = player.x >= b.x ? 1 : -1;
    if (c.t < 0.7) b.pose = 'fold';
    else if (!c.jumped) { c.jumped = true; b.vy = -600; b.spinT = 0.6; b.pose = null; }
    if (b.spinT > 0) {
      b.spinT -= sdt;
      b.spin = (1 - Math.max(0, b.spinT) / 0.6) * Math.PI * 4;
      b.ghostT -= rdt;
      if (b.ghostT <= 0) { b.ghosts.push({x:b.x, y:b.y, facing:b.facing, spin:b.spin, pose:null, life:0.3, ghost:true}); b.ghostT = 0.03; }
    } else b.spin = 0;
    physics(b, sdt, false);
    if (c.jumped && b.onGround && b.spinT <= 0) b.pose = c.t > 2.0 ? 'beckon' : null;
    if (c.jumped && b.onGround && !c.landed) { c.landed = true; dust(b.x, b.y, 10, 14); }
    c.x = b.x; c.y = b.y - 45;
    if (c.t >= c.dur) { cine = null; b.st = 'move'; b.cd = 1.0; b.pose = null; b.spin = 0; }
}

BOSSES.sensei = {
  name: 'THE SENSEI', ko: 'SENSEI DEFEATED', pts: 7500, koZoom: 2.3,
  warning: 'A master approaches.',
  spawn(level) {
    // appear on the top shelf, or on the lower shelf away from the player if they're up there
    const top = PLATS.reduce((a, p) => p.y < a.y ? p : a);
    let x = top.x + top.w / 2, y = top.y;
    if (Math.abs(player.x - x) < 130 && player.y <= top.y + 1) {
      const lows = PLATS.filter(p => p !== top);
      const far = lows.reduce((a, p) => Math.abs(p.x + p.w / 2 - player.x) > Math.abs(a.x + a.w / 2 - player.x) ? p : a);
      x = far.x + far.w / 2; y = far.y;
    }
    inkPuff(x, y - 40, 26);
    rings.push({x, y: y - 40, r: 6, life: 0.35});
    cine = {kind:'intro', t:0, dur:3.4, x, y: y - 45, z:2.4, title: 'THE SENSEI',
      hint: 'He dodges bullets. Hit him while he attacks or right after he teleports.'};
    return {x, y, vx:0, vy:0, onGround:true, facing: player.x < x ? -1 : 1, phase:0, scale:1,
      hp: 24 + level * 8, st:'intro', t:0, cd:1, hitT:0, spin:0, spinT:0, pose:'fold',
      dodgeCd:0, iframes:0, hidden:false, ghosts:[], ghostT:0, jumpCd:0, drop:0, name:'THE SENSEI'};
  },
  update(b, dt, fighting, dx, dy) { updateSensei(b, dt, dx, dy, fighting); },
  intro: updateSenseiIntro,
};
