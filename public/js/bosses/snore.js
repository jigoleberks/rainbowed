/* THE SNORE: the Fishing Cabin finale. He rolls onto his back and it gets apocalyptic. Snores
   come every couple of seconds, bigger every time; the furniture shakes, stuff falls off the
   loft, the ceiling fan spins loose, the room fills up with Z's, and the stickmen keep coming.
   The snores themselves never take a heart (they stun you); everything they knock loose does.
   He can't be hurt. Survive until the 5:00 alarm goes off for fishing. */

const SNORE_TIME = 45;

function snoreDrop(x) {
  // something shaken off the loft or the shelves: a shadow first, then it lands
  const kind = ['boot', 'can', 'lantern', 'book'][Math.floor(Math.random() * 4)];
  const d = {x, y: -20, vy: 0, warn: 0.6, kind, rot: 0};
  d.update = dt => {
    if (d.warn > 0) { d.warn -= dt; return; }
    d.vy += GRAV * 0.7 * dt; d.y += d.vy * dt; d.rot += dt * 8;
    if (state === 'play' && !player.dead && invuln <= 0 && rainbowT <= 0 && Math.abs(player.x - d.x) < 16 && d.y > player.y - 80 && d.y < player.y) {
      if (hp <= 1) deathTitle = 'You never got to sleep.';
      hurt(d); d.done = true; texts.push({x: d.x, y: d.y - 20, s: 'CLONK', life: 0.6, big: false}); return;
    }
    for (const e of enemies) if (!e.dead && Math.abs(e.x - d.x) < 14 && d.y > e.y - 80 && d.y < e.y) { kill(e, 0, 300, true); d.done = true; return; }
    const ly = landY(d.x, d.y - d.vy * dt, d.y);
    if (ly !== null && d.vy > 0) { d.done = true; dust(d.x, ly, 6, 8); texts.push({x: d.x, y: ly - 24, s: 'THUD', life: 0.5, big: false}); }
  };
  d.draw = () => {
    if (d.warn > 0) { ctx.fillStyle = 'rgba(20, 16, 26, 0.35)'; ctx.beginPath(); ctx.ellipse(d.x, G, 14 * (1 - d.warn / 0.6) + 4, 3, 0, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const fill = {boot: '#3a5a3a', can: '#c0392b', lantern: '#e0c46a', book: '#2b4a6b'}[d.kind];
    ctx.fillStyle = fill; ctx.fillRect(-8, -10, 16, 20); ctx.strokeRect(-8, -10, 16, 20);
    if (d.kind === 'boot') { ctx.fillRect(-8, 4, 20, 6); ctx.strokeRect(-8, 4, 20, 6); }
    ctx.restore();
  };
  props.push(d);
}

// halfway through, the ceiling fan spins loose and goes round the room
function snoreFan() {
  const f = {x: 400, y: 40, vx: (Math.random() < 0.5 ? -1 : 1) * 300, vy: 60, a: 0, life: 7};
  texts.push({x: 400, y: 70, s: 'THE FAN!', life: 1.2, big: false});
  f.update = dt => {
    f.life -= dt; f.a += dt * 25;
    f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.x < 30 || f.x > W - 30) { f.x = clamp(f.x, 30, W - 30); f.vx *= -1; }
    if (f.y > G - 20) { f.y = G - 20; f.vy = -Math.abs(f.vy) * 0.75 - 120; }
    if (state === 'play' && !player.dead && invuln <= 0 && rainbowT <= 0 && Math.abs(player.x - f.x) < 36 && f.y > player.y - 90 && f.y < player.y + 6) {
      if (hp <= 1) deathTitle = 'You never got to sleep.';
      hurt(f);
    }
    for (const e of enemies) if (!e.dead && Math.abs(e.x - f.x) < 34 && f.y > e.y - 90 && f.y < e.y + 6) { kill(e, f.vx, -300, false); texts.push({x: e.x, y: e.y - 100, s: 'FANNED', life: 0.6, big: false}); }
    if (f.life <= 0) { f.done = true; dust(f.x, G, 14, 20); texts.push({x: f.x, y: G - 40, s: 'CRASH', life: 0.8, big: false}); }
  };
  f.draw = () => {
    ctx.save(); ctx.translate(f.x, f.y); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#5a4128'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 4; k++) { const a = f.a + k * Math.PI / 2; ctx.fillStyle = '#7a5a3a'; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(18, 0, 16, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  };
  props.push(f);
}

function updateSnore(b, dt, fighting) {
  const S = arena.st && arena.st.snorer;
  b.sayT = Math.max(0, b.sayT - dt); if (b.sayT <= 0) b.say = null;
  switch (b.st) {
    case 'roll':
      // he rolls onto his back. Uh oh.
      b.t -= dt;
      if (S && b.t < 1 && !S.back) { S.back = true; S.roll = 0.5; texts.push({x: b.x - 30, y: b.y - 60, s: '*rolls onto back*', life: 1.2, big: false}); }
      if (b.t <= 0) {
        b.st = 'snore'; b.snoreT = 1.2; b.spawnT = 1;
        banner = {title: 'THE SNORE', sub: 'He rolled onto his back. Survive until the 5:00 alarm.', life: 3};
      }
      return;
    case 'alarm':
      // BEEP BEEP BEEP. He sits straight up, wide awake.
      b.t -= dt;
      if (b.t < 2.2 && !b.woke) { b.woke = true; b.say = 'Morning! Slept GREAT.'; b.sayT = 2.4; if (S) S.back = false; }
      if (b.t <= 0) {
        const pts = 4000 * (b.level + 1);
        score += pts; hp = Math.min(maxHp(), hp + 1);
        if (deathTitle === 'You never got to sleep.') deathTitle = null;
        nextBossAt += 25; spawnT = 1.8; boss = null;
        banner = {title: '5:00 A.M.', sub: 'Survived   ·   +' + pts + '   ·   +1 life', life: 3.4};
        unlockGun('rifle');
        texts.push({x: b.x, y: b.y - 70, s: '...five more minutes', life: 2, big: false});
      }
      return;
  }
  if (!fighting) return;
  b.timer -= dt;
  if (b.timer <= 0) {
    b.st = 'alarm'; b.t = 3.2;
    texts.push({x: W - 120, y: 120, s: 'BEEP BEEP BEEP', life: 2, big: false});
    if (typeof sfx !== 'undefined' && sfx.alarm) sfx.alarm();
    return;
  }
  const prog = 1 - b.timer / SNORE_TIME;
  // the snores, faster as the night goes on
  b.snoreT -= dt;
  if (b.snoreT < 0.9 && S) S.inhale = true;
  if (b.snoreT <= 0) {
    if (S) S.inhale = false;
    if (arena.snore) arena.snore(true);
    b.snoreT = Math.max(1.6, 2.8 - prog * 1.3 - b.level * 0.2) * rand(0.9, 1.1);
    // everything shakes, and something falls
    const n = 1 + (prog > 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) snoreDrop(rand(40, W - 40));
    if (Math.random() < 0.5) snoreDrop(clamp(player.x + rand(-40, 40), 20, W - 20));
  }
  if (!b.fanGone && prog > 0.5) { b.fanGone = true; snoreFan(); }
  // the stickmen keep coming
  b.spawnT -= dt;
  if (b.spawnT <= 0) { b.spawnT = rand(1.4, 2.2) - b.level * 0.2; if (enemies.length < 7) spawn(); }
  if (hp <= 1 && !deathTitle) deathTitle = 'You never got to sleep.';
}

BOSSES.snore = {
  name: 'THE SNORE', pts: 0, koZoom: 2,
  warning: 'He just rolled over...',
  spawn(level) {
    const h = arena.HEAD || {x: W / 2, y: G - 40};
    return {x: h.x, y: G, scale: 1, hp: 1, st: 'roll', t: 2.2, timer: SNORE_TIME, snoreT: 2, spawnT: 1.5,
      fanGone: false, woke: false, say: null, sayT: 0, hitT: 0, name: 'THE SNORE'};
  },
  update(b, dt, fighting) { updateSnore(b, dt, fighting); },
  draw() {},
  drawLit(b) {
    if (!b.say) return;
    ctx.fillStyle = PAPER; ctx.font = '16px "Permanent Marker", cursive'; ctx.textAlign = 'center';
    ctx.fillText(b.say, clamp(b.x, 150, W - 150), b.y - 70);
  },
  // you can shoot him. He doesn't notice.
  zone(b, x, y, pad) {
    const m = arena.MAT;
    if (!m || b.st !== 'snore') return 0;
    return x > m.x0 - pad && x < m.x1 + pad && y > m.y - 36 && y < G ? 1 : 0;
  },
  onHit(b) {
    if (Math.random() < 0.3) texts.push({x: b.x, y: b.y - 60, s: ['snrk', 'mmf', '*scratches*', 'zzz'][Math.floor(Math.random() * 4)], life: 0.7, big: false});
    return 0;
  },
  aimPoint() { return null; },
};
