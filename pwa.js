/* TerDU ilovasi (PWA): service worker'ni ulash va telefonga o'rnatish taklifi.
   Android (Chrome): «📲 O'rnatish» tugmasi — tizimning o'rnatish oynasini ochadi.
   iPhone/iPad (Safari): «Ulashish → Bosh ekranga qo'shish» yo'riqnomasi.
   Ilova ichida ochilganda yoki «✕» bosilgandan keyin 7 kun davomida taklif chiqmaydi. */
(function () {
  "use strict";
  if (!/^https?:$/.test(location.protocol)) return;              /* faylni kompyuterdan ochganda (file://) ishlamaydi */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  if (standalone) return;

  var KEY = "terdu_pwa_hide", DAY = 86400000;
  var ua = navigator.userAgent || "";
  var ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var android = /android/i.test(ua);
  var deferred = null, shown = false;

  function hidden() { try { return Date.now() < (+localStorage.getItem(KEY) || 0); } catch (e) { return false; } }
  function hideFor(days) { try { localStorage.setItem(KEY, String(Date.now() + days * DAY)); } catch (e) {} }
  function uz() { try { return localStorage.getItem("terdu_lang") !== "en"; } catch (e) { return true; } }
  function L(a, b) { return uz() ? a : b; }
  function close(days) { hideFor(days); var b = document.getElementById("pwaBar"); if (b) b.remove(); }

  function css() {
    if (document.getElementById("pwaCss")) return;
    var s = document.createElement("style"); s.id = "pwaCss";
    s.textContent =
      "#pwaBar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:110;width:calc(100% - 24px);max-width:440px;" +
      "display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:16px;background:var(--panel,#fff);color:var(--ink,#111827);" +
      "border:1px solid var(--line,#e5e7eb);box-shadow:0 10px 30px rgba(0,0,0,.18);font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
      "#pwaBar img{width:42px;height:42px;border-radius:10px;flex:none;background:#fff}" +
      "#pwaBar .t{flex:1;min-width:0}#pwaBar b{display:block;font-size:14.5px}#pwaBar span{display:block;font-size:12.5px;opacity:.8}" +
      "#pwaBar button{border:none;border-radius:10px;cursor:pointer;font:inherit;font-weight:700}" +
      "#pwaGo{background:#0a3605;color:#fff;padding:8px 12px;white-space:nowrap}" +
      "#pwaX{background:none;color:inherit;opacity:.6;padding:6px 8px;font-size:16px}";
    document.head.appendChild(s);
  }

  function banner(kind) {
    if (shown || hidden() || !document.body) return;
    if (document.body.classList.contains("qt-live")) { setTimeout(function () { banner(kind); }, 60000); return; }   /* test paytida chalg'itmaymiz */
    shown = true; css();
    var b = document.createElement("div"); b.id = "pwaBar"; b.setAttribute("role", "dialog");
    var txt = kind === "ios"
      ? L("Safari'da <b style='display:inline'>⬆️ Ulashish</b> tugmasini bosing va «Bosh ekranga qo'shish» (Add to Home Screen) ni tanlang.",
          "In Safari tap <b style='display:inline'>⬆️ Share</b> and choose «Add to Home Screen».")
      : L("Saytni telefoningizga ilova qilib o'rnating — bir bosishda ochiladi.", "Install the site as an app on your phone — opens in one tap.");
    b.innerHTML = '<img src="fayllar/ilova/icon-192.png" alt="">' +
      '<div class="t"><b>📲 ' + L("TerDU ilovasini o'rnating", "Install the TerDU app") + '</b><span>' + txt + '</span></div>' +
      (kind === "android" ? '<button type="button" id="pwaGo">' + L("O'rnatish", "Install") + '</button>' : '') +
      '<button type="button" id="pwaX" aria-label="' + L("Yopish", "Close") + '">✕</button>';
    document.body.appendChild(b);
    document.getElementById("pwaX").onclick = function () { close(7); };
    var go = document.getElementById("pwaGo");
    if (go) go.onclick = function () {
      if (!deferred) { close(7); return; }
      var d = deferred; deferred = null;
      d.prompt();
      d.userChoice.then(function (r) { close(r && r.outcome === "accepted" ? 3650 : 7); }, function () { close(7); });
    };
  }

  /* Android/Chrome: brauzer o'rnatishga tayyor bo'lganda o'z taklifimizni ko'rsatamiz (faqat telefonda) */
  window.addEventListener("beforeinstallprompt", function (e) {
    if (!android) return;                                         /* kompyuterda brauzerning o'z tugmasi qoladi */
    e.preventDefault(); deferred = e;
    if (!hidden()) setTimeout(function () { banner("android"); }, 6000);
  });
  window.addEventListener("appinstalled", function () { close(3650); });

  /* iPhone/iPad: o'rnatish faqat «Ulashish» menyusi orqali — yo'riqnoma ko'rsatamiz */
  if (ios && !hidden()) setTimeout(function () { banner("ios"); }, 6000);
})();
