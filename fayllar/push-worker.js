/* TerDU — telefonga bildirishnoma yuboruvchi (Cloudflare Worker, bepul tarif yetadi).
   Bu fayl — SHABLON. O'qituvchi paneli (📢 E'lon yuborish → 🔔 Bildirishnomalar) kalitlarni yaratib,
   __...__ joylarini to'ldirgan tayyor kodni beradi — shu kodni Cloudflare'dagi Worker'ga qo'yasiz.

   Ish tartibi:
   1) talaba ilovada «🔔 Yoqish» ni bosadi → brauzer obunasi bazaga yoziladi: students/<id>/push/<k> = {e, p, a, t};
   2) o'qituvchi e'lon yuboradi → panel shu Worker'ga {tok, title, body, url} jo'natadi;
   3) Worker tokenni Google orqali tekshiradi (faqat o'qituvchi Gmail'i o'tadi), obunalarni bazadan o'qiydi va
      har biriga Web Push (VAPID + aes128gcm, RFC 8291/8292) yuboradi; eskirgan obunalar (404/410) o'chiriladi.
   4) ⏰ Shanba eslatmasi (v2): Cloudflare → Worker → Settings → Triggers → Cron Triggers → «0 15 * * 6»
      (shanba 20:00, Toshkent). Shu payt ball muddati ertaga (yakshanba 23:59) tugaydigan va mavzuni hali to'liq
      bajarmagan talabalarga «ertaga 23:59 da ball muddati tugaydi» eslatmasi boradi. O'qituvchi panelidan
      «⏰ Eslatmani hozir yuborish» bilan qo'lda ham yuboriladi.
   Maxfiy kalit (VAPID_PRIV) faqat shu kodda turadi — uni hech kimga bermang. */
const VAPID_PUB = "__VAPID_PUB__";      /* ochiq kalit (65 bayt, base64url) */
const VAPID_PRIV = "__VAPID_PRIV__";    /* maxfiy kalit (d, base64url) */
const DB = "__DB__";                    /* Firebase Realtime Database manzili */
const API_KEY = "__API_KEY__";          /* Firebase web API kaliti (ochiq) */
const TEACHER_H = "__TEACHER_H__";      /* o'qituvchi Gmail'ining SHA-256 izi */
const SITE = "__SITE__";                /* sayt manzili (eslatma bosilganda ochiladigan sahifa uchun) */
const VERSION = 2;
const SUB = "mailto:noreply@terdu.uz";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const te = new TextEncoder();

function b64u(buf) {
  const b = new Uint8Array(buf); let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function ub64(str) {
  str = String(str).replace(/-/g, "+").replace(/_/g, "/"); while (str.length % 4) str += "=";
  const s = atob(str), b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
function cat(...a) { const n = a.reduce((x, y) => x + y.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; }
async function sha256hex(t) { const h = await crypto.subtle.digest("SHA-256", te.encode(t)); return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, "0")).join(""); }
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}

/* VAPID (RFC 8292): push xizmatiga «bu xabar shu sayt egasidan» degan imzo */
let SIGN_KEY = null;
async function vapidAuth(endpoint) {
  if (!SIGN_KEY) {
    const pub = ub64(VAPID_PUB);
    SIGN_KEY = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d: VAPID_PRIV, x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), ext: true },
      { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  }
  const aud = new URL(endpoint).origin, exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const unsigned = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" }))) + "." + b64u(te.encode(JSON.stringify({ aud, exp, sub: SUB })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, SIGN_KEY, te.encode(unsigned));
  return "vapid t=" + unsigned + "." + b64u(sig) + ", k=" + VAPID_PUB;
}

/* xabarni shifrlash (RFC 8291, aes128gcm). eph va salt faqat sinov uchun beriladi */
async function encrypt(payload, p256dh, authSecret, eph, salt) {
  const uaPub = ub64(p256dh), auth = ub64(authSecret);
  eph = eph || await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(te.encode("WebPush: info\0"), uaPub, asPub), 32);
  salt = salt || crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, cat(te.encode(payload), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);                       /* yozuv o'lchami 4096 */
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

async function sendOne(sub, payload) {
  const body = await encrypt(payload, sub.p, sub.a);
  const r = await fetch(sub.e, { method: "POST", body, headers: {
    "Content-Type": "application/octet-stream", "Content-Encoding": "aes128gcm", TTL: "86400", Urgency: "high",
    Authorization: await vapidAuth(sub.e) } });
  return r.status;
}

/* token haqiqiyligini Google tekshiradi; Gmail izi o'qituvchinikiga teng bo'lishi kerak */
async function isTeacher(tok) {
  if (!tok) return false;
  const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + API_KEY,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: tok }) });
  if (!r.ok) return false;
  const u = ((await r.json()).users || [])[0];
  return !!(u && u.email && u.emailVerified && (await sha256hex(String(u.email).trim().toLowerCase())) === TEACHER_H);
}

function json(o, st) { return new Response(JSON.stringify(o), { status: st || 200, headers: { ...CORS, "Content-Type": "application/json" } }); }

