// NOVA TRAIN service worker
// Strategy: NETWORK-FIRST. Always try to load the freshest app from the
// network and cache it; only fall back to the cache when offline. This means
// every deploy shows up on the next launch — no manual cache-clearing.
const CACHE = 'novatrain-v2';
const SHELL = ['./', './index.html'];

self.addEventListener('install', function (e) {
  self.skipWaiting(); // take over as soon as the new worker is ready
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { try { c.put(req, copy); } catch (_) {} });
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
      })
  );
});
