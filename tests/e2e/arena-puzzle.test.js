/* 🧩 Yakka puzzle (#/puzzle): galereya (shaharlar, iqtisod, fotosuratlar), 16 dan ~200 gacha bo'lak, almashtirish va qotish,
   ⏸ pauza (vaqt to'xtaydi), 🚪 chiqish va davom ettirish (localStorage), 💡 yordam, rekord; yolg'iz arena o'yinida pauza va chiqish */
const H=require('../lib/h.js'); const {sleep,ck}=H;
const ARENA=H.SITE+"/arena.html";
async function until(p,fn,arg,ms){ const t0=Date.now(); while(Date.now()-t0<(ms||20000)){ if(await p.evaluate(fn,arg).catch(()=>false)) return true; await sleep(250); } return false; }
const board=p=>p.evaluate(()=>[...document.querySelectorAll("#pzB .pzt")].map(t=>({p:+t.getAttribute("data-p"),ok:t.classList.contains("ok")})));
const txt=(p,s)=>p.evaluate(q=>{ const e=document.querySelector(q); return e?e.innerText:""; },s);
(async()=>{
  const b=await H.chromium.launch();
  H.addStu("sP","Parizod","Aliyeva","AP-223");
  const P=await H.mk(b,H.stu("sP","Parizod","Aliyeva","AP-223"),{});
  await P.goto(ARENA+"#/"); await until(P,()=>!!document.getElementById("bPz"),null,15000);
  ck("bosh sahifada «Yolg'iz o'ynash» ichida 🧩 Puzzle tugmasi (16–200 bo'lak)",/16–200/.test(await txt(P,"#bPz")));
  await P.click("#bPz");
  ck("#/puzzle: galereya ochildi",await until(P,()=>location.hash==="#/puzzle"&&!!document.querySelector(".pzg"),null,10000));
  ck("qiyinlik: 16, 36, 64, 100, 144, ~200",(await P.evaluate(()=>[...document.querySelectorAll("[data-lv]")].map(x=>x.dataset.lv).join(",")))==="16,36,64,100,144,196"&&/~200/.test(await txt(P,".pzlv")));
  const tabs=await txt(P,".pztabs");
  ck("bo'limlar: Shaharlar (17), Iqtisod (14), Fotosuratlar (10)",/Shaharlar \(17\)/.test(tabs)&&/Iqtisod \(14\)/.test(tabs)&&/Fotosuratlar \(10\)/.test(tabs),tabs);
  ck("Shaharlar: 17 ta rasm, nomlari bilan (Buxoro, Rim, Sidney…)",await P.evaluate(()=>document.querySelectorAll(".pzg-i").length===17&&/Buxoro/.test(document.querySelector(".pzg").innerText)&&/Sidney/.test(document.querySelector(".pzg").innerText)));
  await P.click('[data-tab="photo"]');
  ck("Fotosuratlar: 10 ta, fayl nomidan sarlavha («Buxoro · Poi Kalon», «Kuala-Lumpur · Petronas minoralari»)",await P.evaluate(()=>{ const t=document.querySelector(".pzg").innerText; return document.querySelectorAll(".pzg-i").length===10&&/Buxoro · Poi Kalon/.test(t)&&/Kuala-Lumpur · Petronas minoralari/.test(t); }));
  ck("fotosurat kichik rasmlari yuklandi",await until(P,()=>[...document.querySelectorAll(".pzg-im")].every(e=>/fayllar\/puzzle\//.test(e.style.backgroundImage)),null,5000));
  await P.screenshot({path:"pz_gallery.png",fullPage:true});
  /* 100 bo'lak — Samarqand */
  await P.click('[data-tab="city"]'); await P.click('[data-lv="100"]'); await P.click('.pzg-i[data-id="samarqand"]');
  ck("100 bo'lak: 10×10 taxta",await until(P,()=>document.querySelectorAll("#pzB .pzt").length===100,null,15000)&&/10×10 = 100/.test(await txt(P,".pzs-hud")));
  ck("kompyuterda asl rasm taxta yonida doim ko'rinadi (kichik nusxa yashirin)",await P.evaluate(()=>{ const r=document.getElementById("pzRefIm"), b=r.getBoundingClientRect(), w=document.getElementById("pzW").getBoundingClientRect();
    return /blob:/.test(r.style.backgroundImage)&&b.width>=200&&b.left>=w.right-2&&b.bottom<=innerHeight&&getComputedStyle(document.getElementById("pzMini")).display==="none"; }));
  await P.evaluate(()=>window.scrollTo(0,400)); await sleep(150);
  ck("pastga surilganda ham asl rasm ko'rinib turadi",await P.evaluate(()=>{ const b=document.getElementById("pzRefIm").getBoundingClientRect(); return b.top>=0&&b.top<innerHeight&&b.height>100; }));
  await P.evaluate(()=>window.scrollTo(0,0));
  await P.click("#pzRef");
  ck("asl rasm bosilsa — katta ko'rinadi, yana bosilsa yopiladi",await until(P,()=>{ const o=document.querySelector(".pzs-big"); return !!o&&o.querySelector(".pzs-bim").getBoundingClientRect().width>400; },null,3000)&&(await P.click(".pzs-big"),await until(P,()=>!document.querySelector(".pzs-big"),null,3000)));
  ck("bo'laklar rasmi blob-URL dan (kanvasdan), joyida turganlari kam",await P.evaluate(()=>/blob:/.test(getComputedStyle(document.querySelector("#pzB .pzt")).backgroundImage))&&(await board(P)).filter(x=>x.ok).length<=12);
  let bd=await board(P), i=bd.findIndex((x,k)=>!x.ok&&bd.findIndex((y,j)=>y.p===k&&!y.ok)>=0), j=bd.findIndex(y=>y.p===i&&!y.ok);
  const ok0=bd.filter(x=>x.ok).length;
  await P.click('#pzB .pzt[data-pos="'+i+'"]'); await P.click('#pzB .pzt[data-pos="'+j+'"]'); await sleep(200);
  bd=await board(P);
  ck("ikki bo'lak bosildi → o'rni almashdi, joyiga tushgani qotdi (✅ soni oshdi)",bd[i].p===i&&bd[i].ok&&bd.filter(x=>x.ok).length>ok0&&new RegExp("✅ "+bd.filter(x=>x.ok).length+" / 100").test(await txt(P,"#pzK")));
  await P.click('#pzB .pzt[data-pos="'+i+'"]'); await sleep(100);
  ck("qotgan bo'lakni tanlab bo'lmaydi",await P.evaluate(()=>!document.querySelector("#pzB .pzt.sel")));
  /* ⏸ pauza */
  await sleep(2100);
  const t1=await txt(P,"#pzTm");
  await P.click("#pzPause");
  ck("⏸ Pauza: oyna chiqdi, taxta yopildi (xira)",await until(P,()=>!!document.querySelector(".pzs-ov")&&document.getElementById("pzW").classList.contains("off"),null,3000));
  const t2=await txt(P,"#pzTm"); await sleep(2600);
  ck("pauzada soat to'xtaydi",(await txt(P,"#pzTm"))===t2&&t1!=="0:00",t1+" "+t2);
  await P.screenshot({path:"pz_pause.png"});
  await P.click('.pzs-ov [data-a="go"]'); await sleep(2300);
  ck("▶ Davom ettirish → soat yana yuradi",(await txt(P,"#pzTm"))!==t2&&!(await P.$(".pzs-ov")));
  /* boshqa ilovaga o'tilsa — o'zi pauza */
  await P.evaluate(()=>{ Object.defineProperty(document,"hidden",{configurable:true,get:()=>true}); document.dispatchEvent(new Event("visibilitychange")); });
  ck("boshqa ilova/varaqqa o'tilganda o'zi pauza bo'ladi",await until(P,()=>!!document.querySelector(".pzs-ov"),null,3000));
  await P.evaluate(()=>{ Object.defineProperty(document,"hidden",{configurable:true,get:()=>false}); });
  await P.click('.pzs-ov [data-a="go"]');
  /* 🚪 chiqish va davom ettirish */
  const before=JSON.stringify((await board(P)).map(x=>x.p)), tb=await txt(P,"#pzTm");
  await P.click("#pzExit");
  ck("🚪 Chiqish → galereya, «Tugallanmagan puzzle» kartasi (vaqt bilan)",await until(P,()=>location.hash==="#/puzzle"&&!!document.getElementById("pzGo"),null,8000)&&/Samarqand/.test(await txt(P,".pz-cont"))&&/100 bo'lak/.test(await txt(P,".pz-cont")));
  ck("holat localStorage da saqlangan",await P.evaluate(()=>{ const s=JSON.parse(localStorage.getItem("pz_save_v1")||"null"); return !!s&&s.img==="samarqand"&&s.c===10&&s.perm.length===100; }));
  await P.reload(); await until(P,()=>!!document.getElementById("pzGo"),null,15000);
  await P.click("#pzGo");
  await until(P,()=>document.querySelectorAll("#pzB .pzt").length===100,null,15000);
  ck("▶ Davom ettirish (sahifa yangilangandan keyin ham) → aynan o'sha tartib va vaqt",JSON.stringify((await board(P)).map(x=>x.p))===before&&(await txt(P,"#pzTm"))>=tb,(await txt(P,"#pzTm"))+" "+tb);
  /* 💡 yordam bilan oxirigacha */
  for(let k=0;k<120;k++){ if(await P.$(".pzs-ov")) break; await P.click("#pzHint"); }
  ck("rasm yig'ildi → «Rasm yig'ildi!», «Yangi rekord!», yordam soni ko'rsatiladi",await until(P,()=>{ const o=document.querySelector(".pzs-ov"); return !!o&&/Rasm yig'ildi/.test(o.innerText)&&/Yangi rekord/.test(o.innerText)&&/💡/.test(o.innerText); },null,6000));
  ck("rekord saqlandi (samarqand|10x10), tugallanmagan o'chirildi",await P.evaluate(()=>{ const b=JSON.parse(localStorage.getItem("pz_best_v1")||"{}"); return !!b["samarqand|10x10"]&&!localStorage.getItem("pz_save_v1"); }));
  ck("keyingi daraja taklifi: ⬆ 144 bo'lak",/144 bo'lak/.test(await txt(P,".pzs-ov")));
  await P.screenshot({path:"pz_done.png"});
  await P.click('.pzs-ov [data-a="menu"]');
  ck("galereyada Samarqandda 🏆 belgisi",await until(P,()=>/🏆/.test((document.querySelector('.pzg-i[data-id="samarqand"]')||{}).innerText||""),null,8000));
  /* ~200 bo'lak — tik fotosurat */
  await P.click('[data-tab="photo"]'); await P.click('[data-lv="196"]');
  await P.click('.pzg-i[data-id="ph:fayllar/puzzle/Kuala-Lumpur__Petronas_minoralari.jpg"]');
  ck("~200 bo'lak: tik fotosurat 10×20 = 200",await until(P,()=>document.querySelectorAll("#pzB .pzt").length===200,null,15000)&&/10×20 = 200/.test(await txt(P,".pzs-hud")),await txt(P,".pzs-hud"));
  ck("taxta ekranga sig'adi (eni ham, bo'yi ham), bo'laklar to'g'ri nisbatda",await P.evaluate(()=>{ const r=document.getElementById("pzB").getBoundingClientRect(), t=document.querySelector("#pzB .pzt").getBoundingClientRect();
    return r.width<=innerWidth&&r.height<=innerHeight&&Math.abs(t.width/t.height-(1080/10)/(1959/20))<0.2&&document.documentElement.scrollWidth<=innerWidth; }));
  await P.screenshot({path:"pz_200.png",fullPage:true});
  const w0=await P.evaluate(()=>document.getElementById("pzB").getBoundingClientRect().width);
  for(let k=0;k<4;k++) await P.click("#pzZi"); await sleep(200);
  ck("➕ kattalashtirish: taxta 3 barobar katta, o'z oynasida suriladi (sahifa eniga chiqmaydi)",await P.evaluate(w=>{ const r=document.getElementById("pzB").getBoundingClientRect(); return r.width>w*2.8&&r.width>document.getElementById("pzW").clientWidth&&document.documentElement.scrollWidth<=innerWidth; },w0));
  for(let k=0;k<4;k++) await P.click("#pzZo");
  await P.click("#pzGh"); await sleep(400);
  ck("👁 Namuna: rasm taxta ustida xira ko'rinadi",await P.evaluate(()=>+getComputedStyle(document.getElementById("pzGhost")).opacity>0.3));
  await P.click("#pzGh");
  /* sichqoncha bilan sudrash */
  await P.evaluate(()=>{ const r=document.getElementById("pzW").getBoundingClientRect(); window.scrollBy(0,r.top-150); }); await sleep(200);
  bd=await board(P); i=bd.findIndex((x,k)=>!x.ok&&bd.findIndex(y=>y.p===k&&!y.ok)>=0); j=bd.findIndex(y=>y.p===i&&!y.ok);
  const ra=await (await P.$('#pzB .pzt[data-pos="'+j+'"]')).boundingBox(), rb=await (await P.$('#pzB .pzt[data-pos="'+i+'"]')).boundingBox();
  await P.mouse.move(ra.x+ra.width/2,ra.y+ra.height/2); await P.mouse.down(); await P.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2,{steps:6}); await P.mouse.up(); await sleep(200);
  ck("sichqoncha bilan sudrab qo'yish ishlaydi",(await board(P))[i].ok);
  /* telefon */
  const M=await H.mk(b,H.stu("sP","Parizod","Aliyeva","AP-223"),{vp:{width:390,height:844},mobile:true});
  await M.goto(ARENA+"#/puzzle"); await until(M,()=>!!document.querySelector(".pzg"),null,15000);
  ck("telefonda galereya sig'adi",await M.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await M.screenshot({path:"pz_gallery_m.png",fullPage:true});
  await M.click('[data-lv="100"]'); await M.click('[data-tab="econ"]'); await M.click('.pzg-i[data-id="bank"]');
  await until(M,()=>document.querySelectorAll("#pzB .pzt").length===100,null,15000);
  ck("telefonda 100 bo'lak: sahifa eniga chiqmaydi, bo'lak ≥ 26px",await M.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector("#pzB .pzt").getBoundingClientRect().width>=26));
  bd=await board(M); i=bd.findIndex((x,k)=>!x.ok&&bd.findIndex(y=>y.p===k&&!y.ok)>=0); j=bd.findIndex(y=>y.p===i&&!y.ok);
  await M.tap('#pzB .pzt[data-pos="'+i+'"]'); await M.tap('#pzB .pzt[data-pos="'+j+'"]'); await sleep(200);
  ck("telefonda barmoq bilan ikki bo'lakni bosib almashtirish",(await board(M))[i].ok);
  ck("telefonda asl rasm tepadagi panelda (yon panel yashirin)",await M.evaluate(()=>{ const m=document.getElementById("pzMini"), b=m.getBoundingClientRect(); return /blob:/.test(m.style.backgroundImage)&&b.height>=40&&b.width>=40&&getComputedStyle(document.getElementById("pzRef")).display==="none"; }));
  await M.tap("#pzZi"); await M.tap("#pzZi"); await sleep(200);                       /* katta taxta — sahifa pastga suriladi */
  await M.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await sleep(200);
  ck("telefonda pastga surilganda ham asl rasm ko'rinib turadi",await M.evaluate(()=>{ const b=document.getElementById("pzMini").getBoundingClientRect(); return scrollY>100&&b.top>=0&&b.bottom<=innerHeight; }),await M.evaluate(()=>JSON.stringify([scrollY,document.body.scrollHeight,innerHeight,document.getElementById("pzMini").getBoundingClientRect().top])));
  await M.tap("#pzMini");
  ck("telefonda asl rasmni bosish — ekran bo'ylab katta ko'rinadi",await until(M,()=>{ const o=document.querySelector(".pzs-big"); return !!o&&o.querySelector(".pzs-bim").getBoundingClientRect().width>300; },null,3000));
  await M.screenshot({path:"pz_big_m.png"});
  await M.tap(".pzs-big"); await M.evaluate(()=>window.scrollTo(0,0)); await M.tap("#pzZo"); await M.tap("#pzZo");
  await M.screenshot({path:"pz_play_m.png"});
  /* yolg'iz arena o'yini: ⏸ pauza (tugash vaqti suriladi) va 🚪 chiqish */
  await P.goto(ARENA+"#/"); await until(P,()=>!!document.querySelector('[data-solo="memory"]'),null,15000);
  await P.click('[data-solo="memory"]'); await until(P,()=>/^#\/room\//.test(location.hash)&&!!document.getElementById("gPause"),null,15000); await sleep(5200);
  const code=await P.evaluate(()=>location.hash.slice(7,11)), e1=(H.dbGet("arena/rooms/"+code+"/state")||{}).endAt;
  ck("yolg'iz o'yinda HUD da ⏸ Pauza va 🚪 Chiqish",/Pauza/.test(await txt(P,"#gPause"))&&/Chiqish/.test(await txt(P,"#gExit")));
  await P.click("#gPause");
  ck("⏸ → «Pauza» oynasi, o'yin maydoni yopildi",await until(P,()=>!!document.querySelector(".gp-ov")&&document.getElementById("stage").classList.contains("gp-off"),null,3000));
  const tm1=await txt(P,"#tmr"); await sleep(3200);
  ck("pauzada vaqt to'xtaydi va o'yin tugamaydi",(await txt(P,"#tmr"))===tm1&&H.dbGet("arena/rooms/"+code+"/state").ph==="play");
  await P.screenshot({path:"solo_pause.png"});
  await P.click('.gp-ov [data-a="go"]'); await sleep(1500);
  const e2=(H.dbGet("arena/rooms/"+code+"/state")||{}).endAt;
  ck("▶ davom → tugash vaqti pauza qadar surildi (≥3 s)",e2-e1>=3000,String(e2-e1));
  await P.click("#gExit");
  ck("🚪 → «O'yindan chiqasizmi?» so'raladi",await until(P,()=>/chiqasizmi/.test((document.querySelector(".gp-ov")||{}).innerText||""),null,3000));
  await P.click('.gp-ov [data-a="out"]');
  ck("«Ha, chiqish» → arena bosh sahifasi, xona o'chirildi",await until(P,()=>!!document.getElementById("bPz"),null,10000)&&!H.dbGet("arena/rooms/"+code));
  const errs=[P,M].map(p=>p._errs.filter(e=>!/ERR_TUNNEL|Failed to load/.test(e))).flat();
  ck("JS xatolari yo'q",errs.length===0,JSON.stringify(errs).slice(0,300));
  console.log("FAILS:",H.fails()); await b.close();
})().catch(e=>{ console.log("ERR",e.message); console.log("FAILS: 1"); process.exit(1); });
