const CACHE = 'studyquest-shell-v3';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/offline.html', '/icon.svg'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('studyquest-shell-') && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (
    e.request.method !== 'GET' ||
    u.origin !== location.origin ||
    u.pathname.startsWith('/api/') ||
    u.pathname.startsWith('/legacy/')
  )
    return;
  if (e.request.mode === 'navigate')
    e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
});
