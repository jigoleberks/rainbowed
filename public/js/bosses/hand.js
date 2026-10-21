/* The Hand: the cabin's sub-boss. A detached hand clutching a kitchen knife climbs up out of
   the cellar and scuttles around on its fingers. It hides under the furniture (you can't hit
   it there), then springs out at you with the knife. Small and quick: kicks help. Beaten, it
   crawls back down the trap door. */

const HAND_HIDES = [{x: 390, y: G}, {x: 624, y: G}, {x: 230, y: G}];   // under the table, the armchair, the hearth

function drawHandThing(x, y, f, o = {}) {
  const ph = o.phase || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const skin = o.hit ? '#e8b0a0' : '#b7c49e', ink = o.hit ? ACCENT : INK;
  // fingers as legs, scuttling
  for (let i = 0; i < 4; i++) {
    const fx = -12 + i * 8, sw = Math.sin(ph + i * 1.7) * 5;
    ctx.strokeStyle = ink; ctx.lineWidth = 6.5; ctx.beginPath(); ctx.moveTo(fx, -12); ctx.quadraticCurveTo(fx + sw, -18, fx + sw * 1.4 + 3, 0); ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, -12); ctx.quadraticCurveTo(fx + sw, -18, fx + sw * 1.4 + 3, 0); ctx.stroke();
  }
  // the palm (back of the hand), with a stump at the wrist
  ctx.fillStyle = skin; ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, -18, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8f2f28'; ctx.beginPath(); ctx.ellipse(-19, -18, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#7d8a64'; ctx.lineWidth = 1.5; line(-6, -22, 6, -20); line(-4, -15, 8, -16);
  // thumb gripping a kitchen knife
  ctx.save(); ctx.translate(14, -22); ctx.rotate(o.stab ? -0.2 : -0.9);
  ctx.fillStyle = '#6b4a2c'; ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.fillRect(-3, -4, 12, 8); ctx.strokeRect(-3, -4, 12, 8);
  ctx.fillStyle = '#dfe3ea'; ctx.beginPath(); ctx.moveTo(9, -4); ctx.lineTo(34, -1); ctx.lineTo(9, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = skin; ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(13, -21, 6, 4, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function handTouch(b) {
  if (state !== 'play' || invuln > 0 || player.kickT > 0 || rainbowT > 0) return;
  if (hp <= 1) deathTitle = "Should've stayed in the car.";
  hurt(b);
}

function updateHand(b, dt, fighting) {
  const dx = player.x - b.x, dy = player.y - b.y;
  b.phase += dt * (Math.abs(b.vx) * 0.09 + 2);
  switch (b.st) {
    case 'emerge':
      // up out of the cellar
      b.t -= dt; b.y = G + 24 * Math.max(0, b.t / 1.0);
      if (arena.st) arena.st.trap = 0.4;
      if (b.t <= 0) {
        b.y = G; b.st = 'scuttle'; b.cd = 2;
        banner = {title: 'THE HAND', sub: 'It came up from the cellar. It brought a knife.', life: 2.8};
      }
      return;
    case 'scuttle':
      if (!fighting) { b.vx = 0; break; }
      b.facing = Math.sign(dx) || b.facing;
      b.vx = Math.abs(dx) > 14 ? b.facing * (230 + b.level * 30) : 0;
      if (b.onGround && dy < -60 && Math.abs(dx) < 160 && b.hopCd <= 0) { b.vy = -640; b.hopCd = 1; }
      b.hopCd -= dt; b.cd -= dt;
      if (b.cd <= 0) {
        // run and hide under the nearest furniture
        b.hide = HAND_HIDES.reduce((a, h) => Math.abs(h.x - b.x) < Math.abs(a.x - b.x) ? h : a);
        b.st = 'tohide';
      }
      break;
    case 'tohide': {
      const d = b.hide.x - b.x; b.facing = Math.sign(d) || b.facing;
      b.vx = Math.sign(d) * 320;
      if (Math.abs(d) < 8 && b.onGround) { b.vx = 0; b.x = b.hide.x; b.st = 'hidden'; b.hidden = true; b.t = rand(1.0, 1.8); }
      if (!b.onGround) b.drop = 0.2;
      break;
    }
    case 'hidden':
      // under the furniture: can't be hit, just a glint of the knife
      b.vx = 0; b.t -= dt; b.facing = Math.sign(dx) || b.facing;
      if (b.t <= 0) { b.st = 'peek'; b.t = 0.4; b.hidden = false; }
      break;
    case 'peek':
      b.t -= dt;
      if (b.t <= 0) {
        // spring at you, knife first
        const d = Math.hypot(dx, dy - 30) || 1;
        b.st = 'spring'; b.t = 0.6; b.vx = dx / d * (520 + b.level * 40); b.vy = Math.min(-300, (dy - 30) / d * 520 - 200); b.onGround = false;
      }
      break;
    case 'spring':
      b.t -= dt;
      if (b.t <= 0 && b.onGround) { b.st = 'scuttle'; b.cd = rand(2.2, 3.4) - b.level * 0.3; }
      break;
  }
  b.drop -= dt;
  if (b.st !== 'emerge') physics(b, dt, b.drop > 0);
  if (b.x < 18) { b.x = 18; b.vx = Math.abs(b.vx); }
  if (b.x > W - 18) { b.x = W - 18; b.vx = -Math.abs(b.vx); }
  if (b.st !== 'hidden' && b.st !== 'emerge' && Math.abs(player.x - b.x) < 24 && player.y > b.y - 30 && player.y - 70 < b.y) handTouch(b);
}

// beaten: it scuttles back to the trap door and drops into the cellar
function handGoesHome(x, y) {
  const trap = arena.TRAP ? (arena.TRAP.x0 + arena.TRAP.x1) / 2 : W / 2;
  const h = {x, y, vx: 0, vy: -200, onGround: false, phase: 0, f: trap > x ? 1 : -1, life: 4, drop: 0};
  h.update = dt => {
    h.life -= dt;
    const d = trap - h.x; h.f = Math.sign(d) || h.f; h.vx = clamp(d * 4, -260, 260); h.phase += dt * 20;
    physics(h, dt, true);
    if (Math.abs(d) < 6 || h.life <= 0) { h.done = true; if (arena.st) arena.st.trap = 0.6; }
  };
  h.draw = () => drawHandThing(h.x, h.y, h.f, {phase: h.phase});
  props.push(h);
}

BOSSES.hand = {
  name: 'THE HAND', ko: 'HANDLED', koSub: 'It crawled back into the cellar.', koCaption: 'Give it a hand.', pts: 7500, koZoom: 2.6,
  warning: 'Something is scratching under the trap door.',
  spawn(level) {
    const x = arena.TRAP ? (arena.TRAP.x0 + arena.TRAP.x1) / 2 : W / 2;
    return {x, y: G + 24, vx: 0, vy: 0, onGround: true, facing: -1, phase: 0, scale: 1, hp: 26 + level * 9,
      st: 'emerge', t: 1, cd: 2, hopCd: 0, drop: 0, hitT: 0, hidden: false, name: 'THE HAND'};
  },
  update(b, dt, fighting) { updateHand(b, dt, fighting); },
  draw(b) {
    if (b.exploded) return;
    if (b.st === 'hidden') {
      // just the knife, glinting under the furniture
      if (Math.floor(clock * 4) % 2) { ctx.fillStyle = '#dfe3ea'; ctx.beginPath(); ctx.moveTo(b.x, b.y - 4); ctx.lineTo(b.x + b.facing * 16, b.y - 2); ctx.lineTo(b.x, b.y); ctx.fill(); }
      return;
    }
    drawHandThing(b.x, b.y, b.facing, {phase: b.phase, stab: b.st === 'spring', hit: b.hitT > 0});
    if (b.st === 'peek') { ctx.font = '22px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = ACCENT; ctx.fillText('!', b.x, b.y - 40); }
  },
  zone(b, x, y, pad) {
    if (b.st === 'emerge' || b.hidden) return 0;
    if (Math.abs(x - b.x) < 24 + pad && y > b.y - 32 && y < b.y + 4) return 1;
    return 0;
  },
  // kicks are your friend against something this small
  damage(zone, src) { return src === 'kick' ? 6 : src === 'launch' ? 3 : src === 'grenade' ? 6 : 1; },
  aimPoint(b) {
    if (b.st === 'emerge' || b.hidden) return null;
    return {x: b.x, y: b.y - 16, d: Math.hypot(b.x - player.x, (b.y - player.y) * 1.3)};
  },
  koY(b) { return b.y - 18; },
  explode(b) {
    b.exploded = true;
    burst(b.x, b.y - 18, 0, -300, 90);
    shake = 14;
    for (let i = 0; i < 3; i++) rings.push({x: b.x, y: b.y - 18, r: 6 + i * 26, life: 0.35 + i * 0.1});
    handGoesHome(b.x, b.y);
  },
};
