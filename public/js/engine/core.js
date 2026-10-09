/* Engine core: constants, canvas, shared state, registries, reset. */
const W = 800, H = 450, G = 400, GRAV = 1800;
const MAG = 12, RELOAD_TIME = 1.1;
const RAINBOW_TIME = 4.5;
const GRENADES = 6, CRATE_EVERY = 15;   // launcher shots per crate; a supply crate every 15 kills

// Registries. Each file in js/arenas/ adds one arena, each file in js/bosses/ one boss.
const ARENAS = {}, BOSSES = {};
let arena = null, PLATS = [];
// Looping arenas (arena.wrap): the left and right edges join up.
const wrapX = x => arena && arena.wrap ? ((x % W) + W) % W : x;
const wrapDx = dx => arena && arena.wrap ? ((dx % W) + W * 1.5) % W - W / 2 : dx;

function setArena(id) {
  arena = ARENAS[id];
  PLATS = arena.plats.map(p => ({...p, gone: 0}));
}
const INK = '#15161a', PAPER = '#fbfbf8', MUTED = '#b9bcc6', ACCENT = '#e8384f';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const stain = document.createElement('canvas');
stain.width = W * 2; stain.height = H * 2;
const sctx = stain.getContext('2d');
sctx.scale(2, 2);

const overlay = document.getElementById('overlay');
const ovTitle = document.getElementById('ov-title');
const ovText = document.getElementById('ov-text');
const ovScore = document.getElementById('ov-score');
const goBtn = document.getElementById('go');
const arenaList = document.getElementById('arena-list');
const ovActions = document.getElementById('ov-actions');
const ovArena = document.getElementById('ov-arena');
const ovStats = document.getElementById('ov-stats');
const bestEl = document.getElementById('best');

let best = 0;
// Page One keeps the original key so existing best scores carry over.
const bestKeyFor = id => id === 'page-one' ? 'rsb-best' : 'rsb-best-' + id;
const bestKey = () => bestKeyFor(arena.id);
function readBest(id) {
  try { return parseInt(localStorage.getItem(bestKeyFor(id)) || '0', 10) || 0; } catch (e) { return 0; }
}
function loadBest() { best = readBest(arena.id); }
const pad6 = n => String(n).padStart(6, '0');
bestEl.textContent = 'Best ' + pad6(best);

function fit() {
  const r = cv.getBoundingClientRect();
  const d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(r.width * d));
  cv.height = Math.max(1, Math.round(r.height * d));
}
new ResizeObserver(fit).observe(cv);
fit();

/* ---------- state ---------- */
let state = 'title';
let player, enemies, bullets, parts, debris, rings, texts, eproj, waves;
let ammo = MAG, reloadT = 0, dual = false;
// two guns: double fire rate and two magazines, kept until you get hit
const magSize = () => dual ? MAG * 2 : MAG;
let cheatSophy = false, cheatLoaf = false, runCheated = false, typed = '';
const maxHp = () => cheatLoaf ? 10 : 5;
let score, kills, combo, comboT, slow, shake, spawnT, hp, invuln, fireCd, flash, overT, clock = 0;
let boss, bossWarn, nextBossAt, bossCount, bossesBeaten, cine, banner, geyser;
// grenades: launcher shots left; nades: grenades in the air
let grenades = 0, nades = [], nextCrateAt = CRATE_EVERY;
let pickups = [], rainbowT = 0, deathTitle = null, props = [];
// end-of-run stats
let runTime = 0, shotsFired = 0, shotsHit = 0;
const cam = {x: W / 2, y: H / 2, z: 1};

function reset() {
  player = {x:W/2, y:G, vx:0, vy:0, onGround:true, facing:1, phase:0, jumps:2, spin:0, spinT:0, drop:0, recoil:0, aim:0, dead:false,
    kickT:0, kickCd:0, airKick:true, kickDir:1, pose:null, tilt:0, flipSign:-1, wallT:0, wallSide:0};
  enemies = []; bullets = []; parts = []; debris = []; rings = []; texts = []; eproj = []; waves = [];
  score = 0; kills = 0; combo = 0; comboT = 0; slow = 0; shake = 0; spawnT = 0.8;
  hp = maxHp(); invuln = 1; fireCd = 0; dual = false; ammo = MAG; reloadT = 0; runCheated = cheatSophy || cheatLoaf; flash = 0; overT = 0;
  boss = null; bossWarn = 0; nextBossAt = 25; bossCount = 0; bossesBeaten = 0; cine = null; banner = null; geyser = null;
  pickups = []; rainbowT = 0; deathTitle = null;
  grenades = 0; nades = []; nextCrateAt = CRATE_EVERY;
  runTime = 0; shotsFired = 0; shotsHit = 0;
  // props: arena extras like Sophy and knockable objects, each {update(dt), draw(), front, done}
  props = [];
  if (arena && arena.setup) arena.setup();
  for (const pl of PLATS) pl.gone = 0;
  cam.x = W / 2; cam.y = H / 2; cam.z = 1;
  sctx.clearRect(0, 0, W, H);
}
