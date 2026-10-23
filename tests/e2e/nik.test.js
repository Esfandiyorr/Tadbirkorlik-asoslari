/* Nik: so'rov → o'qituvchi tasdig'i / rad etish */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const top=p=>p.evaluate(()=>document.querySelector("#rtTop .rt-table tbody").innerText);
const openTop=async p=>{ await p.goto(H.SITE+"/index.html"); await ready(p); await p.evaluate(()=>RT.open("top")); await sleep(2500); };
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  H.addStu("sA","Ali","Valiyev","AP-223"); H.addStu("sB","Bobur","Karimov","AP-223"); H.addStu("sC","Charos","Usmonova","T-223");
  H.dbSet("students/sA/manual",{m1:5}); H.dbSet("students/sB/manual",{m1:4});
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223")); await openTop(A);
  await A.click("#nkEdit"); await sleep(400);
  ck("tahrir «Nik» bo'limidan ochiladi",await A.evaluate(()=>!!document.getElementById("nkIn")&&document.querySelector(".rt-nktab.on").dataset.t==="nk"));
  await A.fill("#nkIn","  Biznes_Sher <b> "); await A.click("#nkSend"); await sleep(800);
  ck("nik so'rovi tozalab yozildi, «Tasdiq kutilmoqda»",H.dbGet("students/sA/nkReq/n")==="Biznes_Sher b"&&/Tasdiq kutilmoqda/.test(await A.evaluate(()=>document.getElementById("nkSt").textContent)),H.dbGet("students/sA/nkReq/n"));
  await A.fill("#nkIn","Biznes_Sher"); await A.click("#nkSend"); await sleep(800);
  const B=await H.mk(b,H.stu("sB","Bobur","Karimov","AP-223")); await openTop(B);
  ck("tasdiqlanmagan nik hali ko'rinmaydi",!/Biznes_Sher/.test(await top(B))&&/Ali Valiyev/.test(await top(B)));
  await B.click("#nkEdit"); await sleep(300); await B.fill("#nkIn","Bobur007"); await B.click("#nkSend"); await sleep(800);
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true}); T.on("dialog",x=>x.accept());
  await T.goto(H.SITE+"/index.html"); await ready(T); await T.evaluate(()=>RT.open("tc")); await sleep(3500);
  ck("o'qituvchi: «Talabalar» belgisida 2 so'rov",/Talabalar\s*2/.test(await T.evaluate(()=>document.querySelector('.rt-stab[data-p="stu"]').textContent)));
  await T.evaluate(()=>[...document.querySelectorAll(".nk-ok")].find(b=>b.dataset.id==="sA").click()); await sleep(1200);
  await T.evaluate(()=>[...document.querySelectorAll(".nk-no")].find(b=>b.dataset.id==="sB").click()); await sleep(1200);
  ck("tasdiq: meta/nick/sA, rad: sB nkReq.rej",H.dbGet("meta/nick/sA")==="Biznes_Sher"&&!!H.dbGet("students/sB/nkReq/rej")&&!H.dbGet("meta/nick/sB"),JSON.stringify(H.dbGet("meta/nick")));
  await T.evaluate(()=>RT.open("top")); await sleep(2500);
  ck("o'qituvchi reytingda haqiqiy ism + nikni ko'radi",/Ali Valiyev/.test(await top(T))&&/🏷 Biznes_Sher/.test(await top(T)));
  const C=await H.mk(b,H.stu("sC","Charos","Usmonova","T-223")); await openTop(C);
  const t=await top(C);
  ck("boshqa talaba: Ali o'rniga «Biznes_Sher», Bobur — ism-familiya",/Biznes_Sher/.test(t)&&!/Ali Valiyev/.test(t)&&/Bobur Karimov/.test(t),t.replace(/\s+/g," ").slice(0,160));
  await B.reload(); await ready(B); await B.evaluate(()=>RT.open("top")); await sleep(2500); await B.click("#nkEdit"); await sleep(300);
  ck("Bobur: «rad etildi»",/rad etildi/.test(await B.evaluate(()=>document.getElementById("nkSt").textContent)));
  ck("JS xatolari yo'q",[A,B,T,C].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([A,B,T,C].map(p=>p._errs)).slice(0,400));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
