// Tests for the leaderboard Worker (src/worker.js) with an in-memory KV. Run: node tests/worker.mjs
import worker, {plausible} from '../src/worker.js';

const store = new Map();
const env = {
  SCORES: {
    async get(k, type) { const v = store.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { store.set(k, v); },
  },
  ASSETS: {fetch: async () => new Response('asset')},
};
const call = (path, body) => worker.fetch(new Request('https://rainbowed.ca' + path, body ? {method: 'POST', body: JSON.stringify(body)} : undefined), env)
  .then(async r => ({status: r.status, body: r.headers.get('content-type') === 'application/json' ? await r.json() : await r.text()}));
const run = (initials, score, extra = {}) => call('/api/scores', {arena: 'page-one', initials, score, kills: 60, time: 120, ...extra});

let failed = 0, total = 0;
async function test(name, fn) {
  total++;
  try { await fn(); console.log('PASS  ' + name); } catch (e) { failed++; console.log('FAIL  ' + name + ': ' + e.message); }
}
const ok = (c, m) => { if (!c) throw new Error(m); };

await test('other paths go to the static files', async () => {
  ok((await call('/')).body === 'asset', 'root');
  ok((await call('/js/main.js')).body === 'asset', 'script');
});
await test('an empty board, and bad arenas are refused', async () => {
  const r = await call('/api/scores?arena=page-one');
  ok(r.status === 200 && r.body.top.length === 0, JSON.stringify(r));
  ok((await call('/api/scores?arena=nope')).status === 400, 'bad arena');
});
await test('scores go in sorted, only the top 10 stay', async () => {
  for (let i = 1; i <= 12; i++) await run('ABC', i * 1000);
  const top = (await call('/api/scores?arena=page-one')).body.top;
  ok(top.length === 10 && top[0].s === 12000 && top[9].s === 3000, top.map(e => e.s).join());
  const low = await run('LOW', 2000);
  ok(low.body.id === null, 'a score below the board should not get an id');
  const hi = await run('TOP', 50000);
  ok(hi.body.top[0].n === 'TOP' && hi.body.top[0].id === hi.body.id, 'new top score');
});
await test('initials: three letters, lowercase is fixed, rude ones refused', async () => {
  ok((await run('xyz', 60000)).body.top[0].n === 'XYZ', 'uppercased');
  ok((await run('AB', 60000)).status === 400, 'two letters');
  ok((await run('A1C', 60000)).status === 400, 'digit');
  ok((await run('ASS', 60000)).body.error === 'blocked', 'blocked');
});
await test('made-up scores are refused', async () => {
  ok(!plausible({score: 999999, kills: 3, time: 20}), 'huge score, few kills');
  ok(!plausible({score: 5000, kills: 900, time: 30}), 'too many kills too fast');
  ok(!plausible({score: 1.5, kills: 1, time: 10}), 'not an integer');
  ok(plausible({score: 192880, kills: 180, time: 600}), 'a real big run');
  ok(plausible({score: 140000, kills: 101, time: 400}), 'a Slow One run');
  ok((await run('BAD', 999999, {kills: 2, time: 10})).status === 400, 'endpoint refuses it');
});

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
