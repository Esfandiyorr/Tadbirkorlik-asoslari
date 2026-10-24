/* 🔒 Yopiq mavzu mehmonga ham yopiq: mehmon hech qaysi guruhga kirmagan talaba bilan bir xil ko'radi.
   O'qituvchi mavzuni faqat bir guruhga / bir talabaga ochsa — mehmonga ochilmaydi; hammaga ochsa yoki o'qish rejimiga
   o'tsa — mehmon o'qiydi. Yopiq mavzu chop etilmaydi (Ctrl+P, «📥 PDF»), qulf oynasi esa Esc, klaviatura va #N bilan ochilmaydi */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const cards=p=>p.evaluate(()=>[...document.querySelectorAll(".hm-card")].map(c=>c.dataset.t+":"+(c.classList.contains("score")?"s":c.classList.contains("read")?"r":"l")+(c.tagName==="A"?"a":"-")).join(" "));
const deck=async(p,n)=>{ await p.goto(H.SITE+"/mavzu-"+n+".html"); await ready(p); await sleep(4500);
  return p.evaluate(()=>({gate:!!document.getElementById("rtAcc"),locked:document.body.classList.contains("rt-locked"),guest:document.body.classList.contains("rt-guest")})); };
(async()=>{
  const b=await H.chromium.launch(); const now=Date.now();
  H.addStu("sA","Ali","Valiyev","AP-223"); H.addStu("sX","Xolid","Karimov","FIZ-21"); H.addStu("sZ","Zafar","Olimov","T-123");
  H.dbSet("meta/access/m6",{lim:true,g:{"AP-223":now-60000}});                       /* faqat AP-223 ga, ball beradi */
  H.dbSet("meta/access/m7",{lim:false,at:now-60000});                                /* hammaga, ball beradi */
  H.dbSet("meta/access/m8",{lim:true,g:{"FIZ-21":now-12*86400000}});                 /* muddati o'tgan → hamma o'qiydi */
  H.dbSet("meta/access/m9",{lim:true,s:{sX:now-60000}});                             /* faqat bitta talabaga */
  const G=await H.mk(b,null,{});
  const Z=await H.mk(b,H.stu("sZ","Zafar","Olimov","T-123"),{});            /* hech narsa ochilmagan guruh */
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{});
  const X=await H.mk(b,H.stu("sX","Xolid","Karimov","FIZ-21"),{});
  const url=H.SITE+"/tadbirkorlik-asoslari.html";
  await G.goto(url); await ready(G); await Z.goto(url); await ready(Z); await A.goto(url); await ready(A); await X.goto(url); await ready(X);
  const [cg,cz,ca,cx]=[await cards(G),await cards(Z),await cards(A),await cards(X)];
  const grp="m1:ra m2:ra m3:ra m4:ra m5:ra m6:l- m7:ra m8:ra m9:l- m10:l- m11:l- m12:l- m13:l- m14:l- m15:l-";
  ck("fan sahifasi: mehmon ko'rgani = hech qaysi guruhga ochilmagan talaba ko'rgani (bir xil kartochkalar)",cg.replace(/:s/g,":r")===cz.replace(/:s/g,":r"),cg+" | "+cz);
  ck("mehmonda: 1–5 va 8 o'qish, 7 (hammaga ochilgan) bosiladi; 6 (faqat AP-223) va 9 (bitta talaba) yopiq; 10–15 yopiq",cg.replace(/:s/g,":r")===grp,cg);
  ck("o'z guruhi uchun ochilgan mavzu faqat shu guruhda ko'rinadi: AP-223 da 6 ochiq, FIZ-21 da yopiq",/m6:sa/.test(ca)&&/m6:l-/.test(cx)&&/m6:l-/.test(cz)&&/m6:l-/.test(cg),ca.split(" ")[5]+" "+cx.split(" ")[5]);
  ck("bitta talabaga ochilgan 9-mavzu faqat o'sha talabada ochiq",/m9:sa/.test(cx)&&/m9:l-/.test(cg)&&/m9:l-/.test(ca)&&/m9:l-/.test(cz),cx.split(" ")[8]+" "+cg.split(" ")[8]);
  ck("yopiq kartochkalar havolasiz (bosib bo'lmaydi)",!/m6:la|m9:la|m1[0-5]:la/.test(cg));
  /* mavzu sahifasiga to'g'ridan-to'g'ri havola */
  const exp={2:false,6:true,7:false,8:false,9:true,10:true,15:true};   /* true — yopiq (qulf oynasi) */
  const out={};
  for(const n of Object.keys(exp)){
    const g=await deck(G,n), z=await deck(Z,n); out[n]=[g.gate,z.gate];
    ck(n+"-mavzu havolasi: mehmonga "+(exp[n]?"🔒 qulf oynasi chiqadi":"ochiq")+" (talabadagi bilan bir xil)",g.gate===exp[n]&&z.gate===exp[n]&&g.locked===exp[n]&&g.guest,JSON.stringify([g,z]));
  }
  /* qulf oynasini aylanib o'tib bo'lmaydi */
  const L=await H.mk(b,null,{}); const lk=await deck(L,10);
  await L.keyboard.press("ArrowRight"); await L.keyboard.press("Escape"); await L.evaluate(()=>{ location.hash="#5"; }); await sleep(500);
  const cv=await L.evaluate(()=>{ const g=document.getElementById("rtAcc"); const t=document.elementFromPoint(innerWidth/2,innerHeight/2); const r=g.getBoundingClientRect();
    return {gate:!!g,cover:r.width>=innerWidth&&r.height>=innerHeight,top:g.contains(t),txt:/hali ochilmagan/.test(g.innerText),login:!!g.querySelector("[data-auth]")}; });
  ck("qulf oynasi: to'liq ekran, Esc / klaviatura / #5 bilan ochilmaydi, «hali ochilmagan» + «Kirish» havolasi",lk.gate&&cv.gate&&cv.cover&&cv.top&&cv.txt&&cv.login,JSON.stringify(cv));
  /* chop etish */
  await L.emulateMedia({media:"print"}); await sleep(300);
  const pr=await L.evaluate(()=>{ const vis=[...document.querySelectorAll(".slide")].filter(x=>{ const r=x.getBoundingClientRect(); return getComputedStyle(x).display!=="none"&&r.height>0; }).length;
    return {vis:vis,msg:getComputedStyle(document.body,"::before").content}; });
  ck("yopiq mavzu chop etilsa / PDF ga saqlansa — slaydlar chiqmaydi, faqat «yopiq» izohi",pr.vis===0&&/yopiq/.test(pr.msg),JSON.stringify(pr));
  await L.emulateMedia({media:"screen"});
  const O=await H.mk(b,null,{}); await deck(O,7); await O.emulateMedia({media:"print"}); await sleep(300);
  ck("ochiq (hammaga ochilgan) mavzu chop etishda buzilmagan — slaydlar bor",await O.evaluate(()=>[...document.querySelectorAll(".slide")].filter(x=>getComputedStyle(x).display!=="none"&&x.getBoundingClientRect().height>0).length>0));
  /* mavzular ro'yxati (topbar): yopiq mavzu 🔒 tugma (havolasiz), ochiqlari havola */
  const N=await H.mk(b,null,{}); await deck(N,2); await N.click("#rtNavBtn"); await sleep(300);
  const nm=await N.evaluate(()=>[...document.querySelectorAll("#rtNavMenu .rt-navi:not(.rt-navhome)")].map(e=>e.classList.contains("cur")?"c":e.tagName==="A"?"o":e.classList.contains("lock")?"L":"?").join(""));
  ck("topbardagi mavzular ro'yxati mehmonga: ochiqlari havola, yopiqlari 🔒 (havolasiz) — talabadagi bilan bir xil",nm==="ocoooLooLLLLLLL",nm);
  /* o'qituvchi mavzuni hammaga ochgach — mehmon ham o'qiydi (yopiq qolib ketmaydi) */
  H.dbSet("meta/access/m10",{lim:false,at:now-1000});
  const g10=await deck(L,10);
  ck("o'qituvchi 10-mavzuni hammaga ochgach mehmonda qulf yo'qoladi",!g10.gate&&!g10.locked,JSON.stringify(g10));
  console.log("FAILS:",H.fails());
  await b.close();
})().catch(e=>{ console.log("ERR",e.message); console.log("FAILS: 1"); process.exit(1); });
