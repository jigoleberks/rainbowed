/* The Slow One: The Long Hallway's finale. An ordinary-looking stickman who steps out of a
   door and walks toward you. 10,000 health. If he touches you, that's it. He never leaves:
   once he's out, he keeps walking after you for the rest of the run while the boss loop
   carries on around him. If the loop comes back to him, another one steps out. */

const SLOW_HP = 10000, SLOW_SPEED = 36;

function slowOneTouch(s) {
  if (state !== 'play' || player.dead || rainbowT > 0 || invuln > 0) return;
  if (cheatLoaf && hp > 5) {
    hp -= 5; invuln = 1.5;
    const away = Math.sign(wrapDx(player.x - s.x)) || 1;
    player.vx = away * 420; player.vy = -420;
    texts.push({x: player.x, y: player.y - 100, s: 'THE LOAF PROTECTS', life: 1.2, big: false});
    return;
  }
  deathTitle = 'He was always going to get you.';
  hp = 0; player.dead = true; state = 'dying';
  slow = 1.6; overT = 2; shake = 10;
  limbs(player, 0, -200);
}

// his one bit of colour: a red bowler hat
function drawSlowHat(x, y, f) {
  const hx = x + f * 2, top = y - 76;
  ctx.fillStyle = '#d63b3b'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(hx, top, 15, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx - 9, top); ctx.quadraticCurveTo(hx - 9, top - 15, hx, top - 15); ctx.quadraticCurveTo(hx + 9, top - 15, hx + 9, top);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8f2424'; ctx.fillRect(hx - 9, top - 4, 18, 3);
}

// he lives as a prop, not in the boss slot, so the next bosses can still come
function makeSlowOne(x, y) {
  const s = {x, y, vx: 0, vy: 0, onGround: true, facing: 1, phase: 0, scale: 1, health: SLOW_HP, maxHealth: SLOW_HP,
    hitT: 0, wait: 0, drop: 0, floating: false, leaving: null, target: true, slowOne: true};
  s.update = dt => {
    s.hitT = Math.max(0, s.hitT - dt);
    if (state !== 'play') return;
    const dx = wrapDx(player.x - s.x), dy = player.y - s.y;
    if (s.leaving) {
      // he's had enough, for now: back through a door
      const ddx = wrapDx(s.leaving.x - s.x);
      s.vx = Math.sign(ddx) * SLOW_SPEED * 1.5; s.facing = Math.sign(ddx) || 1;
      if (Math.abs(ddx) < 4) { s.leaving.open = 0.8; s.done = true; }
    } else {
      s.facing = Math.sign(dx) || 1;
      s.vx = Math.abs(dx) > 6 ? s.facing * SLOW_SPEED : 0;
      // you're above him: he waits a moment, then floats up, unhurried
      if (s.onGround && dy < -30 && Math.abs(dx) < 30) {
        s.wait += dt;
        if (s.wait > 1.5) { s.wait = 0; s.floating = true; s.vy = -Math.sqrt(2 * 500 * (-dy + 30)); }
      } else s.wait = 0;
      // you're below him: he steps off
      if (s.onGround && dy > 30 && Math.abs(dx) < 40) s.drop = 0.3;
    }
    s.drop -= dt;
    const py = s.y;
    s.vy += (s.floating ? 500 : GRAV) * dt;
    s.x = wrapX(s.x + s.vx * dt); s.y += s.vy * dt;
    s.onGround = false;
    if (s.vy > 0) {
      const ly = s.drop > 0 && s.y < G ? null : landY(s.x, py, s.y);
      if (ly !== null) { s.y = ly; s.vy = 0; s.onGround = true; s.floating = false; }
    }
    s.phase += dt * Math.abs(s.vx) * 0.05;
    if (!s.leaving && Math.abs(wrapDx(player.x - s.x)) < 16 && Math.abs((player.y - 40) - (s.y - 40)) < 46) slowOneTouch(s);
  };
  s.zone = (x, y, pad) => {
    if (s.leaving) return 0;
    if (Math.abs(wrapDx(x - s.x)) < 11 + pad && y > s.y - 80 && y < s.y + 4) return y < s.y - 58 ? 2 : 1;
    return 0;
  };
  s.hit = (z, src, x, y) => {
    const dmg = src === 'kick' ? (z === 2 ? 4 : 3) : z;
    s.health -= dmg; s.hitT = 0.08; score += 2 * dmg;
    parts.push({x, y, vx: rand(-80, 80), vy: rand(-120, -20), h: rand(0, 360), r: 2, life: 0.6, spark: true});
    if (s.health <= 0 && !s.leaving) {
      score += 100000;
      const doors = arena.doors && arena.doors.length ? arena.doors : [{x: W - 40, open: 0}];
      s.leaving = doors.reduce((a, c) => Math.abs(wrapDx(c.x - s.x)) < Math.abs(wrapDx(a.x - s.x)) ? c : a);
      banner = {title: "HE'LL BE BACK", sub: '+100000   ·   You actually did it. He is going to remember this.', life: 4};
    }
  };
  s.draw = () => {
    for (const x of [s.x, s.x - W, s.x + W]) {
      if (x < -30 || x > W + 30) continue;
      drawStick({...s, x}, 'enemy');
      drawSlowHat(x, s.y, s.facing);
      // a small, calm smile, and his health, which barely ever moves
      ctx.strokeStyle = s.hitT > 0 ? ACCENT : INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(x + s.facing * 4, s.y - 66, 3.2, 0.25, Math.PI - 0.25); ctx.stroke();
      ctx.fillStyle = 'rgba(21,22,26,0.55)'; ctx.font = '600 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(Math.max(0, Math.ceil(s.health)).toLocaleString('en-US'), x, s.y - 98);
    }
  };
  return s;
}

BOSSES.slowone = {
  name: 'THE SLOW ONE', ko: '', pts: 0, koZoom: 2,
  warning: 'Footsteps.',
  spawn(level) {
    const doors = arena.doors && arena.doors.length ? arena.doors : [{x: W - 40, open: 0}];
    const d = doors.reduce((a, c) => Math.abs(wrapDx(c.x - player.x)) > Math.abs(wrapDx(a.x - player.x)) ? c : a);
    d.open = 3;
    return {x: d.x, y: G, vx: 0, vy: 0, scale: 1, facing: 1, phase: 0, hp: SLOW_HP, st: 'enter', t: 2.6, hitT: 0, name: 'THE SLOW ONE'};
  },
  update(b, dt) {
    b.t -= dt;
    b.facing = Math.sign(wrapDx(player.x - b.x)) || 1;
    if (b.t > 1.2) return;          // standing in the doorway
    b.x = wrapX(b.x + b.facing * SLOW_SPEED * dt); b.phase += dt * 1.8;
    if (b.t <= 0) {
      props.push(makeSlowOne(b.x, b.y));
      boss = null; nextBossAt += 25; spawnT = 1.5;
      banner = {title: 'THE SLOW ONE', sub: "10,000 health. He's not in a hurry. He's not leaving.", life: 4};
    }
  },
  draw(b) {
    drawStick({...b, vx: b.t > 1.2 ? 0 : SLOW_SPEED, onGround: true}, 'enemy');
    drawSlowHat(b.x, b.y, b.facing);
  },
};
