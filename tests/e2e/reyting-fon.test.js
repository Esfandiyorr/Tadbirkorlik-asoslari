/* Reyting: top-10 qator foni (34 ta), nik, profil */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const tab=async(p,t)=>{ await p.click('.rt-nktab[data-t="'+t+'"]'); await sleep(350); };
const rowCls=(p,re)=>p.evaluate(re=>{ const r=[...document.querySelectorAll("#rtTop tbody tr")].find(r=>new RegExp(re).test(r.innerText)); return r?r.className:null; },re);
const openTop=async p=>{ await p.goto(H.SITE+"/mavzu-1.html"); await ready(p); await p.evaluate(()=>RT.open("top")); await sleep(2500); };
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  const N=[["sA","Ali","Valiyev"],["sB","Bobur","Karimov"],["sC","Charos","Usmonova"],["sD","Dilnoza","Rahimova"],["sE","Eldor","Tursunov"],["sF","Feruza","Nazarova"],
    ["sG","Gulnoza","Saidova"],["sH","Hasan","Ergashev"],["sJ","Jasur","Olimov"],["sM","Madina","Qosimova"],["sK","Kamol","Yusupov"],["sL","Laylo","Azimova"]];
  N.forEach(([id,n,s],i)=>{ H.addStu(id,n,s,"AP-223"); H.dbSet("students/"+id+"/manual",{m1:13-i}); });
  H.dbSet("students/sC/ns",{g:"eg5"});                                  /* 3-o'rin — fon ko'rinadi */
  H.dbSet("students/sK/ns",{g:"eg7"});                                  /* 11-o'rin — fon ko'rinmaydi */
  H.dbSet("students/sD/ns",{f:"n2",b:"b6",g:"g70",c:{c1:"red"}});       /* eski dizayn — e'tiborsiz */
  H.dbSet("meta/nick",{sB:"Biznes_Sher"});
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223")); await openTop(A);
  const t=await A.evaluate(()=>document.querySelector("#rtTop tbody").innerText);
  ck("boshqalar nikni ko'radi, niki yo'qlar — ism-familiya",/Biznes_Sher/.test(t)&&!/Bobur Karimov/.test(t)&&/Charos Usmonova/.test(t));
  ck("ism dizayni yo'q: hamma .rt-nn oddiy",await A.evaluate(()=>[...document.querySelectorAll(".rt-nn")].every(e=>e.className==="rt-nn")));
  ck("3-o'rindagi talabaning foni (eg5) ko'rinadi",/\beg5\b/.test(await rowCls(A,"Charos")),await rowCls(A,"Charos"));
  ck("11-o'rindagi talabaning foni (eg7) ko'rinmaydi",!/\beg\d/.test(await rowCls(A,"Kamol")),await rowCls(A,"Kamol"));
  const dc=await rowCls(A,"Dilnoza");
  ck("eski dizayn klasslari (n2/b6/g70/bx) qolmagan",!/\b(n2|b6|g70|bx|gx)\b/.test(dc)&&!/--c1|url\(/.test(await A.evaluate(()=>[...document.querySelectorAll("#rtTop tbody tr")].find(r=>/Dilnoza/.test(r.innerText)).getAttribute("style")||"")),dc);
  await A.click("#nkEdit"); await sleep(400);
  const tabs=await A.evaluate(()=>[...document.querySelectorAll(".rt-nktab")].map(x=>x.dataset.t+":"+x.textContent).join(","));
  ck("2 bo'lim: Nik va Qator foni (ism dizayni, ramka, o'zim yasayman yo'q)",/^nk:.*,g:.*Qator foni$/.test(tabs),tabs);
  await tab(A,"g");
  const n=await A.evaluate(()=>document.querySelectorAll('button.rt-nso[data-g]:not([data-g=""])').length);
  ck("1-o'rin: 30+ ta fon (34)",n===34,n);
  const sg=await A.evaluate(()=>[...document.querySelectorAll('button.rt-nso[data-g]:not([data-g=""]) .rt-rmini')].map(e=>{ const r=getComputedStyle(e); return r.backgroundImage+"|"+r.backgroundColor; }));
  ck("hamma fonlar har xil va bo'sh emas",new Set(sg).size===34&&sg.every(s=>!/^none\|rgba\(0, 0, 0, 0\)$/.test(s)),new Set(sg).size);
  ck("«Fonsiz» varianti bor",!!await A.$('button.rt-nso[data-g=""]'));
  const cats=await A.evaluate(()=>[...document.querySelectorAll(".rt-nkcat")].map(x=>x.textContent).join(" | ")); console.log("   ",cats);
  await A.screenshot({path:"eg_all.png"});
  await A.click('.rt-nkcat[data-c="mt"]'); await sleep(300);
  ck("Matematika toifasi: 7 ta",await A.evaluate(()=>document.querySelectorAll('button.rt-nso[data-g]').length)===7);
  await A.screenshot({path:"eg_mt.png"});
  await A.click('.rt-nkcat[data-c="all"]'); await sleep(300);
  await A.click('.rt-nso[data-g="eg12"]'); await sleep(700);
  ck("saqlandi: students/sA/ns = {g:eg12}",JSON.stringify(H.dbGet("students/sA/ns"))==='{"g":"eg12"}',JSON.stringify(H.dbGet("students/sA/ns")));
  ck("o'z qatori darhol yangilandi (me rt-ptop + eg12)",/\bme\b/.test(await rowCls(A,"Ali"))&&/\beg12\b/.test(await rowCls(A,"Ali"))&&/rt-p1/.test(await rowCls(A,"Ali")),await rowCls(A,"Ali"));
  ck("namuna ham yangilandi",await A.evaluate(()=>/\beg12\b/.test(document.querySelector("#nkPrev .rt-rmini").className)));
  await A.click("#nkEdit"); await sleep(400); await A.screenshot({path:"eg_top.png"});
  /* profil oynasi */
  await A.evaluate(()=>[...document.querySelectorAll("#rtTop tbody tr")].find(r=>/Charos/.test(r.innerText)).querySelector(".rt-pts").click()); await sleep(500);
  ck("profilda top-10 foni",await A.evaluate(()=>/\beg5\b/.test(document.querySelector("#rtProf .rt-pfname").className)));
  await A.click("#rtProfX"); await sleep(300);
  await A.evaluate(()=>[...document.querySelectorAll("#rtTop tbody tr")].find(r=>/Kamol/.test(r.innerText)).querySelector(".rt-pts").click()); await sleep(500);
  ck("profilda 11-o'rin — fonsiz",await A.evaluate(()=>!/\beg\d/.test(document.querySelector("#rtProf .rt-pfname").className)));
  await A.click("#rtProfX"); await sleep(300);
  /* 12-o'rin: qulflangan, nik ishlaydi */
  const L=await H.mk(b,H.stu("sL","Laylo","Azimova","AP-223")); await openTop(L);
  await L.click("#nkEdit"); await sleep(400);
  ck("12-o'rin: «Qator foni 🔒»",await L.evaluate(()=>/🔒/.test(document.querySelector('.rt-nktab[data-t="g"]').textContent)));
  await tab(L,"g");
  const lk=await L.evaluate(()=>{ const e=document.querySelector(".rt-nslock"); return e?e.innerText.replace(/\s+/g," "):""; });
  ck("qulf xabari: 1–10-o'rin, hozir 12-o'rin",/1–10-o'rin/.test(lk)&&/12-o'rindasiz/.test(lk),lk);
  ck("tanlash tugmalari yo'q",!(await L.$('button.rt-nso')));
  await L.screenshot({path:"eg_lock.png"});
  await tab(L,"nk"); await L.fill("#nkIn","Laylo_Star"); await L.click("#nkSend"); await sleep(700);
  ck("nik so'rovi yuborildi (nkReq)",(H.dbGet("students/sL/nkReq")||{}).n==="Laylo_Star",JSON.stringify(H.dbGet("students/sL/nkReq")));
  ck("12-o'rin talabaga ns yozilmadi",!H.dbGet("students/sL/ns"));
  /* o'qituvchi kartasi */
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true}); T.on("dialog",x=>x.accept()); await openTop(T);
  const tt=await T.evaluate(()=>document.querySelector("#rtTop tbody").innerText);
  ck("o'qituvchi haqiqiy ismlarni ko'radi (+ nik)",/Bobur Karimov/.test(tt)&&/Biznes_Sher/.test(tt));
  ck("o'qituvchi kartasi standart: TerDU foni (eg34)",await T.evaluate(()=>/\beg34\b/.test(document.querySelector(".rt-tcrow").className)));
  await T.click("#nkEdit"); await sleep(400);
  ck("o'qituvchida faqat «Qator foni»",await T.evaluate(()=>[...document.querySelectorAll(".rt-nktab")].map(x=>x.dataset.t).join(","))==="g");
  await T.click('.rt-nso[data-g="eg29"]'); await sleep(700);
  ck("meta/tcv/ns = {g:eg29}, karta yangilandi",JSON.stringify(H.dbGet("meta/tcv/ns"))==='{"g":"eg29"}'&&await T.evaluate(()=>/rt-tcrow rt-row eg29/.test(document.querySelector(".rt-tcrow").className)),JSON.stringify(H.dbGet("meta/tcv/ns")));
  ck("talaba hisobi (sI) ga yozilmadi",!H.dbGet("students/sI/ns"));
  await T.click("#nkEdit"); await sleep(300); await T.screenshot({path:"eg_tc.png"});
  /* reytingda ko'tarilsa fon qaytadi; tushsa yo'qoladi */
  H.dbSet("students/sK/manual",{m1:50}); H.dbSet("students/sC/manual",null);
  const D=await H.mk(b,H.stu("sB","Bobur","Karimov","AP-223"),{theme:"dark"}); await openTop(D);
  ck("Kamol 1-o'ringa chiqdi — eg7 ko'rindi",/\beg7\b/.test(await rowCls(D,"Kamol")),await rowCls(D,"Kamol"));
  ck("Charos oxiriga tushdi — eg5 yashirildi",!/\beg5\b/.test(await rowCls(D,"Charos")),await rowCls(D,"Charos"));
  await D.screenshot({path:"eg_dark.png"});
  await D.click("#nkEdit"); await sleep(300); await tab(D,"g"); await sleep(200); await D.screenshot({path:"eg_dark_ed.png"});
  const M=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{mobile:true,vp:{width:390,height:844}}); await openTop(M);
  await M.click("#nkEdit"); await sleep(300); await tab(M,"g");
  ck("telefon: gorizontal siljish yo'q",await M.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)); await M.screenshot({path:"eg_m.png"});
  ck("JS xatolari yo'q",[A,L,T,D,M].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([A,L,T,D,M].map(p=>p._errs)).slice(0,500));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
