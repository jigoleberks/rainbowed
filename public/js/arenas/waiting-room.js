/* Arena 7: The Waiting Room (Claude's pick). A government office. Beige walls, plastic chairs, a
   dying plant, a water cooler, a clock stuck at 4:59, and NOW SERVING over the counter.
   - The stickmen take a number. They come in the door, pull a ticket, and sit down (or queue
     by the door when the chairs are full). They only come for you when their number is called.
     Every kill calls the next number right away, so the faster you go, the faster they come.
   - Hold music plays the whole time (sound on), down a tinny phone line.
   - Doug from the back office wanders through on the phone, completely unbothered. Now and then
     he says "Can you hold?" and the nearest stickman coming at you is put on hold.
   - The Clerk sits behind the glass the whole run, stamping things. She's the finale.
   The Printer (50) and the Clerk (100) live in bosses/printer.js and bosses/clerk.js. */

(() => {
  const DOOR_X = 52, DISPENSER_X = 108, SEAT_Y = G - 26;
  const SEATS = [168, 212, 256, 300, 412, 456, 500, 544];
  const COUNTER = {x: 664, y: 320, w: 136}, CLERK_X = 738, PRINTER = {x: 628, y: 290};

  const wr = {nowServing: 0, lastTicket: 0, callT: 3, doug: null, clerk: {st: 'desk', say: null, sayT: 0, stampT: 0, arm: 0, back: 0}, printer: {st: 'idle'}, clock: 0};

  const box = (x, y, w, h, fill, lw = 3) => {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
  };

  // ---------- the Clerk (drawn here; her finale is in bosses/clerk.js) ----------
  function drawClerk(x, y, o = {}) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK;
    // cardigan and lanyard (she's behind the counter, so waist up)
    ctx.fillStyle = '#8fa89a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-14, -40); ctx.lineTo(14, -40); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2b4a6b'; ctx.lineWidth = 2; line(-6, -40, 0, -20); line(6, -40, 0, -20);
    box(-5, -20, 10, 12, '#f4f1ea', 1.5);
    // arms: one stamping
    ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
    const up = o.arm || 0;
    poly([-14, -36, -22, -18, -12, -4]);
    poly([14, -36, 24, -36 - up * 22, 18, -26 - up * 34]);
    ctx.fillStyle = '#6b4a2c'; ctx.fillRect(14, -40 - up * 34, 8, 14); ctx.fillStyle = '#e8384f'; ctx.fillRect(12, -27 - up * 34, 12, 4);
    // head, bun, cat-eye glasses, unimpressed
    ctx.fillStyle = PAPER; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -52, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.arc(0, -64, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -54, 10.5, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 4; ctx.strokeStyle = '#5a3a2a'; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    for (const gx of [-4.5, 4.5]) { ctx.beginPath(); ctx.moveTo(gx - 4, -51); ctx.lineTo(gx + 4, -53); ctx.lineTo(gx + 3, -49); ctx.lineTo(gx - 3, -48); ctx.closePath(); ctx.stroke(); }
    line(-1, -50, 1, -50); line(-4, -44, 4, -44);
    ctx.restore();
    if (o.say) { ctx.fillStyle = INK; ctx.font = '14px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText(o.say, x - 20, y - 84); }
  }

  // ---------- the office printer (asleep on the filing cabinet until the Printer fight) ----------
  function drawPrinterBox(x, y, o = {}) {
    ctx.save(); ctx.translate(x, y);
    const k = o.hit ? ACCENT : INK;
    ctx.strokeStyle = k; ctx.lineWidth = 3;
    ctx.fillStyle = '#d9dbe0'; ctx.fillRect(-34, -44, 68, 44); ctx.strokeRect(-34, -44, 68, 44);
    ctx.fillStyle = '#b9bcc6'; ctx.fillRect(-28, -54, 56, 10); ctx.strokeRect(-28, -54, 56, 10);    // scanner lid
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(-24, -16, 48, 6); ctx.strokeRect(-24, -16, 48, 6);       // paper slot
    if (o.paper) { ctx.fillStyle = PAPER; ctx.fillRect(-18, -16 - o.paper * 18, 36, o.paper * 18 + 2); ctx.lineWidth = 1.5; ctx.strokeRect(-18, -16 - o.paper * 18, 36, o.paper * 18 + 2); }
    // status light, and a little screen
    ctx.fillStyle = o.light || '#4fb35a'; ctx.beginPath(); ctx.arc(24, -34, 3.5, 0, Math.PI * 2); ctx.fill();
    box(-26, -38, 26, 12, '#9fb7a2', 1.5);
    ctx.fillStyle = INK; ctx.font = '600 6px "IBM Plex Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(o.screen || 'READY', -24, -29);
    if (o.wheels) { ctx.fillStyle = INK; for (const wx of [-24, 24]) { ctx.beginPath(); ctx.arc(wx, 2, 4, 0, Math.PI * 2); ctx.fill(); } }
    ctx.restore();
  }

  // ---------- the office ----------
  function drawOffice() {
    ctx.fillStyle = '#e9e0c9'; ctx.fillRect(0, 0, W, G);                        // beige
    ctx.fillStyle = '#d8ccb0'; ctx.fillRect(0, 300, W, G - 300);                // the scuffed bottom half
    ctx.strokeStyle = '#bfb193'; ctx.lineWidth = 2; line(0, 300, W, 300);
    // ceiling tiles and one flickering fluorescent tube
    ctx.fillStyle = '#efe9da'; ctx.fillRect(0, 0, W, 30); ctx.strokeStyle = '#cdbf9f'; ctx.lineWidth = 1.5;
    for (let x = 0; x < W; x += 80) line(x, 0, x, 30); line(0, 30, W, 30);
    for (const lx of [200, 480]) box(lx - 50, 30, 100, 8, Math.floor(clock * 7) % 23 === 0 && lx === 480 ? '#c9c4b0' : '#fffbe2', 2);
    // the door, and the ticket dispenser
    box(16, 236, 74, 164, '#9c8a6a', 3); box(26, 250, 54, 50, '#cfe0ea', 2); ctx.fillStyle = '#e0c46a'; ctx.beginPath(); ctx.arc(80, 326, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; line(DISPENSER_X, G, DISPENSER_X, 300);
    box(DISPENSER_X - 12, 270, 24, 30, '#e8384f', 2.5);
    ctx.fillStyle = PAPER; ctx.fillRect(DISPENSER_X - 4, 296, 8, 10);
    ctx.fillStyle = INK; ctx.font = '600 7px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('TAKE A', DISPENSER_X, 258); ctx.fillText('NUMBER', DISPENSER_X, 266);
    // the clock, stuck at 4:59 (until 5:00, during the Clerk)
    const secs = wr.clock, cx = 196, cy = 124;
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ctx.lineWidth = 2; line(cx + Math.cos(a) * 21, cy + Math.sin(a) * 21, cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); }
    const hr = (secs >= 60 ? 5 : 4 + 59 / 60) / 12 * Math.PI * 2 - Math.PI / 2, mn = (secs >= 60 ? 0 : 59) / 60 * Math.PI * 2 - Math.PI / 2, sc = (secs % 60) / 60 * Math.PI * 2 - Math.PI / 2;
    ctx.lineWidth = 3.5; line(cx, cy, cx + Math.cos(hr) * 13, cy + Math.sin(hr) * 13);
    ctx.lineWidth = 2.5; line(cx, cy, cx + Math.cos(mn) * 19, cy + Math.sin(mn) * 19);
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.2; line(cx, cy, cx + Math.cos(sc) * 21, cy + Math.sin(sc) * 21);
    // NOW SERVING
    box(670, 98, 130, 52, '#1d1b22', 3);
    ctx.fillStyle = '#e8384f'; ctx.font = '600 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('NOW SERVING', 735, 114);
    ctx.font = '700 26px "IBM Plex Mono", monospace'; ctx.fillText(String(wr.nowServing % 1000).padStart(3, '0'), 735, 142);
    // the shelf with the motivational poster
    box(280, 210, 150, 8, '#a08a64', 2.5);
    box(300, 150, 52, 56, '#dfe8ef', 2); ctx.fillStyle = INK; ctx.font = '600 6px "IBM Plex Mono", monospace'; ctx.fillText('PATIENCE', 326, 196);
    ctx.strokeStyle = '#7a9a5a'; ctx.lineWidth = 2; line(312, 186, 340, 166); line(326, 186, 330, 170);
    box(370, 182, 20, 28, '#d9a066', 2); box(395, 188, 22, 22, '#c9c4b0', 2);
    // the dying plant and the water cooler
    box(578, 360, 26, 40, '#c9785a', 2.5);
    ctx.strokeStyle = '#8a7a3a'; ctx.lineWidth = 2.5; line(591, 360, 584, 330); line(591, 360, 600, 334); line(584, 330, 574, 340);
    box(140, 330, 0.1, 0.1, INK, 0);
    // the filing cabinet (the printer sits on it)
    box(600, 290, 56, 110, '#a7adb5', 3); for (const dy of [300, 336, 372]) { ctx.lineWidth = 2; ctx.strokeRect(606, dy, 44, 28); ctx.fillStyle = INK; ctx.fillRect(622, dy + 12, 12, 3); }
    if (wr.printer.st === 'idle') drawPrinterBox(PRINTER.x, PRINTER.y, {});
    else if (wr.printer.st === 'broken' && wr.printer.t > 0) {
      drawPrinterBox(PRINTER.x, PRINTER.y, {light: '#e8384f', screen: 'ERR 404'});
      if (Math.random() < 0.3) parts.push({x: PRINTER.x + rand(-10, 10), y: PRINTER.y - 50, vx: rand(-10, 10), vy: -rand(20, 50), h: 0, r: rand(2, 4), life: 0.8, spark: true, col: '#9a9aa2'});
    }
    // the counter, the glass, and the Clerk behind it
    box(670, 160, 130, 160, '#cfe3ec', 3);
    if (wr.clerk.st !== 'away') drawClerk(CLERK_X, COUNTER.y, {arm: wr.clerk.arm, say: wr.clerk.say});
    ctx.fillStyle = 'rgba(220, 240, 250, 0.35)'; ctx.fillRect(670, 160, 130, 160);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; line(690, 180, 720, 210); line(700, 176, 740, 216);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(670, 160, 130, 160);
    box(COUNTER.x, COUNTER.y, COUNTER.w, 80, '#a08a64', 3);
    box(704, 284, 66, 22, wr.clerk.st === 'away' ? '#e8384f' : '#4fb35a', 2);
    ctx.fillStyle = PAPER; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.fillText(wr.clerk.st === 'away' ? 'CLOSED' : 'OPEN', 737, 299);
    // the chairs
    for (const sx of SEATS) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; line(sx - 14, SEAT_Y, sx - 14, G); line(sx + 14, SEAT_Y, sx + 14, G);
      box(sx - 18, SEAT_Y - 4, 36, 6, '#e07a3a', 2); box(sx - 18, SEAT_Y - 36, 6, 32, '#e07a3a', 2);
    }
    // floor: tired carpet tiles
    ctx.fillStyle = '#9aa3a8'; ctx.fillRect(0, G, W, H - G);
    ctx.strokeStyle = '#8a9398'; ctx.lineWidth = 1.5; for (let x = 0; x < W; x += 50) line(x, G, x, H);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; line(0, G, W, G);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  }

  // ticket numbers over the heads of the ones waiting
  function drawTickets() {
    ctx.font = '600 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
    for (const e of enemies) {
      if (e.dead || !e.ticket || !(e.wr === 'seated' || e.wr === 'queue')) continue;
      const y = e.wr === 'seated' ? e.y - 56 : e.y - 90;
      ctx.fillStyle = PAPER; ctx.fillRect(e.x - 12, y - 9, 24, 12); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(e.x - 12, y - 9, 24, 12);
      ctx.fillStyle = INK; ctx.fillText('#' + e.ticket, e.x, y);
    }
    for (const e of enemies) if (!e.dead && e.held > 0) { ctx.fillStyle = INK; ctx.font = '16px "Permanent Marker", cursive'; ctx.fillText('♪', e.x + 10, e.y - 88 - Math.sin(clock * 6) * 3); }
  }

  // ---------- taking a number, sitting, being called ----------
  const seatFree = sx => !enemies.some(o => !o.dead && o.seat === sx);
  function holdEnemy(e, dt) {
    if (e.held > 0) { e.held -= dt; e.vx = 0; e.pose = null; return true; }
    if (e.wr === 'called' || e.wr === 'done') return false;
    if (e.launched || e.thrown) return false;
    if (!e.wr) { e.wr = 'toTicket'; }
    const walk = (x, sp = 120) => { const d = x - e.x; e.facing = Math.sign(d) || e.facing; e.vx = Math.abs(d) > 3 ? Math.sign(d) * sp : 0; return Math.abs(d) <= 3; };
    switch (e.wr) {
      case 'toTicket':
        if (walk(DISPENSER_X + 14) && e.onGround) { e.wr = 'pull'; e.t = 0.4; e.vx = 0; }
        break;
      case 'pull':
        e.t -= dt; e.pose = 'beckon';
        if (e.t <= 0) { e.ticket = ++wr.lastTicket; e.pose = null; e.wr = 'findSeat'; }
        break;
      case 'findSeat': {
        const free = SEATS.filter(seatFree);
        if (free.length) { e.seat = free[Math.floor(Math.random() * free.length)]; e.wr = 'toSeat'; }
        else { e.wr = 'queue'; e.vx = 0; }
        break;
      }
      case 'queue':
        // standing by the door, arms folded, until a chair frees up
        e.pose = 'fold'; e.facing = 1;
        walk(DISPENSER_X + 30 + (e.ticket % 4) * 16, 60);
        if (SEATS.some(seatFree)) { e.pose = null; e.wr = 'findSeat'; }
        break;
      case 'toSeat':
        if (walk(e.seat) && e.onGround) {
          if (Math.abs(e.y - SEAT_Y) < 1) { e.wr = 'seated'; e.vx = 0; e.x = e.seat; }
          else if (e.y >= G - 1) e.vy = -380;   // hop up onto the chair
        }
        break;
      case 'seated':
        e.pose = 'sit'; e.facing = 1; e.vx = 0; e.x = e.seat;
        break;
    }
    return true;
  }

  function callNext() {
    const waiting = enemies.filter(e => !e.dead && e.ticket && (e.wr === 'seated' || e.wr === 'queue' || e.wr === 'toSeat' || e.wr === 'findSeat'));
    if (!waiting.length) return;
    const e = waiting.reduce((a, b) => b.ticket < a.ticket ? b : a);
    wr.nowServing = e.ticket;
    e.wr = 'called'; e.pose = null; e.seat = null; e.vy = -300; e.drop = 0;
    texts.push({x: e.x, y: e.y - 96, s: 'NUMBER ' + e.ticket + '!', life: 0.9, big: false});
    sfx.ding();
  }

  // ---------- Doug, on the phone ----------
  const DOUG_BLUE = '#3f6db0';
  const DOUG_SHOT = ["I'm on a call.", 'Do you mind?', 'HR is going to hear about this.', 'Not now.', 'Can you not?', "I'm literally on the phone."];
  const DOUG_LINES = ['Yep.', 'Mm-hm.', "No, it's chaos here.", 'Uh huh.', 'Can you hold?', 'Totally.', 'Is it Friday yet?', "I'll have to call you back. No I won't.", 'They took a number, Linda.'];
  function makeDoug() {
    const d = {x: 640, y: G, vx: 0, vy: 0, facing: -1, phase: 0, onGround: true, scale: 1, t: 0, sayT: 2, say: null, holdT: rand(14, 20), dest: 300, front: true, col: DOUG_BLUE, shotT: 0};
    d.update = dt => {
      // stroll somewhere, stop, chat, repeat
      const dd = d.dest - d.x;
      if (Math.abs(dd) > 4) { d.facing = Math.sign(dd); d.vx = d.facing * 45; } else { d.vx = 0; d.t -= dt; if (d.t <= 0) { d.dest = rand(130, 590); d.t = rand(2, 5); } }
      d.x += d.vx * dt; d.phase += dt * Math.abs(d.vx) * 0.05;
      d.sayT -= dt;
      if (d.sayT <= 0) { d.say = DOUG_LINES[Math.floor(Math.random() * DOUG_LINES.length)]; d.sayT = rand(3.5, 6); d.sayLife = 2.2; }
      d.sayLife -= dt; if (d.sayLife <= 0) d.say = null;
      // shooting him does nothing (the bullets go through), except annoy him
      d.shotT = Math.max(0, d.shotT - dt);
      if (d.shotT <= 0 && bullets.some(b => Math.abs(b.x - d.x) < 12 && b.y > d.y - 78 && b.y < d.y)) {
        d.say = DOUG_SHOT[Math.floor(Math.random() * DOUG_SHOT.length)]; d.sayLife = 2; d.sayT = 4; d.shotT = 3;
      }
      // "Can you hold?": the nearest one coming at you is put on hold
      if (state === 'play' && !boss) {
        d.holdT -= dt;
        if (d.holdT <= 0) {
          d.holdT = rand(16, 24);
          const live = enemies.filter(e => !e.dead && (e.wr === 'called' || !e.wr) && !e.launched);
          if (live.length) {
            const e = live.reduce((a, b) => Math.abs(b.x - player.x) < Math.abs(a.x - player.x) ? b : a);
            e.held = 4.5; d.say = 'Can you hold?'; d.sayLife = 2.4;
            texts.push({x: e.x, y: e.y - 100, s: 'ON HOLD', life: 1, big: false});
          }
        }
      }
    };
    d.draw = () => {
      // office blue: the only blue stick figure in the game, so you know he's not one of them
      drawStick(d, 'enemy');
      const f = d.facing, hx = d.x + 2 * f, hy = d.y - 67, blue = DOUG_BLUE;
      // a big red tie
      ctx.fillStyle = '#d63b3b'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(d.x + f * 1, d.y - 55); ctx.lineTo(d.x + f * 6, d.y - 50); ctx.lineTo(d.x + f * 5, d.y - 34); ctx.lineTo(d.x + f * 1, d.y - 30); ctx.lineTo(d.x - f * 1, d.y - 34); ctx.lineTo(d.x - f * 3, d.y - 50); ctx.closePath(); ctx.fill(); ctx.stroke();
      // lanyard and ID badge
      ctx.strokeStyle = '#2fb866'; ctx.lineWidth = 1.5; line(d.x - f * 3, d.y - 54, d.x - f * 6, d.y - 42); line(d.x + f * 5, d.y - 54, d.x - f * 6, d.y - 42);
      ctx.fillStyle = PAPER; ctx.fillRect(d.x - f * 6 - 4, d.y - 42, 8, 10); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(d.x - f * 6 - 4, d.y - 42, 8, 10);
      // glasses
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx + f * 3, hy - 1, 2.6, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(hx + f * 8, hy - 1, 2.6, 0, Math.PI * 2); ctx.stroke();
      // the phone at his ear
      ctx.strokeStyle = blue; ctx.lineWidth = 3.5; line(d.x, d.y - 50, hx - f * 7, hy + 4);
      ctx.fillStyle = '#1d1b22'; ctx.fillRect(hx - f * 9 - 2, hy - 6, 4, 13);
      // and a coffee mug in the other hand
      const mx = d.x + f * 15, my = d.y - 40;
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(mx - 4, my - 7, 8, 9); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(mx - 4, my - 7, 8, 9);
      ctx.beginPath(); ctx.arc(mx + f * 5, my - 3, 2.5, -1.4, 1.4); ctx.stroke();
      ctx.strokeStyle = MUTED; ctx.lineWidth = 1; line(mx - 1, my - 10 - Math.sin(clock * 4) * 2, mx + 1, my - 15);
      if (d.say) { ctx.fillStyle = INK; ctx.font = '13px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.fillText(d.say, clamp(d.x, 90, W - 90), d.y - 92); }
    };
    return d;
  }

  function update(dt) {
    sfx.holdMusic();
    const c = wr.clerk;
    c.sayT = Math.max(0, c.sayT - dt); if (c.sayT <= 0) c.say = null;
    c.arm = Math.max(0, c.arm - dt * 3);
    if (wr.printer.st === 'broken') { wr.printer.t -= dt; if (wr.printer.t <= -20) wr.printer.st = 'idle'; }
    if (c.st === 'away') { c.back -= dt; if (c.back <= 0) c.st = 'desk'; }
    // the Clerk idly stamping things between finales
    if (c.st === 'desk') {
      c.stampT -= dt;
      if (c.stampT <= 0) { c.stampT = rand(2.5, 5); c.arm = 1; if (Math.random() < 0.35) { c.say = ['Next.', 'Denied.', 'Wrong form.', 'Take a number.', 'Did you fill out the blue one?'][Math.floor(Math.random() * 5)]; c.sayT = 1.8; } }
    }
    // calling numbers (not during a boss: everyone just keeps waiting)
    if (state === 'play' && !boss && !cine) {
      wr.callT -= dt;
      if (wr.callT <= 0) { callNext(); wr.callT = Math.max(0.8, 3.2 - kills * 0.025) * rand(0.8, 1.2); }
    }
  }

  ARENAS['waiting-room'] = {
    id: 'waiting-room', number: 7, name: 'The Waiting Room',
    plats: [
      {x: SEATS[0] - 18, y: SEAT_Y, w: SEATS[3] - SEATS[0] + 36},   // a row of chairs
      {x: SEATS[4] - 18, y: SEAT_Y, w: SEATS[7] - SEATS[4] + 36},   // the other row
      {x: 280, y: 210, w: 150},                                     // the poster shelf
      {x: 600, y: 290, w: 56},                                      // the filing cabinet
      {x: COUNTER.x, y: COUNTER.y, w: COUNTER.w},                   // the counter
    ],
    bossLoop: ['giant', 'printer', 'giant', 'clerk'],
    wr, PRINTER, CLERK_X, COUNTER, drawClerk, drawPrinterBox,
    spawnPoint() { return {x: DOOR_X, y: G, air: false}; },
    holdEnemy,
    // every kill calls the next number
    onKill(e) { if (state === 'play' && !boss) wr.callT = Math.min(wr.callT, 0.3); },
    callNext,
    drawStage: drawOffice,
    setup() {
      Object.assign(wr, {nowServing: 0, lastTicket: 0, callT: 3.5, clock: 0, printer: {st: 'idle'}});
      Object.assign(wr.clerk, {st: 'desk', say: null, sayT: 0, stampT: 2, arm: 0, back: 0});
      wr.doug = makeDoug();
      props.push({update}, wr.doug, {draw: drawTickets, front: true});
    },
  };
})();
