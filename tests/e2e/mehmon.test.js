/* 👀 Mehmon rejimi: hisobsiz kirgan har kim taqdimotni o'qiy oladi (ro'yxatdan o'tish devori yo'q); test, krossvord va masala
   boshlanganda kirish/ro'yxatdan o'tish oynasi; kirgach joyida davom etadi; bazaga hech narsa yozilmaydi;
   yopiq mavzu mehmonga ochilmaydi; o'qituvchi hisobsiz ham hamma narsani ko'radi */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1200); }
const slideWith=(p,sel)=>p.evaluate(sel=>{ const s=[...document.querySelectorAll(".slide")]; return s.findIndex(x=>x.querySelector(sel))+1; },sel);
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  H.addStu("sX","Xolid","Karimov","AP-223");
  const before=JSON.stringify(H.dbGet("students"));
  /* 1) fan sahifasi */
  const G=await H.mk(b,null,{});
  await G.goto(H.SITE+"/tadbirkorlik-asoslari.html"); await ready(G);
  ck("fan sahifasi: majburiy ro'yxatdan o'tish oynasi yo'q",!(await G.$("#rtGate"))&&!(await G.$("#rtWait")));
  const hs=await G.evaluate(()=>({chip:document.getElementById("rtChip").innerText.replace(/\s+/g," "),cls:document.getElementById("rtChip").className,guest:!!document.querySelector(".hm-guest"),
    cards:[...document.querySelectorAll(".hm-card")].map(c=>c.dataset.t+":"+(c.classList.contains("score")?"s":c.classList.contains("read")?"r":"l")+":"+(c.tagName==="A"?"a":"-")).join(" ")}));
  ck("topbarda «🔑 Kirish» (🏆 emas), «Xush kelibsiz» bloki",/Kirish/.test(hs.chip)&&/rt-guestbtn/.test(hs.cls)&&hs.guest,JSON.stringify(hs));
  ck("topbarda «🎓 Ro'yxatdan o'tish» ham bor (Kirish bilan yonma-yon, chapdan birinchi)",await G.evaluate(()=>{ const t=[...document.querySelectorAll(".topbar .tools > *")].map(e=>e.id); return t[0]==="rtChip"&&t[1]==="rtReg"&&/Ro'yxatdan o'tish/.test(document.getElementById("rtReg").innerText); }));
  ck("1–5 mavzu 📖 bosiladigan, qolganlari 🔒",hs.cards==="m1:r:a m2:r:a m3:r:a m4:r:a m5:r:a m6:l:- m7:l:- m8:l:- m9:l:- m10:l:- m11:l:- m12:l:- m13:l:- m14:l:- m15:l:-",hs.cards);
  ck("chat va reyting mehmonga ko'rinmaydi",!(await G.$("#chTab"))&&!(await G.$("#hmTop")));
  await G.evaluate(()=>document.getElementById("hmReg").click()); await sleep(500);
  ck("«Ro'yxatdan o'tish» → oyna ro'yxatdan o'tish yorlig'ida, ✕ bor",await G.evaluate(()=>!!document.querySelector("#rtGate.rt-authg")&&document.querySelector(".rt-gt.on").dataset.m==="reg"&&!!document.getElementById("rtGateX")));
  await G.click("#rtGateX"); await sleep(300);
  ck("✕ bilan yopiladi, sahifa ochiq qoladi",!(await G.$("#rtGate"))&&await G.evaluate(()=>!!document.querySelector(".hm-grid")));
  await G.screenshot({path:"mehmon_home.png"});
  /* 2) mavzu-1: o'qish */
  await G.click('.hm-card[data-t="m1"]'); await G.waitForURL(/mavzu-1\.html/); await ready(G);
  ck("mavzu-1: ro'yxatdan o'tish oynasi yo'q, slaydlar ochiq, ⏳/📖 oynalari yo'q",!(await G.$("#rtGate"))&&!(await G.$("#rtRoG"))&&!(await G.$("#rtWait"))&&await G.evaluate(()=>document.body.classList.contains("rt-guest")&&!document.body.classList.contains("rt-ro")));
  const n0=await G.evaluate(()=>document.querySelectorAll(".slide").length);
  for(let i=0;i<5;i++){ await G.keyboard.press("ArrowRight"); await sleep(250); }
  ck("slaydlarni varaqlash ishlaydi (→ tugmasi)",await G.evaluate(()=>/^6\s*\//.test(document.getElementById("cur").parentNode.innerText.trim())||document.getElementById("cur").textContent.trim()==="6"),await G.evaluate(()=>document.getElementById("cur").textContent));
  const tIdx=await slideWith(G,"#testWrap"); await G.evaluate(i=>{ location.hash="#"+i; },tIdx); await sleep(900);
  const tv=await G.evaluate(()=>{ const go=document.getElementById("qtGo"), st=document.querySelector(".qt-start"); return {vis:!!go&&getComputedStyle(go).display!=="none",msg:st?getComputedStyle(st,"::after").content:""}; });
  ck("test slaydi: «Testni boshlash» ko'rinadi, ostida «hisobingizga kiring» izohi",tv.vis&&/hisobingizga kiring/.test(tv.msg),JSON.stringify(tv));
  await G.screenshot({path:"mehmon_test.png"});
  await G.click("#qtGo"); await sleep(600);
  const au=await G.evaluate(()=>({gate:!!document.querySelector("#rtGate.rt-authg"),why:(document.querySelector(".rt-gate-why")||{}).innerText||"",mode:(document.querySelector(".rt-gt.on")||{}).dataset.m,test:!!document.querySelector(".qt-live,#qtTime")}));
  ck("«Testni boshlash» → kirish oynasi (sabab yozilgan), test boshlanmadi",au.gate&&/Testni ishlash va ball olish uchun/.test(au.why)&&!au.test,JSON.stringify(au));
  await G.screenshot({path:"mehmon_auth.png"});
  /* 3) ro'yxatdan o'tish (oynadan) → kutish ekrani → tasdiq → joyida davom */
  await G.evaluate(()=>document.querySelector('.rt-gt[data-m="reg"]').click()); await sleep(300);
  await G.fill("#rtN","Zafar"); await G.fill("#rtS","Olimov"); await G.fill("#rtB","2468"); await G.selectOption("#rtG","AP-223"); await G.fill("#rtE","zafar@gmail.com");
  await G.click("#rtGo"); await sleep(2500);
  const ids=Object.keys(H.dbGet("students")||{}).filter(k=>k!=="sI"&&k!=="sX");
  const rec=H.dbGet("students/"+ids[0])||{};
  ck("ro'yxatdan o'tish: bazada yangi talaba (kutmoqda), kutish ekrani",ids.length===1&&rec.name==="Zafar"&&rec.status==="pending"&&!!(await G.$("#rtWait")),JSON.stringify(rec).slice(0,160));
  ck("sahifa qayta yuklanmadi (shu mavzu-1 da turibdi), mehmon rejimi o'chdi",/mavzu-1\.html/.test(G.url())&&await G.evaluate(()=>!document.body.classList.contains("rt-guest")));
  H.dbSet("students/"+ids[0]+"/status","ok"); await G.click("#rtChk"); await sleep(2500);
  const st=await G.evaluate(()=>({chip:document.getElementById("rtChip").innerText.replace(/\s+/g," "),student:RT.student()&&RT.student().name,ok:RT.ok(),wait:!!document.getElementById("rtWait")}));
  ck("tasdiqlangach: ism topbarda, o'qish rejimi (1-mavzu), test endi «kirish» so'ramaydi",/Zafar/.test(st.chip)&&st.ok&&!st.wait,JSON.stringify(st));
  ck("kirgach topbardagi «Ro'yxatdan o'tish» yo'qoladi, «Savol va takliflar» yana birinchi",await G.evaluate(()=>!document.getElementById("rtReg")&&document.querySelector(".topbar .tools > *").id==="rtAsk"&&!document.getElementById("rtChip").classList.contains("rt-guestbtn")),await G.evaluate(()=>[...document.querySelectorAll(".topbar .tools > *")].map(e=>e.id).join(",")));
  await G.evaluate(i=>{ location.hash="#"+i; },tIdx); await sleep(700);
  const af=await G.evaluate(()=>({btn:(()=>{ const g=document.getElementById("qtGo"); return !g||getComputedStyle(g).display==="none"; })(),ro:!!document.getElementById("rtRO"),guest:document.body.classList.contains("rt-guest")}));
  ck("hisobli talabada 1-mavzu o'qish rejimida: test tugmasi yashirin (mehmon izohi yo'q), kirish oynasi ochilmaydi",af.btn&&af.ro&&!af.guest&&!(await G.$("#rtGate")),JSON.stringify(af));
  /* 4) boshqa mehmon: krossvord (mavzu-4), masala (mavzu-5), yopiq mavzu */
  const M=await H.mk(b,null,{});
  await M.goto(H.SITE+"/mavzu-4.html"); await ready(M);
  const xi=await slideWith(M,"#xwGo"); await M.evaluate(i=>{ location.hash="#"+i; },xi); await sleep(900);
  await M.click("#xwGo"); await sleep(500);
  ck("krossvord «Boshlash» → kirish oynasi",await M.evaluate(()=>!!document.querySelector("#rtGate.rt-authg")&&/Testni ishlash/.test(document.querySelector(".rt-gate-why").innerText)));
  await M.goto(H.SITE+"/mavzu-5.html"); await ready(M);
  const mi=await slideWith(M,"#msGo"); await M.evaluate(i=>{ location.hash="#"+i; },mi); await sleep(900);
  await M.click("#msGo"); await sleep(500);
  ck("masalalar «Boshlash» → kirish oynasi",await M.evaluate(()=>!!document.querySelector("#rtGate.rt-authg")));
  await M.goto(H.SITE+"/mavzu-7.html"); await ready(M);
  const lk=await M.evaluate(()=>{ const a=document.getElementById("rtAcc"); return a?a.innerText.replace(/\s+/g," "):""; });
  ck("yopiq mavzu (7) mehmonga ochilmaydi: «hali ochilmagan», 🔑 Kirish tugmasi",/7-mavzu hali ochilmagan/.test(lk)&&!/guruhingiz/.test(lk)&&!!(await M.$("#rtAcc [data-auth]")),lk.slice(0,150));
  await M.screenshot({path:"mehmon_lock.png"});
  H.dbSet("meta/access/m7",{lim:false,at:Date.now()-60000});
  await M.goto(H.SITE+"/mavzu-7.html"); await ready(M);
  ck("o'qituvchi 7-mavzuni hammaga ochgach — mehmon o'qiy oladi",!(await M.$("#rtAcc"))&&!(await M.$("#rtGate")));
  /* 5) mehmon bazaga hech narsa yozmadi */
  const after=H.dbGet("students");
  ck("mehmonlar bazaga hech narsa yozmadi (faqat ro'yxatdan o'tgan Zafar qo'shildi, boshqa talabalarga tegilmadi)",Object.keys(after).sort().join()===["sI","sX",ids[0]].sort().join()&&JSON.stringify(after.sX)===JSON.stringify(JSON.parse(before).sX)&&JSON.stringify(after.sI)===JSON.stringify(JSON.parse(before).sI),Object.keys(after).join());
  ck("mehmon sahifalarida JS xatolari yo'q",[G,M].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([G,M].map(p=>p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)))).slice(0,300));
  /* 6) mavjud hisobga kirish (yangi brauzer) */
  const L=await H.mk(b,null,{});
  await L.goto(H.SITE+"/mavzu-2.html"); await ready(L);
  await L.click("#rtChip"); await sleep(500);
  ck("«🔑 Kirish» → kirish oynasi, «Kirish» yorlig'i",await L.evaluate(()=>!!document.querySelector("#rtGate.rt-authg")&&document.querySelector(".rt-gt.on").dataset.m==="log"));
  await L.fill("#lgN","Zafar"); await L.fill("#lgS","Olimov"); await L.fill("#lgB","2468"); await L.click("#lgGo"); await sleep(3500);
  const ls=await L.evaluate(()=>({student:RT.student()&&RT.student().name,gate:!!document.getElementById("rtGate"),guest:document.body.classList.contains("rt-guest"),chip:document.getElementById("rtChip").innerText.replace(/\s+/g," ")}));
  ck("mavjud hisobga kirdi: Zafar, mehmon rejimi o'chdi, shu sahifada qoldi",ls.student==="Zafar"&&!ls.gate&&!ls.guest&&/mavzu-2\.html/.test(L.url()),JSON.stringify(ls));
  let wrongPin=null;
  ck("noto'g'ri PIN bilan kirib bo'lmaydi",await (async()=>{ const X=await H.mk(b,null,{}); await X.goto(H.SITE+"/mavzu-2.html"); await ready(X); await X.click("#rtChip"); await sleep(400);
    await X.fill("#lgN","Zafar"); await X.fill("#lgS","Olimov"); await X.fill("#lgB","1111"); await X.click("#lgGo"); await sleep(2500);
    const r=await X.evaluate(()=>({err:(document.getElementById("lgErr")||{}).innerText||"",stu:RT.student()&&RT.student().name,gate:!!document.getElementById("rtGate")})); await X.context().close(); wrongPin=r; return /topilmadi/.test(r.err)&&!r.stu&&r.gate; })(),JSON.stringify(wrongPin));
  /* 7) o'qituvchi hisobsiz */
  const T=await H.mk(b,null,{tc:true});
  await T.goto(H.SITE+"/mavzu-9.html"); await ready(T);
  ck("o'qituvchi (hisobsiz): yopiq mavzu ochiq, 🏆 «Reyting» tugmasi",!(await T.$("#rtAcc"))&&await T.evaluate(()=>/Reyting/.test(document.getElementById("rtChip").innerText)&&!document.getElementById("rtChip").classList.contains("rt-guestbtn")));
  ck("hamma sahifada JS xatolari yo'q",[L,T].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([L,T].map(p=>p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)))).slice(0,300));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
