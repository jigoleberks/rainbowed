/* The Ink Blob: The Long Hallway's sub-boss. Oozes out from under a door, crawls after you
   leaving puddles that slow you down, drips from the ceiling, lunges, and swallows the
   lights one by one until the hallway is dark. Its eyes shine in the dark. Beat it and the
   ink turns to rainbows and the lights come back on. */

function inkSplash(x, y, n) {
  for (let i = 0; i < n; i++) parts.push({x: x + rand(-8, 8), y, vx: rand(-200, 200), vy: rand(-320, -60), h: 0, r: rand(1.5, 3.5), life: rand(0.4, 0.8), spark: true, ink: true});
}

// a puddle of ink on the floor or a shelf: slows you down while you stand in it
function inkPuddle(x, y, w) {
  const pd = {x, y, w, life: 9};
  pd.update = dt => { pd.life -= dt; if (pd.life <= 0) pd.done = true; };
  pd.slowAt = (px, py) => (Math.abs(py - pd.y) < 3 && Math.abs(wrapDx(px - pd.x)) < pd.w / 2) ? 0.45 : 1;
  pd.draw = () => {
    ctx.globalAlpha = Math.min(1, pd.life) * 0.9;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(pd.x, pd.y - 1, pd.w / 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  };
  if (props.filter(p => p.slowAt).length > 16) { const old = props.find(p => p.slowAt); if (old) old.done = true; }
  props.push(pd);
}

const blobR = b => 20 + 22 * Math.max(0, b.hp / b.maxHp);

function updateInkBlob(b, dt, fighting) {
  b.wob += dt; b.hitT = Math.max(0, b.hitT - dt);
  const r = blobR(b), dx = wrapDx(player.x - b.x), angry = b.hp < b.maxHp / 2;
  // drips from the ceiling
  for (const d of b.drips) {
    if (d.form > 0) { d.form -= dt; continue; }
    const py = d.y; d.vy += 1600 * dt; d.y += d.vy * dt;
    if (state === 'play' && invuln <= 0 && rainbowT <= 0 && Math.abs(wrapDx(player.x - d.x)) < 12 && d.y > player.y - 78 && d.y < player.y) { hurt({x: d.x}); d.done = true; inkSplash(d.x, d.y, 8); continue; }
    const ly = landY(d.x, py, d.y);
    if (ly !== null) { d.done = true; inkSplash(d.x, ly, 8); inkPuddle(d.x, ly, 30); }
  }
  b.drips = b.drips.filter(d => !d.done);

  if (b.st === 'enter') {
    b.t -= dt;
    if (b.t <= 0) {
      b.st = 'crawl';
      banner = {title: 'THE INK BLOB', sub: "It's eating the lights. Your rainbows glow in the dark.", life: 3.2};
    }
    return;
  }
  if (!fighting) return;
  b.lungeCd -= dt; b.reachT -= dt; b.dripT -= dt; b.puddleT -= dt;

  if (b.dripT <= 0) {
    const live = arena.lights ? arena.lights.filter(l => !l.dead).length : 4;
    b.dripT = (angry ? 1.3 : 2.0) - (4 - live) * 0.15;
    b.drips.push({x: wrapX(player.x + rand(-50, 50)), y: 22, vy: 0, form: 0.8});
  }

  switch (b.st) {
    case 'crawl': {
      const sp = (angry ? 85 : 60) + b.level * 10;
      b.vx += (Math.sign(dx) * sp - b.vx) * Math.min(1, dt * 3);
      b.facing = Math.sign(dx) || 1;
      if (b.onGround && b.puddleT <= 0 && Math.abs(b.vx) > 20) { b.puddleT = 0.55; inkPuddle(b.x, b.y, r * 1.4); }
      if (b.reachT <= 0 && arena.killLight) { b.st = 'reach'; b.t = 0.9; b.vx = 0; b.reachT = angry ? 5.5 : 7.5; break; }
      if (b.onGround && b.lungeCd <= 0 && Math.abs(dx) < 320) { b.st = 'lungeWind'; b.t = 0.6; b.vx = 0; }
      break;
    }
    case 'lungeWind':
      b.vx = 0; b.t -= dt;
      if (b.t <= 0) { b.st = 'lunge'; b.vy = -620; b.vx = clamp(dx / 0.7, -420, 420); }
      break;
    case 'lunge':
      if (b.onGround && b.vy >= 0) {
        b.st = 'crawl'; b.lungeCd = rand(2.2, 3.5) - (angry ? 0.8 : 0);
        shake = Math.max(shake, 8); inkSplash(b.x, b.y, 24); inkPuddle(b.x, b.y, 90);
      }
      break;
    case 'reach': {
      b.t -= dt;
      if (!b.reaching) {
        const live = arena.lights.filter(l => !l.dead);
        if (live.length) b.reaching = live.reduce((a, c) => Math.abs(wrapDx(c.x - b.x)) < Math.abs(wrapDx(a.x - b.x)) ? c : a);
      }
      if (b.t <= 0) {
        if (b.reaching && !b.reaching.dead) {
          arena.killLight(b.reaching.x);
          texts.push({x: b.reaching.x, y: 70, s: 'GULP', life: 0.9, big: false});
          inkSplash(b.reaching.x, 40, 14);
        }
        b.reaching = null; b.st = 'crawl';
      }
      break;
    }
  }
  physics(b, dt, false);
  b.x = wrapX(b.x);
  // touching it hurts
  if (state === 'play' && invuln <= 0 && player.kickT <= 0 && rainbowT <= 0 &&
      Math.abs(dx) < r * 1.1 + 8 && player.y - 40 > b.y - r * 1.6 - 30 && player.y - 40 < b.y + 10) hurt(b);
}

function blobShape(b, cx, cy, rx, ry) {
  ctx.beginPath();
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + b.wob * 4) * 0.06 + Math.sin(a * 5 - b.wob * 3) * 0.04;
    const px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

function blobGeom(b) {
  const r = blobR(b);
  let rx = r * 1.15, ry = r * 0.82;
  if (b.st === 'lungeWind') { rx *= 1.25; ry *= 0.7; }
  if (b.st === 'lunge') { rx *= 0.85; ry *= 1.15; }
  if (b.st === 'enter') { const k = 1 - Math.max(0, b.t) / 1.2; rx *= 0.3 + 0.7 * k; ry *= 0.15 + 0.85 * k; }
  return {cx: b.x, cy: b.y - ry, rx, ry};
}

function drawInkBlob(b) {
  for (const x of arena.wrap ? [b.x, b.x - W, b.x + W] : [b.x]) {
    if (x < -80 || x > W + 80) continue;
    const g = blobGeom({...b, x});
    blobShape(b, g.cx, g.cy, g.rx, g.ry);
    ctx.fillStyle = b.hitT > 0 ? '#3b3550' : INK; ctx.fill();
    if (b.st === 'reach' && b.reaching) {
      const lx = x + wrapDx(b.reaching.x - b.x);
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const p = Math.min(1, (0.9 - b.t) / 0.5);
      ctx.beginPath(); ctx.moveTo(g.cx, g.cy - g.ry * 0.6);
      ctx.quadraticCurveTo(g.cx + (lx - g.cx) * 0.3 + Math.sin(b.wob * 9) * 20, (g.cy + 40) / 2, g.cx + (lx - g.cx) * p, g.cy - g.ry + (40 - (g.cy - g.ry)) * p);
      ctx.stroke();
    }
  }
  for (const d of b.drips) {
    ctx.fillStyle = INK;
    const s = d.form > 0 ? (1 - d.form / 0.8) * 5 + 1 : 5;
    ctx.beginPath(); ctx.ellipse(d.x, d.y + s, s * 0.8, s * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// drawn over the darkness: the eyes, the shine, and a warning on drips that are forming
function drawInkBlobLit(b) {
  for (const x of arena.wrap ? [b.x, b.x - W, b.x + W] : [b.x]) {
    if (x < -80 || x > W + 80) continue;
    const g = blobGeom({...b, x});
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(g.cx - g.rx * 0.45, g.cy - g.ry * 0.45, g.rx * 0.18, g.ry * 0.1, -0.5, 0, Math.PI * 2); ctx.fill();
    const blink = Math.sin(b.wob * 1.7) > 0.97;
    const look = clamp(wrapDx(player.x - b.x) / 200, -1, 1) * 3;
    for (const s of [-1, 1]) {
      const ex = g.cx + s * g.rx * 0.3, ey = g.cy - g.ry * 0.2;
      ctx.fillStyle = '#f4f1ea';
      ctx.beginPath(); ctx.ellipse(ex, ey, 6, blink ? 0.8 : 7, 0, 0, Math.PI * 2); ctx.fill();
      if (!blink) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + look, ey + 1, 2.8, 0, Math.PI * 2); ctx.fill(); }
    }
    if (b.st === 'lungeWind') {
      ctx.font = '28px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT;
      ctx.fillText('!', g.cx, g.cy - g.ry - 14);
    }
  }
  for (const d of b.drips) if (d.form > 0) {
    ctx.strokeStyle = 'rgba(232,56,79,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.ellipse(d.x, G - 2, 14, 4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
}

BOSSES.inkblob = {
  name: 'THE INK BLOB', ko: 'LIGHTS BACK ON', koSub: 'The ink is rainbows now.', pts: 7500, koZoom: 2,
  warning: 'The lights are flickering.',
  spawn(level) {
    const doors = arena.doors && arena.doors.length ? arena.doors : [{x: W / 2, open: 0}];
    const d = doors.reduce((a, c) => Math.abs(wrapDx(c.x - player.x)) > Math.abs(wrapDx(a.x - player.x)) ? c : a);
    d.open = 0;
    inkSplash(d.x, G, 20);
    return {x: d.x, y: G, vx: 0, vy: 0, onGround: true, facing: 1, scale: 1, hp: 50 + level * 15, st: 'enter', t: 1.2,
      wob: 0, hitT: 0, lungeCd: 2.5, reachT: 3, dripT: 2, puddleT: 0, drips: [], name: 'THE INK BLOB'};
  },
  update(b, dt, fighting) { updateInkBlob(b, dt, fighting); },
  draw: drawInkBlob,
  drawLit: drawInkBlobLit,
  zone(b, x, y, pad) {
    const g = blobGeom(b), dx = wrapDx(x - b.x);
    if (Math.abs(dx) < g.rx + pad && y > g.cy - g.ry - pad && y < b.y + pad) return y < g.cy - g.ry * 0.1 ? 2 : 1;
    return 0;
  },
  aimPoint(b) {
    if (b.st === 'enter') return null;
    const g = blobGeom(b), ax = player.x + wrapDx(b.x - player.x);
    return {x: ax, y: g.cy - g.ry * 0.3, d: Math.hypot(ax - player.x, (b.y - player.y) * 1.3) - g.rx};
  },
  koY(b) { return b.y - 30; },
  explode(b) {
    const g = blobGeom(b);
    burst(b.x, g.cy, 0, -300, 160); burst(b.x, g.cy, 0, -150, 80);
    for (let i = 0; i < 4; i++) rings.push({x: b.x, y: g.cy, r: 6 + i * 30, life: 0.35 + i * 0.1});
    shake = 18;
    for (const p of props) if (p.slowAt) p.life = Math.min(p.life, 1.5);
    if (arena.relight) arena.relight();
  },
};
