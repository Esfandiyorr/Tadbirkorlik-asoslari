/* Krossvord generatori testlari:  node _reyting-manba/krossvord_test.js */
var KV=require("./krossvord.js"), fails=0, n=0;
function ck(name,c,x){ n++; if(!c){ fails++; console.log("FAIL "+name+(x!==undefined?"  "+x:"")); } else console.log("OK   "+name+(x!==undefined?"  "+x:"")); }
var T=function(a,b){ return JSON.stringify(a)===JSON.stringify(b); };
/* 1. javobni kataklarga ajratish */
ck("O' va G' bitta katak: TO'G'RI",T(KV.tok("To'g'ri"),["T","O'","G'","R","I"]));
ck("turli apostrof belgilari (ʻ ’ `)",T(KV.tok("Toʻgʻri"),["T","O'","G'","R","I"])&&T(KV.tok("To’g`ri"),["T","O'","G'","R","I"]));
ck("SH va CH bitta katak",T(KV.tok("Maktab-chi shahar"),["M","A","K","T","A","B","CH","I","SH","A","H","A","R"]));
ck("digraf o'chirilsa — alohida harflar",KV.tok("shox",false).length===4&&KV.tok("shox",true).length===3);
ck("kirill harflar",T(KV.tok("Бозор"),["Б","О","З","О","Р"]));
ck("bo'sh joy va tinish belgilari tashlanadi",T(KV.tok("Bozor iqtisodiyoti!"),KV.tok("BozorIqtisodiyoti")));
ck("uzunlik ko'rsatkichi: 2 so'zli javob",KV.lens("Bozor iqtisodiyoti")==="(5,12)"&&KV.lens("Foyda")==="(5)");
/* 2. namuna: hamma so'z joylanadi, setka to'g'ri */
var S=KV.sample(), P=KV.build(S,{seed:1,ms:1e9,attempts:300});
var v=KV.verify(P);
ck("namuna: setka to'g'ri (ortiqcha qator yo'q, bog'langan)",v.ok,v.errors.join("; "));
ck("namuna: 14 so'zdan kamida 12 tasi joylandi",P.stats.placed>=12,P.stats.placed+" / "+P.stats.words+", "+P.rows+"×"+P.cols+", kesishma "+P.stats.cross);
ck("kesishmalar: har so'z kamida bitta boshqasi bilan kesishadi",P.stats.cross>=P.stats.placed-1);
ck("o'lcham A4 ga sig'adigan (≤ 22×22)",P.rows<=22&&P.cols<=22,P.rows+"×"+P.cols);
/* 3. raqamlash */
var nums={}; P.words.forEach(function(w){ nums[w.n]=1; });
var maxN=0; P.num.forEach(function(r){ r.forEach(function(x){ if(x>maxN) maxN=x; }); });
ck("raqamlar 1 dan boshlanib ketma-ket",Object.keys(nums).length===maxN&&nums[1]===1,maxN);
var first=null; outer: for(var r=0;r<P.rows;r++) for(var c=0;c<P.cols;c++) if(P.num[r][c]){ first=P.num[r][c]; break outer; }
ck("birinchi raqam yuqori-chap katakda (o'qish tartibi)",first===1);
/* 4. aniq (deterministik) natija */
var A=JSON.stringify(KV.build(S,{seed:5,ms:1e9,attempts:120})), B=JSON.stringify(KV.build(S,{seed:5,ms:1e9,attempts:120}));
ck("bir xil kirish va seed — bir xil krossvord",A===B);
var C=JSON.stringify(KV.build(S,{seed:6,ms:1e9,attempts:120}));
ck("boshqa seed — boshqa variant",A!==C);
/* 5. chekka holatlar */
var E1=KV.build([],{});  ck("bo'sh kirish xatosiz",E1.words.length===0&&E1.rows===0);
var E2=KV.build([{q:"a",a:"Foyda"}],{}); ck("bitta so'z: joylanmaydi, sabab 'alone'",E2.words.length===0&&E2.unplaced[0]&&E2.unplaced[0].why==="alone");
var E3=KV.build([{q:"1",a:"AB"},{q:"2",a:"CD"}],{ms:1e9,attempts:20}); ck("umumiy harfi yo'q so'zlar: 'nofit' deb qaytariladi, buzilmaydi",E3.unplaced.length>=1&&KV.verify(E3).ok);
var E4=KV.build([{q:"q",a:"Foyda"},{q:"q2",a:"foyda "},{q:"q3",a:"X"},{q:"q4",a:"Daromad"},{q:"q5",a:""}],{ms:1e9,attempts:50});
ck("takror va bir harfli javoblar o'tkazib yuboriladi, bo'sh qator e'tiborsiz",E4.skipped.some(function(s){ return s.why==="dup"; })&&E4.skipped.some(function(s){ return s.why==="short"; })&&E4.stats.words===2);
ck("juda uzun javob rad etiladi",KV.build([{q:"a",a:"A".repeat(40)},{q:"b",a:"AAB"}],{ms:1e9,attempts:5}).skipped[0].why==="long");
ck("so'zlar soni cheklovi",KV.build(Array.from({length:60},function(_,i){ return {q:"q",a:"so'z"+String.fromCharCode(97+i%26)+String.fromCharCode(97+(i/26|0))+"a"}; }),{ms:1e9,attempts:3}).skipped.some(function(s){ return s.why==="many"; }));
/* 6. matn import */
var L=KV.parseLines("Eng katta bozor | Dunyo\nDaromad nima?\t pul \nBank qarzi = Kredit\nBiznes - foyda uchun - Tadbirkor\n\nyolg'iz qator");
ck("import: | , tab, = va - belgilari",L[0].a==="Dunyo"&&L[1].a==="pul"&&L[2].a==="Kredit"&&L[3].a==="Tadbirkor"&&L[3].q==="Biznes - foyda uchun"&&L.length===5&&L[4].a==="");
/* 7. ko'p tasodifiy sinov: har doim to'g'ri setka */
var words="tadbirkor foyda daromad mijoz bozor kredit soliq mahsulot xarajat risk startap biznes raqobat narx investor garov kafil annuitet grant subsidiya pul oqimi talab taklif savdo tovar xizmat bank foiz sarmoya".split(" ");
var bad=0, partial=0, tot=0;
for(var t=0;t<80;t++){
  var k=3+(t%22), pick=[], rr=t*7919+13;
  while(pick.length<k){ rr=(Math.imul(rr,1103515245)+12345)>>>0; var w=words[(rr>>>8)%words.length]; if(pick.indexOf(w)<0) pick.push(w); }
  var p=KV.build(pick.map(function(x){ return {q:"savol "+x,a:x}; }),{seed:t,ms:1e9,attempts:60}), vv=KV.verify(p);
  if(!vv.ok) { bad++; console.log("   xato:",pick.join(","),vv.errors.slice(0,2)); }
  if(p.unplaced.length) partial++; tot++;
}
ck("80 ta tasodifiy to'plam: setka doim to'g'ri",bad===0,bad+" xato");
console.log("   (joylanmagan so'z bo'lgan to'plamlar: "+partial+" / "+tot+")");
/* 8. tezlik */
var t0=Date.now(); KV.build(S,{seed:3}); var dt=Date.now()-t0;
ck("jonli yozishda tez ishlaydi (standart sozlama < 600 ms)",dt<600,dt+" ms");
console.log("FAILS: "+fails+" / "+n);
process.exit(fails?1:0);
