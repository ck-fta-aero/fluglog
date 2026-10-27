// Schreibt dist/sw.js mit der Liste aller gebauten Dateien (Precache für Offline-Betrieb).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = 'dist';
const dateien = [];
(function lauf(dir) {
  for (const name of readdirSync(dir)) {
    const pfad = join(dir, name);
    if (statSync(pfad).isDirectory()) lauf(pfad);
    else dateien.push(pfad);
  }
})(dist);

const urls = dateien
  .map((p) => relative(dist, p).split(sep).join('/'))
  .filter((p) => p !== 'sw.js' && p !== '.nojekyll')
  .sort();
const hash = createHash('sha256');
for (const u of urls) hash.update(u).update(readFileSync(join(dist, u)));
const version = hash.digest('hex').slice(0, 12);
const liste = ['./', ...urls.map((u) => './' + u)];

const sw = `// automatisch erzeugt (scripts/gen-sw.mjs)
const CACHE = 'fluglog-${version}';
const DATEIEN = ${JSON.stringify(liste, null, 2)};

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
`;
writeFileSync(join(dist, 'sw.js'), sw);
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`sw.js geschrieben: ${liste.length} Dateien, Version ${version}`);
