/* The Clown Car: the Bear Cave's finale. The snoring stops, the cave goes quiet, one eye opens...
   and the bear rolls over, still asleep. Then every time it shifts in its sleep, more bears
   tumble out of it: cubs, then bigger bears, then bears that clearly could not have fit in
   there. Survive 45 seconds and it rolls back, everyone climbs back in, and you find out how
   many bears were in there. The big bear never wakes up. */

const CLOWN_TIME = 45, CLOWN_MAX = 9;
const CLOWN_SIZE = [1.0, 1.45, 2.1];                // cub, bear, how did that fit
const clownHp = (tier, level) => Math.round([3, 7, 14][tier] * (1 + 0.3 * level));

function makeClownBear(tier, level) {
  const home = arena.belly ? arena.belly() : {x: W / 2, y: G};
  const dir = Math.random() < 0.5 ? -1 : 1;
  return {tier, s: CLOWN_SIZE[tier], x: home.x + dir * 20, y: G - 30, vx: dir * rand(140, 300), vy: -rand(420, 620),
    onGround: false, facing: dir, phase: 0, hp: clownHp(tier, level), offs: rand(-40, 40), hopCd: rand(0.5, 1.2), drop: 0, flash: 0, iT: 0.3};
}

function updateClownCar(b, dt, fighting) {
  const bear = arena.bear || {};
  // the bears that are out
  for (const k of b.bears) {
    k.flash = Math.max(0, k.flash - dt); k.iT = Math.max(0, k.iT - dt);
    if (b.st === 'home') {
      // everyone back inside
      const home = arena.belly ? arena.belly() : {x: W / 2, y: G};
      const d = home.x - k.x; k.facing = Math.sign(d) || 1; k.vx = clamp(d * 4, -320, 320);
      physics(k, dt, true); k.phase += dt * 12;
      if (Math.abs(d) < 16) { k.gone = true; dustPoof(home.x, home.y, 6); }
      continue;
    }
    // each one aims a little to the side of you, so they don't all stack up
    const dx = player.x + k.offs - k.x, dy = player.y - k.y;
    if (k.onGround) k.facing = Math.sign(dx) || k.facing;
    const speed = (150 + (2 - k.tier) * 50 + b.level * 20);
    if (fighting) {
      k.vx += ((Math.abs(dx) > 8 ? k.facing * speed : 0) - k.vx) * Math.min(1, dt * (k.onGround ? 5 : 1));
      k.hopCd -= dt;
      if (k.onGround && dy < -40 && Math.abs(dx) < 200 && k.hopCd <= 0) { k.vy = -(560 + (2 - k.tier) * 80); k.hopCd = rand(0.8, 1.4); }
      else if (k.onGround && dy > 40) k.drop = 0.25;
    }
    k.drop -= dt;
    physics(k, dt, k.drop > 0);
    k.phase += dt * Math.abs(k.vx) * 0.06;
    if (k.x < 16) { k.x = 16; k.vx = Math.abs(k.vx); }
    if (k.x > W - 16) { k.x = W - 16; k.vx = -Math.abs(k.vx); }
    const reach = 22 * k.s;
    if (fighting && invuln <= 0 && player.kickT <= 0 && rainbowT <= 0 && Math.abs(player.x - k.x) < reach && player.y > k.y - 34 * k.s && player.y - 70 < k.y) {
      if (hp <= 1) deathTitle = 'You got bear-piled.';
      hurt(k);
    }
  }
  b.bears = b.bears.filter(k => !k.gone && k.hp > 0);

  switch (b.st) {
    case 'quiet':
      // the snoring stops
      b.t -= dt;
      if (b.t <= 0) { b.st = 'eye'; b.t = 1.8; }
      return;
    case 'eye':
      // ...one eye opens. It looks at you.
      b.t -= dt; bear.eye = Math.min(1, bear.eye + dt * 2.5);
      if (b.t <= 0) { b.st = 'roll'; b.t = 1.1; bear.roll = 1.1; shake = 14; }
      return;
    case 'roll':
      // and it rolls over. Still asleep.
      b.t -= dt; bear.eye = Math.max(0, bear.eye - dt * 4);
      if (b.t < 0.55 && !b.rolled) { b.rolled = true; bear.flipped = !bear.flipped; dustPoof(arena.BX || W / 2, G - 20, 40); }
      if (b.t <= 0) {
        b.st = 'pour'; b.shiftT = 0.6; bear.snoring = true;
        banner = {title: 'THE CLOWN CAR', sub: 'He rolled over. Something is coming out. Survive ' + CLOWN_TIME + ' seconds.', life: 3};
      }
      return;
    case 'home':
      b.t -= dt;
      if (b.t <= 0 || !b.bears.length) {
        const pts = 4000 * (b.level + 1);
        score += pts; hp = Math.min(maxHp(), hp + 1);
        nextBossAt += 25; spawnT = 1.8; boss = null;
        banner = {title: 'THERE WERE ' + b.count + ' BEARS IN THERE', sub: 'Survived   ·   +' + pts + '   ·   +1 life', life: 3.4};
      }
      return;
  }
  if (!fighting) return;
  b.timer -= dt;
  if (b.timer <= 0) {
    // it rolls back, and everyone climbs back in
    b.st = 'home'; b.t = 2.5; bear.roll = 1; bear.flipped = !bear.flipped; shake = 10;
    return;
  }
  // every so often it shifts in its sleep and more bears tumble out
  b.shiftT -= dt;
  if (b.shiftT <= 0) {
    const prog = 1 - b.timer / CLOWN_TIME;
    b.shiftT = Math.max(1.3, 3.2 - prog * 1.8 - b.level * 0.3);
    if (b.bears.length < CLOWN_MAX) {
      bear.squash = 0.4; bear.roll = 0.35;
      const n = 1 + (Math.random() < 0.3 + prog * 0.5 ? 1 : 0);
      for (let i = 0; i < n && b.bears.length < CLOWN_MAX; i++) {
        const r = Math.random();
        const tier = prog < 0.25 ? 0 : prog < 0.6 ? (r < 0.6 ? 0 : 1) : (r < 0.35 ? 0 : r < 0.75 ? 1 : 2);
        b.bears.push(makeClownBear(tier, b.level));
        b.count++;
      }
      dustPoof((arena.belly ? arena.belly().x : W / 2), G - 30, 14);
      texts.push({x: arena.BX || W / 2, y: G - 150, s: b.count + (b.count === 1 ? ' BEAR' : ' BEARS'), life: 0.8, big: false});
    }
  }
}

