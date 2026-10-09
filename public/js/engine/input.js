/* Input (keyboard, mouse, touch, secret codes), starting a run, and the game-over screen. */
/* ---------- input ---------- */
const keys = {}, btn = {};
let jumpQ = 0, kickQ = 0;
const KEYMAP = {ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ArrowDown:'down',KeyS:'down',KeyJ:'fire',KeyK:'kick',KeyL:'kick',KeyR:'reload'};
addEventListener('keydown', e => {
  if (isTyping(e) || ini) return;   // ini: typing initials for the leaderboard (board.js)
  if (state !== 'play' && (e.code === 'Enter' || e.code === 'Space') && state !== 'dying' && document.activeElement !== goBtn) { e.preventDefault(); start(); return; }
  const k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  if (k === 'jump' && !e.repeat) jumpQ = 0.12;
  if (k === 'kick' && !e.repeat) kickQ = 0.12;
  if (k === 'reload' && !e.repeat && state === 'play') startReload();
  keys[k] = true;
});
// Secret codes. Cheated runs don't save a best score.
//   sophy: bottomless magazine    loaf: 10 hearts, and the Eraser costs 5 instead of the run
// Typed anywhere on a keyboard, or in the hidden code box (tap the line above the title 5 times),
// which also takes a boss name (chancla, eraser, giant2...) to start a run one kill before it.
function toggleSophy() {
  cheatSophy = !cheatSophy;
  if (cheatSophy) { runCheated = true; reloadT = 0; ammo = magSize(); }
  texts.push({x: W / 2, y: 150, s: cheatSophy ? 'SOPHY MODE' : 'SOPHY MODE OFF', life: 1.3, big: true});
  return cheatSophy ? 'Sophy mode on: no reloading.' : 'Sophy mode off.';
}
function toggleLoaf() {
  cheatLoaf = !cheatLoaf;
  if (cheatLoaf) { runCheated = true; if (!player.dead) hp = Math.min(10, hp + 5); }
  else hp = Math.min(hp, 5);
  texts.push({x: W / 2, y: 200, s: cheatLoaf ? 'LOAF MODE' : 'LOAF MODE OFF', life: 1.3, big: true});
  return cheatLoaf ? 'Loaf mode on: 10 hearts.' : 'Loaf mode off.';
}
function applyCode(raw) {
  const word = String(raw).trim().toLowerCase().replace(/^#/, '');
  if (word === 'sophy') return toggleSophy();
  if (word === 'loaf') return toggleLoaf();
  const m = word.match(/^([a-z]+?)(\d*)$/);
  if (m && Object.values(ARENAS).some(a => a.bossLoop.includes(m[1]))) { start(word); return 'Here we go.'; }
  return 'Nothing happened.';
}
const isTyping = e => e.target && e.target.tagName === 'INPUT';
addEventListener('keydown', e => {
  if (isTyping(e) || ini || !e.key || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-5);
  if (typed.endsWith('sophy')) { typed = ''; toggleSophy(); }
  else if (typed.endsWith('loaf')) { typed = ''; toggleLoaf(); }
});

// the hidden code box
const codeForm = document.getElementById('code-form'), codeInput = document.getElementById('code-input'), codeMsg = document.getElementById('code-msg');
codeForm.hidden = true;
let codeTaps = 0, codeTapT = 0;
ovArena.addEventListener('click', () => {
  const now = performance.now();
  codeTaps = now - codeTapT < 700 ? codeTaps + 1 : 1; codeTapT = now;
  if (codeTaps >= 5) { codeTaps = 0; codeForm.hidden = false; codeMsg.textContent = ''; try { codeInput.focus(); } catch (_) {} }
});
codeForm.addEventListener('submit', e => {
  e.preventDefault();
  const msg = applyCode(codeInput.value);
  codeInput.value = '';
  codeMsg.textContent = msg;
});
addEventListener('keyup', e => { if (isTyping(e)) return; const k = KEYMAP[e.code]; if (k) keys[k] = false; });
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
    if (document.body && document.body.classList.contains('editing')) return;   // moving the racks, not pressing
    e.preventDefault();
    try { b.setPointerCapture(e.pointerId); } catch (_) {}
    btn[k] = true; b.classList.add('on');
    if (k === 'jump') jumpQ = 0.12;
    if (k === 'reload' && state === 'play') startReload();
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
document.getElementById('to-arenas').addEventListener('click', showPicker);

/* ---------- start screen: pick an arena ---------- */
const PICK_TITLE = ovTitle.innerHTML, PICK_TEXT = ovText.textContent;
function showPicker() {
  state = 'title';
  overlay.hidden = false;
  overlay.classList.add('picking');
  ovArena.textContent = 'Pick an arena';
  if (PICK_TITLE !== undefined) ovTitle.innerHTML = PICK_TITLE;
  ovText.textContent = PICK_TEXT; ovText.hidden = false;
  hideBoard();
  ovScore.hidden = true; ovStats.hidden = true; ovActions.hidden = true; arenaList.hidden = false;
  arenaList.textContent = '';
  const cards = Object.values(ARENAS).map(a => ({...a, ready: true})).concat(COMING_SOON)
    .sort((a, b) => a.number - b.number);
  for (const a of cards) {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'arena-card'; card.disabled = !a.ready;
    const part = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; card.appendChild(s); };
    part('num', 'Arena ' + a.number);
    part('name', a.name);
    part('best', a.ready ? 'Best ' + pad6(readBest(a.id)) : 'Coming soon');
    if (a.ready) card.addEventListener('click', () => pickArena(a.id));
    arenaList.appendChild(card);
  }
}
function pickArena(id) {
  setArena(id); loadBest();
  bestEl.textContent = 'Best ' + pad6(best);
  start();
}

