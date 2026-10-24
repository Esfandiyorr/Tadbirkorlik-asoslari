/* 🌐 Portal (index.html): mehmon avval sayt haqida, maqsad va FANLAR ro'yxatini ko'radi; fan kartochkasi fan sahifasiga olib boradi;
   taqdimot ko'rilayotganda topbarda «Kirish» va «Ro'yxatdan o'tish» turadi; talabaga portal yig'iq; yangi fan qo'shilsa ro'yxatda chiqadi */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1200); }
const tools=p=>p.evaluate(()=>[...document.querySelectorAll(".topbar .tools > *")].map(e=>e.id));
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  H.dbSet("meta/access/m6",{lim:true,g:{"T-123":Date.now()-60000}});   /* 6-mavzu T-123 guruhiga 1 daqiqa oldin ochilgan: shu hafta ball beradi */
  /* 1) mehmon — kompyuter */
  const G=await H.mk(b,null,{});
  const urls=[]; G.on("framenavigated",f=>{ if(f===G.mainFrame()) urls.push(f.url().replace(H.SITE,"")); });
  await G.goto(H.SITE+"/index.html"); await ready(G);
  ck("portal: majburiy oyna yo'q, boshqa sahifaga o'tib ketmadi",!(await G.$("#rtGate"))&&!(await G.$("#rtWait"))&&urls.every(u=>/^\/index\.html/.test(u)),JSON.stringify(urls));
  const a=await G.evaluate(()=>({open:document.getElementById("hmAbout").open,sum:document.querySelector("#hmAbout summary").innerText,
    txt:document.getElementById("hmAbout").innerText.replace(/\s+/g," "),title:document.title,
    courses:[...document.querySelectorAll(".pt-course")].map(c=>c.getAttribute("href")+"|"+c.querySelector("b").innerText+"|"+c.innerText.replace(/\s+/g," ")),
    cards:document.querySelectorAll(".hm-card").length,h:document.querySelector(".hm-hero h1").innerText}));
  ck("«Bu sayt haqida» mehmonga ochiq turadi: nima ekani va TerDU, o'qituvchi",a.open&&/Bu sayt haqida/.test(a.sum)&&/Termiz davlat universiteti/.test(a.txt)&&/Isfandiyor Sayfiddinov/.test(a.txt),a.txt.slice(0,160));
  ck("«Nima maqsadda ochilgan» bo'limi bor (o'qish, test, ball, hamma uchun ochiq)",/Nima maqsadda ochilgan/.test(a.txt)&&/test/.test(a.txt)&&/ro'yxatdan o'tmasdan/.test(a.txt),a.txt.slice(160,420));
  ck("fanlar ro'yxatida fan nomi: «Tadbirkorlik asoslari» (mavzular ro'yxati emas)",a.courses.length===1&&/^tadbirkorlik-asoslari\.html\|Tadbirkorlik asoslari\|/.test(a.courses[0])&&/15 ta mavzu/.test(a.courses[0])&&a.cards===0,JSON.stringify(a.courses));
  ck("brauzer sarlavhasi «IsfandiyorSayfiddinov — …»",/^IsfandiyorSayfiddinov — /.test(a.title)&&/o'quv platformasi/i.test(a.h),a.title);
  const tl=await tools(G);
  ck("topbar: chapdan «🔑 Kirish» va «🎓 Ro'yxatdan o'tish», keyin «Savol va takliflar»; portalda mavzular tugmasi yo'q",tl[0]==="rtChip"&&tl[1]==="rtReg"&&tl[2]==="rtAsk"&&!tl.includes("rtNav")&&!(await G.$("#rtNavBtn")),JSON.stringify(tl));
  const ct=await G.evaluate(()=>({a:document.getElementById("rtChip").innerText.replace(/\s+/g," "),b:document.getElementById("rtReg").innerText.replace(/\s+/g," ")}));
  ck("tugma yozuvlari: «Kirish», «Ro'yxatdan o'tish»",/Kirish/.test(ct.a)&&/Ro'yxatdan o'tish/.test(ct.b),JSON.stringify(ct));
  await G.click("#rtReg"); await sleep(500);
  ck("topbardagi «Ro'yxatdan o'tish» → oyna ro'yxatdan o'tish yorlig'ida",await G.evaluate(()=>!!document.querySelector("#rtGate.rt-authg")&&document.querySelector(".rt-gt.on").dataset.m==="reg"));
  await G.click("#rtGateX"); await sleep(300);
  await G.click("#rtChip"); await sleep(500);
  ck("topbardagi «Kirish» → oyna kirish yorlig'ida",await G.evaluate(()=>!!document.querySelector("#rtGate.rt-authg")&&document.querySelector(".rt-gt.on").dataset.m==="log"));
  await G.click("#rtGateX"); await sleep(300);
  ck("sahifa pastida «Test ishlamoqchimisiz?» + Kirish / Ro'yxatdan o'tish",await G.evaluate(()=>/Test ishlamoqchimisiz/.test(document.getElementById("hmCta").innerText)&&!!document.getElementById("hmLog")&&!!document.getElementById("hmReg")));
  await G.screenshot({path:"portal.png",fullPage:true});
  /* ingliz tili */
  await G.click("#btnLang"); await sleep(600);
  const en=await G.evaluate(()=>({sum:document.querySelector("#hmAbout summary").innerText,go:document.querySelector(".pt-go").innerText,cta:document.getElementById("hmCta").innerText,chip:document.getElementById("rtReg").innerText,title:document.title}));
  ck("ingliz tili: sayt haqida, fan kartochkasi, tugmalar tarjima qilinadi",/About this site/.test(en.sum)&&/Open/.test(en.go)&&/Want to take the tests/.test(en.cta)&&/Register/.test(en.chip)&&/learning platform/i.test(en.title),JSON.stringify(en));
  await G.click("#btnLang"); await sleep(600);
  /* fanni tanlash → fan sahifasi → ← Barcha fanlar */
  await G.click(".pt-course"); await G.waitForURL(/tadbirkorlik-asoslari\.html/); await ready(G);
  const cp=await G.evaluate(()=>({cards:document.querySelectorAll(".hm-card").length,back:(document.querySelector(".hm-back")||{}).getAttribute&&document.querySelector(".hm-back").getAttribute("href"),title:document.title}));
  ck("fan kartochkasi → fan sahifasi: 15 mavzu kartochkasi, «← Barcha fanlar» portalga qaytaradi",cp.cards===15&&cp.back==="index.html"&&/^Tadbirkorlik asoslari/.test(cp.title),JSON.stringify(cp));
  const tl2=await tools(G); ck("fan sahifasida ham «Kirish» va «Ro'yxatdan o'tish» turadi",tl2.includes("rtChip")&&tl2.includes("rtReg"),JSON.stringify(tl2));
  await G.click('.hm-card[data-t="m2"]'); await G.waitForURL(/mavzu-2\.html/); await ready(G);
  /* 2) taqdimot ko'rilayotganda topbarda ikkala tugma */
  const tl3=await tools(G);
  ck("taqdimotda topbarda «Kirish» + «Ro'yxatdan o'tish» chapdan birinchi (Savol va takliflardan oldin)",tl3[0]==="rtChip"&&tl3[1]==="rtReg"&&tl3[2]==="rtAsk",JSON.stringify(tl3));
  const vis=await G.evaluate(()=>["rtChip","rtReg"].map(i=>{ const r=document.getElementById(i).getBoundingClientRect(); return r.width>20&&r.height>10&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=90; }));
  ck("ikkala tugma topbarda ko'rinib turibdi (sahifadan chiqib ketmagan)",vis.every(Boolean),JSON.stringify(vis));
  await G.click("#rtReg"); await sleep(500);
  const why=await G.evaluate(()=>({reg:!!document.querySelector("#rtGate.rt-authg")&&document.querySelector(".rt-gt.on").dataset.m==="reg",why:(document.querySelector(".rt-gate-why")||{}).innerText||""}));
  ck("taqdimotdagi «Ro'yxatdan o'tish» → ro'yxatdan o'tish oynasi (slayd joyida qoladi)",why.reg&&/mavzu-2\.html/.test(G.url()),JSON.stringify(why));
  await G.click("#rtGateX"); await sleep(300);
  await G.click("#rtNavBtn"); await sleep(300);
  const nm=await G.evaluate(()=>[...document.querySelectorAll("#rtNavMenu .rt-navhome")].map(a=>a.getAttribute("href")));
  ck("mavzular ro'yxatida «🏠 Fan sahifasi» va «🌐 Barcha fanlar» (portalga)",nm.length===2&&nm[0]==="tadbirkorlik-asoslari.html"&&nm[1]==="index.html",JSON.stringify(nm));
  await G.keyboard.press("Escape");
  await G.click(".topbar .brand"); await G.waitForURL(/tadbirkorlik-asoslari\.html/,{timeout:8000}).catch(()=>{});
  ck("logotip («TerDU») → fan sahifasi",/tadbirkorlik-asoslari\.html$/.test(G.url()),G.url());
  /* eski havola */
  const O=await H.mk(b,null,{}); await O.goto(H.SITE+"/index.html#7"); await O.waitForURL(/mavzu-1\.html#7/,{timeout:10000}).catch(()=>{});
  ck("eski havola index.html#7 → mavzu-1.html#7",/mavzu-1\.html#7$/.test(O.url()),O.url()); await O.context().close();
  await G.context().close();
  /* 3) mehmon — telefon (390px) */
  const M=await H.mk(b,null,{vp:{width:390,height:844},mobile:true});
  await M.goto(H.SITE+"/index.html"); await ready(M);
  const mm=await M.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,chips:["rtChip","rtReg"].map(i=>{ const r=document.getElementById(i).getBoundingClientRect(); return r.left>=0&&r.right<=innerWidth&&r.width>20; }),
    c:(()=>{ const r=document.querySelector(".pt-course").getBoundingClientRect(); return r.left>=0&&r.right<=innerWidth; })()}));
  ck("telefon: yon tomonga surilmaydi, tugmalar va fan kartochkasi sig'adi",mm.sw<=mm.iw&&mm.chips.every(Boolean)&&mm.c,JSON.stringify(mm));
  await M.screenshot({path:"portal_m.png",fullPage:true});
  await M.goto(H.SITE+"/mavzu-3.html"); await ready(M);
  const md=await M.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,chips:["rtChip","rtReg"].map(i=>{ const r=document.getElementById(i).getBoundingClientRect(); return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=170; })}));
  ck("telefonda taqdimot topbarida ham ikkala tugma ko'rinadi, gorizontal surilish yo'q",md.sw<=md.iw&&md.chips.every(Boolean),JSON.stringify(md));
  await M.screenshot({path:"deck_guest_m.png"}); await M.context().close();
  /* 4) talaba: portal yig'iq, ismi va ball, chip «Ro'yxatdan o'tish» yo'q */
  const S=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{});
  await S.goto(H.SITE+"/index.html"); await ready(S);
  const s=await S.evaluate(()=>({open:document.getElementById("hmAbout").open,au:document.getElementById("hmAuth").innerText.replace(/\s+/g," "),cta:document.getElementById("hmCta").innerText.trim(),
    reg:!!document.getElementById("rtReg"),chip:document.getElementById("rtChip").innerText.replace(/\s+/g," "),tools:[...document.querySelectorAll(".topbar .tools > *")].map(e=>e.id),
    c:document.querySelector(".pt-course").innerText.replace(/\s+/g," ")}));
  ck("talaba: «Bu sayt haqida» yig'iq, salom + jami ball, mehmon bloki yo'q",!s.open&&/Salom, Isfandiyor/.test(s.au)&&/Jami ball/.test(s.au)&&s.cta==="",JSON.stringify(s).slice(0,200));
  ck("talaba: topbarda «Ro'yxatdan o'tish» yo'q, ism va ball, «Savol va takliflar» birinchi",!s.reg&&/Isfandiyor/.test(s.chip)&&s.tools[0]==="rtAsk",JSON.stringify(s.tools));
  ck("talabaga kartochkada «Bu hafta ball beradi: 6-mavzu»",/Bu hafta ball beradi: 6-mavzu/.test(s.c),s.c);
  await S.click("#hmAbout summary"); await sleep(300);
  ck("«Bu sayt haqida» ni bosib ochish mumkin va u o'zi yopilib qolmaydi (60 soniyalik yangilanishda)",await S.evaluate(()=>document.getElementById("hmAbout").open));
  await S.click("#btnLang"); await sleep(500); await S.click("#btnLang"); await sleep(500);   /* til almashganda sahifa qayta chiziladi */
  ck("qayta chizilganda ochiq qolgan blok yopilib ketmaydi",await S.evaluate(()=>document.getElementById("hmAbout").open));
  await S.context().close();
  /* 5) o'qituvchi */
  const T=await H.mk(b,null,{tc:true});
  await T.goto(H.SITE+"/index.html"); await ready(T);
  const t=await T.evaluate(()=>({open:document.getElementById("hmAbout").open,reg:!!document.getElementById("rtReg"),chip:document.getElementById("rtChip").innerText.replace(/\s+/g," "),tc:!!document.querySelector(".hm-week.tc"),cta:document.getElementById("hmCta").innerText.trim()}));
  ck("o'qituvchi: 🏆 Reyting + «🎓 Talaba hisobi» tugmasi (Kirish/Ro'yxatdan o'tish emas), mehmon bloki yo'q, o'qituvchi izohi bor",t.reg&&/Reyting/.test(t.chip)&&t.tc&&t.cta==="",JSON.stringify(t));
  await T.click("#rtReg"); await sleep(500);
  ck("«Talaba hisobi» → kirish oynasi (Kirish / Ro'yxatdan o'tish yorliqlari bor)",await T.evaluate(()=>!!document.querySelector("#rtGate.rt-authg")&&document.querySelectorAll(".rt-gt").length>=2&&/Talaba sifatida/.test(document.querySelector(".rt-gate-why").innerText)));
  await T.context().close();
  /* 6) kelajakda yangi fan qo'shilganda: ro'yxatda chiqadi, mavzular fanlarga bo'linadi */
  const X=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{});
  await X.context().addInitScript(()=>{ let v; Object.defineProperty(window,"RT_CFG",{configurable:true,get(){ return v; },set(x){
    if(x&&x.courses&&x.topics){ x.courses=x.courses.concat([{id:"biznes-reja",icon:"📊",title:"Biznes rejalashtirish",desc:"Yangi fan (sinov)",first:"mavzu-3.html"}]);
      x.topics.forEach(function(t,i){ if(i>=2) t.course="biznes-reja"; }); }
    v=x; }}); });
  await X.goto(H.SITE+"/index.html"); await ready(X);
  const xc=await X.evaluate(()=>[...document.querySelectorAll(".pt-course")].map(c=>c.querySelector("b").innerText+"|"+c.getAttribute("href")+"|"+(c.innerText.match(/(\d+) ta mavzu/)||[])[1]));
  ck("yangi fan portal ro'yxatida chiqadi, mavzular fanlarga bo'lingan (2 + 13)",xc.length===2&&xc[0]==="Tadbirkorlik asoslari|tadbirkorlik-asoslari.html|2"&&xc[1]==="Biznes rejalashtirish|mavzu-3.html|13",JSON.stringify(xc));
  await X.goto(H.SITE+"/tadbirkorlik-asoslari.html"); await ready(X);
  ck("birinchi fan sahifasida faqat o'z 2 ta mavzusi",await X.evaluate(()=>document.querySelectorAll(".hm-card").length===2));
  await X.goto(H.SITE+"/mavzu-3.html"); await ready(X);
  await X.click("#rtNavBtn"); await sleep(300);
  const xn=await X.evaluate(()=>({n:document.querySelectorAll("#rtNavMenu .rt-navi:not(.rt-navhome)").length,cur:(document.querySelector("#rtNavMenu .rt-navi.cur b")||{}).innerText,hd:document.querySelector("#rtNavMenu .rt-navhd").innerText.replace(/\s+/g," ")}));
  ck("2-fan mavzusida ro'yxat faqat shu fan mavzulari (13 ta), raqamlash fan ichida (3-mavzu → 1-mavzu)",xn.n===13&&xn.cur==="1-mavzu",JSON.stringify(xn));
  await X.context().close();
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.message); console.log("FAILS: 1"); process.exit(1); });
