/* =====================================================================
   ⌨️ YOZUV MARAFONI — tez yozish poygasi (arena.html → #/yozuv)
   ---------------------------------------------------------------------
   • Yuguruvchining yo'lakdagi o'rni = matnning to'g'ri yozilgan qismi.
     Xato tuzatilmaguncha keyingi so'zga o'tib bo'lmaydi.
   • Mashq poygasi: botlar va shaxsiy rekord "sharpasi" bilan (server shart emas).
   • Jonli poyga: o'qituvchi taqdimotdagi panelda tuzadi —
       /kahoot/idx/<sana-yHHMM> va /kahoot/games/<kalit> (meta.type="yz").
       qo'shilish:        kahoot/games/<k>/p/<sid>   (faqat lobbi vaqtida, Firebase qoidasi tekshiradi)
       nazorat nuqtalari: kahoot/games/<k>/a/<so'z>/<sid> = {c:0, t: server vaqti}
       jonli o'rinlar:    arena/yz/<k>/<sid>          (faqat animatsiya uchun)
     Rasmiy natija yzScore() bilan hisoblanadi (yozuv_ball.js):
     1-o'rin +5, 2-o'rin +4, 3-o'rin +3 ball umumiy reytingga qo'shiladi.
   • Grafika — Canvas 2D (kutubxonasiz): parallaksli stadion, 48 xil yuguruvchi,
     chang, konfetti, marra lentasi. Ovoz — WebAudio sintez (fayl yuklanmaydi).
   • Shaxsiy rekordlar va sozlamalar localStorage'da saqlanadi.
   ===================================================================== */
var YZ=(function(){
"use strict";

/* ================== 1. YORDAMCHILAR ================== */
var X=null;                 /* arena yordamchilari (mount paytida beriladi) */
var ROOT=null, VIEW="", ALIVE=0, TIMERS=[];
var TX=window.YZ_TEXTS||{langs:[],lvls:[],t:{}};
function L(uz,en){ return X&&X.L?X.L(uz,en):uz; }
function esc(s){ return String(s==null?"":s).replace(/[<>&"]/g,function(c){ return {"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]; }); }
function $(id){ return document.getElementById(id); }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function rnd(a,b){ return a+Math.random()*(b-a); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function now(){ return (window.performance&&performance.now)?performance.now():Date.now(); }
function fmtT(ms){ var s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+":"+("0"+s%60).slice(-2); }
function fmtT1(ms){ ms=Math.max(0,ms); return fmtT(ms)+"."+Math.floor(ms%1000/100); }
function lget(k,d){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
function lset(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function hash(s){ var h=2166136261; s=String(s); for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
function srng(seed){ var x=(seed>>>0)||1; return function(){ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296; }; }
function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function ME(){ return X&&X.me?X.me():null; }
function myName(){ var m=ME(); return m?((m.name||"")+" "+(m.surname||"")).trim():L("Mehmon","Guest"); }
function firstName(n){ return String(n||"?").trim().split(/\s+/)[0].slice(0,12); }
/* taymerlar ko'rinish almashganda avtomatik to'xtaydi (ALIVE belgisi) */
function later(fn,ms){ var a=ALIVE, t=setTimeout(function(){ if(a===ALIVE) fn(); },ms); TIMERS.push(t); return t; }
function every(fn,ms){ var a=ALIVE, t=setInterval(function(){ if(a===ALIVE) fn(); else clearInterval(t); },ms); TIMERS.push(t); return t; }
function stopTimers(){ TIMERS.forEach(function(t){ clearTimeout(t); clearInterval(t); }); TIMERS=[]; }
function toast(t){ if(X&&X.toast) X.toast(t); }
/* rang bilan ishlash */
function hex2rgb(h){ h=String(h).replace("#",""); if(h.length===3) h=h.replace(/(.)/g,"$1$1"); var n=parseInt(h,16); return [n>>16&255,n>>8&255,n&255]; }
function shade(h,a){ var c=hex2rgb(h), f=a<0?0:255, p=Math.abs(a); return "rgb("+c.map(function(v){ return Math.round(v+(f-v)*p); }).join(",")+")"; }
function rgba(h,a){ var c=hex2rgb(h); return "rgba("+c[0]+","+c[1]+","+c[2]+","+a+")"; }
function lum(h){ var c=hex2rgb(h); return (0.299*c[0]+0.587*c[1]+0.114*c[2])/255; }
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function line(c,x1,y1,x2,y2,w,col){ c.strokeStyle=col; c.lineWidth=w; c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); }

/* ================== 2. MATNLAR ================== */
function langs(){ return TX.langs||[]; }
function lvls(){ return TX.lvls||[]; }
function langOf(id){ return langs().filter(function(x){ return x.id===id; })[0]||{id:id,nm:id,fl:"🌐"}; }
function lvlNm(id){ var l=lvls().filter(function(x){ return x.id===id; })[0]; return l?l.nm:id; }
function pool(l,v){ return ((TX.t||{})[l]||{})[v]||[]; }
/* tasodifiy matn: oxirgi o'ynalganlar darhol takrorlanmaydi; vaqtga rejimida bir nechta matn ulanadi */
function pickText(l,v,minLen){
  var a=pool(l,v).slice(); if(!a.length){ l="uz"; v="orta"; a=pool(l,v).slice(); }
  if(!a.length) return "Matn topilmadi.";
  var key=l+"|"+v, lastAll=lget("yz_last_v1",{})||{}, last=lastAll[key]||[];
  var fresh=a.filter(function(s){ return last.indexOf(hash(s))<0; }); if(!fresh.length) fresh=a.slice();
  shuffle(fresh);
  var out=[fresh[0]], len=fresh[0].length, rest=shuffle(a.filter(function(s){ return s!==fresh[0]; }));
  while(minLen&&len<minLen){ if(!rest.length) rest=shuffle(a.slice()); var s=rest.shift(); out.push(s); len+=s.length+1; }
  last=last.concat(out.map(hash)).slice(-Math.max(1,Math.floor(a.length*0.6)));
  lastAll[key]=last; lset("yz_last_v1",lastAll);
  return out.join(" ");
}
/* matn modeli: so'zlar va ularning boshlanish o'rni */
function mkText(str){
  str=String(str||"").replace(/\s+/g," ").trim();
  var w=str.split(" "), st=[], o=0;
  w.forEach(function(x){ st.push(o); o+=x.length+1; });
  return {s:str,w:w,st:st,n:str.length,nw:w.length};
}
function segOf(T,i){ return T.w[i]+(i<T.nw-1?" ":""); }
/* i-so'z tugagandagi belgilar soni (bo'shliqsiz) */
function charsAt(T,i){ return i<=0?0:(T.st[i-1]+T.w[i-1].length); }

/* ---------- bir xil deb qabul qilinadigan belgilar ----------
   O'zbekcha o' va g' dagi tutuq belgisining (va inglizcha apostrofning) barcha ko'rinishlari bitta;
   qo'shtirnoq, tire va bo'shliqning turli shakllari ham klaviaturadagi oddiy belgiga tenglashtiriladi. */
var APO="'‘’ʻʼ`´′", QUO='"«»“”„';
function nch(ch){
  if(APO.indexOf(ch)>=0) return "'";
  if(QUO.indexOf(ch)>=0) return '"';
  if(ch==="—"||ch==="–"||ch==="−") return "-";
  if(ch==="\u00a0"||ch==="\u2009"||ch==="\u202f") return " ";
  return ch;
}
function nstr(s){ var o=""; for(var i=0;i<s.length;i++) o+=nch(s.charAt(i)); return o; }
var CYR=/[\u0400-\u04FF]/;           /* matnlar lotin alifbosida — kirill harf klaviatura noto'g'ri tilda ekanini bildiradi */

/* ================== 3. XOTIRA (localStorage) ================== */
var K_PB="yz_pb_v1", K_HIST="yz_hist_v1", K_LOOK="yz_look_v1", K_SET="yz_set_v1";
function has(list,id){ return list.some(function(x){ return x.id===id; }); }
function settings(){
  var s=lget(K_SET,{})||{};
  return {l:has(langs(),s.l)?s.l:"uz",v:has(lvls(),s.v)?s.v:"orta",m:/^(fin|t60|t120|t180)$/.test(s.m)?s.m:"fin",b:(s.b==null?3:clamp(+s.b,0,5))};
}
function saveSet(s){ lset(K_SET,s); }
function modeDur(m){ return m==="t60"?60:m==="t120"?120:m==="t180"?180:m==="t300"?300:0; }
function modeNm(m){ var d=modeDur(m); return d?"⏱ "+(d/60)+" "+L("daqiqa","min"):"🏁 "+L("Marra","Finish line"); }
function pbKey(l,v,m){ return l+"|"+v+"|"+m; }
function pbGet(l,v,m){ return (lget(K_PB,{})||{})[pbKey(l,v,m)]||null; }
function pbSave(l,v,m,r){ var a=lget(K_PB,{})||{}, k=pbKey(l,v,m), o=a[k]; if(o&&o.w>=r.w) return false; a[k]=r; lset(K_PB,a); return true; }
function histAdd(r){ var h=lget(K_HIST,[])||[]; h.push(r); lset(K_HIST,h.slice(-40)); }
/* botlar tezligi uchun: shu tildagi so'nggi natijalar bo'yicha o'rtacha (belgi/soniya) */
function myCps(l){
  var h=(lget(K_HIST,[])||[]).filter(function(x){ return x&&x.l===l&&x.c>0; }).slice(-5);
  if(!h.length) return 0;
  return h.reduce(function(s,x){ return s+x.c; },0)/h.length/60;
}

/* ================== 4. OVOZ (WebAudio sintez) ================== */
var SND=(function(){
  var ac=null, mg=null, NB=null, amb=null, ambG=null;
  function ctx(){ if(!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); mg=ac.createGain(); mg.gain.value=.7; mg.connect(ac.destination); }catch(e){ ac=null; } } return ac; }
  function on(){ return !(X&&X.FX&&X.FX.isMuted()); }
  function unlock(){ var a=ctx(); try{ if(a&&a.state==="suspended") a.resume(); }catch(e){} }
  function t0(){ var a=ctx(); return a?a.currentTime:0; }
  function tone(f,t,d,type,v,f2){
    var a=ctx(); if(!a||!on()) return;
    try{ var o=a.createOscillator(), g=a.createGain();
      o.type=type||"sine"; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+d);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v||.08,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(g); g.connect(mg); o.start(t); o.stop(t+d+.05); }catch(e){}
  }
  function nbuf(a){ if(!NB){ NB=a.createBuffer(1,a.sampleRate*2,a.sampleRate); var d=NB.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1; } return NB; }
  function noise(t,d,v,type,freq,q,att){
    var a=ctx(); if(!a||!on()) return;
    try{ var s=a.createBufferSource(), f=a.createBiquadFilter(), g=a.createGain();
      s.buffer=nbuf(a); f.type=type||"highpass"; f.frequency.value=freq||1000; if(q) f.Q.value=q;
      if(att){ g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v||.05,t+att); }
      else g.gain.setValueAtTime(v||.05,t);
      g.gain.exponentialRampToValueAtTime(.0001,t+d);
      s.connect(f); f.connect(g); g.connect(mg); s.start(t,Math.random()); s.stop(t+d+.05); }catch(e){}
  }
  var lastKey=0, lastErr=0;
  return {
    unlock:unlock,
    beep:function(hi){ var t=t0(); tone(hi?988:494,t,hi?.55:.2,"square",.05); tone(hi?1976:988,t,hi?.45:.14,"sine",.035); },
    pistol:function(){ var t=t0(); noise(t,.5,.4,"lowpass",2600); noise(t,.14,.3,"highpass",2000); tone(110,t,.28,"sine",.3,38); },
    key:function(){ var n=now(); if(n-lastKey<28) return; lastKey=n; var t=t0(); noise(t,.03,.035,"bandpass",2600+Math.random()*900,1.2); },
    err:function(){ var n=now(); if(n-lastErr<140) return; lastErr=n; var t=t0(); tone(160,t,.13,"square",.045,118); tone(80,t,.13,"sine",.06); },
    word:function(){ var t=t0(); tone(1320,t,.05,"sine",.018); },
    over:function(){ var t=t0(); noise(t,.4,.07,"bandpass",800,.8,.08); tone(392,t,.22,"triangle",.05,784); },
    fin:function(){ var t=t0(), n=[[523.25,0,.14],[659.25,.13,.14],[783.99,.26,.14],[1046.5,.39,.55],[783.99,.82,.12],[1046.5,.95,.8]];
      n.forEach(function(x){ tone(x[0],t+x[1],x[2]+.1,"sawtooth",.035); tone(x[0],t+x[1],x[2]+.12,"triangle",.05); });
      tone(130.81,t,1.8,"triangle",.07); },
    cheer:function(big){ var t=t0(), d=big?3.2:1.8;
      noise(t,d,big?.11:.06,"bandpass",900,.6,.35); noise(t,d*.9,big?.07:.04,"bandpass",2100,.9,.4);
      for(var i=0;i<(big?26:12);i++) noise(t+.2+Math.random()*d*.7,.05,.05+Math.random()*.05,"highpass",1500+Math.random()*2500); },
    tick:function(){ var t=t0(); tone(1500,t,.04,"square",.02); },
    /* tribunadagi shovqin (poyga davomida, juda past) */
    amb:function(v){
      if(!amb&&!(v>0)) return;
      var a=ctx(); if(!a) return;
      if(!amb){ try{ amb=a.createBufferSource(); amb.buffer=nbuf(a); amb.loop=true; var f=a.createBiquadFilter(); f.type="bandpass"; f.frequency.value=650; f.Q.value=.5;
        ambG=a.createGain(); ambG.gain.value=.0001; amb.connect(f); f.connect(ambG); ambG.connect(mg); amb.start(); }catch(e){ amb=null; return; } }
      try{ ambG.gain.setTargetAtTime(on()?Math.max(.0001,v):.0001,a.currentTime,.4); }catch(e){}
    },
    stop:function(){ if(amb){ try{ amb.stop(); }catch(e){} amb=null; } }
  };
})();

/* ================== 5. YUGURUVCHILAR (48 xil ko'rinish) ================== */
var SKIN=["#f9d7b9","#efc09a","#e0a878","#c58a5c","#a26a44","#7a4b2e"];
var HAIRC=["#1c1714","#3a2618","#5b3a22","#8b5a2b","#c58b4c","#e3c07a","#2b2b33"];
var JERS=["#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#14b8a6","#06b6d4","#0ea5e9",
          "#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#1e293b","#f1f5f9","#0f766e"];
var SHOES=["#f8fafc","#111827","#ef4444","#2563eb","#22c55e","#f59e0b","#a855f7","#06b6d4"];
var LNAMES=["Chaqmoq","Bo'ron","Lochin","Shamol","Yulduz","Burgut","Tulpor","Sher","Oqqush","Kamalak","Quyosh","Oydin",
  "Olov","Chinor","Lola","Bulbul","Jayron","Qaldirg'och","Momaqaldiroq","To'fon","Yashin","Zafar","Mard","Botir",
  "Dovyurak","Shiddat","Chempion","Sprinter","Marafonchi","Raketa","Kometa","Sayyora","Nur","Gulxan","Tog'","Daryo",
  "Bahor","Tong","Shafaq","Ufq","Samo","Kumush","Oltin","Zumrad","Yoqut","Marjon","Feruza","Olmos"];
var HS_M=["short","buzz","spiky","side","curly","afro"], HS_F=["pony","bun","bob","long","braid"];
var LOOKS=(function(){
  var out=[];
  for(var i=0;i<48;i++){
    var f=(i%3===1), j=JERS[(i*7+3)%JERS.length], a=JERS[(i*11+8)%JERS.length];
    if(a===j) a=JERS[(i*11+9)%JERS.length];
    var acc="";
    if(f&&i%5===2) acc="hijab"; else if(i%8===5) acc="doppi"; else if(i%6===3) acc="band"; else if(i%7===4) acc="cap"; else if(i%9===6) acc="glasses";
    var sho=["#111827","#f8fafc",a,"#334155"][i%4]; if(sho===j) sho="#111827";
    var lk={id:i,nm:LNAMES[i],f:f,skin:SKIN[(i*5+1)%SKIN.length],hair:HAIRC[(i*3+(f?2:0))%HAIRC.length],
      hs:f?HS_F[(i*2)%HS_F.length]:HS_M[i%HS_M.length],jer:j,acc2:a,sho:sho,shoe:SHOES[i%SHOES.length],acc:acc,num:(i*17%89)+10,pat:i%3};
    /* to'qroq ranglar (orqadagi qo'l-oyoq uchun) oldindan */
    lk.skinD=shade(lk.skin,-0.16); lk.jerD=shade(lk.jer,-0.22); lk.shoD=shade(lk.sho,-0.22); lk.shoeD=shade(lk.shoe,-0.2); lk.ear=shade(lk.skin,-0.1);
    lk.numC=lum(lk.jer)>0.62?"#111827":"#ffffff";
    out.push(lk);
  }
  return out;
})();
function lookOf(i){ i=+i; return LOOKS[(isFinite(i)&&i>=0?i:0)%LOOKS.length]; }
function myLook(){ var v=lget(K_LOOK,null); if(typeof v==="number"&&v>=0&&v<LOOKS.length) return v; var m=ME(); return m?hash(m.id)%LOOKS.length:0; }

/* ---------- poza: bo'g'imlar burchagi ----------
   Burchak pastga tik yo'nalishdan o'lchanadi, musbat — oldinga (o'ngga). Odam bo'yi ≈ 100 birlik. */