function start(skipTo) {
  // a boss name (from the link, like #chancla, or the code box) starts one kill before that boss,
  // switching to the arena it lives in
  const want = typeof skipTo === 'string' ? skipTo : location.hash.slice(1);
  const m = want.match(/^([a-z]+?)(\d*)$/);
  if (m && !arena.bossLoop.includes(m[1])) {
    const other = Object.values(ARENAS).find(a => a.bossLoop.includes(m[1]));
    if (other) { setArena(other.id); loadBest(); bestEl.textContent = 'Best ' + pad6(best); }
  }
  reset();
  hideBoard();
  jumpQ = 0; kickQ = 0;
  // Skip-ahead links for testing: #giant, #sensei, #giant2, #eraser ... (any boss in this arena's loop)
  if (m) {
    let nth = +(m[2] || 1), skip = -1;
    arena.bossLoop.forEach((k, i) => { if (skip < 0 && k === m[1] && --nth === 0) skip = i; });
    if (skip >= 0) { bossCount = skip; nextBossAt = 25 * (skip + 1); kills = nextBossAt - 1; }
  }
  banner = {title: arena.name.toUpperCase(), sub: 'Arena ' + arena.number, life: 1.8};
  state = 'play';
  overlay.hidden = true;
  codeForm.hidden = true;
  overlay.classList.remove('picking');
}
// time survived and accuracy, for the game-over screen
function runStats() {
  const t = Math.floor(runTime), time = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  const acc = shotsFired ? Math.round(shotsHit / shotsFired * 100) + '%' : '\u2014';
  return [['Survived', time], ['Accuracy', acc], ['Shots', shotsHit + '/' + shotsFired]];
}
function showOver() {
  state = 'over';
  if (!runCheated && score > best) { best = score; try { localStorage.setItem(bestKey(), String(best)); } catch (e) {} }
  bestEl.textContent = 'Best ' + pad6(best);
  ovArena.textContent = 'Arena ' + arena.number + ' \u00b7 ' + arena.name;
  ovTitle.textContent = deathTitle || 'You got rainbowed.';
  arenaList.hidden = true; ovActions.hidden = false;
  ovScore.hidden = false;
  ovScore.textContent = pad6(score);
  ovStats.hidden = false;
  ovStats.textContent = '';
  for (const [label, value] of runStats()) {
    const s = document.createElement('span'); s.textContent = label + ' ';
    const v = document.createElement('b'); v.textContent = value; s.appendChild(v);
    ovStats.appendChild(s);
  }
  let msg = kills + (kills === 1 ? ' stickman' : ' stickmen') + ' turned into rainbows';
  if (bossesBeaten) msg += ', ' + bossesBeaten + (bossesBeaten === 1 ? ' boss' : ' bosses') + ' beaten';
  ovText.textContent = msg + '. Best run: ' + pad6(best) + '.' + (runCheated ? ' A cheat code was on, so this run is not saved.' : '');
  ovText.hidden = false;
  overlay.hidden = false;
  boardAfterRun();
}
