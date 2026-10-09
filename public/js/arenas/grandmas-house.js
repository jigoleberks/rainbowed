/* Arena 2: Grandma's House. A living room drawn in ink: the couch, bookshelf, wall shelf,
   kitchen counter and fridge are the shelves. Stickmen come in through the front door and
   the window. Sophy lives here, and does what she wants. */

(() => {
  const SEAT = {x: 182, y: 348};       // the couch seat, where grandma ends up
  const LIGHT_X = 485;

  // ---------- drawing helpers ----------
  const fillRect = (x, y, w, h, fill, lw = 3) => {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  };
  const round = (x, y, w, h, r, fill, lw = 3) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
  };
  const top = (p) => { ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round'; line(p.x, p.y, p.x + p.w, p.y); };
  const WOOD = '#ead8bd', WOOD2 = '#d9c19c';

  function drawRoom() {
    // wallpaper and trim
    ctx.strokeStyle = '#ece6db'; ctx.lineWidth = 2;
    for (let x = 14; x < W; x += 26) line(x, 16, x, 386);
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    line(0, 14, W, 14);
    ctx.lineWidth = 2.5; line(0, 388, W, 388);
    // floorboards
    ctx.fillStyle = '#f3ebdf'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#d9cbb5'; ctx.lineWidth = 1.5;
    line(0, G + 16, W, G + 16); line(0, G + 33, W, G + 33);
    for (let x = 40; x < W; x += 110) { line(x, G, x, G + 16); line(x + 55, G + 16, x + 55, G + 33); line(x + 20, G + 33, x + 20, H); }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);

    // front door (left)
    fillRect(8, 268, 56, 120, WOOD, 3);
    ctx.lineWidth = 2; ctx.strokeRect(16, 280, 40, 40); ctx.strokeRect(16, 330, 40, 46);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(54, 334, 3, 0, Math.PI * 2); ctx.fill();

    // picture frames, a little crooked
    for (const [x, y, w, h, a, kind] of [[112, 196, 48, 36, -0.07, 'hills'], [196, 170, 36, 46, 0.06, 'cat']]) {
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(a);
      fillRect(-w / 2, -h / 2, w, h, '#fbf7ef', 3);
      ctx.lineWidth = 1.8; ctx.strokeStyle = INK;
      if (kind === 'hills') { poly([-w / 2 + 4, 8, -8, -6, 2, 4, 10, -4, w / 2 - 4, 8]); ctx.beginPath(); ctx.arc(10, -9, 3, 0, Math.PI * 2); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(0, 9, 10, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(6, 0, 5, 0, Math.PI * 2); ctx.stroke(); poly([3, -4, 4, -9, 6, -5]); poly([8, -5, 10, -9, 10, -4]); }
      ctx.restore();
    }

    // couch
    round(86, 298, 196, 56, 12, '#dbb8a7');
    round(76, 322, 24, 58, 9, '#d3a995'); round(268, 322, 24, 58, 9, '#d3a995');
    round(94, 344, 178, 20, 6, '#e6c6b6');
    fillRect(92, 362, 182, 24, '#cfa28d', 3);
    ctx.lineWidth = 3; line(100, 386, 100, 398); line(266, 386, 266, 398);
    ctx.lineWidth = 2; line(183, 346, 183, 362);

    // bookshelf
    fillRect(300, 212, 95, 188, WOOD, 3);
    const books = ['#c96f5b', '#5c86a8', '#8aa66b', '#d6a84a', '#9b7bb0', '#6f9a95'];
    for (const [i, y] of [[0, 262], [1, 312], [2, 360]].map((v, k) => [k, v[1]])) {
      ctx.lineWidth = 3; ctx.strokeStyle = INK; line(300, y, 395, y);
      let x = 306;
      for (let k = 0; x < 380; k++) {
        const bw = 7 + ((k * 7 + i * 3) % 6), bh = 26 + ((k * 13 + i * 5) % 14);
        ctx.fillStyle = books[(k + i * 2) % books.length]; ctx.fillRect(x, y - bh, bw, bh);
        ctx.lineWidth = 1.5; ctx.strokeRect(x, y - bh, bw, bh);
        x += bw + 1;
      }
    }

    // wall shelf
    fillRect(430, 262, 110, 6, WOOD2, 2.5);
    ctx.lineWidth = 2.5; poly([446, 268, 446, 286, 462, 268]); poly([524, 268, 524, 286, 508, 268]);

    // window over the counter
    fillRect(572, 150, 106, 90, '#e8f0f5', 3);
    ctx.lineWidth = 2.5; line(625, 150, 625, 240); line(572, 195, 678, 195);
    fillRect(564, 240, 122, 6, WOOD2, 2.5);
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(566, 146); ctx.quadraticCurveTo(586, 190, 572, 236); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(684, 146); ctx.quadraticCurveTo(664, 190, 678, 236); ctx.stroke();
    line(560, 146, 690, 146);

    // kitchen counter
    fillRect(556, 326, 140, 74, WOOD, 3);
    fillRect(552, 318, 148, 8, WOOD2, 3);
    ctx.lineWidth = 2; ctx.strokeRect(564, 334, 58, 56); ctx.strokeRect(630, 334, 58, 56);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(616, 362, 2.5, 0, Math.PI * 2); ctx.arc(636, 362, 2.5, 0, Math.PI * 2); ctx.fill();

    // fridge (Sophy's spot)
    round(708, 192, 84, 208, 8, '#f4f4f0');
    ctx.lineWidth = 2.5; line(708, 262, 792, 262);
    ctx.lineWidth = 4; line(718, 212, 718, 246); line(718, 276, 718, 330);
    ctx.fillStyle = '#d98b3a'; ctx.beginPath(); ctx.arc(760, 290, 5, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();

    // shelf tops: what you actually stand on
    for (const p of PLATS) top(p);
  }

  // ---------- the TV grandma watches ----------
  function drawTV(t) {
    fillRect(420, 368, 74, 6, WOOD2, 2.5);
    ctx.lineWidth = 2.5; line(426, 374, 426, 398); line(488, 374, 488, 398);
    round(428, 326, 58, 42, 7, '#e9e4da');
    const on = t > 0;
    ctx.fillStyle = on ? `hsl(${(clock * 90) % 360} 60% ${70 + Math.sin(clock * 23) * 8}%)` : '#b9bcc6';
    ctx.fillRect(434, 332, 38, 30);
    ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.strokeRect(434, 332, 38, 30);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(479, 340, 2, 0, Math.PI * 2); ctx.arc(479, 350, 2, 0, Math.PI * 2); ctx.fill();
    line(450, 326, 440, 308); line(462, 326, 474, 310);
    if (on) { ctx.font = '13px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('♪', 453 + Math.sin(clock * 3) * 6, 318 - (clock * 20) % 30); }
  }

  // ---------- Sophy ----------
  const FUR = '#8b735c', ORANGE = '#d98b3a', STRIPE = '#3b3128';
  function drawSophy(c) {
    const f = c.facing;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const body = (cx, cy, rx, ry, rot = 0) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = FUR; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = ORANGE;
      ctx.beginPath(); ctx.ellipse(-rx * 0.35, -ry * 0.2, rx * 0.4, ry * 0.7, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(rx * 0.55, ry * 0.4, rx * 0.3, ry * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = STRIPE; ctx.lineWidth = 2;
      for (const k of [-0.5, -0.1, 0.3]) line(rx * k, -ry, rx * k + 3, -ry * 0.2);
      ctx.restore();
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    };
    const head = (hx, hy, sleepy) => {
      ctx.fillStyle = FUR;
      ctx.beginPath(); ctx.moveTo(hx - 6, hy - 4); ctx.lineTo(hx - 5, hy - 12); ctx.lineTo(hx - 1, hy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 6, hy - 4); ctx.lineTo(hx + 5, hy - 12); ctx.lineTo(hx + 1, hy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx, hy, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = STRIPE; ctx.lineWidth = 1.8;
      line(hx - 1.5, hy - 7, hx - 1.5, hy - 3); line(hx + 1.5, hy - 7, hx + 1.5, hy - 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      if (sleepy) { ctx.beginPath(); ctx.arc(hx - 3, hy, 1.8, 0.1, Math.PI - 0.1); ctx.stroke(); ctx.beginPath(); ctx.arc(hx + 3, hy, 1.8, 0.1, Math.PI - 0.1); ctx.stroke(); }
      else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx - 3, hy - 0.5, 1.4, 0, Math.PI * 2); ctx.arc(hx + 3, hy - 0.5, 1.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineWidth = 2.5;
    };
    if (c.mode === 'hang') {
      ctx.lineWidth = 2.5; line(-4, -2, -2, 8); line(4, -2, 2, 8);
      body(0, 22, 8, 16, Math.sin(clock * 6) * 0.2);
      head(0, 10, false);
    } else if (c.mode === 'hop') {
      ctx.lineWidth = 2.5; line(-10 * f, -8, -15 * f, -2); line(10 * f, -8, 15 * f, -3);
      body(0, -11, 20, 7);
      ctx.beginPath(); ctx.moveTo(-19 * f, -12); ctx.quadraticCurveTo(-30 * f, -24, -24 * f, -30); ctx.stroke();
      head(19 * f, -17, false);
    } else {
      const wig = c.mode === 'crouch' ? Math.sin(clock * 22) * 2 : 0;
      ctx.beginPath(); ctx.moveTo(-16 * f + wig, -4); ctx.quadraticCurveTo(-26 * f, -2, -20 * f, 4); ctx.quadraticCurveTo(0, 6, 10 * f, 1); ctx.stroke();
      body(wig * 0.5, -9, 17, 9);
      if (c.mode === 'swat') { ctx.lineWidth = 2.5; line(12 * f, -10, 24 * f, -20 + Math.sin(clock * 30) * 3); }
      const sleepy = c.mode === 'nap';
      head(13 * f, sleepy ? -11 : -16, sleepy);
      if (sleepy) {
        ctx.fillStyle = INK; ctx.font = '12px "Permanent Marker", cursive'; ctx.textAlign = 'center';
        const zt = (clock * 0.7) % 1;
        ctx.globalAlpha = 1 - zt; ctx.fillText('z', 18 * f + zt * 8, -24 - zt * 18); ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  // ---------- knockable things ----------
  const ITEM_DRAW = {
    plant(x, y) { round(x - 8, y - 14, 16, 14, 3, '#c9785a', 2); ctx.strokeStyle = '#4f7d45'; ctx.lineWidth = 2.5;
      for (const a of [-0.6, -0.2, 0.2, 0.6]) line(x, y - 14, x + Math.sin(a) * 14, y - 14 - Math.cos(a) * 14); },
    mug(x, y) { round(x - 6, y - 12, 12, 12, 2, '#d9574a', 2); ctx.beginPath(); ctx.arc(x + 7, y - 6, 3.5, -1.4, 1.4); ctx.stroke(); },
    books(x, y) { fillRect(x - 12, y - 6, 24, 6, '#5c86a8', 1.8); fillRect(x - 10, y - 12, 20, 6, '#d6a84a', 1.8); fillRect(x - 11, y - 18, 22, 6, '#9b7bb0', 1.8); },
    kettle(x, y) { round(x - 10, y - 16, 20, 16, 7, '#9fb7c9', 2); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 16, 7, Math.PI, 0); ctx.stroke(); line(x + 10, y - 9, x + 16, y - 14); },
  };
  function makeItem(kind, x, y) {
    const shelf = PLATS.find(p => Math.abs(p.y - y) < 1 && x > p.x && x < p.x + p.w);
    const it = {kind, hx: x, hy: y, x, y, vx: 0, vy: 0, rot: 0, st: 'rest', back: 0, shelf};
    it.update = dt => {
      if (it.st === 'slide') {
        it.x += it.vx * dt;
        if (it.x < it.shelf.x - 4 || it.x > it.shelf.x + it.shelf.w + 4) { it.st = 'fall'; it.vy = -60; }
      } else if (it.st === 'fall') {
        const py = it.y;
        it.vy += 1100 * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vx * dt * 0.08;
        const ly = it.vy > 0 ? landY(it.x, py, it.y) : null;
        if (ly !== null) {
          it.y = ly; it.st = 'gone'; it.back = 25;
          burst(it.x, it.y - 6, 0, -200, 26); rings.push({x: it.x, y: it.y - 6, r: 6, life: 0.3});
          for (const e of enemies) if (!e.dead && Math.hypot(e.x - it.x, e.y - 30 - it.y) < 60) kill(e, Math.sign(e.x - it.x) * 300 || 300, -300, false);
          texts.push({x: it.x, y: it.y - 30, s: 'CRASH!', life: 0.8, big: false});
          shake = Math.max(shake, 6);
        }
      } else if (it.st === 'gone') {
        it.back -= dt;
        if (it.back <= 0) { it.st = 'rest'; it.x = it.hx; it.y = it.hy; it.rot = 0; it.vx = 0; }
      }
    };
    it.draw = () => {
      if (it.st === 'gone') return;
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot); ctx.translate(-it.x, -it.y);
      ctx.strokeStyle = INK; ITEM_DRAW[it.kind](it.x, it.y);
      ctx.restore();
    };
    return it;
  }

  // ---------- the ceiling light ----------
  function makeLight() {
    const L = {st: 'hang', y: 0, vy: 0, swing: 0, down: 0};
    L.update = dt => {
      if (L.st === 'fall') {
        L.vy += 1500 * dt; L.y += L.vy * dt;
        if (L.y + 114 >= G) {
          L.y = G - 114; L.st = 'broken'; L.down = 6;
          const cx = LIGHT_X, cy = G - 10;
          burst(cx, cy, 0, -400, 140); burst(cx, cy, 0, -200, 90);
          for (let i = 0; i < 4; i++) rings.push({x: cx, y: cy, r: 6 + i * 35, life: 0.4 + i * 0.1});
          let n = 0;
          for (const e of enemies) if (!e.dead && Math.abs(e.x - cx) < 170) { kill(e, Math.sign(e.x - cx) * 500 || 500, -500, false); n++; }
          const z = bossZone(boss, cx, boss ? boss.y - 30 : 0, 90);
          if (z) hitBoss(boss, cx, boss.y - 30, 0, -1, 10);
          shake = 20;
          texts.push({x: cx, y: 200, s: n ? 'CHANDELIERED x' + n : 'CHANDELIERED', life: 1.4, big: true});
        }
      } else if (L.st === 'broken') L.down -= dt;
    };
    L.draw = () => {
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (L.st === 'broken') {
        line(LIGHT_X, 14, LIGHT_X + 3, 60); line(LIGHT_X + 3, 60, LIGHT_X - 2, 68);
        if (L.down > 0) { ctx.globalAlpha = Math.min(1, L.down); ctx.save(); ctx.translate(LIGHT_X + 10, G - 6); ctx.rotate(0.5); round(-31, -12, 62, 14, 4, '#f1d9a6', 2.5); ctx.restore(); ctx.globalAlpha = 1; }
        return;
      }
      const a = L.st === 'swing' ? Math.sin(clock * 7) * 0.28 : Math.sin(clock * 1.3) * 0.03;
      ctx.save(); ctx.translate(LIGHT_X, 14 + L.y); ctx.rotate(a);
      if (L.st !== 'fall') line(0, 0, 0, 76); else line(0, 60, 0, 76);
      ctx.beginPath(); ctx.moveTo(-13, 76); ctx.lineTo(13, 76); ctx.lineTo(31, 100); ctx.lineTo(-31, 100); ctx.closePath();
      ctx.fillStyle = '#f1d9a6'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(246, 205, 90, 0.35)'; ctx.beginPath(); ctx.arc(0, 104, 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      L.tipX = LIGHT_X - Math.sin(a) * 100; L.tipY = 14 + L.y + Math.cos(a) * 100;
    };
    return L;
  }

  // ---------- Sophy's brain ----------
  function makeSophy(items, light) {
    const fridge = PLATS.reduce((a, p) => p.x > a.x ? p : a);
    const c = {x: fridge.x + fridge.w / 2, y: fridge.y, facing: -1, mode: 'nap', hop: null, timer: rand(14, 22), task: null, t: 0, front: true, lightTried: false};
    const spot = () => {
      const opts = PLATS.map(p => ({x: rand(p.x + 14, p.x + p.w - 14), y: p.y})).concat([{x: rand(80, W - 80), y: G}]);
      return opts[Math.floor(Math.random() * opts.length)];
    };
    const hopTo = (x, y, then) => {
      c.facing = x >= c.x ? 1 : -1;
      c.hop = {x0: c.x, y0: c.y, x1: x, y1: y, t: 0, dur: 0.45 + Math.hypot(x - c.x, y - c.y) / 900, then};
      c.mode = 'hop';
    };
    const announce = sub => { banner = {title: 'SOPHY TIME', sub, life: 2.2}; };
    const pick = list => list[Math.floor(Math.random() * list.length)];

    function nap() {
      announce(pick(["She's napping.", 'She found a sunbeam.', 'She will not be taking questions.', 'She has decided to do nothing.']));
      const s = spot(); hopTo(s.x, s.y, () => { c.mode = 'nap'; });
    }
    function swat() {
      const live = enemies.filter(e => !e.dead && !e.launched && !e.thrown);
      if (!live.length) return nap();
      const e = live.reduce((a, b) => Math.abs(b.x - c.x) + Math.abs(b.y - c.y) < Math.abs(a.x - c.x) + Math.abs(a.y - c.y) ? b : a);
      announce(pick(['She chose violence.', 'That one looked at her funny.', 'Mine.']));
      const side = e.x > c.x ? -1 : 1;
      hopTo(clamp(e.x + side * 26, 20, W - 20), e.y, () => {
        c.mode = 'swat'; c.facing = -side; c.t = 0.25;
        c.task = () => {
          const near = enemies.filter(o => !o.dead && !o.launched && Math.abs(o.x - c.x) < 70 && Math.abs(o.y - c.y) < 60);
          if (near.length) {
            const o = near.reduce((a, b) => Math.abs(b.x - c.x) < Math.abs(a.x - c.x) ? b : a);
            launch(o, c.facing, 1);
            texts.push({x: o.x, y: o.y - 92, s: 'SWAT!', life: 0.7, big: false});
          }
          c.mode = 'sit';
        };
      });
    }
    function knock() {
      const up = items.filter(i => i.st === 'rest');
      if (!up.length) return nap();
      const it = pick(up);
      announce(pick(['Something had to go.', 'She saw it and knew.', 'It was too close to the edge anyway.']));
      const dir = it.x > it.shelf.x + it.shelf.w / 2 ? 1 : -1;
      hopTo(clamp(it.x - dir * 20, it.shelf.x + 6, it.shelf.x + it.shelf.w - 6), it.y, () => {
        c.mode = 'swat'; c.facing = dir; c.t = 0.35;
        c.task = () => { if (it.st === 'rest') { it.st = 'slide'; it.vx = dir * 160; } c.mode = 'sit'; };
      });
    }
    function chandelier() {
      if (light.st !== 'hang') return nap();
      c.lightTried = true;
      const shelf = PLATS.reduce((a, p) => Math.abs(p.x + p.w / 2 - LIGHT_X) < Math.abs(a.x + a.w / 2 - LIGHT_X) ? p : a);
      announce("She's been planning this.");
      hopTo(clamp(LIGHT_X, shelf.x + 10, shelf.x + shelf.w - 10), shelf.y, () => {
        c.mode = 'crouch'; c.t = 0.9;
        c.task = () => hopTo(LIGHT_X, 122, () => {
          c.mode = 'hang'; light.st = 'swing'; c.t = 1.5;
          c.task = () => {
            light.st = 'fall'; light.vy = 0;
            const s = {x: clamp(LIGHT_X + (Math.random() < 0.5 ? -90 : 90), 40, W - 40), y: G};
            hopTo(s.x, s.y, () => { c.mode = 'sit'; c.t = 2; c.task = () => { c.mode = 'nap'; }; });
          };
        });
      });
    }
    const EVENTS = {nap, swat, knock, light: chandelier};
    // for tests and curious players: arena.sophyTime('light')
    arena.sophyTime = kind => (EVENTS[kind] || nap)();

    c.update = dt => {
      if (c.hop) {
        const h = c.hop; h.t += dt;
        const p = Math.min(1, h.t / h.dur);
        c.x = h.x0 + (h.x1 - h.x0) * p;
        c.y = h.y0 + (h.y1 - h.y0) * p - Math.sin(p * Math.PI) * (50 + Math.abs(h.y1 - h.y0) * 0.3);
        if (p >= 1) { c.hop = null; c.x = h.x1; c.y = h.y1; c.mode = 'sit'; if (h.then) h.then(); }
        return;
      }
      if (c.mode === 'hang' && light.tipX !== undefined) { c.x = light.tipX; c.y = light.tipY - 4; }
      if (c.task) { c.t -= dt; if (c.t <= 0) { const t = c.task; c.task = null; t(); } return; }
      if (state !== 'play' || cine || banner) return;
      c.timer -= dt;
      if (c.timer > 0) return;
      c.timer = rand(20, 32);
      const r = Math.random();
      if (!c.lightTried && light.st === 'hang' && kills >= 10 && r < 0.05) chandelier();
      else if (r < 0.5) nap();
      else if (r < 0.75) swat();
      else knock();
    };
    c.draw = () => drawSophy(c);
    return c;
  }

  ARENAS['grandmas-house'] = {
    id: 'grandmas-house', number: 2, name: "Grandma's House",
    plats: [
      {x: 95, y: 348, w: 175},   // couch
      {x: 300, y: 212, w: 95},   // bookshelf
      {x: 430, y: 262, w: 110},  // wall shelf
      {x: 556, y: 322, w: 140},  // kitchen counter
      {x: 708, y: 192, w: 84},   // fridge
    ],
    bossLoop: ['giant', 'dustbunny', 'giant', 'chancla'],
    seat: SEAT,
    tvT: 0,
    // the front door on the left, or climbing in through the window over the counter
    spawnPoint() {
      if (Math.random() < 0.65) return {x: -12, y: G, air: false};
      return {x: rand(592, 660), y: 240, air: true, vx: -rand(40, 120), vy: -120};
    },
    drawStage: drawRoom,
    setup() {
      this.tvT = 0;
      const tv = {update: dt => { if (this.tvT > 0) this.tvT -= dt; }, draw: () => drawTV(this.tvT)};
      const items = [makeItem('plant', 452, 262), makeItem('mug', 518, 262), makeItem('books', 345, 212), makeItem('kettle', 676, 322)];
      const light = makeLight();
      props.push(tv, light, ...items, makeSophy(items, light));
    },
  };
})();
