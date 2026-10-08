/* Input (keyboard, mouse, touch, secret codes), starting a run, and the game-over screen. */
/* ---------- input ---------- */
const keys = {}, btn = {};
let jumpQ = 0, kickQ = 0;
const KEYMAP = {ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ArrowDown:'down',KeyS:'down',KeyJ:'fire',KeyK:'kick',KeyL:'kick',KeyR:'reload'};
addEventListener('keydown', e => {
  if (state !== 'play' && (e.code === 'Enter' || e.code === 'Space') && state !== 'dying' && document.activeElement !== goBtn) { e.preventDefault(); start(); return; }
  const k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  if (k === 'jump' && !e.repeat) jumpQ = 0.12;
  if (k === 'kick' && !e.repeat) kickQ = 0.12;
  if (k === 'reload' && !e.repeat && state === 'play') startReload();
  keys[k] = true;
});
// Secret codes, typed on the keyboard. Cheated runs don't save a best score.
//   sophy: bottomless magazine    loaf: 10 hearts, and the Eraser costs 5 instead of the run
addEventListener('keydown', e => {
  if (!e.key || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-5);
  if (typed.endsWith('sophy')) {
    typed = '';
    cheatSophy = !cheatSophy;
    if (cheatSophy) { runCheated = true; reloadT = 0; ammo = MAG; }
    texts.push({x: W / 2, y: 150, s: cheatSophy ? 'SOPHY MODE' : 'SOPHY MODE OFF', life: 1.3, big: true});
  } else if (typed.endsWith('loaf')) {
    typed = '';
    cheatLoaf = !cheatLoaf;
    if (cheatLoaf) { runCheated = true; if (!player.dead) hp = Math.min(10, hp + 5); }
    else hp = Math.min(hp, 5);
    texts.push({x: W / 2, y: 200, s: cheatLoaf ? 'LOAF MODE' : 'LOAF MODE OFF', life: 1.3, big: true});
  }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const pointer = {x:0, y:0, active:false, down:false};
function toWorld(e) {
  const r = cv.getBoundingClientRect();
  pointer.x = (e.clientX - r.left) / r.width * W;
  pointer.y = (e.clientY - r.top) / r.height * H;
}
// Mouse: left button fires, right button kicks. Track the left button from
// e.buttons because a second button press arrives as a move, not a down.
// A right press arrives as pointerdown when it's the first button held,
// or as pointermove (button 2) when left is already held.
const rightPress = e => e.pointerType === 'mouse' && e.button === 2 && (e.buttons & 2) === 2;
cv.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') {
    toWorld(e); pointer.active = true;
    pointer.down = state === 'play' && (e.buttons & 1) === 1;
    if (state === 'play' && rightPress(e)) kickQ = 0.12;
  }
  else if (pointer.down) toWorld(e);
});
cv.addEventListener('pointerdown', e => {
  if (state !== 'play') return;
  e.preventDefault();
  toWorld(e); pointer.active = true;
  if (rightPress(e)) kickQ = 0.12;
  pointer.down = e.pointerType === 'mouse' ? (e.buttons & 1) === 1 : true;
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
});
const pUp = e => {
  if (e.pointerType === 'mouse') { pointer.down = (e.buttons & 1) === 1; return; }
  pointer.down = false; pointer.active = false;
};
cv.addEventListener('pointerup', pUp);
cv.addEventListener('pointercancel', pUp);
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') pointer.active = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());

document.querySelectorAll('[data-k]').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => {
    e.preventDefault();
    try { b.setPointerCapture(e.pointerId); } catch (_) {}
    btn[k] = true; b.classList.add('on');
    if (k === 'jump') jumpQ = 0.12;
    if (k === 'kick') kickQ = 0.12;
  });
  const up = () => { btn[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
document.getElementById('pad').addEventListener('touchstart', e => e.preventDefault(), {passive:false});

goBtn.addEventListener('click', start);
function start() {
  reset();
  jumpQ = 0; kickQ = 0;
  // Skip-ahead links: add #giant or #sensei to the page address
  // Skip-ahead links for testing: #giant, #sensei, #giant2, #eraser ... (any boss in this arena's loop)
  const m = location.hash.match(/^#([a-z]+?)(\d*)$/);
  if (m) {
    let nth = +(m[2] || 1), skip = -1;
    arena.bossLoop.forEach((k, i) => { if (skip < 0 && k === m[1] && --nth === 0) skip = i; });
    if (skip >= 0) { bossCount = skip; nextBossAt = 25 * (skip + 1); kills = nextBossAt - 1; }
  }
  banner = {title: arena.name.toUpperCase(), sub: 'Arena ' + arena.number, life: 1.8};
  state = 'play';
  overlay.hidden = true;
}
function showOver() {
  state = 'over';
  if (!runCheated && score > best) { best = score; try { localStorage.setItem(bestKey(), String(best)); } catch (e) {} }
  bestEl.textContent = 'Best ' + pad6(best);
  ovTitle.textContent = deathTitle || 'You got rainbowed.';
  ovScore.hidden = false;
  ovScore.textContent = pad6(score);
  let msg = kills + (kills === 1 ? ' stickman' : ' stickmen') + ' turned into rainbows';
  if (bossesBeaten) msg += ', ' + bossesBeaten + (bossesBeaten === 1 ? ' boss' : ' bosses') + ' beaten';
  ovText.textContent = msg + '. Best run: ' + pad6(best) + '.' + (runCheated ? ' A cheat code was on, so this run is not saved.' : '');
  goBtn.textContent = 'Again';
  overlay.hidden = false;
}
