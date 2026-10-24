/* 🛠 Texnik ishlar rejimi (config.json «maintenance.on»): o'qituvchidan boshqa hamma — talaba ham, mehmon ham — hamma sahifada
   «Texnik ishlar ketyapti» ekranini ko'radi; hech narsa ishga tushmaydi (ball, vaqt, bazaga yozuv yo'q); o'qituvchi kira oladi.
   Sinov bayroqni o'zi yoqadi (config dagi qiymatga bog'liq emas) */
const H=require('../lib/h.js'); const {sleep,ck}=H;
const ON=()=>{ let v; Object.defineProperty(window,"RT_CFG",{configurable:true,get(){ return v; },set(x){ if(x) x.maintenance={on:true,uz:"Sinov: serverda ishlar ketyapti.",en:"Test: server work in progress."}; x.maintPoll=2000; v=x; }}); };
const st=p=>p.evaluate(()=>{ const g=document.getElementById("rtMaint"); const vis=e=>{ if(!e) return false; const r=e.getBoundingClientRect(); return getComputedStyle(e).display!=="none"&&getComputedStyle(e).visibility!=="hidden"&&r.width>0&&r.height>0; };
  const t=document.elementFromPoint(innerWidth/2,innerHeight/2);
  return {gate:!!g,txt:g?g.innerText.replace(/\s+/g," "):"",body:document.body.classList.contains("rt-maint"),pre:document.documentElement.classList.contains("rt-maint-pre"),
    ready:!!window.RT_ready,top:!!(g&&t&&g.contains(t)),slides:[...document.querySelectorAll(".slide")].filter(vis).length,topbar:vis(document.querySelector(".topbar")),
    cards:[...document.querySelectorAll(".hm-card,.pt-course")].filter(vis).length,chip:!!document.getElementById("rtChip")}; });
