/* The service worker: keeps a copy of the whole game on the device so it plays offline.
   - On install it reads index.html and caches every script and stylesheet it loads, plus the
     manifest, the icons and the fonts, so there's no list here to keep up to date.
   - Online, everything still comes from the network first (so new versions show up right
     away) and the copy is refreshed as it goes. With no signal, or a signal so weak the
     network takes more than a few seconds, it falls back to the saved copy.
   - The leaderboard works the same way: the last boards seen are kept for offline. Scores set
     offline are saved by the game (board.js) and sent when there's signal again. */

const CACHE = 'rainbowed';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Permanent+Marker&family=IBM+Plex+Mono:wght@400;600&display=swap';
const NETWORK_WAIT = 3500;

async function precache() {
  const cache = await caches.open(CACHE);
  const page = await fetch('/', {cache: 'no-cache'});
  const html = await page.clone().text();
  await cache.put('/', page);
  const local = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^https?:|^#|^mailto:/.test(u));
  const files = [...new Set(local.concat(['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/favicon.svg']))];
  await Promise.all(files.map(f => cache.add(new URL(f, location.origin).href).catch(() => {})));
  // the fonts: the stylesheet, then the font files it points at
  try {
    const css = await fetch(FONT_CSS);
    const text = await css.clone().text();
    await cache.put(FONT_CSS, css);
    await Promise.all([...text.matchAll(/url\(([^)]+)\)/g)].map(m => cache.add(m[1]).catch(() => {})));
  } catch (e) {}
}

self.addEventListener('install', e => { e.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

// network first, but don't wait forever for a bad signal; keep the copy fresh
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const net = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
    return res;
  });
  const fallback = () => cache.match(req, {ignoreSearch: req.mode === 'navigate'}).then(hit => hit || (req.mode === 'navigate' ? cache.match('/') : null));
  try {
    const res = await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), NETWORK_WAIT))]);
    return res;
  } catch (e) {
    const hit = await fallback();
    if (hit) return hit;
    return net;   // nothing saved: keep waiting for the network after all
  }
}

// font files never change: saved copy first
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // posting a score: straight to the network
  const url = new URL(req.url);
  if (url.hostname === 'fonts.gstatic.com') { e.respondWith(cacheFirst(req)); return; }
  if (url.origin === location.origin || url.hostname === 'fonts.googleapis.com') e.respondWith(networkFirst(req));
});
