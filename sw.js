/* TerDU ilovasi (PWA) — service worker.
   Strategiya: avval internet (sayt har doim eng yangi holatda), internet bo'lmasa — oxirgi saqlangan nusxa.
   Faqat shu saytning fayllari ushlanadi: Firebase, Google va boshqa saytlarga so'rovlar o'zgarishsiz o'tadi.
   Audio/video, PDF/Word va bo'laklab (Range) yuklanadigan so'rovlar keshlanmaydi. */
var CACHE = "terdu-v1";
var SKIP = /\.(mp3|mp4|webm|m4a|pdf|docx|zip)$/i;

self.addEventListener("install", function () { self.skipWaiting(); });

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function offlinePage() {
  return new Response(
    '<!doctype html><html lang="uz"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Internet yo\'q</title><body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 20px;color:#1f2937">' +
    '<div style="font-size:52px">📡</div><h2>Internet yo\'q</h2><p>Bu sahifa hali telefoningizga saqlanmagan. Internetga ulaning va qayta urining.</p>' +
    '<button onclick="location.reload()" style="font-size:16px;padding:10px 18px;border-radius:12px;border:1px solid #cbd5e1;background:#fff">🔄 Qayta urinish</button></body></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u;
  try { u = new URL(r.url); } catch (x) { return; }
  if (u.origin !== self.location.origin || r.headers.has("range") || SKIP.test(u.pathname)) return;
  var nav = r.mode === "navigate";
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && res.type === "basic") {
      var copy = res.clone();
      caches.open(CACHE).then(function (ch) { return ch.put(r, copy); }).catch(function () {});
    }
    return res;
  }, function () {
    return caches.match(r, { ignoreSearch: nav }).then(function (m) {
      if (m) return m;
      if (!nav) return Response.error();
      /* bosh sahifa ("./" yoki index.html) — ikkalasidan qaysi biri saqlangan bo'lsa; boshqa sahifa saqlanmagan bo'lsa — "Internet yo'q" */
      var root = new URL("./", self.registration.scope).pathname;
      if (u.pathname !== root && u.pathname !== root + "index.html") return offlinePage();
      return caches.match("./", { ignoreSearch: true })
        .then(function (h) { return h || caches.match("index.html", { ignoreSearch: true }); })
        .then(function (h) { return h || offlinePage(); });
    });
  }));
});

/* 🔔 o'qituvchi e'lon yuborganda keladigan bildirishnoma (Web Push). Ma'lumot: {t: sarlavha, b: matn, u: ochiladigan sahifa, g: belgi} */
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : "" }; }
  var url = new URL(d.u || "./", self.registration.scope).href;
  e.waitUntil(self.registration.showNotification(d.t || "TerDU", {
    body: d.b || "", tag: d.g || "terdu", renotify: true,
    icon: new URL("fayllar/ilova/icon-192.png", self.registration.scope).href,
    badge: new URL("fayllar/ilova/icon-192.png", self.registration.scope).href,
    data: { u: url }
  }));
});

/* bildirishnoma bosilganda: sayt ochiq bo'lsa o'sha oyna oldinga chiqadi, bo'lmasa e'lon sahifasi ochiladi */
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.u) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) return c.focus();   /* ochiq sahifani buzmaymiz — faqat oldinga chiqaramiz */
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
