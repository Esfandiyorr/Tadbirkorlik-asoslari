const CACHE = 'studyquest-shell-v4';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/offline.html', '/terdu-logo.png'])));
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

/* 🔔 Bildirishnoma (Web Push, lib/server/push.ts): {t: sarlavha, b: matn, u: ochiladigan manzil, g: belgi,
   i: rasm (ixtiyoriy, saytning o'z rasmi — Android va kompyuterda katta bo'lib chiqadi)}.
   Ilova o'rnatilgan bo'lsa ham, sayt brauzerda ochilgan bo'lsa ham shu yerga keladi. */
self.addEventListener('push', (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { b: e.data ? e.data.text() : '' };
  }
  const url = new URL(d.u || '/', self.location.origin);
  const img =
    typeof d.i === 'string' && d.i.startsWith('/api/site/img/')
      ? new URL(d.i, self.location.origin).href
      : undefined;
  e.waitUntil(
    self.registration.showNotification(d.t || 'TerDU · Tadbirkorlik asoslari', {
      body: d.b || '',
      tag: d.g || 'sq',
      renotify: true,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...(img ? { image: img } : {}),
      data: { u: url.origin === self.location.origin ? url.href : self.location.origin + '/' },
    }),
  );
});
/* bosilganda: sayt ochiq bo'lsa o'sha oyna kerakli bo'limga o'tadi, bo'lmasa yangi oyna ochiladi */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.u) || self.location.origin + '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs)
        if (new URL(c.url).origin === self.location.origin && 'focus' in c)
          return c.focus().then((w) => (w && 'navigate' in w ? w.navigate(url).catch(() => w) : w));
      return self.clients.openWindow ? self.clients.openWindow(url) : null;
    }),
  );
});
