/* 🎮 Arena: onlayn talabalar va taklif (qabul qilinsa — o'yin darhol boshlanadi), «kutilayotgan o'yinlar» (nechta kirgan, nechta joy),
   yangi o'yinlar — To'rttalik, Puzzle duel (ikki xil rasm, birinchi yig'gan yutadi), Jamoaviy puzzle (hamma bitta rasmni yig'adi) */
const H=require('../lib/h.js'); const {sleep,ck}=H;
const ARENA=H.SITE+"/arena.html";
async function home(p){ await p.goto(ARENA+"#/"); for(let t=0;t<40;t++){ await sleep(400); if(await p.$("#onl")) break; } await sleep(800); }
async function until(p,fn,arg,ms){ const t0=Date.now(); while(Date.now()-t0<(ms||20000)){ if(await p.evaluate(fn,arg).catch(()=>false)) return true; await sleep(300); } return false; }
const ph=(code)=>((H.dbGet("arena/rooms/"+code+"/state")||{}).ph);
const perm=p=>p.evaluate(()=>[...document.querySelectorAll("#pzB .pzt")].map(t=>+t.getAttribute("data-p")));
async function solveStep(p){
  const pm=await perm(p); const i=pm.findIndex((x,k)=>x!==k); if(i<0) return false; const j=pm.indexOf(i);
  await p.click('#pzB .pzt[data-pos="'+i+'"]'); await p.click('#pzB .pzt[data-pos="'+j+'"]'); return true;
}
(async()=>{
  const b=await H.chromium.launch();
  [["sA","Ali","Valiyev","AP-223"],["sB","Bobur","Karimov","AP-223"],["sC","Charos","Usmonova","FIZ-21"],["sD","Dilnoza","Rahimova","FIZ-21"],["sE","Eldor","Tursunov","AP-223"]]
    .forEach(([id,n,s,g])=>H.addStu(id,n,s,g));
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{}), B=await H.mk(b,H.stu("sB","Bobur","Karimov","AP-223"),{});
  await home(A); await home(B);
  /* 1) onlaynlar */
  ck("A ning ro'yxatida B onlayn (🟢 bo'sh) va «⚔️ Taklif» tugmasi",await until(A,()=>!!document.querySelector('#onl [data-inv="sB"]')&&/Bobur Karimov/.test(document.getElementById("onl").innerText)&&/bo'sh/.test(document.getElementById("onl").innerText),null,15000));
  ck("o'zi ro'yxatda ko'rinmaydi",await A.evaluate(()=>!document.querySelector('#onl [data-inv="sA"]')));
  ck("arena/on da server vaqti bilan yozuv",typeof (H.dbGet("arena/on/sA")||{}).at==="number"&&(H.dbGet("arena/on/sA")||{}).n==="Ali");
  await A.screenshot({path:"arena_home.png",fullPage:true});
  /* 2) taklif → qabul → o'yin darhol boshlanadi (To'rttalik) */
  await A.click('#onl [data-inv="sB"]'); await sleep(300);
  ck("taklif tugmasi o'yin tanlovini ochadi (Shashka, Shaxmat, To'rttalik, Puzzle duel)",await A.evaluate(()=>[...document.querySelectorAll("#gpick [data-g]")].map(x=>x.dataset.g).filter(Boolean).join(",")==="dama,chess,c4,pzl"));
  await A.click('#gpick [data-g="c4"]'); await sleep(1500);
  const inv=H.dbGet("arena/inv/sB/sA")||{}, code=inv.code;
  ck("taklif yozildi (arena/inv/sB/sA): o'yin c4, xona kodi",inv.g==="c4"&&/^[A-Z0-9]{4}$/.test(code||""),JSON.stringify(inv));
  ck("A da «javob kutilmoqda» ekrani",await until(A,()=>/javob kutilmoqda/.test(document.getElementById("app").innerText),null,6000));
  ck("B da taklif oynasi: kim, qaysi o'yin, Qabul / Rad",await until(B,()=>{ const m=document.querySelector(".inv-ov"); return !!m&&/Ali Valiyev/.test(m.innerText)&&/To'rttalik/.test(m.innerText); },null,8000));
  await B.screenshot({path:"arena_invite.png"});
  await B.click('.inv-ov [data-a="1"]');
  ck("qabul qilindi → ikkalasida o'yin boshlandi (bir necha soniyada)",await until(A,c=>!!document.querySelector("#c4b"),null,15000)&&await until(B,()=>!!document.querySelector("#c4b"),null,15000)&&ph(code)==="play",ph(code));
  ck("taklif yozuvi o'chirildi",!H.dbGet("arena/inv/sB/sA"));
  await sleep(4800);                                     /* 3-2-1 sanog'i */
  const drop=async(p,x)=>{ await until(p,()=>document.getElementById("c4b").classList.contains("my"),null,8000); await p.click('#c4b .c4c[data-x="'+x+'"]'); await sleep(200); };
  for(let k=0;k<3;k++){ await drop(A,0); await drop(B,1); }
  await drop(A,0);
  ck("To'rttalik: A 4 tasini terdi → «Siz yutdingiz», B da «Raqib to'rttalik yig'di»",await until(A,()=>/yutdingiz/.test(document.getElementById("c4s").innerText),null,6000)&&await until(B,()=>/to'rttalik yig'di/.test(document.getElementById("c4s").innerText),null,6000));
  ck("ikkala taxta bir xil",await A.evaluate(()=>[...document.querySelectorAll(".c4d")].map(d=>d.className).join())===await B.evaluate(()=>[...document.querySelectorAll(".c4d")].map(d=>d.className).join()));
  ck("o'yin oxirida g'olib A, «Revansh» tugmasi",await until(A,()=>/Ali Valiyev/.test((document.querySelector(".win")||{}).innerText||"")&&/Revansh/.test(document.getElementById("eg").innerText),null,20000));
  /* 3) rad etish */
  await home(A); await home(B);
  await until(A,()=>!!document.querySelector('#onl [data-inv="sB"]:not([disabled])'),null,15000);
  await A.click('#onl [data-inv="sB"]'); await A.click('#gpick [data-g="dama"]');
  await until(B,()=>!!document.querySelector(".inv-ov"),null,8000); await B.click('.inv-ov [data-a="0"]');
  ck("B rad etsa — A da «taklifni rad etdi»",await until(A,()=>/rad etdi/.test(document.getElementById("app").innerText),null,8000));
  /* 4) kutilayotgan o'yinlar: C ochadi (3 kishilik jamoaviy puzzle), D va E qo'shiladi → to'lganda o'zi boshlanadi */
  const C=await H.mk(b,H.stu("sC","Charos","Usmonova","FIZ-21"),{}), D=await H.mk(b,H.stu("sD","Dilnoza","Rahimova","FIZ-21"),{}), E=await H.mk(b,H.stu("sE","Eldor","Tursunov","AP-223"),{});
  await home(C); await C.selectOption("#qgame","pzt"); await C.selectOption("#qmax","3"); await C.click("#qgo"); await sleep(1500);
  const pub=H.dbGet("arena/public")||{}, qk=Object.keys(pub).find(k=>pub[k].q&&(pub[k].gl||[])[0]==="pzt");
  ck("C ochgan o'yin ochiq ro'yxatda: 1/3",!!qk&&pub[qk].n===1&&pub[qk].max===3,JSON.stringify(pub));
  await home(D);
  ck("D da «Kutilayotgan o'yinlar»: Jamoaviy puzzle · 1/3 · yana 2 joy",await until(D,()=>{ const t=document.getElementById("waitL").innerText; return /Jamoaviy puzzle/.test(t)&&/1\/3/.test(t)&&/yana 2 joy/.test(t); },null,8000),await D.evaluate(()=>document.getElementById("waitL").innerText));
  await D.screenshot({path:"arena_wait.png",fullPage:true});
  await D.click('#waitL [data-j="'+qk+'"]');
  ck("D qo'shildi → C ning lobbisida 2/3 va «yana 1 joy»",await until(C,()=>/\(2\/3\)/.test(document.getElementById("app").innerText)&&/1 joy bor/.test(document.getElementById("app").innerText),null,10000));
  await home(E);
  await until(E,k=>!!document.querySelector('#waitL [data-j="'+k+'"]'),qk,10000);
  ck("E da ham ko'rinadi: 2/3",await E.evaluate(()=>/2\/3/.test(document.getElementById("waitL").innerText)));
  await E.click('#waitL [data-j="'+qk+'"]');
  ck("3-o'yinchi kirdi → joylar to'ldi → o'yin o'zi boshlandi, ro'yxatdan chiqdi",await until(C,()=>!!document.getElementById("pzB"),null,15000)&&ph(qk)==="play"&&!(H.dbGet("arena/public/"+qk)));
  await until(D,()=>!!document.getElementById("pzB"),null,10000); await until(E,()=>!!document.getElementById("pzB"),null,10000);
  await sleep(4800);
  ck("jamoa: 3 kishi → 5×5 (25 bo'lak), vaqt 8 daqiqa",(await perm(C)).length===25&&await C.evaluate(()=>{ const t=document.getElementById("tmr").textContent; return /^[78]:/.test(t); }),await C.evaluate(()=>document.getElementById("tmr").textContent));
  ck("hammada bir xil rasm va bir xil tartib",JSON.stringify(await perm(C))===JSON.stringify(await perm(D))&&JSON.stringify(await perm(D))===JSON.stringify(await perm(E)));
  await C.screenshot({path:"arena_pzt.png"});
  /* uch kishi navbatma-navbat yig'adi */
  for(let k=0;k<12;k++){ const P=[C,D,E][k%3]; if(!(await solveStep(P))) break; await sleep(900); }   /* uchalasi navbatma-navbat (yarmigacha) */
  await sleep(1500);
  const pc=await perm(C), pd=await perm(D), pe=await perm(E);
  ck("har kimning qadami boshqalarda ham ko'rinadi (tartib bir xil, ≥10 bo'lak joyida)",pc.length===25&&pc.filter((x,i)=>x===i).length>=10&&JSON.stringify(pc)===JSON.stringify(pd)&&JSON.stringify(pd)===JSON.stringify(pe),JSON.stringify([pc.filter((x,i)=>x===i).length,pd.filter((x,i)=>x===i).length,pe.filter((x,i)=>x===i).length]));
  for(let k=0;k<30;k++){ if(!(await solveStep(C))) break; await sleep(250); }
  ck("rasm yig'ildi → hammada «Jamoa rasmni yig'di!»",await until(D,()=>/Jamoa rasmni yig'di/.test(document.getElementById("app").innerText),null,15000)&&await until(E,()=>/Jamoa rasmni yig'di/.test(document.getElementById("app").innerText),null,15000));
  /* 5) Puzzle duel: ikki xil rasm, birinchi yig'gan yutadi */
  await home(A); await home(B);
  await until(A,()=>!!document.querySelector('#onl [data-inv="sB"]:not([disabled])'),null,15000);
  await A.click('#onl [data-inv="sB"]'); await A.click('#gpick [data-g="pzl"]');
  await until(B,()=>!!document.querySelector(".inv-ov"),null,8000); await B.click('.inv-ov [data-a="1"]');
  await until(A,()=>!!document.getElementById("pzB"),null,15000); await until(B,()=>!!document.getElementById("pzB"),null,15000); await sleep(4800);
  const ia=await A.evaluate(()=>getComputedStyle(document.querySelector(".pz-prev")).backgroundImage), ib=await B.evaluate(()=>getComputedStyle(document.querySelector(".pz-prev")).backgroundImage);
  ck("duel: 4×4, ikkalasida boshqa-boshqa rasm",(await perm(A)).length===16&&ia!==ib&&ia.length>100,JSON.stringify([(await perm(A)).length,ia.slice(0,80),ib.slice(0,80),ia===ib,ia.length]));
  await A.screenshot({path:"arena_pzl.png"});
  await solveStep(B); await solveStep(B);
  for(let k=0;k<20;k++){ if(!(await solveStep(A))) break; await sleep(120); }
  ck("A birinchi yig'di → A: «Siz birinchi yig'dingiz», B: «… birinchi yig'di» va taxta qotadi",await until(A,()=>/birinchi yig'dingiz/.test(document.getElementById("pzM").innerText),null,6000)&&await until(B,()=>/Ali.*birinchi yig'di/.test(document.getElementById("pzM").innerText),null,8000));
  ck("duel natijasi: g'olib A",await until(A,()=>/Ali Valiyev/.test((document.querySelector(".win")||{}).innerText||""),null,25000));
  /* 6) Sudoku (yakka): hammaga bir xil boshqotirma (urug'dan), to'g'ri to'ldirilsa — yechildi */
  const SD=await H.mk(b,H.stu("sD","Dilnoza","Rahimova","FIZ-21"),{}); await home(SD);
  await SD.click('[data-solo="sudoku"]'); await until(SD,()=>!!document.getElementById("sdB"),null,15000); await sleep(4800);
  const scode=await SD.evaluate(()=>location.hash.slice(7,11)), seed=(H.dbGet("arena/rooms/"+scode+"/state")||{}).seed;
  const sol=await SD.evaluate(sd=>{ const T=window.ARENA_TEST, S=T.sdkMake(T.rng(sd)); return {sol:S.sol,giv:Object.keys(S.giv).map(Number)}; },seed);
  const giv=await SD.evaluate(()=>[...document.querySelectorAll("#sdB .sdc")].map((c,i)=>c.classList.contains("g")?i+":"+c.textContent:null).filter(Boolean));
  ck("sudoku: 15 ta berilgan son urug'dan hisoblangan yechimga mos",giv.length===15&&giv.every(x=>{ const [i,v]=x.split(":").map(Number); return sol.sol[Math.floor(i/6)][i%6]===v; }),giv.join(" "));
  ck("sudoku: qator, ustun va 2×3 blok qoidasi bo'yicha to'g'ri yechim",await SD.evaluate(s=>{ const v=s.flat(); return Object.keys(window.ARENA_TEST.sdkBad(v)).length===0&&v.every(x=>x>=1&&x<=6); },sol.sol));
  await SD.click('#sdB .sdc:not(.g)'); await SD.click('#sdP [data-k="'+(sol.sol[0][0]===1?2:1)+'"]');
  for(let i=0;i<36;i++){ if(sol.giv.includes(i)) continue; await SD.click('#sdB .sdc[data-i="'+i+'"]'); await SD.click('#sdP [data-k="'+sol.sol[Math.floor(i/6)][i%6]+'"]'); }
  ck("sudoku to'liq va to'g'ri to'ldirildi → «Sudoku yechildi!»",await until(SD,()=>/Sudoku yechildi/.test(document.getElementById("sdS").innerText),null,6000));
  ck("noto'g'ri son qizil bilan belgilanadi (qoida buzilsa)",await SD.evaluate(()=>{ const T=window.ARENA_TEST, v=[1,1,0,0,0,0].concat(new Array(30).fill(0)); return !!T.sdkBad(v)[0]&&!!T.sdkBad(v)[1]; }));
  /* 7) telefon */
  const M=await H.mk(b,H.stu("sE","Eldor","Tursunov","AP-223"),{vp:{width:390,height:844},mobile:true}); await home(M);
  ck("telefonda bosh sahifa sig'adi",await M.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await M.screenshot({path:"arena_home_m.png",fullPage:true});
  const errs=[A,B,C,D,E,M].map(p=>p._errs.filter(e=>!/ERR_TUNNEL|Failed to load/.test(e))).flat();
  ck("JS xatolari yo'q",errs.length===0,JSON.stringify(errs).slice(0,300));
  console.log("FAILS:",H.fails()); await b.close();
})().catch(e=>{ console.log("ERR",e.message); console.log("FAILS: 1"); process.exit(1); });
