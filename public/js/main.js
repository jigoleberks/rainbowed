/* Boot: show the arena picker and start the frame loop. */
// Arenas that appear on the start screen as "Coming soon" until their file exists.
const COMING_SOON = [{number: 2, name: "Grandma's House", ready: false}];

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
