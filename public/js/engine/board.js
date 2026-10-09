/* The leaderboard on the game-over screen: an arcade-style top 10 per arena with three initials.
   Talks to /api/scores (src/worker.js). When there's no server (opened as a file, the offline
   bundle, no signal) it quietly does nothing and the game-over screen looks like it always did. */

const iniBox = document.getElementById('ov-initials'), iniSlots = document.getElementById('ini-slots');
const iniOk = document.getElementById('ini-ok'), iniMsg = document.getElementById('ini-msg');
const boardEl = document.getElementById('ov-board');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BOARD_SIZE = 10;
// what you hear when the server refuses your initials
const SCOLDS = [
  'Degenerate behaviour detected. Try again.',
  'Grandma saw that. Pick other letters.',
  'Sophy is disappointed in you.',
  'The Eraser would like a word.',
  'The Slow One saw that. He will remember.',
  'Absolutely not. Other letters, please.',
];
let ini = null;        // while entering initials: {letters, at, run, seq}
let boardSeq = 0;      // bumps every run, so a slow reply from an old run is ignored

const online = () => typeof fetch === 'function' && typeof location !== 'undefined' && /^https?:$/.test(location.protocol);
function api(path, opts) {
  if (!online()) return Promise.reject(new Error('offline'));
  return fetch(path, opts).then(r => r.json().then(b => ({ok: r.ok, b}), () => ({ok: false, b: {}})));
}
function savedInitials() {
  try { const v = localStorage.getItem('rsb-initials'); if (/^[A-Z]{3}$/.test(v)) return v.split(''); } catch (e) {}
  return ['A', 'A', 'A'];
}

function hideBoard() {
  boardSeq++; ini = null;
  iniBox.hidden = true; boardEl.hidden = true;
  overlay.classList.remove('ranked');
}

// called from showOver()
function boardAfterRun() {
  hideBoard();
  const seq = boardSeq;
  const run = {arena: arena.id, score, kills, time: Math.max(1, Math.round(runTime))};
  api('/api/scores?arena=' + run.arena).then(({ok, b}) => {
    if (seq !== boardSeq || state !== 'over' || !ok) return;
    const top = b.top || [];
    const makesIt = !runCheated && score > 0 && (top.length < BOARD_SIZE || score > top[top.length - 1].s);
    if (makesIt) startInitials(run, seq); else showBoard(top, null);
  }).catch(() => {});
}

// ---------- entering initials ----------
function startInitials(run, seq) {
  ini = {letters: savedInitials(), at: 0, run, seq};
  iniMsg.textContent = 'New high score! Enter your initials';
  iniOk.disabled = false;
  iniSlots.textContent = '';
  for (let i = 0; i < 3; i++) {
    const slot = document.createElement('div'); slot.className = 'slot';
    const up = document.createElement('button'); up.type = 'button'; up.textContent = '▲'; up.setAttribute('aria-label', 'Next letter');
    const ch = document.createElement('b');
    const dn = document.createElement('button'); dn.type = 'button'; dn.textContent = '▼'; dn.setAttribute('aria-label', 'Previous letter');
    up.addEventListener('click', () => { ini.at = i; bump(1); });
    dn.addEventListener('click', () => { ini.at = i; bump(-1); });
    ch.addEventListener('click', () => { ini.at = i; drawInitials(); });
    slot.append(up, ch, dn); iniSlots.appendChild(slot);
  }
  ovText.hidden = true; iniBox.hidden = false; overlay.classList.add('ranked');
  drawInitials();
}
function drawInitials() {
  if (!ini) return;
  [...iniSlots.children].forEach((slot, i) => {
    slot.children[1].textContent = ini.letters[i];
    slot.classList.toggle('on', i === ini.at);
  });
}
function bump(d) {
  const i = LETTERS.indexOf(ini.letters[ini.at]);
  ini.letters[ini.at] = LETTERS[(i + d + 26) % 26];
  drawInitials();
}
function submitInitials() {
  if (!ini || iniOk.disabled) return;
  const n = ini.letters.join(''), {run, seq} = ini;
  iniOk.disabled = true; iniMsg.textContent = 'Saving...';
  api('/api/scores', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({...run, initials: n})})
    .then(({ok, b}) => {
      if (seq !== boardSeq) return;
      iniOk.disabled = false;
      if (!ok && b.error === 'blocked') { iniMsg.textContent = SCOLDS[Math.floor(Math.random() * SCOLDS.length)]; return; }
      ini = null; iniBox.hidden = true;
      if (!ok) { ovText.hidden = false; overlay.classList.remove('ranked'); return; }
      try { localStorage.setItem('rsb-initials', n); } catch (e) {}
      showBoard(b.top || [], b.id);
    })
    .catch(() => { if (seq === boardSeq) { iniOk.disabled = false; iniMsg.textContent = 'No connection. Tap OK to try again.'; } });
}
iniOk.addEventListener('click', submitInitials);

// keyboard: type the letters, arrows to adjust, Enter to save. Runs before the game's own keys.
addEventListener('keydown', e => {
  if (!ini || state !== 'over') return;
  const k = e.key || '';
  if (/^[a-z]$/i.test(k)) { ini.letters[ini.at] = k.toUpperCase(); ini.at = Math.min(2, ini.at + 1); drawInitials(); }
  else if (k === 'Backspace' || k === 'ArrowLeft') { ini.at = Math.max(0, ini.at - 1); drawInitials(); }
  else if (k === 'ArrowRight') { ini.at = Math.min(2, ini.at + 1); drawInitials(); }
  else if (k === 'ArrowUp') bump(1);
  else if (k === 'ArrowDown') bump(-1);
  else if (k === 'Enter' || k === ' ') submitInitials();
  else return;
  e.preventDefault();
  if (e.stopImmediatePropagation) e.stopImmediatePropagation();
}, true);

// ---------- the board ----------
function showBoard(top, myId) {
  boardEl.textContent = '';
  if (!top.length) {
    const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No scores yet. Be the first.';
    boardEl.appendChild(li);
  }
  top.forEach((e, i) => {
    const li = document.createElement('li');
    if (e.id && e.id === myId) li.className = 'me';
    for (const [cls, text] of [['r', i + 1], ['n', e.n], ['s', pad6(e.s)]]) {
      const s = document.createElement('span'); s.className = cls; s.textContent = text; li.appendChild(s);
    }
    boardEl.appendChild(li);
  });
  ovText.hidden = true; boardEl.hidden = false; overlay.classList.add('ranked');
}