var THIGH=24, SHIN=24, UARM=16, FARM=15, TORSO=30, HEADR=10;
function sg(x,y,a,l){ return [x+Math.sin(a)*l, y+Math.cos(a)*l]; }
function poseOf(o){
  var ph=o.ph||0, sp=clamp(o.sp||0,0,1), t=o.t||0, p={lean:.05,legs:[],arms:[],fly:0,hr:0,br:0};
  switch(o.pose){
    case "crouch":   /* "Startga!" — qo'llar yerda, orqa tizza yerda */
      p.lean=1.38; p.legs=[{a:1.01,b:2.18},{a:-0.35,b:1.48}]; p.arms=[{a:.07,e:0},{a:.03,e:0}]; p.hr=.85; break;
    case "set":      /* "Diqqat!" — tos ko'tarilgan */
      p.lean=1.62; p.legs=[{a:1.0,b:1.75},{a:-0.25,b:1.29}]; p.arms=[{a:.02,e:0},{a:0,e:0}]; p.hr=.7; break;
    case "idle":
      p.br=Math.sin(t*2.3); p.lean=.03; p.legs=[{a:.07,b:.05},{a:-.07,b:.05}]; p.arms=[{a:.14+.03*p.br,e:.35},{a:-.12,e:.4}]; break;
    case "win":      /* g'alaba: qo'llar tepada, sakrash */
      var j=Math.abs(Math.sin(t*5.2)), w=Math.sin(t*5.2);
      p.lean=-.04; p.legs=[{a:.12+.25*j,b:.25+.65*j},{a:-.1,b:.2+.55*j}]; p.arms=[{a:2.75+.15*w,e:.15},{a:2.55-.15*w,e:.25}]; p.fly=9*j; p.hr=-.15; break;
    case "wave":     /* qo'l silkitish */
      p.lean=.02; p.legs=[{a:.07,b:.05},{a:-.07,b:.05}]; p.arms=[{a:2.55,e:.45+.45*Math.sin(t*7)},{a:-.1,e:.4}]; break;
    default:         /* yugurish (tezlik oshsa qadam kengayadi, gavda oldinga egiladi) */
      var A=.42+.5*sp;
      p.lean=.1+.22*sp; p.hr=p.lean*.35;
      for(var k=0;k<2;k++){ var f=ph+k*Math.PI;
        p.legs.push({a:A*Math.cos(f),b:.22+(.85+.9*sp)*Math.max(0,-Math.sin(f-.5))});
        p.arms.push({a:-.95*A*Math.cos(f),e:1.45-.25*Math.sin(f)}); }
      p.fly=(1.5+3*sp)*Math.max(0,Math.cos(2*ph));
      if(o.pose==="stumble"){ p.lean=-.22; p.arms[0].a=1.9; p.arms[1].a=-1.3; p.fly=0; p.hr=-.3; }
  }
  return p;
}
/* bitta yuguruvchini chizish: o={x,y (oyoq ostidagi nuqta), s (o'lcham), pose, ph, sp, t, alpha, medal, num} */
function drawRunner(c,lk,o){
  var p=poseOf(o), s=o.s||1;
  var legs=p.legs.map(function(Lg){ var k=sg(0,0,Lg.a,THIGH), ab=Lg.a-Lg.b, an=sg(k[0],k[1],ab,SHIN), fa=ab+Math.PI/2;
    return {k:k,an:an,to:sg(an[0],an[1],fa,9),fa:fa}; });
  var sh=sg(0,0,Math.PI-p.lean,TORSO);
  var arms=p.arms.map(function(A){ var e=sg(sh[0],sh[1],A.a,UARM); return {e:e,h:sg(e[0],e[1],A.a+A.e,FARM)}; });
  /* eng pastki nuqta yerga tegsin (oyoq, tizza yoki kaft) */
  var low=0;
  legs.forEach(function(g){ low=Math.max(low,g.an[1]+2.4,g.to[1]+1.6,g.k[1]+4.5); });
  arms.forEach(function(A){ low=Math.max(low,A.h[1]+3); });
  var hy=-low-p.fly+p.br*.6;
  c.save(); c.translate(o.x,o.y); c.scale(s,s);
  if(o.alpha!=null) c.globalAlpha=o.alpha;
  /* soya */
  c.fillStyle="rgba(0,0,0,.2)"; c.beginPath(); c.ellipse(5,0,Math.max(10,24-p.fly*.9),3.8,0,0,6.2832); c.fill();
  c.translate(0,hy); c.lineCap="round"; c.lineJoin="round";
  rArm(c,lk,arms[1],sh,true); rLeg(c,lk,legs[1],true);
  rTorso(c,lk,sh,p.lean,o);
  rLeg(c,lk,legs[0],false);
  rHead(c,lk,sh,p,o);
  rArm(c,lk,arms[0],sh,false);
  c.restore();
}
function rLeg(c,lk,g,far){
  var sk=far?lk.skinD:lk.skin;
  line(c,0,0,g.k[0],g.k[1],9.6,sk);
  line(c,g.k[0],g.k[1],g.an[0],g.an[1],7.8,sk);
  var sx=g.an[0]+(g.k[0]-g.an[0])*.24, sy=g.an[1]+(g.k[1]-g.an[1])*.24;
  line(c,sx,sy,g.an[0],g.an[1],8,far?"#d5dbe5":"#ffffff");                 /* paypoq */
  line(c,0,0,g.k[0]*.56,g.k[1]*.56,12,far?lk.shoD:lk.sho);                 /* shorti */
  c.save(); c.translate(g.an[0],g.an[1]); c.rotate(Math.PI/2-g.fa);         /* krossovka */
  rr(c,-3.6,-4.2,16,7.4,3.6); c.fillStyle=far?lk.shoeD:lk.shoe; c.fill();
  rr(c,-3.6,1.7,16,2.5,1.2); c.fillStyle=far?"#cbd5e1":"#ffffff"; c.fill();
  c.restore();
}
function rArm(c,lk,A,sh,far){
  var sk=far?lk.skinD:lk.skin;
  line(c,sh[0],sh[1],A.e[0],A.e[1],6.6,sk);
  line(c,A.e[0],A.e[1],A.h[0],A.h[1],5.9,sk);
  line(c,sh[0],sh[1],sh[0]+(A.e[0]-sh[0])*.48,sh[1]+(A.e[1]-sh[1])*.48,8.6,far?lk.jerD:lk.jer);   /* yeng */
  c.fillStyle=sk; c.beginPath(); c.arc(A.h[0],A.h[1],3.4,0,6.2832); c.fill();
  if(!far&&lk.acc==="band"){ line(c,A.e[0]+(A.h[0]-A.e[0])*.72,A.e[1]+(A.h[1]-A.e[1])*.72,A.e[0]+(A.h[0]-A.e[0])*.9,A.e[1]+(A.h[1]-A.e[1])*.9,7,lk.acc2); }
}
function rTorso(c,lk,sh,lean,o){
  line(c,0,-1,sh[0],sh[1],17.5,lk.jer);
  var cx=Math.cos(lean), sy=Math.sin(lean);
  if(lk.pat===1){ var mx=sh[0]*.66, my=sh[1]*.66; line(c,mx-cx*8.4,my-sy*8.4,mx+cx*8.4,my+sy*8.4,4.4,lk.acc2); }
  else if(lk.pat===2){ line(c,sh[0]*.62,sh[1]*.62,sh[0],sh[1],17.5,lk.acc2); }
  /* ko'krakdagi raqam */
  c.save(); c.translate(sh[0]*.4+cx*2.5,sh[1]*.4+sy*2.5); c.rotate(lean);
  c.fillStyle="rgba(255,255,255,.92)"; rr(c,-6,-4.6,12,9.2,2); c.fill();
  c.fillStyle="#111827"; c.font="800 7px system-ui,Arial,sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(String(o.num||lk.num),0,.5);
  c.restore();
  if(o.medal){
    var mc=o.medal===1?"#fbbf24":o.medal===2?"#cbd5e1":"#d97706";
    line(c,sh[0]-1,sh[1]+1,sh[0]*.55+cx*4,sh[1]*.55+sy*4,2.2,"#2563eb");
    c.fillStyle=mc; c.beginPath(); c.arc(sh[0]*.55+cx*4,sh[1]*.55+sy*4,4.6,0,6.2832); c.fill();
    c.strokeStyle="rgba(0,0,0,.25)"; c.lineWidth=1; c.stroke();
  }
}
function rHead(c,lk,sh,p,o){
  var ha=p.lean*.72, hc=sg(sh[0],sh[1],Math.PI-ha,5+HEADR);
  line(c,sh[0],sh[1],sh[0]+(hc[0]-sh[0])*.6,sh[1]+(hc[1]-sh[1])*.6,6.4,lk.skin);   /* bo'yin */
  c.save(); c.translate(hc[0],hc[1]); c.rotate(p.hr||0);
  var R=HEADR, hs=lk.hs, H=lk.hair, sk=lk.skin;
  if(lk.acc==="hijab"){
    c.fillStyle=lk.acc2; c.beginPath(); c.arc(-1,-.5,R+2.8,0,6.2832); c.fill();
    c.beginPath(); c.moveTo(-R-2.6,0); c.quadraticCurveTo(-R-3.4,R+9,-1,R+9.5); c.lineTo(7,R+3); c.lineTo(5,3); c.closePath(); c.fill();
    c.fillStyle=sk; c.beginPath(); c.ellipse(2.6,1.2,R-2.6,R-1.6,0,0,6.2832); c.fill();
    c.strokeStyle=shade(lk.acc2,-.2); c.lineWidth=1.2; c.beginPath(); c.arc(2.6,1.2,R-1.6,-1.9,1.9); c.stroke();
  } else {
    c.fillStyle=H;
    if(hs==="afro"){ c.beginPath(); c.arc(-2.5,-2.5,R+5.2,0,6.2832); c.fill(); }
    if(hs==="long"||hs==="bob"){ rr(c,-R-1.6,-3,R+3,hs==="long"?R+16:R+8,4.5); c.fill(); }
    if(hs==="pony"){ var sw=Math.sin((o.ph||0)*2+1)*3.2; c.strokeStyle=H; c.lineWidth=5.4;
      c.beginPath(); c.moveTo(-R+1.5,-4.5); c.quadraticCurveTo(-R-8,-3+sw,-R-11,7+sw); c.stroke(); }
    if(hs==="braid"){ for(var b=0;b<4;b++){ c.beginPath(); c.arc(-R+.5-b*.6,2+b*4.4+Math.sin((o.ph||0)+b)*.8,2.7-b*.25,0,6.2832); c.fill(); } }
    c.fillStyle=sk; c.beginPath(); c.arc(0,0,R,0,6.2832); c.fill();
    /* soch qopqog'i: orqadan tepaga, peshonagacha */
    var hr=hs==="buzz"?R+.5:R+1.3;
    c.fillStyle=H; c.beginPath(); c.arc(0,0,hr,Math.PI*.92,Math.PI*1.9);
    c.quadraticCurveTo(R*.15,-R*.32,-R*.42,R*.08); c.lineTo(-R*.98,R*.5); c.closePath(); c.fill();
    if(hs==="spiky"){ for(var q=0;q<5;q++){ var an=Math.PI*(1.05+q*.17), x1=Math.cos(an)*hr, y1=Math.sin(an)*hr;
      c.beginPath(); c.moveTo(x1-2.4,y1+1); c.lineTo(Math.cos(an)*(hr+5),Math.sin(an)*(hr+5)); c.lineTo(x1+2.4,y1+1); c.fill(); } }
    if(hs==="side"){ c.beginPath(); c.moveTo(-2,-R-1); c.quadraticCurveTo(R*.8,-R*.9,R+1.4,-2.2); c.lineTo(4,-4.5); c.closePath(); c.fill(); }
    if(hs==="curly"){ for(var u=0;u<7;u++){ var a2=Math.PI*(.95+u*.14); c.beginPath(); c.arc(Math.cos(a2)*(R+.8),Math.sin(a2)*(R+.8),3.1,0,6.2832); c.fill(); } }
    if(hs==="bun"){ c.beginPath(); c.arc(-6.5,-R+.5,4.6,0,6.2832); c.fill(); }
    /* quloq */
    c.fillStyle=lk.ear; c.beginPath(); c.arc(-1.6,1.4,2.5,0,6.2832); c.fill();
  }
  /* yuz: burun, ko'z, qosh, og'iz */
  c.fillStyle=sk; c.beginPath(); c.arc(R-.6,1,1.8,-1.6,1.6); c.fill();
  c.fillStyle="#111827"; c.beginPath(); c.ellipse(5.4,-.9,1.25,1.55,0,0,6.2832); c.fill();
  c.fillStyle="#fff"; c.beginPath(); c.arc(5.8,-1.4,.45,0,6.2832); c.fill();
  c.strokeStyle=lk.acc==="hijab"?"#3a2618":H; c.lineWidth=1.3; c.beginPath(); c.moveTo(3.4,-4); c.lineTo(7.6,-3.6); c.stroke();
  c.fillStyle="rgba(255,110,110,.22)"; c.beginPath(); c.arc(4.6,3.2,2.1,0,6.2832); c.fill();
  c.strokeStyle="#7a2e2e"; c.lineWidth=1.1;
  if(o.pose==="win"||o.pose==="wave"||(o.sp||0)>.65){ c.fillStyle="#7a2e2e"; c.beginPath(); c.ellipse(6.6,4.6,1.6,1.9,0,0,6.2832); c.fill(); }
  else { c.beginPath(); c.arc(6.4,3.4,1.9,.25,1.25); c.stroke(); }
  /* aksessuarlar */
  if(lk.acc==="band"){ line(c,-R+.4,-3.6,R-.4,-4.8,3.4,lk.acc2); var fl=Math.sin((o.ph||0)*2)*2;
    line(c,-R+.4,-3.6,-R-6,-1.5+fl,2.2,lk.acc2); line(c,-R+.4,-3.6,-R-5,1.2+fl,2.2,lk.acc2); }
  if(lk.acc==="doppi"){
    c.fillStyle="#111827"; c.beginPath(); c.moveTo(-8.8,-5.2); c.lineTo(-7.1,-13.2); c.lineTo(7.4,-13.8); c.lineTo(9,-6); c.closePath(); c.fill();
    c.fillStyle="#f8fafc";
    [[-3.4,-9.3,-.5],[3,-9.7,.5]].forEach(function(m){ c.beginPath(); c.ellipse(m[0],m[1],2.5,1.15,m[2],0,6.2832); c.fill(); });
    c.strokeStyle="#f8fafc"; c.lineWidth=.9; c.beginPath(); c.moveTo(-8.6,-6.1); c.lineTo(8.8,-6.9); c.stroke();
  }
  if(lk.acc==="cap"){
    c.fillStyle=lk.acc2; c.beginPath(); c.arc(-.5,-1.6,R+1.3,Math.PI*1.02,Math.PI*1.98); c.closePath(); c.fill();
    c.fillStyle=shade(lk.acc2,-.25); c.beginPath(); c.moveTo(4,-5.4); c.lineTo(R+8,-4.4); c.lineTo(R+7.4,-2.6); c.lineTo(4,-3.4); c.closePath(); c.fill();
    c.fillStyle=shade(lk.acc2,.3); c.beginPath(); c.arc(-.5,-R-2.2,1.6,0,6.2832); c.fill();
  }
  if(lk.acc==="glasses"){ c.fillStyle="#0f172a"; rr(c,2.6,-3.3,6.6,3.6,1.4); c.fill(); line(c,2.8,-1.9,-1.4,-1.4,1.1,"#0f172a"); }
  c.restore();
}
/* bitta ko'rinishni kichik canvas'ga (tanlash ro'yxati uchun) */
function lookThumb(cv,i){
  var dpr=Math.min(2,window.devicePixelRatio||1), w=cv.clientWidth||56, h=cv.clientHeight||70;
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  var c=cv.getContext("2d"); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h);
  drawRunner(c,lookOf(i),{x:w*.42,y:h-6,s:h/112,pose:"run",ph:.9,sp:.55,t:0});
}

/* ================== 6. STADION SAHNASI (Canvas 2D) ==================
   Sahna balandligi doim 360 birlik (eni ekranga qarab o'zgaradi). Qatlamlar orqadan oldinga:
   osmon → bulutlar → shahar → tribuna (tomoshabinlar) → reklama taxtalari → yo'lakchalar → old fon.
   Har bir qatlam o'z tezligida suriladi (parallaks); statik qatlamlar oldindan chizib qo'yiladi. */
var PX=34, TOP=204, BOT=346, SKEW=.26;
var CROWD=["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#ec4899","#06b6d4","#f97316","#e5e7eb","#1f2937","#84cc16","#eab308","#14b8a6"];
var BOARDS=[["TerDU","#1d4ed8","#3b82f6"],["TADBIRKORLIK ASOSLARI","#7c3aed","#a855f7"],["YOZUV MARAFONI","#db2777","#f472b6"],
  ["TEZ · ANIQ · TO'G'RI","#ea580c","#fb923c"],["O'YIN ARENASI","#059669","#34d399"],["BILIM — KUCH","#0891b2","#22d3ee"],["KLAVIATURA USTASI","#4338ca","#818cf8"]];
function mkTile(sc,w,h,fn){ var t=document.createElement("canvas"); t.width=Math.max(1,Math.ceil(w*sc)); t.height=Math.max(1,Math.ceil(h*sc));
  var c=t.getContext("2d"); c.scale(sc,sc); fn(c,w,h); return {cv:t,w:w,h:h}; }
