/* Arena 1: Page One. Blank notebook paper, three shelves, the Sensei and the Eraser. */
ARENAS['page-one'] = {
  id: 'page-one', number: 1, name: 'Page One',
  plats: [{x:90, y:305, w:170}, {x:540, y:305, w:170}, {x:315, y:215, w:170}],
  // kill 25, 50, 75, 100, then the loop repeats and each boss gets tougher
  bossLoop: ['giant', 'sensei', 'giant', 'eraser'],
  // optional: drawStage() to replace the default paper floor and shelves
};
