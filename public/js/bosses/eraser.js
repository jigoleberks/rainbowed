/* The Eraser: Page One's finale. Survive 45 seconds while it scrubs rows of the arena. */
const EW = 170, EH = 74, ERASER_TIME = 45;

function eraserCrumbs(x, y, n) {
  for (let i = 0; i < n; i++) parts.push({x: x + rand(-8, 8), y: y + rand(-4, 4), vx: rand(-120, 120), vy: rand(-160, -20), h: 0, r: rand(1.2, 2.6), life: rand(0.5, 0.9), spark: true, ink: true, col: Math.random() < 0.5 ? '#e993a6' : '#9b9fab'});
}

function eraseMe() {
  if (player.dead) return;
  if (cheatLoaf && hp > 5) {
    hp -= 5; invuln = 1.5;
    player.vy = -560; player.vx = (player.x < W / 2 ? 1 : -1) * 300;
    eraserCrumbs(player.x, player.y - 40, 30); shake = 12;
    texts.push({x: player.x, y: player.y - 100, s: 'THE LOAF PROTECTS', life: 1.2, big: false});
    return;
  }
  deathTitle = 'You got erased.'; hp = 0; player.dead = true; state = 'dying';
  eraserCrumbs(player.x, player.y - 40, 60);
  slow = 1.2; overT = 1.8; shake = 14;
}

function eraserBored(b) {
  const pts = 3000 * (b.level + 1);
  score += pts; hp = Math.min(maxHp(), hp + 1);
  boss = null; nextBossAt += 25; spawnT = 1.8;
  banner = {title: 'THE ERASER GOT BORED', sub: 'Survived   ·   +' + pts + '   ·   +1 life', life: 3};
}

function updateEraser(b, dt, fighting) {
  b.wob += dt;
  if (fighting && b.st !== 'enter' && b.st !== 'leave') {
    b.timer -= dt;
    if (b.timer <= 0) { b.timer = 0; b.st = 'leave'; }
  }
  const fast = b.timer < 20 ? 1.25 : 1, hover = 110;
  switch (b.st) {
    case 'enter':
      b.y += 260 * dt;
      if (b.y >= hover) {
        b.y = hover; b.st = 'pick';
        banner = {title: 'THE ERASER', sub: 'Survive ' + ERASER_TIME + ' seconds. Its worn bottom edge takes extra damage.', life: 3};
      }
      break;
    case 'pick': {
      // rows: the floor plus every shelf height. Skip the floor while the lowest shelves are
      // erased, so there's always somewhere to stand.
      const shelfRows = [...new Set(PLATS.map(p => p.y))].sort((p, q) => q - p);
      const lowGone = PLATS.some(p => p.y === shelfRows[0] && p.gone > 0);
      let rows = [G, ...shelfRows].filter(r => r !== b.lastRow && !(r === G && lowGone));
      if (!rows.length) rows = [shelfRows[0]];
      b.row = rows[Math.floor(Math.random() * rows.length)]; b.lastRow = b.row;
      b.dir = Math.random() < 0.5 ? 1 : -1;
      b.tx = b.dir > 0 ? -EW / 2 + 24 : W + EW / 2 - 24;
      b.st = 'move';
      break;
    }
    case 'move': {
      const d = b.tx - b.x;
      b.x += clamp(d, -1100 * dt, 1100 * dt);
      b.y += (hover - b.y) * Math.min(1, dt * 8);
      if (Math.abs(d) < 2) { b.st = 'aimWind'; b.t = 0.95 / fast; }
      break;
    }
    case 'aimWind':
      b.t -= dt;
      if (b.t <= 0) b.st = 'slam';
      break;
    case 'slam':
      b.y += 1400 * dt;
      if (b.y >= b.row) { b.y = b.row; b.st = 'sweep'; shake = Math.max(shake, 8); eraserCrumbs(b.x, b.y, 14); }
      break;
    case 'sweep': {
      b.x += b.dir * (300 + b.level * 40) * fast * dt;
      sctx.clearRect(b.x - EW / 2, b.y - EH - 6, EW, EH + 10);
      for (const pl of PLATS) {
        if (Math.abs(pl.y - b.y) < 2 && !(pl.gone > 0) && b.x + EW / 2 > pl.x && b.x - EW / 2 < pl.x + pl.w) {
          pl.gone = 4.5;
          eraserCrumbs(clamp(b.x, pl.x, pl.x + pl.w), pl.y, 20);
        }
      }
      for (const e of enemies) {
        if (!e.dead && Math.abs(e.x - b.x) < EW / 2 && e.y - 40 > b.y - EH && e.y - 40 < b.y) { e.dead = true; eraserCrumbs(e.x, e.y - 40, 20); }
      }
      if (Math.random() < dt * 30) eraserCrumbs(b.x - b.dir * EW / 2, b.y - 4, 2);
      if ((b.dir > 0 && b.x > W + EW / 2) || (b.dir < 0 && b.x < -EW / 2)) b.st = 'lift';
      break;
    }
    case 'lift':
      b.y -= 900 * dt;
      if (b.y <= hover) { b.y = hover; b.st = 'pick'; }
      break;
    case 'leave':
      b.y -= 500 * dt;
      if (b.y < -EH - 30) eraserBored(b);
      return;
  }
  // only the slam and the scrub erase you; hovering overhead is harmless
  if (fighting && rainbowT <= 0 && invuln <= 0 && (b.st === 'slam' || b.st === 'sweep')) {
    if (Math.abs(player.x - b.x) < EW / 2 + 4 && player.y - 74 < b.y - 6 && player.y > b.y - EH + 6) eraseMe();
  }
}


