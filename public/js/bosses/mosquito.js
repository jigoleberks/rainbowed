/* The Mosquito: the Fishing Cabin sub-boss. The one buzzing in your ear all night. Tiny, fast and
   really hard to hit. It hovers around your head, wanders off, comes back, and every so often
   dives in for a bite: that takes a heart and leaves you itching (stunned) for a moment. Beaten,
   it goes SPLAT. */

function drawMosquito(x, y, f, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(f * (o.s || 1), o.s || 1);
  ctx.lineCap = 'round'; ctx.strokeStyle = o.hit ? ACCENT : INK; ctx.lineWidth = 1.5;
  // wings, a blur
  ctx.fillStyle = 'rgba(223, 230, 245, 0.7)';
  const wa = Math.sin(clock * 90) * 0.6;
  for (const k of [-1, 1]) { ctx.save(); ctx.rotate(-0.9 + wa * k); ctx.beginPath(); ctx.ellipse(-2, -8, 3.5, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // legs dangling
  for (const k of [-4, 0, 4]) line(k, 2, k - 3, 11);
  // body, head, and the needle
  ctx.fillStyle = '#3a3330'; ctx.beginPath(); ctx.ellipse(-7, 1, 8, 3, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = o.full ? '#c0392b' : '#3a3330'; ctx.beginPath(); ctx.ellipse(-12, 2.5, 4 + (o.full ? 2 : 0), 2.5 + (o.full ? 1.5 : 0), 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3330'; ctx.beginPath(); ctx.arc(3, -1, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1.2; line(5, 0, 14, 4);
  ctx.restore();
}

function updateMosquito(b, dt, fighting) {
  b.t -= dt; b.buzzT -= dt;
  const head = {x: player.x, y: player.y - 70};
  if (b.buzzT <= 0) { b.buzzT = 0.9; if (typeof sfx !== 'undefined' && sfx.buzz) sfx.buzz(Math.hypot(b.x - head.x, b.y - head.y)); }
  switch (b.st) {
    case 'enter':
      // it comes in through the window
      b.tx = W / 2; b.ty = 150;
      if (b.t <= 0) { b.st = 'hover'; b.t = rand(1.5, 2.5); banner = {title: 'THE MOSQUITO', sub: "It's been in your ear all night. Good luck hitting it.", life: 3}; }
      break;
    case 'hover': {
      if (!fighting) break;
      // circles your head, jittery
      b.ang += dt * (2.2 + b.level * 0.4);
      const r = 70 + Math.sin(clock * 1.7) * 25;
      b.tx = head.x + Math.cos(b.ang) * r; b.ty = head.y - 10 + Math.sin(b.ang * 1.3) * r * 0.6;
      if (b.t <= 0) {
        if (Math.random() < 0.3) { b.st = 'wander'; b.t = rand(1.2, 2); b.tx = rand(80, W - 80); b.ty = rand(70, 260); }
        else { b.st = 'aim'; b.t = 0.4; }
      }
      break;
    }
    case 'wander':
      // off somewhere in the dark... then back
      if (b.t <= 0) { b.st = 'hover'; b.t = rand(1.2, 2.2); }
      break;
    case 'aim':
      // hangs still for a moment, lined up on you
      b.tx = b.x; b.ty = b.y;
      if (b.t <= 0) { b.st = 'dive'; b.t = 0.45; b.dx = head.x - b.x; b.dy = head.y - b.y; }
      break;
    case 'dive': {
      const d = Math.hypot(b.dx, b.dy) || 1;
      b.x += b.dx / d * 640 * dt; b.y += b.dy * 1 / d * 640 * dt; b.tx = b.x; b.ty = b.y;
      if (state === 'play' && invuln <= 0 && rainbowT <= 0 && Math.abs(b.x - head.x) < 18 && Math.abs(b.y - head.y) < 30) {
        if (hp <= 1) deathTitle = 'Bitten.';
        hurt(b); stun(b, 0.35);
        texts.push({x: player.x, y: player.y - 110, s: pick2(['BZZT', 'ITCHY', 'OW']), life: 0.7, big: false});
        b.full = 4; b.st = 'wander'; b.t = rand(1, 1.6); b.tx = clamp(b.x + rand(-200, 200), 60, W - 60); b.ty = rand(80, 200);
      } else if (b.t <= 0) { b.st = 'hover'; b.t = rand(1.4, 2.4) - b.level * 0.3; }
      break;
    }
  }
  b.full = Math.max(0, (b.full || 0) - dt);
  // drift toward wherever it's going, with a jittery buzz
  if (b.st !== 'dive') {
    const k = Math.min(1, dt * (b.st === 'wander' ? 2.5 : 5));
    b.x += (b.tx - b.x) * k + Math.sin(clock * 37) * 1.4; b.y += (b.ty - b.y) * k + Math.cos(clock * 29) * 1.4;
  }
  b.x = clamp(b.x, 10, W - 10); b.y = clamp(b.y, 30, G - 20);
  b.facing = b.tx >= b.x ? 1 : -1;
}
const pick2 = list => list[Math.floor(Math.random() * list.length)];

BOSSES.mosquito = {
  name: 'THE MOSQUITO', ko: 'SPLAT', koSub: 'Got it.', koCaption: "There's another one. You can hear it.", pts: 7500, koZoom: 3,
  warning: 'bzzzzzzzzzzzzz',
  spawn(level) {
    return {x: 560, y: 180, scale: 1, hp: 12 + level * 5, st: 'enter', t: 1.4, ang: 0, buzzT: 0, tx: 400, ty: 150,
      facing: -1, hitT: 0, full: 0, name: 'THE MOSQUITO'};
  },
  update(b, dt, fighting) { updateMosquito(b, dt, fighting); },
  draw() {},
  // drawn over the dark, or you'd never see it
  drawLit(b) {
    if (b.exploded) return;
    drawMosquito(b.x, b.y, b.facing, {s: 1.4, hit: b.hitT > 0, full: b.full > 0});
    if (b.st === 'aim') { ctx.font = '18px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT; ctx.fillText('!', b.x, b.y - 18); }
  },
  // a small target, with a bit of give
  zone(b, x, y, pad) {
    if (b.st === 'enter') return 0;
    return Math.hypot(x - b.x, y - b.y) < 13 + pad ? 1 : 0;
  },
  // every hit counts as one, whatever hit it (it's tiny)
  damage(zone, src) { return src === 'grenade' ? 3 : src === 'kick' ? 2 : 1; },
  aimPoint(b) {
    if (b.st === 'enter') return null;
    return {x: b.x, y: b.y, d: Math.hypot(b.x - player.x, (b.y - player.y) * 1.3) - 40};
  },
  koY(b) { return b.y; },
  explode(b) {
    b.exploded = true;
    burst(b.x, b.y, 0, -200, 50);
    shake = 8;
    texts.push({x: b.x, y: b.y - 30, s: 'SPLAT', life: 1, big: false});
  },
};
