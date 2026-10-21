/* The Tree: the cabin's finale. You can't kill it. Its branches burst in through the windows
   and the front door and reach for you. If one catches you it drags you back toward where it
   came in; shoot it or kick it to break its grip before you get there. Getting dragged all the
   way costs a heart. Survive until dawn and the branches slither back out. */

const TREE_TIME = 45;

function branchPath(br) {
  // from the opening toward the tip, with a slow wobble, as a list of points
  const pts = [], n = 10;
  const dx = br.tx - br.ox, dy = br.ty - br.oy, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let i = 0; i <= n; i++) {
    const k = i / n * br.reach;
    const wob = Math.sin(k * 7 + clock * 3 + br.seed) * 10 * k * (1 - k * 0.5);
    pts.push({x: br.ox + dx * k + nx * wob, y: br.oy + dy * k + ny * wob});
  }
  return pts;
}

function drawBranch(br) {
  const pts = branchPath(br);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [w, c] of [[16, INK], [12, br.flash > 0 ? '#e8b0a0' : '#5a3f2a']]) {
    for (let i = 1; i < pts.length; i++) {
      ctx.strokeStyle = c; ctx.lineWidth = w * (1 - i / pts.length * 0.65);
      line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
  }
  // twigs
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  for (let i = 2; i < pts.length - 1; i += 2) {
    const p = pts[i], s = i % 4 ? 1 : -1;
    line(p.x, p.y, p.x + s * 12, p.y - 14); line(p.x + s * 12, p.y - 14, p.x + s * 18, p.y - 12);
  }
  // grasping twig-fingers at the tip
  const t = pts[pts.length - 1], a = Math.atan2(t.y - pts[pts.length - 2].y, t.x - pts[pts.length - 2].x);
  const open = br.st === 'drag' ? 0.3 : 0.8 + Math.sin(clock * 8 + br.seed) * 0.2;
  ctx.lineWidth = 3;
  for (const s of [-1, -0.35, 0.35, 1]) {
    const fa = a + s * open;
    line(t.x, t.y, t.x + Math.cos(fa) * 16, t.y + Math.sin(fa) * 16);
  }
  return t;
}

function updateTree(b, dt, fighting) {
  const cab = arena.st || {};
  b.grabCd = Math.max(0, b.grabCd - dt);
  const tipOf = br => { const pts = branchPath(br); return pts[pts.length - 1]; };
  for (const br of b.branches) {
    br.flash = Math.max(0, br.flash - dt);
    if (br.st === 'grow') {
      br.reach = Math.min(1, br.reach + dt / br.dur);
      if (br.reach >= 1) { br.st = 'reach'; br.t = 0.6; }
    } else if (br.st === 'reach') {
      br.t -= dt; if (br.t <= 0) br.st = 'retract';
    } else if (br.st === 'retract') {
      br.reach -= dt / 0.7; if (br.reach <= 0) br.gone = true;
    } else if (br.st === 'drag') {
      // pulling you back toward where it came in
      const dx = br.ox - br.tx, dy = br.oy - br.ty, d = Math.hypot(dx, dy);
      const step = Math.min(d, (125 + b.level * 20) * dt);
      if (d > 1) { br.tx += dx / d * step; br.ty += dy / d * step; }
      const tip = tipOf(br);
      player.x = tip.x; player.y = Math.min(G, tip.y + 40); player.vx = 0; player.vy = 0;
      if (d < 26) {
        // dragged all the way out
        if (hp <= 1) deathTitle = "You're staying for the weekend.";
        releaseBranch(b, br, false);
        if (rainbowT <= 0) { invuln = 0; hurt({x: br.ox}); }
      }
    }
    // the tip grabs you
    if (fighting && !b.holding && b.grabCd <= 0 && (br.st === 'grow' || br.st === 'reach') && invuln <= 0 && rainbowT <= 0 && !player.dead) {
      const tip = tipOf(br);
      if (Math.hypot(tip.x - player.x, tip.y - (player.y - 40)) < 24) {
        br.st = 'drag'; br.grip = 5 + b.level * 2; br.tx = tip.x; br.ty = tip.y; br.reach = 1;
        b.holding = br;
        texts.push({x: player.x, y: player.y - 100, s: 'GRABBED!', life: 0.8, big: false});
        shake = Math.max(shake, 6);
      }
    }
  }
  b.branches = b.branches.filter(br => !br.gone);

  switch (b.st) {
    case 'intro':
      b.t -= dt;
      if (b.t <= 0) {
        b.st = 'night'; b.spawnT = 0.5;
        banner = {title: 'THE TREE', sub: "You can't kill it. Shoot or kick the branches off you. Survive till dawn.", life: 3.2};
      }
      return;
    case 'dawn':
      b.t -= dt; cab.dawn = Math.min(1, (cab.dawn || 0) + dt * 0.6);
      for (const br of b.branches) if (br.st !== 'retract') { if (br === b.holding) releaseBranch(b, br, true); else br.st = 'retract'; }
      if (b.t <= 0) {
        const pts = 4000 * (b.level + 1);
        score += pts; hp = Math.min(maxHp(), hp + 1);
        nextBossAt += 25; spawnT = 1.8; boss = null;
        banner = {title: 'THE SUN CAME UP', sub: 'Survived the night   ·   +' + pts + '   ·   +1 life', life: 3.4};
        // morning doesn't last in this cabin
        props.push({t: 18, update(dt) { this.t -= dt; if (this.t < 6) cab.dawn = Math.max(0, cab.dawn - dt / 6); if (this.t <= 0) this.done = true; }});
      }
      return;
  }
  if (!fighting) return;
  b.timer -= dt;
  if (b.timer <= 0) { b.st = 'dawn'; b.t = 2.4; return; }
  // more branches, more often, as the night goes on
  const prog = 1 - b.timer / TREE_TIME;
  b.spawnT -= dt;
  const max = 3 + Math.floor(prog * 2.5) + b.level;
  if (b.spawnT <= 0 && b.branches.filter(br => br.st !== 'retract').length < max) {
    b.spawnT = Math.max(0.9, 2.4 - prog * 1.3 - b.level * 0.3);
    const ops = arena.OPENINGS || [{x: 0, y: 200}];
    const o = ops[Math.floor(Math.random() * ops.length)];
    const tx = clamp(player.x + rand(-40, 40), 30, W - 30), ty = clamp(player.y - 40 + rand(-30, 30), 60, G - 20);
    // reach a bit past you, so dodging matters
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy) || 1, over = 60;
    b.branches.push({ox: o.x, oy: o.y, tx: tx + dx / d * over, ty: ty + dy / d * over, reach: 0, dur: rand(0.9, 1.3) - prog * 0.25,
      st: 'grow', seed: rand(0, 6), hp: 4, flash: 0});
    if (Math.random() < 0.5) texts.push({x: o.x, y: o.y - 30, s: o.kind === 'door' ? 'CRASH' : 'SMASH', life: 0.5, big: false});
  }
}

