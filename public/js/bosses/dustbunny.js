/* The Dust Bunny: Grandma's House sub-boss. Rolls out from under the couch; every time a
   bunny runs out of health it splits into two smaller, faster ones, down to a swarm of tiny
   ones that get rainbowed. Jump on a bunny to squish it; the tiny ones only bowl you over.
   The boss's health bar is the whole family's health. */

const BUNNY_R = [16, 27, 44];                  // radius by size: tiny, medium, big
const bunnyHp = (tier, level) => Math.round([3, 8, 20][tier] * (1 + 0.3 * level));

function makeBunny(tier, x, y, level, vx = 0, vy = 0) {
  return {tier, r: BUNNY_R[tier], x, y, vx, vy, onGround: false, hp: bunnyHp(tier, level),
    hopCd: rand(0.4, 0.9), spin: 0, flash: 0, iT: 0.15, seed: Math.random() * 10};
}

function dustPoof(x, y, n) {
  for (let i = 0; i < n; i++) parts.push({x: x + rand(-10, 10), y: y + rand(-10, 10), vx: rand(-140, 140), vy: rand(-170, 10), h: 0, r: rand(1.5, 3.5), life: rand(0.4, 0.8), spark: true, ink: true, col: Math.random() < 0.6 ? '#c9c4bb' : '#9b958a'});
}

function updateDustBunny(b, dt, fighting) {
  const lvl = b.level;
  for (const bun of b.bunnies) {
    bun.flash = Math.max(0, bun.flash - dt); bun.iT = Math.max(0, bun.iT - dt);
    bun.hopCd -= dt;
    physics(bun, dt, false);
    if (bun.x < bun.r) { bun.x = bun.r; bun.vx = Math.abs(bun.vx) * 0.8; }
    if (bun.x > W - bun.r) { bun.x = W - bun.r; bun.vx = -Math.abs(bun.vx) * 0.8; }
    if (bun.onGround) bun.vx *= 1 - Math.min(1, dt * 1.6);
    bun.spin += bun.vx * dt / bun.r;
    if (b.st === 'enter') continue;
    if (fighting && bun.onGround && bun.hopCd <= 0) {
      const small = 2 - bun.tier;
      const dir = Math.sign(player.x - bun.x) || 1;
      bun.vx = dir * (140 + small * 90 + lvl * 20) * rand(0.8, 1.15);
      bun.vy = -(380 + small * 110 + rand(0, 140));
      bun.hopCd = rand(0.9, 1.5) - small * 0.25;
    }
    if (!fighting || player.dead) continue;
    const dx = player.x - bun.x, top = bun.y - bun.r * 2;
    // coming down on top of a bunny squishes it and bounces you back up, Mario style:
    // tiny ones go in one stomp, bigger ones take a kick's worth of damage
    if (player.vy > 0 && bun.iT <= 0 && Math.abs(dx) < bun.r + 8 && player.y >= top - 6 && player.y <= top + bun.r * 0.9) {
      player.vy = -560; player.jumps = 1; player.airKick = true;
      b.hitBunny = bun;
      hitBoss(b, bun.x, top, 0, 1, bun.tier === 0 ? bun.hp : 4);
      dustPoof(bun.x, top, 10);
      texts.push({x: bun.x, y: top - 14, s: 'SQUISH!', life: 0.5, big: false});
      continue;
    }
    if (invuln <= 0 && player.kickT <= 0 && rainbowT <= 0 && Math.hypot(dx, (player.y - 40) - (bun.y - bun.r)) < bun.r + 12) {
      if (bun.tier === 0) {
        // the tiny ones just get bowled over
        bun.vx = -(Math.sign(dx) || 1) * 320; bun.vy = -280; bun.hopCd = 0.8;
        dustPoof(bun.x, bun.y - bun.r, 6);
      } else hurt(bun);
    }
  }
  if (b.st === 'enter') {
    b.t -= dt;
    if (b.t <= 0) {
      b.st = 'fight';
      banner = {title: 'THE DUST BUNNY', sub: 'Every hit splits it. Jump on them to squish them.', life: 2.8};
    }
  }
  // the boss's position follows its biggest bunny (for the camera and auto-aim)
  if (b.bunnies.length) {
    const lead = b.bunnies.reduce((a, c) => c.r > a.r ? c : a);
    b.x = lead.x; b.y = lead.y;
  }
}

