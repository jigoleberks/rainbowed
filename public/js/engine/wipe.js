/* The rainbow wipe: when you die, a beat after you burst, a rainbow explodes out from where
   you fell until it covers the whole arena, holds for a moment, then shatters into confetti
   that flutters down and off, leaving blank paper behind for your results. */

const WIPE_DELAY = 0.35, WIPE_GROW = 0.5, WIPE_HOLD = 0.25, WIPE_BAND = 26, WIPE_TILE = 20;
let wipe = null;   // {t, x, y, confetti}

function startWipe() {
  // where you fell, on screen (the camera can be zoomed or panned)
  const x = (player.x - cam.x) * cam.z + W / 2, y = (player.y - 40 - cam.y) * cam.z + H / 2;
  wipe = {t: -WIPE_DELAY, x: clamp(x, 0, W), y: clamp(y, 0, H), confetti: null};
}

// the colour of the rings at a point: bands of hue spreading out from the centre, slowly turning
const wipeHue = (d, t) => ((Math.floor(d / WIPE_BAND) * 32) - t * 240 + 3600) % 360;

function updateWipe(rdt) {
  if (state === 'dying' && !wipe) startWipe();
  if (!wipe) return;
  wipe.t += rdt;
  const breakAt = WIPE_GROW + WIPE_HOLD;
  if (wipe.t >= breakAt && !wipe.confetti) {
    // shatter: one tile of confetti per patch of the rainbow, each keeping its colour
    wipe.confetti = [];
    for (let y = 0; y < H; y += WIPE_TILE) for (let x = 0; x < W; x += WIPE_TILE) {
      const cx = x + WIPE_TILE / 2, cy = y + WIPE_TILE / 2;
      wipe.confetti.push({x: cx, y: cy, h: wipeHue(Math.hypot(cx - wipe.x, cy - wipe.y), wipe.t),
        vx: rand(-50, 50) + (cx - wipe.x) * 0.25, vy: rand(-140, 10), rot: rand(0, 6), vr: rand(-9, 9),
        flut: rand(0, 6), delay: rand(0, 0.25), age: 0});
    }
  }
  if (wipe.confetti) for (const c of wipe.confetti) {
    c.age += rdt;
    if (c.age < c.delay) continue;
    c.vy += 520 * rdt; c.vy = Math.min(c.vy, 260);
    c.vx *= 1 - Math.min(1, rdt * 1.5);
    c.x += (c.vx + Math.sin(c.age * 7 + c.flut) * 40) * rdt; c.y += c.vy * rdt;
    c.rot += c.vr * rdt;
  }
  if (wipe.confetti) wipe.confetti = wipe.confetti.filter(c => c.y < H + 20);
}

// drawn in screen space, over everything
function drawWipe() {
  if (!wipe || wipe.t <= 0) return;
  const t = wipe.t;
  if (!wipe.confetti) {
    // the rainbow growing out from where you fell
    const far = Math.max(Math.hypot(wipe.x, wipe.y), Math.hypot(W - wipe.x, wipe.y), Math.hypot(wipe.x, H - wipe.y), Math.hypot(W - wipe.x, H - wipe.y));
    const k = Math.min(1, t / WIPE_GROW), R = far * (1 - Math.pow(1 - k, 3)) + 4;
    for (let r = Math.ceil(R / WIPE_BAND) * WIPE_BAND; r > 0; r -= WIPE_BAND) {
      ctx.fillStyle = `hsl(${wipeHue(r - 1, t)} 86% 58%)`;
      ctx.beginPath(); ctx.arc(wipe.x, wipe.y, Math.min(r, R), 0, Math.PI * 2); ctx.fill();
    }
    ctx.lineWidth = 6; ctx.strokeStyle = INK;
    if (k < 1) { ctx.beginPath(); ctx.arc(wipe.x, wipe.y, R, 0, Math.PI * 2); ctx.stroke(); }
    return;
  }
  // after the shatter: blank paper, with the confetti falling away
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  for (const c of wipe.confetti) {
    const s = c.age < c.delay ? WIPE_TILE : Math.max(7, WIPE_TILE - (c.age - c.delay) * 45);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.age < c.delay ? 0 : c.rot);
    ctx.fillStyle = `hsl(${c.h} 86% 58%)`;
    // squash one side as it tumbles, so it flickers like real confetti
    const w = c.age < c.delay ? s + 1 : s * Math.max(0.15, Math.abs(Math.cos(c.rot * 1.3)));
    ctx.fillRect(-w / 2, -s * 0.35 - (c.age < c.delay ? s * 0.15 : 0), w, c.age < c.delay ? s + 1 : s * 0.7);
    ctx.restore();
  }
}