BOSSES.clowncar = {
  name: 'THE CLOWN CAR', pts: 0, koZoom: 2,
  warning: 'The snoring stopped.',
  spawn(level) {
    const bear = arena.bear || {};
    bear.snoring = false;
    return {x: arena.BX || W / 2, y: G, scale: 1, hp: 1, st: 'quiet', t: 1.2, timer: CLOWN_TIME, shiftT: 1,
      bears: [], count: 0, rolled: false, hitT: 0, name: 'THE CLOWN CAR'};
  },
  update(b, dt, fighting) { updateClownCar(b, dt, fighting); },
  draw(b) {
    for (const k of b.bears) drawWalkingBear(k.x, k.y, k.s, k.facing, {phase: k.phase, angry: k.tier > 0, hit: k.flash > 0});
  },
  // the big bear can't be hurt; the ones that came out can
  zone(b, x, y, pad) {
    if (b.st === 'home') return 0;
    for (const k of b.bears) {
      if (k.iT > 0) continue;
      const lx = (x - k.x) * k.facing;
      if (lx > -28 * k.s - pad && lx < 42 * k.s + pad && y > k.y - 42 * k.s && y < k.y + 4) { b.hitBear = k; return lx > 14 * k.s && y < k.y - 14 * k.s ? 2 : 1; }
    }
    return 0;
  },
  onHit(b, dmg, x, y) {
    const k = b.hitBear;
    if (!k || k.hp <= 0) return 0;
    k.hp -= dmg; k.flash = 0.08;
    if (k.hp <= 0) {
      burst(k.x, k.y - 20 * k.s, 0, -260, 30 + k.tier * 25);
      dustPoof(k.x, k.y - 20 * k.s, 10 + k.tier * 8);
      const pts = 250 * (k.tier + 1);
      score += pts; texts.push({x: k.x, y: k.y - 50 * k.s, s: '+' + pts, life: 0.7, big: false});
    }
    return 0;   // the bar is the sleeping bear, and it doesn't go down
  },
  aimPoint(b) {
    if (!b.bears.length || b.st === 'home') return null;
    const k = b.bears.reduce((a, c) => Math.abs(c.x - player.x) < Math.abs(a.x - player.x) ? c : a);
    return {x: k.x + k.facing * 10 * k.s, y: k.y - 22 * k.s, d: Math.hypot(k.x - player.x, (k.y - player.y) * 1.3)};
  },
};
