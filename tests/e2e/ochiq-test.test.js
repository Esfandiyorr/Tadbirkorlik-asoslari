/* ✍️ Ochiq savollar (6-mavzu yakuniy testi): 20 savol, 6 tasi ochiq — talaba javobni o'zi yozadi.
   Katta-kichik harf, kirill/lotin, bo'shliq, belgi farq qilmaydi; 6+ harfli so'zda bitta harf xatosi kechiriladi; son javobda
   faqat raqamlar solishtiriladi; noto'g'ri javob rad etiladi; to'g'ri javob ball beradi; inglizcha rejimda ham ishlaydi */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const openBoxes=p=>p.evaluate(()=>[...document.querySelectorAll("#testWrap .qbox")].map((b,i)=>({i,t:b.querySelector(".q").innerText,open:!!b.querySelector(".qin")})));
async function say(p,i,v){ await p.evaluate(([i,v])=>{ const bx=document.querySelectorAll("#testWrap .qbox")[i], inp=bx.querySelector(".qin"); inp.value=v; inp.dispatchEvent(new Event("input")); bx.querySelector(".qin-go").click(); },[i,v]); await sleep(300); }
(async()=>{
  const b=await H.chromium.launch();
  H.addStu("sA","Ali","Valiyev","AP-223"); H.addStu("sB","Bobur","Karimov","AP-223");
  H.dbSet("meta/access/m6",{lim:true,g:{"AP-223":Date.now()-60000}});
  const p=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{}); p.on("dialog",d=>d.accept());
  await p.goto(H.SITE+"/mavzu-6.html#24"); await ready(p);
  const info=await p.evaluate(()=>({slides:document.querySelectorAll(".slide").length,start:(document.querySelector(".qt-start")||{}).innerText||""}));
  ck("6-mavzu: 24 slayd, test kartasida 20 savol, 20 daqiqa va ochiq savol haqida izoh",info.slides===24&&/20\s*savol/.test(info.start)&&/20\s*daqiqa/.test(info.start)&&/javobni o'zingiz yozasiz/.test(info.start),info.start.replace(/\s+/g," ").slice(0,200));
  await p.click("#qtGo"); await sleep(800);
  const bx=await openBoxes(p);
  ck("20 ta savol, 6 tasi ochiq (yozish maydoni bilan)",bx.length===20&&bx.filter(x=>x.open).length===6,JSON.stringify(bx.map(x=>x.open?1:0)));
  const ans=[[/haq qanday/i,"Роялти",true],[/3 harfli/i,"ltv",true],[/inglizcha bitta so'z/i,"Churn!",true],[/Zararsizlik nuqtasi oyiga/i,"800 ta",true],[/effekti/i,"obuna",false],[/Spotify/i,"fremium",true]];
  for(const x of bx.filter(x=>x.open)){ const m=ans.find(a=>a[0].test(x.t)); await say(p,x.i,m?m[1]:"?"); }
  const st=await p.evaluate(()=>({right:document.querySelectorAll("#testWrap .opt.right").length,wrong:document.querySelectorAll("#testWrap .opt.wrong").length,bar:document.querySelector(".scorebar").innerText.replace(/\s+/g," ")}));
  ck("kirillcha «Роялти», «ltv», «Churn!», «800 ta», xatoli «fremium» — to'g'ri; «obuna» (tarmoq effekti o'rniga) — noto'g'ri",st.right===5&&st.wrong===1&&/To'g'ri: 5/.test(st.bar),JSON.stringify(st));
  await sleep(1500);
  const acts=Object.keys(((H.dbGet("students/sA/prog/m6")||{}).ac)||{}).length||Object.keys((((H.dbGet("students/sA")||{}).topics||{}).m6||{}).acts||{}).length;
  ck("to'g'ri ochiq javoblar ball beradi (5 ta test kaliti saqlandi)",await p.evaluate(()=>{ const t=RT.points().topics.m6||{}; return Object.keys(t.acts||{}).filter(k=>/^test\d+$/.test(k)).length===5; }),String(acts));
  ck("javob berilgan ochiq savolda maydon qolmaydi, yozilgan javob ko'rinadi",await p.evaluate(()=>document.querySelectorAll("#testWrap .qin").length===0&&/Роялти/.test(document.getElementById("testWrap").innerText)));
  /* bo'sh javob yuborilmaydi */
  const q=await H.mk(b,H.stu("sB","Bobur","Karimov","AP-223"),{}); q.on("dialog",d=>d.accept());
  await q.goto(H.SITE+"/mavzu-6.html#24"); await ready(q); await q.click("#qtGo"); await sleep(800);
  const qb=(await openBoxes(q)).filter(x=>x.open)[0];
  await say(q,qb.i,"   ");
  ck("bo'sh javob qabul qilinmaydi (maydon qoladi)",await q.evaluate(i=>!!document.querySelectorAll("#testWrap .qbox")[i].querySelector(".qin"),qb.i));
  /* inglizcha rejim */
  await q.click("#btnLang"); await sleep(600);
  const en=await q.evaluate(()=>({ph:(document.querySelector("#testWrap .qin")||{}).placeholder,go:(document.querySelector("#testWrap .qin-go")||{}).textContent}));
  ck("inglizcha: «Your answer…» va «Answer»",en.ph==="Your answer…"&&en.go==="Answer",JSON.stringify(en));
  const eb=(await openBoxes(q)).find(x=>x.open&&/break-even/i.test(x.t));
  await say(q,eb.i,"800");
  ck("inglizcha rejimda ham son javob to'g'ri qabul qilinadi",await q.evaluate(()=>document.querySelectorAll("#testWrap .opt.right").length===1));
  ck("JS xatolari yo'q",[...p._errs,...q._errs].filter(e=>!/ERR_TUNNEL|Failed to load/.test(e)).length===0,JSON.stringify([p._errs,q._errs]));
  await p.screenshot({path:"ochiq_test.png"});
  console.log("FAILS:",H.fails()); await b.close();
})().catch(e=>{ console.log("ERR",e.message); console.log("FAILS: 1"); process.exit(1); });
