/* O'qituvchi talabaga fon qo'yadi (o'rindan qat'i nazar) */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const tab=async(p,t)=>{ await p.click('.rt-nktab[data-t="'+t+'"]'); await sleep(350); };
const rowCls=(p,re)=>p.evaluate(re=>{ const r=[...document.querySelectorAll("#rtTop tbody tr")].find(r=>new RegExp(re).test(r.innerText)); return r?r.className:null; },re);
const openTop=async p=>{ await p.goto(H.SITE+"/index.html"); await ready(p); await p.evaluate(()=>RT.open("top")); await sleep(2500); };
const pick=async(p,re)=>{ await p.evaluate(re=>[...document.querySelectorAll("#rtTop tbody tr")].find(r=>new RegExp(re).test(r.innerText)).querySelector(".rt-nsb").click(),re); await sleep(400); };
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  const N=[["sA","Ali","Valiyev"],["sB","Bobur","Karimov"],["sC","Charos","Usmonova"],["sD","Dilnoza","Rahimova"],["sE","Eldor","Tursunov"],["sF","Feruza","Nazarova"],
    ["sG","Gulnoza","Saidova"],["sH","Hasan","Ergashev"],["sJ","Jasur","Olimov"],["sM","Madina","Qosimova"],["sK","Kamol","Yusupov"],["sL","Laylo","Azimova"]];
  N.forEach(([id,n,s],i)=>{ H.addStu(id,n,s,"AP-223"); H.dbSet("students/"+id+"/manual",{m1:13-i}); });
  H.dbSet("students/sC/ns",{g:"eg5"}); H.dbSet("students/sL/ns",{g:"eg7"});
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true}); T.on("dialog",x=>x.accept()); await openTop(T);
  ck("o'qituvchi: har qatorda 🎨 tugmasi (12)",await T.evaluate(()=>document.querySelectorAll("#rtTop tbody .rt-nsb").length)===12);
  ck("12-o'rin talabaning o'z foni (eg7) ko'rinmaydi",!/\beg\d/.test(await rowCls(T,"Laylo")),await rowCls(T,"Laylo"));
  await pick(T,"Laylo");
  ck("tanlash oynasi: talaba ismi, 34 fon + «O'qituvchi foni yo'q»",await T.evaluate(()=>{ const g=document.getElementById("rtNsPk"); return !!g&&/Laylo Azimova/.test(g.querySelector("h3").textContent)&&g.querySelectorAll('button.rt-nso[data-g]:not([data-g=""])').length===34&&!!g.querySelector('button.rt-nso[data-g=""].on'); }));
  ck("oynada talabaning o'z tanlovi va «ko'rinmaydi» izohi",await T.evaluate(()=>/o'z tanlovi: «Stikerlar»/.test(document.getElementById("rtNsPk").innerText)&&/ko'rinmaydi/.test(document.getElementById("rtNsPk").innerText)));
  await T.screenshot({path:"egtc_pick.png"});
  await T.click('#rtNsPk .rt-nso[data-g="eg20"]'); await sleep(800);
  ck("saqlandi: meta/tcg/sL = eg20",H.dbGet("meta/tcg/sL")==="eg20",JSON.stringify(H.dbGet("meta/tcg")));
  ck("talaba hisobiga (students/sL/ns) tegilmadi",JSON.stringify(H.dbGet("students/sL/ns"))==='{"g":"eg7"}');
  await T.click("#rtNsPkX"); await sleep(300);
  ck("12-o'rindagi qator darhol eg20",/\beg20\b/.test(await rowCls(T,"Laylo"))&&!/\beg7\b/.test(await rowCls(T,"Laylo")),await rowCls(T,"Laylo"));
  await pick(T,"Charos"); await T.click('#rtNsPk .rt-nso[data-g="eg9"]'); await sleep(800); await T.click("#rtNsPkX"); await sleep(300);
  ck("3-o'rin: o'qituvchi foni (eg9) talabanikidan (eg5) ustun",/\beg9\b/.test(await rowCls(T,"Charos"))&&!/\beg5\b/.test(await rowCls(T,"Charos"))&&/rt-ptop rt-p3/.test(await rowCls(T,"Charos")),await rowCls(T,"Charos"));
  await T.screenshot({path:"egtc_top.png"});
  /* talabalar ko'radi */
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223")); await openTop(A);
  ck("boshqa talaba: Laylo (12-o'rin) eg20, Charos eg9",/\beg20\b/.test(await rowCls(A,"Laylo"))&&/\beg9\b/.test(await rowCls(A,"Charos")));
  ck("talabalarda 🎨 tugmasi yo'q",!(await A.$("#rtTop .rt-nsb")));
  const L=await H.mk(b,H.stu("sL","Laylo","Azimova","AP-223")); await openTop(L);
  ck("Laylo: o'z qatori va namunasi eg20",/\beg20\b/.test(await rowCls(L,"Laylo"))&&await L.evaluate(()=>/\beg20\b/.test(document.querySelector("#nkPrev .rt-rmini").className)));
  await L.click("#nkEdit"); await sleep(300);
  ck("Laylo: «Qator foni 🎁»",await L.evaluate(()=>/🎁/.test(document.querySelector('.rt-nktab[data-t="g"]').textContent)));
  await tab(L,"g");
  const gt=await L.evaluate(()=>document.querySelector(".rt-nslock").innerText.replace(/\s+/g," "));
  ck("Laylo: «O'qituvchi qatoringizga «Matematika…» fonini qo'ygan», tanlash tugmasi yo'q",/O'qituvchi qatoringizga «[^»]+» fonini qo'ygan/.test(gt)&&!(await L.$("button.rt-nso")),gt.slice(0,160));
  await L.screenshot({path:"egtc_gift.png"});
  /* o'qituvchi olib tashlaydi */
  await pick(T,"Charos"); await T.click('#rtNsPk .rt-nso[data-g=""]'); await sleep(800); await T.click("#rtNsPkX"); await sleep(300);
  ck("olib tashlandi: meta/tcg/sC yo'q, qator yana talabaning eg5",!H.dbGet("meta/tcg/sC")&&/\beg5\b/.test(await rowCls(T,"Charos")),JSON.stringify(H.dbGet("meta/tcg"))+" "+await rowCls(T,"Charos"));
  const C=await H.mk(b,H.stu("sC","Charos","Usmonova","AP-223")); await openTop(C);
  await C.click("#nkEdit"); await sleep(300); await tab(C,"g");
  ck("Charos: yana o'zi tanlay oladi (34 tugma)",await C.evaluate(()=>document.querySelectorAll('button.rt-nso[data-g]:not([data-g=""])').length)===34);
  const M=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true,mobile:true,vp:{width:390,height:844}}); await openTop(M);
  ck("telefon (o'qituvchi): gorizontal siljish yo'q, 🎨 va 🗑 ko'rinadi",await M.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll("#rtTop .rt-nsb,#rtTop .rt-del")].slice(0,2).every(e=>{ const r=e.getBoundingClientRect(); return r.width>0&&r.right<=innerWidth; })));
  await M.screenshot({path:"egtc_m.png"});
  await pick(M,"Laylo"); await M.screenshot({path:"egtc_m_pick.png"});
  ck("telefon: oyna sig'adi",await M.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector("#rtNsPk .rt-box").getBoundingClientRect().right<=innerWidth));
  ck("JS xatolari yo'q",[T,A,L,C,M].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([T,A,L,C,M].map(p=>p._errs)).slice(0,500));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