function tCity(c,w,h,night){
  var R=srng(77), far=night?"#18233f":"#b9d3ec", near=night?"#203055":"#98bcdd", win=night?"rgba(255,213,122,.9)":"rgba(255,255,255,.4)";
  c.fillStyle=far; var x=0;
  while(x<w){ var bw=26+R()*54, bh=26+R()*52; if(x+bw>w) bw=w-x; c.fillRect(x,h-bh,Math.max(1,bw-3),bh); x+=bw; }
  c.fillStyle=near;
  function dome(x0,col){ /* madrasa: peshtoq, gumbaz va ikki minora */
    c.fillStyle=near; c.fillRect(x0,h-42,128,42); c.fillRect(x0+46,h-64,36,64);
    c.fillStyle=col; c.beginPath(); c.arc(x0+64,h-64,21,Math.PI,0); c.fill(); c.fillRect(x0+43,h-66,42,4);
    c.fillStyle=near; c.fillRect(x0+4,h-86,8,86); c.fillRect(x0+116,h-86,8,86);
    c.beginPath(); c.arc(x0+8,h-86,5.5,Math.PI,0); c.arc(x0+120,h-86,5.5,Math.PI,0); c.fill();
    c.fillStyle=night?"rgba(255,213,122,.55)":"rgba(255,255,255,.35)"; c.beginPath(); c.arc(x0+64,h-30,9,Math.PI,0); c.fill(); c.fillRect(x0+55,h-30,18,30);
  }
  dome(70,night?"#1e3a8a":"#3b82c4");
  /* teleminora */
  c.fillStyle=near; c.beginPath(); c.moveTo(428,h); c.lineTo(436,h-104); c.lineTo(440,h-104); c.lineTo(448,h); c.fill();
  c.fillRect(437,h-126,2.4,24); c.beginPath(); c.ellipse(438,h-84,11,6.5,0,0,6.2832); c.fill(); c.beginPath(); c.ellipse(438,h-58,8,4.5,0,0,6.2832); c.fill();
  if(night){ c.fillStyle="#ff4d4d"; c.beginPath(); c.arc(438,h-127,2,0,6.2832); c.fill(); }
  /* zamonaviy binolar */
  [[600,34,92],[640,30,70],[676,40,108],[722,28,64]].forEach(function(b){
    c.fillStyle=near; c.fillRect(b[0],h-b[2],b[1],b[2]); c.fillRect(b[0]+b[1]/2-1,h-b[2]-12,2,12);
    c.fillStyle=win; for(var yy=h-b[2]+6;yy<h-6;yy+=8) for(var xx=b[0]+4;xx<b[0]+b[1]-4;xx+=7) if(R()<(night?.45:.8)) c.fillRect(xx,yy,3.2,4); });
  dome(860,night?"#134e4a":"#2a9d8f");
  /* boshqa uylar derazalari (kechasi) */
  if(night){ c.fillStyle=win; for(var i=0;i<140;i++) c.fillRect(R()*w,h-R()*40,2.4,3); }
}
function tStands(c,w,h,night,fr){
  var R=srng(4242), A=srng(99+fr*7);
  /* projektor ustunlari */
  [150,630].forEach(function(mx){
    c.fillStyle=night?"#334155":"#94a3b8"; c.fillRect(mx-2,6,4,62);
    c.fillStyle=night?"#1e293b":"#e2e8f0"; rr(c,mx-21,0,42,17,3); c.fill();
    c.fillStyle=night?"#fff6d1":"#f8fafc"; for(var i=0;i<5;i++) for(var j=0;j<2;j++){ c.beginPath(); c.arc(mx-15+i*7.5,4.5+j*7.5,2.7,0,6.2832); c.fill(); }
  });
  /* tom */
  c.fillStyle=night?"#0b1220":"#334155"; c.fillRect(0,66,w,7);
  c.fillStyle=night?"#16213a":"#64748b"; c.fillRect(0,73,w,4);
  c.fillStyle=night?"#0b1220":"#475569"; for(var sx=60;sx<w;sx+=120) c.fillRect(sx,77,2,8);
  /* o'rindiqlar va tomoshabinlar (7 qator) */
  c.fillStyle=night?"#0e1a36":"#1e3a8a"; c.fillRect(0,77,w,84);
  for(var r=0;r<7;r++){
    var y=88+r*10.6, k=.92+r*.035;
    c.fillStyle=night?(r%2?"#13254a":"#182c57"):(r%2?"#1d4ed8":"#2563eb"); c.fillRect(0,y-4.5,w,6);
    for(var x=4+(r%2)*3.9;x<w-3;x+=7.8){
      var xr=x+(R()-.5)*1.4;
      if(xr%240<18){ R(); R(); continue; }              /* zinapoya */
      if(R()<.16){ R(); continue; }                     /* bo'sh joy */
      var shirt=CROWD[Math.floor(R()*CROWD.length)], skin=SKIN[Math.floor(R()*SKIN.length)];
      if(xr>300&&xr<420) shirt=(r+Math.floor(xr/8))%2?"#f8fafc":"#2563eb";   /* muxlislar sektori */
      if(night){ shirt=shade(shirt,-.45); skin=shade(skin,-.35); }
      var up=fr&&A()<.38, hy=up?-1.4:0;
      if(up){ c.strokeStyle=skin; c.lineWidth=1.6*k; c.beginPath(); c.moveTo(xr-2.4*k,y-5*k); c.lineTo(xr-4.6*k,y-12.5*k); c.moveTo(xr+2.4*k,y-5*k); c.lineTo(xr+4.6*k,y-12.5*k); c.stroke(); }
      c.fillStyle=shirt; rr(c,xr-3.3*k,y-6.2*k+hy,6.6*k,7*k,2.2*k); c.fill();
      c.fillStyle=skin; c.beginPath(); c.arc(xr,y-8.6*k+hy,2.6*k,0,6.2832); c.fill();
      if(R()<.55){ c.fillStyle=night?"#0b0b0f":"#2b1d14"; c.beginPath(); c.arc(xr,y-9.2*k+hy,2.65*k,Math.PI,0); c.fill(); }
    }
  }
  /* zinapoyalar */
  c.fillStyle=night?"rgba(148,163,184,.18)":"rgba(226,232,240,.55)";
  for(var z=0;z<w;z+=240){ c.fillRect(z+2,78,13,83); }
  /* old devor va bannerlar */
  c.fillStyle=night?"#0b3b3a":"#0f766e"; c.fillRect(0,160,w,10);
  c.fillStyle="rgba(255,255,255,.85)"; c.fillRect(0,160,w,1.4);
  [["OLG'A!",80,"#f43f5e"],["ZO'R!",520,"#f59e0b"],["TerDU",820,"#2563eb"]].forEach(function(b){
    c.fillStyle=night?shade(b[2],-.35):b[2]; rr(c,b[1],145,58,14,2); c.fill();
    c.fillStyle="#fff"; c.font="900 9px system-ui,Arial,sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(b[0],b[1]+29,152.5); });
}
function tBoards(c,w,h,night){
  var pw=w/BOARDS.length;
  BOARDS.forEach(function(b,i){
    var g=c.createLinearGradient(i*pw,0,i*pw+pw,0); g.addColorStop(0,night?shade(b[1],-.35):b[1]); g.addColorStop(1,night?shade(b[2],-.35):b[2]);
    c.fillStyle=g; c.fillRect(i*pw,0,pw-2,h);
    c.fillStyle="rgba(255,255,255,.95)"; c.font="900 9.5px system-ui,Arial,sans-serif"; c.textAlign="center"; c.textBaseline="middle";
    c.fillText(b[0],i*pw+pw/2,h/2+.5);
  });
  c.fillStyle="rgba(0,0,0,.25)"; c.fillRect(0,h-2,w,2);
}
function tTrack(c,w,h,night){
  var g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,night?"#6e2a1f":"#b0432d"); g.addColorStop(1,night?"#8a3826":"#cf5a3c");
  c.fillStyle=g; c.fillRect(0,0,w,h);
  var R=srng(5);
  for(var i=0;i<900;i++){ c.fillStyle=R()<.5?"rgba(255,255,255,.05)":"rgba(0,0,0,.07)"; c.fillRect(R()*w,R()*h,1.2,1.2); }
}
function tFg(c,w,h,night){
  var R=srng(31), g=c.createLinearGradient(0,0,0,h);
  g.addColorStop(0,night?"#14532d":"#3aa655"); g.addColorStop(1,night?"#0c3a20":"#2a8a43");
  c.fillStyle=g; c.fillRect(0,6,w,h-6);
  for(var i=0;i<520;i++){ var x=R()*w, y=8+R()*(h-8); c.strokeStyle=R()<.5?(night?"#1f6b3a":"#4cc06a"):(night?"#0e3f22":"#23803c");
    c.lineWidth=1; c.beginPath(); c.moveTo(x,y); c.lineTo(x+(R()-.5)*3,y-3-R()*5); c.stroke(); }
  /* old fondagi narsalar: telekamera, butalar, gullar */
  function bush(x){ c.fillStyle=night?"#0f4a28":"#2f9e4f"; [[0,0,13],[12,-4,11],[24,1,12],[10,6,10]].forEach(function(b){ c.beginPath(); c.arc(x+b[0],14+b[1],b[2],0,6.2832); c.fill(); }); }
  bush(420); bush(1210);
  var cx=820; c.strokeStyle=night?"#475569":"#334155"; c.lineWidth=2; c.beginPath(); c.moveTo(cx,4); c.lineTo(cx-10,h); c.moveTo(cx,4); c.lineTo(cx+10,h); c.moveTo(cx,4); c.lineTo(cx,h); c.stroke();
  c.fillStyle=night?"#334155":"#1f2937"; rr(c,cx-14,-12,26,15,3); c.fill(); c.fillStyle="#0f172a"; c.fillRect(cx+12,-9,8,9);
  c.fillStyle=night?"#f87171":"#ef4444"; c.beginPath(); c.arc(cx-9,-8,1.6,0,6.2832); c.fill();
  for(var f=0;f<40;f++){ c.fillStyle=["#f43f5e","#facc15","#ffffff","#a855f7"][f%4]; c.beginPath(); c.arc(R()*w,10+R()*(h-12),1.3,0,6.2832); c.fill(); }
}
function tCloud(c,w,h,night){
  var col=night?"rgba(148,163,200,.32)":"rgba(255,255,255,.95)", sh=night?"rgba(60,70,110,.25)":"rgba(186,214,240,.9)";
  [[30,30,16],[52,22,20],[76,28,17],[98,32,13],[62,34,15]].forEach(function(b){ c.fillStyle=sh; c.beginPath(); c.arc(b[0],b[1]+3,b[2],0,6.2832); c.fill(); });
  [[30,28,16],[52,20,20],[76,26,17],[98,30,13],[62,32,15]].forEach(function(b){ c.fillStyle=col; c.beginPath(); c.arc(b[0],b[1],b[2],0,6.2832); c.fill(); });
}
function tStars(c,w,h){ var R=srng(9); for(var i=0;i<160;i++){ var a=.3+R()*.7; c.fillStyle="rgba(255,255,255,"+a+")"; c.beginPath(); c.arc(R()*w,R()*h,R()<.1?1.3:.7,0,6.2832); c.fill(); } }

function mkScene(cv,opt){
  opt=opt||{};
  var S={cv:cv,c:cv.getContext("2d"),W:0,H:0,k:1,dpr:1,Wu:0,cam:opt.cam0==null?-150:opt.cam0,t:0,night:null,T:null,
    rs:[],dust:[],conf:[],flash:[],len:opt.len||6000,mode:opt.mode||"fin",nl:opt.lanes||6,marks:opt.marks||[],
    go:false,set:false,ready:opt.ready!==false,tapeT:0,demo:!!opt.demo,mini:opt.mini!==false,follow:null,followAt:opt.followAt||.36,
    crowdT:0,hype:0,tags:opt.tags!==false,podium:null,fs:11,clouds:[],dead:false};
  var R0=srng(17);
  for(var i=0;i<6;i++) S.clouds.push({x:R0()*1400,y:22+R0()*70,s:.55+R0()*.7,v:3+R0()*6});
  S.sx=function(wx,y){ return wx-S.cam+(BOT-y)*SKEW; };
  S.laneH=function(){ return (BOT-TOP)/S.nl; };
  S.laneY=function(i){ return TOP+S.laneH()*(i+.74); };
  S.laneS=function(i){ return (.8+.18*(S.nl>1?i/(S.nl-1):1))*(S.nl>6?.9:1); };
  S.resize=function(){
    var r=cv.getBoundingClientRect(), W=Math.max(1,Math.round(r.width)), H=Math.max(1,Math.round(r.height)), dpr=Math.min(2,window.devicePixelRatio||1);
    if(W===S.W&&H===S.H&&dpr===S.dpr) return;
    S.W=W; S.H=H; S.dpr=dpr; S.k=H/360; S.Wu=W/S.k; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); S.T=null;
    S.fs=clamp(11*S.k,9.5,12.5)/S.k;
  };
  S.build=function(){
    var sc=S.k*S.dpr, n=S.night;
    S.T={city:mkTile(sc,1100,130,function(c,w,h){ tCity(c,w,h,n); }),
      st:[mkTile(sc,960,170,function(c,w,h){ tStands(c,w,h,n,0); }),mkTile(sc,960,170,function(c,w,h){ tStands(c,w,h,n,1); })],
      bd:mkTile(sc,1400,16,function(c,w,h){ tBoards(c,w,h,n); }),
      tr:mkTile(sc,256,BOT-TOP,function(c,w,h){ tTrack(c,w,h,n); }),
      fg:mkTile(sc,1600,34,function(c,w,h){ tFg(c,w,h,n); }),
      cl:mkTile(sc,124,56,function(c,w,h){ tCloud(c,w,h,n); }),
      sr:n?mkTile(sc,900,200,tStars):null};
    var c=S.c, g=c.createLinearGradient(0,0,0,TOP);
    if(n){ g.addColorStop(0,"#060a1c"); g.addColorStop(.6,"#132250"); g.addColorStop(1,"#26406f"); }
    else { g.addColorStop(0,"#56aefc"); g.addColorStop(.55,"#9dd2ff"); g.addColorStop(1,"#e2f3ff"); }
    S.sky=g;
  };
  /* bir qatlamni gorizontal takrorlab chizish */
  function band(tl,f,y){ if(!tl) return; var w=tl.w, off=-(((S.cam*f)%w)+w)%w; for(var x=off;x<S.Wu;x+=w) S.c.drawImage(tl.cv,x,y,w+.6,tl.h); }
  S.add=function(r){
    r.x=r.x==null?-20:r.x; r.tx=r.tx==null?r.x:r.tx; r.vs=0; r.ph=Math.random()*6; r.pose="crouch"; r.idleT=0; r.stum=0;
    r.ly=S.laneY(r.lane||0); r.al=r.al==null?1:r.al; r.seed=Math.random()*10; S.rs.push(r); return r;
  };
  S.dustAt=function(r,sp){
    if(S.dust.length>180) return;
    var n=1+Math.round(sp*4), s=S.laneS(r.lane||0);
    for(var i=0;i<n;i++) S.dust.push({x:r.x+(Math.random()*12-4)*s,y:r.ly-1,vx:-(14+Math.random()*34)*s,vy:-(10+Math.random()*18)*s,r:(1.6+Math.random()*2.6*(.6+sp))*s,life:0,max:.4+Math.random()*.35});
  };
  S.burst=function(x,y,n){ for(var i=0;i<(n||90);i++) S.conf.push({x:x,y:y,vx:rnd(-170,170),vy:rnd(-300,-80),w:rnd(3,6),h:rnd(5,9),r:rnd(0,6),vr:rnd(-9,9),c:pick(CROWD),life:0,max:rnd(2.2,3.6)}); };
  S.rain=function(n){ for(var i=0;i<(n||120);i++) S.conf.push({x:rnd(0,S.Wu),y:rnd(-200,-10),vx:rnd(-30,30),vy:rnd(40,140),w:rnd(3,6),h:rnd(5,9),r:rnd(0,6),vr:rnd(-7,7),c:pick(CROWD),life:0,max:rnd(3,5)}); };
  S.cheer=function(v){ S.hype=Math.max(S.hype,v||1); };
  S.step=function(dt){
    S.t+=dt; S.hype=Math.max(0,S.hype-dt*.25); S.crowdT+=dt*(1.2+S.hype*6);
    S.rs.forEach(function(r){
      var k=1-Math.exp(-dt*6.5), nx=r.x+(r.tx-r.x)*k, v=(nx-r.x)/Math.max(dt,.001);
      r.vs+=(v-r.vs)*Math.min(1,dt*5); r.x=nx;
      var cps=Math.max(0,r.vs/PX), sp=clamp(cps/7,0,1);
      if(!S.go&&!S.demo) r.pose=S.set?"set":(S.ready?"crouch":"idle");
      else if(r.win) r.pose="win";
      else if(cps>.3){ r.pose=r.stum>0?"stumble":"run"; r.idleT=0; }
      else { r.idleT+=dt; if(r.idleT>.45) r.pose="idle"; }
      var w=(r.pose==="run"||r.pose==="stumble")?Math.PI*2*(.9+2.4*sp):0, old=r.ph;
      r.ph+=w*dt; r.sp=sp; r.stum=Math.max(0,r.stum-dt);
      if(w>0&&Math.floor(old/Math.PI)!==Math.floor(r.ph/Math.PI)&&!r.ghost) S.dustAt(r,sp);
      r.ly+=(S.laneY(r.lane||0)-r.ly)*Math.min(1,dt*4);
    });
    if(S.follow){ var tx=S.follow.x-S.Wu*(S.Wu<620&&!S.demo?.28:S.followAt); if(!S.demo) tx=Math.max(tx,-S.Wu*.22); S.cam+=(tx-S.cam)*(1-Math.exp(-dt*4.5)); }
    for(var i=S.dust.length-1;i>=0;i--){ var d=S.dust[i]; d.life+=dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.vy+=40*dt; d.vx*=.97; if(d.life>d.max) S.dust.splice(i,1); }
    for(var j=S.conf.length-1;j>=0;j--){ var p=S.conf[j]; p.life+=dt; p.vy+=380*dt; p.vy=Math.min(p.vy,160); p.vx*=.99; p.x+=p.vx*dt; p.y+=p.vy*dt; p.r+=p.vr*dt; if(p.life>p.max||p.y>380) S.conf.splice(j,1); }
    if(Math.random()<dt*(S.night?2.2:.9)*(1+S.hype*5)) S.flash.push({x:rnd(0,S.Wu),y:rnd(96,176),life:0});
    for(var f=S.flash.length-1;f>=0;f--){ S.flash[f].life+=dt; if(S.flash[f].life>.16) S.flash.splice(f,1); }
  };
  S.draw=function(){
    var night=document.documentElement.getAttribute("data-theme")==="dark";
    if(night!==S.night){ S.night=night; S.T=null; }
    if(!S.T) S.build();
    var c=S.c, Wu=S.Wu, T=S.T;
    c.setTransform(S.dpr*S.k,0,0,S.dpr*S.k,0,0);
    /* osmon */
    c.fillStyle=S.sky; c.fillRect(0,0,Wu,TOP);
    if(T.sr) band(T.sr,.02,0);
    if(night){ c.fillStyle="#eef2ff"; c.beginPath(); c.arc(Wu*.82,46,13,0,6.2832); c.fill(); c.fillStyle="rgba(148,163,184,.35)"; c.beginPath(); c.arc(Wu*.82-4,43,3,0,6.2832); c.arc(Wu*.82+4,50,2,0,6.2832); c.fill(); }
    else { var sg=c.createRadialGradient(Wu*.8,50,6,Wu*.8,50,70); sg.addColorStop(0,"rgba(255,248,214,.95)"); sg.addColorStop(.25,"rgba(255,240,180,.55)"); sg.addColorStop(1,"rgba(255,240,180,0)");
      c.fillStyle=sg; c.fillRect(Wu*.8-70,0,140,130); c.fillStyle="#fff7d1"; c.beginPath(); c.arc(Wu*.8,50,17,0,6.2832); c.fill(); }
    S.clouds.forEach(function(cl){ var span=Wu+300, x=((cl.x-S.cam*.04-S.t*cl.v)%span+span)%span-150; c.drawImage(T.cl.cv,x,cl.y,124*cl.s,56*cl.s); });
    band(T.city,.1,8);
    var fr=Math.floor(S.crowdT)%2; band(T.st[fr],.35,20);
    /* kechasi projektorlar nuri */
    if(night){
      c.save(); c.globalCompositeOperation="lighter";
      [150,630].forEach(function(mx){ var span=960, off=-(((S.cam*.35)%span)+span)%span;
        for(var x=off+mx;x<Wu+80;x+=span){ if(x<-80) continue;
          var g=c.createRadialGradient(x,28,2,x,28,46); g.addColorStop(0,"rgba(255,246,210,.75)"); g.addColorStop(1,"rgba(255,246,210,0)"); c.fillStyle=g; c.fillRect(x-46,-18,92,92);
          var g2=c.createLinearGradient(0,30,0,330); g2.addColorStop(0,"rgba(255,244,200,.10)"); g2.addColorStop(1,"rgba(255,244,200,0)");
          c.fillStyle=g2; c.beginPath(); c.moveTo(x-16,32); c.lineTo(x+16,32); c.lineTo(x+150,346); c.lineTo(x-150,346); c.closePath(); c.fill(); } });
      c.restore();
    }
    S.flash.forEach(function(f){ var a=1-f.life/.16; c.fillStyle="rgba(255,255,255,"+a+")"; c.beginPath(); c.arc(f.x,f.y,1.8+a*1.5,0,6.2832); c.fill();
      c.fillStyle="rgba(255,255,255,"+a*.25+")"; c.beginPath(); c.arc(f.x,f.y,6,0,6.2832); c.fill(); });
    band(T.bd,1,188);
    if(S.podium){ drawPodium(S); return; }
    /* yo'lakchalar */
    band(T.tr,1,TOP);
    var lh=S.laneH();
    c.strokeStyle="rgba(255,255,255,.82)";
    for(var i=0;i<=S.nl;i++){ var y=TOP+i*lh; c.lineWidth=(i===0||i===S.nl)?2.2:1.2; c.beginPath(); c.moveTo(0,y); c.lineTo(Wu,y); c.stroke(); }
    if(!S.demo) drawLines(S,lh);
    /* yuguruvchilar: orqadagi yo'lakdan oldingisiga */
    var list=S.rs.filter(function(r){ return r.al>.02; }).sort(function(a,b){ return a.ly-b.ly; });
    list.forEach(function(r){
      var x=S.sx(r.x,r.ly), s=S.laneS(r.lane||0);
      if(x<-80||x>Wu+80) return;
      if(r.pose==="run"&&r.sp>.5){ c.strokeStyle="rgba(255,255,255,"+((r.sp-.5)*1.1)+")"; c.lineWidth=1.6;
        [34,46,58].forEach(function(h,j){ var l=(18+j*8)*r.sp; c.beginPath(); c.moveTo(x-22*s-l,r.ly-h*s); c.lineTo(x-22*s,r.ly-h*s); c.stroke(); }); }
      drawRunner(c,r.lk,{x:x,y:r.ly,s:s,pose:r.pose,ph:r.ph,sp:r.sp,t:S.t+r.seed,alpha:r.ghost?.42*r.al:r.al,num:r.num});
    });
    /* chang */
    var dc=night?"190,150,130":"226,176,140";
    S.dust.forEach(function(d){ var a=(1-d.life/d.max)*.55; c.fillStyle="rgba("+dc+","+a+")"; c.beginPath(); c.arc(S.sx(d.x,d.y),d.y,d.r*(1+d.life*1.6),0,6.2832); c.fill(); });
    band(T.fg,1.25,342);
    if(S.tags) list.forEach(function(r){ drawTag(S,r); });
    if(S.mini&&!S.demo&&S.rs.length) drawMini(S);
    if(!S.demo) drawEdges(S);
    drawConf(S);
  };
  /* o'lchamni har kadrda o'qimaslik uchun (majburiy layout — sekinlashtiradi) ResizeObserver ishlatiladi */
  S.fit=function(){ if(!S.ro&&(++S.fc)%30===0) S.resize(); };
  S.fc=0;
  if(window.ResizeObserver){ S.ro=new ResizeObserver(function(){ S.resize(); }); S.ro.observe(cv); }
  SCENES.push(S);
  S.resize();
  return S;
}
var SCENES=[];
/* start, marra, belgilar va lenta */
function drawLines(S,lh){
  var c=S.c, i;
  /* start chizig'i, yo'lak raqamlari va start bloklari */
  var x0=S.sx(0,TOP), x1=S.sx(0,BOT);
  if(x1>-60&&x0<S.Wu+60){
    c.fillStyle="#fff"; c.beginPath(); c.moveTo(x0,TOP); c.lineTo(x0+3.2,TOP); c.lineTo(x1+3.2,BOT); c.lineTo(x1,BOT); c.closePath(); c.fill();
    c.font="900 15px system-ui,Arial,sans-serif"; c.textAlign="center"; c.textBaseline="middle";
    for(i=0;i<S.nl;i++){ var ym=TOP+lh*(i+.5);
      c.fillStyle="rgba(255,255,255,.7)"; c.fillText(String(i+1),S.sx(-62,ym),ym);
      if(!S.go){ c.fillStyle="rgba(15,23,42,.65)"; var bx=S.sx(-34,ym+lh*.22); c.beginPath(); c.moveTo(bx,ym+lh*.22); c.lineTo(bx+9,ym+lh*.22); c.lineTo(bx+3,ym+lh*.22-6); c.closePath(); c.fill(); }
    }
  }
  /* oraliq belgilar */
  S.marks.forEach(function(m){
    var xm=S.sx(m.x,TOP); if(xm<-40||xm>S.Wu+40) return;
    c.strokeStyle="rgba(255,255,255,.55)"; c.lineWidth=1.4; c.setLineDash([5,5]); c.beginPath(); c.moveTo(xm,TOP); c.lineTo(S.sx(m.x,BOT),BOT); c.stroke(); c.setLineDash([]);
    c.fillStyle="#334155"; c.fillRect(xm-1,TOP-20,2,20);
    c.font="800 10px system-ui,Arial,sans-serif"; var tw=c.measureText(m.t).width+10;
    c.fillStyle="#fbbf24"; rr(c,xm-tw/2,TOP-33,tw,14,4); c.fill(); c.fillStyle="#111827"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(m.t,xm,TOP-25.6);
  });
  if(S.mode!=="fin") return;
  /* marra: shaxmat katakli chiziq, darvoza va lenta */
  var fx=S.len, a=S.sx(fx,TOP), b=S.sx(fx,BOT);
  if(b<-80||a>S.Wu+160) return;
  var rows=20, ch=(BOT-TOP)/rows;
  for(i=0;i<rows;i++) for(var j=0;j<2;j++){
    var y0=TOP+i*ch, y1=y0+ch, xa=S.sx(fx,y0)+j*5, xb=S.sx(fx,y1)+j*5;
    c.fillStyle=(i+j)%2?"#111827":"#ffffff"; c.beginPath(); c.moveTo(xa,y0); c.lineTo(xa+5,y0); c.lineTo(xb+5,y1); c.lineTo(xb,y1); c.closePath(); c.fill();
  }
  c.fillStyle="#cbd5e1"; c.fillRect(a-1.5,TOP-92,3.4,92);
  var g=c.createLinearGradient(a,0,a+118,0); g.addColorStop(0,"#dc2626"); g.addColorStop(1,"#f97316");
  c.fillStyle=g; rr(c,a-2,TOP-104,120,24,5); c.fill();
  for(i=0;i<3;i++) for(j=0;j<2;j++){ c.fillStyle=(i+j)%2?"#111827":"#fff"; c.fillRect(a+3+i*5,TOP-99+j*5,5,5); c.fillRect(a+98+i*5,TOP-99+j*5,5,5); }
  c.fillStyle="#fff"; c.font="900 13px system-ui,Arial,sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(L("MARRA","FINISH"),a+58,TOP-91.5);
  var yt=S.laneY(0)-30*S.laneS(0), yb=S.laneY(S.nl-1)-30*S.laneS(S.nl-1);
  if(!S.tapeT){ c.strokeStyle="#ef4444"; c.lineWidth=2.2; c.setLineDash([7,5]); c.beginPath(); c.moveTo(S.sx(fx,yt)+4,yt); c.lineTo(S.sx(fx,yb)+4,yb); c.stroke();
    c.strokeStyle="#fff"; c.lineDashOffset=6; c.beginPath(); c.moveTo(S.sx(fx,yt)+4,yt); c.lineTo(S.sx(fx,yb)+4,yb); c.stroke(); c.setLineDash([]); c.lineDashOffset=0; }
  else if(S.t-S.tapeT<2.2){ var k=Math.min(1,(S.t-S.tapeT)*2), sw=Math.sin(S.t*14)*4*(1-k*.6);
    c.strokeStyle="#ef4444"; c.lineWidth=2.2;
    c.beginPath(); c.moveTo(S.sx(fx,yt)+4,yt); c.quadraticCurveTo(S.sx(fx,yt)+16+sw,yt+10*k,S.sx(fx,yt)+8+sw,yt+26*k); c.stroke();
    c.beginPath(); c.moveTo(S.sx(fx,yb)+4,yb); c.quadraticCurveTo(S.sx(fx,yb)+18-sw,yb+8*k,S.sx(fx,yb)+12-sw,yb+24*k); c.stroke(); }
}
function drawTag(S,r){
  if(r.al<.3||r.noTag) return;
  var c=S.c, x=S.sx(r.x,r.ly), s=S.laneS(r.lane||0); if(x<-60||x>S.Wu+60) return;
  var txt=r.tagTxt||firstName(r.n), fs=S.fs, low=r.pose==="crouch"||r.pose==="set", y=r.ly-(low?60:104)*s-(r.pose==="win"?14*s:0);
  c.font="800 "+fs+"px system-ui,Arial,sans-serif";
  if(r._tw==null||r._tt!==txt||r._tf!==fs){ r._tw=c.measureText(txt).width; r._tt=txt; r._tf=fs; }
  var w=r._tw+fs*1.2, h=fs*1.6, bg=r.ghost?"rgba(148,163,184,.75)":(r.me?"#fbbf24":rgba(r.lk.jer,.92));
  c.globalAlpha=r.al*(r.ghost?.8:1);
  c.fillStyle="rgba(0,0,0,.18)"; rr(c,x-w/2+1,y-h+2,w,h,h/2); c.fill();
  c.fillStyle=bg; rr(c,x-w/2,y-h,w,h,h/2); c.fill();
  c.beginPath(); c.moveTo(x-4,y-.5); c.lineTo(x+4,y-.5); c.lineTo(x,y+4.5); c.closePath(); c.fill();
  if(r.me){ c.strokeStyle="#fff"; c.lineWidth=1.6; rr(c,x-w/2,y-h,w,h,h/2); c.stroke(); }
  c.fillStyle=r.me||r.ghost?"#111827":(lum(r.lk.jer)>.62?"#111827":"#fff"); c.textAlign="center"; c.textBaseline="middle"; c.fillText(txt,x,y-h/2+.5);
  c.globalAlpha=1;
}
/* tepadagi kichik xarita: hamma yuguruvchining masofasi */
function drawMini(S){
  var c=S.c, w=Math.min(S.Wu*.56,460), x0=(S.Wu-w)/2, y0=12, list=S.rs.filter(function(r){ return !r.hideMini; });
  var span=S.len;
  if(S.mode!=="fin"){ var mx=0; list.forEach(function(r){ mx=Math.max(mx,r.x); }); span=Math.max(PX*60,mx*1.15); }
  c.fillStyle="rgba(15,23,42,.5)"; rr(c,x0-14,y0-7,w+28,20,10); c.fill();
  c.fillStyle="rgba(255,255,255,.25)"; rr(c,x0,y0+1,w,4,2); c.fill();
  c.fillStyle="#22c55e"; c.fillRect(x0-1,y0-3,2.5,12);
  if(S.mode==="fin") for(var i=0;i<2;i++) for(var j=0;j<3;j++){ c.fillStyle=(i+j)%2?"#111827":"#fff"; c.fillRect(x0+w-2+i*3,y0-3+j*4,3,4); }
  list.slice().sort(function(a,b){ return (a.me?1:0)-(b.me?1:0); }).forEach(function(r){
    var p=clamp((r.x+20)/span,0,1), x=x0+p*w, rad=r.me?5.6:3.8;
    c.globalAlpha=r.ghost?.6:1;
    c.fillStyle=r.ghost?"#94a3b8":r.lk.jer; c.beginPath(); c.arc(x,y0+3,rad,0,6.2832); c.fill();
    c.strokeStyle=r.me?"#fbbf24":"rgba(255,255,255,.9)"; c.lineWidth=r.me?2.2:1.2; c.stroke();
    c.globalAlpha=1;
  });
}
/* ekrandan tashqaridagi yuguruvchilar: chetda ko'rsatkich */
function drawEdges(S){
  var c=S.c;
  S.rs.forEach(function(r){
    if(r.al<.3||r.ghost&&!r.edge) return;
    var x=S.sx(r.x,r.ly), right=x>S.Wu+18, left=x<-18; if(!right&&!left) return;
    var d=Math.round(Math.abs(r.x-(S.follow?S.follow.x:0))/PX), txt=(left?"◀ ":"")+firstName(r.n)+" "+(left?"−":"+")+d+(right?" ▶":"");
    c.font="800 "+(S.fs*.92)+"px system-ui,Arial,sans-serif"; var w=c.measureText(txt).width+12, h=S.fs*1.5, y=r.ly-46*S.laneS(r.lane||0);
    var bx=right?S.Wu-w-6:6;
    c.fillStyle=rgba(r.lk.jer,.9); rr(c,bx,y-h/2,w,h,h/2); c.fill();
    c.fillStyle=lum(r.lk.jer)>.62?"#111827":"#fff"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(txt,bx+w/2,y+.5);
  });
}
function drawConf(S){
  var c=S.c;
  S.conf.forEach(function(p){ var a=Math.min(1,(p.max-p.life)*1.5); c.globalAlpha=a; c.save(); c.translate(p.x,p.y); c.rotate(p.r); c.fillStyle=p.c; c.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.r*1.7))+1); c.restore(); });
  c.globalAlpha=1;
}
/* natija: shohsupa (2-1-3) */
function drawPodium(S){
  var c=S.c, Wu=S.Wu, P=S.podium, cx=Wu/2, bw=Math.min(150,Wu*.27), base=346;
  c.fillStyle=S.night?"#0f3d21":"#2f9e4f"; c.fillRect(0,TOP,Wu,360-TOP);
  c.fillStyle=S.night?"#14532d":"#3aa655"; for(var x=0;x<Wu;x+=46){ c.fillRect(x,TOP,23,360-TOP); }
  var spots=[{p:2,x:cx-bw,h:70,col:"#cbd5e1",d:"#94a3b8"},{p:1,x:cx,h:100,col:"#fbbf24",d:"#d97706"},{p:3,x:cx+bw,h:50,col:"#f59e0b",d:"#b45309"}];
  spots.forEach(function(sp){
    var top=base-sp.h;
    c.fillStyle="rgba(0,0,0,.2)"; c.fillRect(sp.x-bw/2+6,top+6,bw,sp.h);
    var g=c.createLinearGradient(0,top,0,base); g.addColorStop(0,sp.col); g.addColorStop(1,sp.d);
    c.fillStyle=g; c.fillRect(sp.x-bw/2,top,bw,sp.h);
    c.fillStyle="rgba(255,255,255,.35)"; c.fillRect(sp.x-bw/2,top,bw,5);
    c.fillStyle="rgba(255,255,255,.95)"; c.font="900 30px system-ui,Arial,sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(String(sp.p),sp.x,top+sp.h/2+4);
    var r=P[sp.p-1]; if(!r) return;
    drawRunner(c,r.lk,{x:sp.x-8,y:top,s:Math.min(1.25,bw/105),pose:sp.p===1?"win":"wave",ph:0,sp:0,t:S.t+sp.p*.7,medal:sp.p,num:r.num});
  });
  drawConf(S);
}

/* ================== 7. YOZISH MEXANIKASI ==================
   TypeRacer uslubi: maydonga joriy so'z yoziladi. To'g'ri harflar yashil, xato — qizil;
   so'z faqat to'liq to'g'ri yozilib, bo'shliq bosilganda qabul qilinadi (xato tuzatilmaguncha oldinga o'tilmaydi). */
function mkTyper(T,box,inp,h){
  var Y={T:T,wi:0,v:"",raw:"",m:0,err:false,ok:0,bad:0,miss:{},on:false,done:false,t0:0,tEnd:0,lastWarn:0,lastLay:0};
  function segN(){ return Y.wi<T.nw?nstr(segOf(T,Y.wi)):""; }
  function cur(){
    var sg=segOf(T,Y.wi), v=Y.v, o="";
    for(var j=0;j<sg.length;j++){
      var cl=j<Y.m?"c ok":(j<v.length?"c bad":"c");
      if(j===v.length) cl+=" cur";
      o+='<span class="'+cl+'">'+esc(sg.charAt(j))+'</span>';
    }
    if(v.length>=sg.length&&Y.raw.length>sg.length) o+='<span class="c bad x">'+esc(Y.raw.slice(sg.length))+'</span>';
    if(v.length>=sg.length) o+='<span class="c cur x0">​</span>';
    return o;
  }
  Y.render=function(){
    var a=Math.max(0,Y.wi-30), b=Math.min(T.nw,Y.wi+140), o=a>0?'<span class="w more">… </span>':'';
    for(var i=a;i<b;i++){
      if(i<Y.wi) o+='<span class="w ok">'+esc(segOf(T,i))+'</span>';
      else if(i>Y.wi) o+='<span class="w">'+esc(segOf(T,i))+'</span>';
      else o+='<span class="w cur" id="yzCur">'+cur()+'</span>';
    }
    if(b<T.nw) o+='<span class="w more"> …</span>';
    Y.a=a; Y.b=b; box.innerHTML=o; Y.scroll();
  };
  Y.paint=function(){ var c=$("yzCur"); if(c) c.innerHTML=cur(); };
  Y.scroll=function(){
    var c=$("yzCur"); if(!c) return;
    var lh=parseFloat(getComputedStyle(box).lineHeight)||28, few=box.clientHeight<lh*3.4;
    var tg=Math.max(0,c.offsetTop-(few?6:lh+4));
    if(Math.abs(box.scrollTop-tg)>3){ try{ box.scrollTo({top:tg,behavior:"smooth"}); }catch(e){ box.scrollTop=tg; } }
  };
  /* to'g'ri yozilgan belgilar (yuguruvchi shu bo'yicha yuradi) */
  Y.chars=function(){ return Y.wi>=T.nw?T.n:(T.st[Y.wi]+Math.min(Y.m,T.w[Y.wi].length)); };
  Y.stats=function(tn){
    var el=Math.max(1,(Y.done?Y.tEnd:tn)-Y.t0), pc=Y.chars();
    var wEq=Y.wi+(Y.wi<T.nw?Math.min(Y.m,T.w[Y.wi].length)/Math.max(1,T.w[Y.wi].length):0);
    return {el:el,chars:pc,words:Y.wi,wEq:wEq,wpm:el>1500?wEq*60000/el:0,cpm:el>1500?pc*60000/el:0,
      acc:(Y.ok+Y.bad)?Math.round(Y.ok*1000/(Y.ok+Y.bad))/10:100,prog:pc/T.n};
  };
  Y.start=function(t0){ Y.on=true; Y.t0=t0; inp.value=""; Y.v=""; Y.raw=""; inp.disabled=false; inp.classList.remove("err"); };
  Y.stop=function(){ Y.on=false; inp.blur(); };
  function onInput(){
    if(!Y.on||Y.done){ if(inp.value){ inp.value=""; if(h.early) h.early(); } return; }
    var raw=inp.value, nv=nstr(raw), old=Y.v, sg=segN();
    /* bir urinishda 2 tadan ko'p belgi (avtomatik to'ldirish, qo'yish) yoki juda uzun xato — qabul qilinmaydi */
    if((nv.length-old.length>2&&nv.indexOf(old)===0)||nv.length>sg.length+8){
      inp.value=Y.raw;
      if(now()-Y.lastWarn>2500){ Y.lastWarn=now(); toast(L("Harflarni bittadan yozing — avtomatik to'ldirish hisobga olinmaydi","Type letter by letter — autocomplete is not counted")); }
      return;
    }
    var errNew=false;
    if(nv.length>old.length&&nv.slice(0,old.length)===old){
      var m0=0; while(m0<old.length&&m0<sg.length&&old.charAt(m0)===sg.charAt(m0)) m0++;
      for(var j=old.length;j<nv.length;j++){
        var good=(j<sg.length&&j===m0&&nv.charAt(j)===sg.charAt(j));
        if(good){ Y.ok++; m0++; }
        else {
          Y.bad++;
          if(j===m0&&!errNew){ var ex=j<sg.length?segOf(T,Y.wi).charAt(j):"⎵"; ex=ex===" "?"⎵":ex; Y.miss[ex]=(Y.miss[ex]||0)+1; errNew=true;
            if(now()-Y.lastLay>4000&&CYR.test(raw.charAt(j))){ Y.lastLay=now();
              if(h.hint) h.hint(L("⌨️ Klaviaturani lotin (EN) tiliga o'tkazing","⌨️ Switch the keyboard to Latin")); } }
        }
      }
    }
    Y.v=nv; Y.raw=raw;
    /* to'liq to'g'ri yozilgan so'zlarni qabul qilish */
    var moved=0;
    while(Y.wi<T.nw){ var s2=segN(); if(s2&&Y.v.slice(0,s2.length)===s2){ Y.v=Y.v.slice(s2.length); Y.raw=Y.raw.slice(s2.length); Y.wi++; moved++; } else break; }
    var s3=segN(), m=0; while(m<Y.v.length&&m<s3.length&&Y.v.charAt(m)===s3.charAt(m)) m++;
    Y.m=m; Y.err=Y.v.length>m;
    if(moved){ inp.value=Y.raw; if(Y.wi>=T.nw){ Y.done=true; Y.tEnd=now(); Y.m=0; Y.render(); inp.disabled=true; inp.classList.remove("err"); if(h.done) h.done(); return; }
      if(moved>1||Y.wi>=Y.b-40||Y.wi<Y.a) Y.render(); else { var pc=$("yzCur"); if(pc){ pc.removeAttribute("id"); pc.className="w ok"; pc.textContent=segOf(T,Y.wi-moved); }
        var all=box.querySelectorAll(".w"), idx=Y.wi-Y.a+(Y.a>0?1:0); if(all[idx]){ all[idx].className="w cur"; all[idx].id="yzCur"; } Y.paint(); Y.scroll(); }
      if(h.word) h.word(); }
    else Y.paint();
    inp.classList.toggle("err",Y.err);
    if(errNew&&h.err) h.err(); else if(nv.length>old.length&&!Y.err&&h.key) h.key();
    if(h.prog) h.prog();
  }
  inp.addEventListener("input",onInput);
  inp.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key==="Tab"){ e.preventDefault(); } });
  ["paste","drop","cut"].forEach(function(ev){ inp.addEventListener(ev,function(e){ e.preventDefault(); if(ev!=="cut") toast(L("Matnni qo'yib bo'lmaydi — o'zingiz yozing 🙂","Pasting is not allowed — type it yourself 🙂")); }); });
  inp.addEventListener("beforeinput",function(e){ var t=e.inputType||""; if(t==="insertFromPaste"||t==="insertFromDrop"||t==="insertReplacementText"||t==="insertFromYank") e.preventDefault(); });
  box.addEventListener("click",function(){ if(!inp.disabled) inp.focus(); });
  Y.render();
  return Y;
}

