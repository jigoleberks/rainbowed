/* Arena 3: The Long Hallway. A dim hotel hallway that loops: walk off one side and you're
   back on the other, so there are no walls to flip off. Stickmen come out of the doors
   (every door is room 1137). The fluorescent lights flicker, the gaps between them are dark,
   and your rainbow splats glow, so the more mess you make the more you can see. */

(() => {
  const DOORS = [170, 430, 656];
  const LIGHT_XS = [100, 300, 500, 700];
  const DOOR_Y = 290;

  // darkness is painted on its own canvas, with light "cut out" of it each frame;
  // splat glows accumulate on a second canvas so they cost nothing per frame
  const dark = document.createElement('canvas'); dark.width = W * 2; dark.height = H * 2;
  const dctx = dark.getContext('2d'); dctx.scale(2, 2);
  const glow = document.createElement('canvas'); glow.width = W * 2; glow.height = H * 2;
  const gctx = glow.getContext('2d'); gctx.scale(2, 2);

  let lights = [], doors = [];

  // ---------- drawing ----------
  const box = (x, y, w, h, fill, lw = 3) => {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  };

  function drawHall() {
    // wall: damask dots above the wainscot, panels below
    ctx.fillStyle = '#e6e2d8'; ctx.fillRect(0, 0, W, G);
    ctx.fillStyle = '#d6d0c2';
    for (let y = 40; y < 320; y += 28) for (let x = (y / 28) % 2 ? 14 : 0; x < W; x += 28) {
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ddd5c4'; ctx.fillRect(0, 330, W, G - 330);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; line(0, 330, W, 330);
    ctx.strokeStyle = '#c6bca8'; ctx.lineWidth = 1.5;
    for (let x = 20; x < W; x += 80) ctx.strokeRect(x, 342, 60, 46);
    // ceiling
    ctx.fillStyle = '#d8d3c7'; ctx.fillRect(0, 0, W, 14);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; line(0, 14, W, 14);
    for (const vx of [360, 600]) { box(vx - 16, 14, 32, 8, '#b9bcc6', 2); ctx.lineWidth = 1.2; for (let k = -12; k <= 12; k += 6) line(vx + k, 15, vx + k, 21); }

    // carpet runner
    ctx.fillStyle = '#9c5a5f'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#c9a54e'; ctx.lineWidth = 1.5;
    for (let x = 0; x < W + 40; x += 40) { poly([x, G + 25, x + 20, G + 10, x + 40, G + 25, x + 20, G + 40, x, G + 25]); }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);

    // doors, every one of them room 1137
    for (const d of doors) {
      const x0 = d.x - 26;
      box(x0 - 4, DOOR_Y - 4, 60, G - DOOR_Y + 4, '#cbbd9f', 2.5);
      if (d.open > 0) {
        ctx.fillStyle = '#1d1b22'; ctx.fillRect(x0, DOOR_Y, 52, G - DOOR_Y);
        const sw = 52 * (1 - Math.min(1, d.open / 0.4) * 0.75);
        box(x0, DOOR_Y, sw, G - DOOR_Y, '#b49a73', 2);
      } else {
        box(x0, DOOR_Y, 52, G - DOOR_Y, '#b49a73', 2.5);
        ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 8, DOOR_Y + 10, 36, 38); ctx.strokeRect(x0 + 8, DOOR_Y + 58, 36, 44);
        ctx.fillStyle = '#e0c46a'; ctx.beginPath(); ctx.arc(x0 + 44, 350, 3, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      }
      box(d.x - 15, DOOR_Y - 20, 30, 11, '#e9e2cf', 1.5);
      ctx.fillStyle = INK; ctx.font = '600 8px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText('1137', d.x, DOOR_Y - 12);
    }

    // exit signs pointing off both ends, into the same hallway
    for (const [x, t] of [[44, '← EXIT'], [W - 44, 'EXIT →']]) {
      box(x - 26, 104, 52, 16, '#2f9e5b', 2);
      ctx.fillStyle = '#eafff1'; ctx.font = '600 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(t, x, 116);
    }

    // radiators
    for (const rx of [30, 690]) {
      box(rx, 352, 70, 38, '#c9ccd2', 2.5);
      ctx.lineWidth = 1.5; for (let k = rx + 8; k < rx + 70; k += 8) line(k, 356, k, 386);
      ctx.lineWidth = 2.5; line(rx + 6, 390, rx + 6, 398); line(rx + 64, 390, rx + 64, 398);
    }
    // luggage cart
    ctx.strokeStyle = '#a4843a'; ctx.lineWidth = 4;
    line(256, 340, 256, 262); line(334, 340, 334, 262); ctx.beginPath(); ctx.moveTo(256, 268); ctx.quadraticCurveTo(295, 246, 334, 268); ctx.stroke();
    box(248, 340, 96, 10, '#d6b25a', 2.5);
    box(262, 318, 30, 22, '#6f9a95', 2);
    for (const wx of [262, 330]) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(wx, 392, 7, 0, Math.PI * 2); ctx.fill(); }
    // vending machine, softly glowing
    box(555, 238, 70, 162, '#d0d8e2', 3);
    box(562, 248, 42, 110, '#eef4fa', 2);
    const snacks = ['#d9574a', '#e9c400', '#2b86e0', '#2fb866', '#9b7bb0'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { ctx.fillStyle = snacks[(r + c * 2) % 5]; ctx.fillRect(566 + c * 13, 254 + r * 21, 9, 12); }
    box(609, 262, 10, 26, '#9aa2ad', 1.5); box(562, 366, 42, 18, '#1d1b22', 2);
    // overhead pipes
    for (const [px, py, pw] of [[110, 228, 220], [400, 168, 160]]) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2; line(px + 20, 14, px + 20, py); line(px + pw - 20, 14, px + pw - 20, py);
      box(px, py, pw, 10, '#c49a6c', 2.5);
      for (const fx of [px + 6, px + pw - 10]) box(fx, py - 2, 4, 14, '#a97f52', 1.5);
    }
    // fluorescent tubes
    for (const l of lights) {
      const lit = !l.dead && l.flick <= 0;
      box(l.x - 42, 26, 84, 10, '#c9ccd2', 2);
      ctx.fillStyle = lit ? '#fffbe2' : l.dead ? '#5e5b66' : '#a8a7ad'; ctx.fillRect(l.x - 38, 36, 76, 5);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(l.x - 38, 36, 76, 5);
      line(l.x - 34, 14, l.x - 34, 26); line(l.x + 34, 14, l.x + 34, 26);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  }

  // the dark, with the light cut out of it
  function drawDark() {
    const live = lights.filter(l => !l.dead).length;
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = `rgba(20, 17, 32, ${0.5 + (lights.length - live) * 0.1})`;
    dctx.fillRect(0, 0, W, H);
    dctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, rx, ry, a) => {
      dctx.save(); dctx.translate(x, y); dctx.scale(1, ry / rx);
      const g = dctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g; dctx.beginPath(); dctx.arc(0, 0, rx, 0, Math.PI * 2); dctx.fill(); dctx.restore();
    };
    for (const l of lights) if (!l.dead && l.flick <= 0) hole(l.x, 210, 150, 240, 0.97);
    hole(590, 300, 70, 90, 0.55);                                  // vending machine
    hole(44, 112, 40, 26, 0.6); hole(W - 44, 112, 40, 26, 0.6);      // exit signs
    dctx.drawImage(glow, 0, 0, W, H);                              // glowing rainbow splats
    if (!player.dead) {
      hole(player.x, player.y - 40, rainbowT > 0 ? 130 : 72, rainbowT > 0 ? 130 : 80, 0.85);
      if (flash > 0) hole(player.x + Math.cos(player.aim) * 40, player.y - 52, 120, 110, 0.7);
    }
    dctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(dark, 0, 0, W, H);
  }

  ARENAS['long-hallway'] = {
    id: 'long-hallway', number: 3, name: 'The Long Hallway',
    wrap: true,
    plats: [
      {x: 30, y: 352, w: 70},    // radiator
      {x: 248, y: 340, w: 96},   // luggage cart
      {x: 110, y: 228, w: 220},  // pipe
      {x: 400, y: 168, w: 160},  // high pipe
      {x: 555, y: 238, w: 70},   // vending machine
      {x: 690, y: 352, w: 70},   // radiator
    ],
    bossLoop: ['giant', 'inkblob', 'giant', 'slowone'],
    // out of a door, or now and then dropping from a ceiling vent
    spawnPoint() {
      if (Math.random() < 0.15) return {x: Math.random() < 0.5 ? 360 : 600, y: 30, air: true};
      const d = doors[Math.floor(Math.random() * doors.length)];
      d.open = 0.9;
      return {x: d.x, y: G, air: false};
    },
    drawStage: drawHall,
    drawOver: drawDark,
    onSplat(x, y, h, r) {
      const g = gctx.createRadialGradient(x, y, 0, x, y, 30);
      g.addColorStop(0, 'rgba(0,0,0,0.32)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      gctx.fillStyle = g; gctx.beginPath(); gctx.arc(x, y, 30, 0, Math.PI * 2); gctx.fill();
    },
    // for the Ink Blob: swallow the nearest working light, or bring them all back
    killLight(fromX) {
      const live = lights.filter(l => !l.dead);
      if (!live.length) return null;
      const l = live.reduce((a, b) => Math.abs(wrapDx(b.x - fromX)) < Math.abs(wrapDx(a.x - fromX)) ? b : a);
      l.dead = true;
      return l;
    },
    relight() { for (const l of lights) { l.dead = false; l.flick = rand(0.1, 0.5); } },
    get lights() { return lights; },
    get doors() { return doors; },
    setup() {
      gctx.clearRect(0, 0, W, H);
      lights = LIGHT_XS.map(x => ({x, dead: false, flick: 0}));
      doors = DOORS.map(x => ({x, open: 0}));
      props.push({update: dt => {
        for (const d of doors) if (d.open > 0) d.open -= dt;
        for (const l of lights) {
          if (l.flick > 0) l.flick -= dt;
          else if (!l.dead && Math.random() < dt * 0.25) l.flick = rand(0.05, 0.25);
        }
      }});
    },
  };
})();
