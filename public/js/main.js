/* Boot: pick the arena, load its best score, and start the frame loop. */
setArena('page-one');
loadBest();
bestEl.textContent = 'Best ' + pad6(best);
document.getElementById('ov-arena').textContent = 'Arena ' + arena.number + ' \u00b7 ' + arena.name;
reset();

let last = performance.now();
function frame(now) {
  const rdt = Math.min(0.033, Math.max(0, (now - last) / 1000));
  last = now;
  update(rdt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
