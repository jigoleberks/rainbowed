/* Grandpa: Grandpa's Farm finale. He wakes up in his rocking chair, decides the lawn needs
   doing, climbs onto his riding mower, and mows back and forth across the yard, slowly and
   completely unbothered. Jump over him every pass. Anything in his way gets mowed, stickmen
   included. Shooting him only makes him yell. Survive until Grandma rings the dinner bell. */

const MOW_TIME = 45;

function drawMower(m, o = {}) {
  const f = m.dir, x = m.x, y = G;
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK;
  // deck and body
  ctx.fillStyle = '#c0392b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-40, -14); ctx.lineTo(36, -14); ctx.lineTo(44, -26); ctx.lineTo(30, -40); ctx.lineTo(-16, -40); ctx.lineTo(-40, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c76a'; ctx.fillRect(10, -38, 18, 6);   // headlight strip
  // seat and steering wheel
  ctx.fillStyle = '#1d1b22'; ctx.fillRect(-24, -48, 18, 8); ctx.lineWidth = 2.5; line(-24, -48, -26, -62);
  line(14, -40, 6, -56); ctx.beginPath(); ctx.ellipse(6, -57, 7, 2.5, -0.3, 0, Math.PI * 2); ctx.stroke();
  // wheels
  ctx.fillStyle = INK; for (const [wx, r] of [[-26, 14], [28, 10]]) { ctx.beginPath(); ctx.arc(wx, -r, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#8a8f99'; for (const [wx, r] of [[-26, 14], [28, 10]]) { ctx.save(); ctx.translate(wx, -r); ctx.rotate(m.spin || 0); ctx.fillRect(-r * 0.5, -1.5, r, 3); ctx.restore(); }
  ctx.restore();
  // Grandpa on top
  if (arena.drawGrandpa) arena.drawGrandpa(x - f * 12, G - 26, f, 'sit', {say: o.say});
}

function grandpaYell(b, s) {
  if (b.yellT > 0) return;
  b.yellT = 1.6; b.say = s; b.sayT = 1.2;
}

function updateGrandpa(b, dt, fighting) {
  const m = b.mower;
  b.yellT = Math.max(0, b.yellT - dt);
  b.sayT = Math.max(0, b.sayT - dt); if (b.sayT <= 0) b.say = null;
  const gp = arena.grandpa || {};
  switch (b.st) {
    case 'wake':
      // he lifts his hat... and looks at the lawn
      b.t -= dt;
      if (b.t < 1.2 && !b.said) { b.said = true; b.say = 'Hm. Lawn needs doing.'; b.sayT = 1.8; }
      if (b.t <= 0) { b.st = 'mount'; b.t = 0.8; gp.st = 'away'; m.on = true; m.x = W + 60; m.dir = -1; }
      return;
    case 'mount':
      // the mower rolls in from the side of the house
      b.t -= dt; m.x -= 160 * dt; m.spin += dt * 10;
      if (b.t <= 0) {
        b.st = 'mow';
        banner = {title: 'GRANDPA', sub: 'The lawn needs doing. Jump him. Survive ' + MOW_TIME + ' seconds.', life: 3};
      }
      return;
    case 'supper':
      // Grandma rang the bell: he parks it and goes in
      b.t -= dt;
      m.x += m.dir * 120 * dt;
      if (b.t <= 0 || m.x > W + 80 || m.x < -80) {
        m.on = false; gp.st = 'chair';
        const pts = 4000 * (b.level + 1);
        score += pts; hp = Math.min(maxHp(), hp + 1);
        nextBossAt += 25; spawnT = 1.8; boss = null;
        banner = {title: "SUPPER'S ON", sub: 'Survived   ·   +' + pts + '   ·   +1 life', life: 3.4};
      }
      return;
  }
  if (!fighting) return;
  b.timer -= dt;
  if (b.timer <= 0) {
    b.st = 'supper'; b.t = 4; m.dir = 1;
    texts.push({x: W - 120, y: 150, s: 'DING DING DING', life: 1.8, big: false});
    b.say = "Supper's on."; b.sayT = 2;
    return;
  }
  // mowing: back and forth, faster as it goes
  const prog = 1 - b.timer / MOW_TIME;
  const speed = 150 + prog * 120 + b.level * 30;
  m.x += m.dir * speed * dt; m.spin += dt * speed * 0.08;
  if ((m.dir > 0 && m.x > W + 50) || (m.dir < 0 && m.x < -50)) { m.dir *= -1; }
  if (arena.mowGrass) arena.mowGrass(m.x - 40, m.x + 40);
  if (Math.random() < dt * 40) parts.push({x: m.x - m.dir * 40, y: G - 6, vx: -m.dir * rand(60, 200), vy: -rand(40, 160), h: 0, r: rand(1.2, 2.2), life: 0.5, spark: true, ink: true, col: '#6f9a4a'});
  // anything in front of the deck gets mowed
  for (const e of enemies) if (!e.dead && Math.abs(e.x - m.x) < 40 && e.y > G - 50) {
    kill(e, m.dir * 300, -420, false);
    texts.push({x: e.x, y: e.y - 92, s: 'MOWED', life: 0.6, big: false});
  }
  if (state === 'play' && invuln <= 0 && rainbowT <= 0 && player.kickT <= 0 && Math.abs(player.x - m.x) < 38 && player.y > G - 52) {
    if (hp <= 1) deathTitle = 'Get off my lawn.';
    grandpaYell(b, 'GET OFF MY LAWN!');
    hurt({x: m.x});
  }
  b.x = m.x; b.y = G;
}

BOSSES.grandpa = {
  name: 'GRANDPA', pts: 0, koZoom: 2,
  warning: 'Grandpa stopped snoring.',
  spawn(level) {
    const m = {x: W + 60, dir: -1, on: false, spin: 0};
    arena.mower = m;
    const gp = arena.grandpa || {};
    gp.st = 'chair';
    return {x: (arena.PORCH && arena.PORCH.chairX) || W - 80, y: G, scale: 1, hp: 1, st: 'wake', t: 2.4, timer: MOW_TIME,
      mower: m, yellT: 0, say: null, sayT: 0, said: false, hitT: 0, name: 'GRANDPA'};
  },
  update(b, dt, fighting) { updateGrandpa(b, dt, fighting); },
  draw(b) {
    const gp = arena.grandpa || {};
    if (b.st === 'wake' && b.say) {
      ctx.fillStyle = INK; ctx.font = '15px "Permanent Marker", cursive'; ctx.textAlign = 'center';
      ctx.fillText(b.say, ((arena.PORCH && arena.PORCH.chairX) || W - 80) - 20, G - 110);
    }
    if (b.mower.on) drawMower(b.mower, {say: b.say});
  },
  // you can shoot him; it only makes him yell
  zone(b, x, y, pad) {
    const m = b.mower;
    if (!m.on || b.st !== 'mow') return 0;
    return Math.abs(x - m.x) < 44 + pad && y > G - 96 && y < G ? 1 : 0;
  },
  onHit(b) {
    grandpaYell(b, ['GET OFF MY LAWN!', 'HEY!', 'Darn kids.', 'I fought in a war for this lawn.'][Math.floor(Math.random() * 4)]);
    return 0;
  },
  aimPoint() { return null; },
};