/* ================== 8. POYGA (umumiy holat) ================== */
var RC=null;           /* joriy poyga */
/* o'qituvchi ochmaguncha mashq yopiq: /kahoot/cfg/yz === true bo'lsagina ochiq.
   Yopiq paytda ham o'qituvchi tuzgan jonli poygaga qo'shilish mumkin. */
var OPEN=false;
function lockCheck(cb){
  if(!X.online()||!X.base()){ cb(false); return; }
  X.tmo(fetch(X.base()+"/kahoot/cfg.json"),9000).then(function(r){ return r.ok?r.json():null; }).catch(function(){ return null; })
    .then(function(c){ cb(!!(c&&c.yz===true)); });
}
var BOTN=["Aziz","Madina","Javohir","Sevara","Bekzod","Nilufar","Sherzod","Gulnoza","Otabek","Zarina","Rustam","Kamola","Diyor","Shahnoza","Jahongir","Mohira"];
/* yo'lakdagi o'rin: progress (belgi) → dunyo koordinatasi */
function wx(ch){ return -20+ch*PX; }
function markList(T,mode){
  var out=[];
  if(mode==="fin"){ [.25,.5,.75].forEach(function(f){ out.push({x:wx(T.n*f),t:Math.round(f*100)+"%"}); }); }
  else { for(var k=10;k<T.nw;k+=10) out.push({x:wx(charsAt(T,k)),t:k+" "+L("so'z","words")}); }
  return out;
}
function mkRace(o){
  var T=mkText(o.text);
  return {kind:o.kind,lang:o.lang,lvl:o.lvl,mk:o.mk,mode:o.mode,dur:o.dur||0,T:T,t0:0,started:false,over:false,
    samples:[],rs:[],me:null,bots:[],ghost:null,scene:null,ty:null,finMs:0,lastPlace:0,key:o.key||null,meta:o.meta||null,
    lastSample:0,botsN:o.bots||0,pb:o.pb||null};
}
function wordsAt(T,c){ var lo=0, hi=T.nw; while(lo<hi){ var m=(lo+hi)>>1; if(T.st[m]+T.w[m].length<=c) lo=m+1; else hi=m; } return lo; }
/* bot: tezligi o'yinchining odatiy tezligi atrofida, so'z oxirida ba'zan "xato qilib" to'xtab qoladi */
function mkBot(i,f,base,used){
  var nm=BOTN.filter(function(x){ return used.indexOf(x)<0; }); nm=nm.length?pick(nm):pick(BOTN); used.push(nm);
  return {n:nm,cps:base*f*rnd(.96,1.04),p:0,pause:0,done:false,tDone:0,wob:rnd(0,6),acc:Math.round(rnd(91,99.4)*10)/10};
}
function botStep(b,dt,T,el){
  if(b.done) return;
  if(b.pause>0){ b.pause-=dt; return; }
  var before=b.p; b.p+=b.cps*(1+.2*Math.sin(el/1000*1.25+b.wob))*dt;
  if(wordsAt(T,before)!==wordsAt(T,b.p)&&Math.random()<.075) b.pause=rnd(.3,1.05);
  if(b.p>=T.n){ b.p=T.n; b.done=true; b.tDone=el; }
}

/* ================== 9. ANIMATSIYA SIKLI (60 fps) ================== */
var LOOP={fn:[],raf:0,last:0,fps:60};
function loopOn(fn){ LOOP.fn.push(fn); if(!LOOP.raf){ LOOP.last=now(); LOOP.raf=requestAnimationFrame(loopTick); } }
function loopOff(){ LOOP.fn=[]; if(LOOP.raf) cancelAnimationFrame(LOOP.raf); LOOP.raf=0; }
function loopTick(){
  var t=now(), dt=Math.min(.05,Math.max(0,(t-LOOP.last)/1000)); LOOP.last=t;
  if(dt>0) LOOP.fps=LOOP.fps*.94+(1/dt)*.06;
  for(var i=0;i<LOOP.fn.length;i++){ try{ LOOP.fn[i](dt,t); }catch(e){ if(window.console) console.error(e); } }
  LOOP.raf=LOOP.fn.length?requestAnimationFrame(loopTick):0;
}

/* ================== 10. EKRANLAR ================== */
var OFF=[];          /* ko'rinishdan chiqqanda olib tashlanadigan tinglovchilar */
function on(el,ev,fn,o){ el.addEventListener(ev,fn,o); OFF.push(function(){ el.removeEventListener(ev,fn,o); }); }
function leave(){
  stopTimers(); loopOff(); OFF.forEach(function(f){ try{ f(); }catch(e){} }); OFF=[];
  SCENES.forEach(function(S){ if(S.ro) S.ro.disconnect(); }); SCENES=[];
  document.documentElement.classList.remove("yz-lock"); SND.amb(0);
  if(RC&&RC.ty) RC.ty.on=false;
}
function sndIc(){ return (X&&X.FX&&X.FX.isMuted())?"🔇":"🔊"; }
function bindSnd(id){
  var b=$(id); if(!b) return;
  b.onclick=function(){
    var m=!X.FX.isMuted(); X.FX.mute(m); b.textContent=sndIc();
    var tb=document.getElementById("btnSnd"); if(tb) tb.textContent=m?"🔇":"🔊";
    if(!m){ SND.unlock(); SND.tick(); }
    SND.amb(!m&&RC&&RC.started&&!RC.over&&VIEW==="race"?.016:0);
  };
}
function chip(k,v,t,cur){ return '<button type="button" class="yz-chip'+(String(v)===String(cur)?' on':'')+'" data-k="'+k+'" data-v="'+esc(v)+'">'+esc(t)+'</button>'; }
function lvIcon(v){ return v==="oson"?"🟢":v==="orta"?"🟡":"🔴"; }
function stat(id,ic,v,lb){ return '<div class="yz-st"><b id="'+id+'">'+v+'</b><span>'+ic+' '+lb+'</span></div>'; }
function setTxt(id,v){ var e=$(id); if(e&&e.textContent!==String(v)) e.textContent=v; }
function rulesHtml(){
  return '<details class="yz-panel yz-rules"><summary>📜 '+L("Qoidalar va maslahatlar","Rules and tips")+'</summary><ul>'+
    '<li>🏁 <b>'+L("Marra","Finish line")+'</b> — '+L("matnni birinchi bo'lib oxirigacha to'g'ri yozgan g'olib.","whoever types the whole text correctly first wins.")+'</li>'+
    '<li>⏱ <b>'+L("Vaqtga","Timed")+'</b> — '+L("belgilangan vaqtda (1, 2, 3 daqiqa) kim ko'p so'z yozsa, o'sha g'olib.","whoever types the most words in the set time wins.")+'</li>'+
    '<li>🏃 '+L("Yuguruvchingiz matnning to'g'ri yozilgan qismiga teng masofani bosib o'tadi.","Your runner covers the share of the text you have typed correctly.")+'</li>'+
    '<li>❌ '+L("Xato harf qizil bo'ladi — uni o'chirib to'g'rilamaguncha keyingi so'zga o'tib bo'lmaydi.","A wrong letter turns red — fix it before you can move on.")+'</li>'+
    '<li>✍️ '+L("O'zbekcha o' va g' dagi tutuq belgisining barcha ko'rinishlari ( ' ‘ ’ ʻ ` ) bir xil qabul qilinadi.","All apostrophe forms ( ' ‘ ’ ʻ ` ) count the same.")+'</li>'+
    '<li>📚 '+L("Matnlar o'zbek (lotin) va ingliz tillarida, tadbirkorlik va iqtisod mavzusida. Klaviatura lotin (EN) holatida bo'lsin.","Texts are in Uzbek (Latin) and English, on business and economics. Keep the keyboard on Latin (EN).")+'</li>'+
    '<li>⚡ '+L("Tezlik — bir daqiqada yozilgan so'zlar soni; aniqlik — to'g'ri bosilgan harflar ulushi.","Speed is words per minute; accuracy is the share of correct keystrokes.")+'</li>'+
    '<li>🔴 '+L("Jonli poygani o'qituvchi tashkil qiladi — lobbi ochilganda hamma qo'shila oladi. Natija: 1-o'rin +5, 2-o'rin +4, 3-o'rin +3 ball umumiy reytingga.","The teacher sets up live races — everyone can join while the lobby is open. 1st +5, 2nd +4, 3rd +3 rating points.")+'</li>'+
    '<li>🚫 '+L("Matnni nusxalab qo'yish va avtomatik to'ldirish ishlamaydi.","Pasting and autocomplete do not work.")+'</li></ul></details>';
}

