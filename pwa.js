/* TerDU ilovasi (PWA): service worker'ni ulash va telefonga o'rnatish.
   Android/kompyuter (Chrome, Edge): brauzerning o'rnatish oynasi (beforeinstallprompt) ushlab qolinadi —
   uni taqdimot tepasidagi «📲 Ilovani yuklash» tugmasi va bir martalik tavsiya xabari ochadi (window.TerduPWA).
   O'rnatish oynasi bo'lmasa (iPhone/iPad, boshqa brauzerlar, ilova allaqachon o'rnatilgan) — qadamma-qadam yo'riqnoma.
   Telefonda pastki taklif paneli ham chiqadi; «✕» bosilgandan keyin 7 kun chiqmaydi. Ilova ichida ochilganda hech biri ko'rinmaydi. */
(function () {
  "use strict";
  if (!/^https?:$/.test(location.protocol)) return;              /* faylni kompyuterdan ochganda (file://) ishlamaydi */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;

  /* 🔄 yangi versiya: ilova fondan qaytganda (yoki sahifa uzoq ochiq turganda) serverdagi nusxa tekshiriladi.
     Sayt yangilangan bo'lsa — taqdimot o'zi qayta yuklanadi; test ketayotgan, biror narsa yozilayotgan, oyna ochiq
     yoki arena sahifasi bo'lsa — faqat «🔄 Yangilash» tugmasi chiqadi (hech narsa yo'qolmasin). */
  var verTag = null, verAt = 0, hidAt = 0;
  function verGet(cb) {
    fetch(location.pathname, { method: "HEAD", cache: "no-store" }).then(function (r) {
      cb(r.ok ? (r.headers.get("etag") || r.headers.get("last-modified") || "") : null);
    }, function () { cb(null); });
  }
  function busy() {
    var a = document.activeElement, t = a && a.tagName;
    return !document.getElementById("deck") || document.body.classList.contains("qt-live") ||
      t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || (a && a.isContentEditable) ||
      !!document.querySelector(".rt-gate,.rt-ov.show,.kh-gate-full,#pwaHelp");
  }
  function verBar() {
    if (document.getElementById("pwaUpd")) return;
    css();
    var b = document.createElement("div"); b.id = "pwaUpd"; b.setAttribute("role", "status");
    b.innerHTML = '<span>🔄 ' + L("Sayt yangilandi", "The site was updated") + '</span>' +
      '<button type="button" id="pwaUpdGo">' + L("Yangilash", "Reload") + '</button><button type="button" id="pwaUpdX" aria-label="' + L("Yopish", "Close") + '">✕</button>';
    document.body.appendChild(b);
    document.getElementById("pwaUpdGo").onclick = function () { location.reload(); };
    document.getElementById("pwaUpdX").onclick = function () { b.remove(); };
  }
  function verCheck(resumed) {
    if (verTag === null || Date.now() - verAt < 60000) return;
    verAt = Date.now();
    verGet(function (t) {
      if (!t || t === verTag) return;
      if (resumed && !busy()) location.reload(); else verBar();
    });
  }
  window.addEventListener("load", function () { verGet(function (t) { verTag = t; }); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { hidAt = Date.now(); return; }
    verCheck(Date.now() - hidAt >= 30000);                         /* 30 soniyadan ko'p fonda turgan — «qayta ochildi» */
  });
  setInterval(function () { if (!document.hidden) verCheck(false); }, 15 * 60000);

  var KEY = "terdu_pwa_hide", DAY = 86400000;
  var ua = navigator.userAgent || "";
  var ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var android = /android/i.test(ua);
  var samsung = /SamsungBrowser/i.test(ua), firefox = /Firefox|FxiOS/i.test(ua), edge = /Edg\//i.test(ua);
  var deferred = null, shown = false;

  function hidden() { try { return Date.now() < (+localStorage.getItem(KEY) || 0); } catch (e) { return false; } }
  function hideFor(days) { try { localStorage.setItem(KEY, String(Date.now() + days * DAY)); } catch (e) {} }
  function uz() { try { return localStorage.getItem("terdu_lang") !== "en"; } catch (e) { return true; } }
  function L(a, b) { return uz() ? a : b; }
  function close(days) { hideFor(days); var b = document.getElementById("pwaBar"); if (b) b.remove(); }
  function fire() { try { window.dispatchEvent(new Event("terdu-pwa")); } catch (e) {} }

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
      "#pwaX{background:none;color:inherit;opacity:.6;padding:6px 8px;font-size:16px}" +
      /* yo'riqnoma oynasi */
      "#pwaUpd{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483001;display:flex;align-items:center;gap:8px;" +
      "padding:7px 8px 7px 14px;border-radius:999px;background:#0a3605;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25);" +
      "font:600 13.5px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
      "#pwaUpd button{border:none;border-radius:999px;cursor:pointer;font:inherit;font-weight:800}" +
      "#pwaUpdGo{background:#fff;color:#0a3605;padding:6px 12px}#pwaUpdX{background:none;color:#fff;opacity:.75;padding:4px 6px}" +
      "#pwaHelp{position:fixed;inset:0;z-index:130;display:grid;place-items:center;padding:16px;overflow:auto;background:rgba(10,20,30,.55);" +
      "font:14.5px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
      "#pwaHelp .bx{width:100%;max-width:480px;background:var(--panel,#fff);color:var(--ink,#111827);border:1px solid var(--line,#e5e7eb);" +
      "border-radius:20px;padding:20px 20px 16px;box-shadow:0 20px 50px rgba(0,0,0,.3)}" +
      "#pwaHelp .hd{display:flex;align-items:center;gap:12px;margin-bottom:10px}#pwaHelp .hd img{width:48px;height:48px;border-radius:12px;background:#fff}" +
      "#pwaHelp h3{margin:0;font-size:18px}#pwaHelp .sub{margin:2px 0 0;font-size:13px;opacity:.75}" +
      "#pwaHelp ol{margin:10px 0;padding-left:22px}#pwaHelp li{margin:6px 0}" +
      "#pwaHelp .nt{margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(10,54,5,.07);font-size:13px}" +
      "#pwaHelp details{margin:8px 0;font-size:13.5px}#pwaHelp summary{cursor:pointer;font-weight:700}" +
      "#pwaHelp details p{margin:6px 0}" +
      "#pwaHelp .bt{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}" +
      "#pwaHelp button{border:1px solid var(--line,#e5e7eb);border-radius:10px;cursor:pointer;font:inherit;font-weight:700;padding:9px 14px;" +
      "background:var(--panel,#fff);color:inherit}#pwaHelp button.ok{background:#0a3605;border-color:#0a3605;color:#fff}";
    document.head.appendChild(s);
  }

  /* o'rnatish oynasi bo'lmaganda: shu qurilma va brauzer uchun qadamlar */
  function steps() {
    var S = {
      ios: [L("Pastdagi (iPad'da — tepadagi) <b>⬆️ Ulashish</b> tugmasini bosing.", "Tap the <b>⬆️ Share</b> button at the bottom (top on iPad)."),
            L("Ro'yxatni pastga suring va <b>«Bosh ekranga qo'shish»</b> (Add to Home Screen) ni tanlang.", "Scroll down and choose <b>«Add to Home Screen»</b>."),
            L("O'ng tepadagi <b>«Qo'shish»</b> (Add) ni bosing — bosh ekranda «TerDU Biznes» belgisi paydo bo'ladi.", "Tap <b>«Add»</b> — the «TerDU Biznes» icon appears on your home screen.")],
      samsung: [L("Pastdagi <b>≡</b> (menyu) tugmasini bosing.", "Tap the <b>≡</b> menu at the bottom."),
            L("<b>«Sahifani qo'shish»</b> → <b>«Bosh ekran»</b> ni tanlang.", "Choose <b>«Add page to»</b> → <b>«Home screen»</b>."),
            L("<b>«Qo'shish»</b> ni bosing.", "Tap <b>«Add»</b>.")],
      firefox: [L("O'ng tepadagi <b>⋮</b> (menyu) tugmasini bosing.", "Tap the <b>⋮</b> menu."),
            L("<b>«O'rnatish»</b> yoki <b>«Bosh ekranga qo'shish»</b> ni tanlang.", "Choose <b>«Install»</b> or <b>«Add to Home screen»</b>.")],
      android: [L("Chrome'ning o'ng tepasidagi <b>⋮</b> (menyu) tugmasini bosing.", "Tap Chrome's <b>⋮</b> menu (top right)."),
            L("<b>«Ilovani o'rnatish»</b> yoki <b>«Bosh ekranga qo'shish»</b> ni tanlang.", "Choose <b>«Install app»</b> or <b>«Add to Home screen»</b>."),
            L("<b>«O'rnatish»</b> ni bosing — ilova bosh ekranda paydo bo'ladi.", "Tap <b>«Install»</b> — the app appears on your home screen.")],
      pc: [L("Manzil satrining o'ng chetidagi <b>⊕ / 🖥 (o'rnatish)</b> belgisini bosing.", "Click the <b>⊕ / 🖥 (install)</b> icon at the right end of the address bar."),
            L("Belgi bo'lmasa: brauzer menyusi <b>⋮</b> → <b>«…ilova sifatida o'rnatish»</b> (Install) ni tanlang" + (edge ? " (Edge: <b>Ilovalar → Ushbu saytni ilova sifatida o'rnatish</b>)." : "."),
              "No icon? Open the browser menu <b>⋮</b> → <b>«Install … as app»</b>" + (edge ? " (Edge: <b>Apps → Install this site as an app</b>)." : ".")),
            L("<b>«O'rnatish»</b> ni bosing.", "Click <b>«Install»</b>.")]
    };
    var cur = ios ? "ios" : samsung ? "samsung" : firefox ? "firefox" : android ? "android" : "pc";
    var name = { ios: "iPhone / iPad (Safari)", samsung: "Samsung Internet", firefox: "Firefox", android: "Android (Chrome)", pc: L("Kompyuter (Chrome, Edge)", "Computer (Chrome, Edge)") };
    var ol = function (k) { return "<ol>" + S[k].map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>"; };
    var other = ["android", "ios", "samsung", "pc"].filter(function (k) { return k !== cur; });
    return { cur: cur, html: "<p style='margin:8px 0 0;font-weight:700'>" + name[cur] + ":</p>" + ol(cur) +
      "<details><summary>" + L("Boshqa telefon yoki brauzer", "Another phone or browser") + "</summary>" +
      other.map(function (k) { return "<p><b>" + name[k] + "</b></p>" + ol(k); }).join("") + "</details>" };
  }
  function help() {
    if (document.getElementById("pwaHelp")) return;
    css();
    var st = steps(), d = document.createElement("div"); d.id = "pwaHelp"; d.setAttribute("role", "dialog");
    d.innerHTML = '<div class="bx"><div class="hd"><img src="fayllar/ilova/icon-192.png" alt=""><div><h3>📲 ' + L("Ilovani o'rnatish", "Install the app") + '</h3>' +
      '<p class="sub">' + L("Bir daqiqa ham olmaydi", "Takes less than a minute") + '</p></div></div>' + st.html +
      '<div class="nt">💬 ' + L("Sayt <b>Telegram</b> yoki <b>Instagram</b> ichida ochilgan bo'lsa, avval «Brauzerda ochish» ni tanlang (" + (ios ? "Safari" : "Chrome") + ") — ilovani faqat brauzerdan o'rnatish mumkin.",
        "If the site is open inside <b>Telegram</b> or <b>Instagram</b>, first choose «Open in browser» (" + (ios ? "Safari" : "Chrome") + ") — the app can only be installed from a browser.") + '</div>' +
      (st.cur === "ios" ? '<div class="nt">🔑 ' + L("iPhone'da ilovani birinchi ochganda ism, familiya va PIN bilan <b>«🔑 Kirish»</b> qiling — ballaringiz bazadan tiklanadi.",
        "On iPhone, the first time you open the app, sign in with your name, surname and PIN (<b>«🔑 Sign in»</b>) — your points are restored.") + '</div>' : '') +
      '<div class="nt">✅ ' + L("Ilova allaqachon o'rnatilgan bo'lsa — uni bosh ekrandagi <b>«TerDU Biznes»</b> belgisidan oching.", "Already installed? Open it from the <b>«TerDU Biznes»</b> icon on your home screen.") + '</div>' +
      '<div class="bt"><button type="button" class="ok" id="pwaHelpOk">' + L("Tushunarli", "Got it") + '</button>' +
      '<button type="button" id="pwaCopy">🔗 ' + L("Havolani nusxalash", "Copy the link") + '</button></div></div>';
    document.body.appendChild(d);
    d.addEventListener("click", function (e) { if (e.target === d) d.remove(); });
    document.getElementById("pwaHelpOk").onclick = function () { d.remove(); };
    document.getElementById("pwaCopy").onclick = function () {
      var u = location.href.split("#")[0], b = this;
      var ok = function () { b.textContent = "✅ " + L("Nusxalandi", "Copied"); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, function () { prompt(L("Havola:", "Link:"), u); });
      else prompt(L("Havola:", "Link:"), u);
    };
  }

  /* taqdimot (engine) uchun: tugma va bir martalik tavsiya xabari shu orqali o'rnatadi */
  window.TerduPWA = {
    standalone: standalone, ios: ios, android: android,
    ready: function () { return !!deferred; },
    help: help,
    install: function (cb) {
      cb = cb || function () {};
      if (!deferred) { help(); cb("help"); return; }
      var d = deferred; deferred = null;
      d.prompt();
      d.userChoice.then(function (r) {
        var ok = r && r.outcome === "accepted";
        close(ok ? 3650 : 7); cb(ok ? "accepted" : "dismissed"); fire();
      }, function () { cb("dismissed"); });
    }
  };
  fire();
  if (standalone) return;

  function banner(kind) {
    if (shown || hidden() || !document.body) return;
    if (document.body.classList.contains("qt-live") || document.getElementById("rtPwaMsg") || document.getElementById("pwaHelp")) {
      setTimeout(function () { banner(kind); }, 60000); return;                                   /* test yoki tavsiya oynasi ochiq — chalg'itmaymiz */
    }
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
    if (go) go.onclick = function () { if (deferred) window.TerduPWA.install(); else { close(7); help(); } };
  }

  /* Chrome/Edge: brauzer o'rnatishga tayyor bo'lganda oynani ushlab qolamiz — tugma va xabar ochadi */
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e; fire();
    if (android && !hidden()) setTimeout(function () { banner("android"); }, 6000);              /* telefonda pastki taklif ham */
  });
  window.addEventListener("appinstalled", function () { deferred = null; close(3650); fire(); });

  /* iPhone/iPad: o'rnatish faqat «Ulashish» menyusi orqali — yo'riqnoma ko'rsatamiz */
  if (ios && !hidden()) setTimeout(function () { banner("ios"); }, 6000);
})();