function releaseBranch(b, br, quiet) {
  br.st = 'retract';
  if (b.holding === br) {
    b.holding = null; b.grabCd = 1.0;
    const away = Math.sign(W / 2 - br.ox) || 1;
    player.vx = away * 320; player.vy = -340; player.onGround = false;
    if (!quiet) invuln = Math.max(invuln, 0.2);
  }
}

BOSSES.tree = {
  name: 'THE TREE', pts: 0, koZoom: 2,
  warning: 'The trees outside are moving.',
  spawn(level) {
    return {x: W / 2, y: G, scale: 1, hp: 1, st: 'intro', t: 1.6, timer: TREE_TIME, spawnT: 1, branches: [], holding: null, grabCd: 0, hitT: 0, name: 'THE TREE'};
  },
  update(b, dt, fighting) { updateTree(b, dt, fighting); },
  // drawn over the cabin's darkness, so you can always see what's reaching for you
  drawLit(b) { for (const br of b.branches) drawBranch(br); },
  // the branches can be hit (the tree itself can't): break a grip, or make one pull back
  zone(b, x, y, pad) {
    for (const br of b.branches) {
      if (br.st === 'retract' || br.reach < 0.2) continue;
      const pts = branchPath(br);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (Math.hypot(x - p.x, y - p.y) < 14 + pad) { b.hitBranch = br; return i > pts.length - 3 ? 2 : 1; }
      }
    }
    return 0;
  },
  onHit(b, dmg) {
    const br = b.hitBranch;
    if (!br || br.st === 'retract') return 0;
    br.flash = 0.08;
    if (br.st === 'drag') {
      br.grip -= dmg;
      if (br.grip <= 0) { releaseBranch(b, br, false); texts.push({x: player.x, y: player.y - 100, s: 'BROKE FREE', life: 0.9, big: false}); burst(br.tx, br.ty, 0, -200, 24); }
    } else {
      br.hp -= dmg;
      if (br.hp <= 0) { br.st = 'retract'; burst(br.tx, br.ty, 0, -150, 14); }
    }
    return 0;   // the bar is the tree, and it doesn't go down
  },
  // aim at whatever has hold of you, or the nearest reaching branch
  aimPoint(b) {
    const br = b.holding || b.branches.filter(x => x.st !== 'retract').sort((p, q) => Math.hypot(p.tx - player.x, p.ty - player.y) - Math.hypot(q.tx - player.x, q.ty - player.y))[0];
    if (!br) return null;
    const pts = branchPath(br), i = Math.max(1, pts.length - (b.holding ? 4 : 1)), p = pts[i];
    return {x: p.x, y: p.y, d: Math.hypot(p.x - player.x, (p.y - player.y) * 1.3)};
  },
};
