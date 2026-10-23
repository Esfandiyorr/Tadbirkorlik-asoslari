/* 🔔 Bildirishnoma: talaba fan sahifasida va «Mening ma'lumotim» da yoqadi (obuna bazaga yoziladi), holatlar
   (o'chiq / bloklangan / yoqilgan / sozlanmagan), «🧪 Sinov»; o'qituvchi e'lon yuborganda aniq natija ko'radi.
   Brauzerdagi haqiqiy push xizmati (FCM) sinovda yo'q — obuna obyekti taqlid qilinadi; Worker'ning o'zi worker.test.mjs da */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const FAKE=()=>{ /* PushManager taqlidi: subscribe/getSubscription — soxta, lekin to'g'ri ko'rinishdagi obuna */
  const sub={endpoint:"https://fcm.test/send/abc123",options:{applicationServerKey:null},toJSON(){ return {endpoint:this.endpoint,keys:{p256dh:"BPUB_KEY_TEST",auth:"AUTH_TEST"}}; },unsubscribe(){ window.__sub=null; return Promise.resolve(true); }};
  if(window.PushManager){ PushManager.prototype.getSubscription=function(){ return Promise.resolve(window.__sub||null); };
    PushManager.prototype.subscribe=function(o){ sub.options.applicationServerKey=o.applicationServerKey; window.__sub=sub; return Promise.resolve(sub); }; }
  /* ruxsat oynasi taqlidi: avval «so'ralmagan», «Ruxsat berish» bosilsa — «granted» */
  if(window.Notification&&!window.__perm){ window.__perm="default"; try{ Object.defineProperty(Notification,"permission",{configurable:true,get:()=>window.__perm});
    Notification.requestPermission=function(){ window.__perm="granted"; return Promise.resolve("granted"); }; }catch(e){} }
  window.__shown=[]; if(window.ServiceWorkerRegistration){ const sn=ServiceWorkerRegistration.prototype.showNotification;
    ServiceWorkerRegistration.prototype.showNotification=function(t,o){ window.__shown.push(t); return Promise.resolve(); }; }
};
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123"); H.addStu("sA","Ali","Valiyev","AP-223"); H.addStu("sB","Bobur","Karimov","AP-223");
  /* 1) o'qituvchi sozlamagan: fan sahifasida taklif yo'q, profilda izoh */
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{sw:true});
  await A.context().addInitScript(FAKE);
  await A.goto(H.SITE+"/index.html"); await ready(A);
  ck("sozlanmagan: fan sahifasida 🔔 bloki yo'q",await A.evaluate(()=>document.getElementById("hmPush").innerHTML===""));
  /* 2) sozlangan: «🔔 Yoqish» */
  H.dbSet("meta/push",{pub:"BAbcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-abcdefghijklmnopqrstuv",url:"https://push.test/w"});
  await A.reload(); await ready(A);
  const st=await A.evaluate(()=>{ const e=document.querySelector("#hmPush .rt-pushbox"); return e?e.className+" | "+e.innerText.replace(/\s+/g," "):""; });
  ck("fan sahifasida «🔔 E'lonlar telefoningizga kelsin — Yoqish»",/ask/.test(st)&&/Yoqish/.test(st),st);
  await A.screenshot({path:"push_home_ask.png"});
  await A.evaluate(()=>document.querySelector('#hmPush [data-pb="on"]').click()); await sleep(2500);
  const subs=H.dbGet("students/sA/push")||{};
  const k=Object.keys(subs)[0];
  ck("bosilganda obuna bazaga yozildi (students/sA/push)",!!k&&subs[k].e==="https://fcm.test/send/abc123"&&subs[k].p==="BPUB_KEY_TEST"&&subs[k].a==="AUTH_TEST",JSON.stringify(subs));
  ck("holat: «Bildirishnomalar yoqilgan ✅»",await A.evaluate(()=>/yoqilgan/.test(document.querySelector("#hmPush").innerText)&&!!document.querySelector('#hmPush [data-pb="test"]')));
  await A.evaluate(()=>document.querySelector('#hmPush [data-pb="test"]').click()); await sleep(1200);
  ck("«🧪 Sinov» — telefon bildirishnomasi ko'rsatildi",await A.evaluate(()=>window.__shown.length===1&&/TerDU/.test(window.__shown[0])));
  /* «Mening ma'lumotim» */
  await A.evaluate(()=>{ RT.open("me"); document.querySelector('.rt-tab[data-p="cv"]').click(); }); await sleep(1500);
  ck("«Mening ma'lumotim» da ham 🔔 holati",await A.evaluate(()=>/Bildirishnomalar yoqilgan/.test(document.getElementById("cvPush").innerText)));
  await A.screenshot({path:"push_cv.png"});
  /* 3) bloklangan */
  const D=await H.mk(b,H.stu("sB","Bobur","Karimov","AP-223"));
  await D.context().addInitScript(()=>{ window.__perm="denied"; Object.defineProperty(Notification,"permission",{configurable:true,get:()=>"denied"}); });
  await D.goto(H.SITE+"/index.html"); await ready(D);
  const ds=await D.evaluate(()=>document.querySelector("#hmPush").innerText.replace(/\s+/g," "));
  ck("bloklangan: qanday ochish (Ruxsatlar → Bildirishnomalar)",/bloklangan/.test(ds)&&/Ruxsatlar/.test(ds)&&/Bildirishnomalar/.test(ds),ds.slice(0,160));
  await D.screenshot({path:"push_denied.png"});
  /* 4) o'qituvchi: e'lon → natija */
  const pushes=[]; let resp={ok:true,total:3,sent:2,failed:1,removed:1};
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true}); T.on("dialog",x=>x.accept());
  await T.context().route("https://push.test/**",async r=>{ if(r.request().method()==="GET") return r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({ok:true,pub:"x",v:2})});
    pushes.push(JSON.parse(r.request().postData())); r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify(resp)}); });
  await T.goto(H.SITE+"/mavzu-6.html"); await ready(T); await T.evaluate(()=>RT.open("tc")); await sleep(3000);
  await T.evaluate(()=>document.querySelector('.rt-stab[data-p="ann"]').click()); await sleep(800);
  ck("panelda: talabalar qayerdan yoqishi yozilgan",await T.evaluate(()=>/fan sahifasida/.test(document.getElementById("pushTc").innerText)));
  await T.fill("#annTxt","Ertaga dars 09:00 da"); await T.evaluate(()=>document.getElementById("annGo").click()); await sleep(3500);
  const q=pushes.find(x=>/Yangi e'lon/.test(x.title));
  ck("e'lon → Worker'ga push so'rovi (hammaga)",!!q&&q.body==="Ertaga dars 09:00 da"&&q.only===null,JSON.stringify(q));
  ck("natija: «2 / 3 qurilmaga yetdi · 1 eskirgan obuna o'chirildi»",await T.evaluate(()=>/2 \/ 3 qurilmaga yetdi/.test(document.getElementById("pushMsg").textContent)&&/eskirgan/.test(document.getElementById("pushMsg").textContent)));
  resp={ok:true,total:0,sent:0,failed:0,removed:0};
  await T.fill("#annTxt","Ikkinchi e'lon"); await T.evaluate(()=>document.getElementById("annGo").click()); await sleep(3500);
  ck("obunachi yo'q bo'lsa: «Hech bir talaba bildirishnomani yoqmagan»",await T.evaluate(()=>/Hech bir talaba/.test(document.getElementById("pushMsg").textContent)));
  ck("JS xatolari yo'q",[A,D,T].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([A,D,T].map(p=>p._errs)).slice(0,400));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