function drawEraser(b) {
  if (b.st === 'aimWind') {
    const a = 0.5 + 0.5 * Math.sin(clock * 20);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.4 * a;
    ctx.setLineDash([10, 8]); ctx.strokeStyle = ACCENT; ctx.lineWidth = 3;
    line(0, b.row - EH / 2, W, b.row - EH / 2);
    ctx.setLineDash([]);
    ctx.fillStyle = ACCENT; ctx.font = '26px "Permanent Marker", cursive'; ctx.textAlign = 'center';
    const ax = b.dir > 0 ? 40 : W - 40;
    ctx.fillText(b.dir > 0 ? '\u2192 !' : '! \u2190', ax, b.row - EH / 2 - 10);
    ctx.restore();
  }
  const tilt = b.st === 'sweep' ? Math.sin(b.wob * 18) * 0.04 - b.dir * 0.05 : 0;
  ctx.save();
  ctx.translate(b.x, b.y - EH / 2);
  ctx.rotate(tilt);
  const x0 = -EW / 2, y0 = -EH / 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 22, y0); ctx.lineTo(x0 + EW - 22, y0); ctx.lineTo(x0 + EW, y0 + 18); ctx.lineTo(x0 + EW, y0 + EH - 6);
  ctx.quadraticCurveTo(x0 + EW, y0 + EH, x0 + EW - 8, y0 + EH); ctx.lineTo(x0 + 8, y0 + EH);
  ctx.quadraticCurveTo(x0, y0 + EH, x0, y0 + EH - 6); ctx.lineTo(x0, y0 + 18); ctx.closePath();
  ctx.fillStyle = b.hitT > 0 ? '#f7c3cf' : '#f0a3b4'; ctx.fill();
  // worn bottom edge (the weak spot)
  ctx.fillStyle = '#b9a2a8';
  ctx.fillRect(x0 + 3, y0 + EH - 13, EW - 6, 10);
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.lineWidth = 2;
  line(x0 + 22, y0, x0 + 22, y0 + EH - 13); line(x0 + EW - 22, y0, x0 + EW - 22, y0 + EH - 13);
  line(x0 + 2, y0 + EH - 13, x0 + EW - 2, y0 + EH - 13);
  ctx.fillStyle = INK; ctx.font = '22px "Permanent Marker", cursive'; ctx.textAlign = 'center';
  ctx.fillText('ERASE', 0, 8);
  ctx.restore();
}


BOSSES.eraser = {
  name: 'THE ERASER', ko: 'THE ERASER IS ERASED', pts: 50000, koZoom: 1.6,
  warning: 'Someone is unhappy with this drawing.',
  spawn(level) {
    return {x: W / 2, y: -30, vx:0, vy:0, scale:1, facing:1, hp: 600 + level * 200, st:'enter', t:0,
      timer: ERASER_TIME, row: null, lastRow: null, dir: 1, tx: W / 2, hitT:0, wob:0, name:'THE ERASER'};
  },
  update(b, dt, fighting) { updateEraser(b, dt, fighting); },
  draw: drawEraser,
  zone(b, x, y, pad) {
    if (Math.abs(x - b.x) < EW / 2 + pad && y > b.y - EH - pad && y < b.y + pad) return y > b.y - 14 ? 2 : 1;
    return 0;
  },
  damage(zone, src) {
    if (src === 'kick') return zone === 2 ? 12 : 3;
    if (src === 'launch') return 2;
    return zone === 2 ? 4 : 1;
  },
  aimPoint(b) {
    if (!bossZone(b, b.x, b.y - 5, 0) || b.x < -EW / 2 || b.x > W + EW / 2) return null;
    const ex = clamp(player.x, b.x - EW / 2 + 12, b.x + EW / 2 - 12);
    return {x: ex, y: b.y - 7, d: Math.hypot(ex - player.x, (b.y - player.y) * 1.3)};
  },
  koY(b) { return b.y - EH / 2; },
  explode(b) {
    const cx = clamp(b.x, 0, W), cy = b.y - EH / 2;
    burst(cx, cy, 0, -300, 160); burst(cx, cy, 0, -100, 80);
    eraserCrumbs(cx, cy, 140);
    shake = 22;
    for (let i = 0; i < 4; i++) rings.push({x: cx, y: cy, r: 6 + i * 30, life: 0.35 + i * 0.1});
  },
};
