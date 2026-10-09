/* The rainbowed.ca Worker. Everything is static files from public/, except /api/scores:
   an arcade-style top 10 per arena with three-letter initials, kept in one KV key per arena.

   GET  /api/scores?arena=page-one   -> {top: [{n, s, k, t, id}, ...]}
   POST /api/scores  {arena, initials, score, kills, time}   -> {top, id}

   No accounts and no personal data: just initials, score, kills and seconds survived.
   The checks below only stop lazy fakes (a made-up score from a script); a determined
   cheater could still get through, and a bad entry can be removed in the Cloudflare
   dashboard (Storage & Databases > KV > the SCORES namespace > edit the top:<arena> key). */

const ARENAS = ['page-one', 'grandmas-house', 'long-hallway'];
const SIZE = 10;
// three-letter words that shouldn't go on the board
const BLOCKED = new Set(('ASS FUK FUC FCK FUQ FKU CUM SEX TIT TTS DIK DIC DIX COK COC KOK CNT KNT JIZ JZZ ' +
  'FAG FGT NIG NGR NGA KKK KYS SUK SUC PUS PIS POO WTF STD VAG HOE HOR XXX RAP RPE NAZ SHT').split(' '));

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: {'content-type': 'application/json', 'cache-control': 'no-store'},
});
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function plausible({score, kills, time}) {
  if (!int(score, 1, 9999999) || !int(kills, 0, 100000) || !int(time, 1, 360000)) return false;
  if (kills > time * 6 + 10) return false;                       // nobody kills that fast
  if (score > kills * 800 + time * 400 + 250000) return false;    // more points than the kills allow
  return true;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/api/scores') return env.ASSETS.fetch(req);

    if (req.method === 'GET') {
      const arena = url.searchParams.get('arena');
      if (!ARENAS.includes(arena)) return json({error: 'arena'}, 400);
      return json({top: (await env.SCORES.get('top:' + arena, 'json')) || []});
    }

    if (req.method === 'POST') {
      let b;
      try { b = await req.json(); } catch (e) { return json({error: 'body'}, 400); }
      if (!b || !ARENAS.includes(b.arena)) return json({error: 'arena'}, 400);
      const n = String(b.initials || '').toUpperCase();
      if (!/^[A-Z]{3}$/.test(n)) return json({error: 'initials'}, 400);
      if (BLOCKED.has(n)) return json({error: 'blocked'}, 400);
      if (!plausible(b)) return json({error: 'score'}, 400);

      const key = 'top:' + b.arena;
      const top = (await env.SCORES.get(key, 'json')) || [];
      // only write when it actually makes the board (keeps KV writes low)
      if (top.length >= SIZE && b.score <= top[top.length - 1].s) return json({top, id: null});
      const id = crypto.randomUUID().slice(0, 8);
      top.push({n, s: b.score, k: b.kills, t: b.time, id});
      top.sort((x, y) => y.s - x.s);
      top.length = Math.min(top.length, SIZE);
      await env.SCORES.put(key, JSON.stringify(top));
      return json({top, id: top.some(e => e.id === id) ? id : null});
    }

    return json({error: 'method'}, 405);
  },
};