/* ---------- 10.1 Bosh ekran ---------- */
function vHome(){
  if(RC&&RC.kind==="room") roomLeave(RC);
  leave(); VIEW="home"; ALIVE++; RC=null;
  var s=settings(), lk=myLook();
  ROOT.innerHTML='<div class="yz yz-home">'+
    '<div class="yz-hero"><canvas id="yzHero"></canvas>'+
      '<div class="yz-hero-in"><span class="yz-kick">⌨️ '+L("TEZ YOZISH POYGASI","SPEED TYPING RACE")+'</span>'+
        '<h1 class="yz-title">'+L("Yozuv Marafoni","Typing Marathon")+'</h1>'+
        '<p>'+L("Matnni qancha tez va to'g'ri yozsangiz, yuguruvchingiz shuncha tez yuguradi. Marraga birinchi yeting!","The faster and more accurately you type, the faster your runner goes. Reach the finish first!")+'</p></div>'+
      '<div class="yz-tools"><button type="button" class="yz-ib" id="yzSnd" title="'+L("Ovoz","Sound")+'">'+sndIc()+'</button><a class="yz-ib" href="#/" title="'+L("Arenaga qaytish","Back to the arena")+'">✕</a></div></div>'+
    '<div id="yzLive"></div>'+
    '<div class="yz-grid">'+
      '<section class="yz-panel"><h3>🏃 '+L("Yuguruvchingizni tanlang","Pick your runner")+'</h3>'+
        '<div class="yz-me"><canvas id="yzPrev"></canvas><div class="yz-mei"><span class="yz-lbl">'+L("Poygachi","Racer")+'</span><b>'+esc(myName())+'</b>'+
          '<span class="yz-lnm" id="yzLnm">'+esc(lookOf(lk).nm)+'</span><button type="button" class="yz-chip" id="yzRnd">🎲 '+L("Tasodifiy","Random")+'</button></div></div>'+
        '<div class="yz-looks" id="yzLooks">'+LOOKS.map(function(x,i){ return '<button type="button" class="yz-lk'+(i===lk?' on':'')+'" data-i="'+i+'" title="'+esc(x.nm)+'" aria-label="'+esc(x.nm)+'"><canvas></canvas></button>'; }).join("")+'</div></section>'+
      (!OPEN?'<section class="yz-panel yz-shut"><h3>🔒 '+L("Hozircha yopiq","Closed for now")+'</h3>'+
        '<div class="yz-shutic">🔒</div><p>'+L("Yozuv Marafoni o'qituvchi ochguncha yopiq. Bellashuv vaqtida o'qituvchi ochadi — shunda mashq qilish va poygada qatnashish mumkin bo'ladi.","The Typing Marathon is closed until the teacher opens it.")+'</p>'+
        '<p class="yz-sm">'+L("Ungacha yuguruvchingizni tanlab qo'yishingiz mumkin. Jonli poyga e'lon qilinsa, yuqorida chiqadi.","Meanwhile you can pick your runner. A live race, when announced, appears above.")+'</p></section>':
      '<section class="yz-panel yz-setp"><h3>🎮 '+L("Mashq poygasi","Practice race")+'</h3>'+
        '<span class="yz-lbl">'+L("Til","Language")+'</span><div class="yz-chips">'+langs().map(function(x){ return chip("l",x.id,x.fl+" "+x.nm,s.l); }).join("")+'</div>'+
        '<span class="yz-lbl">'+L("Qiyinlik","Difficulty")+'</span><div class="yz-chips">'+lvls().map(function(x){ return chip("v",x.id,lvIcon(x.id)+" "+x.nm,s.v); }).join("")+'</div>'+
        '<span class="yz-lbl">'+L("Rejim","Mode")+'</span><div class="yz-chips">'+["fin","t60","t120","t180"].map(function(m){ return chip("m",m,modeNm(m),s.m); }).join("")+'</div>'+
        '<span class="yz-lbl">'+L("Raqiblar","Opponents")+'</span><div class="yz-chips">'+[0,1,2,3,4,5].map(function(n){ return chip("b",n,n?("🤖 "+n):L("Yolg'iz","Solo"),s.b); }).join("")+'</div>'+
        '<p class="yz-pbl" id="yzPbl"></p>'+
        '<button type="button" class="yz-go" id="yzGo">▶ '+L("Boshlash","Start")+'</button>'+
      '</section>')+
    '</div>'+
    (OPEN?'<section class="yz-panel yz-rooms"><h3>👥 '+L("Do'stlar bilan poyga","Race with friends")+'</h3>'+
      '<p class="yz-sm">'+L("2–6 kishi bir xonada bir vaqtda poygalashadi. Xona yuqoridagi til, qiyinlik va rejim bilan ochiladi; kodni do'stlaringizga ayting. Bu poyga reytingga ta'sir qilmaydi.",
        "2–6 people race together. The room uses the language, difficulty and mode chosen above; share the code. It does not affect the rating.")+'</p>'+
      '<div class="yz-rjoin"><button type="button" class="yz-go" id="yzRNew">➕ '+L("Xona ochish","Open a room")+'</button>'+
      '<input id="yzRCode" maxlength="4" placeholder="'+L("KOD","CODE")+'" autocomplete="off" autocapitalize="characters">'+
      '<button type="button" class="yz-btn2" id="yzRJoin">🔑 '+L("Kod bilan kirish","Join with a code")+'</button></div>'+
      '<div id="yzRList" class="yz-rlist"></div></section>':'')+
    '<div class="yz-grid">'+
      '<section class="yz-panel"><h3>🏆 '+L("Shaxsiy rekordlar","Personal bests")+'</h3><div id="yzPbs"></div></section>'+
      '<section class="yz-panel"><h3>🌍 '+L("Eng tezlar","Fastest typists")+' <small class="yz-sm" id="yzTopL"></small></h3><div id="yzTop"></div></section>'+
    '</div>'+rulesHtml()+'</div>';
  bindSnd("yzSnd");
  /* sozlamalar */
  [].forEach.call(ROOT.querySelectorAll(".yz-setp .yz-chip"),function(b){
    b.onclick=function(){ var st=settings(); st[b.dataset.k]=b.dataset.k==="b"?+b.dataset.v:b.dataset.v; saveSet(st);
      [].forEach.call(b.parentNode.children,function(x){ x.classList.toggle("on",x===b); }); SND.unlock(); SND.tick(); pbLine(); if(b.dataset.k==="l") topList(); };
  });
  /* yuguruvchini tanlash */
  var boxes=ROOT.querySelectorAll(".yz-lk");
  [].forEach.call(boxes,function(b){
    b.onclick=function(){ var i=+b.dataset.i; lset(K_LOOK,i); [].forEach.call(boxes,function(x){ x.classList.toggle("on",x===b); });
      setTxt("yzLnm",lookOf(i).nm); SND.unlock(); SND.tick(); if(HERO) HERO.me.lk=lookOf(i); liveLook(); };
  });
  $("yzRnd").onclick=function(){ var i=Math.floor(Math.random()*LOOKS.length); boxes[i].click(); boxes[i].scrollIntoView({block:"nearest",behavior:"smooth"}); };
  requestAnimationFrame(function(){ [].forEach.call(boxes,function(b){ lookThumb(b.querySelector("canvas"),+b.dataset.i); }); });
  if($("yzGo")) $("yzGo").onclick=function(){ SND.unlock(); startPractice(); };
  if($("yzRNew")){
    $("yzRNew").onclick=function(){ SND.unlock(); roomCreate(this); };
    var rc=$("yzRCode"); $("yzRJoin").onclick=function(){ SND.unlock(); roomJoin(rc.value); };
    rc.addEventListener("keydown",function(e){ if(e.key==="Enter") roomJoin(rc.value); });
    roomList(); every(roomList,5000);
  }
  pbLine(); pbTable(); topList();
  heroScene(); prevLoop();
  liveCard();
}
var HERO=null;
function heroScene(){
  var cv=$("yzHero"); HERO=null; if(!cv) return;
  var S=mkScene(cv,{demo:true,lanes:3,mini:false,cam0:0,followAt:.64}), li=myLook();
  var me=S.add({n:myName(),lk:lookOf(li),lane:2,me:true,num:7,x:0}); me.tagTxt=firstName(myName());
  var o1=S.add({n:"",lk:lookOf((li+17)%48),lane:0,num:12,x:60}), o2=S.add({n:"",lk:lookOf((li+31)%48),lane:1,num:21,x:-40});
  o1.noTag=o2.noTag=true; S.go=true; S.follow=me;
  var sp=[3.7,3.3,4.0]; HERO={S:S,me:me};
  loopOn(function(dt){ if(!document.body.contains(cv)) return; S.fit();
    [me,o1,o2].forEach(function(r,i){ r.tx+=(sp[i]+Math.sin(S.t*.6+i*2.1)*1.1)*PX*dt; }); S.step(dt); S.draw(); });
}
function prevLoop(){
  var cv=$("yzPrev"); if(!cv) return; var c=cv.getContext("2d"), ph=0, off=0;
  loopOn(function(dt){
    if(!document.body.contains(cv)) return;
    var dpr=Math.min(2,window.devicePixelRatio||1), w=cv.clientWidth||110, h=cv.clientHeight||120;
    if(cv.width!==Math.round(w*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); }
    c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h); ph+=dt*Math.PI*2*1.7; off=(off+dt*90)%24;
    c.strokeStyle="rgba(255,255,255,.75)"; c.lineWidth=2; c.setLineDash([12,12]); c.lineDashOffset=off;
    c.beginPath(); c.moveTo(0,h*.92); c.lineTo(w,h*.92); c.stroke(); c.setLineDash([]); c.lineDashOffset=0;
    drawRunner(c,lookOf(myLook()),{x:w*.44,y:h*.86,s:h/122,pose:"run",ph:ph,sp:.6,t:0,num:7});
  });
}
function pbLine(){
  var s=settings(), pb=pbGet(s.l,s.v,s.m), e=$("yzPbl"); if(!e) return;
  e.innerHTML=pb?('🏆 '+L("Rekordingiz","Your best")+': <b>'+pb.w+'</b> '+L("so'z/daq","wpm")+' · 🎯 '+pb.a+'% <span class="yz-sm">— '+L("👻 sharpangiz ham yuguradi","your 👻 ghost runs too")+'</span>')
    :('✨ '+L("Bu sozlamada hali rekord yo'q — birinchisini o'rnating!","No record for this setup yet — set the first one!"));
}
function pbTable(){
  var a=lget(K_PB,{})||{}, e=$("yzPbs"); if(!e) return;
  var ks=Object.keys(a).filter(function(k){ return has(langs(),k.split("|")[0]); }).sort(function(x,y){ return (a[y].w||0)-(a[x].w||0); });
  if(!ks.length){ e.innerHTML='<p class="yz-sm">'+L("Hali rekord yo'q. Birinchi poygangizni boshlang — natijalar shu yerda saqlanadi.","No records yet. Run your first race — results are kept here.")+'</p>'; return; }
  e.innerHTML='<div class="yz-tw"><table class="yz-tb"><thead><tr><th>'+L("Sozlama","Setup")+'</th><th>⚡</th><th>🎯</th><th>📅</th></tr></thead><tbody>'+ks.slice(0,8).map(function(k){
    var p=k.split("|"), r=a[k], d=new Date(r.at||0);
    return '<tr><td>'+esc(langOf(p[0]).fl)+' '+esc(lvlNm(p[1]))+' · '+esc(modeNm(p[2]))+'</td><td><b>'+r.w+'</b></td><td>'+r.a+'%</td><td>'+("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+'</td></tr>';
  }).join("")+'</tbody></table></div>';
}
/* umumiy (mashq) rekordlar: /arena/yzrec/<til>/<sid> — faqat qiziqish uchun, reytingga ta'sir qilmaydi */
function topList(){
  var e=$("yzTop"), s=settings(); if(!e) return;
  setTxt("yzTopL","· "+langOf(s.l).fl+" "+langOf(s.l).nm);
  if(!X.online()){ e.innerHTML='<p class="yz-sm">'+L("Internetga ulanganda ko'rinadi.","Shown when online.")+'</p>'; return; }
  var a=ALIVE;
  X.DB.get("yzrec/"+s.l,function(v){
    if(a!==ALIVE||!$("yzTop")) return;
    var me=ME(), rows=Object.keys(v||{}).map(function(k){ var r=v[k]||{}; r.id=k; return r; })
      .filter(function(r){ return +r.w>0&&+r.w<=220&&+r.a>=70; }).sort(function(x,y){ return y.w-x.w; }).slice(0,10);
    if(!rows.length){ e.innerHTML='<p class="yz-sm">'+L("Bu tilda hali natija yo'q — birinchi bo'ling!","No results in this language yet — be the first!")+'</p>'; return; }
    e.innerHTML='<ol class="yz-top">'+rows.map(function(r,i){
      return '<li'+(me&&r.id===me.id?' class="me"':'')+'><span class="yz-rk">'+(["🥇","🥈","🥉"][i]||(i+1))+'</span><span class="yz-dot" style="background:'+lookOf(r.av).jer+'"></span><b>'+esc(String(r.n||"?").slice(0,40))+'</b><span class="yz-sm">'+esc(lvlNm(r.v||""))+'</span><em>'+r.w+' <small>'+L("so'z/daq","wpm")+'</small></em></li>';
    }).join("")+'</ol>';
  });
}

/* ---------- 10.2 Mashq poygasi ---------- */
function startPractice(){
  if(!OPEN){ toast(L("Yozuv Marafoni hozircha yopiq — o'qituvchi ochadi","Closed for now — the teacher will open it")); vHome(); return; }
  var s=settings(), dur=modeDur(s.m), mode=dur?"time":"fin";
  var text=pickText(s.l,s.v,dur?Math.round(dur*14):0);
  var R=mkRace({kind:"prac",lang:s.l,lvl:s.v,mk:s.m,mode:mode,dur:dur,text:text,bots:s.b,pb:pbGet(s.l,s.v,s.m)});
  var base=myCps(s.l)||({oson:3.1,orta:2.8,qiyin:2.4}[s.v]||2.8), used=[], n=s.b;
  var fs=n===1?[1.04]:[]; for(var i=0;i<n&&n>1;i++) fs.push(.8+.44*i/(n-1));
  shuffle(fs);
  for(var j=0;j<n;j++) R.bots.push(mkBot(j,fs[j],base,used));
  if(R.pb&&R.pb.c>0) R.ghost={cps:R.pb.c/60};
  vRace(R);
  countdown(R,function(){ goRace(R); });
}
function countdown(R,done){
  var n=3;
  (function step(){
    if(!RC||RC!==R) return;
    var cd=$("yzCd"); if(!cd) return;
    if(n>0){ cd.innerHTML='<b>'+n+'</b>'; SND.beep(false); if(n===1) R.scene.set=true; n--; later(step,1000); }
    else { done(); }
  })();
}
function goShow(){ var cd=$("yzCd"); if(cd){ cd.innerHTML='<b class="go">START!</b>'; later(function(){ var c2=$("yzCd"); if(c2&&!RC.over) c2.innerHTML=""; },950); } }
function goRace(R){
  goShow(); SND.pistol(); SND.amb(.016);
  R.started=true; R.t0=now(); R.scene.go=true; R.ty.start(R.t0);
  var inp=$("yzIn"); if(inp){ inp.placeholder=L("Yozing!","Type!"); try{ inp.focus({preventScroll:true}); }catch(e){ inp.focus(); } }
  var w=$("yzText"); if(w) w.classList.remove("wait");
}

/* ---------- 10.3 Poyga ekrani (mashq va jonli uchun umumiy) ---------- */
function vRace(R){
  leave(); VIEW="race"; ALIVE++; RC=R;
  var live=R.kind==="live", T=R.T, lg=langOf(R.lang);
  document.documentElement.classList.add("yz-lock");
  ROOT.innerHTML='<div class="yz yz-race" id="yzRace">'+
    '<div class="yz-rbar"><span class="yz-rlogo">⌨️ <b>'+L("Yozuv Marafoni","Typing Marathon")+'</b></span>'+
      '<span class="yz-pill '+(live?'live':'')+'">'+(live?"🔴 "+L("Jonli poyga","Live race"):R.kind==="room"?"👥 "+L("Xona","Room")+" "+esc(R.room):"🎯 "+L("Mashq","Practice"))+'</span>'+
      '<span class="yz-pill yz-hs">'+esc(modeNm(R.mk))+' · '+esc(lg.fl+" "+lg.nm)+' · '+esc(lvlNm(R.lvl))+'</span>'+
      '<span class="yz-sp"></span><span class="yz-pill yz-clock" id="yzClock">0:00</span>'+
      '<button type="button" class="yz-ib" id="yzSnd" title="'+L("Ovoz","Sound")+'">'+sndIc()+'</button>'+
      '<button type="button" class="yz-ib" id="yzX" title="'+L("Chiqish","Leave")+'">✕</button></div>'+
    '<div class="yz-stage" id="yzStage"><canvas id="yzCv"></canvas><div class="yz-cd" id="yzCd"></div><div class="yz-pop" id="yzPop"></div><div class="yz-note" id="yzNote"></div></div>'+
    '<div class="yz-bar"><i id="yzBar"></i></div>'+
    '<div class="yz-play"><div class="yz-main">'+
      '<div class="yz-stats">'+stat("yzWpm","⚡","0",L("so'z/daq","wpm"))+stat("yzAcc","🎯","100%",L("aniqlik","accuracy"))+
        stat("yzTm","⏱","0:00",L("vaqt","time"))+stat("yzPr","📍",R.mode==="time"?"0":"0%",R.mode==="time"?L("so'z","words"):L("masofa","distance"))+stat("yzPl","🏅","—",L("o'rin","place"))+'</div>'+
      '<div class="yz-text wait" id="yzText" lang="'+esc(R.lang)+'"></div>'+
      '<div class="yz-inrow"><input id="yzIn" class="yz-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next" aria-label="'+L("Yozish maydoni","Typing field")+'" placeholder="'+L("START dan keyin shu yerga yozing…","Type here after START…")+'"><span class="yz-hint" id="yzHint"></span></div>'+
    '</div><aside class="yz-side" id="yzSide"></aside></div></div>';
  bindSnd("yzSnd");
  $("yzX").onclick=function(){
    if(R.started&&!R.over&&!R.meDone&&!confirm(L("Poygadan chiqasizmi? Natija saqlanmaydi.","Leave the race? The result will not be saved."))) return;
    if(live) liveLeave(R);
    if(R.kind==="room") roomLeave(R);
    vHome();
  };
  var S=mkScene($("yzCv"),{len:T.n*PX-15,mode:R.mode,marks:markList(T,R.mode),ready:R.kind==="prac"});
  R.scene=S;
  if(R.kind==="prac"){
    var nl=1+R.bots.length+(R.ghost?1:0); S.nl=Math.max(3,nl);
    var mine=myLook();
    R.me=S.add({id:"me",n:myName(),lk:lookOf(mine),lane:S.nl-1,me:true,num:10+Math.floor(Math.random()*89)});
    R.me.tagTxt=firstName(myName());
    if(R.ghost){ R.ghost.r=S.add({id:"ghost",n:L("Rekord","Best"),lk:R.me.lk,lane:S.nl-2,ghost:true,num:R.me.num}); R.ghost.r.tagTxt="👻 "+L("Rekord","Best")+" · "+R.pb.w; }
    var free=[]; for(var i=0;i<S.nl;i++) if(i!==S.nl-1&&!(R.ghost&&i===S.nl-2)) free.push(i);
    var used=[mine];
    R.bots.forEach(function(b,k){ var li; do{ li=Math.floor(Math.random()*LOOKS.length); }while(used.indexOf(li)>=0&&used.length<LOOKS.length); used.push(li);
      b.r=S.add({id:"bot"+k,n:b.n,lk:lookOf(li),lane:free[k],bot:true,num:10+Math.floor(Math.random()*89)}); b.r.tagTxt=b.n; });
    S.follow=R.me;
  }
  /* jonli poygada matn startdan oldin keladi — yozish mexanikasi liveText() da yaratiladi */
  if(!live) R.ty=mkTyper(T,$("yzText"),$("yzIn"),{
    key:function(){ SND.key(); },
    err:function(){ SND.err(); if(R.me) R.me.stum=.32; if(X.FX&&X.FX.vib) X.FX.vib(18); },
    word:function(){},
    done:function(){ meDone(R); },
    early:function(){ pop(L("Shoshilmang — START ni kuting!","Wait for START!"),"warn"); },
    hint:function(t){ var hh=$("yzHint"); if(hh){ hh.textContent=t; hh.classList.add("on"); later(function(){ var h2=$("yzHint"); if(h2) h2.classList.remove("on"); },3500); } },
    prog:function(){ if(R.me&&!R.me.fin) R.me.tx=wx(R.ty.chars()); }
  });
  if(live) liveSetup(R);
  if(R.kind==="room") roomSetup(R);
  vvFit();
  on(window,"resize",vvFit);
  if(window.visualViewport){ on(window.visualViewport,"resize",vvFit); on(window.visualViewport,"scroll",vvFit); }
  loopOn(function(dt){ raceFrame(R,dt); });
  every(function(){ raceStats(R); },150);
  var inp0=$("yzIn"); if(inp0) inp0.onfocus=function(){ SND.unlock(); later(vvFit,350); };
}
/* telefon klaviaturasi ochilganda ham yozish maydoni ko'rinib tursin */
function vvFit(){
  var r=$("yzRace"); if(!r) return;
  var vv=window.visualViewport, h=vv?vv.height:window.innerHeight, top=vv?vv.offsetTop:0, kb=vv&&vv.height<window.innerHeight*.8;
  /* telefon: klaviatura ochiq bo'lsa sahna pastroq; aks holda ~4:3; kompyuter: qolgan joyni egallaydi */
  var cv=kb?clamp(h-300,112,240):(window.innerWidth<700?clamp(Math.min(h*.42,window.innerWidth*.8),170,340):clamp(h-400,220,540));
  r.style.height=h+"px"; r.style.top=top+"px"; r.style.setProperty("--yzCvH",Math.round(cv)+"px");
  if(RC&&RC.scene) RC.scene.resize();
  if(RC&&RC.ty) RC.ty.scroll();
}
function pop(t,cls){ var p=$("yzPop"); if(!p) return; p.className="yz-pop on "+(cls||""); p.textContent=t; clearTimeout(p._t); p._t=setTimeout(function(){ p.className="yz-pop"; },1500); }
function note(t){ var n=$("yzNote"); if(!n) return; n.innerHTML=t||""; n.classList.toggle("on",!!t); }
function raceFrame(R,dt){
  var S=R.scene; if(!S||RC!==R) return;
  S.fit();
  if(R.started&&!R.over){
    var el=now()-R.t0;
    R.bots.forEach(function(b){ botStep(b,dt,R.T,el); b.r.tx=b.r.fin?b.r.tx:wx(b.p); if(b.done&&!b.r.fin) runnerFin(R,b.r); });
    if(R.ghost){ var gp=Math.min(R.T.n,R.ghost.cps*el/1000); if(!R.ghost.r.fin) R.ghost.r.tx=wx(gp); if(gp>=R.T.n&&!R.ghost.r.fin) runnerFin(R,R.ghost.r,true); }
    if(R.mode==="time"&&el>=R.dur*1000&&R.kind==="prac") timeUp(R);
  }
  if(R.kind!=="prac") liveFrame(R,dt);
  /* marradan keyin sekinlashib yugurib, so'ng quvonadi */
  S.rs.forEach(function(r){ if(r.fin&&r.ro!=null){ r.ro+=r.rov*dt; r.rov*=Math.exp(-dt*1.35); r.tx=r.fx+r.ro; if(r.rov<16&&!r.win&&r.place&&r.place<=3&&!r.ghost) r.win=true; } });
  S.step(dt); S.draw();
}
function runnerFin(R,r,ghost){
  if(r.fin) return;
  r.fin=true; r.fx=r.tx; r.ro=0; r.rov=Math.max(PX*2.2,r.vs*.9);
  if(!ghost){ R.finN=(R.finN||0)+1; r.place=R.finN; }
  var S=R.scene; if(!S.tapeT&&!ghost){ S.tapeT=S.t; S.cheer(1.2); SND.cheer(false); }
}
function meDone(R){
  if(R.meDone) return;
  R.meDone=true; R.finMs=now()-R.t0; R.endEl=R.finMs;
  var r=R.me; runnerFin(R,r);
  SND.fin(); SND.cheer(true); R.scene.cheer(1.6); R.scene.burst(R.scene.sx(r.x,r.ly),r.ly-70,120);
  pop(r.place===1?"🥇 "+L("Birinchi!","First!"):"🏁 "+L("Marra!","Finish!"),"big");
  R.ty.stop(); SND.amb(.03);
  if(R.kind==="prac") later(function(){ pracResults(R); },2600);
  else if(R.kind==="live") liveMeDone(R);
  else roomMeDone(R);
}
function timeUp(R){
  if(R.over) return;
  R.over=true; R.endEl=R.dur*1000;
  if(R.ty){ if(!R.ty.done){ R.ty.done=true; R.ty.tEnd=R.t0+R.dur*1000; } R.ty.stop(); }
  var inp=$("yzIn"); if(inp) inp.disabled=true;
  SND.beep(true); SND.cheer(true);
  var cd=$("yzCd"); if(cd) cd.innerHTML='<b class="tu">⏱ '+L("VAQT TUGADI!","TIME!")+'</b>';
  /* eng uzoqqa yetgan quvonadi */
  var best=null; R.scene.rs.forEach(function(r){ if(!r.ghost&&(!best||r.tx>best.tx)) best=r; }); if(best){ best.place=1; best.win=true; }
  if(R.kind==="prac") later(function(){ pracResults(R); },2200);
}
function placeNow(R){
  if(R.kind!=="prac") return livePlace(R);
  var c=R.ty.chars(), fin=R.ty.done&&R.mode==="fin", pl=1, n=1;
  R.bots.forEach(function(b){ n++; if(fin){ if(b.done&&b.tDone<R.finMs) pl++; } else if(b.done||b.p>c) pl++; });
  return {pl:pl,n:n};
}
function raceStats(R){
  if(RC!==R) return;
  if(!R.ty){ if(R.kind==="live"){ liveSide(R); var ck0=$("yzClock"), t0=X.snow(), m0=R.meta; if(ck0) setTxt("yzClock",t0<m0.start?"⏳ "+X.kLeft(m0.start-t0):"⏱ "+fmtT(t0-m0.start)); } return; }
  var st=R.ty.stats(now()), el=R.started?(R.meDone||R.over?R.endEl:st.el):0, time=R.mode==="time";
  setTxt("yzWpm",R.started?Math.round(st.wpm):0);
  setTxt("yzAcc",st.acc+"%");
  setTxt("yzTm",fmtT(el));
  setTxt("yzPr",time?String(st.words):Math.floor(st.prog*100)+"%");
  var left=time?Math.max(0,R.dur*1000-el):el, ck=$("yzClock");
  if(ck){ setTxt("yzClock",(time?"⏳ ":"⏱ ")+fmtT(left)); ck.classList.toggle("low",time&&R.started&&left<10000); }
  var b=$("yzBar"); if(b) b.style.width=(time?clamp(el/(R.dur*1000),0,1):st.prog)*100+"%";
  if(R.started){
    var p=placeNow(R); setTxt("yzPl",p.pl+"/"+p.n);
    if(R.lastPlace&&p.pl<R.lastPlace&&el>1500&&!R.meDone){ SND.over(); pop("⬆ "+p.pl+"-"+L("o'rin!","place!"),"up"); R.scene.cheer(.5); }
    R.lastPlace=p.pl;
    if(!R.meDone&&!R.over&&el-R.lastSample>=1000){ R.lastSample=el; R.samples.push({t:el,w:st.wpm,c:st.chars}); }
    if(!R.tagAt||el-R.tagAt>500){ R.tagAt=el; if(R.me) R.me.tagTxt=firstName(myName())+(st.wpm>0?" · "+Math.round(st.wpm):"");
      R.bots.forEach(function(bb){ var w=bb.p>0?Math.round(wordsAt(R.T,bb.p)*60000/Math.max(1000,bb.done?bb.tDone:el)):0; bb.r.tagTxt=bb.n+(w?" · "+w:""); }); }
  }
  if(R.kind==="live") liveStats(R,st);
  if(R.kind==="room") roomStats(R);
}

/* ---------- 10.4 Mashq natijasi ---------- */
function pracResults(R){
  if(R.resDone||RC!==R) return; R.resDone=true;
  var T=R.T, st=R.ty.stats(now()), time=R.mode==="time", myMs=time?R.dur*1000:(R.finMs||st.el), elNow=now()-R.t0;
  var rows=[{me:true,n:myName(),lk:R.me.lk,num:R.me.num,ch:st.chars,w:time?wordsAt(T,st.chars):T.nw,ms:myMs,acc:st.acc,fin:!time}];
  R.bots.forEach(function(b){
    var ms,ch,est=false;
    if(time){ ch=Math.floor(b.p); ms=R.dur*1000; }
    else if(b.done){ ch=T.n; ms=b.tDone; }
    else { ch=T.n; ms=elNow+(T.n-b.p)/b.cps*1000; est=true; }      /* hali yugurayotgan bot: taxminiy marra vaqti */
    rows.push({bot:true,n:b.n,lk:b.r.lk,num:b.r.num,ch:ch,w:time?wordsAt(T,ch):T.nw,ms:ms,acc:b.acc,fin:!time,est:est});
  });
  rows.forEach(function(r){ r.wpm=Math.round(r.w*60000/Math.max(1000,r.ms)); });
  rows.sort(time?function(a,b){ return (b.ch-a.ch)||(a.me?-1:1); }:function(a,b){ return a.ms-b.ms; });
  rows.forEach(function(r,i){ r.place=i+1; });
  var mine=rows.filter(function(r){ return r.me; })[0], cpm=Math.round(st.chars*60000/Math.max(1000,myMs));
  var my={wpm:mine.wpm,acc:st.acc,ms:myMs,words:mine.w,chars:st.chars,cpm:cpm,place:mine.place,n:rows.length};
  var prev=pbGet(R.lang,R.lvl,R.mk), isPB=mine.w>0&&pbSave(R.lang,R.lvl,R.mk,{w:my.wpm,a:my.acc,c:cpm,t:myMs,at:Date.now()});
  histAdd({at:Date.now(),l:R.lang,v:R.lvl,m:R.mk,w:my.wpm,a:my.acc,c:cpm,pl:my.place,n:my.n});
  if(isPB) recPush(R.lang,R.lvl,R.mk,my);
  vResults({R:R,rows:rows,my:my,isPB:isPB,prev:prev,kind:"prac"});
}
function recPush(l,v,m,my){
  var me=ME(); if(!me||!X.online()||my.acc<70) return;
  var all=lget(K_PB,{})||{}, best=0; Object.keys(all).forEach(function(k){ if(k.indexOf(l+"|")===0) best=Math.max(best,+all[k].w||0); });
  if(my.wpm<best) return;
  X.DB.set("yzrec/"+l+"/"+me.id,{n:myName().slice(0,40),w:my.wpm,a:my.acc,v:v,m:m,av:myLook(),at:Date.now()});
}

/* ---------- 10.5 Natija ekrani: shohsupa, ko'rsatkichlar, grafik, jadval ---------- */
function vResults(o){
  leave(); VIEW="res"; ALIVE++;
  var R=o.R, my=o.my, rows=o.rows, live=o.kind==="live", time=R.mode==="time", lg=langOf(R.lang);
  var head, solo=rows.length===1;
  if(!my) head="🏁 "+L("Poyga yakunlandi","The race is over");
  else if(solo) head=time?"⏱ "+my.words+" "+L("so'z yozdingiz!","words typed!"):"🏁 "+L("Marra!","Finished!")+" "+my.wpm+" "+L("so'z/daqiqa","wpm");
  else if(my.place===1) head="🥇 "+L("G'alaba! Siz birinchisiz!","Victory! You are first!");
  else if(my.place===2) head="🥈 "+L("Ajoyib natija — 2-o'rin!","Great — 2nd place!");
  else if(my.place===3) head="🥉 "+L("Zo'r! 3-o'rin!","Nice! 3rd place!");
  else head=time?"⏱ "+L("Vaqt tugadi","Time is up")+" — "+my.place+"-"+L("o'rin","place"):"🏁 "+L("Marraga yetdingiz","You finished")+" — "+my.place+"-"+L("o'rin","place");
  var sub=esc(lg.fl+" "+lg.nm)+" · "+esc(lvlNm(R.lvl))+" · "+esc(modeNm(R.mk))+(live?' · 🔴 '+L("Jonli poyga","Live race"):'');
  function medal(p){ return ["🥇","🥈","🥉"][p-1]||p; }
  var top3=rows.slice(0,3);
  var pn=[2,1,3].map(function(p){ var r=rows[p-1]; if(!r) return '<div class="yz-pn"></div>';
    return '<div class="yz-pn p'+p+(r.me?' me':'')+'"><b>'+medal(p)+' '+esc(firstName(r.n))+(r.bot?' 🤖':'')+'</b><span>'+(time?r.w+" "+L("so'z","words"):(r.wpm+" "+L("so'z/daq","wpm")))+'</span>'+
      (live&&r.pts?'<em>+'+r.pts+' '+L("ball","pts")+'</em>':'')+'</div>'; }).join("");
  var cards="";
  if(my){
    cards='<div class="yz-card big"><b>'+my.wpm+'</b><span>⚡ '+L("so'z/daqiqa","words/min")+'</span></div>'+
      '<div class="yz-card"><b>'+my.acc+'%</b><span>🎯 '+L("aniqlik","accuracy")+'</span></div>'+
      '<div class="yz-card"><b>'+(time?my.words:fmtT1(my.ms))+'</b><span>'+(time?"✍️ "+L("so'z","words"):"⏱ "+L("vaqt","time"))+'</span></div>'+
      '<div class="yz-card"><b>'+my.cpm+'</b><span>🔤 '+L("belgi/daqiqa","chars/min")+'</span></div>'+
      '<div class="yz-card'+(o.isPB?' pb':'')+'"><b>'+(o.isPB?my.wpm:(o.prev?o.prev.w:"—"))+'</b><span>🏆 '+L("shaxsiy rekord","personal best")+'</span>'+(o.isPB?'<em>'+L("YANGI!","NEW!")+'</em>':'')+'</div>'+
      (solo?'':'<div class="yz-card"><b>'+my.place+'/'+my.n+'</b><span>🏅 '+L("o'rin","place")+'</span></div>')+
      (live&&my.pts?'<div class="yz-card pb"><b>+'+my.pts+'</b><span>⭐ '+L("reyting balli","rating points")+'</span></div>':'');
  }
  var miss=R.ty?Object.keys(R.ty.miss).map(function(k){ return [k,R.ty.miss[k]]; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,10):[];
  var missH=miss.length?'<div class="yz-keys">'+miss.map(function(m){ return '<span class="yz-key"><b>'+esc(m[0]==="⎵"?"⎵ "+L("bo'shliq","space"):m[0])+'</b><i>×'+m[1]+'</i></span>'; }).join("")+'</div>'
    :'<p class="yz-sm">'+(my?L("Birorta ham xato yo'q — barakalla! 👏","Not a single mistake — well done! 👏"):"—")+'</p>';
  var tb='<div class="yz-tw"><table class="yz-tb"><thead><tr><th>#</th><th>'+L("Ism","Name")+'</th><th>⚡ '+L("so'z/daq","wpm")+'</th><th>🎯</th><th>'+(time?"✍️ "+L("so'z","words"):"⏱ "+L("vaqt","time"))+'</th>'+(live?'<th>⭐</th>':'')+'</tr></thead><tbody>'+
    rows.map(function(r){ return '<tr class="'+(r.me?'me':'')+(r.sus?' sus':'')+'"><td>'+medal(r.place)+'</td><td>'+(r.bot?'🤖 ':'')+esc(r.n)+(r.me?' <span class="yz-you">'+L("siz","you")+'</span>':'')+'</td><td><b>'+(r.wpm||0)+'</b></td><td>'+(r.acc!=null?r.acc+"%":"—")+'</td><td>'+
      (time?r.w:(r.fin===false?Math.round((r.ch||0)/R.T.n*100)+"%":(r.est?"≈ ":"")+fmtT1(r.ms)))+'</td>'+(live?'<td>'+(r.pts?'<b class="yz-pts">+'+r.pts+'</b>':'')+'</td>':'')+'</tr>'; }).join("")+'</tbody></table></div>';
  ROOT.innerHTML='<div class="yz yz-res">'+
    '<div class="yz-rhead"><div><span class="yz-kick">⌨️ '+L("YOZUV MARAFONI","TYPING MARATHON")+'</span><h1>'+head+'</h1><p>'+sub+'</p></div>'+
      '<div class="yz-tools2"><button type="button" class="yz-ib" id="yzSnd">'+sndIc()+'</button><a class="yz-ib" href="#/" title="Arena">✕</a></div></div>'+
    (o.banner?'<div class="yz-banner">'+o.banner+'</div>':'')+
    (o.isPB?'<div class="yz-pbbadge">🏆 '+L("YANGI SHAXSIY REKORD!","NEW PERSONAL BEST!")+' <b>'+my.wpm+'</b> '+L("so'z/daqiqa","wpm")+'</div>':'')+
    '<div class="yz-podwrap"><canvas id="yzPod"></canvas><div class="yz-pnames">'+pn+'</div></div>'+
    (cards?'<div class="yz-cards">'+cards+'</div>':'')+
    '<div class="yz-grid">'+
      '<section class="yz-panel"><h3>📈 '+L("Tezlik grafigi","Speed chart")+'</h3><canvas id="yzChart" class="yz-chart"></canvas></section>'+
      '<section class="yz-panel"><h3>🔤 '+L("Ko'p xato qilingan harflar","Most missed letters")+'</h3>'+missH+'</section></div>'+
    '<section class="yz-panel"><h3>🏁 '+L("Natijalar jadvali","Results")+'</h3>'+tb+(o.foot?'<p class="yz-sm" style="margin-top:8px">'+o.foot+'</p>':'')+'</section>'+
    '<div class="yz-acts">'+(OPEN?'<button type="button" class="yz-go" id="yzAgain">'+(o.kind==="room"?"🔁 "+L("Shu xonada yana poyga","Race again in this room"):"🔄 "+L("Qayta o'ynash","Play again"))+'</button>':'')+
      '<button type="button" class="yz-btn2" id="yzHome">🏠 '+L("Bosh ekran","Home")+'</button>'+
      '<a class="yz-btn2" href="#/">🎮 '+L("Arena","Arena")+'</a></div>'+
    (OPEN?'<p class="yz-sm yz-center">⌨️ Enter — '+L("qayta o'ynash","play again")+'</p>':'')+
  '</div>';
  bindSnd("yzSnd");
  $("yzHome").onclick=function(){ vHome(); };
  function again(){ if(o.kind==="room"){ SND.unlock(); roomAgain(R.room); return; } var s=settings(); s.l=R.lang; s.v=R.lvl; s.m=(R.mk&&/^(fin|t60|t120|t180)$/.test(R.mk))?R.mk:"fin"; saveSet(s); SND.unlock(); startPractice(); }
  if($("yzAgain")) $("yzAgain").onclick=again;
  on(document,"keydown",function(e){ if(e.key==="Enter"&&VIEW==="res"&&OPEN&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||"")){ e.preventDefault(); again(); } });
  /* shohsupa */
  var cv=$("yzPod"), S=mkScene(cv,{mini:false,tags:false,cam0:0});
  S.podium=top3.map(function(r){ return {lk:r.lk||lookOf(0),num:r.num||7}; }); S.rain(150);
  loopOn(function(dt){ if(!document.body.contains(cv)) return; S.fit(); S.step(dt); if(S.conf.length<40&&S.t<9) S.rain(30); S.draw(); });
  chart(R);
  on(window,"resize",function(){ chart(R); });
  if(my&&(my.place<=3&&!solo||o.isPB)){ later(function(){ if(X.FX) X.FX.confetti(3600); SND.fin(); SND.cheer(true); },250); }
  else if(my) later(function(){ SND.cheer(false); },250);
}
/* tezlik grafigi (so'z/daqiqa vaqt bo'yicha) */
function chart(R){
  var cv=$("yzChart"); if(!cv) return;
  var dpr=Math.min(2,window.devicePixelRatio||1), w=cv.clientWidth||320, h=cv.clientHeight||170;
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  var c=cv.getContext("2d"); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h);
  var sm=(R.samples||[]).filter(function(p){ return p.t>=2000; });
  var dark=document.documentElement.getAttribute("data-theme")==="dark", ink=dark?"#9db0cd":"#5b6b82", grid=dark?"rgba(255,255,255,.08)":"rgba(13,27,42,.08)";
  if(sm.length<2){ c.fillStyle=ink; c.font="600 13px system-ui,Arial"; c.textAlign="center"; c.fillText(L("Grafik uchun poyga juda qisqa bo'ldi","The race was too short for a chart"),w/2,h/2); return; }
  /* oniy tezlik: so'nggi 4 soniyadagi belgilar → so'z (matnning o'rtacha so'z uzunligi bilan) */
  var cpw=R.T.n/R.T.nw, pts=sm.map(function(p,i){ var j=i; while(j>0&&p.t-sm[j-1].t<=4000) j--; var q=j<i?sm[j]:{t:0,c:0};
    return {t:p.t,v:Math.max(0,(p.c-q.c)/cpw*60000/Math.max(500,p.t-q.t))}; });
  var mx=Math.max(20,Math.ceil(Math.max.apply(null,pts.map(function(p){ return p.v; }))/20)*20), t1=pts[pts.length-1].t, pl=34, pr=10, pt=10, pb=22;
  function X_(t){ return pl+(w-pl-pr)*t/t1; } function Y_(v){ return pt+(h-pt-pb)*(1-v/mx); }
  c.strokeStyle=grid; c.lineWidth=1; c.fillStyle=ink; c.font="600 11px system-ui,Arial"; c.textAlign="right"; c.textBaseline="middle";
  for(var g=0;g<=4;g++){ var v=mx*g/4, y=Y_(v); c.beginPath(); c.moveTo(pl,y); c.lineTo(w-pr,y); c.stroke(); c.fillText(Math.round(v),pl-6,y); }
  c.textAlign="center"; c.textBaseline="top"; c.fillText("0:00",pl,h-pb+6); c.fillText(fmtT(t1),w-pr-12,h-pb+6);
  var gr=c.createLinearGradient(0,pt,0,h-pb); gr.addColorStop(0,"rgba(255,90,31,.45)"); gr.addColorStop(1,"rgba(124,58,237,.03)");
  c.beginPath(); c.moveTo(X_(pts[0].t),h-pb); pts.forEach(function(p){ c.lineTo(X_(p.t),Y_(p.v)); }); c.lineTo(X_(t1),h-pb); c.closePath(); c.fillStyle=gr; c.fill();
  c.beginPath(); pts.forEach(function(p,i){ if(i) c.lineTo(X_(p.t),Y_(p.v)); else c.moveTo(X_(p.t),Y_(p.v)); });
  var lg=c.createLinearGradient(pl,0,w,0); lg.addColorStop(0,"#ff7a18"); lg.addColorStop(.6,"#ff2e7e"); lg.addColorStop(1,"#7c3aed");
  c.strokeStyle=lg; c.lineWidth=3; c.lineJoin="round"; c.stroke();
  var avg=pts.reduce(function(s,p){ return s+p.v; },0)/pts.length;
  c.setLineDash([6,5]); c.strokeStyle=dark?"rgba(255,255,255,.45)":"rgba(13,27,42,.4)"; c.lineWidth=1.4; c.beginPath(); c.moveTo(pl,Y_(avg)); c.lineTo(w-pr,Y_(avg)); c.stroke(); c.setLineDash([]);
  c.fillStyle=ink; c.textAlign="left"; c.textBaseline="bottom"; c.fillText(L("o'rtacha","average")+" "+Math.round(avg),pl+6,Y_(avg)-3);
}

