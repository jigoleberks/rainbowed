/* The Cub: the Bear Cave's sub-boss. The sleeping bear's belly bulges and a small, very angry
   cub bursts out. Fast and bitey: it charges you, hops up after you (and bounces off its
   parent's belly), and lunges with a "!" first. Beat it and it climbs back in to sleep. */

// a walking bear, feet at (x, y), facing f. s = size (1 = a cub). Shared with the Clown Car.
function drawWalkingBear(x, y, s, f, o = {}) {
  const ph = o.phase || 0, step = Math.sin(ph) * 5 * s;
  ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const fur = o.hit ? '#e8b0a0' : '#9a6a48', ink = o.hit ? ACCENT : INK;
  ctx.strokeStyle = ink; ctx.lineWidth = 3 / s * Math.min(s, 1.4);
  // legs (back pair then front pair)
  for (const [lx, sw] of [[-14, step], [-6, -step], [10, -step], [18, step]]) {
    ctx.lineWidth = 6; ctx.strokeStyle = ink; line(lx, -14, lx + sw * 0.5, -1);
    ctx.lineWidth = 3.6; ctx.strokeStyle = fur; line(lx, -14, lx + sw * 0.5, -1);
  }
  ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
  // body
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, -20, 24, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // head
  ctx.beginPath(); ctx.arc(27, -28, 4.5, 0, Math.PI * 2); ctx.arc(17, -31, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(22, -22, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c99c74'; ctx.beginPath(); ctx.ellipse(31, -19, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(36, -20, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(24, -25, 1.6, 0, Math.PI * 2); ctx.fill();
  if (o.angry) { ctx.lineWidth = 2; line(19, -30, 27, -27); }
  if (o.mouth) { ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(31, -14, 3, 0, Math.PI); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

function cubTouch(b) {
  if (state !== 'play' || invuln > 0 || player.kickT > 0 || rainbowT > 0) return;
  if (hp <= 1) deathTitle = 'You got cubbed.';
  hurt(b);
}

function updateCub(b, dt, fighting) {
  const bear = arena.bear || {};
  if (b.st === 'bulge') {
    // something is moving in there
    b.t -= dt; bear.bulge = Math.min(1, bear.bulge + dt * 1.2);
    if (Math.random() < dt * 10) shake = Math.max(shake, 3);
    if (b.t <= 0) {
      b.st = 'fight'; bear.bulge = 0; bear.squash = 0.4;
      b.vx = (player.x < b.x ? -1 : 1) * 260; b.vy = -620; b.onGround = false;
      dustPoof(b.x, b.y - 20, 30); shake = 10;
      texts.push({x: b.x, y: b.y - 90, s: '!!', life: 0.8, big: false});
      banner = {title: 'THE CUB', sub: 'It came out of the bear. It is not happy about it.', life: 2.8};
    }
    return;
  }
  b.phase += dt * Math.abs(b.vx) * 0.06;
  const dx = player.x - b.x, dy = player.y - b.y;
  if (b.st === 'fight') {
    if (b.onGround) b.facing = Math.sign(dx) || b.facing;
    const speed = 210 + b.level * 30;
    if (fighting) {
      b.vx += ((Math.abs(dx) > 10 ? b.facing * speed : 0) - b.vx) * Math.min(1, dt * (b.onGround ? 6 : 1.5));
      b.cd -= dt; b.hopCd -= dt;
      if (b.onGround && dy < -40 && Math.abs(dx) < 220 && b.hopCd <= 0) { b.vy = -700; b.hopCd = 0.9; }
      else if (b.onGround && dy > 40) { b.drop = 0.25; }
      if (b.onGround && b.cd <= 0 && Math.abs(dx) < 260 && Math.abs(dy) < 60) { b.st = 'wind'; b.t = 0.4; b.vx = 0; }
    } else b.vx *= 1 - Math.min(1, dt * 5);
  } else if (b.st === 'wind') {
    b.t -= dt; b.vx = 0;
    if (b.t <= 0) { b.st = 'lunge'; b.t = 0.38; b.vx = b.facing * (520 + b.level * 40); b.vy = -260; }
  } else if (b.st === 'lunge') {
    b.t -= dt;
    if (b.t <= 0) { b.st = 'fight'; b.cd = rand(1.4, 2.2) - b.level * 0.15; }
  }
  b.drop -= dt;
  const py = b.y, wasGround = b.onGround, fallV = b.vy;
  physics(b, dt, b.drop > 0);
  // bounces off its parent's belly like everyone else
  if (b.onGround && !wasGround && fallV > 260 && arena.belly && Math.abs(b.y - 286) < 1) { b.vy = -600; b.onGround = false; }
  if (b.x < 20) { b.x = 20; b.vx = Math.abs(b.vx); }
  if (b.x > W - 20) { b.x = W - 20; b.vx = -Math.abs(b.vx); }
  if (Math.abs(player.x - b.x) < 30 && player.y > b.y - 46 && player.y - 70 < b.y) cubTouch(b);
}

// beaten: it tumbles back to the big bear and climbs in
function cubGoesHome(x, y) {
  const home = arena.belly ? arena.belly() : {x: W / 2, y: G};
  const c = {x, y, vx: 0, vy: -300, onGround: false, phase: 0, f: home.x > x ? 1 : -1, life: 4, drop: 0};
  c.update = dt => {
    c.life -= dt;
    const d = home.x - c.x;
    c.f = Math.sign(d) || c.f; c.vx = clamp(d * 3, -160, 160); c.phase += dt * 10;
    physics(c, dt, true);
    if (Math.abs(d) < 12 && c.onGround || c.life <= 0) {
      c.done = true; dustPoof(home.x, home.y, 16);
      if (arena.bear) arena.bear.squash = 0.4;
      texts.push({x: home.x, y: home.y - 90, s: 'zzz', life: 1.2, big: false});
    }
  };
  c.draw = () => drawWalkingBear(c.x, c.y, 0.9, c.f, {phase: c.phase});
  props.push(c);
}

BOSSES.cub = {
  name: 'THE CUB', ko: 'BACK TO BED', koSub: 'It climbed back in.', koCaption: 'Shh.', pts: 7500, koZoom: 2.4,
  warning: "The bear's belly is moving.",
  spawn(level) {
    const home = arena.belly ? arena.belly() : {x: W / 2, y: G};
    return {x: home.x, y: G, vx: 0, vy: 0, onGround: true, facing: 1, phase: 0, scale: 1, hp: 30 + level * 12,
      st: 'bulge', t: 1.4, cd: 1.6, hopCd: 0, drop: 0, hitT: 0, name: 'THE CUB'};
  },
  update(b, dt, fighting) { updateCub(b, dt, fighting); },
  draw(b) {
    if (b.st === 'bulge' || b.exploded) return;
    drawWalkingBear(b.x, b.y, 1.4, b.facing, {phase: b.phase, angry: true, mouth: b.st !== 'fight', hit: b.hitT > 0});
    if (b.st === 'wind') {
      ctx.font = '26px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT;
      ctx.fillText('!', b.x, b.y - 60);
    }
  },
  zone(b, x, y, pad) {
    if (b.st === 'bulge') return 0;
    const lx = (x - b.x) * b.facing;
    if (lx > -36 - pad && lx < 56 + pad && y > b.y - 56 && y < b.y + 4) return lx > 20 && y < b.y - 18 ? 2 : 1;
    return 0;
  },
  aimPoint(b) {
    if (b.st === 'bulge') return null;
    return {x: b.x + b.facing * 12, y: b.y - 24, d: Math.hypot(b.x - player.x, (b.y - player.y) * 1.3)};
  },
  koY(b) { return b.y - 24; },
  // not rainbowed: a burst of colour, then it toddles back to bed
  explode(b) {
    b.exploded = true;
    burst(b.x, b.y - 24, 0, -300, 90);
    dustPoof(b.x, b.y - 24, 24);
    shake = 14;
    for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 24, r: 6 + i * 26, life: 0.35 + i * 0.1});
    cubGoesHome(b.x, b.y);
  },
};