async function handle(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET") return json({ ok: true, pub: VAPID_PUB, v: VERSION });   /* paneldagi «Tekshirish» uchun */
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let q; try { q = await req.json(); } catch (e) { return json({ error: "json" }, 400); }
  if (!(await isTeacher(q.tok))) return json({ error: "teacher" }, 403);
  if (q.kind === "remind") return json(await remind(q.tok));                   /* ⏰ eslatma — qo'lda */
  const payload = JSON.stringify({
    t: String(q.title || "TerDU").slice(0, 80), b: String(q.body || "").slice(0, 300),
    u: String(q.url || "").slice(0, 300), g: String(q.tag || "terdu").slice(0, 40) });
  const st = await (await fetch(DB + "/students.json")).json() || {};
  const only = Array.isArray(q.only) ? q.only : null, list = [];
  for (const sid in st) {
    const x = st[sid];
    if (!x || !x.push || (only && only.indexOf(sid) < 0)) continue;
    if (!only && x.status !== "ok") continue;
    for (const k in x.push) { const s = x.push[k]; if (s && s.e && s.p && s.a) list.push({ sid, k, ...s }); }
  }
  let sent = 0, failed = 0, removed = 0;
  for (let i = 0; i < list.length; i += 25) {
    await Promise.all(list.slice(i, i + 25).map(async s => {
      let code = 0; try { code = await sendOne(s, payload); } catch (e) { code = 0; }
      if (code >= 200 && code < 300) { sent++; return; }
      failed++;
      if (code === 404 || code === 410) {                          /* obuna bekor qilingan — bazadan o'chiramiz */
        removed++;
        await fetch(DB + "/students/" + encodeURIComponent(s.sid) + "/push/" + encodeURIComponent(s.k) + ".json?auth=" + encodeURIComponent(q.tok), { method: "DELETE" }).catch(() => {});
      }
    }));
  }
  return json({ ok: true, total: list.length, sent, failed, removed });
}

/* ---------- ⏰ ball muddati tugashidan oldingi eslatma ----------
   Mavzu ochilgan paytdan o'sha haftaning yakshanba kuni 23:59 gacha (Toshkent, UTC+5) ball beriladi (sayt bilan bir xil hisob).
   Eslatma faqat muddati 36 soat ichida tugaydigan va bu mavzuda hali 100 ball to'plamagan talabalarga boradi. */
function gkey(g) { return String(g || "\u2014").trim().replace(/\s+/g, " ").slice(0, 60) || "\u2014"; }
function accEnd(ts) {
  const d = new Date(+ts + 18000000), day0 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return day0 + ((7 - d.getUTCDay()) % 7 + 1) * 86400000 - 18000000;
}
function liveAt(a, sid, group, now) {
  if (!a) return 0;
  const v = (!a.lim ? [a.at] : [(a.s || {})[sid], (a.g || {})[gkey(group)]]).filter(x => typeof x === "number" && x > 0 && now < accEnd(x));
  return v.length ? Math.max(...v) : 0;
}
function fileOf(n) { return "mavzu-" + n + ".html"; }
async function remind(tok) {
  const now = Date.now();
  const [acc, st] = await Promise.all([fetch(DB + "/meta/access.json").then(r => r.json()), fetch(DB + "/students.json").then(r => r.json())]);
  let sent = 0, failed = 0, students = 0, removed = 0;
  for (const sid in (st || {})) {
    const x = st[sid];
    if (!x || x.status !== "ok" || !x.push) continue;
    const tops = [];
    for (const tid in (acc || {})) {
      const at = liveAt(acc[tid], sid, x.group, now);
      if (!at || accEnd(at) - now > 36 * 3600000) continue;
      const p = +(((x.topics || {})[tid] || {}).p) || 0;
      if (p < 100) tops.push({ n: +String(tid).replace(/\D/g, "") || 0, p: Math.round(p * 10) / 10 });
    }
    if (!tops.length) continue;
    tops.sort((a, b) => b.n - a.n); students++;
    const payload = JSON.stringify({
      t: "⏳ Ertaga 23:59 da ball muddati tugaydi",
      b: tops.map(o => o.n + "-mavzu: " + o.p + " / 100 ball").join(" · ") + ". Ko'rilmagan slayd va testni ulgurib bajaring!",
      u: (SITE.indexOf("http") === 0 ? SITE.replace(/\/?$/, "/") : "") + fileOf(tops[0].n), g: "terdu-remind" });
    for (const k in x.push) {
      const s = x.push[k]; if (!s || !s.e || !s.p || !s.a) continue;
      let code = 0; try { code = await sendOne(s, payload); } catch (e) { code = 0; }
      if (code >= 200 && code < 300) { sent++; continue; }
      failed++;
      if ((code === 404 || code === 410) && tok) {
        removed++;
        await fetch(DB + "/students/" + encodeURIComponent(sid) + "/push/" + encodeURIComponent(k) + ".json?auth=" + encodeURIComponent(tok), { method: "DELETE" }).catch(() => {});
      }
    }
  }
  return { ok: true, kind: "remind", students, sent, failed, removed };
}

export default {
  fetch: handle,
  /* Cron Trigger (shanba 20:00 Toshkent = «0 15 * * 6» UTC) */
  async scheduled(event, env, ctx) { ctx.waitUntil(remind(null)); }
};
