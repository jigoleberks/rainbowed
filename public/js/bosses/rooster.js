/* The Rooster: Grandpa's Farm sub-boss. Struts out of the coop, puffs up, and crows: the
   COCK-A-DOODLE-DOO rolls across the yard as a shockwave you have to jump, and knocks you back
   if you're close. If you're up on a ledge he flaps up after you and dive-pecks. Beaten, he
   storms back into the coop. */

function drawRoosterBird(x, y, f, o = {}) {
  const s = o.s || 1, puff = o.puff || 0, step = Math.sin(o.phase || 0) * 5;
  ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ink = o.hit ? ACCENT : INK;
  ctx.strokeStyle = '#d99a2b'; ctx.lineWidth = 3;
  if (!o.fly) { line(-3, -16, -3 + step, 0); line(5, -16, 5 - step, 0); line(-3 + step, 0, 3 + step, 0); line(5 - step, 0, 11 - step, 0); }
  else { line(-3, -16, -8, -6); line(5, -16, 0, -6); }
  // tail feathers
  const tail = ['#1f6b4a', '#2b3a8a', '#1d1b22', '#1f6b4a'];
  tail.forEach((c, i) => {
    ctx.fillStyle = c; ctx.strokeStyle = ink; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(-20 - i * 2, -36 + i * 5, 6, 16, -0.6 + i * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
  // body
  ctx.fillStyle = '#c4622d'; ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, -26, 18 + puff * 6, 13 + puff * 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // wing (flapping when flying)
  ctx.fillStyle = '#8f3f1c';
  const wa = o.fly ? Math.sin(clock * 30) * 0.8 : 0.1;
  ctx.save(); ctx.translate(-2, -28); ctx.rotate(-wa);
  ctx.beginPath(); ctx.ellipse(-4, 0, 12, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  // neck and head
  ctx.fillStyle = '#e0a03a'; ctx.beginPath(); ctx.ellipse(12, -40 - puff * 3, 7, 11, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const hx = 16, hy = -50 - puff * 4;
  ctx.fillStyle = '#e0a03a'; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // comb and wattle, his red
  ctx.fillStyle = '#e8384f';
  for (const [cx, r] of [[hx - 4, 3.5], [hx, 4.5], [hx + 4, 3.5]]) { ctx.beginPath(); ctx.arc(cx, hy - 7, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(hx + 5, hy + 8, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // beak, open when crowing
  ctx.fillStyle = '#f2c94c';
  if (o.crow) { ctx.beginPath(); ctx.moveTo(hx + 6, hy - 1); ctx.lineTo(hx + 15, hy - 5); ctx.lineTo(hx + 7, hy + 1); ctx.lineTo(hx + 15, hy + 5); ctx.lineTo(hx + 6, hy + 3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(hx + 6, hy - 1); ctx.lineTo(hx + 13, hy + 1); ctx.lineTo(hx + 6, hy + 3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 2, hy - 1, 1.6, 0, Math.PI * 2); ctx.fill();
  if (o.angry) { ctx.lineWidth = 2; line(hx - 2, hy - 5, hx + 5, hy - 3); }
  ctx.restore();
}

function roosterTouch(b) {
  if (state !== 'play' || invuln > 0 || player.kickT > 0 || rainbowT > 0) return;
  if (hp <= 1) deathTitle = 'You got pecked.';
  hurt(b);
}

function roosterCrow(b) {
  texts.push({x: clamp(b.x, 160, W - 160), y: b.y - 110, s: 'COCK-A-DOODLE-DOO!', life: 1.3, big: false});
  for (let i = 0; i < 3; i++) rings.push({x: b.x + b.facing * 20, y: b.y - 50, r: 10 + i * 24, life: 0.4 + i * 0.12});
  shake = Math.max(shake, 8);
  // a shockwave along the ground each way, if he's on the ground
  if (b.y >= G - 1) {
    const sp = 330 + b.level * 40;
    waves.push({x: b.x - 30, dir: -1, speed: sp, life: 3});
    waves.push({x: b.x + 30, dir: 1, speed: sp, life: 3});
  }
  // too close and it blows you back
  const dx = player.x - b.x;
  if (Math.abs(dx) < 140 && Math.abs(player.y - b.y) < 90 && state === 'play') {
    player.vx = (Math.sign(dx) || 1) * 520; player.vy = -260; player.onGround = false;
  }
  // and blows stickmen over
  for (const e of enemies) if (!e.dead && !e.launched && Math.abs(e.x - b.x) < 140 && Math.abs(e.y - b.y) < 90) launch(e, Math.sign(e.x - b.x) || 1, 1);
}

function updateRooster(b, dt, fighting) {
  const dx = player.x - b.x, dy = player.y - b.y;
  b.phase += dt * Math.abs(b.vx) * 0.08;
  switch (b.st) {
    case 'enter':
      // struts out of the coop
      b.vx = -70; b.x += b.vx * dt; b.phase += dt * 6;
      if (b.x < b.homeX - 50) {
        b.st = 'strut'; b.cd = 1.2;
        banner = {title: 'THE ROOSTER', sub: 'Jump the crow. He hates it when you leave the ground.', life: 2.8};
      }
      return;
    case 'strut': {
      if (!fighting) return;
      b.facing = Math.sign(dx) || b.facing;
      b.vx = Math.abs(dx) > 30 ? b.facing * (110 + b.level * 20) : 0;
      b.cd -= dt;
      // you're up on a ledge: he flaps up and dive-pecks
      if (b.onGround && dy < -60 && b.cd <= 0.6 && Math.random() < dt * 1.5) {
        b.st = 'flap'; b.t = 0.7; b.vy = -760; b.vx = clamp(dx * 1.2, -260, 260); b.onGround = false;
      } else if (b.cd <= 0) { b.st = 'puff'; b.t = 0.75; b.vx = 0; }
      break;
    }
    case 'puff':
      b.t -= dt; b.vx = 0;
      if (b.t <= 0) { roosterCrow(b); b.st = 'crow'; b.t = 0.6; }
      break;
    case 'crow':
      b.t -= dt;
      if (b.t <= 0) { b.st = 'strut'; b.cd = rand(2.4, 3.4) - b.level * 0.3; }
      break;
    case 'flap':
      b.t -= dt; b.vy += -GRAV * 0.55 * dt;   // flapping holds him up
      if (b.t <= 0) {
        // dive at you
        const d = Math.hypot(dx, dy - 40) || 1;
        b.st = 'dive'; b.t = 0.8; b.vx = dx / d * 620; b.vy = (dy - 40) / d * 620;
        texts.push({x: b.x, y: b.y - 70, s: '!', life: 0.4, big: false});
      }
      break;
    case 'dive':
      b.t -= dt;
      if (b.t <= 0 || b.onGround) { b.st = 'strut'; b.cd = 1.4; }
      break;
  }
  const flying = b.st === 'flap' || b.st === 'dive';
  if (b.st === 'dive') { b.x += b.vx * dt; b.y += b.vy * dt; if (b.y >= G) { b.y = G; b.onGround = true; } else b.onGround = false;
    const ly = landY(b.x, b.y - b.vy * dt, b.y); if (ly !== null && b.vy > 0) { b.y = ly; b.onGround = true; } }
  else physics(b, dt, false);
  if (flying) b.facing = Math.sign(b.vx) || b.facing;
  if (b.x < 24) { b.x = 24; b.vx = Math.abs(b.vx); }
  if (b.x > W - 24) { b.x = W - 24; b.vx = -Math.abs(b.vx); }
  if (Math.abs(player.x - b.x) < 26 && player.y > b.y - 60 && player.y - 70 < b.y) roosterTouch(b);
}

// beaten: he storms back into the coop
function roosterStormsOff(x, y) {
  const home = arena.COOP_X || W - 100;
  const r = {x, y, vx: 0, vy: -200, onGround: false, phase: 0, f: home > x ? 1 : -1, life: 4, drop: 0};
  r.update = dt => {
    r.life -= dt;
    const d = home - r.x; r.f = Math.sign(d) || r.f; r.vx = clamp(d * 3, -200, 200); r.phase += dt * 14;
    physics(r, dt, true);
    if (Math.abs(d) < 8 || r.life <= 0) { r.done = true; texts.push({x: home, y: G - 100, s: 'hmph', life: 1.2, big: false}); }
  };
  r.draw = () => drawRoosterBird(r.x, r.y, r.f, {phase: r.phase, s: 1});
  props.push(r);
}

BOSSES.rooster = {
  name: 'THE ROOSTER', ko: 'COCK-A-DOODLE-DONE', koSub: 'He went back to the coop.', koCaption: 'He will be up at dawn.', pts: 7500, koZoom: 2.3,
  warning: 'Something in the coop is very awake.',
  spawn(level) {
    const homeX = arena.COOP_X || W - 100;
    return {x: homeX, y: G, vx: 0, vy: 0, onGround: true, facing: -1, phase: 0, scale: 1, hp: 34 + level * 10,
      st: 'enter', t: 0, cd: 1, hitT: 0, homeX, name: 'THE ROOSTER'};
  },
  update(b, dt, fighting) { updateRooster(b, dt, fighting); },
  draw(b) {
    if (b.exploded) return;
    const puff = b.st === 'puff' ? Math.min(1, (0.75 - b.t) / 0.5) : b.st === 'crow' ? 1 : 0;
    drawRoosterBird(b.x, b.y, b.facing, {phase: b.phase, s: 1.25, puff, crow: b.st === 'crow', fly: b.st === 'flap' || b.st === 'dive', angry: b.st !== 'strut', hit: b.hitT > 0});
    if (b.st === 'puff') { ctx.font = '24px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT; ctx.fillText('!', b.x, b.y - 92); }
  },
  zone(b, x, y, pad) {
    if (b.st === 'enter') return 0;
    const lx = (x - b.x) * b.facing;
    if (lx > -32 - pad && lx < 32 + pad && y > b.y - 76 && y < b.y + 4) return y < b.y - 52 ? 2 : 1;
    return 0;
  },
  aimPoint(b) { return {x: b.x, y: b.y - 34, d: Math.hypot(b.x - player.x, (b.y - player.y) * 1.3)}; },
  koY(b) { return b.y - 40; },
  explode(b) {
    b.exploded = true;
    burst(b.x, b.y - 36, 0, -300, 100);
    // feathers
    for (let i = 0; i < 18; i++) parts.push({x: b.x + rand(-14, 14), y: b.y - 36 + rand(-10, 10), vx: rand(-200, 200), vy: rand(-260, -40), h: 0, r: rand(2, 3.5), life: 1.4, spark: true, ink: true, col: ['#c4622d', '#1f6b4a', '#e0a03a'][i % 3]});
    shake = 14;
    for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 36, r: 6 + i * 26, life: 0.35 + i * 0.1});
    roosterStormsOff(b.x, b.y);
  },
};
