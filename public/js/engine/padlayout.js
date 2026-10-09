/* Touch controls layout: SNES style, a D-pad on the left and the four-button diamond on the
   right. In landscape, "Move buttons" on the start screen lets each player slide either side up
   or down and change the button size. It's saved on that phone only. */

const PAD_KEY = 'rsb-pad', PAD_DEFAULT = {left: 18, right: 14, scale: 1};
let padLayout = {...PAD_DEFAULT};
try { Object.assign(padLayout, JSON.parse(localStorage.getItem(PAD_KEY) || '{}')); } catch (e) {}

function applyPad() {
  const st = document.documentElement && document.documentElement.style;
  if (!st || !st.setProperty) return;
  st.setProperty('--pad-left', padLayout.left);
  st.setProperty('--pad-right', padLayout.right);
  st.setProperty('--pad-scale', padLayout.scale);
}
function savePad() { try { localStorage.setItem(PAD_KEY, JSON.stringify(padLayout)); } catch (e) {} }
applyPad();

const padEditor = document.getElementById('pad-editor');
padEditor.hidden = true;
let padEditing = false;

function startPadEdit() {
  padEditing = true;
  if (document.body) document.body.classList.add('editing');
  overlay.hidden = true; padEditor.hidden = false;
}
function endPadEdit() {
  padEditing = false;
  if (document.body) document.body.classList.remove('editing');
  padEditor.hidden = true; savePad(); showPicker();
}

// drag a whole side up or down; side to side stays put
for (const [id, side] of [['rack-left', 'left'], ['rack-right', 'right']]) {
  const rack = document.getElementById(id);
  let y0 = null, v0 = 0;
  rack.addEventListener('pointerdown', e => {
    if (!padEditing) return;
    e.preventDefault(); y0 = e.clientY; v0 = padLayout[side];
    try { rack.setPointerCapture(e.pointerId); } catch (_) {}
  });
  rack.addEventListener('pointermove', e => {
    if (!padEditing || y0 === null) return;
    const h = innerHeight, rackPct = rack.getBoundingClientRect().height / h * 100;
    padLayout[side] = Math.round(clamp(v0 + (e.clientY - y0) / h * 100, 1, Math.max(1, 99 - rackPct)) * 10) / 10;
    applyPad();
  });
  const end = () => { y0 = null; };
  rack.addEventListener('pointerup', end);
  rack.addEventListener('pointercancel', end);
}
const resize = d => { padLayout.scale = Math.round(clamp(padLayout.scale + d, 0.7, 1.5) * 10) / 10; applyPad(); };
document.getElementById('pad-smaller').addEventListener('click', () => resize(-0.1));
document.getElementById('pad-bigger').addEventListener('click', () => resize(0.1));
document.getElementById('pad-reset').addEventListener('click', () => { padLayout = {...PAD_DEFAULT}; applyPad(); });
document.getElementById('pad-done').addEventListener('click', endPadEdit);
document.getElementById('edit-pad').addEventListener('click', startPadEdit);
