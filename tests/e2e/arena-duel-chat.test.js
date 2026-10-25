/* ⚔️ Juftlik stol o'yinlari vaqtsiz (shashka, shaxmat, to'rttalik): o'tgan vaqt ko'rinadi, 🤝 durang taklifi (rad / qabul),
   🏳 taslim, raqib chiqib ketsa — g'alaba. 💬 Xona chati: o'yin paytida xabar, o'qilmaganlar soni, tezkor javoblar */
const H=require('../lib/h.js'); const {sleep,ck}=H;
const ARENA=H.SITE+"/arena.html";
async function home(p){ await p.goto(ARENA+"#/"); for(let t=0;t<40;t++){ await sleep(400); if(await p.$("#onl")) break; } await sleep(800); }
async function until(p,fn,arg,ms){ const t0=Date.now(); while(Date.now()-t0<(ms||20000)){ if(await p.evaluate(fn,arg).catch(()=>false)) return true; await sleep(300); } return false; }
const txt=(p,s)=>p.evaluate(q=>{ const e=document.querySelector(q); return e?e.innerText:""; },s);
async function duel(A,B,g){
  await home(A); await home(B);
  await until(A,()=>!!document.querySelector('#onl [data-inv="sB"]:not([disabled])'),null,15000);
  await A.click('#onl [data-inv="sB"]'); await A.click('#gpick [data-g="'+g+'"]');
  await until(B,()=>!!document.querySelector(".inv-ov [data-a]"),null,8000); await B.click('.inv-ov [data-a="1"]');
  await until(A,()=>!!document.getElementById("tmr")&&!document.querySelector(".cd"),null,20000); await until(B,()=>!!document.getElementById("tmr")&&!document.querySelector(".cd"),null,20000);
  await sleep(600);
  return await A.evaluate(()=>location.hash.slice(7,11));
}
(async()=>{
  const b=await H.chromium.launch();
  H.addStu("sA","Ali","Valiyev","AP-223"); H.addStu("sB","Bobur","Karimov","AP-223");
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{}), B=await H.mk(b,H.stu("sB","Bobur","Karimov","AP-223"),{vp:{width:390,height:844},mobile:true});
  /* 1) shashka — vaqtsiz */
  let code=await duel(A,B,"dama");
  const st=H.dbGet("arena/rooms/"+code+"/state")||{};
  ck("shashka: vaqt cheklanmagan (nt=1), HUD da ∞ va o'tgan vaqt, aylana soat yo'q",st.nt===1&&st.endAt-st.startAt>=12*3600000&&/∞/.test(await txt(A,".hud"))&&!(await A.$("#rg")));
  const t1=await txt(A,"#tmr"); await sleep(2300);
  ck("o'tgan vaqt oshib boradi",(await txt(A,"#tmr"))!==t1&&/^0:0\d$/.test(await txt(A,"#tmr")),t1+" → "+await txt(A,"#tmr"));
  ck("ikkalasida 🤝 Durang va 🏳 Taslim tugmalari",await A.evaluate(()=>!document.getElementById("dctl").hidden)&&await B.evaluate(()=>!document.getElementById("dctl").hidden));
  ck("o'yin kartasida «vaqtsiz» belgisi",await A.evaluate(()=>/vaqtsiz/.test(window.ARENA_TEST.GAMES.dama.desc[0]+" "+(window.ARENA_TEST.GAMES.dama.untimed?"vaqtsiz":""))));
  /* 💬 chat */
  ck("o'yin paytida 💬 chat tugmasi (ikkalasida)",await A.evaluate(()=>{ const b=document.getElementById("rcBtn"); return !!b&&!b.hidden; })&&await B.evaluate(()=>{ const b=document.getElementById("rcBtn"); return !!b&&!b.hidden; }));
  await A.click("#rcBtn"); await A.fill("#rcI","Salom, omad!"); await A.press("#rcI","Enter");
  ck("A yozdi → bazada rooms/<kod>/chat (u, n, t, server vaqti)",await until(A,()=>/Salom, omad!/.test(document.getElementById("rcL").innerText),null,3000)&&Object.values(H.dbGet("arena/rooms/"+code+"/chat")||{}).some(m=>m.u==="sA"&&m.n==="Ali"&&m.t==="Salom, omad!"&&typeof m.at==="number"));
  ck("B da o'qilmagan belgisi (1) va pufakcha «Ali: Salom, omad!»",await until(B,()=>{ const n=document.getElementById("rcN"); return !n.hidden&&n.textContent==="1"&&/Ali:.*Salom, omad!/.test(document.getElementById("rcBub").innerText)&&document.getElementById("rcBub").classList.contains("on"); },null,6000));
  await B.screenshot({path:"duel_chat_bubble_m.png"});
  await B.tap("#rcBtn");
  ck("B chatni ochdi: xabar ko'rinadi, belgi yo'qoldi",await until(B,()=>/Ali\s*Salom, omad!/.test(document.getElementById("rcL").innerText)&&document.getElementById("rcN").hidden,null,3000));
  await B.tap('#rcBox [data-q="👍"]');
  ck("tezkor javob 👍 → A da ko'rinadi (o'z xabari o'ngda)",await until(A,()=>[...document.querySelectorAll("#rcL .rc-m")].some(m=>/Bobur/.test(m.innerText)&&/👍/.test(m.innerText))&&!!document.querySelector("#rcL .rc-m.me"),null,6000));
  ck("telefonda chat oynasi ekranga sig'adi",await B.evaluate(()=>{ const r=document.getElementById("rcBox").getBoundingClientRect(); return r.left>=0&&r.right<=innerWidth&&r.top>=0; }));
  await B.screenshot({path:"duel_chat_m.png"}); await A.screenshot({path:"duel_chat.png"});
  await B.tap("#rcX"); await A.click("#rcX");
  /* 🤝 durang: rad etish, keyin qabul */
  await A.click("#dDraw");
  ck("A durang taklif qildi → B da «Raqib durang taklif qilmoqda»",await until(B,()=>/durang taklif qilmoqda/.test((document.querySelector(".inv-ov")||{}).innerText||""),null,8000));
  await B.tap('.inv-ov [data-a="0"]');
  ck("B rad etdi → A da tugma qayta faol",await until(A,()=>!document.getElementById("dDraw").disabled,null,8000));
  await B.tap("#dDraw");
  await until(A,()=>/durang taklif qilmoqda/.test((document.querySelector(".inv-ov")||{}).innerText||""),null,8000);
  await A.click('.inv-ov [data-a="1"]');
  ck("A qabul qildi → ikkalasida natija (150 / 150) yozildi",await until(A,()=>true,null,100)&&await (async()=>{ for(let k=0;k<30;k++){ const s=H.dbGet("arena/rooms/"+code+"/scores")||{}; if(((s.sA||{}).r1||{}).raw===150&&((s.sB||{}).r1||{}).raw===150) return true; await sleep(300); } return false; })());
  ck("o'yin tugadi → yakuniy jadval",await until(A,()=>!!document.getElementById("eh"),null,25000));
  /* 🏳 taslim — shaxmat */
  code=await duel(A,B,"chess");
  await A.click("#dRes"); await A.click('.inv-ov [data-a="1"]');
  ck("shaxmat: A taslim bo'ldi → B: «Raqib taslim bo'ldi — siz yutdingiz»",await until(B,()=>/taslim bo'ldi/.test(document.getElementById("toast")?document.getElementById("toast").innerText:"")||((((window.ROOM||{}).scores||{}).sB)||{}).r1,null,8000)&&await (async()=>{ for(let k=0;k<30;k++){ const s=H.dbGet("arena/rooms/"+code+"/scores")||{}; if(((s.sA||{}).r1||{}).raw===70&&((s.sB||{}).r1||{}).raw===320) return true; await sleep(300); } return false; })());
  ck("g'olib — B",await until(A,()=>/Bobur Karimov/.test((document.querySelector(".win")||{}).innerText||""),null,25000));
  /* raqib chiqib ketdi — to'rttalik */
  await A.evaluate(()=>{ window.__DUELGONE=9000; });
  code=await duel(A,B,"c4");
  await A.evaluate(()=>{ window.__DUELGONE=9000; });
  await B.close();
  ck("to'rttalik: B sahifani yopdi → A da ogohlantirish, keyin «Raqib o'yindan chiqib ketdi — siz yutdingiz»",await (async()=>{ for(let k=0;k<60;k++){ const s=H.dbGet("arena/rooms/"+code+"/scores")||{}; if(((s.sA||{}).r1||{}).raw===300) return true; await sleep(500); } return false; })());
  /* yolg'iz o'yinda chat yo'q */
  await home(A); await A.click('[data-solo="memory"]'); await until(A,()=>!!document.getElementById("gPause"),null,15000); await sleep(1500);
  ck("yolg'iz o'yinda chat tugmasi yo'q",await A.evaluate(()=>{ const b=document.getElementById("rcBtn"); return !b||b.hidden; }));
  const errs=[A].map(p=>p._errs.filter(e=>!/ERR_TUNNEL|Failed to load/.test(e))).flat();
  ck("JS xatolari yo'q",errs.length===0,JSON.stringify(errs).slice(0,300));
  console.log("FAILS:",H.fails()); await b.close();
})().catch(e=>{ console.log("ERR",e.message); console.log("FAILS: 1"); process.exit(1); });
