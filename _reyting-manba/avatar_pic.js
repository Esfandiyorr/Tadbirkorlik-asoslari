/* ================== AVP — tayyor rasm avatarlar (taqdimotlar va Arena uchun umumiy) ==================
   Rasmlar: fayllar/avatarlar/a001.webp … a211.webp (160×160). Bazada: students/<id>/av = "p17".
   Avatar tanlamagan talabada ism bosh harflari ko'rinadi.
   AVP.html(kod, {size, name, seed, status, badge, cls}) — yagona komponent; AVP.picker({...}) — tanlash oynasi.
   Bu fayl _reyting-manba/inject.py orqali taqdimotlarga va arena.html ga qo'shiladi. */
(function(root){
"use strict";
var N=211, DIR="fayllar/avatarlar/";
var COLS=["#2563eb","#7c3aed","#0f9d58","#e11d48","#f59e0b","#0891b2","#db2777","#65a30d","#ea580c","#334155"];
function num(v){ if(typeof v==="string"&&/^p\d{1,3}$/.test(v)){ var n=+v.slice(1); if(n>=1&&n<=N) return n; } return 0; }
function src(n){ return DIR+"a"+("00"+n).slice(-3)+".webp"; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function h32(s){ var h=2166136261>>>0; s=String(s); for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h; }
function initials(nm){ var p=String(nm||"?").trim().split(/\s+/); return ((p[0]||"?").charAt(0)+((p[1]||"").charAt(0))).toUpperCase(); }
function html(v,o){
  o=o||{}; css();
  var sz=o.size||40, nm=o.name||"", n=num(v);
  var extra=(o.status?'<i class="avp-st avp-'+esc(o.status)+'" aria-hidden="true"></i>':'')+(o.badge?'<b class="avp-bd">'+esc(o.badge)+'</b>':'');
  var w='<span class="avp'+(o.cls?" "+esc(o.cls):"")+'" style="--avs:'+sz+'px" role="img" aria-label="'+esc(nm?nm+" — avatar":"avatar")+'">';
  var ini='<span class="avp-in" style="background:'+COLS[h32(o.seed||nm)%COLS.length]+'">'+esc(initials(nm))+'</span>';
  if(!n) return w+ini+extra+'</span>';
  return w+'<img src="'+src(n)+'" alt="" width="'+sz+'" height="'+sz+'" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'grid\'">'+
    ini.replace('<span class="avp-in" style="','<span class="avp-in" style="display:none;')+extra+'</span>';
}
var CSSDONE=false;
function css(){
  if(CSSDONE||typeof document==="undefined") return; CSSDONE=true;
  var st=document.createElement("style"); st.id="avpCss";
  st.textContent=
  ".avp{position:relative;display:inline-block;width:var(--avs);height:var(--avs);flex:0 0 auto;vertical-align:middle;line-height:0}"+
  ".avp>img,.avp>.avp-in{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover;box-shadow:0 0 0 1.5px color-mix(in srgb,var(--line,#e1e8f4) 80%,transparent)}"+
  ".avp>.avp-in{display:grid;place-items:center;color:#fff;font-weight:800;font-size:calc(var(--avs)*.38);line-height:1;font-family:inherit}"+
  ".avp-st{position:absolute;right:3%;bottom:3%;width:clamp(8px,calc(var(--avs)*.2),18px);height:clamp(8px,calc(var(--avs)*.2),18px);border-radius:50%;border:2px solid var(--panel,#fff);background:#94a3b8}"+
  ".avp-st.avp-online{background:#22c55e}"+
  ".avp-bd{position:absolute;right:-4%;top:-4%;min-width:16px;padding:0 4px;height:16px;border-radius:999px;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font:800 10px/16px system-ui,sans-serif;text-align:center}"+
  ".avp-ed{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:14px;background:rgba(8,15,29,.62);backdrop-filter:blur(4px)}"+
  ".avp-box{width:min(920px,100%);max-height:calc(100vh - 28px);display:flex;flex-direction:column;background:var(--panel,#fff);color:var(--ink,#0d1b2a);border:1px solid var(--line,#e1e8f4);border-radius:22px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.5)}"+
  ".avp-hd{display:flex;align-items:center;gap:14px;padding:14px 18px;color:#fff;background:linear-gradient(135deg,#7c3aed,#2563eb 60%,#06b6d4)}"+
  ".avp-hd .avp>img,.avp-hd .avp>.avp-in{box-shadow:0 0 0 3px #fff,0 8px 20px -6px rgba(0,0,0,.5)}"+
  ".avp-hd b{display:block;font-size:17px}.avp-hd small{opacity:.9;font-size:12.5px}"+
  ".avp-x{margin-left:auto;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.22);color:#fff;cursor:pointer;font:inherit;flex:0 0 auto}"+
  ".avp-grid{flex:1 1 auto;min-height:0;display:grid;grid-auto-rows:max-content;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:10px;padding:14px;overflow:auto}"+
  ".avp-op{position:relative;display:block;width:100%;border-radius:18px;border:3px solid transparent;padding:0;background:var(--panel2,#f7f9fe);cursor:pointer;overflow:hidden;transition:transform .15s,border-color .15s}"+
  ".avp-op img{width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;display:block}"+
  ".avp-op:hover{transform:translateY(-2px) scale(1.03);border-color:#a78bfa}"+
  ".avp-op[aria-checked=true]{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.3)}"+
  ".avp-op[aria-checked=true]::after{content:'✓';position:absolute;right:5px;bottom:5px;width:22px;height:22px;border-radius:50%;background:#7c3aed;color:#fff;font:900 14px/22px system-ui;text-align:center}"+
  ".avp-op:focus-visible,.avp-btn:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}"+
  ".avp-ft{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 16px;border-top:1px solid var(--line,#e1e8f4)}"+
  ".avp-btn{border:1.5px solid var(--line,#e1e8f4);background:var(--panel2,#f7f9fe);color:var(--ink,#0d1b2a);border-radius:12px;padding:9px 14px;font:700 13.5px/1.2 inherit;cursor:pointer}"+
  ".avp-btn.pri{background:linear-gradient(135deg,#12a150,#0d9488);color:#fff;border-color:transparent}"+
  ".avp-row{display:flex;gap:8px;flex-wrap:wrap}"+
  "@media(max-width:600px){.avp-grid{grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:8px;padding:10px}}";
  document.head.appendChild(st);
}
/* tanlash oynasi: opts {value, name, seed, t(uz,en), onSave(kod|null)} */
function picker(opts){
  css(); opts=opts||{};
  var T=opts.t||function(u){ return u; }, cur=num(opts.value), prev=document.activeElement;
  var old=document.getElementById("avpEd"); if(old) old.remove();
  var d=document.createElement("div"); d.className="avp-ed"; d.id="avpEd";
  d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label",T("Avatar tanlash","Choose an avatar"));
  var g=""; for(var i=1;i<=N;i++) g+='<button type="button" class="avp-op" role="radio" data-n="'+i+'" aria-checked="'+(i===cur)+'" tabindex="'+((i===cur||(!cur&&i===1))?0:-1)+'" aria-label="'+T("Avatar","Avatar")+' '+i+'"><img src="'+src(i)+'" alt="" width="160" height="160" loading="lazy" decoding="async"></button>';
  d.innerHTML='<div class="avp-box"><div class="avp-hd"><span id="avpPv"></span><div><b>🎭 '+T("Avatar tanlang","Choose your avatar")+'</b><small>'+esc(opts.name||"")+' · '+N+' '+T("ta avatar","avatars")+'</small></div>'+
    '<button type="button" class="avp-x" data-a="x" aria-label="'+T("Yopish","Close")+'">✕</button></div>'+
    '<div class="avp-grid" role="radiogroup" aria-label="'+T("Avatarlar","Avatars")+'">'+g+'</div>'+
    '<div class="avp-ft"><button type="button" class="avp-btn" data-a="rm">🚫 '+T("Avatarsiz","No avatar")+'</button>'+
    '<span class="avp-row"><button type="button" class="avp-btn" data-a="cancel">'+T("Bekor qilish","Cancel")+'</button>'+
    '<button type="button" class="avp-btn pri" data-a="save">💾 '+T("Saqlash","Save")+'</button></span></div></div>';
  document.body.appendChild(d);
  function pv(){ document.getElementById("avpPv").innerHTML=html(cur?"p"+cur:null,{size:64,name:opts.name,seed:opts.seed}); }
  function sel(n){
    cur=n; [].forEach.call(d.querySelectorAll(".avp-op"),function(b){ var on=+b.dataset.n===n; b.setAttribute("aria-checked",on); b.tabIndex=on?0:-1; });
    pv();
  }
  pv();
  setTimeout(function(){ var b=d.querySelector('.avp-op[tabindex="0"]'); if(b){ b.focus(); b.scrollIntoView({block:"center"}); } },40);
  function close(save){ d.remove(); try{ if(prev&&prev.focus) prev.focus(); }catch(e){} if(save&&opts.onSave) opts.onSave(cur?"p"+cur:null); }
  d.addEventListener("click",function(e){
    if(e.target===d){ close(false); return; }
    var b=e.target.closest("button"); if(!b) return;
    if(b.dataset.n){ sel(+b.dataset.n); return; }
    var a=b.dataset.a;
    if(a==="save") close(true); else if(a==="rm"){ cur=0; close(true); } else close(false);
  });
  d.addEventListener("dblclick",function(e){ var b=e.target.closest(".avp-op"); if(b){ sel(+b.dataset.n); close(true); } });
  d.addEventListener("keydown",function(e){
    if(e.key==="Escape"){ e.preventDefault(); close(false); return; }
    var t=e.target;
    if(t.classList&&t.classList.contains("avp-op")&&/^Arrow/.test(e.key)){
      e.preventDefault();
      var cols=Math.max(1,Math.round(d.querySelector(".avp-grid").clientWidth/(t.offsetWidth+10)));
      var n=+t.dataset.n, step={ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols}[e.key];
      n=Math.min(N,Math.max(1,n+step)); sel(n); var nb=d.querySelector('.avp-op[data-n="'+n+'"]'); nb.focus(); return;
    }
    if(e.key==="Enter"&&t.classList&&t.classList.contains("avp-op")){ e.preventDefault(); sel(+t.dataset.n); close(true); }
  });
}
root.AVP={n:N,num:num,src:src,html:html,picker:picker,css:css,initials:initials};
if(typeof module!=="undefined"&&module.exports) module.exports=root.AVP;
})(typeof window!=="undefined"?window:globalThis);
