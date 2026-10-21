/* Boot: show the arena picker and start the frame loop. */
// Arenas that appear on the start screen as "Coming soon" until their file exists.
const COMING_SOON = [];

setArena('page-one');
loadBest();
bestEl.textContent = 'Best ' + pad6(best);
reset();
showPicker();

let last = performance.now();
function frame(now) {
  const rdt = Math.min(0.033, Math.max(0, (now - last) / 1000));
  last = now;
  update(rdt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// offline play: keep a copy of the game on the device (see sw.js). Only on the real site.
if (typeof navigator !== 'undefined' && navigator.serviceWorker && /(^|\.)rainbowed\.ca$|^localhost$/.test(location.hostname)) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