/* ================== 11. JONLI POYGA ==================
   Vaqt hamma joyda server soati bilan (X.snow()). Bosqichlar:
   lobbi (meta.open … start) → 3-2-1 → poyga (start … start+dur) → rasmiy natija (meta.end dan keyin). */
var LIVE={g:null,joined:{}};
function dayLbl(ms){ var d=X.kday(ms), t=X.kday(X.snow()), tm=X.kday(X.snow()+86400000);
  return (d===t?L("Bugun","Today"):d===tm?L("Ertaga","Tomorrow"):d.slice(8,10)+"."+d.slice(5,7))+" "+X.kHM(ms); }
function liveMk(m){ return m.mode==="time"?("t"+(+m.dur||60)):"fin"; }
function liveFind(cb){
  if(!X.online()||!X.base()){ cb(null); return; }
  var q='?orderBy='+encodeURIComponent('"$key"')+'&startAt='+encodeURIComponent('"'+X.kday(X.snow()-86400000)+'"')+'&limitToFirst=20';
  X.tmo(fetch(X.base()+"/kahoot/idx.json"+q),9000).then(function(r){ return r.ok?r.json():null; }).catch(function(){ return null; }).then(function(idx){
    var t=X.snow(), list=Object.keys(idx||{}).map(function(k){ var e=idx[k]; if(e&&typeof e==="object") e.d=k; return e; })
      .filter(function(e){ return e&&e.type==="yz"&&+e.end+15*60000>t; }).sort(function(a,b){ return a.start-b.start; });
    var g=list[0]; if(!g){ cb(null); return; }
    X.kget("games/"+g.d+"/meta",function(m){ cb(m&&m.type==="yz"?{d:g.d,m:m}:null); });
  });
}
function liveChips(m){
  var lg=langOf(m.lang||"uz");
  return '<span>'+esc(modeNm(liveMk(m)))+'</span><span>'+esc(lg.fl+" "+lg.nm)+'</span><span>'+lvIcon(m.lvl)+' '+esc(lvlNm(m.lvl||"orta"))+'</span>'+
    '<span>👥 '+L("kamida","min")+' '+(+m.min||3)+'</span><span>🏆 +5 · +4 · +3</span>';
}
/* bosh ekrandagi jonli poyga kartasi */
function liveCard(){
  var box=$("yzLive"); if(!box) return;
  if(!X.online()){ box.innerHTML='<div class="yz-lc none">🔌 '+L("Internet yo'q — jonli poyga ko'rinmaydi.","Offline — live races are hidden.")+'</div>'; return; }
  var a=ALIVE, me=ME();
  function load(){
    liveFind(function(g){
      if(a!==ALIVE) return;
      LIVE.g=g;
      /* har safar tekshiriladi: o'qituvchi poygani qayta tuzsa, oldingi qo'shilish o'chadi */
      if(g&&me) X.kget("games/"+g.d+"/p/"+me.id,function(v,st){ if(st===200) LIVE.joined[g.d]=!!v; draw(); });
      draw();
    });
  }
  function draw(){
    var b=$("yzLive"); if(!b||a!==ALIVE) return;
    var g=LIVE.g, t=X.snow();
    if(!g){ var h0='<div class="yz-lc none">🗓 '+L("Hozircha jonli poyga e'lon qilinmagan. O'qituvchi tashkil etsa, shu yerda chiqadi va hamma qo'shila oladi. Ungacha mashq qiling!","No live race yet. When the teacher sets one up it shows here and everyone can join. Practice meanwhile!")+'</div>';
      if(b._h!==h0){ b.innerHTML=h0; b._h=h0; } return; }
    var m=g.m, jn=!!LIVE.joined[g.d], cls, t1, t2, btn="", act="";
    if(t<m.open){ cls="wait"; t1="⌨️ "+L("Jonli poyga","Live race")+" · "+dayLbl(m.start); t2=L("Qo'shilish ","Joining opens at ")+X.kHM(m.open)+L(" da ochiladi · boshlanishiga "," · starts in ")+X.kLeft(m.start-t); }
    else if(t<m.start){ cls="hot"; t1=jn?"✅ "+L("Siz poygadasiz!","You are in!"):"🔴 "+L("Lobbi ochiq — hozir qo'shiling!","The lobby is open — join now!"); t2=L("Start: ","Start in: ")+X.kLeft(m.start-t);
      btn=jn?L("Lobbiga o'tish ›","Go to the lobby ›"):"⚡ "+L("Qo'shilish","Join"); act=jn?"open":"join"; }
    else if(t<m.end){ cls="on"; t1="🏃 "+L("Poyga ketmoqda!","The race is on!"); t2=jn?L("Siz qatnashyapsiz","You are racing"):L("Qo'shilish vaqti o'tgan — tomosha qiling","Joining is closed — watch it"); btn=jn?L("Davom etish ›","Continue ›"):"👀 "+L("Tomosha qilish","Watch"); act="open"; }
    else { cls="done"; t1="🏁 "+L("Poyga tugadi","The race is over"); t2=dayLbl(m.start); btn=L("Natijalar ›","Results ›"); act="open"; }
    var h='<div class="yz-lc '+cls+'"><div class="yz-lci"><span class="yz-lck">🔴 '+L("JONLI POYGA","LIVE RACE")+'</span><b>'+esc(t1)+'</b><span class="yz-lct" id="yzLct"></span>'+
      '<div class="yz-lcc">'+liveChips(m)+'</div>'+(m.note?'<div class="yz-lcn">📝 '+esc(m.note)+'</div>':'')+'<p class="yz-lce" id="yzLce"></p></div>'+
      (btn?'<button type="button" class="yz-lcb" data-a="'+act+'">'+esc(btn)+'</button>':'')+'</div>';
    if(b._h!==h){ var err=$("yzLce"), et=err?err.innerHTML:""; b.innerHTML=h; b._h=h; if(et&&$("yzLce")) $("yzLce").innerHTML=et;
      var bt=b.querySelector(".yz-lcb"); if(bt) bt.onclick=function(){ SND.unlock(); if(bt.dataset.a==="join") liveJoin(g,bt); else liveOpen(g); }; }
    setTxt("yzLct",t2);
    /* qo'shilgan bo'lsa — start oldidan o'zi poyga ekraniga o'tadi */
    if(jn&&VIEW==="home"&&t>=m.start-20000&&t<m.start+5000) liveOpen(g);
  }
  load(); every(draw,1000); every(load,30000);
  every(function(){ lockCheck(function(o){ if(a===ALIVE&&VIEW==="home"&&o!==OPEN){ OPEN=o; vHome(); } }); },20000);
}
function liveJoin(g,btn){
  var me=ME(); if(!me) return;
  function fail(t){ var e=$("yzLce"); if(e) e.innerHTML=t; if(btn){ btn.disabled=false; btn.textContent="⚡ "+L("Qo'shilish","Join"); } }
  if(btn){ btn.disabled=true; btn.textContent="⏳ "+L("Qo'shilmoqda…","Joining…"); }
  X.saToken(true,function(){
    X.claimMe(function(own){
      if(!own){ fail(L("Hisobingiz shu brauzerda tasdiqlanmagan. Avval istalgan mavzu taqdimotini ochib, hisobingizga kiring, so'ng qaytib keling.","Your account is not confirmed in this browser. Open any lesson, sign in, then come back.")+' <a href="tadbirkorlik-asoslari.html">📚 '+L("Darsga o'tish","Go to the lesson")+'</a>'); return; }
      X.clockSync(function(){
        var nm=myName().slice(0,60)||"?";
        X.kput("games/"+g.d+"/p/"+me.id,{n:nm,g:String(me.group||"").slice(0,30),at:{".sv":"timestamp"}},function(ok,st){
          function done(){ LIVE.joined[g.d]=true;
            X.DB.upd("yz/"+g.d+"/"+me.id,{n:nm,av:myLook(),p:0,w:0,s:0,ac:100,f:0,at:Date.now()});
            if(X.FX){ X.FX.s.ok(); X.FX.confetti(1200); } liveOpen(g); }
          if(ok){ done(); return; }
          X.kget("games/"+g.d+"/p/"+me.id,function(v){
            if(v){ done(); return; }
            fail((st===401||st===403)?L("Qo'shilib bo'lmadi: lobbi yopilgan yoki hisob tasdiqlanmagan.","Could not join: the lobby is closed or the account is not approved."):L("Tarmoq xatosi — qayta urinib ko'ring.","Network error — try again."));
          });
        });
      });
    });
  });
}
/* tanlangan ko'rinishni jonli poygadagi yozuvga ham yozish */
function liveLook(){ var g=LIVE.g, me=ME(); if(g&&me&&LIVE.joined[g.d]&&X.snow()<g.m.start) X.DB.upd("yz/"+g.d+"/"+me.id,{av:myLook()}); }
function liveOpen(g){
  var m=g.m, me=ME(), mk=liveMk(m);
  var R=mkRace({kind:"live",lang:m.lang||"uz",lvl:m.lvl||"orta",mk:mk,mode:m.mode==="time"?"time":"fin",dur:+m.dur||60,
    text:L("Matn start paytida ochiladi. Barmoqlaringizni tayyorlang!","The text appears at the start. Get your fingers ready!"),key:g.d,meta:m});
  R.joined=!!(me&&LIVE.joined[g.d]); R.pl={}; R.cpSent=0; R.posAt=0; R.cpAt=0; R.textOk=false; R.finOrder=[];
  vRace(R);
  X.saToken(true,function(){ X.clockSync(function(){}); });
}
function liveSetup(R){
  var m=R.meta, S=R.scene, me=ME();
  S.len=(+m.nc||300)*PX-15; S.marks=[];
  R.ty=null;
  if(!R.joined){ var ir=document.querySelector(".yz-inrow"); if(ir) ir.innerHTML='<div class="yz-watch">👀 '+L("Tomosha rejimi — siz bu poygaga qo'shilmagansiz.","Watching — you did not join this race.")+'</div>'; }
  else { var inp=$("yzIn"); inp.disabled=false; inp.placeholder=L("Matn START da ochiladi…","The text opens at START…");
    on(inp,"input",function(){ if(!R.ty&&inp.value){ inp.value=""; pop(L("Shoshilmang — START ni kuting!","Wait for START!"),"warn"); } }); }
  $("yzText").textContent=R.T.s;
  if(R.joined&&me){ R.pl[me.id]={n:myName(),av:myLook(),p:0,at:0}; liveRunner(R,me.id); }
  livePollP(R); livePoll(R);
  every(function(){ liveTick(R); },200);
  every(function(){ var t=X.snow(); if(t<m.start+3000) livePollP(R); },2500);
  every(function(){ var t=X.snow(); if(t>m.start-6000||t%3000<1000) livePoll(R); },900);
}
function livePollP(R){
  if(R.pBusy) return; R.pBusy=true;
  X.kget("games/"+R.key+"/p",function(v,st){ R.pBusy=false; if(RC!==R||st!==200) return;
    Object.keys(v||{}).forEach(function(id){ var x=R.pl[id]||(R.pl[id]={p:0}); x.n=v[id].n||x.n||"?"; x.at=+v[id].at||0; x.joined=true; });
    R.nP=Object.keys(v||{}).length; liveLanes(R); });
}
function livePoll(R){
  if(R.lBusy) return; R.lBusy=true;
  X.DB.get("yz/"+R.key,function(v){ R.lBusy=false; if(RC!==R) return;
    var me=ME(), t=now();
    Object.keys(v||{}).forEach(function(id){
      var d=v[id]||{}, x=R.pl[id]||(R.pl[id]={});
      if(!x.n) x.n=d.n||"?"; x.av=d.av; x.ac=d.ac;
      if(me&&id===me.id){ if(!R.ty&&+d.w>0) R.resumeW=+d.w; return; }
      if(+d.p>=(+x.p||0)){ x.p=+d.p||0; x.w=+d.w||0; x.s=+d.s||0; x.rcv=t; }
      x.f=+d.f||0;
    });
    liveLanes(R);
  });
}
/* yo'laklar: men eng yaqin yo'lakda, qolganlar qo'shilish tartibida (ko'p bo'lsa bir yo'lakda bir nechta) */
function liveRunner(R,id){
  var x=R.pl[id], S=R.scene, me=ME(); if(!x) return null;
  if(!x.r){ x.r=S.add({id:id,n:x.n||"?",lk:lookOf(x.av!=null?x.av:hash(id)%LOOKS.length),lane:0,me:!!(me&&id===me.id),num:10+hash(id)%89,x:-20}); x.r.tagTxt=firstName(x.n); }
  else if(x.av!=null&&x.r.lk!==lookOf(x.av)&&!R.started) x.r.lk=lookOf(x.av);
  return x.r;
}
function liveLanes(R){
  var S=R.scene, me=ME(), ids=Object.keys(R.pl).filter(function(id){ return R.pl[id].joined||R.pl[id].p>0||(me&&id===me.id&&R.joined); });
  var maxL=S.H<280?6:8, mine=me&&R.joined?me.id:null;
  ids.sort(function(a,b){ return ((R.pl[a].at||9e15)-(R.pl[b].at||9e15))||(a<b?-1:1); });
  var others=ids.filter(function(id){ return id!==mine; }), nl=clamp(others.length+(mine?1:0),3,maxL), ol=mine?nl-1:nl;
  S.nl=nl;
  others.forEach(function(id,i){ var r=liveRunner(R,id); if(r){ r.lane=ol>0?i%ol:0; r.n=R.pl[id].n||r.n; } });
  if(mine){ var r0=liveRunner(R,mine); r0.lane=nl-1; R.me=r0; if(!S.follow||S.follow===r0||!R.meDone) S.follow=r0; }
  if(!mine&&!S.follow&&S.rs.length) S.follow=S.rs[0];
}
function liveTick(R){
  if(RC!==R) return;
  var m=R.meta, t=X.snow(), S=R.scene;
  if(t<m.start-3600){
    var n=R.nP||0, need=+m.min||3;
    if(t>=m.start-6000) S.ready=true;
    note('<span>'+L("Boshlanishiga","Starts in")+'</span><b>'+X.kLeft(m.start-t)+'</b><small>👥 '+n+' '+L("ishtirokchi","players")+(n<need?' · '+L("kamida "+need+" kerak","need "+need):' ✅')+'</small>'+(R.joined?'':'<small>'+L("Siz tomoshabinsiz","You are watching")+'</small>'));
  } else if(t<m.start){
    note(""); S.ready=true;
    var s=Math.ceil((m.start-t)/1000);
    if(s!==R.cdS&&s<=3){ R.cdS=s; var cd=$("yzCd"); if(cd) cd.innerHTML='<b>'+s+'</b>'; SND.beep(false); if(s===1) S.set=true; }
    if(!R.textOk) liveText(R);
  } else if(!R.started){
    if(R.textOk||!R.joined){ R.started=true; R.t0=now()-(t-m.start); S.go=true; goShow(); SND.pistol(); SND.amb(.016);
      if(R.ty&&R.joined){ R.ty.start(R.t0); var inp=$("yzIn"); if(inp){ inp.placeholder=L("Yozing!","Type!"); try{ inp.focus({preventScroll:true}); }catch(e){ inp.focus(); } } }
      var w=$("yzText"); if(w) w.classList.remove("wait"); }
    else { liveText(R); note('<span>'+L("Matn yuklanmoqda…","Loading the text…")+'</span>'); }
  }
  /* poyga vaqti tugadi */
  if(R.started&&!R.over&&t>=m.start+(+m.dur||0)*1000){
    if(R.mode==="time"||!R.meDone){ timeUp(R); liveFlush(R,true); later(function(){ liveWait(R); },2200); }
    else R.over=true;
  }
  if(t>=m.end+400&&!R.offBusy&&!R.offDone&&(R.over||R.meDone||!R.joined)) liveOfficial(R);
}
function liveText(R){
  if(R.tBusy||R.textOk) return; R.tBusy=true;
  X.kget("games/"+R.key+"/q/0",function(v){
    R.tBusy=false; if(RC!==R||!v||!v.t||R.textOk) return;
    R.textOk=true; R.T=mkText(v.t); R.scene.len=R.T.n*PX-15; R.scene.marks=markList(R.T,R.mode);
    if(R.joined){
      R.ty=mkTyper(R.T,$("yzText"),$("yzIn"),{
        key:function(){ SND.key(); }, err:function(){ SND.err(); if(R.me) R.me.stum=.32; },
        done:function(){ meDone(R); }, early:function(){ pop(L("Shoshilmang — START ni kuting!","Wait for START!"),"warn"); },
        hint:function(t){ var hh=$("yzHint"); if(hh){ hh.textContent=t; hh.classList.add("on"); later(function(){ var h2=$("yzHint"); if(h2) h2.classList.remove("on"); },3500); } },
        prog:function(){ if(R.me&&!R.me.fin) R.me.tx=wx(R.ty.chars()); }
      });
      /* sahifa yangilangan bo'lsa — yozilgan joydan davom etadi */
      if(R.resumeW>0&&R.resumeW<R.T.nw){ R.ty.wi=R.resumeW; R.cpSent=R.resumeW; R.ty.render(); if(R.me){ R.me.x=R.me.tx=wx(R.ty.chars()); } }
    } else $("yzText").textContent=R.T.s;
  });
}
function liveFrame(R,dt){
  if(!R.started) return;
  var t=now(), cpw=R.T.n/Math.max(1,R.T.nw), me=ME();
  Object.keys(R.pl).forEach(function(id){
    var x=R.pl[id], r=x.r; if(!r||(me&&id===me.id&&R.joined)) return;
    if(x.f>0){ if(!r.fin){ r.tx=wx(R.T.n); if(r.x>wx(R.T.n)-PX*2) runnerFin(R,r); } return; }
    if(R.over) return;
    var est=(+x.p||0)+((x.s>0&&x.rcv)?Math.min(10,x.s*cpw/60*(t-x.rcv)/1000):0);
    r.tx=Math.max(r.tx,wx(Math.min(R.T.n,est)));
  });
  /* men marraga yetgach yoki tomoshabin bo'lsam — kamera eng oldingi yugurayotganni kuzatadi */
  if((!R.joined||(R.meDone&&now()-R.t0-R.finMs>3000))){
    var best=null; R.scene.rs.forEach(function(r){ if(!r.fin&&(!best||r.tx>best.tx)) best=r; });
    if(best) R.scene.follow=best;
  }
}
function livePlace(R){
  var me=ME(), mine=R.ty?R.ty.chars():0, pl=1, n=0;
  Object.keys(R.pl).forEach(function(id){ var x=R.pl[id]; if(!x.joined&&!(x.p>0)) return; n++; if(me&&id===me.id) return;
    if(R.meDone){ if(x.f>0&&x.f<R.finMs) pl++; } else if(x.f>0||(+x.p||0)>mine) pl++; });
  return {pl:R.joined?pl:"—",n:Math.max(n,1)};
}
function liveStats(R,st){
  var me=ME(); if(!me||!R.joined||!R.started||!R.ty){ if(now()-(R.sideAt||0)>900){ R.sideAt=now(); liveSide(R); } return; }
  var t=now();
  if(!R.over&&t-R.posAt>700){ liveFlush(R,false); }
  if(t-(R.sideAt||0)>900){ R.sideAt=t; liveSide(R); }
}
function liveFlush(R,force){
  var me=ME(); if(!me||!R.ty) return;
  var st=R.ty.stats(now()), t=now();
  R.posAt=t;
  X.DB.upd("yz/"+R.key+"/"+me.id,{n:myName().slice(0,60),av:myLook(),p:st.chars,w:st.words,s:Math.round(st.wpm),ac:st.acc,f:R.finMs?Math.round(R.finMs):0,at:Date.now()});
  var wi=R.ty.wi;
  if(wi>R.cpSent&&(!R.cpBusy||force)){
    R.cpBusy=true; var i=wi;
    X.kput("games/"+R.key+"/a/"+i+"/"+me.id,{c:0,t:{".sv":"timestamp"}},function(ok,stt){ R.cpBusy=false; if(ok||stt===401||stt===403) R.cpSent=Math.max(R.cpSent,i); });
  }
}
function liveSide(R){
  var box=$("yzSide"); if(!box) return;
  var me=ME(), list=Object.keys(R.pl).filter(function(id){ var x=R.pl[id]; return x.joined||x.p>0; }).map(function(id){
    var x=R.pl[id], mine=me&&id===me.id&&R.ty;
    return {id:id,n:x.n,p:mine?R.ty.chars():(+x.p||0),s:mine?Math.round(R.ty.stats(now()).wpm):(+x.s||0),f:mine?(R.finMs||0):(+x.f||0),av:x.av,me:me&&id===me.id};
  }).sort(function(a,b){ return (a.f&&b.f)?a.f-b.f:(a.f?-1:b.f?1:b.p-a.p); });
  var nn=R.T.n||1;
  box.innerHTML='<h4>🏁 '+L("Jonli o'rinlar","Live standings")+'</h4><ol>'+list.slice(0,12).map(function(x,i){
    return '<li class="'+(x.me?'me':'')+'"><span class="yz-rk">'+(i+1)+'</span><span class="yz-dot" style="background:'+lookOf(x.av!=null?x.av:hash(x.id)%LOOKS.length).jer+'"></span><b>'+esc(firstName(x.n))+'</b><em>'+(x.f?"🏁":(R.mode==="time"?wordsAt(R.T,x.p)+" "+L("so'z","w"):Math.round(x.p/nn*100)+"%"))+'</em></li>';
  }).join("")+'</ol>'+(list.length>12?'<p class="yz-sm">+'+(list.length-12)+'</p>':'');
}
function liveMeDone(R){
  liveFlush(R,true);
  SND.amb(.03);
  later(function(){ liveWait(R); },2400);
}
/* marradan keyin: rasmiy natijani kutish (poyga davom etayotgan bo'lsa tomosha qilinadi) */
function liveWait(R){
  if(RC!==R) return;
  var ir=document.querySelector(".yz-inrow"), st=R.ty?R.ty.stats(now()):null, p=livePlace(R);
  if(ir&&st) ir.innerHTML='<div class="yz-donebox">🏁 <b>'+(R.mode==="time"?L("Vaqt tugadi!","Time!"):L("Marraga yetdingiz!","You finished!"))+'</b> '+
    L("Hozircha","Now")+' <b>'+p.pl+'-'+L("o'rin","place")+'</b> · ⚡ '+Math.round(st.wpm)+' '+L("so'z/daq","wpm")+' · 🎯 '+st.acc+'%<br><span id="yzOff">'+L("Rasmiy natija tayyorlanmoqda…","Preparing official results…")+'</span></div>';
  every(function(){ var e=$("yzOff"); if(e) e.textContent="⏳ "+L("Rasmiy natija: ","Official results in ")+X.kLeft(Math.max(0,R.meta.end+400-X.snow())); },500);
}
function liveOfficial(R){
  R.offBusy=true; R.offTry=(R.offTry||0)+1;
  X.kget("games/"+R.key,function(g,st){
    R.offBusy=false; if(RC!==R) return;
    if(!g||!g.meta){ if(R.offTry<30) return; R.offDone=true; liveResults(R,null); return; }
    R.offDone=true; liveResults(R,g);
  });
}
function liveResults(R,g){
  var me=ME(), sc=g?yzScore(g):null, T=R.T, time=R.mode==="time", rows;
  if(sc){
    if(g.q&&g.q[0]&&g.q[0].t&&!R.textOk){ R.T=T=mkText(g.q[0].t); }
    rows=sc.rows.map(function(r){ var x=R.pl[r.sid]||{}, mine=me&&r.sid===me.id;
      return {sid:r.sid,n:r.n,me:mine,lk:lookOf(x.av!=null?x.av:hash(r.sid)%LOOKS.length),num:10+hash(r.sid)%89,w:r.w,ch:r.ch,ms:r.t,wpm:r.wpm,
        acc:mine&&R.ty?R.ty.stats(now()).acc:(x.ac!=null?x.ac:null),fin:time?true:r.fin,place:r.rank,pts:sc.prizes[r.sid]||0,sus:r.sus}; });
  } else {
    rows=Object.keys(R.pl).map(function(id){ var x=R.pl[id], mine=me&&id===me.id, c=mine&&R.ty?R.ty.chars():(+x.p||0);
      return {sid:id,n:x.n,me:mine,lk:lookOf(x.av!=null?x.av:hash(id)%LOOKS.length),num:10+hash(id)%89,ch:c,w:wordsAt(T,c),ms:mine?(R.finMs||R.dur*1000):(x.f||R.dur*1000),wpm:+x.s||0,acc:x.ac,fin:!!(mine?R.finMs:x.f)}; })
      .sort(function(a,b){ return (b.ch-a.ch)||(a.ms-b.ms); });
    rows.forEach(function(r,i){ r.place=i+1; });
  }
  var mine=rows.filter(function(r){ return r.me; })[0], my=null, isPB=false, prev=null;
  if(mine&&R.ty){
    var st=R.ty.stats(now()), ms=time?R.dur*1000:(R.finMs||st.el), cpm=Math.round(st.chars*60000/Math.max(1000,ms));
    my={wpm:mine.wpm||Math.round(st.wpm),acc:st.acc,ms:ms,words:mine.w,chars:st.chars,cpm:cpm,place:mine.place,n:rows.length,pts:mine.pts||0};
    prev=pbGet(R.lang,R.lvl,R.mk); if(my.words>0) isPB=pbSave(R.lang,R.lvl,R.mk,{w:my.wpm,a:my.acc,c:cpm,t:ms,at:Date.now()});
    histAdd({at:Date.now(),l:R.lang,v:R.lvl,m:R.mk,w:my.wpm,a:my.acc,c:cpm,pl:my.place,n:my.n,live:1});
  }
  var banner, foot=L("1-o'rin +5, 2-o'rin +4, 3-o'rin +3 ball umumiy reytingga avtomatik qo'shiladi (taqdimotdagi reytingda ko'rinadi).","1st +5, 2nd +4, 3rd +3 points are added to the main rating automatically.");
  if(!sc) banner="⚠️ "+L("Rasmiy natijani o'qib bo'lmadi — jonli ma'lumot bo'yicha ko'rsatildi.","Could not read the official results — showing live data.");
  else if(!sc.valid) banner="⚠️ "+L("Ishtirokchilar kam bo'ldi (kamida "+(+R.meta.min||3)+" kerak edi) — bu poyga uchun ball berilmaydi.","Too few players (needed "+(+R.meta.min||3)+") — no points for this race.");
  else banner="✅ "+L("Rasmiy natija","Official results")+(my&&my.pts?" · ⭐ "+L("Sizga","You get")+" <b>+"+my.pts+"</b> "+L("ball!","points!"):"");
  if(rows.some(function(r){ return r.sus; })) foot+=" "+L("⚠️ belgisi — imkonsiz darajada tez natija, hisobga olinmadi.","⚠️ marks an impossibly fast result that was not counted.");
  vResults({R:R,rows:rows,my:my,isPB:isPB,prev:prev,kind:"live",banner:banner,foot:foot});
}
function liveLeave(R){ if(R&&R.joined&&R.started&&!R.over&&R.ty) liveFlush(R,true); }