const wait=async(p,ms)=>{ await p.waitForLoadState("load").catch(()=>{}); await sleep(ms||3500); };
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sZ","Zafar","Olimov","T-123");
  H.dbSet("meta/access/m6",{lim:true,g:{"T-123":Date.now()-60000}});         /* Zafar uchun 6-mavzu ball beradigan */
  const mk=async(stu,o)=>{ const p=await H.mk(b,stu,o||{}); await p.context().addInitScript(ON); return p; };
  /* 1) mehmon: har xil sahifalar */
  const G=await mk(null);
  for(const f of ["index.html","tadbirkorlik-asoslari.html","mavzu-2.html","mavzu-7.html"]){
    await G.goto(H.SITE+"/"+f); await wait(G); const s=await st(G);
    ck(f+": mehmon «Texnik ishlar ketyapti» ekranini ko'radi (to'liq ekran, boshqa narsa ko'rinmaydi)",s.gate&&s.body&&s.top&&/Texnik ishlar ketyapti/.test(s.txt)&&s.slides===0&&!s.topbar&&s.cards===0&&!s.chip,JSON.stringify(s).slice(0,260));
  }
  const s0=await st(G);
  ck("config dagi xabar chiqadi, «Qayta tekshirish» tugmasi bor; oldindan yashirish sinfi olib tashlangan",/Sinov: serverda ishlar ketyapti\./.test(s0.txt)&&/Qayta tekshirish/.test(s0.txt)&&!s0.pre,s0.txt);
  ck("ishga tushmadi (RT_ready yo'q) — mehmon rejimi, chip, chat ochilmagan",!s0.ready);
  await G.keyboard.press("ArrowRight"); await G.keyboard.press("p"); await G.evaluate(()=>{ location.hash="#9"; }); await sleep(500);
  ck("klaviatura va #9 ekranni ochmaydi",(await st(G)).gate&&(await st(G)).top);
  await G.emulateMedia({media:"print"}); await sleep(300);
  const pr=await st(G); ck("chop etishda ham slaydlar chiqmaydi (faqat izoh)",pr.slides===0&&pr.gate,JSON.stringify(pr).slice(0,200));
  await G.emulateMedia({media:"screen"});
  await G.click("#rtMaintLg"); await sleep(400);
  ck("til tugmasi: ingliz tilida «Technical work in progress»",await G.evaluate(()=>/Technical work in progress/.test(document.getElementById("rtMaint").innerText)&&/Test: server work in progress\./.test(document.getElementById("rtMaint").innerText)));
  ck("sahifa JS xatosiz",G._errs.filter(e=>!/ERR_TUNNEL|Failed to load resource/.test(e)).length===0,JSON.stringify(G._errs));
  await G.screenshot({path:"texnik_ishlar.png"});
  /* telefon */
  const M=await mk(null,{vp:{width:390,height:844},mobile:true}); await M.goto(H.SITE+"/mavzu-3.html"); await wait(M);
  const mm=await M.evaluate(()=>{ const r=document.querySelector(".rt-maint-box").getBoundingClientRect(); return {sw:document.documentElement.scrollWidth,iw:innerWidth,fit:r.left>=0&&r.right<=innerWidth}; });
  ck("telefonda ekran sig'adi, gorizontal surilish yo'q",mm.sw<=mm.iw&&mm.fit,JSON.stringify(mm)); await M.screenshot({path:"texnik_ishlar_m.png"}); await M.context().close();
  /* 2) talaba: ball ham, vaqt ham yozilmaydi */
  const before=JSON.stringify(H.DBS);
  const S=await mk(H.stu("sZ","Zafar","Olimov","T-123"));
  await S.goto(H.SITE+"/mavzu-6.html"); await wait(S,4500);
  const ss=await st(S);
  ck("talabaga ham «Texnik ishlar ketyapti» (6-mavzu — o'zi uchun ball beradigan bo'lsa ham)",ss.gate&&ss.top&&ss.slides===0&&!ss.ready,JSON.stringify(ss).slice(0,220));
  for(let i=0;i<4;i++){ await S.keyboard.press("ArrowRight"); await sleep(300); }
  await sleep(2500);
  ck("talaba o'zgartira olmaydi: bazaga hech narsa yozilmadi (ball, vaqt, slayd)",JSON.stringify(H.DBS)===before);
  await S.goto(H.SITE+"/index.html"); await wait(S);
  ck("portalda ham talabaga yopiq (fanlar ro'yxati, kirish tugmalari yo'q)",await S.evaluate(()=>!!document.getElementById("rtMaint")&&!document.getElementById("rtChip")));
  /* 3) o'qituvchi to'liq ishlaydi */
  const T=await mk(null,{tc:true}); await T.goto(H.SITE+"/mavzu-7.html"); await wait(T,4500);
  const ts=await st(T);
  ck("o'qituvchi (kirgan) uchun yopiq emas: taqdimot ochiq, sahifa ishga tushgan",!ts.gate&&!ts.body&&!ts.pre&&ts.ready&&ts.slides>0,JSON.stringify(ts).slice(0,220));
  /* 4) o'qituvchi yopiq ekranda kirsa — ekran yo'qoladi va sahifa shu yerda ishga tushadi */
  const L=await mk(null); await L.goto(H.SITE+"/index.html"); await wait(L);
  ck("kirmagan o'qituvchi ham avval yopiq ekranni ko'radi",(await st(L)).gate);
  await L.evaluate(()=>{ window.__TT2=1; }); await L.click("#rtMaintLg"); await sleep(4500);
  const ls=await st(L);
  ck("o'qituvchi kirgach ekran yo'qoladi, portal ishga tushadi (fanlar ro'yxati)",!ls.gate&&!ls.body&&ls.ready&&ls.cards>0,JSON.stringify(ls).slice(0,220));
  /* 4b) o'qituvchi tugmasi: ochish / yopish (bazadagi meta/maint config dan ustun) */
  const TB=await mk(null,{tc:true}); TB.on("dialog",d=>d.accept()); await TB.goto(H.SITE+"/index.html"); await wait(TB,4500);
  const b0=await TB.evaluate(()=>{ const e=document.getElementById("rtMaintBtn"); return e?e.innerText.replace(/\s+/g," ").trim()+"|"+e.classList.contains("on"):null; });
  ck("o'qituvchi topbarida tugma bor: sayt yopiq (config) — «Yopiq — ochish»",/Yopiq — ochish\|true/.test(b0||""),String(b0));
  const G2=await mk(null); await G2.goto(H.SITE+"/mavzu-2.html"); await wait(G2); ck("mehmon uchun yopiq",(await st(G2)).gate);
  await TB.click("#rtMaintBtn"); await sleep(1200);
  ck("tugma bosildi → bazaga meta/maint {on:false} yozildi, tugma «Saytni yopish» bo'ldi",(H.dbGet("meta/maint")||{}).on===false&&await TB.evaluate(()=>/Saytni yopish/.test(document.getElementById("rtMaintBtn").innerText)),JSON.stringify(H.dbGet("meta/maint")));
  await sleep(4500);
  const g2=await st(G2);
  ck("ochiq turgan yopiq ekran o'zi yo'qoldi (sahifa qayta yuklanmasdan) va taqdimot ishga tushdi",!g2.gate&&g2.ready&&g2.slides>0,JSON.stringify(g2).slice(0,200));
  const G3=await mk(null); await G3.goto(H.SITE+"/index.html"); await wait(G3);
  ck("yangi kirgan mehmon ham ochiq saytni ko'radi (baza config dan ustun)",!(await st(G3)).gate&&(await st(G3)).cards>0);
  await TB.click("#rtMaintBtn"); await sleep(1200);
  ck("qayta bosilsa — yopiladi (tasdiq so'raladi), baza {on:true}",(H.dbGet("meta/maint")||{}).on===true&&await TB.evaluate(()=>/Yopiq — ochish/.test(document.getElementById("rtMaintBtn").innerText)),JSON.stringify(H.dbGet("meta/maint")));
  await sleep(4500);
  const g3=await st(G2), g4=await st(G3);
  ck("ochiq turgan sahifalar ham o'zi yopiladi (mehmon, portal)",g3.gate&&g4.gate,JSON.stringify([g3.gate,g4.gate]));
  ck("o'qituvchining o'zi yopiq payt ham sahifani ishlata oladi",await TB.evaluate(()=>!document.getElementById("rtMaint")&&!!window.RT_ready));
  const S2=await mk(H.stu("sZ","Zafar","Olimov","T-123")); await S2.goto(H.SITE+"/index.html"); await wait(S2);
  ck("talabada tugma yo'q",!(await S2.$("#rtMaintBtn"))&&(await st(S2)).gate);
  H.dbSet("meta/maint",null);
  /* 4c) baza «ochiq» desa — config «yopiq» bo'lsa ham yopiq ekran bir lahzaga ham chiqmaydi (oynalar almashib ketmaydi) */
  H.dbSet("meta/maint",{on:false,at:Date.now()});
  const F=await mk(null); await F.context().addInitScript(()=>{ window.__saw=[]; new MutationObserver(()=>{ if(document.getElementById("rtMaint")) window.__saw.push("maint"); }).observe(document,{childList:true,subtree:true}); });
  await F.goto(H.SITE+"/mavzu-2.html"); await wait(F,4500);
  const fs_=await st(F), saw=await F.evaluate(()=>window.__saw.length);
  ck("baza «ochiq» — «Texnik ishlar» oynasi umuman chiqmadi, taqdimot ochildi",saw===0&&!fs_.gate&&fs_.ready&&fs_.slides>0,JSON.stringify({saw,fs_}).slice(0,200));
  H.dbSet("meta/maint",null);
  /* 5) o'chirilganda hammasi odatdagidek (bayroq o'chiq) */
  const N=await H.mk(b,null,{}); await N.goto(H.SITE+"/mavzu-2.html"); await wait(N);
  const ns=await st(N); ck("texnik ishlar o'chiq bo'lganda sahifa odatdagidek ochiladi",!ns.gate&&!ns.body&&ns.ready&&ns.slides>0,JSON.stringify(ns).slice(0,200));
  console.log("FAILS:",H.fails()); await b.close();
})().catch(e=>{ console.log("ERR",e.message); console.log("FAILS: 1"); process.exit(1); });
