/* CampoGestor — service worker (Onda A: offline básico) */
const CACHE_NAME = 'campogestor-cache-v4';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/core/data.js',
  './js/core/config.js',
  './js/core/ordens-cata.js',
  './js/services/cloud.js',
  './js/gestos.js',
  './js/app.js',
  './js/telas/hoje.js',
  './js/telas/frota.js',
  './js/telas/estoque.js',
  './js/telas/pessoas.js',
  './js/telas/safra.js',
  './js/telas/talhoes.js',
  './js/telas/aplicacao.js',
  './js/telas/sementes.js',
  './js/telas/chuva.js',
  './js/telas/folgas.js',
  './js/telas/equatorial.js',
  './js/telas/extintores.js',
  './js/telas/mais.js',
  './assets/splash-fazenda.jpg',
  './public/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE).catch(() =>
        Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => null)))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // APIs externas: só rede (não cachear Supabase/clima como app shell)
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(req).catch(() => new Response('{"offline":true}', {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }

  // Navegação / HTML: rede primeiro, fallback cache (abre offline)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match('./index.html').then((r) => r || caches.match(req))
        )
    );
    return;
  }

  // Assets locais: cache primeiro, depois rede
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
