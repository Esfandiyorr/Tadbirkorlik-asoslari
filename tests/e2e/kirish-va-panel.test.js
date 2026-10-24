/* Kirish (fan sahifasi: mavzular, «bu hafta» eslatmasi), «Menga nima qoldi?», reytingda guruh filtri, chat (token, server vaqti), mavzu ochilganda push va Worker yangilash */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const rowCls=(p,re)=>p.evaluate(re=>{ const r=[...document.querySelectorAll("#rtTop tbody tr")].find(r=>new RegExp(re).test(r.innerText)); return r?r.className:null; },re);
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  const N=[["sA","Ali","Valiyev","AP-223",9],["sB","Bobur","Karimov","AP-223",7],["sC","Charos","Usmonova","FIZ-21",8],["sD","Dilnoza","Rahimova","FIZ-21",6],["sE","Eldor","Tursunov","AP-223",3]];
  N.forEach(([id,n,s,g,m])=>{ H.addStu(id,n,s,g); H.dbSet("students/"+id+"/manual",{m1:m}); });
  H.dbSet("meta/access/m6",{lim:true,g:{"AP-223":Date.now()-60000}});   /* 1 daqiqa oldin (dushanba 00:00 dan keyin ham ishlasin) */
  /* e'lon (bir martalik oynalar ham bo'lsin) */
  H.dbSet("meta/ann",{a1:{at:Date.now()-60000,t:"Salom talabalar"}});
  /* 1) kirish: tadbirkorlik-asoslari.html — «Tadbirkorlik asoslari» fan sahifasi; avtomatik o'tish yo'q, talaba o'zi tanlaydi */
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{land:true,ro:true});
  const urls=[]; A.on("framenavigated",f=>{ if(f===A.mainFrame()) urls.push(f.url().replace(H.SITE,"")); });
  await A.goto(H.SITE+"/tadbirkorlik-asoslari.html"); await ready(A); await sleep(2500);
  ck("fan sahifasi, boshqa sahifaga o'tib ketmadi",/\/tadbirkorlik-asoslari\.html$/.test(A.url())&&urls.every(u=>/^\/tadbirkorlik-asoslari\.html/.test(u))&&await A.evaluate(()=>/Tadbirkorlik asoslari/.test(document.querySelector(".hm-hero").innerText)),A.url()+" "+JSON.stringify(urls));
  ck("o'qish rejimi oynasi chiqmadi",!(await A.$("#rtRoG"))&&!(await A.$("#rtRO")));
  const wk=await A.evaluate(()=>{ const w=document.querySelector(".hm-week"); return w?w.innerText.replace(/\s+/g," "):""; });
  ck("eslatma: «Bu hafta ball beradigan mavzu» — 6-mavzu, yakshanba 23:59 gacha",/Bu hafta ball beradigan mavzu/.test(wk)&&/Biznes-model/.test(wk)&&/yakshanba 23:59 gacha/.test(wk)&&/Ishlash/.test(wk),wk.slice(0,200));
  const cards=await A.evaluate(()=>[...document.querySelectorAll(".hm-card")].map(c=>c.dataset.t+":"+(c.classList.contains("score")?"score":c.classList.contains("read")?"read":"lock")+":"+(c.tagName==="A"?c.getAttribute("href"):"-")));
  ck("kartochkalar: 1–5 📖 o'qish, 6 🟢 ball, 7–15 🔒 (havolasiz)",cards.length===15&&cards.slice(0,5).every((c,i)=>c==="m"+(i+1)+":read:mavzu-"+(i+1)+".html")&&cards[5]==="m6:score:mavzu-6.html"&&cards.slice(6).every(c=>/:lock:-$/.test(c)),JSON.stringify(cards));
  await A.screenshot({path:"home.png",fullPage:true});
  /* 📖 o'qish: kartochka → 1-mavzu, oyna emas — qisqa xabar */
  await A.click('.hm-card[data-t="m1"]'); await A.waitForURL(/mavzu-1\.html/); await ready(A);
  ck("1-mavzu kartochkasi → mavzu-1.html, o'qish rejimi (oyna emas, 📖 belgi)",/mavzu-1\.html/.test(A.url())&&!(await A.$("#rtRoG"))&&!!(await A.$("#rtRO")));
  await A.click("#rtNavBtn"); await sleep(300);
  ck("mavzular ro'yxatida «🏠 Fan sahifasi»",await A.evaluate(()=>{ const h=document.querySelector("#rtNavMenu .rt-navhome"); return !!h&&h.getAttribute("href")==="tadbirkorlik-asoslari.html"; }));
  await A.keyboard.press("Escape");
  /* 🟢 ishlash: eslatmadagi 6-mavzu */
  await A.goto(H.SITE+"/tadbirkorlik-asoslari.html"); await ready(A);
  await A.click(".hm-wk-i"); await A.waitForURL(/mavzu-6\.html/); await ready(A);
  ck("eslatmadagi «Ishlash» → mavzu-6.html, ball beriladi",/mavzu-6\.html/.test(A.url())&&!(await A.$("#rtRO"))&&!!(await A.$("#rtTodo")));
  /* eski havola: index.html#5 → 1-mavzuning 5-slaydi */
  const O=await H.mk(b,H.stu("sB","Bobur","Karimov","AP-223"));
  await O.goto(H.SITE+"/index.html#5"); await O.waitForURL(/mavzu-1\.html#5/,{timeout:10000}).catch(()=>{});
  ck("eski havola index.html#5 → mavzu-1.html#5",/mavzu-1\.html#5$/.test(O.url()),O.url());
  await O.context().close();
  /* 2) «Menga nima qoldi?» */
  await ready(A); if(await A.$("#rtAnnGo")) { await A.click("#rtAnnGo"); await sleep(300); }
  const chip=await A.evaluate(()=>{ const c=document.getElementById("rtTodo"); return c?c.textContent.replace(/\s+/g," ").trim():""; });
  ck("topbarda ⏳ qolgan vaqt chipi",/⏳/.test(chip)&&/(kun|soat|daq)/.test(chip),chip);
  await A.click("#rtTodo"); await sleep(400);
  const pt=await A.evaluate(()=>{ const p=document.getElementById("rtTodoP"); return p?p.innerText.replace(/\s+/g," "):""; });
  ck("panel: «Menga nima qoldi?», muddat, slaydlar, vaqt, test",/Menga nima qoldi/.test(pt)&&/Ball tugashiga/.test(pt)&&/yakshanba 23:59/.test(pt)&&/Slaydlar: \d+ \/ 18/.test(pt)&&/O'qish vaqti/.test(pt)&&/Test: 0 \/ 15/.test(pt),pt.slice(0,300));
  const unseen0=await A.evaluate(()=>document.querySelectorAll("#rtTodoP .rt-todo-sl button").length);
  await A.screenshot({path:"todo.png"});
  await A.evaluate(()=>document.querySelector('#rtTodoP .rt-todo-sl button[data-s="5"]').click()); await sleep(1200);
  ck("ko'rilmagan slayd bosilsa — o'sha slaydga o'tadi va ro'yxatdan chiqadi",/#6$/.test(A.url())&&await A.evaluate(()=>!!RT.points().topics.m6.slides.slide5),A.url());
  await A.click("#rtTodo"); await sleep(400);
  const unseen1=await A.evaluate(()=>document.querySelectorAll("#rtTodoP .rt-todo-sl button").length);
  ck("ko'rilmaganlar soni kamaydi",unseen1<unseen0,unseen0+" → "+unseen1);
  await A.evaluate(()=>document.querySelector("#rtTodoP .rt-todo-go").click()); await sleep(1200);
  ck("«Testga o'tish» — test slaydi",await A.evaluate(()=>{ const s=[...document.querySelectorAll(".slide")]; const i=s.findIndex(x=>x.querySelector("#testWrap")); return location.hash==="#"+(i+1); }));
  /* o'qish rejimidagi mavzuda chip yo'q */
  await A.goto(H.SITE+"/mavzu-3.html"); await ready(A);
  ck("o'qish rejimidagi mavzuda ⏳ chip yo'q",!(await A.$("#rtTodo"))&&!!(await A.$("#rtRO")));
  /* 3) reytingda «Mening guruhim» */
  await A.evaluate(()=>RT.open("top")); await sleep(2500);
  const f0=await A.evaluate(()=>[...document.querySelectorAll(".rt-topg")].map(x=>x.textContent.replace(/\s+/g," ").trim()));
  ck("filtr: «Hammasi» va «Mening guruhim · AP-223»",f0.length===2&&/Hammasi/.test(f0[0])&&/Mening guruhim · AP-223 3/.test(f0[1]),JSON.stringify(f0));
  await A.evaluate(()=>document.querySelector('.rt-topg[data-g="AP-223"]').click()); await sleep(500);
  const rows=await A.evaluate(()=>[...document.querySelectorAll("#rtTop tbody tr")].map(r=>r.innerText.replace(/\s+/g," ").trim()));
  ck("faqat AP-223: 3 talaba, guruh ichidagi o'rin va «umumiy»",rows.length===3&&/^1 umumiy 1 Ali/.test(rows[0])&&/^2 umumiy 3 Bobur/.test(rows[1])&&/^3 umumiy 5 Eldor/.test(rows[2]),JSON.stringify(rows));
  await A.screenshot({path:"topg.png"});
  await A.reload(); await ready(A); await A.evaluate(()=>RT.open("top")); await sleep(2500);
  ck("tanlov eslab qolindi",await A.evaluate(()=>document.querySelector(".rt-topg.on").dataset.g)==="AP-223");
  await A.evaluate(()=>document.querySelector('.rt-topg[data-g=""]').click()); await sleep(400);
  ck("«Hammasi» — 5 talaba, sovrinlar bilan",await A.evaluate(()=>document.querySelectorAll("#rtTop tbody tr").length)===5&&/rt-p1/.test(await rowCls(A,"Ali")));
  await A.keyboard.press("Escape");
  /* 4) chat: xabar token bilan yoziladi, server vaqti */
  const sent=[]; A.context().on("request",r=>{ if(/\/chat\/c\d+_/.test(r.url())&&r.method()==="PUT") sent.push(r.url()); });
  await A.evaluate(()=>CH.open()); await sleep(800);
  await A.fill("#chTa","Assalomu alaykum"); await A.evaluate(()=>document.getElementById("chSend").click()); await sleep(1500);
  const ch=Object.values(H.dbGet("chat")||{});
  ck("chat: xabar yozildi, vaqti server soati (raqam)",ch.length===1&&ch[0].t==="Assalomu alaykum"&&typeof ch[0].at==="number"&&Math.abs(ch[0].at-Date.now())<60000,JSON.stringify(ch));
  ck("chat so'rovi Firebase kaliti (auth) bilan ketdi",sent.length===1&&/auth=/.test(sent[0]),JSON.stringify(sent));
  /* 5) o'qituvchi 6-mavzuni FIZ-21 ga ochadi → push faqat FIZ talabalariga */
  const pushes=[];
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true}); T.on("dialog",x=>x.accept());
  await T.context().route("https://push.test/**",async r=>{ if(r.request().method()==="GET") return r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true,pub:"PUB",v:2})});
    const q=JSON.parse(r.request().postData()); pushes.push(q); r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify(q.kind==="remind"?{ok:true,kind:"remind",students:2,sent:3}:{ok:true,sent:(q.only||[]).length})}); });
  H.dbSet("meta/push",{pub:"PUB",url:"https://push.test/w"});
  await T.goto(H.SITE+"/mavzu-6.html"); await ready(T);
  await T.evaluate(()=>{ window.__TC_TOKEN_OK=1; }); await T.evaluate(()=>RT.open("tc")); await sleep(3000);
  await T.evaluate(()=>document.querySelector('#accTc [data-t="m6"]').click()); await sleep(400);
  await T.evaluate(()=>[...document.querySelectorAll("#accTc .rt-accg")].find(x=>x.dataset.g==="FIZ-21").click()); await sleep(2000);
  const pq=pushes.find(q=>/6-mavzu ochildi/.test(q.title));
  ck("mavzu ochilganda push: «6-mavzu ochildi», faqat FIZ-21 talabalari, 6-mavzu sahifasi",!!pq&&JSON.stringify((pq.only||[]).sort())==='["sC","sD"]'&&/mavzu-6\.html$/.test(pq.url)&&/yakshanba 23:59 gacha/.test(pq.body),JSON.stringify(pq));
  await T.evaluate(()=>document.querySelector('.rt-stab[data-p="ann"]').click()); await sleep(600);
  const pv=await T.evaluate(()=>{ const e=document.getElementById("pushVer"); return e?e.textContent:""; });
  ck("panel: Worker v2 aniqlandi",/Worker yangilangan/.test(pv),pv);
  await T.evaluate(()=>document.getElementById("pushRemind").click()); await sleep(1500);
  ck("«⏰ Eslatmani hozir yuborish» → kind:remind",pushes.some(q=>q.kind==="remind")&&/Eslatma: 2 talaba/.test(await T.evaluate(()=>document.getElementById("pushMsg").textContent)));
  await T.evaluate(()=>{ document.getElementById("pushOld").value='const VAPID_PUB = "PUB";\nconst VAPID_PRIV = "PRIVKEY";\nconst DB = "https://x.firebaseio.com";\nconst API_KEY = "AK";\nconst TEACHER_H = "HH";\n// eski kod'; document.getElementById("pushMerge").click(); });
  await sleep(1200);
  const code=await T.evaluate(()=>{ const t=document.getElementById("pushCode2"); return t?t.value:""; });
  ck("Worker kodini yangilash: kalitlar saqlangan, sayt manzili qo'yilgan, cron qismi bor",/const VAPID_PRIV = "PRIVKEY"/.test(code)&&/const VAPID_PUB = "PUB"/.test(code)&&code.indexOf('const SITE = "'+H.SITE+'/"')>=0&&/async scheduled/.test(code)&&!/__[A-Z_]+__/.test(code.replace(/"__"\+/g,"")),code.slice(0,200));
  await T.screenshot({path:"push_panel.png",fullPage:false});
  ck("JS xatolari yo'q",[A,T].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([A,T].map(p=>p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)))).slice(0,500));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