function drawDustBunny(b) {
  for (const bun of b.bunnies) {
    const cx = bun.x, cy = bun.y - bun.r, r = bun.r;
    ctx.save(); ctx.translate(cx, cy);
    // fuzz, rotating as it rolls
    ctx.save(); ctx.rotate(bun.spin);
    ctx.fillStyle = bun.flash > 0 ? '#f6e9e9' : '#ddd8cf';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const n = Math.round(r * 0.75);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, j = Math.sin(i * 12.9 + bun.seed) * 3;
      line(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3), Math.cos(a + 0.08) * (r + 4 + j), Math.sin(a + 0.08) * (r + 4 + j));
    }
    ctx.restore();
    // face and ears stay upright
    const e = r * 0.28, f = Math.sign(player.x - cx) || 1;
    ctx.fillStyle = '#ddd8cf'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(s * r * 0.35, -r - r * 0.25, r * 0.13, r * 0.32, s * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(f * e * 0.6 - e * 0.6, -r * 0.15, Math.max(1.5, r * 0.07), 0, Math.PI * 2); ctx.arc(f * e * 0.6 + e * 0.6, -r * 0.15, Math.max(1.5, r * 0.07), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

BOSSES.dustbunny = {
  name: 'THE DUST BUNNY', ko: 'DUST BUSTED', pts: 7500, koZoom: 2,
  warning: 'Something is stirring under the couch.',
  spawn(level) {
    const seat = arena.seat || {x: W / 2};
    const dir = player.x > seat.x ? 1 : -1;
    const big = makeBunny(2, seat.x, G, level, dir * 260, 0);
    big.iT = 0;
    dustPoof(seat.x, G - 20, 40);
    const total = bunnyHp(2, level) + 2 * bunnyHp(1, level) + 4 * bunnyHp(0, level);
    return {x: seat.x, y: G, scale: 1, hp: total, st: 'enter', t: 0.9, bunnies: [big], hitT: 0, name: 'THE DUST BUNNY'};
  },
  update(b, dt, fighting) { updateDustBunny(b, dt, fighting); },
  draw: drawDustBunny,
  zone(b, x, y, pad) {
    for (const bun of b.bunnies) {
      if (bun.iT > 0) continue;
      if (Math.hypot(x - bun.x, y - (bun.y - bun.r)) < bun.r + pad) { b.hitBunny = bun; return 1; }
    }
    return 0;
  },
  // route the hit to the bunny that was hit; split it when it runs out
  onHit(b, dmg, x, y) {
    const bun = b.hitBunny;
    if (!bun || bun.hp <= 0) return 0;
    const counted = Math.min(dmg, bun.hp);
    bun.hp -= dmg; bun.flash = 0.08;
    if (bun.hp <= 0) {
      b.bunnies = b.bunnies.filter(o => o !== bun);
      dustPoof(bun.x, bun.y - bun.r, 18 + bun.r);
      if (bun.tier > 0) {
        for (const s of [-1, 1]) b.bunnies.push(makeBunny(bun.tier - 1, bun.x + s * bun.r * 0.4, bun.y, b.level, s * rand(160, 240), -rand(380, 480)));
        texts.push({x: bun.x, y: bun.y - bun.r * 2 - 10, s: 'SPLIT!', life: 0.6, big: false});
      } else {
        burst(bun.x, bun.y - bun.r, 0, -200, 30);
        b.x = bun.x; b.y = bun.y;
      }
    }
    return counted;
  },
  aimPoint(b) {
    if (b.st === 'enter' || !b.bunnies.length) return null;
    const bun = b.bunnies.reduce((a, c) => Math.abs(c.x - player.x) < Math.abs(a.x - player.x) ? c : a);
    return {x: bun.x, y: bun.y - bun.r, d: Math.hypot(bun.x - player.x, (bun.y - player.y) * 1.3)};
  },
  koY(b) { return b.y - 20; },
  explode(b) {
    burst(b.x, b.y - 20, 0, -300, 120);
    dustPoof(b.x, b.y - 20, 60);
    shake = 16;
    for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 20, r: 6 + i * 30, life: 0.35 + i * 0.1});
  },
};