/* ================== 11b. XONA: DO'STLAR BILAN POYGA (2–6 kishi) ==================
   Talabalarning o'zi ochadi: arena/yzr/<KOD> = {meta:{host,hn,l,v,m,mode,dur,text,st,start,rd,at,max}, pl:{<sid>:{n,av,p,w,s,ac,f,u,at}}}
   st: "lobby" → "run" (xona egasi startni bosadi, 5 soniyadan keyin boshlanadi) → "done".
   rd — raund raqami: "Shu xonada yana" bosilsa yangi matn bilan oshadi. Reytingga ta'sir qilmaydi. */
var ROOMC="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", ROOM_MAX=6;
function roomCode(){ var c=""; for(var i=0;i<4;i++) c+=ROOMC.charAt(Math.floor(Math.random()*ROOMC.length)); return c; }
function roomMe(){ return {n:myName().slice(0,60),av:myLook(),p:0,w:0,s:0,ac:100,f:0,u:Date.now(),at:Date.now()}; }
function finDur(n){ return Math.min(600,Math.max(60,Math.ceil(n/1.6/10)*10)); }
function roomText(s){ var dur=modeDur(s.m); return {dur:dur||0,text:pickText(s.l,s.v,dur?Math.round(dur*14):0)}; }
function roomCreate(btn){
  var me=ME(); if(!OPEN||!me) return;
  if(!X.online()){ toast(L("Internet kerak","You need to be online")); return; }
  var s=settings(), tx=roomText(s), code=roomCode();
  btn.disabled=true;
  X.DB.get("yzr/"+code+"/meta",function(v){
    if(v) code=roomCode();
    var meta={host:me.id,hn:myName().slice(0,60),l:s.l,v:s.v,m:s.m,mode:tx.dur?"time":"fin",dur:tx.dur||finDur(tx.text.length),text:tx.text,st:"lobby",start:0,rd:1,at:Date.now(),max:ROOM_MAX};
    var pl={}; pl[me.id]=roomMe();
    X.DB.set("yzr/"+code,{meta:meta,pl:pl},function(r){
      btn.disabled=false;
      if(!r){ toast(L("Xona ochilmadi — internetni tekshiring","Could not open the room")); return; }
      roomOpen(code,{meta:meta,pl:pl});
    });
  });
}
function roomJoin(code){
  var me=ME(); if(!OPEN||!me) return;
  code=String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);
  if(code.length!==4){ toast(L("4 belgili kodni kiriting","Enter the 4-character code")); return; }
  X.DB.get("yzr/"+code,function(v){
    if(!v||!v.meta){ toast(L("Bunday xona topilmadi","No such room")); return; }
    var pl=v.pl||{};
    if(pl[me.id]){ roomOpen(code,v); return; }
    if(Object.keys(pl).length>=(+v.meta.max||ROOM_MAX)){ toast(L("Xona to'lgan (6 kishi)","The room is full (6 players)")); return; }
    if(v.meta.st==="run"&&X.snow()<+v.meta.start+(+v.meta.dur||60)*1000){ toast(L("Poyga ketmoqda — tugagach qo'shiling","A race is on — join when it ends")); return; }
    var mine=roomMe();
    X.DB.set("yzr/"+code+"/pl/"+me.id,mine,function(r){
      if(!r){ toast(L("Qo'shilib bo'lmadi","Could not join")); return; }
      pl[me.id]=mine; v.pl=pl; SND.tick(); roomOpen(code,v);
    });
  });
}
/* ochiq xonalar ro'yxati (bosh ekranda) */
function roomList(){
  var box=$("yzRList"); if(!box||!X.online()) return;
  var a=ALIVE;
  X.DB.get("yzr",function(v){
    if(a!==ALIVE||!$("yzRList")) return;
    var t=Date.now(), me=ME();
    var rows=Object.keys(v||{}).map(function(k){ var r=v[k]||{}; r.k=k; return r; }).filter(function(r){
      var m=r.meta; if(!m) return false;
      if(t-(+m.at||0)>6*3600000){ if(!roomList.cleaned) X.DB.del("yzr/"+r.k); return false; }   /* 6 soatdan eski xonalar tozalanadi */
      return Object.keys(r.pl||{}).length>0;
    }).sort(function(x,y){ return (+y.meta.at||0)-(+x.meta.at||0); }).slice(0,8);
    roomList.cleaned=true;
    if(!rows.length){ box.innerHTML='<p class="yz-sm">'+L("Hozircha ochiq xona yo'q — birinchi bo'lib oching!","No open rooms yet — open the first one!")+'</p>'; return; }
    box.innerHTML=rows.map(function(r){
      var m=r.meta, n=Object.keys(r.pl||{}).length, lg=langOf(m.l), mine=me&&r.pl&&r.pl[me.id], full=n>=(+m.max||ROOM_MAX);
      var st=m.st==="run"&&t<+m.start+(+m.dur||60)*1000+5000?"🏃 "+L("poyga ketmoqda","racing"):(m.st==="lobby"?"🟢 "+L("kutmoqda","waiting"):"🏁 "+L("tugagan","finished"));
      return '<div class="yz-ritem"><b>'+esc(r.k)+'</b><span>'+esc(firstName(m.hn))+' · '+esc(lg.fl)+' '+esc(lvlNm(m.v))+' · '+esc(modeNm(m.m))+'<br><small>'+st+' · 👥 '+n+'/'+(+m.max||ROOM_MAX)+'</small></span>'+
        '<button type="button" class="yz-btn2" data-room="'+esc(r.k)+'"'+(full&&!mine?' disabled':'')+'>'+(mine?L("Qaytish","Back"):full?L("To'la","Full"):L("Kirish","Join"))+'</button></div>';
    }).join("");
    [].forEach.call(box.querySelectorAll("[data-room]"),function(b){ b.onclick=function(){ SND.unlock(); roomJoin(b.dataset.room); }; });
  });
}
function roomOpen(code,v){
  var m=v.meta, me=ME();
  var R=mkRace({kind:"room",lang:m.l,lvl:m.v,mk:m.m,mode:m.mode,dur:+m.dur||60,text:m.text});
  R.room=code; R.rd=m.rd; R.rm=m; R.pl={}; R.joined=true; R.posAt=0; R.nP=0;
  Object.keys(v.pl||{}).forEach(function(id){ var d=v.pl[id]; R.pl[id]={n:d.n,av:d.av,p:0,at:+d.at||0,joined:true,seen:now()}; });
  if(me&&!R.pl[me.id]) R.pl[me.id]={n:myName(),av:myLook(),p:0,at:Date.now(),joined:true,seen:now()};
  R.nP=Object.keys(R.pl).length;
  vRace(R);
  X.saToken(true,function(){ X.clockSync(function(){}); });
}
function roomSetup(R){
  var main=document.querySelector(".yz-main");
  main.insertBefore(el('<div class="yz-room" id="yzRoom"></div>'),$("yzText"));
  $("yzIn").placeholder=L("Matn START da ochiladi…","The text opens at START…");
  liveLanes(R); roomBox(R);
  every(function(){ roomTick(R); },200);
  every(function(){ roomPoll(R); },900);
}
function el(h){ var d=document.createElement("div"); d.innerHTML=h; return d.firstChild; }
function roomPoll(R){
  if(R.pBusy) return; R.pBusy=true;
  X.DB.get("yzr/"+R.room,function(v){
    R.pBusy=false; if(RC!==R) return;
    if(!v||!v.meta){ R.gone=true; roomBox(R); return; }
    var m=v.meta, me=ME(), t=now(), pl=v.pl||{};
    if(m.rd!==R.rd){ roomOpen(R.room,v); return; }          /* yangi raund — ekran yangilanadi */
    R.rm=m;
    Object.keys(R.pl).forEach(function(id){
      if(pl[id]||(me&&id===me.id)) return;
      var x=R.pl[id]; if(x.r){ var i=R.scene.rs.indexOf(x.r); if(i>=0) R.scene.rs.splice(i,1); } delete R.pl[id];
    });
    Object.keys(pl).forEach(function(id){
      var d=pl[id]||{}, x=R.pl[id]||(R.pl[id]={p:0,seen:t});
      x.n=d.n||x.n||"?"; x.av=d.av; x.ac=d.ac; x.at=+d.at||0; x.joined=true;
      if(me&&id===me.id) return;
      if(+d.u!==x.u){ x.u=+d.u; x.seen=t; }
      if(+d.p>=(+x.p||0)){ x.p=+d.p||0; x.w=+d.w||0; x.s=+d.s||0; x.rcv=t; }
      x.f=+d.f||0;
    });
    R.nP=Object.keys(pl).length;
    liveLanes(R); roomBox(R);
  });
}
/* lobbi paneli: kod, qatnashchilar va xona egasi uchun «Boshlash» */
function roomBox(R){
  var b=$("yzRoom"); if(!b) return;
  var m=R.rm, me=ME(), host=!!(me&&m.host===me.id), t=X.snow(), ids=Object.keys(R.pl).sort(function(x,y){ return (R.pl[x].at||0)-(R.pl[y].at||0); });
  var running=m.st==="run"&&+m.start&&t<+m.start+R.dur*1000+3000, n=ids.length, h;
  if(R.started&&!R.over){ b.style.display="none"; return; }
  b.style.display="";
  if(R.gone) h='<p>⚠️ '+L("Xona yopildi.","The room was closed.")+'</p>';
  else {
    var who=ids.map(function(id){ var x=R.pl[id]; return '<span class="yz-rp'+(me&&id===me.id?' me':'')+'"><i style="background:'+lookOf(x.av!=null?x.av:hash(id)%LOOKS.length).jer+'"></i>'+esc(firstName(x.n))+(id===m.host?' 👑':'')+'</span>'; }).join("");
    var act;
    if(running) act='<p class="yz-rwait">🏁 '+L("Start berildi!","Starting!")+'</p>';
    else if(m.st!=="lobby") act=host?'<button type="button" class="yz-go" id="yzRAgain">🔁 '+L("Yangi poyga (yangi matn)","New race (new text)")+'</button>':'<p class="yz-rwait">⏳ '+L("Xona egasi yangi poyga boshlashini kuting…","Waiting for the host to start a new race…")+'</p>';
    else if(host) act='<button type="button" class="yz-go" id="yzRStart"'+(n<2?' disabled':'')+'>▶ '+L("Poygani boshlash","Start the race")+'</button>'+(n<2?'<p class="yz-rwait">'+L("Kamida 2 kishi kerak — kodni do'stlaringizga ayting","At least 2 players needed — share the code")+'</p>':'');
    else act='<p class="yz-rwait">⏳ '+L("Xona egasi poygani boshlashini kuting…","Waiting for the host to start…")+'</p>';
    h='<div class="yz-rcode"><span>'+L("Xona kodi","Room code")+'</span><b>'+esc(R.room)+'</b><small>'+L("Arena → Yozuv Marafoni → «Kod bilan kirish»","Arena → Typing Marathon → «Join with a code»")+'</small></div>'+
      '<div class="yz-rmid"><div class="yz-rps">'+who+'</div><small>👥 '+n+'/'+(+m.max||ROOM_MAX)+' · '+esc(modeNm(R.mk))+'</small></div><div class="yz-ract">'+act+'</div>';
  }
  if(b._h===h) return; b._h=h; b.innerHTML=h;
  var sb=$("yzRStart"); if(sb) sb.onclick=function(){
    if(Object.keys(R.pl).length<2) return; sb.disabled=true; SND.unlock();
    var st0=X.snow()+5000; R.rm.st="run"; R.rm.start=st0;
    X.DB.upd("yzr/"+R.room+"/meta",{st:"run",start:st0});
  };
  var ra=$("yzRAgain"); if(ra) ra.onclick=function(){ ra.disabled=true; roomAgain(R.room); };
}
function roomTick(R){
  if(RC!==R) return;
  var m=R.rm, t=X.snow(), S=R.scene, start=+m.start;
  if(m.st!=="run"||!start){ return; }
  var end=start+R.dur*1000;
  if(!R.started&&t>=end) return;                          /* tugagan raund — yangisini kutamiz */
  if(t<start){
    S.ready=true; roomBox(R);
    var sec=Math.ceil((start-t)/1000);
    if(sec!==R.cdS&&sec<=3){ R.cdS=sec; var cd=$("yzCd"); if(cd) cd.innerHTML='<b>'+sec+'</b>'; SND.beep(false); if(sec===1) S.set=true; }
    return;
  }
  if(!R.started){
    R.started=true; R.t0=now()-(t-start); S.go=true; goShow(); SND.pistol(); SND.amb(.016);
    R.ty.start(R.t0); roomBox(R);
    var inp=$("yzIn"); if(inp){ inp.placeholder=L("Yozing!","Type!"); try{ inp.focus({preventScroll:true}); }catch(e){ inp.focus(); } }
    var w=$("yzText"); if(w) w.classList.remove("wait");
  }
  /* hamma marraga yetdimi (20 soniya yangilanmagan o'yinchi — chiqib ketgan deb hisoblanadi) */
  var me=ME(), tn=now(), allDone=Object.keys(R.pl).every(function(id){
    if(me&&id===me.id) return R.meDone||R.over;
    var x=R.pl[id]; return x.f>0||tn-(x.seen||0)>20000; });
  if(!R.resQ&&(t>=end||allDone)){
    R.resQ=true;
    if(!R.meDone){ timeUp(R); roomFlush(R); }
    R.over=true;
    later(function(){ roomResults(R); },allDone&&R.meDone?1500:2400);
  }
}
function roomStats(R){
  if(!R.started||R.over||R.meDone) { if(now()-(R.sideAt||0)>900){ R.sideAt=now(); liveSide(R); } return; }
  var t=now();
  if(t-R.posAt>700) roomFlush(R);
  if(t-(R.sideAt||0)>900){ R.sideAt=t; liveSide(R); }
}
function roomFlush(R){
  var me=ME(); if(!me||!R.ty) return;
  var st=R.ty.stats(now()); R.posAt=now();
  X.DB.upd("yzr/"+R.room+"/pl/"+me.id,{p:st.chars,w:st.words,s:Math.round(st.wpm),ac:st.acc,f:R.finMs?Math.round(R.finMs):0,u:Date.now()});
}
function roomMeDone(R){
  roomFlush(R); SND.amb(.03);
  later(function(){
    if(RC!==R||R.resDone) return;
    var ir=document.querySelector(".yz-inrow"), p=livePlace(R), st=R.ty.stats(now());
    if(ir) ir.innerHTML='<div class="yz-donebox">🏁 <b>'+L("Marraga yetdingiz!","You finished!")+'</b> '+L("Hozircha","Now")+' <b>'+p.pl+'-'+L("o'rin","place")+'</b> · ⚡ '+Math.round(st.wpm)+' '+L("so'z/daq","wpm")+' · 🎯 '+st.acc+'%<br>'+
      L("Boshqalar yugurmoqda — hamma yetib kelgach natija chiqadi.","Others are still running — results appear when everyone finishes.")+'</div>';
  },2400);
}
function roomResults(R){
  if(R.resDone||RC!==R) return; R.resDone=true;
  var me=ME(), time=R.mode==="time", T=R.T, endMs=R.dur*1000;
  var rows=Object.keys(R.pl).map(function(id){
    var x=R.pl[id], mine=me&&id===me.id, st=mine?R.ty.stats(now()):null;
    var c=mine?st.chars:(+x.p||0), f=mine?(R.finMs||0):(+x.f||0), done=!time&&f>0;
    var ms=time?endMs:(done?f:Math.min(endMs,now()-R.t0)), w=done?T.nw:wordsAt(T,c);
    return {sid:id,n:x.n||"?",me:mine,lk:lookOf(x.av!=null?x.av:hash(id)%LOOKS.length),num:10+hash(id)%89,ch:c,w:w,ms:ms,
      wpm:Math.round(w*60000/Math.max(1000,ms)),acc:mine?st.acc:(x.ac!=null?x.ac:null),fin:time?true:done};
  });
  rows.sort(time?function(a,b){ return b.ch-a.ch; }:function(a,b){ return (b.fin-a.fin)||(a.fin?a.ms-b.ms:b.ch-a.ch); });
  rows.forEach(function(r,i){ r.place=i+1; });
  var mine=rows.filter(function(r){ return r.me; })[0], my=null, isPB=false, prev=null;
  if(mine){
    var st=R.ty.stats(now()), ms=time?endMs:(R.finMs||st.el), cpm=Math.round(st.chars*60000/Math.max(1000,ms));
    my={wpm:mine.wpm,acc:st.acc,ms:ms,words:mine.w,chars:st.chars,cpm:cpm,place:mine.place,n:rows.length};
    prev=pbGet(R.lang,R.lvl,R.mk); if(my.words>0) isPB=pbSave(R.lang,R.lvl,R.mk,{w:my.wpm,a:my.acc,c:cpm,t:ms,at:Date.now()});
    histAdd({at:Date.now(),l:R.lang,v:R.lvl,m:R.mk,w:my.wpm,a:my.acc,c:cpm,pl:my.place,n:my.n});
  }
  if(me&&R.rm.host===me.id) X.DB.upd("yzr/"+R.room+"/meta",{st:"done"});
  vResults({R:R,rows:rows,my:my,isPB:isPB,prev:prev,kind:"room",banner:"👥 "+L("Xona","Room")+" <b>"+esc(R.room)+"</b> · "+L("do'stlar bilan poyga (reytingga ta'sir qilmaydi)","friends' race (no rating points)")});
}
/* "Shu xonada yana": xona egasi yangi matn bilan yangi raund ochadi, qolganlar unga qaytadi */
function roomAgain(code){
  var me=ME(); if(!me) return;
  X.DB.get("yzr/"+code,function(v){
    if(!v||!v.meta){ toast(L("Xona yopilgan","The room is closed")); vHome(); return; }
    var m=v.meta, pl=v.pl||{};
    if(!pl[me.id]){
      if(Object.keys(pl).length>=(+m.max||ROOM_MAX)){ toast(L("Xona to'lgan","The room is full")); vHome(); return; }
      pl[me.id]=roomMe(); X.DB.set("yzr/"+code+"/pl/"+me.id,pl[me.id]);
    }
    if(m.host===me.id&&m.st!=="lobby"){
      var tx=roomText({l:m.l,v:m.v,m:m.m}), o={};
      o["meta/text"]=tx.text; o["meta/dur"]=tx.dur||finDur(tx.text.length); o["meta/st"]="lobby"; o["meta/start"]=0; o["meta/rd"]=(+m.rd||1)+1;
      Object.keys(pl).forEach(function(id){ o["pl/"+id+"/p"]=0; o["pl/"+id+"/w"]=0; o["pl/"+id+"/s"]=0; o["pl/"+id+"/f"]=0; o["pl/"+id+"/ac"]=100; });
      X.DB.upd("yzr/"+code,o,function(){
        m.text=tx.text; m.dur=o["meta/dur"]; m.st="lobby"; m.start=0; m.rd=o["meta/rd"];
        Object.keys(pl).forEach(function(id){ pl[id].p=0; pl[id].f=0; });
        roomOpen(code,{meta:m,pl:pl});
      });
      return;
    }
    roomOpen(code,v);
  });
}
/* xonadan chiqish: lobbida yoki tugagan raundda — ro'yxatdan o'chiriladi; egasi chiqsa, xona boshqasiga o'tadi */
function roomLeave(R){
  var me=ME(); if(!me||!R||R.left) return; R.left=true;
  var racing=R.started&&!R.over&&!R.meDone;
  if(racing){ roomFlush(R); return; }
  var others=Object.keys(R.pl).filter(function(id){ return id!==me.id; });
  X.DB.del("yzr/"+R.room+"/pl/"+me.id);
  if(R.rm&&R.rm.host===me.id){
    if(others.length) X.DB.upd("yzr/"+R.room+"/meta",{host:others[0],hn:String(R.pl[others[0]].n||"").slice(0,60)});
    else X.DB.del("yzr/"+R.room);
  }
}

