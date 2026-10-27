// automatisch erzeugt (scripts/gen-sw.mjs)
const CACHE = 'fluglog-dfdcb2a3eb70';
const DATEIEN = [
  "./",
  "./assets/index-BOvQ1nB1.js",
  "./assets/index-hpm16qrV.css",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (treffer) =>
        treffer ||
        fetch(req).catch(() =>
          req.mode === 'navigate' ? caches.match('./index.html') : Response.error()
        )
    )
  );
});
