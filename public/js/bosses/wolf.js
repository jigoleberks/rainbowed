/* The Wolf in a Backpack: the Woods finale. The one the Trapper was trying to catch all along,
   and none of his traps work on him. Kill him and his backpack unzips and a smaller wolf climbs
   out, wearing a smaller backpack. Five wolves, each smaller, faster and jumpier than the last;
   every one leaves its empty backpack on the ground. The last, tiny backpack has a sandwich in it. */

const WOLF_SIZES = [1.5, 1.2, 0.95, 0.72, 0.5];
const WOLF_HP = [22, 15, 10, 6, 3];
const WOLF_NEXT = ["THERE'S ANOTHER ONE", 'ANOTHER ONE', 'HOW MANY ARE IN THERE', "IT'S A LITTLE ONE"];

function drawWolfPack(x, y, s, f, o = {}) {
  // the backpack on its own (on the ground), feet of it at y
  ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  const wob = o.wiggle ? Math.sin(clock * 40) * 0.12 : 0;
  ctx.rotate(wob);
  if (o.empty) {
    // flat and unzipped
    ctx.fillStyle = '#3f8a4a'; ctx.beginPath(); ctx.ellipse(0, -5, 15, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f6a38'; ctx.beginPath(); ctx.ellipse(6, -9, 9, 3, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = '#3f8a4a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-11, -26, 22, 26, 5) : ctx.rect(-11, -26, 22, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f6a38'; ctx.fillRect(-11, -26, 22, 8); ctx.strokeRect(-11, -26, 22, 8);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(0, -30, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (o.zip) { ctx.fillStyle = INK; ctx.font = '8px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText('zzzip', 0, -36); }
  }
  ctx.restore();
}

function drawWolf(x, y, f, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ink = o.hit ? ACCENT : INK, gait = o.air ? 0 : Math.sin(o.phase || 0) * 8, crouch = o.crouch ? 6 : 0;
  ctx.strokeStyle = ink;
  // legs
  ctx.lineWidth = 4;
  if (o.air) { line(-16, -24, -28, -16); line(-10, -24, -22, -14); line(14, -24, 28, -30); line(20, -24, 34, -28); }
  else for (const [lx, sw] of [[-18, gait], [-11, -gait], [13, -gait], [20, gait]]) line(lx, -22 + crouch, lx + sw * 0.6, 0);
  // bushy tail
  ctx.save(); ctx.translate(-26, -32 + crouch); ctx.rotate(-0.5 + Math.sin(clock * 6) * 0.15);
  ctx.fillStyle = '#6a717c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(-12, 0, 14, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9dde3'; ctx.beginPath(); ctx.ellipse(-22, 0, 4, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // body
  ctx.fillStyle = '#7d8590'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, -30 + crouch, 26, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c3c8cf'; ctx.beginPath(); ctx.ellipse(8, -23 + crouch, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
  // head
  const hx = 26, hy = -42 + crouch * 1.4;
  ctx.fillStyle = '#7d8590'; ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // snout, open when it's coming for you
  ctx.fillStyle = '#c3c8cf';
  if (o.mouth) {
    ctx.beginPath(); ctx.moveTo(hx + 6, hy - 4); ctx.lineTo(hx + 22, hy - 4); ctx.lineTo(hx + 8, hy + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 6, hy + 3); ctx.lineTo(hx + 19, hy + 8); ctx.lineTo(hx + 6, hy + 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAPER; for (const k of [10, 14, 18]) { ctx.beginPath(); ctx.moveTo(hx + k, hy - 4); ctx.lineTo(hx + k + 1.5, hy - 1); ctx.lineTo(hx + k + 3, hy - 4); ctx.fill(); }
  } else { ctx.beginPath(); ctx.moveTo(hx + 6, hy - 4); ctx.lineTo(hx + 21, hy + 1); ctx.lineTo(hx + 6, hy + 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 21, hy + (o.mouth ? -4 : 1), 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 4, hy - 3, 1.7, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1.8; line(hx, hy - 7, hx + 7, hy - 5);
  // ears
  ctx.fillStyle = '#6a717c'; ctx.lineWidth = 2;
  for (const ex of [-6, 1]) { ctx.beginPath(); ctx.moveTo(hx + ex - 3, hy - 7); ctx.lineTo(hx + ex, hy - 18); ctx.lineTo(hx + ex + 4, hy - 7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // the backpack, strapped on
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2.5; line(-4, -40 + crouch, 4, -20 + crouch); line(-14, -40 + crouch, -8, -20 + crouch);
  ctx.strokeStyle = ink; ctx.lineWidth = 2.2;
  ctx.fillStyle = '#3f8a4a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-20, -62 + crouch, 22, 24, 5) : ctx.rect(-20, -62 + crouch, 22, 24); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2f6a38'; ctx.fillRect(-20, -62 + crouch, 22, 8); ctx.strokeRect(-20, -62 + crouch, 22, 8);
  ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(-9, -65 + crouch, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// an empty backpack left lying where its wolf went down (or, the last one, a sandwich)
function wolfPack(x, y, s, f, last) {
  const p = {x, y, vy: 0, s, f, t: 0.9, st: 'full', last};
  p.update = dt => {
    // fall to whatever's below
    const py = p.y; p.vy += GRAV * dt; p.y += p.vy * dt;
    const ly = landY(p.x, py, p.y); if (ly !== null) { p.y = ly; p.vy = 0; }
    if (p.st === 'full') {
      p.t -= dt;
      if (p.t <= 0) {
        p.st = 'empty';
        if (p.last) wolfSandwich(p.x, p.y);
      }
    }
  };
  p.draw = () => drawWolfPack(p.x, p.y, p.s, p.f, {empty: p.st === 'empty', wiggle: p.st === 'full', zip: p.st === 'full' && p.t < 0.5});
  props.push(p);
  return p;
}

function wolfSandwich(x, y) {
  const w = {x, y: y - 10, vy: -360, life: 20};
  texts.push({x, y: y - 50, s: 'a sandwich?', life: 1.4, big: false});
  w.update = dt => {
    w.life -= dt;
    const py = w.y; w.vy += GRAV * 0.7 * dt; w.y += w.vy * dt;
    if (w.vy > 0) { const ly = landY(w.x, py + 6, w.y + 6); if (ly !== null) { w.y = ly - 6; w.vy = 0; } }
    if (w.life <= 0) w.done = true;
    if (state === 'play' && !player.dead && Math.abs(player.x - w.x) < 22 && w.y > player.y - 85 && w.y < player.y + 12) {
      w.done = true; hp = Math.min(maxHp(), hp + 1);
      banner = {title: 'SANDWICH', sub: 'It was a pretty good sandwich.   ·   +1 life', life: 2.4};
    }
  };
  w.draw = () => {
    ctx.save(); ctx.translate(w.x, w.y); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#e8c88a'; ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(10, 4); ctx.lineTo(0, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6fae4a'; ctx.fillRect(-9, 1, 18, 2); ctx.fillStyle = '#e8384f'; ctx.fillRect(-7, -1, 14, 2);
    ctx.restore();
    if (Math.floor(clock * 3) % 2) { ctx.fillStyle = ACCENT; ctx.font = '600 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('EAT IT', w.x, w.y - 22); }
  };
  props.push(w);
}

function wolfTouch(b) {
  if (state !== 'play' || invuln > 0 || player.kickT > 0 || rainbowT > 0) return;
  if (hp <= 1) deathTitle = 'You got wolfed. Several times.';
  hurt(b);
}

function updateWolf(b, dt, fighting) {
  const s = b.s, dx = player.x - b.x, dy = player.y - b.y;
  b.iframes = Math.max(0, b.iframes - dt);
  b.sniff = Math.max(0, b.sniff - dt);
  switch (b.st) {
    case 'enter':
      // a howl from the trees, then he trots in
      if (!b.howled) { b.howled = true; if (typeof sfx !== 'undefined' && sfx.howl) sfx.howl(); texts.push({x: W - 140, y: 120, s: 'AWOOOOOO', life: 1.6, big: false}); }
      b.t -= dt;
      if (b.t > 0) return;
      b.vx = -170; b.x += b.vx * dt; b.phase += dt * 10; b.facing = -1;
      if (b.x < W - 170) {
        b.st = 'run'; b.cd = 1.2;
        banner = {title: 'THE WOLF', sub: "The one the Trapper was after. The traps don't work on him.", life: 3};
      }
      return;
    case 'unzip':
      // the backpack wiggles... and out climbs another one
      b.t -= dt;
      if (b.t <= 0) {
        b.cur++; b.s = WOLF_SIZES[b.cur]; b.wHp = b.hps[b.cur];
        b.x = b.pack.x; b.y = b.pack.y - 4; b.vy = -560; b.vx = (Math.sign(dx) || 1) * 120; b.onGround = false;
        b.facing = Math.sign(dx) || 1; b.iframes = 0.5; b.st = 'air'; b.cd = 0.9;
        texts.push({x: clamp(b.x, 120, W - 120), y: b.y - 90, s: WOLF_NEXT[b.cur - 1] || 'ANOTHER ONE', life: 1.4, big: false});
        b.pack = null;
      }
      return;
  }
  const speed = 150 + (1.5 - s) * 190 + b.level * 25;
  if (b.st === 'run') {
    if (fighting) {
      if (b.onGround) b.facing = Math.sign(dx) || b.facing;
      b.vx += ((Math.abs(dx) > 10 ? b.facing * speed : 0) - b.vx) * Math.min(1, dt * 5);
      b.hopCd -= dt;
      if (b.onGround && dy < -40 && Math.abs(dx) < 240 && b.hopCd <= 0) { b.vy = -700; b.hopCd = rand(0.6, 1.1); }
      else if (b.onGround && dy > 40) b.drop = 0.25;
      // the little ones are jumpier
      if (b.onGround && s < 0.8 && Math.random() < dt * 1.2) b.vy = -420;
      b.cd -= dt;
      if (b.cd <= 0 && b.onGround && Math.abs(dx) < 300) { b.st = 'crouch'; b.t = 0.45 * Math.max(0.6, s / 1.5); b.vx = 0; }
      // he knows exactly where every trap is
      if (b.sniff <= 0 && arena.PIT && (Math.abs(b.x - (arena.PIT.x0 + arena.PIT.x1) / 2) < 30 || Math.abs(b.x - arena.WIRE.x) < 20 || Math.abs(b.x - arena.SNARE.x) < 20)) {
        b.sniff = 6; if (Math.random() < 0.5) texts.push({x: b.x, y: b.y - 70 * s - 10, s: 'sniff sniff', life: 0.8, big: false});
      }
    } else b.vx *= 0.9;
  } else if (b.st === 'crouch') {
    b.t -= dt; b.vx = 0; b.facing = Math.sign(dx) || b.facing;
    if (b.t <= 0) {
      // pounce
      b.st = 'air'; b.onGround = false;
      b.vx = clamp(dx * 2.3, -680, 680); b.vy = -480 + Math.min(0, dy) * 1.4;
      b.cd = rand(1.1, 1.8) * Math.max(0.5, s / 1.5);
    }
  } else if (b.st === 'air') {
    if (b.onGround) b.st = 'run';
  }
  b.drop -= dt;
  physics(b, dt, b.drop > 0);
  b.phase += dt * Math.abs(b.vx) * 0.07;
  if (b.x < 16) { b.x = 16; b.vx = Math.abs(b.vx); }
  if (b.x > W - 16) { b.x = W - 16; b.vx = -Math.abs(b.vx); }
  if (Math.abs(dx) < 30 * s + 6 && player.y > b.y - 50 * s && player.y - 76 < b.y) wolfTouch(b);
}

BOSSES.wolf = {
  name: 'THE WOLF', ko: 'UNPACKED', koSub: 'The last backpack had a sandwich in it.', koCaption: 'Eat the sandwich.', pts: 50000, koZoom: 2.6,
  warning: 'Something is howling.',
  spawn(level) {
    const hps = WOLF_HP.map(h => Math.round(h * (1 + 0.3 * level)));
    return {x: W + 80, y: G, vx: 0, vy: 0, onGround: true, facing: -1, phase: 0, scale: 1, s: WOLF_SIZES[0],
      hp: hps.reduce((a, h) => a + h, 0), hps, cur: 0, wHp: hps[0],
      st: 'enter', t: 1.2, cd: 1.2, hopCd: 0, drop: 0, hitT: 0, iframes: 0, sniff: 0, pack: null, name: 'THE WOLF'};
  },
  update(b, dt, fighting) { updateWolf(b, dt, fighting); },
  // damage goes to the wolf that's out; when it runs out of health, the backpack opens
  onHit(b, dmg) {
    if (b.st === 'enter' || b.st === 'unzip') return 0;
    const d = Math.min(dmg, b.wHp);
    b.wHp -= d;
    if (b.wHp <= 0 && b.cur < WOLF_SIZES.length - 1) {
      burst(b.x, b.y - 30 * b.s, 0, -260, 50);
      limbs({x: b.x, y: b.y, facing: b.facing}, 0, -260, b.s * 0.7);
      shake = Math.max(shake, 10);
      b.st = 'unzip'; b.t = 1.0; b.vx = 0;
      b.pack = wolfPack(b.x, b.y, b.s, b.facing, false);
    }
    return d;
  },
  draw(b) {
    if (b.exploded || b.st === 'unzip') return;
    drawWolf(b.x, b.y, b.facing, b.s, {phase: b.phase, hit: b.hitT > 0, air: !b.onGround, crouch: b.st === 'crouch', mouth: b.st === 'crouch' || b.st === 'air'});
    if (b.st === 'crouch') { ctx.font = '24px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT; ctx.fillText('!', b.x, b.y - 80 * b.s); }
  },
  zone(b, x, y, pad) {
    if (b.st === 'enter' || b.st === 'unzip') return 0;
    const s = b.s, lx = (x - b.x) * b.facing;
    if (lx > -30 * s - pad && lx < 44 * s + pad && y > b.y - 64 * s - pad && y < b.y + 4) return lx > 18 * s && y < b.y - 28 * s ? 2 : 1;
    return 0;
  },
  aimPoint(b) {
    if (b.st === 'enter' || b.st === 'unzip') return null;
    return {x: b.x + b.facing * 8 * b.s, y: b.y - 30 * b.s, d: Math.hypot(b.x - player.x, (b.y - player.y) * 1.3)};
  },
  koY(b) { return b.y - 30 * b.s; },
  // the last, tiny one: and its backpack has a sandwich in it
  explode(b) {
    b.exploded = true;
    burst(b.x, b.y - 30 * b.s, 0, -300, 90);
    shake = 12;
    for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 20, r: 6 + i * 22, life: 0.35 + i * 0.1});
    wolfPack(b.x, b.y, b.s, b.facing, true);
  },
};
