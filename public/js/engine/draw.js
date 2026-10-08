/* Drawing: the stage, stickmen, bosses, effects and HUD. */
/* ---------- drawing ---------- */
function line(ax, ay, bx, by) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
function poly(pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); }

function drawStage() {
  ctx.strokeStyle = MUTED; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  for (let x = -40; x < W; x += 16) line(x, G + 52, x + 40, G + 6);
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  line(0, G, W, G);
  for (const p of PLATS) {
    if (p.gone > 0) {
      // erased: a faint pencil guide shows where it will be redrawn
      ctx.save(); ctx.setLineDash([4, 9]); ctx.strokeStyle = MUTED; ctx.lineWidth = 2;
      ctx.globalAlpha = p.gone < 1 ? 1 : 0.6;
      line(p.x, p.y, p.x + p.w, p.y); ctx.restore();
      continue;
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    line(p.x, p.y, p.x + p.w, p.y);
    ctx.strokeStyle = MUTED; ctx.lineWidth = 1.5;
    for (let x = p.x + 8; x < p.x + p.w - 4; x += 12) line(x, p.y + 12, x + 8, p.y + 4);
  }
}

// Draws a stickman in local space: feet at (0,0), facing f, scaled by e.scale
function drawStick(e, kind) {
  const f = e.facing, s = e.scale || 1;
  ctx.save();
  ctx.translate(e.x, e.y);
  if (s !== 1) ctx.scale(s, s);
  if (e.spin) { ctx.translate(0, -34); ctx.rotate(e.spin * (e.flipSign !== undefined ? e.flipSign : f)); ctx.translate(0, 34); }
  if (e.tilt) { ctx.translate(0, -30); ctx.rotate(e.tilt * f); ctx.translate(0, 30); }
  let col = e.ghost ? MUTED : (e.hitT > 0 ? ACCENT : INK);
  if ((kind === 'player' && rainbowT > 0 && !(rainbowT < 1 && Math.floor(clock * 14) % 2)) || e.glow) col = `hsl(${(clock * 600 + (e.glow ? 180 : 0)) % 360} 85% 50%)`;
  ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pose = e.pose;
  const crouch = pose === 'crouch';
  const hipY = crouch ? -23 : -30, shY = crouch ? -46 : -52;
  const lean = crouch ? 6 * f : (pose === 'dash' ? 8 * f : (pose === 'tired' ? 4 * f : 0));
  const neckX = 2 * f + lean, neckY = shY - 5, headX = neckX, headY = neckY - 10;
  const mv = Math.min(1, Math.abs(e.vx) / 120);

  // legs
  if (pose === 'stompWind') { poly([0, hipY, f * 12, -44, f * 17, -30]); poly([0, hipY, -f * 2, -15, 0, 0]); }
  else if (pose === 'kick') { poly([0, hipY, f * 14, -36, f * 31, -40]); poly([0, hipY, -f * 4, -15, -f * 7, 0]); }
  else if (crouch) { poly([0, hipY, f * 12, -13, f * 11, 0]); poly([0, hipY, -f * 6, -11, -f * 13, 0]); }
  else {
    for (let i = 0; i < 2; i++) {
      let fx, fy, kx, ky;
      if (e.onGround) {
        const ph = e.phase + i * Math.PI;
        fx = Math.sin(ph) * 13 * mv;
        fy = -Math.max(0, Math.cos(ph)) * 7 * mv;
        kx = fx / 2 + f * (2 + 4 * mv);
        ky = hipY + 15;
      } else {
        fx = (i ? -7 : 9) * f; fy = -5;
        kx = (i ? 3 : 13) * f; ky = -18;
      }
      poly([0, hipY, kx, ky, fx, fy]);
    }
  }
  line(0, hipY, neckX, neckY);

  if (kind === 'player') {
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 3;
    poly([neckX - f * 5, headY + 3, neckX - f * 17 - e.vx * 0.02, headY + 3 + Math.sin(clock * 18) * 3, neckX - f * 29 - e.vx * 0.04, headY + 6 + Math.sin(clock * 18 + 1.2) * 4]);
    ctx.strokeStyle = col; ctx.lineWidth = 3.5;
  }

  ctx.beginPath(); ctx.arc(headX, headY, 9, 0, Math.PI * 2);
  ctx.fillStyle = kind === 'player' ? col : PAPER; ctx.fill(); ctx.stroke();

  if (kind === 'sensei') {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(headX - f, headY - 11.5, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2.5;
    line(headX + f * 5, headY + 7, headX + f * 6, headY + 14);
    line(-5, hipY - 1, 5, hipY - 1);
    poly([-f, hipY - 1, -f * 8, hipY + 6 + Math.sin(clock * 12) * 2]);
    ctx.lineWidth = 3.5;
  } else if (kind === 'giant') {
    ctx.lineWidth = 2.2;
    line(headX + f * 1, headY - 4.5, headX + f * 7, headY - 1.5);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(headX + f * 4.5, headY + 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3.5;
  }

  // arms
  if (kind === 'player') {
    const ca = Math.cos(e.aim), sa = Math.sin(e.aim), rec = e.recoil * 4;
    const hx = ca * (21 - rec), hy = shY + sa * (21 - rec);
    poly([0, shY, ca * 9 + sa * 5 * f, shY + sa * 9 + 5, ca * (15 - rec), shY + sa * (15 - rec) + 2]);
    line(0, shY, hx, hy);
    ctx.lineWidth = 5.5;
    line(hx - ca * 2, hy - sa * 2, hx + ca * 13, hy + sa * 13);
    if (flash > 0) {
      const mx = hx + ca * 19, my = hy + sa * 19;
      ctx.fillStyle = '#f6b81c';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 4 : 11, a = e.aim + k * Math.PI / 5;
        ctx.lineTo(mx + Math.cos(a) * r, my + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
    }
  } else {
    const A = (ex, ey, hx, hy) => poly([0, shY, ex, ey, hx, hy]);
    switch (pose) {
      case 'fold': A(f * 8, shY + 9, -f * 4, shY + 7); A(-f * 3, shY + 10, f * 7, shY + 5); break;
      case 'beckon': {
        const w = Math.sin(clock * 12);
        A(f * 12, shY + 1, f * 22, shY - 3);
        line(f * 22, shY - 3, f * 25, shY - 9 + w * 3);
        A(-f * 7, shY + 10, -f, hipY + 2);
        break;
      }
      case 'throwWind': A(-f * 6, shY - 12, -f * 14, shY - 26); A(f * 10, shY + 8, f * 16, shY + 2); break;
      case 'throw': A(f * 12, shY - 2, f * 24, shY + 2); A(-f * 8, shY + 8, -f * 12, shY + 16); break;
      case 'starWind': A(-f * 10, shY + 3, -f * 20, shY - 4); A(f * 9, shY + 7, f * 15, shY + 1); break;
      case 'dash': A(f * 12, shY, f * 25, shY - 1); A(-f * 9, shY + 6, -f * 15, shY + 12); break;
      case 'kick': A(-f * 10, shY + 4, -f * 18, shY - 2); A(f * 8, shY - 6, f * 4, shY - 14); break;
      case 'crouch': A(f * 9, shY + 6, f * 15, shY - 2); A(f * 3, shY + 9, f * 10, shY + 4); break;
      case 'tired': A(f * 5, shY + 12, f * 6, hipY + 6); A(-f * 3, shY + 12, -f * 2, hipY + 6); break;
      case 'stompWind': A(-f * 12, shY + 2, -f * 18, shY - 8); A(f * 12, shY + 2, f * 18, shY - 8); break;
      default:
        if (kind === 'sensei') { A(f * 9, shY + 7, f * 15, shY - 2); A(f * 4, shY + 9, f * 10, shY + 3); }
        else {
          for (let i = 0; i < 2; i++) {
            const sw = Math.sin(e.phase + i * Math.PI) * mv;
            A(f * (7 + sw * 2), shY + 9, f * (17 + sw * 4), shY + 2 + sw * 5);
          }
        }
    }
  }
  ctx.restore();
}


function drawBoss() {
  const b = boss;
  if (!b || b.exploded) return;
  const def = BOSSES[b.kind];
  if (def.draw) { def.draw(b); return; }
  if (b.ghosts) for (const g of b.ghosts) { ctx.globalAlpha = Math.max(0, g.life / 0.3) * 0.55; drawStick(g, 'sensei'); }
  ctx.globalAlpha = 1;
  if (def.drawUnder) def.drawUnder(b);
  if (b.hidden) return;
  drawStick(b, b.kind);
  if (!b.dead && /Wind$/.test(b.st)) {
    ctx.font = '28px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.fillStyle = ACCENT;
    ctx.fillText('!', b.x, b.y - 88 * b.scale - 4);
  }
}

function drawHazards() {
  ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  for (const w of waves) {
    ctx.beginPath(); ctx.moveTo(w.x - 16, G); ctx.quadraticCurveTo(w.x, G - 30, w.x + 16, G); ctx.stroke();
    ctx.lineWidth = 2;
    line(w.x - w.dir * 22, G - 8, w.x - w.dir * 34, G - 8);
    line(w.x - w.dir * 24, G - 16, w.x - w.dir * 32, G - 16);
    ctx.lineWidth = 3.5;
  }
  ctx.fillStyle = INK;
  for (const p of eproj) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.beginPath();
    for (let k = 0; k < 8; k++) { const r = k % 2 ? 2 : 7, a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function rainbowText(str, x, y, size) {
  ctx.font = size + 'px "Permanent Marker", cursive';
  const half = ctx.measureText(str).width / 2 + 10;
  const g = ctx.createLinearGradient(x - half, 0, x + half, 0);
  for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, `hsl(${(k * 60 + clock * 240) % 360} 88% 52%)`);
  ctx.lineWidth = Math.max(4, size / 7); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = g; ctx.fillText(str, x, y);
}

function drawHUD() {
  if (state === 'play' || state === 'dying') {
    ctx.textAlign = 'left';
    ctx.font = '28px "Permanent Marker", cursive';
    ctx.fillStyle = INK;
    ctx.fillText(pad6(score), 18, 40);
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#5f6370';
    ctx.fillText(kills + ' RAINBOWED', 20, 58);
    if (rainbowT > 0) {
      const g = ctx.createLinearGradient(20, 0, 20 + MAG * 7, 0);
      for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, `hsl(${(k * 60 + clock * 300) % 360} 88% 55%)`);
      ctx.fillStyle = g; ctx.fillRect(20, 66, (MAG * 7 - 3) * (rainbowT / RAINBOW_TIME), 11);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(20, 66, MAG * 7 - 3, 11);
      ctx.fillStyle = INK; ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText('RAINBOW MODE', 20 + MAG * 7 + 6, 76);
    } else if (cheatSophy) {
      ctx.fillStyle = ACCENT;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText('\u221E SOPHY MODE', 20, 76);
    } else for (let i = 0; i < MAG; i++) {
      const on = reloadT > 0 ? i < Math.floor((1 - reloadT / RELOAD_TIME) * MAG) : i < ammo;
      ctx.fillStyle = on ? INK : '#c9ccd4';
      ctx.fillRect(20 + i * 7, 66, 4, 11);
    }
    if (reloadT > 0 && rainbowT <= 0) {
      ctx.fillStyle = ACCENT;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.fillText('RELOADING', 20 + MAG * 7 + 6, 76);
    }
    for (let i = 0; i < maxHp(); i++) {
      ctx.beginPath(); ctx.arc(W - 24 - i * 22, 30, 7, 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      if (i < hp) { ctx.fillStyle = INK; ctx.fill(); }
    }
    if (combo >= 2) {
      ctx.textAlign = 'center';
      ctx.font = '24px "Permanent Marker", cursive';
      ctx.fillStyle = `hsl(${(clock * 200) % 360} 80% 46%)`;
      ctx.fillText('x' + Math.min(5, combo) + ' COMBO', W / 2, 40);
    }
    if (boss && !boss.dead && !cine && boss.st !== 'drop') {
      const bw = 300, bx = W / 2 - bw / 2, by = 68;
      ctx.textAlign = 'center';
      ctx.font = '15px "Permanent Marker", cursive';
      ctx.fillStyle = INK;
      ctx.fillText(boss.name, W / 2, by - 6);
      const r = clamp(boss.hp / boss.maxHp, 0, 1);
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, `hsl(${k * 55} 85% 56%)`);
      ctx.fillStyle = g; ctx.fillRect(bx, by, bw * r, 10);
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.strokeRect(bx, by, bw, 10);
      if (boss.timer !== undefined && boss.st !== 'leave') {
        const sec = Math.ceil(boss.timer);
        ctx.font = '600 12px "IBM Plex Mono", monospace';
        ctx.fillStyle = sec <= 10 ? ACCENT : INK;
        ctx.fillText('SURVIVE 0:' + String(sec).padStart(2, '0'), W / 2, by + 26);
      }
    }
    if (bossWarn > 0) {
      const a = 0.55 + 0.45 * Math.sin(clock * 18);
      ctx.fillStyle = `rgba(232,56,79,${0.1 * a})`;
      ctx.fillRect(0, 150, W, 90);
      ctx.strokeStyle = ACCENT; ctx.lineWidth = 3;
      line(0, 150, W, 150); line(0, 240, W, 240);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.font = '54px "Permanent Marker", cursive';
      ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeText('WARNING', W / 2, 210);
      ctx.fillStyle = ACCENT; ctx.fillText('WARNING', W / 2, 210);
      ctx.globalAlpha = 1;
      ctx.font = '600 13px "IBM Plex Mono", monospace';
      ctx.fillStyle = INK;
      ctx.fillText(BOSSES[nextBossKind()].warning, W / 2, 232);
    }
  }
  if (banner && !cine) {
    ctx.globalAlpha = Math.min(1, banner.life * 2.5);
    ctx.textAlign = 'center';
    rainbowText(banner.title, W / 2, 150, 46);
    ctx.font = '600 13px "IBM Plex Mono", monospace';
    ctx.fillStyle = INK;
    ctx.fillText(banner.sub, W / 2, 176);
    ctx.globalAlpha = 1;
  }
  if (cine) {
    const c = cine;
    const inA = Math.min(1, c.t / 0.3), outA = Math.min(1, (c.dur - c.t) / 0.3);
    const bh = 48 * Math.min(inA, outA);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
    ctx.textAlign = 'center';
    if (c.kind === 'intro' && c.t > 0.35) {
      ctx.globalAlpha = Math.min(1, (c.t - 0.35) * 3, outA);
      ctx.font = '30px "Permanent Marker", cursive';
      ctx.fillStyle = PAPER;
      ctx.fillText(c.title || '', W / 2, H - 14);
      ctx.font = '600 12px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#c9ccd4';
      ctx.fillText(c.hint || '', W / 2, 30);
      ctx.globalAlpha = 1;
    } else if (c.kind === 'ko' && c.t > 0.45) {
      ctx.globalAlpha = Math.min(1, (c.t - 0.45) * 4, outA);
      ctx.font = '30px "Permanent Marker", cursive';
      ctx.fillStyle = PAPER;
      ctx.fillText('K.O.', W / 2, H - 14);
      ctx.globalAlpha = 1;
    }
  }
}

function draw() {
  const sx = cv.width / W, sy = cv.height / H;
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  if (shake > 0) ctx.translate(rand(-shake, shake), rand(-shake, shake));

  if (arena.drawStage) arena.drawStage(); else drawStage();
  ctx.drawImage(stain, 0, 0, W, H);

  for (const r of rings) {
    ctx.globalAlpha = Math.max(0, Math.min(1, r.life / 0.35));
    ctx.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      ctx.strokeStyle = `hsl(${k * 60} 85% 56%)`;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, k * Math.PI / 3, (k + 1) * Math.PI / 3); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (const d of debris) {
    ctx.globalAlpha = Math.min(1, d.life);
    ctx.lineWidth = d.lw || 3.5;
    if (d.head) { ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else { const c = Math.cos(d.ang) * d.len / 2, s = Math.sin(d.ang) * d.len / 2; line(d.x - c, d.y - s, d.x + c, d.y + s); }
  }
  ctx.globalAlpha = 1;

  drawHazards();
  drawBoss();
  for (const k of pickups) {
    if (k.life < 2 && Math.floor(clock * 10) % 2) continue;
    const r = 11 + Math.sin(clock * 8) * 1.5;
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `hsl(${(i * 60 + clock * 300) % 360} 88% 55%)`;
      ctx.beginPath(); ctx.arc(k.x, k.y, r, i * Math.PI / 3 + clock * 4, (i + 1) * Math.PI / 3 + clock * 4); ctx.stroke();
    }
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(k.x, k.y, r - 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK; ctx.font = '14px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText('\u2605', k.x, k.y + 5);
  }
  for (const e of enemies) drawStick(e, 'enemy');
  if (!player.dead && !(state === 'play' && invuln > 0 && !cine && Math.floor(clock * 18) % 2)) drawStick(player, 'player');

  ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  for (const b of bullets) line(b.x - b.vx * 0.018, b.y - b.vy * 0.018, b.x, b.y);

  for (const p of parts) {
    ctx.globalAlpha = Math.min(1, p.life * 2.5);
    ctx.fillStyle = p.col || (p.ink ? INK : `hsl(${p.h} 88% 56%)`);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 3);
    if (t.big) rainbowText(t.s, t.x, t.y, 44);
    else { ctx.font = '16px "Permanent Marker", cursive'; ctx.fillStyle = INK; ctx.fillText(t.s, t.x, t.y); }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (slow > 0 && !cine) {
    ctx.lineWidth = 8;
    ctx.strokeStyle = `hsl(${(clock * 300) % 360} 85% 58% / 0.6)`;
    ctx.strokeRect(4, 4, W - 8, H - 8);
  }
  drawHUD();
}

