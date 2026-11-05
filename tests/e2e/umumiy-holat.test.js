/* 🎚 Mavzularning umumiy holati: o'qituvchi har mavzuni hammaga 🔒 yopadi, 📖 o'qish rejimiga o'tkazadi yoki 🟢 ochadi.
   Bazada meta/access/<mavzu>/{m, mt}, config.json da mode/modeAt (boshlang'ich holat). Eng oxirgi amal ustun:
   holatdan oldingi guruh ochilishi e'tiborga olinmaydi, keyingisi esa holatni bekor qiladi. */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1200); }
const go=async(p,f)=>{ await p.goto(H.SITE+"/"+f); await ready(p); };
const state=p=>p.evaluate(()=>document.getElementById("rtAcc")?"lock":document.body.classList.contains("rt-ro")?"read":"score");
(async()=>{
  const b=await H.chromium.launch();
  try {
    const now=Date.now(), min=60000;
    H.addStu("sU","Umida","Karimova","AP-223"); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
    H.dbSet("meta/access/m6",{lim:true,g:{"AP-223":now-2*3600000},m:"read",mt:now-min});   /* holat guruh ochilishidan keyin → 📖 */
    H.dbSet("meta/access/m9",{m:"open",mt:now-min,lim:false,at:now-min});                    /* 🟢 hammaga, ball bilan */
    H.dbSet("meta/access/m3",{m:"lock",mt:now-min,lim:true});                                /* 🔒 — config'da read:true bo'lsa ham */
    H.dbSet("meta/access/m5",{m:"read",mt:now-2*min,lim:true,at:1,g:{"AP-223":now-min}});  /* holatdan keyin guruh ochildi → guruh qoidasi */
    /* 1) talaba */
    const A=await H.mk(b,H.stu("sU","Umida","Karimova","AP-223"),{});
    for(const [f,exp] of [["mavzu-6.html","read"],["mavzu-9.html","score"],["mavzu-3.html","lock"],["mavzu-5.html","score"]]){
      await go(A,f); const st=await state(A); ck("talaba: "+f+" → "+exp,st===exp,st);
    }
    await go(A,"mavzu-3.html");
    const gate=await A.evaluate(()=>{ const g=document.getElementById("rtAcc"); return g?g.innerText.replace(/\s+/g," "):""; });
    ck("yopiq mavzu oynasi: «O'qituvchi bu mavzuni yopib qo'ygan»",/yopiq/.test(gate)&&/yopib qo'ygan/.test(gate),gate.slice(0,200));
    await go(A,"mavzu-6.html");
    const before=JSON.stringify(H.dbGet("students/sU/prog/m6")||{});
    for(let i=0;i<4;i++){ await A.keyboard.press("ArrowRight"); await sleep(300); }
    await sleep(1500);
    ck("📖 o'qish rejimida slayd ballari yozilmaydi",JSON.stringify((H.dbGet("students/sU/prog/m6")||{}))===before||!Object.keys((H.dbGet("students/sU/prog/m6")||{}).sl||{}).length,JSON.stringify(H.dbGet("students/sU/prog/m6")));
    /* 2) mehmon: yopiq mavzu ochilmaydi, ochiq mavzu o'qiladi */
    const G=await H.mk(b,null,{});
    await go(G,"mavzu-3.html"); ck("mehmon: 🔒 3-mavzu yopiq",await state(G)==="lock");
    await go(G,"mavzu-9.html"); ck("mehmon: 🟢 9-mavzu ochiq",!(await G.$("#rtAcc")));
    /* 3) config.json dagi boshlang'ich holat (sinov nusxasidan olib tashlangan — shu sahifada qaytariladi) */
    const C=await H.mk(b,H.stu("sU","Umida","Karimova","AP-223"),{});
    await C.addInitScript(()=>{ let v; Object.defineProperty(window,"RT_CFG",{configurable:true,get(){ return v; },set(x){
      const at=Date.now()-5000, md={m4:"lock",m8:"open",m6:"open"};
      (x.topics||[]).forEach(t=>{ if(md[t.id]){ t.mode=md[t.id]; t.modeAt=at; } }); v=x; }}); });
    for(const [f,exp] of [["mavzu-4.html","lock"],["mavzu-8.html","score"],["mavzu-6.html","score"],["mavzu-3.html","lock"]]){
      await go(C,f); const st=await state(C); ck("boshlang'ich holat: "+f+" → "+exp,st===exp,st);
    }
    const home=await (async()=>{ await go(C,"tadbirkorlik-asoslari.html"); await sleep(800);
      return C.evaluate(()=>[...document.querySelectorAll(".hm-card")].map(c=>c.dataset.t+":"+(c.classList.contains("score")?"s":c.classList.contains("read")?"r":"l")).join(" ")); })();
    ck("fan sahifasi kartochkalari holatga mos (3, 4 🔒 · 6, 8, 9 🟢)",/m3:l/.test(home)&&/m4:l/.test(home)&&/m6:s/.test(home)&&/m8:s/.test(home)&&/m9:s/.test(home),home);
    /* 4) o'qituvchi paneli: «Hammaga: 🔒 Yopiq · 📖 O'qish rejimi · 🟢 Ochiq» tugmalari */
    const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true}); T.on("dialog",x=>x.accept());
    await go(T,"mavzu-7.html"); await T.evaluate(()=>RT.open("tc")); await sleep(3000);
    await T.evaluate(()=>{ const b=[...document.querySelectorAll(".rt-stab")].find(x=>/Baholash/.test(x.textContent)); if(b) b.click(); }); await sleep(1500);
    await T.evaluate(()=>document.querySelector('#accTc [data-t="m10"]').click()); await sleep(400);
    ck("panelda uchta umumiy holat tugmasi",await T.evaluate(()=>document.querySelectorAll("#accTc .rt-acm").length===3));
    const pick=async m=>{ await T.evaluate(m=>document.querySelector('#accTc .rt-acm[data-m="'+m+'"]').click(),m); await sleep(1500); };
    await pick("open");
    let r=H.dbGet("meta/access/m10")||{};
    ck("🟢 Ochiq: bazada m=open, vaqt server soati, guruhlar tozalangan",r.m==="open"&&typeof r.mt==="number"&&Math.abs(r.mt-Date.now())<60000&&r.at===r.mt&&r.lim===false&&!r.g,JSON.stringify(r));
    ck("panel izohi: «hammaga ochiq — ball … gacha»",/hammaga ochiq/.test(await T.evaluate(()=>document.getElementById("accTc").innerText)));
    await go(A,"mavzu-10.html"); ck("talaba: 10-mavzu endi ball beradi",await state(A)==="score",await state(A));
    await go(T,"mavzu-7.html"); await T.evaluate(()=>RT.open("tc")); await sleep(2500);
    await T.evaluate(()=>{ const b=[...document.querySelectorAll(".rt-stab")].find(x=>/Baholash/.test(x.textContent)); if(b) b.click(); }); await sleep(1200);
    await T.evaluate(()=>document.querySelector('#accTc [data-t="m10"]').click()); await sleep(400);
    await pick("read");
    r=H.dbGet("meta/access/m10")||{}; ck("📖 O'qish rejimi: m=read",r.m==="read",JSON.stringify(r));
    await pick("lock");
    r=H.dbGet("meta/access/m10")||{}; ck("🔒 Yopiq: m=lock, lim",r.m==="lock"&&r.lim===true,JSON.stringify(r));
    ck("tugma bosilgan holatda (aria-pressed)",await T.evaluate(()=>document.querySelector('#accTc .rt-acm[data-m="lock"]').getAttribute("aria-pressed")==="true"));
    await go(A,"mavzu-10.html"); ck("talaba: 10-mavzu yopildi",await state(A)==="lock",await state(A));
    /* guruh qoidasiga qaytish: «Faqat belgilangan guruhlarga» + guruh tugmasi — umumiy holat bekor bo'ladi */
    await go(T,"mavzu-7.html"); await T.evaluate(()=>RT.open("tc")); await sleep(2500);
    await T.evaluate(()=>{ const b=[...document.querySelectorAll(".rt-stab")].find(x=>/Baholash/.test(x.textContent)); if(b) b.click(); }); await sleep(1200);
    await T.evaluate(()=>document.querySelector('#accTc [data-t="m10"]').click()); await sleep(400);
    await T.evaluate(()=>[...document.querySelectorAll("#accTc .rt-accg")].find(x=>x.dataset.g==="AP-223").click()); await sleep(1500);
    r=H.dbGet("meta/access/m10")||{};
    ck("guruh tugmasi: umumiy holat o'chdi, AP-223 ga ochildi",!r.m&&typeof r.mt==="number"&&typeof (r.g||{})["AP-223"]==="number",JSON.stringify(r));
    await go(A,"mavzu-10.html"); ck("talaba (AP-223): guruh qoidasi bilan ball beradi",await state(A)==="score",await state(A));
    const errs=[A,G,C,T].flatMap(p=>p._errs).filter(e=>!/^console:/.test(e)); ck("JS xatolari yo'q",errs.length===0,JSON.stringify(errs));
  } finally { await b.close(); }
  console.log('FAILS:',H.fails()); process.exitCode=H.fails()?1:0;
})().catch(e=>{ console.error(e); console.log('FAILS: 1'); process.exit(1); });