/* ================== 12. USLUBLAR ================== */
var STYLE=[
".yz{--yzA:#ff6a1a;--yzB:#ff2e7e;--yzC:#7c3aed;--yzOk:#16a34a;--yzBad:#e11d48}",
"html.yz-lock,html.yz-lock body{overflow:hidden;overscroll-behavior:none}",
/* bosh ekran */
".yz-home{display:grid;gap:16px}",
".yz-hero{position:relative;border-radius:24px;overflow:hidden;height:clamp(230px,34vw,330px);background:#0b1530;box-shadow:var(--shadow)}",
".yz-hero canvas{position:absolute;inset:0;width:100%;height:100%;display:block}",
".yz-hero-in{position:absolute;left:0;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:2px;padding:18px 24px;width:min(560px,100%);color:#fff;",
"  background:linear-gradient(90deg,rgba(7,14,34,.82),rgba(7,14,34,.55) 62%,rgba(7,14,34,0))}",
".yz-kick{font-size:12px;font-weight:900;letter-spacing:2px;opacity:.92}",
".yz-title{font-size:clamp(32px,6.4vw,58px);font-weight:900;line-height:1.02;margin:6px 0 8px;letter-spacing:-.5px;",
"  background:linear-gradient(90deg,#ffd166,#ff8a3d 38%,#ff3d7f 70%,#c084fc);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 12px rgba(0,0,0,.4))}",
".yz-hero p{margin:0;font-weight:650;line-height:1.45;max-width:440px;text-shadow:0 2px 8px rgba(0,0,0,.4)}",
".yz-tools,.yz-tools2{position:absolute;top:12px;right:12px;display:flex;gap:8px;z-index:2}",
".yz-tools2{position:static}",
".yz-ib{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(15,23,42,.5);color:#fff;font-size:16px;display:grid;place-items:center;",
"  cursor:pointer;text-decoration:none;font-family:inherit;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:transform .15s,background .15s;flex:none}",
".yz-ib:hover{transform:scale(1.08);background:rgba(15,23,42,.78)}",
".yz-res .yz-ib{background:var(--panel2);color:var(--ink);border-color:var(--line)}",
".yz-grid{display:grid;grid-template-columns:1.12fr 1fr;gap:16px}",
".yz-panel{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px 18px;box-shadow:var(--shadow);min-width:0}",
".yz-panel h3{margin:0 0 10px;font-size:18px}",
".yz-lbl{display:block;font-size:12px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);margin:12px 0 7px}",
".yz-chips{display:flex;flex-wrap:wrap;gap:7px}",
".yz-chip{border:1.5px solid var(--line);background:var(--panel2);color:var(--ink);border-radius:999px;padding:8px 13px;font-weight:800;font-size:13.5px;cursor:pointer;",
"  font-family:inherit;transition:transform .15s,border-color .15s,box-shadow .15s,background .15s}",
".yz-chip:hover{transform:translateY(-2px);border-color:var(--yzA);box-shadow:0 8px 16px -12px rgba(255,106,26,.9)}",
".yz-chip.on{background:linear-gradient(135deg,var(--yzA),var(--yzB));border-color:transparent;color:#fff;box-shadow:0 8px 18px -8px rgba(255,46,126,.75)}",
".yz-go{display:block;width:100%;margin-top:14px;border:0;border-radius:16px;padding:16px;font-size:19px;font-weight:900;color:#fff;cursor:pointer;font-family:inherit;letter-spacing:.3px;",
"  background:linear-gradient(135deg,#ff7a18,#ff2e7e 55%,#7c3aed);background-size:180% 180%;background-position:0 0;",
"  box-shadow:0 14px 28px -14px rgba(255,46,126,.85),inset 0 -4px 0 rgba(0,0,0,.18);transition:transform .15s,box-shadow .15s,background-position .5s}",
".yz-go:hover{transform:translateY(-2px) scale(1.01);background-position:100% 0;box-shadow:0 18px 34px -14px rgba(255,46,126,.95),inset 0 -4px 0 rgba(0,0,0,.18)}",
".yz-go:active{transform:translateY(1px) scale(.995)}",
".yz-btn2{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1.5px solid var(--line);background:var(--panel);color:var(--ink);border-radius:14px;",
"  padding:13px 16px;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;text-decoration:none;transition:transform .15s,border-color .15s}",
".yz-btn2:hover{transform:translateY(-2px);border-color:var(--yzC)}",
".yz-pbl{margin:12px 0 0;font-size:13.5px;color:var(--ink2);font-weight:600}",
".yz-sm{font-size:12.5px;color:var(--muted);font-weight:600}",
".yz-center{text-align:center}",
".yz-me{display:flex;align-items:center;gap:14px;margin-bottom:12px}",
".yz-me canvas{width:112px;height:124px;border-radius:18px;flex:none;background:linear-gradient(180deg,#8fd0ff,#dff2ff 62%,#c4553a 62%,#a63f2b);box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}",
".yz-mei{display:grid;gap:3px;min-width:0}.yz-mei b{font-size:18px;overflow:hidden;text-overflow:ellipsis}.yz-lnm{color:var(--muted);font-weight:700;font-size:13px}",
".yz-mei .yz-chip{justify-self:start;margin-top:4px;padding:6px 11px;font-size:12.5px}",
".yz-looks{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:7px;max-height:262px;overflow:auto;padding:4px 4px 6px;overscroll-behavior:contain}",
".yz-lk{position:relative;border:2px solid var(--line);background:linear-gradient(180deg,var(--panel2),var(--panel));border-radius:14px;padding:2px;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s}",
".yz-lk canvas{width:100%;height:64px;display:block}",
".yz-lk:hover{transform:translateY(-3px);border-color:var(--yzA)}",
".yz-lk.on{border-color:var(--yzB);box-shadow:0 0 0 3px rgba(255,46,126,.22)}",
".yz-lk.on::after{content:'✓';position:absolute;top:1px;right:5px;font-size:12px;font-weight:900;color:var(--yzB)}",
/* jonli poyga kartasi */
".yz-lc{display:flex;align-items:center;gap:16px;border-radius:22px;padding:18px 20px;color:#fff;box-shadow:var(--shadow);position:relative;overflow:hidden;",
"  background:radial-gradient(520px 220px at 0 0,#ff8a3d,transparent 60%),linear-gradient(120deg,#7c2d12,#c2410c 45%,#7c3aed)}",
".yz-lc.hot{background:radial-gradient(520px 220px at 0 0,#ff4d6d,transparent 60%),linear-gradient(120deg,#9d0208,#e11d48 45%,#f97316);animation:yzHot 1.6s ease-in-out infinite}",
".yz-lc.on{background:radial-gradient(520px 220px at 0 0,#26d07c,transparent 60%),linear-gradient(120deg,#065f46,#0f9d58 45%,#0891b2)}",
".yz-lc.done{background:linear-gradient(120deg,#1e293b,#334155 55%,#4338ca)}",
".yz-lc.none{display:block;background:var(--panel);color:var(--muted);border:1px dashed var(--line);box-shadow:none;font-weight:700;padding:14px 18px}",
"@keyframes yzHot{50%{box-shadow:0 0 0 8px rgba(255,77,109,.22),var(--shadow)}}",
".yz-lci{flex:1;min-width:0;display:grid;gap:4px}",
".yz-lck{font-size:11.5px;font-weight:900;letter-spacing:1.6px;opacity:.9}",
".yz-lci b{font-size:clamp(18px,3vw,24px);line-height:1.2}",
".yz-lct{font-weight:700;opacity:.95;font-variant-numeric:tabular-nums}",
".yz-lcc{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.yz-lcc span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:3px 9px;font-size:12px;font-weight:800}",
".yz-lcn{margin-top:4px;background:rgba(255,255,255,.14);border-radius:12px;padding:7px 10px;font-weight:700;font-size:13.5px}",
".yz-lce{margin:2px 0 0;font-weight:700;font-size:13px}.yz-lce:empty{display:none}.yz-lce a{color:#fff}",
".yz-lcb{flex:none;border:0;background:#fff;color:#c2410c;font-weight:900;font-size:16px;border-radius:14px;padding:12px 18px;cursor:pointer;font-family:inherit;",
"  box-shadow:0 6px 0 rgba(0,0,0,.2);transition:transform .15s,box-shadow .15s}",
".yz-lcb:hover{transform:translateY(-2px);box-shadow:0 8px 0 rgba(0,0,0,.2)}.yz-lcb:disabled{opacity:.7;cursor:wait}",
".yz-lc.on .yz-lcb{color:#0f9d58}.yz-lc.done .yz-lcb{color:#4338ca}",
/* jadvallar */
".yz-tw{overflow:auto}",
".yz-tb{width:100%;border-collapse:collapse;font-size:14px}",
".yz-tb th{text-align:left;font-size:12.5px;font-weight:800;padding:8px 10px;white-space:nowrap}",
".yz-tb td{padding:8px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}",
".yz-tb td:not(:nth-child(2)){white-space:nowrap}",
".yz-tb tr.me td{background:rgba(255,106,26,.1);font-weight:700}",
".yz-tb tr.sus td{opacity:.55}.yz-tb tr.sus td:nth-child(2)::after{content:' ⚠️'}",
".yz-you{font-size:11px;font-weight:900;background:var(--yzA);color:#fff;border-radius:999px;padding:1px 7px;vertical-align:1px}",
".yz-pts{color:#d97706}",
".yz-top{list-style:none;margin:0;padding:0;display:grid;gap:6px}",
".yz-top li,.yz-side li{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:12px;background:var(--panel2);font-size:14px;min-width:0}",
".yz-top li b,.yz-side li b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".yz-top li em,.yz-side li em{font-style:normal;font-weight:900;white-space:nowrap}.yz-top li em small{font-weight:700;color:var(--muted)}",
".yz-top li.me{outline:2px solid var(--yzA)}",
".yz-rk{width:24px;text-align:center;font-weight:900;flex:none}",
".yz-dot{width:12px;height:12px;border-radius:50%;flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.7)}",
".yz-rjoin{display:flex;gap:8px;flex-wrap:wrap;align-items:stretch;margin:10px 0}.yz-rjoin .yz-go{width:auto;flex:1 1 200px;margin:0;padding:13px 16px;font-size:16px}",
".yz-rjoin input{flex:0 1 120px;min-width:90px;text-transform:uppercase;letter-spacing:5px;font-size:20px;font-weight:800;text-align:center;border-radius:14px;border:1.5px solid var(--line);background:var(--panel2);color:var(--ink);padding:8px}",
".yz-rlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}",
".yz-ritem{display:flex;align-items:center;gap:10px;background:var(--panel2);border:1px solid var(--line);border-radius:14px;padding:8px 10px}",
".yz-ritem>b{font-size:18px;letter-spacing:2px;font-family:ui-monospace,Menlo,Consolas,monospace}.yz-ritem span{flex:1;min-width:0;font-size:13px;font-weight:700}.yz-ritem small{color:var(--muted)}.yz-ritem .yz-btn2{padding:8px 12px;font-size:13px}",
".yz-room{display:flex;align-items:center;gap:12px;flex-wrap:wrap;flex:none;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:10px 14px}",
".yz-rcode{display:grid;text-align:center;line-height:1.1}.yz-rcode span,.yz-rcode small{font-size:11px;opacity:.8;font-weight:700}.yz-rcode b{font-size:34px;letter-spacing:6px;font-family:ui-monospace,Menlo,Consolas,monospace;color:#fde047}",
".yz-rmid{flex:1;min-width:180px;display:grid;gap:6px}.yz-rmid small{opacity:.8;font-weight:700}.yz-rps{display:flex;flex-wrap:wrap;gap:6px}",
".yz-rp{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);border-radius:999px;padding:4px 10px;font-weight:800;font-size:13px}.yz-rp.me{outline:1.5px solid #fbbf24}.yz-rp i{width:10px;height:10px;border-radius:50%}",
".yz-ract{flex:0 1 260px;min-width:200px}.yz-ract .yz-go{margin:0;padding:12px;font-size:16px}.yz-ract .yz-go:disabled{opacity:.5;cursor:not-allowed;transform:none}.yz-rwait{margin:4px 0 0;font-weight:700;font-size:13px;opacity:.9}",
".yz-shut{text-align:center;display:grid;align-content:center;gap:6px}.yz-shut p{margin:0;font-weight:600;line-height:1.5}.yz-shutic{font-size:58px}",
".yz-rules summary{cursor:pointer;font-weight:900;font-size:16px}",
".yz-rules ul{margin:10px 0 0;padding-left:4px;list-style:none;display:grid;gap:7px;line-height:1.5}",
/* poyga ekrani */
".yz-race{position:fixed;left:0;right:0;top:0;height:100vh;z-index:90;display:flex;flex-direction:column;color:#fff;overflow:hidden;",
"  background:linear-gradient(180deg,#0a1430,#111e42)}",
".yz-rbar{display:flex;align-items:center;gap:8px;padding:8px 12px;flex:none;min-width:0}",
".yz-rlogo{font-size:15px;white-space:nowrap}",
".yz-pill{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:5px 11px;font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
".yz-pill.live{background:rgba(225,29,72,.35);border-color:rgba(255,120,150,.5)}",
".yz-clock{font-variant-numeric:tabular-nums;flex:none}.yz-clock.low{background:#e11d48;animation:yzBlink2 .8s steps(1) infinite}",
"@keyframes yzBlink2{50%{background:#9f1239}}",
".yz-sp{flex:1}",
".yz-stage{position:relative;flex:none;height:var(--yzCvH,40vh);background:#0b1530}",
".yz-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}",
".yz-cd{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;font-weight:900;color:#fff;font-size:clamp(64px,15vh,150px);text-shadow:0 6px 26px rgba(0,0,0,.5)}",
".yz-cd b{animation:yzPop .95s ease-out both}",
".yz-cd b.go{color:#4ade80;animation:yzGo 1s ease-out both}",
".yz-cd b.tu{font-size:.42em;color:#fde047;background:rgba(15,23,42,.6);padding:10px 22px;border-radius:20px;animation:yzGo 1.4s ease-out both}",
"@keyframes yzPop{0%{transform:scale(2.2);opacity:0}22%{transform:scale(1);opacity:1}78%{opacity:1}100%{transform:scale(.85);opacity:0}}",
"@keyframes yzGo{0%{transform:scale(.4);opacity:0}20%{transform:scale(1.15);opacity:1}35%{transform:scale(1)}100%{transform:scale(1)}}",
".yz-pop{position:absolute;left:50%;top:22%;transform:translate(-50%,10px) scale(.9);opacity:0;pointer-events:none;background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.25);",
"  padding:7px 16px;border-radius:999px;font-weight:900;font-size:clamp(15px,2.4vw,20px);transition:opacity .2s,transform .2s;white-space:nowrap}",
".yz-pop.on{opacity:1;transform:translate(-50%,0) scale(1)}.yz-pop.up{background:rgba(22,163,74,.85)}.yz-pop.warn{background:rgba(217,119,6,.9)}.yz-pop.big{font-size:clamp(20px,3.4vw,30px);background:rgba(234,179,8,.92);color:#111827}",
".yz-note{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:none;flex-direction:column;align-items:center;gap:2px;pointer-events:none;",
"  background:rgba(10,20,48,.72);border:1px solid rgba(255,255,255,.22);border-radius:22px;padding:12px 26px;text-align:center;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}",
".yz-note.on{display:flex}.yz-note span{font-weight:800;opacity:.9}.yz-note b{font-size:clamp(34px,7vh,60px);font-variant-numeric:tabular-nums;line-height:1.1}.yz-note small{font-weight:700;opacity:.85}",
".yz-bar{height:6px;background:rgba(255,255,255,.12);flex:none}",
".yz-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#facc15,#f97316);transition:width .2s linear}",
".yz-play{flex:1;min-height:0;display:flex;gap:12px;padding:10px 14px 14px;width:100%;max-width:1200px;margin:0 auto}",
".yz-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;min-height:0}",
".yz-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;flex:none}",
".yz-st{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:6px 6px;text-align:center;line-height:1.15;min-width:0}",
".yz-st b{display:block;font-size:clamp(17px,2.5vw,25px);font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}",
".yz-st span{font-size:11px;opacity:.78;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}",
".yz-text{flex:1 1 auto;min-height:2.4em;max-height:8.4em;overflow:hidden;position:relative;background:var(--panel);color:var(--muted);border-radius:16px;padding:10px 16px;",
"  font-size:clamp(17px,2.15vw,23px);line-height:1.6;white-space:pre-wrap;overflow-wrap:break-word;font-weight:600;box-shadow:inset 0 0 0 1px var(--line);cursor:text;transition:filter .4s}",
".yz-text.wait{filter:blur(5px);user-select:none}",
".yz-text .w.ok,.yz-text .c.ok{color:var(--yzOk)}",
"[data-theme='dark'] .yz-text .w.ok,[data-theme='dark'] .yz-text .c.ok{color:#4ade80}",
".yz-text .w.cur{color:var(--ink)}",
".yz-text .w.more{color:var(--muted);opacity:.6}",
".yz-text .c{position:relative}",
".yz-text .c.bad{color:#fff;background:var(--yzBad);border-radius:4px}",
".yz-text .c.x{text-decoration:line-through}",
".yz-text .c.cur::after{content:'';position:absolute;left:0;right:0;bottom:-2px;height:3px;min-width:.5em;border-radius:2px;background:#f97316;animation:yzBlink 1s steps(1) infinite}",
"@keyframes yzBlink{50%{opacity:0}}",
".yz-inrow{position:relative;flex:none}",
".yz-in{width:100%;font-size:20px;padding:12px 14px;border-radius:14px;border:2px solid rgba(255,255,255,.3);background:#fff;color:#0d1b2a;font-weight:700;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s,background .15s}",
".yz-in:focus{border-color:#f97316;box-shadow:0 0 0 4px rgba(249,115,22,.28)}",
".yz-in.err{border-color:#e11d48;background:#ffe4e6;animation:yzShake .25s}",
".yz-in:disabled{opacity:.6}",
"@keyframes yzShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}",
".yz-hint{position:absolute;right:10px;top:-34px;background:#f59e0b;color:#111827;font-weight:800;font-size:13px;border-radius:10px;padding:5px 10px;opacity:0;transition:opacity .2s;pointer-events:none}",
".yz-hint.on{opacity:1}",
".yz-watch,.yz-donebox{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:12px 14px;font-weight:700;line-height:1.55}",
".yz-donebox{background:rgba(22,163,74,.22);border-color:rgba(74,222,128,.45)}",
".yz-side{width:250px;flex:none;overflow:auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:10px}",
".yz-side:empty{display:none}",
".yz-side h4{margin:2px 4px 8px;font-size:14px}",
".yz-side ol{list-style:none;margin:0;padding:0;display:grid;gap:5px}",
".yz-side li{background:rgba(255,255,255,.08);color:#fff;font-size:13px;padding:6px 8px}",
".yz-side li.me{background:rgba(251,191,36,.25);outline:1px solid rgba(251,191,36,.7)}",
/* natija ekrani */
".yz-res{display:grid;gap:16px}",
".yz-rhead{display:flex;align-items:flex-start;gap:12px;justify-content:space-between}",
".yz-rhead h1{font-size:clamp(26px,5vw,42px);margin:6px 0 4px;line-height:1.1}",
".yz-rhead p{margin:0;color:var(--muted);font-weight:700}",
".yz-rhead .yz-kick{color:var(--yzA)}",
".yz-banner{background:var(--panel);border:1px solid var(--line);border-left:6px solid var(--yzA);border-radius:16px;padding:12px 16px;font-weight:700}",
".yz-pbbadge{justify-self:center;background:linear-gradient(135deg,#fbbf24,#f97316);color:#111827;font-weight:900;font-size:clamp(16px,2.6vw,22px);border-radius:999px;padding:10px 22px;",
"  box-shadow:0 10px 26px -10px rgba(249,115,22,.9);animation:yzPb 1.4s ease-in-out infinite}",
"@keyframes yzPb{50%{transform:scale(1.05)}}",
".yz-podwrap{position:relative;border-radius:22px;overflow:hidden;box-shadow:var(--shadow);background:#0b1530}",
".yz-podwrap canvas{display:block;width:100%;height:clamp(230px,32vw,330px)}",
".yz-pnames{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;background:var(--panel)}",
".yz-pn{text-align:center;display:grid;gap:2px;padding:6px;border-radius:12px;min-width:0}",
".yz-pn b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.yz-pn span{color:var(--muted);font-weight:700;font-size:13px}",
".yz-pn em{font-style:normal;font-weight:900;color:#d97706}",
".yz-pn.me{background:rgba(255,106,26,.12);outline:1.5px solid rgba(255,106,26,.5)}",
".yz-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}",
".yz-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:14px;text-align:center;box-shadow:var(--shadow);position:relative;display:grid;gap:4px}",
".yz-card b{font-size:clamp(24px,3.6vw,34px);font-weight:900;font-variant-numeric:tabular-nums;line-height:1.05}",
".yz-card span{color:var(--muted);font-weight:700;font-size:13px}",
".yz-card.big{background:linear-gradient(135deg,#ff7a18,#ff2e7e 60%,#7c3aed);border-color:transparent;color:#fff}.yz-card.big span{color:rgba(255,255,255,.9)}",
".yz-card.pb{outline:2px solid #fbbf24}",
".yz-card em{position:absolute;top:-9px;right:10px;font-style:normal;font-size:11px;font-weight:900;background:#fbbf24;color:#111827;border-radius:999px;padding:2px 8px}",
".yz-chart{width:100%;height:170px;display:block}",
".yz-keys{display:flex;flex-wrap:wrap;gap:8px}",
".yz-key{display:inline-flex;align-items:center;gap:6px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:6px 10px}",
".yz-key b{font-size:18px;font-family:ui-monospace,Menlo,Consolas,monospace}.yz-key i{font-style:normal;color:#e11d48;font-weight:900}",
".yz-acts{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;align-items:stretch}",
".yz-acts .yz-go{margin:0}",
"@media(max-width:860px){.yz-grid{grid-template-columns:1fr}.yz-side{display:none}}",
"@media(max-width:640px){.yz-hs,.yz-rlogo b{display:none}.yz-rbar{padding:6px 8px;gap:6px}.yz-play{padding:6px 8px 8px;gap:6px}.yz-main{gap:6px}",
"  .yz-stats{gap:4px}.yz-st{padding:4px 2px;border-radius:10px}.yz-st span{font-size:10px}.yz-text{padding:8px 11px;border-radius:12px;max-height:6.6em}",
"  .yz-in{font-size:18px;padding:10px 12px}.yz-lc{flex-wrap:wrap;padding:14px}.yz-lcb{width:100%}.yz-acts{grid-template-columns:1fr 1fr}.yz-acts .yz-go{grid-column:1/-1}",
"  .yz-hero-in{padding:14px 16px;background:linear-gradient(90deg,rgba(7,14,34,.85),rgba(7,14,34,.6) 75%,rgba(7,14,34,.15))}.yz-me canvas{width:92px;height:104px}}",
"@media print{.yz-race{display:none}}"
].join("\n");
function css(){ if(document.getElementById("yzCss")) return; var st=document.createElement("style"); st.id="yzCss"; st.textContent=STYLE; document.head.appendChild(st); }

/* ================== 13. TASHQI INTERFEYS ================== */
function mount(root,ctx){
  X=ctx; ROOT=root; TX=window.YZ_TEXTS||TX; css();
  if(!langs().length){ root.innerHTML='<div class="card">⚠️ '+L("Matnlar yuklanmadi.","Texts did not load.")+'</div>'; return; }
  root.innerHTML='<div class="card"><p class="note center">'+L("Yuklanmoqda…","Loading…")+'</p></div>';
  var a=++ALIVE;
  lockCheck(function(o){ if(a!==ALIVE||ROOT!==root) return; OPEN=o; vHome(); });
}
function unmount(){
  if(!ROOT) return;
  if(RC&&RC.kind==="live") liveLeave(RC);
  if(RC&&RC.kind==="room") roomLeave(RC);
  leave(); ALIVE++; VIEW=""; RC=null; HERO=null; SND.stop();
}
return {mount:mount,unmount:unmount,view:function(){ return VIEW; },
  _t:{nstr:nstr,mkText:mkText,LOOKS:LOOKS,pickText:pickText,fps:function(){ return LOOP.fps; },rc:function(){ return RC; },
      wordsAt:wordsAt,settings:settings,startPractice:function(){ startPractice(); }}};
})();
