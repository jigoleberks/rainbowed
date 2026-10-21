/* The Clerk: the Waiting Room's finale. She sits behind the glass (so she can't be hurt) and
   stamps forms. Every stamp is a giant DENIED that slams down somewhere in the room: watch the
   outline, get out from under it. Now and then it's a green APPROVED instead, and standing
   under that one gets you a heart back. Survive until the clock hits 5:00 and she flips the sign
   to CLOSED and leaves mid-sentence. */

const CLERK_TIME = 45;

// where a stamp aimed at x would land: the first surface at or below the player
function stampSurface(x) {
  const from = Math.min(player.y, G) - 10;
  let best = G;
  for (const p of PLATS) if (!(p.gone > 0) && !p.z && x > p.x && x < p.x + p.w && p.y >= from && p.y < best) best = p.y;
  return best;
}

function drawStampBlock(x, y, approved, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#6b4a2c'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.fillRect(x - 14, y - 90, 28, 46); ctx.strokeRect(x - 14, y - 90, 28, 46);              // handle
  ctx.beginPath(); ctx.arc(x, y - 96, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();          // knob
  ctx.fillStyle = '#3a3a40'; ctx.fillRect(x - 60, y - 46, 120, 30); ctx.strokeRect(x - 60, y - 46, 120, 30);   // block
  ctx.fillStyle = approved ? '#2fb866' : '#e8384f'; ctx.fillRect(x - 58, y - 16, 116, 16); ctx.strokeRect(x - 58, y - 16, 116, 16);   // rubber
  ctx.restore();
}

// the ink it leaves behind, painted into the floor for the rest of the run
function inkStamp(x, y, approved) {
  sctx.save(); sctx.translate(x, y - 8); sctx.rotate(rand(-0.06, 0.06));
  sctx.strokeStyle = approved ? 'rgba(47,184,102,0.75)' : 'rgba(232,56,79,0.75)'; sctx.lineWidth = 3;
  sctx.strokeRect(-54, -14, 108, 24);
  sctx.fillStyle = sctx.strokeStyle; sctx.font = '700 17px "IBM Plex Mono", monospace'; sctx.textAlign = 'center';
  sctx.fillText(approved ? 'APPROVED' : 'DENIED', 0, 4);
  sctx.restore();
}

function updateClerk(b, dt, fighting) {
  const wr = arena.wr || {clerk: {}}, c = wr.clerk;
  for (const s of b.stamps) {
    s.t -= dt;
    if (s.st === 'aim' && s.t <= 0) { s.st = 'fall'; s.t = 0.12; }
    else if (s.st === 'fall' && s.t <= 0) {
      s.st = 'down'; s.t = 0.45;
      shake = Math.max(shake, s.approved ? 6 : 12); sfx.stamp(); inkStamp(s.x, s.y, s.approved);
      dust(s.x - 50, s.y, 6, 10); dust(s.x + 50, s.y, 6, 10);
      const under = state === 'play' && !player.dead && Math.abs(player.x - s.x) < 58 && player.y > s.y - 82 && player.y <= s.y + 4;
      if (s.approved) {
        if (under) { hp = Math.min(maxHp(), hp + 1); texts.push({x: player.x, y: player.y - 100, s: 'APPROVED! +1', life: 1.2, big: false}); burst(player.x, player.y - 40, 0, -200, 40); }
        for (const e of enemies) if (!e.dead && Math.abs(e.x - s.x) < 58 && e.y > s.y - 82 && e.y <= s.y + 4) kill(e, 0, -400, false);
      } else {
        if (under && invuln <= 0 && rainbowT <= 0) { if (hp <= 1) deathTitle = 'Please take a number.'; hurt({x: s.x}); }
        for (const e of enemies) if (!e.dead && Math.abs(e.x - s.x) < 58 && e.y > s.y - 82 && e.y <= s.y + 4) { kill(e, 0, 300, true); }
      }
    } else if (s.st === 'down' && s.t <= 0) s.gone = true;
  }
  b.stamps = b.stamps.filter(s => !s.gone);
  b.sayT = Math.max(0, b.sayT - dt); if (b.sayT <= 0) c.say = null;
  switch (b.st) {
    case 'intro':
      b.t -= dt;
      if (b.t < 1.2 && !b.said) { b.said = true; c.say = 'Next.'; b.sayT = 1.5; c.arm = 1; }
      if (b.t <= 0) {
        b.st = 'stamp'; b.cd = 0.8;
        banner = {title: 'THE CLERK', sub: "She's behind glass. She has a stamp. Survive until 5:00.", life: 3};
      }
      return;
    case 'closing':
      // 5:00. She flips the sign and leaves mid-sentence.
      b.t -= dt; wr.clock = 60;
      if (b.t < 1.6 && !b.flipped) { b.flipped = true; c.st = 'away'; c.back = 22; c.say = null; texts.push({x: arena.CLERK_X || W - 60, y: 200, s: 'Next pl—', life: 1.2, big: false}); }
      if (b.t <= 0) {
        const pts = 4000 * (b.level + 1);
        score += pts; hp = Math.min(maxHp(), hp + 1);
        nextBossAt += 25; spawnT = 1.8; boss = null; wr.clock = 0;
        banner = {title: 'CLOSED', sub: 'Come back tomorrow   ·   +' + pts + '   ·   +1 life', life: 3.4};
      }
      return;
  }
  if (!fighting) return;
  b.timer -= dt;
  wr.clock = Math.min(59.9, (1 - b.timer / CLERK_TIME) * 60);
  if (b.timer <= 0) { b.st = 'closing'; b.t = 2.4; b.stamps = []; return; }
  const prog = 1 - b.timer / CLERK_TIME;
  b.cd -= dt;
  if (b.cd <= 0) {
    b.cd = Math.max(0.55, 1.5 - prog * 0.8 - b.level * 0.2) * rand(0.85, 1.15);
    const approved = Math.random() < 0.1;
    const x = clamp(player.x + player.vx * 0.35 + rand(-25, 25), 60, W - 60);
    b.stamps.push({x, y: stampSurface(x), st: 'aim', t: approved ? 1.1 : 0.85 - prog * 0.2, approved});
    c.arm = 1;
    if (Math.random() < 0.3) { c.say = approved ? 'Fine.' : ['Denied.', 'DENIED.', 'Wrong form.', 'Next.', 'No.'][Math.floor(Math.random() * 5)]; b.sayT = 1.2; }
  }
}

BOSSES.clerk = {
  name: 'THE CLERK', pts: 0, koZoom: 2,
  warning: 'The clerk put her coffee down.',
  spawn(level) {
    return {x: arena.CLERK_X || W - 60, y: G, scale: 1, hp: 1, st: 'intro', t: 1.8, timer: CLERK_TIME, cd: 1, stamps: [], sayT: 0, said: false, flipped: false, hitT: 0, name: 'THE CLERK'};
  },
  update(b, dt, fighting) { updateClerk(b, dt, fighting); },
  draw(b) {
    for (const s of b.stamps) {
      if (s.st === 'aim') {
        // the outline of where it's coming down
        ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = s.approved ? '#2fb866' : ACCENT; ctx.lineWidth = 2.5;
        ctx.strokeRect(s.x - 58, s.y - 82, 116, 82); ctx.restore();
        ctx.fillStyle = s.approved ? 'rgba(47,184,102,0.12)' : 'rgba(232,56,79,0.12)'; ctx.fillRect(s.x - 58, s.y - 82, 116, 82);
        ctx.font = '600 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = s.approved ? '#2fb866' : ACCENT;
        ctx.fillText(s.approved ? 'APPROVED' : 'DENIED', s.x, s.y - 88);
        drawStampBlock(s.x, s.y - 300 - s.t * 200, s.approved, 0.9);
      } else if (s.st === 'fall') drawStampBlock(s.x, s.y - s.t / 0.12 * 300, s.approved);
      else drawStampBlock(s.x, s.y - Math.max(0, 0.25 - s.t) * 400, s.approved);
    }
  },
  zone() { return 0; },   // she's behind glass
  aimPoint() { return null; },
};
