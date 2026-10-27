/* The Trapper: the Woods sub-boss. He set every trap out here and he is furious at you for
   wasting them. He stomps out of the trees complaining, throws bear traps that snap shut where
   they land, lays them at his feet, and swings a big net. He walks right through his own traps
   because he knows where they all are. Every time one of them goes off he complains about it.
   Beaten, he backs into his own snare and hangs upside down in a tree, still complaining. */

const TRAPPER_S = 1.25;

function drawTrapper(x, y, f, o = {}) {
  const s = o.s || TRAPPER_S, step = Math.sin(o.phase || 0) * 7;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(f * s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ink = o.hit ? ACCENT : INK;
  ctx.strokeStyle = ink;
  // legs and boots
  ctx.lineWidth = 5; ctx.strokeStyle = '#4a3a2a';
  line(-5, -36, -5 + step, -4); line(5, -36, 5 - step, -4);
  ctx.fillStyle = '#2a2018'; ctx.strokeStyle = ink; ctx.lineWidth = 2;
  for (const bx of [-5 + step, 5 - step]) { ctx.beginPath(); ctx.ellipse(bx + 3, -3, 7, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  // the plaid jacket
  ctx.fillStyle = '#b83a2e'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-15, -84); ctx.lineTo(15, -84); ctx.lineTo(17, -34); ctx.lineTo(-17, -34); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(20, 16, 20, 0.55)'; ctx.lineWidth = 3;
  for (let k = -14; k <= 14; k += 8) line(k, -86, k, -32);
  for (let k = -80; k <= -36; k += 9) line(-18, k, 18, k);
  ctx.restore();
  ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-15, -84); ctx.lineTo(15, -84); ctx.lineTo(17, -34); ctx.lineTo(-17, -34); ctx.closePath(); ctx.stroke();
  // arms
  ctx.lineWidth = 5; ctx.strokeStyle = '#b83a2e';
  if (o.arm === 'up') { line(8, -80, 18, -100); line(18, -100, 22, -116); }
  else if (o.arm === 'net') { line(8, -78, 26, -70); }
  else { line(8, -80, 16, -62); line(16, -62, 20, -46); }
  line(-8, -80, -14, -62); line(-14, -62, -16, -46);
  ctx.fillStyle = PAPER; ctx.strokeStyle = ink; ctx.lineWidth = 2;
  // head, and a beard you could lose a squirrel in
  ctx.beginPath(); ctx.arc(2, -96, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6b4a2c';
  ctx.beginPath(); ctx.moveTo(-9, -96); ctx.quadraticCurveTo(-14, -66, 2, -60); ctx.quadraticCurveTo(18, -66, 13, -96);
  ctx.quadraticCurveTo(6, -88, 2, -90); ctx.quadraticCurveTo(-2, -88, -9, -96); ctx.fill(); ctx.stroke();
  if (o.mouth) { ctx.fillStyle = '#1d1b22'; ctx.beginPath(); ctx.ellipse(6, -84, 4, 3 + Math.abs(Math.sin(clock * 20)) * 2, 0, 0, Math.PI * 2); ctx.fill(); }
  // eyes and angry eyebrows
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(8, -98, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.2; line(3, -104, 11, -101);
  // fur hat with a striped tail down the back
  ctx.fillStyle = '#8a6440'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-10, -103); ctx.quadraticCurveTo(-10, -118, 2, -118); ctx.quadraticCurveTo(14, -118, 14, -103); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(-10, -108); ctx.rotate(0.9 + Math.sin(clock * 4) * 0.1);
  ctx.beginPath(); ctx.ellipse(0, 12, 4, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; for (const k of [4, 10, 16]) line(-3.5, k, 3.5, k);
  ctx.restore();
  // the net on its pole
  if (o.net !== undefined) {
    ctx.save(); ctx.translate(24, -70); ctx.rotate(o.net);
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 4; line(0, 0, 54, 0);
    ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(70, 0, 16, 20, 0, 0, Math.PI * 2); ctx.stroke();
    for (let k = -14; k <= 14; k += 7) line(56 + Math.abs(k) * 0.5, k, 84 - Math.abs(k) * 0.5, k);
    ctx.restore();
  }
  ctx.restore();
}

// a bear trap: thrown or laid, it snaps shut on whatever steps in it
function bearTrap(x, y, vx, vy) {
  const t = {x, y, vx, vy, st: vx || vy ? 'fly' : 'set', t: 10};
  const snap = () => { t.st = 'shut'; t.t = 1; dust(t.x, t.y, 6, 10); texts.push({x: t.x, y: t.y - 40, s: 'SNAP', life: 0.6, big: false}); };
  t.update = dt => {
    if (t.st === 'fly') {
      const py = t.y;
      t.vy += GRAV * 0.8 * dt; t.x += t.vx * dt; t.y += t.vy * dt;
      if (t.x < 14 || t.x > W - 14) { t.x = clamp(t.x, 14, W - 14); t.vx *= -0.4; }
      if (state === 'play' && !player.dead && invuln <= 0 && rainbowT <= 0 && Math.abs(player.x - t.x) < 16 && t.y > player.y - 80 && t.y < player.y) {
        if (hp <= 1) deathTitle = 'Trapped.';
        hurt(t); snap(); return;
      }
      if (t.vy > 0) { const ly = landY(t.x, py, t.y); if (ly !== null) { t.y = ly; t.st = 'set'; dust(t.x, ly, 4, 6); } }
      return;
    }
    t.t -= dt;
    if (t.t <= 0) { t.done = true; return; }
    if (t.st !== 'set') return;
    if (state === 'play' && !player.dead && player.onGround && Math.abs(player.y - t.y) < 2 && Math.abs(player.x - t.x) < 13 && rainbowT <= 0) {
      snap();
      if (invuln <= 0) { if (hp <= 1) deathTitle = 'Trapped.'; hurt(t); }
      stun(t, 0.5);
      return;
    }
    for (const e of enemies) if (!e.dead && !e.launched && e.onGround && Math.abs(e.y - t.y) < 2 && Math.abs(e.x - t.x) < 12) {
      snap();
      if (arena.woodsGot) arena.woodsGot(e, 0, -300, 'SNAP'); else kill(e, 0, -300, false);
      if (arena.sprung) arena.sprung('trap', t.x);
      return;
    }
  };
  t.draw = () => {
    ctx.save(); ctx.translate(t.x, t.y);
    if (t.st === 'fly') ctx.rotate(clock * 12);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#8a8f99';
    ctx.beginPath(); ctx.ellipse(0, -2, 15, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a5f69'; ctx.lineWidth = 2.5;
    if (t.st === 'shut') { line(-10, -4, 0, -14); line(10, -4, 0, -14); }
    else {
      // open jaws, teeth up
      ctx.beginPath(); ctx.arc(-8, -2, 8, Math.PI, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(8, -2, 8, Math.PI * 1.1, 0); ctx.stroke();
      ctx.lineWidth = 1.5; for (const k of [-13, -8, -3, 3, 8, 13]) line(k, -4, k, -8 - (Math.abs(k) < 6 ? 2 : 0));
    }
    ctx.restore();
  };
  props.push(t);
  return t;
}

function trapperSay(b, s, t = 1.6) { b.say = s; b.sayT = t; }

function updateTrapper(b, dt, fighting) {
  const S = TRAPPER_S, dx = player.x - b.x, dy = player.y - b.y;
  b.sayT = Math.max(0, b.sayT - dt); if (b.sayT <= 0) b.say = null;
  b.phase += dt * Math.abs(b.vx) * 0.06;
  switch (b.st) {
    case 'enter':
      // stomps out of the trees on the right
      b.vx = -110; b.x += b.vx * dt; b.facing = -1;
      if (!b.said && b.x < W + 10) { b.said = true; trapperSay(b, 'WHO keeps setting off my TRAPS?!', 2.2); }
      if (b.x < W - 150) {
        b.st = 'walk'; b.cd = 1.4; b.vx = 0;
        banner = {title: 'THE TRAPPER', sub: "Every trap out here is his. He walks right through them. You can't.", life: 3};
      }
      return;
    case 'walk': {
      if (!fighting) { b.vx = 0; return; }
      b.facing = Math.sign(dx) || b.facing;
      const want = Math.abs(dx) > 150 ? b.facing * (95 + b.level * 20) : (Math.abs(dx) < 70 ? -b.facing * 60 : 0);
      b.vx += (want - b.vx) * Math.min(1, dt * 4);
      b.x = clamp(b.x + b.vx * dt, 30, W - 30);
      b.cd -= dt;
      if (b.cd <= 0) {
        if (Math.abs(dx) < 130 && Math.abs(dy) < 70) { b.st = 'netWind'; b.t = 0.5; }
        else if (Math.random() < 0.7) { b.st = 'wind'; b.t = 0.5; }
        else { b.st = 'lay'; b.t = 0.6; b.layX = clamp(player.x - b.facing * 40, 40, W - 40); }
        b.vx = 0;
      }
      break;
    }
    case 'wind':
      // winds up a bear trap
      b.t -= dt;
      if (b.t <= 0) {
        const n = 1 + (b.level > 0 || Math.random() < 0.3 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const hx = b.x + b.facing * 20 * S, hy = b.y - 112 * S, T = 0.85 + i * 0.25;
          const tx = clamp(player.x + (i ? rand(-90, 90) : 0), 20, W - 20), ty = i ? G : player.y;
          bearTrap(hx, hy, (tx - hx) / T, ((ty - hy) - 0.5 * GRAV * 0.8 * T * T) / T);
        }
        if (Math.random() < 0.5) trapperSay(b, ['Step in THAT.', 'Catch!', 'Here, have one.'][Math.floor(Math.random() * 3)]);
        b.st = 'recover'; b.t = 0.5;
      }
      break;
    case 'lay':
      // walks over and sets one down, right where you're going to step
      b.t -= dt;
      b.facing = Math.sign(b.layX - b.x) || b.facing;
      b.x += clamp(b.layX - b.x, -160 * dt, 160 * dt); b.vx = 0; b.phase += dt * 8;
      if (b.t <= 0) { bearTrap(b.x + b.facing * 24, G, 0, 0); b.st = 'recover'; b.t = 0.4; }
      break;
    case 'netWind':
      b.t -= dt; b.facing = Math.sign(dx) || b.facing;
      if (b.t <= 0) { b.st = 'netSwing'; b.t = 0.3; b.netHit = false; }
      break;
    case 'netSwing': {
      b.t -= dt;
      const lx = dx * b.facing;
      if (!b.netHit && b.t < 0.2 && lx > -10 && lx < 135 && dy > -150 && dy < 20 && state === 'play' && invuln <= 0 && rainbowT <= 0) {
        b.netHit = true;
        if (hp <= 1) deathTitle = 'Trapped.';
        hurt(b); texts.push({x: player.x, y: player.y - 110, s: 'NETTED', life: 0.8, big: false});
      }
      if (b.t <= 0) { b.st = 'recover'; b.t = 0.5; }
      break;
    }
    case 'recover':
      b.t -= dt;
      if (b.t <= 0) { b.st = 'walk'; b.cd = rand(1.3, 2.1) - b.level * 0.3; }
      break;
  }
  // bumping into him
  if (state === 'play' && invuln <= 0 && rainbowT <= 0 && player.kickT <= 0 && Math.abs(dx) < 20 * S && player.y > b.y - 110 * S && player.y - 70 < b.y) {
    if (hp <= 1) deathTitle = 'Trapped.';
    hurt(b);
  }
}

// beaten: he backs into his own snare and gets yanked up into a tree by the ankle
function trapperHangs(x) {
  const lines = ['Get me DOWN from here!', 'This is MY snare!', 'I tied this one TOO well.', 'Nobody saw that.', '...this is fine.', 'Could you at least stop SHOOTING me?'];
  const h = {x: clamp(x, 60, W - 60), y: G, t: 0, life: 28, say: null, sayT: 0, next: 1.2, f: 1};
  const ankle = 120;
  h.update = dt => {
    h.t += dt; h.life -= dt;
    h.y = h.t < 0.3 ? G - (G - ankle) * (h.t / 0.3) : ankle;
    h.sayT -= dt; if (h.sayT <= 0) h.say = null;
    h.next -= dt;
    if (h.next <= 0) { h.say = lines[Math.floor(Math.random() * lines.length)]; h.sayT = 2; h.next = rand(4, 7); }
    if (h.life <= 0) {
      // the rope gives out: he drops, dusts himself off, and stomps off into the trees
      h.done = true; dust(h.x, G, 16, 20);
      texts.push({x: h.x, y: G - 80, s: 'THUD. Hmph.', life: 1.4, big: false});
    }
  };
  // shooting him just makes him yell
  h.target = true;
  h.zone = (bx, by, pad) => Math.abs(bx - h.x) < 22 + pad && by > h.y && by < h.y + 150 ? 1 : 0;
  h.hit = () => { h.say = ['HEY!', 'OW! Rude.', 'I am HANGING here!'][Math.floor(Math.random() * 3)]; h.sayT = 1.2; };
  h.draw = () => {
    ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 2.5; line(h.x, 0, h.x, h.y);
    drawTrapper(h.x, h.y, h.f, {rot: Math.PI + Math.sin(clock * 2.2) * 0.12, mouth: !!h.say});
    if (h.say) { ctx.fillStyle = PAPER; ctx.font = '13px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText(h.say, clamp(h.x, 120, W - 120), Math.min(G - 20, h.y + 175)); }
  };
  props.push(h);
}

BOSSES.trapper = {
  name: 'THE TRAPPER', ko: 'CAUGHT', koSub: 'He stepped in his own snare.', koCaption: "He'll be up there a while.", pts: 7500, koZoom: 2.2,
  warning: 'Somebody is very upset about his traps.',
  spawn(level) {
    return {x: W + 60, y: G, vx: 0, vy: 0, onGround: true, facing: -1, phase: 0, scale: TRAPPER_S, hp: 46 + level * 12,
      st: 'enter', t: 0, cd: 1.5, hitT: 0, say: null, sayT: 0, said: false, name: 'THE TRAPPER'};
  },
  update(b, dt, fighting) { updateTrapper(b, dt, fighting); },
  // the woods call this every time one of his traps goes off
  grumble(b, s) { if (b.st !== 'enter') trapperSay(b, s, 1.8); },
  draw(b) {
    if (b.exploded) return;
    const net = b.st === 'netWind' ? -1.2 : b.st === 'netSwing' ? -1.2 + (1 - b.t / 0.3) * 1.9 : undefined;
    drawTrapper(b.x, b.y, b.facing, {phase: b.phase, hit: b.hitT > 0, mouth: !!b.say, arm: b.st === 'wind' ? 'up' : net !== undefined ? 'net' : null, net});
    if (b.st === 'wind' || b.st === 'netWind') { ctx.font = '26px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT; ctx.fillText('!', b.x, b.y - 160); }
  },
  // what he's yelling, drawn over the dark so you can read it
  drawLit(b) {
    if (b.exploded || !b.say) return;
    ctx.fillStyle = PAPER; ctx.font = '15px "Permanent Marker", cursive'; ctx.textAlign = 'center';
    ctx.fillText(b.say, clamp(b.x, 150, W - 150), Math.max(24, b.y - 172));
  },
  zone(b, x, y, pad) {
    if (b.st === 'enter') return 0;
    const S = TRAPPER_S;
    if (Math.abs(x - b.x) < 19 * S + pad && y > b.y - 120 * S && y < b.y + 4) return y < b.y - 88 * S ? 2 : 1;
    return 0;
  },
  aimPoint(b) {
    if (b.st === 'enter') return null;
    return {x: b.x, y: b.y - 70 * TRAPPER_S, d: Math.hypot(b.x - player.x, (b.y - player.y) * 1.3)};
  },
  koY(b) { return b.y - 70 * TRAPPER_S; },
  explode(b) {
    b.exploded = true;
    burst(b.x, b.y - 70 * TRAPPER_S, 0, -300, 90);
    shake = 14;
    for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 60, r: 6 + i * 26, life: 0.35 + i * 0.1});
    texts.push({x: b.x, y: b.y - 120, s: 'WHOA-', life: 0.8, big: false});
    trapperHangs(b.x);
  },
};
