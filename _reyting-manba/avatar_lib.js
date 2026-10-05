/* ================== AVX — avatar tizimi (taqdimotlar va Arena uchun umumiy) ==================
   - Qatlamli SVG, kod bilan chiziladi; seed (talaba ID) -> doim bir xil avatar.
   - Bazada ixcham satr: "2" + 17 ta belgi (base36), masalan "2a31c0..."
   - AVX.html(cfg|seed, {size, shape, status, badge, animated, alt, name}) — yagona komponent.
   - Ro'yxatlarda <img> (data URI, kesh), katta o'lchamda jonli inline SVG.
   Bu fayl _reyting-manba/inject.py orqali taqdimotlarga va arena.html ga qo'shiladi. */
(function(root){
"use strict";
var VER="2";
/* ---------- qatlamlar (tartib = kodlash tartibi) ---------- */
var L=[
 {k:"fs",n:8, uz:"Yuz shakli",en:"Face shape",i:"🙂"},
 {k:"sk",n:10,uz:"Teri",en:"Skin",i:"✋",col:1},
 {k:"h", n:15,uz:"Soch",en:"Hair",i:"💇"},
 {k:"hc",n:12,uz:"Soch rangi",en:"Hair colour",i:"🎨",col:1},
 {k:"ey",n:10,uz:"Ko'zlar",en:"Eyes",i:"👀"},
 {k:"ec",n:8, uz:"Ko'z rangi",en:"Eye colour",i:"🔵",col:1},
 {k:"br",n:8, uz:"Qoshlar",en:"Brows",i:"〰️"},
 {k:"no",n:8, uz:"Burun",en:"Nose",i:"👃"},
 {k:"mo",n:10,uz:"Og'iz",en:"Mouth",i:"👄"},
 {k:"fh",n:8, uz:"Soqol-mo'ylov",en:"Facial hair",i:"🧔"},
 {k:"gl",n:8, uz:"Ko'zoynak",en:"Glasses",i:"👓"},
 {k:"hw",n:11,uz:"Bosh kiyim",en:"Headwear",i:"🧢"},
 {k:"er",n:8, uz:"Taqinchoq",en:"Earrings",i:"💎"},
 {k:"cl",n:10,uz:"Kiyim",en:"Clothes",i:"👕"},
 {k:"cc",n:12,uz:"Kiyim rangi",en:"Clothes colour",i:"🌈",col:1},
 {k:"bg",n:12,uz:"Fon rangi",en:"Background",i:"🖼",col:1},
 {k:"bp",n:8, uz:"Fon naqshi",en:"Pattern",i:"✨"}];
var NAMES={
 fs:["Oval","Dumaloq","Cho'ziq","To'rtburchak","Yurak","Olmos","Keng jag'","Yumshoq"],
 h:["Yo'q","Juda qisqa","Qisqa","Yon farq","Chakka","Kokil","Jingalak","Afro","Uzun","To'lqinli","Kare","Dumcha","Tugun","Ikki o'rim","Yelkagacha"],
 ey:["Oddiy","Bodom","Kulgan","Katta","Uyquli","Ko'z qisgan","Jilmaygan","Kipriklari","Jiddiy","Porloq"],
 br:["Tabiiy","Qayrilgan","Qalin","Ingichka","Ko'tarilgan","Jiddiy","Xavotirli","Quyuq"],
 no:["Tugma","Kichik","Dumaloq","Uzun","Keng","O'tkir","Puchuq","Oddiy"],
 mo:["Tabassum","Kulgi","Xotirjam","Qahqaha","Qiyshiq","Hayron","Til","Chuqurcha","Tishli","Jiddiy"],
 fh:["Yo'q","Qirtishlangan","Mo'ylov","Echkisoqol","Jag' bo'ylab","Qisqa soqol","Qalin soqol","Mo'ylov+"],
 gl:["Yo'q","Dumaloq","Qalin","Aviator","Mushuk ko'z","Yarim","Qora","Rangli"],
 hw:["Yo'q","Do'ppi","Ro'mol","Kepka","Teskari kepka","Shapka","Beret","Bandana","Quloqchin","Bitiruvchi","Gul toj"],
 er:["Yo'q","Oltin","Kumush","Oltin halqa","Kumush halqa","Marvarid","Yoqut","Zanjirli"],
 cl:["Futbolka","V-yoqa","Xudi","Ko'ylak","Galstuk","Kostyum","Bo'g'iz","Sviter","Atlas to'n","Polo"],
 bp:["Yo'q","Nuqtalar","Chiziqlar","Halqalar","To'lqin","Yulduzlar","Katak","Atlas"]};
/* ---------- uyg'un palitralar ---------- */
var SKIN=["#fde8d6","#f8d6bb","#f0c19c","#e6ad85","#d69668","#c27f54","#a66741","#895131","#6c3d24","#4e2b1a"];
var HAIR=["#17151b","#2e2019","#4a2f1f","#6b4026","#8c3f22","#b4582c","#a77b45","#d5ac6a","#ecd59c","#9fa4ad","#e4e2dc","#5a2741"];
var EYE=["#5a3825","#2a1d17","#3f7d4f","#3c72b8","#8a6b2e","#6b7280","#2f6f73","#9a5b2a"];
var CLOTH=["#2563eb","#7c3aed","#0f9d58","#e11d48","#f59e0b","#0891b2","#1f2937","#f8fafc","#db2777","#65a30d","#ea580c","#334155"];
var BGP=[["#c4b5fd","#93c5fd"],["#6ee7b7","#38bdf8"],["#fde68a","#fdba74"],["#fecdd3","#fda4af"],["#a5f3fc","#a5b4fc"],["#d9f99d","#86efac"],
         ["#f5d0fe","#c4b5fd"],["#e2e8f0","#94a3b8"],["#fef3c7","#fcd34d"],["#312e81","#6d28d9"],["#0f766e","#0e7490"],["#7c2d12","#c2410c"]];
/* ---------- tasodifiy son (seed) ---------- */
function h32(s){ var h=2166136261>>>0; s=String(s); for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h; }
function rng(seed){ var a=h32(seed)||1; return function(){ a=(a+0x6D2B79F5)>>>0; var t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function pick(r,arr){ return arr[Math.floor(r()*arr.length)]; }
function lum(hex){ var n=parseInt(hex.slice(1),16); function c(v){ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }
  return .2126*c(n>>16)+.7152*c((n>>8)&255)+.0722*c(n&255); }
function cdist(a,b){ var x=parseInt(a.slice(1),16), y=parseInt(b.slice(1),16);
  var dr=(x>>16)-(y>>16), dg=((x>>8)&255)-((y>>8)&255), db=(x&255)-(y&255); return Math.sqrt(dr*dr*2+dg*dg*4+db*db*3)/3; }
function shade(hex,p){ var n=parseInt(hex.slice(1),16), r=n>>16, g=(n>>8)&255, b=n&255;
  function f(c){ return Math.max(0,Math.min(255,Math.round(p<0?c*(1+p):c+(255-c)*p))); }
  return "#"+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1); }
/* ---------- moslik qoidalari ---------- */
var TALL={7:1,12:1,13:0,5:1};                  /* bosh kiyim ostiga sig'maydigan sochlar */
var UNDER={7:6,12:11,5:4};                     /* ularning o'rniga */
var TOPHAT={1:1,3:1,4:1,5:1,6:1,7:1,9:1};      /* boshning ustini yopadigan bosh kiyimlar */
function bgMid(i){ return BGP[i][0]; }
function fix(c){
  var o={}, i;
  for(i=0;i<L.length;i++){ var v=Math.floor(+c[L[i].k]); o[L[i].k]=(v>=0&&v<L[i].n)?v:0; }
  if(o.hw===2){ o.h=0; o.er=0; o.fh=0; }                              /* ro'mol: soch, sirg'a, soqol yo'q */
  if(TOPHAT[o.hw]&&TALL[o.h]) o.h=UNDER[o.h];
  if(o.hw===8&&o.er>0) o.er=0;                                       /* quloqchin quloqni yopadi */
  /* ranglar: fon teri/soch bilan qo'shilib ketmasin, kiyim fonga o'xshamasin */
  var sk=SKIN[o.sk], hc=HAIR[o.hc];
  for(i=0;i<BGP.length;i++){
    var b=bgMid(o.bg);
    var okSkin=Math.abs(lum(b)-lum(sk))>.12||cdist(b,sk)>70, okHair=o.h===0||o.hw===2||cdist(b,hc)>60;
    if(okSkin&&okHair) break; o.bg=(o.bg+1)%BGP.length;
  }
  for(i=0;i<CLOTH.length;i++){
    var cc=CLOTH[o.cc], bb=BGP[o.bg];
    if(cdist(cc,bb[0])>60&&cdist(cc,bb[1])>60&&cdist(cc,sk)>55) break; o.cc=(o.cc+1)%CLOTH.length;
  }
  return o;
}
function ok(c){ var f=fix(c); for(var k in f) if(f[k]!==c[k]) return false; return true; }
/* ---------- seed bo'yicha yaratish ---------- */
/* ism-familiyadan jins taxmini (o'zbek familiyalari: -ov/-ev — yigit, -ova/-eva — qiz) */
function hintOf(name){
  var p=String(name||"").toLowerCase().replace(/[ʻʼ'`‘’]/g,"").trim().split(/\s+/), sur=p.length>1?p[p.length-1]:"", first=p[0]||"";
  if(/(ova|eva|yeva|ovna|evna|qizi|kizi|xonim)$/.test(sur)||/(ova|eva|yeva)$/.test(first)) return "f";
  if(/(ov|ev|yev|ovich|evich|ogli|ugli|zoda)$/.test(sur)||/(ov|ev|yev)$/.test(first)) return "m";
  return "";
}
function gen(seed,hint){
  var r=rng("avx|"+seed), pr=r(), fem=pr<.46, masc=pr>=.46&&pr<.92;
  if(hint==="f"){ fem=true; masc=false; } else if(hint==="m"){ fem=false; masc=true; }
  var c={};
  c.fs=Math.floor(r()*8); c.sk=Math.floor(r()*10);
  c.h=fem?pick(r,[8,9,10,11,12,13,14,6,7,3]):masc?pick(r,[1,2,3,4,5,6,7,1,2,4,0]):pick(r,[2,6,7,10,14,3]);
  c.hc=r()<.82?pick(r,[0,1,2,3,4,5,6,7,8]):pick(r,[9,10,11]);
  c.ey=fem?pick(r,[0,1,3,6,7,7,9]):pick(r,[0,1,2,3,4,5,6,8,9]);
  c.ec=r()<.6?pick(r,[0,1]):Math.floor(r()*6);
  c.br=Math.floor(r()*8); c.no=Math.floor(r()*8); c.mo=Math.floor(r()*10);
  c.fh=masc&&r()<.45?1+Math.floor(r()*7):0;
  c.gl=r()<.3?1+Math.floor(r()*7):0;
  var hw=0, q=r();
  if(fem&&q<.18) hw=2; else if(masc&&q<.12) hw=1; else if(q<.3) hw=pick(r,[3,4,5,6,7,8,9,10]);
  c.hw=hw;
  c.er=fem&&r()<.7?1+Math.floor(r()*7):(r()<.08?1+Math.floor(r()*2):0);
  c.cl=Math.floor(r()*10); c.cc=Math.floor(r()*12); c.bg=Math.floor(r()*12);
  c.bp=r()<.55?1+Math.floor(r()*7):0;
  return fix(c);
}
/* ---------- kodlash ---------- */
function enc(c){ c=fix(c); var s=VER; for(var i=0;i<L.length;i++) s+=c[L[i].k].toString(36); return s; }
function dec(s){
  if(!s) return null;
  if(typeof s==="object") return fromV1(s);
  s=String(s); if(s.charAt(0)!==VER||s.length!==L.length+1) return null;
  var c={}; for(var i=0;i<L.length;i++){ var v=parseInt(s.charAt(i+1),36); if(isNaN(v)||v>=L[i].n) return null; c[L[i].k]=v; }
  return fix(c);
}
/* eski (1-versiya) obyektdan taxminiy o'tkazish */
function fromV1(a){
  try{
    var c=gen(JSON.stringify(a));
    if(a.sk!=null) c.sk=Math.min(9,Math.round(+a.sk*9/7));
    if(a.hc!=null) c.hc=[0,1,2,4,6,7,8,9,11,5][+a.hc]||0;
    if(a.h!=null) c.h=[0,1,2,6,5,8,9,12,11,1,7][+a.h]||0;
    if(a.hw!=null) c.hw=[0,1,2,3,5,8][+a.hw]||0;
    if(a.c!=null) c.cl=[0,2,4,5,7,8][+a.c]||0;
    if(a.cc!=null) c.cc=Math.min(11,+a.cc);
    if(a.g!=null) c.gl=[0,1,2,6,4][+a.g]||0;
    if(a.fh!=null) c.fh=[0,1,2,5,6][+a.fh]||0;
    return fix(c);
  }catch(e){ return null; }
}
/* ---------- chizish yordamchilari ---------- */
function crPath(p,closed){            /* Catmull-Rom -> silliq Bezier */
  var n=p.length, d="M"+p[0][0].toFixed(1)+" "+p[0][1].toFixed(1);
  var m=closed?n:n-1;
  for(var i=0;i<m;i++){
    var p0=p[(i-1+n)%n], p1=p[i], p2=p[(i+1)%n], p3=p[(i+2)%n];
    if(!closed){ if(i===0) p0=p1; if(i+2>=n) p3=p2; }
    d+="C"+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+" "+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+" "+
       (p2[0]-(p3[0]-p1[0])/6).toFixed(1)+" "+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+" "+p2[0].toFixed(1)+" "+p2[1].toFixed(1);
  }
  return d+(closed?"Z":"");
}
function mir(pts){ var out=pts.slice(); for(var i=pts.length-1;i>=0;i--) out.push([200-pts[i][0],pts[i][1]]); return out; }
var FACE=[ /* t, wT, wC, wJ, b, ch */
 [44,33,39,31,134,12],[46,37,42,36,132,20],[40,31,36,29,138,11],[44,36,39,38,134,17],
 [44,39,40,27,134,7],[44,30,42,28,135,9],[46,31,38,39,133,19],[45,35,39,35,134,22]];
function facePts(fs){
  var f=FACE[fs], t=f[0], wT=f[1], wC=f[2], wJ=f[3], b=f[4], ch=f[5];
  return [[100,t],[100+wT*.72,t+4],[100+wT,t+22],[100+wC,93],[100+wJ,117],[100+ch,b-4],[100,b],[100-ch,b-4],[100-wJ,117],[100-wC,93],[100-wT,t+22],[100-wT*.72,t+4]];
}
var SW=2.2;  /* yagona chiziq qalinligi */
function P(d,fill,extra){ return '<path d="'+d+'" fill="'+fill+'"'+(extra||"")+'/>'; }
function OL(col){ return ' stroke="'+col+'" stroke-width="'+SW+'" stroke-linejoin="round" stroke-linecap="round"'; }
/* ---------- soch shakllari ---------- */
function hairParts(h,lite){
  /* {back:[], front:[], shine:string, tie:string} — nuqtalar ro'yxati (silliq yopiq shakl) */
  var F=null,B=null,X="";
  switch(h){
    case 1: F=[[60,92],[58,66],[72,46],[100,38],[128,46],[142,66],[140,92],[134,74],[118,64],[100,62],[82,64],[66,74]]; break;
    case 2: F=[[59,96],[56,64],[70,42],[100,34],[132,42],[146,64],[141,96],[136,76],[124,64],[104,66],[86,60],[70,70],[64,82]]; break;
    case 3: F=[[59,100],[54,66],[66,42],[96,32],[130,38],[148,62],[142,98],[138,80],[128,66],[110,58],[88,66],[74,64],[64,80]]; break;
    case 4: F=[[60,96],[58,64],[74,44],[100,38],[126,44],[142,64],[140,96],[134,78],[124,70],[110,72],[102,64],[88,70],[76,70],[66,80]]; break;
    case 5: F=[[60,94],[58,64],[70,46],[86,34],[104,22],[126,28],[140,46],[142,70],[140,94],[134,76],[122,66],[104,62],[84,66],[68,74]]; break;
    case 6: B=null; F="curly"; break;
    case 7: B=[[100,10],[134,18],[156,44],[160,80],[150,112],[124,120],[76,120],[50,112],[40,80],[44,44],[66,18]]; F=[[60,92],[58,64],[74,46],[100,40],[126,46],[142,64],[140,92],[132,74],[114,66],[86,66],[68,74]]; break;
    case 8: B=[[56,92],[54,56],[76,34],[100,30],[124,34],[146,56],[144,92],[150,140],[154,178],[128,186],[100,180],[72,186],[46,178],[50,140]];
            F=[[60,104],[56,64],[74,40],[100,34],[126,40],[144,64],[140,104],[134,82],[120,64],[100,60],[80,64],[66,82]]; break;
    case 9: B=[[56,92],[52,56],[76,32],[100,28],[124,32],[148,56],[144,92],[154,120],[146,146],[156,172],[130,186],[100,178],[70,186],[44,172],[54,146],[46,120]];
            F=[[60,106],[54,64],[74,38],[100,32],[126,38],[146,64],[140,106],[136,84],[118,60],[98,58],[96,70],[86,62],[70,74],[64,88]]; break;
    case 10: B=[[56,90],[54,56],[76,34],[100,30],[124,34],[146,56],[144,90],[148,126],[136,136],[64,136],[52,126]];
            F=[[58,112],[54,64],[74,38],[100,32],[126,38],[146,64],[142,112],[138,90],[134,72],[118,66],[100,70],[82,66],[66,72],[62,90]]; break;
    case 11: B=[[132,60],[150,70],[162,96],[160,130],[150,158],[142,150],[146,124],[142,96],[130,80]];
            F=[[60,94],[58,62],[74,42],[100,36],[126,42],[142,62],[140,94],[134,74],[120,64],[100,62],[80,64],[66,74]]; X="tieR"; break;
    case 12: B=[[100,12],[114,16],[120,28],[114,40],[100,44],[86,40],[80,28],[86,16]];
            F=[[60,94],[58,62],[74,42],[100,38],[126,42],[142,62],[140,94],[134,74],[120,64],[100,62],[80,64],[66,74]]; X="bun"; break;
    case 13: B=[[56,96],[52,120],[48,150],[52,172],[62,176],[66,150],[64,120],[64,100]];
            F=[[60,94],[58,62],[74,42],[100,36],[126,42],[142,62],[140,94],[134,74],[120,64],[100,62],[80,64],[66,74]]; X="braids"; break;
    case 14: B=[[56,90],[52,56],[76,32],[100,28],[124,32],[148,56],[144,90],[150,124],[156,150],[140,160],[60,160],[44,150],[50,124]];
            F=[[60,108],[54,64],[72,38],[100,32],[128,38],[146,64],[140,108],[136,86],[124,66],[112,60],[100,66],[86,58],[70,70],[64,88]]; break;
  }
  return {F:F,B:B,X:X};
}
/* ---------- asosiy SVG ---------- */
var UID=0;
function svg(c,o){
  c=fix(c); o=o||{};
  var lod=o.lod==null?2:o.lod, an=!!o.anim, u=o.uid||("x"+(++UID));
  var sk=SKIN[c.sk], skD=shade(sk,-.18), skDD=shade(sk,-.34), skL=shade(sk,.28), olS=shade(sk,-.5);
  var hc=HAIR[c.hc], hcD=shade(hc,-.35), hcL=shade(hc,.32), olH=shade(hc,-.55);
  var cc=CLOTH[c.cc], ccD=shade(cc,-.24), ccL=shade(cc,.22), olC=shade(cc,-.5);
  var bg=BGP[c.bg], ec=EYE[c.ec], lip=shade(sk,-.42), ink="#2b1d18";
  var hij=c.hw===2, bald=c.h===0||hij;
  var g=function(n){ return u+n; };
  var s='<defs>'+
    '<linearGradient id="'+g("b")+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+bg[0]+'"/><stop offset="1" stop-color="'+bg[1]+'"/></linearGradient>'+
    '<radialGradient id="'+g("f")+'" cx=".4" cy=".34" r=".8"><stop offset="0" stop-color="'+skL+'"/><stop offset=".6" stop-color="'+sk+'"/><stop offset="1" stop-color="'+skD+'"/></radialGradient>'+
    '<linearGradient id="'+g("h")+'" x1=".2" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="'+hcL+'"/><stop offset=".45" stop-color="'+hc+'"/><stop offset="1" stop-color="'+hcD+'"/></linearGradient>'+
    '<linearGradient id="'+g("c")+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+ccL+'"/><stop offset="1" stop-color="'+ccD+'"/></linearGradient>'+
    '<linearGradient id="'+g("s")+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b5563"/><stop offset=".5" stop-color="#0b0f17"/><stop offset="1" stop-color="#374151"/></linearGradient>'+
    '<clipPath id="'+g("k")+'"><path d="'+crPath(facePts(c.fs),true)+'"/></clipPath>'+
    (c.cl===8?'<pattern id="'+g("p")+'" width="26" height="40" patternUnits="userSpaceOnUse"><rect width="26" height="40" fill="'+cc+'"/>'+
      '<path d="M0 0h6v40H0z" fill="#facc15"/><path d="M9 0q4 10 0 20t0 20h4q4-10 0-20t0-20z" fill="#ef4444"/><path d="M16 0h3v40h-3z" fill="#fff" opacity=".8"/><path d="M21 0q3 10 0 20t0 20h3V0z" fill="'+ccD+'"/></pattern>':'')+
    '</defs>';
  /* --- fon --- */
  var BG='<rect x="-10" y="-10" width="220" height="220" fill="url(#'+g("b")+')"/>';
  if(lod>=1&&c.bp){
    var pc=lum(bg[0])>.5?"#ffffff":"#ffffff", po=lum(bg[0])>.5?.45:.16;
    var pat=["",
      (function(){ var x=""; for(var yy=10;yy<200;yy+=22) for(var xx=(yy/22%2?21:10);xx<200;xx+=22) x+='<circle cx="'+xx+'" cy="'+yy+'" r="3"/>'; return x; })(),
      (function(){ var x=""; for(var k=-200;k<200;k+=24) x+='<path d="M'+k+' 0l200 200" stroke="'+pc+'" stroke-width="7"/>'; return x; })(),
      '<circle cx="40" cy="40" r="26" fill="none" stroke="'+pc+'" stroke-width="5"/><circle cx="40" cy="40" r="44" fill="none" stroke="'+pc+'" stroke-width="4"/><circle cx="168" cy="150" r="30" fill="none" stroke="'+pc+'" stroke-width="5"/><circle cx="168" cy="150" r="50" fill="none" stroke="'+pc+'" stroke-width="4"/>',
      (function(){ var x=""; for(var yy=14;yy<200;yy+=26) x+='<path d="M0 '+yy+'q12-9 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0" fill="none" stroke="'+pc+'" stroke-width="4"/>'; return x; })(),
      '<path d="M30 30l4 9 9 4-9 4-4 9-4-9-9-4 9-4zM170 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM160 120l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5zM26 120l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
      (function(){ var x=""; for(var k=0;k<=200;k+=25) x+='<path d="M'+k+' 0v200M0 '+k+'h200" stroke="'+pc+'" stroke-width="2.4"/>'; return x; })(),
      (function(){ var x=""; for(var xx=0;xx<220;xx+=40) x+='<path d="M'+xx+' 0q14 25 0 50t0 50 0 50 0 50" fill="none" stroke="'+pc+'" stroke-width="9"/><path d="M'+(xx+20)+' 0l8 25-8 25 8 25-8 25 8 25-8 25 8 25" fill="none" stroke="'+pc+'" stroke-width="3"/>'; return x; })()][c.bp];
    BG+='<g fill="'+pc+'" opacity="'+po+'">'+pat+'</g>';
  }
  if(lod>=2) BG+='<ellipse cx="70" cy="34" rx="70" ry="30" fill="#fff" opacity=".18"/>';
  /* --- tana va kiyim --- */
  var sh='M18 206C20 172 48 152 84 146c10 7 22 7 32 0 36 6 64 26 66 60z';
  var CL='', CF=c.cl===8?'url(#'+g("p")+')':'url(#'+g("c")+')';
  var neck=P('M86 116h28v32c0 8-28 8-28 0z',sk,OL(olS))+P('M86 124q14 16 28 0v-6H86z',skD,' opacity=".6"');
  CL=P(sh,CF,OL(olC));
  switch(c.cl){
    case 0: CL+=P('M84 146q16 14 32 0',"none",OL(ccD).replace(SW,"5")); break;
    case 1: CL+=P('M84 145l16 22 16-22',sk,OL(olC)); break;
    case 2: CL+=P('M66 152c6 18 62 18 68 0-8-8-14-9-18-9-6 14-26 14-32 0-4 0-10 1-18 9z',ccD,OL(olC))+
            (lod>=1?'<path d="M92 162v20M108 162v20" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="92" cy="183" r="2.6" fill="#fff"/><circle cx="108" cy="183" r="2.6" fill="#fff"/>':'')+
            (lod>=1?P('M80 188h40v12H80z',ccD,' opacity=".55"'):''); break;
    case 3: CL+=P('M84 146l16 16 16-16 10 6-10 16-16-10-16 10-10-16z',"#fff",OL("#94a3b8")); break;
    case 4: CL+=P('M84 146l16 18 16-18 9 6-9 15-16-9-16 9-9-15z',"#fff",OL("#94a3b8"))+P('M100 158l-6 7 6 36 6-36z',"#1e3a8a",OL("#0b1a45"))+P('M95 157h10l-5 7z',"#172554"); break;
    case 5: CL+=P('M84 146l16 22 16-22z',"#fff")+P('M100 160l-5 6 5 38 5-38z',"#b91c1c")+
            P('M84 146l-12 8 16 30 12-16zM116 146l12 8-16 30-12-16z',ccD,OL(olC))+(lod>=1?'<circle cx="100" cy="190" r="2" fill="'+olC+'"/>':''); break;
    case 6: CL+=P('M80 150c4-14 36-14 40 0v10c-6 6-34 6-40 0z',ccD,OL(olC))+(lod>=1?P('M82 152q18 6 36 0',"none",' stroke="'+ccL+'" stroke-width="2" opacity=".7"'):''); break;
    case 7: CL+=P('M84 146l16 22 16-22',"#fff",OL("#94a3b8"))+P('M86 146l14 16 14-16',"none",' stroke="#cbd5e1" stroke-width="3"')+
            (lod>=1?'<path d="M36 182q64-14 128 0M30 196q70-14 140 0" stroke="'+ccL+'" stroke-width="3" fill="none" opacity=".55"/>':''); break;
    case 8: CL+=P('M84 146l16 44 16-44',"none",' stroke="#a16207" stroke-width="8" stroke-linejoin="round"')+P('M84 146l16 44 16-44',"none",' stroke="#fde047" stroke-width="3"'); break;
    case 9: CL+=P('M86 146l14 14 14-14 8 4-6 12-16-6-16 6-6-12z',ccD,OL(olC))+(lod>=1?'<circle cx="100" cy="168" r="1.8" fill="#fff"/><circle cx="100" cy="176" r="1.8" fill="#fff"/>':''); break;
  }
  if(hij) CL+=P('M26 206C30 174 52 150 76 144c12 10 36 10 48 0 24 6 46 30 50 62z',shade(cc,.18),OL(olC))+(lod>=1?P('M60 170q40 -18 80 0',"none",' stroke="#fff" stroke-width="2" opacity=".3"'):'');
  var BODY='<g class="ax-body">'+neck+CL+'</g>';
  /* --- soch (orqa) --- */
  var H=hairParts(c.h,lod<1), HB="", HF="";
  var hairFill='url(#'+g("h")+')';
  if(!hij&&c.h){
    if(H.B) HB=P(crPath(H.B,true),hairFill,OL(olH));
    if(H.X==="braids") HB+=P(crPath(mir(H.B).slice(H.B.length),true),hairFill,OL(olH));
    if(H.X==="bun"&&lod>=1) HB+='<path d="M90 26q10-6 20 0" fill="none" stroke="'+hcL+'" stroke-width="2.4" opacity=".6"/>';
  }
  if(hij) HB=P('M48 98C46 46 76 30 100 30s54 16 52 68c2 32-8 52-20 62H68C56 150 46 130 48 98z',shade(cc,.18),OL(olC));
  /* --- quloqlar va yuz --- */
  var fp=FACE[c.fs], ex=fp[2]+3;
  var EAR=hij?'':'<g>'+P('M'+(100-ex)+' 86c-12-4-14 18-2 22',sk,OL(olS))+P('M'+(100+ex)+' 86c12-4 14 18 2 22',sk,OL(olS))+
      (lod>=1?P('M'+(100-ex-2)+' 92q-4 6 1 10',"none",' stroke="'+skDD+'" stroke-width="1.6" stroke-linecap="round"')+P('M'+(100+ex+2)+' 92q4 6-1 10',"none",' stroke="'+skDD+'" stroke-width="1.6" stroke-linecap="round"'):'')+'</g>';
  var faceD=crPath(facePts(c.fs),true);
  var FACEP=P(faceD,'url(#'+g("f")+')',OL(olS));
  /* yuzga tushadigan soya (soch ostida) */
  var FSH='';
  if(lod>=1&&!bald&&H.F) FSH='<g clip-path="url(#'+g("k")+')"><path d="'+(H.F==="curly"?'M50 50h100v26q-50 12-100 0z':crPath(H.F,true))+'" fill="'+skDD+'" opacity=".28" transform="translate(0 5)"/></g>';
  if(lod>=1&&hij) FSH='<g clip-path="url(#'+g("k")+')"><ellipse cx="100" cy="56" rx="44" ry="18" fill="'+skDD+'" opacity=".22"/></g>';
  var CHEEK=lod>=1?'<g fill="#ff7a8a" opacity=".2"><ellipse cx="78" cy="108" rx="9" ry="5.5"/><ellipse cx="122" cy="108" rx="9" ry="5.5"/></g>':'';
  /* burun */
  var NO=['M98 101q-3 7 1 9 3 1 6-1','M99 100q-2 6 1 8','M96 106q4 4 8 0','M99 94q-4 13 0 16 3 2 7-1','M94 107q6 5 12 0','M100 94l-4 14q3 3 8 0','M97 104q3 3 6 0','M99 98v8'][c.no];
  var NOSE=P(NO,"none",' stroke="'+skDD+'" stroke-width="'+(lod<1?2.6:2.2)+'" stroke-linecap="round" stroke-linejoin="round"')+
    (lod>=2?'<ellipse cx="101" cy="104" rx="2.2" ry="1.4" fill="#fff" opacity=".35"/>':'')+(c.no===2?P('M96 106q4 4 8 0',skD,' opacity=".5"'):'');
  /* ko'zlar */
  function eyeO(x,rx,ry,ir,lash,shape){
    var e='<g class="ax-eye">';
    if(shape==="alm") e+=P('M'+(x-8)+' 93q8-9 16 0q-8 7-16 0z',"#fff",OL(olS).replace(SW,"1.6"));
    else e+='<ellipse cx="'+x+'" cy="93" rx="'+rx+'" ry="'+ry+'" fill="#fff"'+OL(olS).replace(SW,"1.6")+'/>';
    e+='<g class="ax-look"><circle cx="'+x+'" cy="94" r="'+ir+'" fill="'+ec+'"/><circle cx="'+x+'" cy="94" r="'+(ir*.52).toFixed(2)+'" fill="#0d0a09"/>'+
      (lod>=1?'<circle cx="'+(x+ir*.4).toFixed(1)+'" cy="'+(94-ir*.45).toFixed(1)+'" r="'+(ir*.36).toFixed(2)+'" fill="#fff"/>':'')+'</g>';
    if(lash&&lod>=1) e+=P('M'+(x-rx-1)+' 90q'+(rx+1)+' -8 '+(2*rx+2)+' 0',"none",' stroke="'+ink+'" stroke-width="2.6" stroke-linecap="round"')+
      P('M'+(x+rx-1)+' 88l3-3M'+(x+rx-4)+' 86.5l2-4',"none",' stroke="'+ink+'" stroke-width="1.8" stroke-linecap="round"');
    return e+'</g>';
  }
  function arcE(x,up){ return P(up?'M'+(x-7)+' 95q7-8 14 0':'M'+(x-7)+' 92q7 7 14 0',"none",' stroke="'+ink+'" stroke-width="3" stroke-linecap="round"'); }
  var E="";
  switch(c.ey){
    case 0: E=eyeO(84,6.4,7,4.2)+eyeO(116,6.4,7,4.2); break;
    case 1: E=eyeO(84,0,0,3.8,0,"alm")+eyeO(116,0,0,3.8,0,"alm"); break;
    case 2: E=arcE(84,1)+arcE(116,1); break;
    case 3: E=eyeO(84,8,8.6,5.4)+eyeO(116,8,8.6,5.4); break;
    case 4: E=eyeO(84,6.4,7,4.2)+eyeO(116,6.4,7,4.2)+P('M76 92a8 7 0 0 1 16 0zM108 92a8 7 0 0 1 16 0z',sk)+P('M76 92h16M108 92h16',"none",' stroke="'+olS+'" stroke-width="2" stroke-linecap="round"'); break;
    case 5: E=eyeO(84,6.4,7,4.2)+P('M109 94q7 5 14 0',"none",' stroke="'+ink+'" stroke-width="3" stroke-linecap="round"'); break;
    case 6: E=eyeO(84,6.4,7,4.2)+eyeO(116,6.4,7,4.2)+P('M77 99q7 3 14 0M109 99q7 3 14 0',sk,OL(olS).replace(SW,"1.6")); break;
    case 7: E=eyeO(84,6.4,7,4.2,1)+eyeO(116,6.4,7,4.2,1); break;
    case 8: E=eyeO(84,7,5,3.8)+eyeO(116,7,5,3.8)+P('M76 90h16M108 90h16',"none",' stroke="'+skD+'" stroke-width="2.4" stroke-linecap="round"'); break;
    default: E=eyeO(84,7.4,8,5,0)+eyeO(116,7.4,8,5,0)+(lod>=1?'<g fill="#fff"><circle cx="81" cy="97" r="1.3"/><circle cx="113" cy="97" r="1.3"/></g>':'');
  }
  E='<g class="ax-blink">'+E+'</g>';
  /* qoshlar */
  var BRC=bald?shade(HAIR[c.hc],-.2):hcD;
  if(c.h===0&&!hij) BRC=shade(HAIR[c.hc],-.15);
  var BP=[["M76 82q8-5 16-1","M108 81q8-4 16 1"],["M75 83q9-9 18-3","M107 80q9-6 18 3"],["M75 81h17","M108 81h17"],["M77 82q7-4 14-1","M109 81q7-3 14 1"],
          ["M76 78q8-7 16-3","M108 75q8-4 16 3"],["M76 79l16 4","M108 83l16-4"],["M76 81q8 1 16-3","M108 78q8 4 16 3"],["M75 82q9-7 18-2","M107 80q9-5 18 2"]][c.br];
  var BW=[3.2,3,5.4,2,3.2,3.6,3,4.8][c.br];
  var BROW='<g class="ax-brow">'+P(BP[0],"none",' stroke="'+BRC+'" stroke-width="'+BW+'" stroke-linecap="round"')+P(BP[1],"none",' stroke="'+BRC+'" stroke-width="'+BW+'" stroke-linecap="round"')+'</g>';
  /* og'iz */
  var tongue="#e86a79", dark="#5c1f2a";
  var MO=[
    P('M88 117q12 11 24 0',"none",' stroke="'+lip+'" stroke-width="3.2" stroke-linecap="round"'),
    P('M86 115q14 18 28 0z',dark,OL(lip).replace(SW,"1.8"))+P('M88 116q12 3 24 0v2q-12 4-24 0z',"#fff")+P('M93 125q7 3 14 0q-7-4-14 0z',tongue),
    P('M91 119q9 3 18 0',"none",' stroke="'+lip+'" stroke-width="3" stroke-linecap="round"'),
    P('M86 114q14 22 28 0z',dark,OL(lip).replace(SW,"1.8"))+P('M88 115q12 3 24 0v2q-12 4-24 0z',"#fff")+P('M92 126q8 5 16 0q-8-6-16 0z',tongue),
    P('M90 120q10 3 21-6',"none",' stroke="'+lip+'" stroke-width="3.2" stroke-linecap="round"'),
    '<ellipse cx="100" cy="120" rx="5" ry="6" fill="'+dark+'"'+OL(lip).replace(SW,"1.6")+'/><ellipse cx="100" cy="122.6" rx="3" ry="2.2" fill="'+tongue+'"/>',
    P('M86 115q14 16 28 0z',dark,OL(lip).replace(SW,"1.8"))+P('M88 116q12 3 24 0v2q-12 4-24 0z',"#fff")+P('M95 121q5 11 10 0z',"#f472b6"),
    P('M88 117q12 10 24 0',"none",' stroke="'+lip+'" stroke-width="3.2" stroke-linecap="round"')+(lod>=1?P('M84 114q2 4 0 6M116 114q-2 4 0 6',"none",' stroke="'+skDD+'" stroke-width="1.6" stroke-linecap="round"'):''),
    P('M88 116q12 8 24 0q-12 5-24 0z',"#fff",OL(lip).replace(SW,"2")),
    P('M92 120h16',"none",' stroke="'+lip+'" stroke-width="3" stroke-linecap="round"')][c.mo];
  if(lod>=2&&(c.mo===0||c.mo===2||c.mo===7)) MO+='<ellipse cx="100" cy="124.5" rx="5" ry="1.4" fill="#fff" opacity=".22"/>';
  var MOUTH='<g class="ax-mouth">'+MO+'</g>';
  /* soqol-mo'ylov */
  var mst=P('M85 112c6-6 11-4 15-1 4-3 9-5 15 1-4 6-10 5-15 2-5 3-11 4-15-2z',hcD,OL(olH).replace(SW,"1.4"));
  var FH=['',
    lod>=1?'<g clip-path="url(#'+g("k")+')"><path d="M50 104c4 30 24 40 50 40s46-10 50-40c-8 18-26 26-50 26s-42-8-50-26z" fill="'+hcD+'" opacity=".3"/></g>':'',
    mst,
    mst+P('M92 128q8 14 16 0q-8 4-16 0z',hc,OL(olH).replace(SW,"1.4")),
    '<g clip-path="url(#'+g("k")+')">'+P('M50 96c2 36 22 48 50 48s48-12 50-48c-4 16-8 22-12 24-6 14-20 18-38 18s-32-4-38-18c-4-2-8-8-12-24z',hairFill)+'</g>',
    '<g clip-path="url(#'+g("k")+')">'+P('M50 98c0 34 20 46 50 46s50-12 50-46c-4 12-10 18-18 20-4-6-14-9-32-9s-28 3-32 9c-8-2-14-8-18-20z',hairFill)+'</g>'+mst+P('M90 119q10 8 20 0',sk),
    P('M62 96c-4 40 14 62 38 62s42-22 38-62c-4 14-10 20-18 22-4-6-14-9-20-9s-16 3-20 9c-8-2-14-8-18-22z',hairFill,OL(olH))+mst+P('M90 119q10 8 20 0',sk),
    mst+P('M97 126h6v8h-6z',hcD)][c.fh];
  /* soch (old) */
  if(!hij&&c.h){
    if(H.F==="curly"){
      var cs=""; for(var i=0;i<13;i++){ var a=Math.PI*(1.02+i*.08), x=100+40*Math.cos(a), y=82+40*Math.sin(a); cs+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(12+(i%3)*1.5)+'"/>'; }
      HF='<g fill="'+hairFill+'"'+OL(olH)+'>'+cs+'</g><ellipse cx="100" cy="56" rx="38" ry="20" fill="'+hairFill+'"/>'+
        (lod>=1?'<g fill="'+hcL+'" opacity=".45"><circle cx="82" cy="48" r="4"/><circle cx="108" cy="44" r="3.4"/><circle cx="126" cy="56" r="3"/></g>':'');
    } else if(H.F){
      HF=P(crPath(H.F,true),hairFill,OL(olH));
      if(c.h===1) HF=P(crPath(H.F,true),hairFill,OL(olH)+' opacity=".9"');
      if(lod>=1) HF+=P('M80 50q20-10 42-2',"none",' stroke="'+hcL+'" stroke-width="3.4" stroke-linecap="round" opacity=".55"')+
        (lod>=2?P('M74 60q8-8 18-10M110 46q12 0 20 8',"none",' stroke="'+hcD+'" stroke-width="1.6" stroke-linecap="round" opacity=".5"'):'');
      if(H.X==="tieR") HF+='<circle cx="134" cy="66" r="4" fill="'+CLOTH[(c.cc+3)%12]+'"/>';
      if(H.X==="bun") HF+='<rect x="92" y="38" width="16" height="5" rx="2.5" fill="'+CLOTH[(c.cc+3)%12]+'"/>';
    }
  }
  /* bosh kiyim */
  var HW="", hcol=shade(cc,.18);
  switch(c.hw){
    case 1: HW=P('M64 66C64 44 80 34 100 34s36 10 36 32l-2 6c-22-8-46-8-68 0z',"#15151c",OL("#000"))+
            P('M66 68c22-8 46-8 68 0',"none",' stroke="#f8fafc" stroke-width="2.4" stroke-dasharray="3.4 3"')+
            (lod>=1?'<g fill="#f8fafc"><path d="M78 58c-5-9 2-16 7-13 5 2 3 9-2 10 2 2 0 6-5 3z"/><path d="M98 52c-5-9 2-16 7-13 5 2 3 9-2 10 2 2 0 6-5 3z"/><path d="M118 58c-5-9 2-16 7-13 5 2 3 9-2 10 2 2 0 6-5 3z"/></g>':''); break;
    case 2: HW=P('M48 96C46 44 78 30 100 30s54 14 52 66c0 34-12 52-24 62H72C60 148 48 130 48 96zM100 50c-21 0-35 17-35 40 0 27 16 44 35 44s35-17 35-44c0-23-14-40-35-40z',hcol,OL(olC)+' fill-rule="evenodd"')+
            P('M65 90c0-23 14-40 35-40s35 17 35 40',"none",' stroke="'+shade(cc,-.2)+'" stroke-width="3"')+
            (lod>=1?P('M58 66q42-34 84 0',"none",' stroke="#fff" stroke-width="2.4" opacity=".35"')+'<circle cx="136" cy="128" r="3.2" fill="#fcd34d"/>':''); break;
    case 3: HW=P('M62 72C62 44 82 32 100 32s38 12 38 40z',cc,OL(olC))+P('M62 72C62 44 82 32 100 32s38 12 38 40z','url(#'+g("c")+')',' opacity=".55"')+
            P('M56 72c28-8 74-9 106 2-8 10-34 9-52 7-22-2-38-3-54-2z',ccD,OL(olC))+'<circle cx="100" cy="33" r="3.4" fill="'+ccD+'"/>'; break;
    case 4: HW=P('M62 72C62 44 82 32 100 32s38 12 38 40z',cc,OL(olC))+P('M62 72C62 44 82 32 100 32s38 12 38 40z','url(#'+g("c")+')',' opacity=".55"')+
            P('M60 70c10-4 20-5 30-4l-2 8c-10-1-20 0-28 2z',ccD,OL(olC))+'<rect x="94" y="62" width="14" height="8" rx="2" fill="'+ccD+'"/>'; break;
    case 5: HW=P('M60 80C58 44 80 28 100 28s42 16 40 52z',cc,OL(olC))+P('M60 80C58 44 80 28 100 28s42 16 40 52z','url(#'+g("c")+')',' opacity=".5"')+
            '<rect x="56" y="70" width="88" height="15" rx="7.5" fill="'+ccD+'"'+OL(olC)+'/>'+
            (lod>=1?'<path d="M66 72v11M76 72v11M86 72v11M96 72v11M106 72v11M116 72v11M126 72v11M136 72v11" stroke="'+cc+'" stroke-width="2" opacity=".6"/>':'')+
            '<circle cx="100" cy="26" r="9" fill="#f8fafc"'+OL("#cbd5e1")+'/>'; break;
    case 6: HW=P('M56 66c-6-20 20-34 50-32 26 2 46 14 42 30-2 6-10 8-18 6-20-6-42-6-60 0-8 2-12 0-14-4z',cc,OL(olC))+'<circle cx="104" cy="34" r="3" fill="'+ccD+'"/>'; break;
    case 7: HW=P('M60 72C60 46 80 34 100 34s40 12 40 38c-26-8-54-8-80 0z',cc,OL(olC))+P('M138 66l14 6-6 10z',ccD,OL(olC))+
            (lod>=1?'<g fill="#fff" opacity=".8"><circle cx="82" cy="54" r="2.2"/><circle cx="100" cy="46" r="2.2"/><circle cx="118" cy="54" r="2.2"/><circle cx="92" cy="62" r="1.6"/><circle cx="110" cy="62" r="1.6"/></g>':''); break;
    case 8: HW=P('M58 98C56 52 78 34 100 34s44 18 42 64',"none",' stroke="#1f2937" stroke-width="8" stroke-linecap="round"')+
            '<rect x="48" y="86" width="18" height="28" rx="8" fill="'+cc+'"'+OL(olC)+'/><rect x="134" y="86" width="18" height="28" rx="8" fill="'+cc+'"'+OL(olC)+'/>'+
            (lod>=1?'<rect x="52" y="90" width="5" height="20" rx="2.5" fill="#fff" opacity=".35"/>':''); break;
    case 9: HW=P('M64 66c0-12 16-20 36-20s36 8 36 20c-20 6-52 6-72 0z',"#111827",OL("#000"))+P('M44 50l56-20 56 20-56 20z',"#1f2937",OL("#000"))+
            P('M100 50l34 6v20',"none",' stroke="#facc15" stroke-width="2.4"')+'<circle cx="134" cy="78" r="4" fill="#facc15"/>'; break;
    case 10: var fl=""; for(var j=0;j<7;j++){ var fx=66+j*11.4, fy=56-Math.sin(j/6*Math.PI)*14;
             fl+='<g transform="translate('+fx.toFixed(1)+' '+fy.toFixed(1)+')"><circle r="6.2" fill="'+["#f472b6","#fbbf24","#fb7185","#a78bfa","#f472b6","#fbbf24","#fb7185"][j]+'"'+OL("#9d174d").replace(SW,"1.2")+'/><circle r="2.2" fill="#fef9c3"/></g>'; }
             HW=P('M62 70q38-30 76 0',"none",' stroke="#15803d" stroke-width="3"')+fl; break;
  }
  /* ko'zoynak */
  var GW=' stroke-width="2.6"', GL='';
  switch(c.gl){
    case 1: GL='<g fill="#fff" fill-opacity=".14" stroke="#374151"'+GW+'><circle cx="84" cy="93" r="11"/><circle cx="116" cy="93" r="11"/></g>'+P('M95 92q5-4 10 0M73 91l-9-3M127 91l9-3',"none",' stroke="#374151"'+GW); break;
    case 2: GL='<g fill="#fff" fill-opacity=".14" stroke="#111827" stroke-width="3.6"><rect x="71" y="84" width="26" height="18" rx="5"/><rect x="103" y="84" width="26" height="18" rx="5"/></g>'+P('M97 91h6M71 89l-8-2M129 89l8-2',"none",' stroke="#111827" stroke-width="3.6"'); break;
    case 3: GL=P('M71 86h26l-3 12c-2 7-19 7-21 0zM103 86h26l-2 12c-2 7-19 7-21 0z','url(#'+g("s")+')',' stroke="#b45309" stroke-width="2"')+P('M97 89h6M71 88l-8-2M129 88l8-2',"none",' stroke="#b45309" stroke-width="2.2"')+
            (lod>=1?P('M76 89h7M108 89h7',"none",' stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"'):''); break;
    case 4: GL=P('M71 88c4-7 24-7 27 0-1 9-7 13-13 13s-13-4-14-13zM102 88c3-7 23-7 27 0-1 9-8 13-14 13s-12-4-13-13z',"#fff",' fill-opacity=".14" stroke="#9d174d" stroke-width="2.8"')+P('M98 89q2-2 4 0M71 88l-7-7M129 88l7-7',"none",' stroke="#9d174d" stroke-width="2.8"'); break;
    case 5: GL=P('M72 92h24M104 92h24',"none",' stroke="#334155" stroke-width="3.4" stroke-linecap="round"')+P('M73 92q0 10 11 10t11-10M105 92q0 10 11 10t11-10',"none",' stroke="#94a3b8" stroke-width="1.4"')+P('M96 92h8M72 92l-8-3M128 92l8-3',"none",' stroke="#334155" stroke-width="2.6"'); break;
    case 6: GL=P('M70 85h28v9c0 8-6 11-14 11s-14-3-14-11zM102 85h28v9c0 8-6 11-14 11s-14-3-14-11z','url(#'+g("s")+')',' stroke="#0b0f17" stroke-width="2.4"')+P('M98 88h4M70 87l-8-2M130 87l8-2',"none",' stroke="#0b0f17" stroke-width="3"')+
            (lod>=1?P('M75 89l6 0M107 89l6 0',"none",' stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"'):''); break;
    case 7: GL='<g fill="'+CLOTH[(c.cc+5)%12]+'" fill-opacity=".45" stroke="#4c1d95" stroke-width="2.4"><circle cx="84" cy="93" r="11"/><circle cx="116" cy="93" r="11"/></g>'+P('M95 92q5-4 10 0M73 91l-9-3M127 91l9-3',"none",' stroke="#4c1d95" stroke-width="2.4"'); break;
  }
  /* sirg'alar */
  var ER='', ey1=100-ex-3, ey2=100+ex+3;
  if(c.er&&lod>=1){
    var gold="#f5b301", silv="#cbd5e1";
    var f1=function(x){ switch(c.er){
      case 1: return '<circle cx="'+x+'" cy="110" r="3.2" fill="'+gold+'"'+OL("#a16207").replace(SW,"1")+'/>';
      case 2: return '<circle cx="'+x+'" cy="110" r="3.2" fill="'+silv+'"'+OL("#64748b").replace(SW,"1")+'/>';
      case 3: return '<circle cx="'+x+'" cy="116" r="6" fill="none" stroke="'+gold+'" stroke-width="2.4"/>';
      case 4: return '<circle cx="'+x+'" cy="116" r="6" fill="none" stroke="'+silv+'" stroke-width="2.4"/>';
      case 5: return '<path d="M'+x+' 110v4" stroke="'+gold+'" stroke-width="1.4"/><circle cx="'+x+'" cy="118" r="3.6" fill="#f8fafc"'+OL("#94a3b8").replace(SW,"1")+'/>';
      case 6: return '<path d="M'+x+' 110v3" stroke="'+gold+'" stroke-width="1.4"/><path d="M'+x+' 113l3.4 4-3.4 5-3.4-5z" fill="#e11d48"'+OL("#881337").replace(SW,"1")+'/>';
      default: return '<path d="M'+x+' 110v10" stroke="'+gold+'" stroke-width="1.6"/><circle cx="'+x+'" cy="121" r="2.4" fill="'+gold+'"/><circle cx="'+x+'" cy="110" r="2" fill="'+gold+'"/>'; } };
    ER=f1(ey1)+f1(ey2);
  }
  var HEAD='<g class="ax-head">'+HB+EAR+ER+FACEP+FSH+CHEEK+NOSE+'<g class="ax-fh">'+FH+'</g>'+MOUTH+E+BROW+HF+HW+GL+'</g>';
  var SPK=(lod>=2&&an)?'<g fill="#fff" class="ax-spk"><path class="ax-tw" d="M30 54l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4z"/><path class="ax-tw t2" d="M170 44l2 4.6 4.6 2-4.6 2-2 4.6-2-4.6-4.6-2 4.6-2z"/></g>':'';
  var vb=o.vb||"14 18 172 172";
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+vb+'" class="ax-svg'+(an?' ax-anim':'')+'" aria-hidden="true" focusable="false">'+s+BG+SPK+BODY+HEAD+'</svg>';
}
/* ---------- kesh va komponent ---------- */
var CACHE={}, CN=0;
function lodOf(sz){ return sz<40?0:(sz<96?1:2); }
function dataUri(c,lod,vb){
  var key=enc(c)+"|"+lod+"|"+(vb||"");
  var v=CACHE[key]; if(v) return v;
  if(++CN>1500){ CACHE={}; CN=0; }
  v="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg(c,{lod:lod,uid:"s",vb:vb}));
  CACHE[key]=v; return v;
}
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(ch){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]; }); }
function initials(nm){ var p=String(nm||"?").trim().split(/\s+/); return ((p[0]||"?").charAt(0)+((p[1]||"").charAt(0))).toUpperCase(); }
function colorOf(seed){ return CLOTH[h32(seed)%CLOTH.length]; }
function resolve(x,seed,hint){
  if(x&&typeof x==="object"&&x.fs!=null&&x.cl!=null) return fix(x);
  var d=null; try{ d=dec(x); }catch(e){}
  return d||gen(seed==null?x:seed,hint);
}
/* opts: size(px), shape:"circle"|"rounded", status:"online"|"away"|"offline", badge:"…" (matn/emoji),
         animated:bool, alt/name: matn, seed: zaxira seed, cls: qo'shimcha klass, vb */
function html(x,opts){
  opts=opts||{}; css();
  var sz=opts.size||40, shp=opts.shape==="rounded"?" avx-r":"", name=opts.name||opts.alt||"", alt=opts.alt||(name?name+" — avatar":"avatar");
  var extra=(opts.status?'<i class="avx-st avx-'+esc(opts.status)+'" aria-hidden="true"></i>':'')+(opts.badge?'<b class="avx-bd">'+esc(opts.badge)+'</b>':'');
  var wrapA='<span class="avx'+shp+(opts.cls?" "+esc(opts.cls):"")+'" style="--avs:'+sz+'px" role="img" aria-label="'+esc(alt)+'"';
  var c;
  try{ c=resolve(x,opts.seed,opts.hint!=null?opts.hint:hintOf(name)); }catch(e){ c=null; }
  if(!c) return wrapA+' data-fb="1"><span class="avx-in" style="background:'+colorOf(opts.seed||name)+'">'+esc(initials(name))+'</span>'+extra+'</span>';
  var anim=opts.animated&&sz>=40;               /* ro'yxatlarda animated:false */
  if(anim) return wrapA+'>'+svg(c,{lod:lodOf(sz),anim:1,vb:opts.vb})+extra+'</span>';
  return wrapA+'><img src="'+dataUri(c,lodOf(sz),opts.vb)+'" alt="" width="'+sz+'" height="'+sz+'" decoding="async" loading="lazy" '+
    'onerror="this.outerHTML=\'<span class=&quot;avx-in&quot;>'+esc(initials(name)).replace(/'/g,"")+'</span>\'">'+extra+'</span>';
}
/* PNG/WebP eksport */
function exportImg(c,size,type){
  size=size||512; type=type||"image/png";
  return new Promise(function(res,rej){
    var im=new Image(); im.onload=function(){
      var cv=document.createElement("canvas"); cv.width=size; cv.height=size;
      var x=cv.getContext("2d"); x.drawImage(im,0,0,size,size);
      if(cv.toBlob) cv.toBlob(function(b){ b?res(b):rej(new Error("blob")); },type,.92); else rej(new Error("toBlob"));
    }; im.onerror=rej;
    im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg(c,{lod:2,uid:"e"}).replace("<svg ",'<svg width="'+size+'" height="'+size+'" '));
  });
}
/* ---------- uslublar (bir marta qo'shiladi) ---------- */
var CSSDONE=false;
function css(){
  if(CSSDONE||typeof document==="undefined") return; CSSDONE=true;
  var st=document.createElement("style"); st.id="avxCss";
  st.textContent=
  ".avx{position:relative;display:inline-block;width:var(--avs);height:var(--avs);flex:0 0 auto;vertical-align:middle;line-height:0}"+
  ".avx>img,.avx>svg,.avx>.avx-in{width:100%;height:100%;border-radius:50%;display:block;overflow:hidden;box-shadow:0 0 0 1.5px color-mix(in srgb,var(--line,#e1e8f4) 80%,transparent)}"+
  ".avx.avx-r>img,.avx.avx-r>svg,.avx.avx-r>.avx-in{border-radius:28%}"+
  ".avx-in{display:grid!important;place-items:center;color:#fff;font-weight:800;font-size:calc(var(--avs)*.38);line-height:1;background:#7c3aed;font-family:inherit}"+
  ".avx-st{position:absolute;right:3%;bottom:3%;width:clamp(8px,calc(var(--avs)*.2),18px);height:clamp(8px,calc(var(--avs)*.2),18px);border-radius:50%;border:2px solid var(--panel,#fff);background:#94a3b8}"+
  ".avx-st.avx-online{background:#22c55e}.avx-st.avx-away{background:#f59e0b}"+
  ".avx-bd{position:absolute;right:-4%;top:-4%;min-width:clamp(14px,calc(var(--avs)*.3),26px);padding:0 4px;height:clamp(14px,calc(var(--avs)*.3),26px);border-radius:999px;"+
    "background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font:800 clamp(9px,calc(var(--avs)*.18),14px)/clamp(14px,calc(var(--avs)*.3),26px) system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px var(--panel,#fff)}"+
  ".ax-anim .ax-blink{animation:axBlink 5.6s infinite;transform-box:fill-box;transform-origin:50% 55%}"+
  ".ax-anim .ax-look{animation:axLook 10s ease-in-out infinite}"+
  ".ax-anim .ax-head{animation:axHead 8s ease-in-out infinite;transform-box:view-box;transform-origin:100px 150px;transition:transform .35s}"+
  ".ax-anim .ax-body{animation:axBreath 4.4s ease-in-out infinite;transform-box:view-box;transform-origin:100px 200px}"+
  ".ax-anim .ax-tw{animation:axTw 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.ax-anim .ax-tw.t2{animation-delay:1.3s}"+
  ".ax-anim .ax-brow{transition:transform .3s}"+
  ".avx:hover .ax-anim .ax-brow{transform:translateY(-3px)}"+
  ".avx:hover .ax-anim .ax-mouth{transform:scale(1.08);transform-box:fill-box;transform-origin:center}"+
  ".ax-anim .ax-mouth{transition:transform .3s}"+
  ".avx:hover>.ax-anim{transform:scale(1.04) rotate(-2deg);transition:transform .3s}.avx>.ax-anim{transition:transform .3s}"+
  "@keyframes axBlink{0%,94%,100%{transform:scaleY(1)}96.5%{transform:scaleY(.06)}}"+
  "@keyframes axLook{0%,20%,100%{transform:translate(0,0)}26%,42%{transform:translate(1.8px,0)}50%,64%{transform:translate(-1.8px,.4px)}72%,84%{transform:translate(0,-.8px)}}"+
  "@keyframes axHead{0%,100%{transform:rotate(0)}30%{transform:rotate(1.8deg)}60%{transform:rotate(-1.4deg) translateY(.6px)}}"+
  "@keyframes axBreath{0%,100%{transform:translateY(0)}50%{transform:translateY(1.4px)}}"+
  "@keyframes axTw{0%,100%{transform:scale(.4);opacity:.25}50%{transform:scale(1.1);opacity:1}}"+
  "@media(prefers-reduced-motion:reduce){.ax-anim *,.avx>.ax-anim{animation:none!important;transition:none!important}}"+
  /* muharrir */
  ".avx-ed{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:16px;background:rgba(8,15,29,.6);backdrop-filter:blur(4px);overflow:auto}"+
  ".avx-box{width:min(960px,100%);background:var(--panel,#fff);color:var(--ink,#0d1b2a);border:1px solid var(--line,#e1e8f4);border-radius:22px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.5)}"+
  ".avx-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;color:#fff;background:linear-gradient(135deg,#7c3aed,#2563eb 60%,#06b6d4)}"+
  ".avx-hd b{font-size:17px}.avx-x{width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.22);color:#fff;cursor:pointer;font:inherit}"+
  ".avx-grid{display:grid;grid-template-columns:280px 1fr;min-height:440px}"+
  ".avx-pv{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 14px;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,#7c3aed 14%,transparent),transparent 70%)}"+
  ".avx-pv .avx>svg{box-shadow:0 18px 40px -16px rgba(30,20,80,.55),0 0 0 6px var(--panel,#fff),0 0 0 8px color-mix(in srgb,#7c3aed 35%,transparent)}"+
  ".avx-nm{font-weight:900;font-size:16px;text-align:center}"+
  ".avx-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}"+
  ".avx-btn{border:1.5px solid var(--line,#e1e8f4);background:var(--panel2,#f7f9fe);color:var(--ink,#0d1b2a);border-radius:12px;padding:8px 13px;font:700 13px/1.2 inherit;cursor:pointer}"+
  ".avx-btn:hover,.avx-btn:focus-visible{border-color:#7c3aed;outline:none}"+
  ".avx-btn.pri{background:linear-gradient(135deg,#12a150,#0d9488);color:#fff;border-color:transparent}"+
  ".avx-side{display:flex;flex-direction:column;border-left:1px solid var(--line,#e1e8f4);min-width:0}"+
  ".avx-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:12px;border-bottom:1px solid var(--line,#e1e8f4)}"+
  ".avx-tab{display:flex;align-items:center;gap:5px;border:1.5px solid var(--line,#e1e8f4);background:var(--panel2,#f7f9fe);color:var(--ink,#0d1b2a);border-radius:999px;padding:5px 11px;font:800 12.5px/1.2 inherit;cursor:pointer}"+
  ".avx-tab[aria-selected=true]{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border-color:transparent}"+
  ".avx-tab:focus-visible,.avx-op:focus-visible,.avx-sw:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}"+
  ".avx-ops{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px;padding:14px;overflow:auto;max-height:380px;align-content:start}"+
  ".avx-ops.sw{grid-template-columns:repeat(auto-fill,minmax(52px,1fr))}"+
  ".avx-op{display:flex;flex-direction:column;align-items:center;gap:5px;border:2px solid var(--line,#e1e8f4);background:var(--panel2,#f7f9fe);border-radius:16px;padding:6px;cursor:pointer;color:var(--ink,#0d1b2a);font:inherit;transition:transform .15s,border-color .15s}"+
  ".avx-op:hover{transform:translateY(-2px);border-color:#7c3aed}.avx-op[aria-checked=true]{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.25)}"+
  ".avx-op img{width:78px;height:78px;border-radius:12px;display:block}.avx-op i{font-style:normal;font-size:11px;font-weight:700;color:var(--muted,#5b6b82);text-align:center}"+
  ".avx-sw{aspect-ratio:1;border-radius:50%;border:3px solid var(--panel,#fff);box-shadow:0 0 0 1.5px var(--line,#e1e8f4);cursor:pointer}"+
  ".avx-sw[aria-checked=true]{box-shadow:0 0 0 3px #7c3aed;transform:scale(1.06)}"+
  ".avx-ft{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 16px;border-top:1px solid var(--line,#e1e8f4)}"+
  ".avx-hint{font-size:12px;color:var(--muted,#5b6b82)}"+
  "@media(max-width:720px){.avx-grid{grid-template-columns:1fr}.avx-pv{padding:14px 10px 10px}.avx-side{border-left:0;border-top:1px solid var(--line,#e1e8f4)}"+
    ".avx-tabs{flex-wrap:nowrap;overflow-x:auto}.avx-tab{flex:0 0 auto}.avx-ops{grid-template-columns:repeat(auto-fill,minmax(78px,1fr));max-height:none}.avx-op img{width:66px;height:66px}}";
  document.head.appendChild(st);
}
/* ---------- muharrir ----------
   opts: {value, seed, name, t:function(uz,en), onSave(code), onCancel()} */
var ZOOM={fs:"40 30 120 120",h:"14 8 172 172",ey:"64 72 72 44",br:"64 64 72 44",no:"74 82 52 40",mo:"74 98 52 40",fh:"40 60 120 110",
          gl:"54 66 92 56",hw:"10 4 180 180",er:"40 70 120 70",cl:"10 110 180 96",bp:"0 0 200 200"};
function editor(opts){
  css(); opts=opts||{};
  var T=opts.t||function(u){ return u; };
  var hint=opts.hint!=null?opts.hint:hintOf(opts.name);
  var cur=resolve(opts.value,opts.seed,hint), tab="h", prevFocus=document.activeElement;
  var old=document.getElementById("avxEd"); if(old) old.remove();
  var d=document.createElement("div"); d.className="avx-ed"; d.id="avxEd";
  d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-label",T("Avatar muharriri","Avatar editor"));
  d.innerHTML='<div class="avx-box"><div class="avx-hd"><b>🎨 '+T("Avataringizni yarating","Create your avatar")+'</b><button type="button" class="avx-x" data-a="x" aria-label="'+T("Yopish","Close")+'">✕</button></div>'+
    '<div class="avx-grid"><div class="avx-pv"><div id="avxBig"></div><div class="avx-nm">'+esc(opts.name||"")+'</div>'+
      '<div class="avx-row"><button type="button" class="avx-btn" data-a="rnd">🎲 '+T("Tasodifiy","Random")+'</button><button type="button" class="avx-btn" data-a="rl">🎲 '+T("Shu qatlam","This layer")+'</button></div>'+
      '<div class="avx-row"><button type="button" class="avx-btn" data-a="png">⬇ PNG</button><button type="button" class="avx-btn" data-a="webp">⬇ WebP</button></div></div>'+
    '<div class="avx-side"><div class="avx-tabs" role="tablist" id="avxTabs" aria-label="'+T("Qatlamlar","Layers")+'"></div>'+
      '<div class="avx-ops" role="radiogroup" id="avxOps"></div></div></div>'+
    '<div class="avx-ft"><span class="avx-hint">'+T("Klaviatura: ← → qatlam/variant, Enter — tanlash, Esc — bekor qilish","Keys: ← → layer/option, Enter — select, Esc — cancel")+'</span>'+
      '<span class="avx-row"><button type="button" class="avx-btn" data-a="cancel">'+T("Bekor qilish","Cancel")+'</button><button type="button" class="avx-btn pri" data-a="save">💾 '+T("Saqlash","Save")+'</button></span></div></div>';
  document.body.appendChild(d);
  function lay(){ for(var i=0;i<L.length;i++) if(L[i].k===tab) return L[i]; }
  function big(){ document.getElementById("avxBig").innerHTML=html(cur,{size:window.innerWidth<720?150:230,animated:true,name:opts.name}); }
  function tabs(){
    document.getElementById("avxTabs").innerHTML=L.map(function(l){
      return '<button type="button" class="avx-tab" role="tab" data-k="'+l.k+'" aria-selected="'+(l.k===tab)+'" tabindex="'+(l.k===tab?0:-1)+'"><span aria-hidden="true">'+l.i+'</span>'+T(l.uz,l.en)+'</button>'; }).join("");
  }
  function cols(k){ return k==="sk"?SKIN:k==="hc"?HAIR:k==="ec"?EYE:k==="cc"?CLOTH:null; }
  function ops(){
    var l=lay(), box=document.getElementById("avxOps"), h="", cs=cols(l.k);
    box.className="avx-ops"+(l.col?" sw":""); box.setAttribute("aria-label",T(l.uz,l.en));
    for(var i=0;i<l.n;i++){
      var on=cur[l.k]===i, nm=NAMES[l.k]?NAMES[l.k][i]:(i+1)+"", ti=' role="radio" aria-checked="'+on+'" tabindex="'+(on?0:-1)+'" data-v="'+i+'" aria-label="'+esc(T(l.uz,l.en)+": "+nm)+'"';
      if(cs) h+='<button type="button" class="avx-sw"'+ti+' style="background:'+cs[i]+'"></button>';
      else if(l.k==="bg") h+='<button type="button" class="avx-sw"'+ti+' style="background:linear-gradient(135deg,'+BGP[i][0]+','+BGP[i][1]+')"></button>';
      else { var a={}; for(var k in cur) a[k]=cur[k]; a[l.k]=i; if(l.k==="h"||l.k==="fh") a.hw=0;
        var fa=fix(a);
        h+='<button type="button" class="avx-op"'+ti+'><img alt="" src="'+dataUri(fa,1,ZOOM[l.k])+'"><i>'+esc(nm)+'</i></button>'; }
    }
    box.innerHTML=h;
  }
  function set(k,v){ var a={}; for(var x in cur) a[x]=cur[x]; a[k]=v; cur=fix(a); big(); ops(); }
  function focusSel(){ var b=d.querySelector('#avxOps [aria-checked="true"]'); if(b) b.focus(); }
  big(); tabs(); ops();
  setTimeout(function(){ var t=d.querySelector('.avx-tab[aria-selected="true"]'); if(t) t.focus(); },30);
  function close(saved){
    d.remove(); try{ if(prevFocus&&prevFocus.focus) prevFocus.focus(); }catch(e){}
    if(saved){ if(opts.onSave) opts.onSave(enc(cur)); } else if(opts.onCancel) opts.onCancel();
  }
  function dl(type){
    exportImg(cur,512,type).then(function(b){
      var a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="avatar."+(type==="image/webp"?"webp":"png");
      document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },500);
    }).catch(function(){});
  }
  d.addEventListener("click",function(e){
    if(e.target===d){ close(false); return; }
    var b=e.target.closest("button"); if(!b) return;
    if(b.dataset.k){ tab=b.dataset.k; tabs(); ops(); b=d.querySelector('.avx-tab[data-k="'+tab+'"]'); if(b) b.focus(); return; }
    if(b.dataset.v!==undefined){ set(tab,+b.dataset.v); focusSel(); return; }
    var a=b.dataset.a;
    if(a==="rnd"){ cur=gen(Math.random()+"|"+Date.now(),hint); big(); ops(); }
    else if(a==="rl"){ set(tab,Math.floor(Math.random()*lay().n)); }
    else if(a==="png") dl("image/png"); else if(a==="webp") dl("image/webp");
    else if(a==="save") close(true); else if(a==="cancel"||a==="x") close(false);
  });
  d.addEventListener("keydown",function(e){
    if(e.key==="Escape"){ e.preventDefault(); close(false); return; }
    var t=e.target;
    if(t.classList.contains("avx-tab")&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){
      e.preventDefault(); var i=0; for(;i<L.length;i++) if(L[i].k===tab) break;
      i=(i+(e.key==="ArrowRight"?1:-1)+L.length)%L.length; tab=L[i].k; tabs(); ops(); d.querySelector('.avx-tab[data-k="'+tab+'"]').focus(); return; }
    if(t.dataset&&t.dataset.v!==undefined&&/^Arrow/.test(e.key)){
      e.preventDefault(); var n=lay().n, v=+t.dataset.v, step=(e.key==="ArrowRight"||e.key==="ArrowDown")?1:-1;
      set(tab,(v+step+n)%n); focusSel(); return; }
    if(e.key==="Tab"){   /* fokus oynadan chiqmasin */
      var f=[].slice.call(d.querySelectorAll('button:not([tabindex="-1"])')); if(!f.length) return;
      var first=f[0], last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  });
}
var AVX={ver:VER,hint:hintOf,layers:L,names:NAMES,gen:gen,fix:fix,ok:ok,enc:enc,dec:dec,resolve:resolve,svg:svg,dataUri:dataUri,html:html,
  editor:editor,exportImg:exportImg,initials:initials,css:css,palettes:{skin:SKIN,hair:HAIR,eye:EYE,cloth:CLOTH,bg:BGP},_h32:h32};
root.AVX=AVX;
if(typeof module!=="undefined"&&module.exports) module.exports=AVX;
})(typeof window!=="undefined"?window:globalThis);
