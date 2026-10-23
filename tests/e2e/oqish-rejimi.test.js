/* 📖 O'qish rejimi va yakshanbagacha ball: ogohlantirish, test/PDF yopiq, o'qituvchi mavzuni ochadi, muddat o'tishi */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const DAY=86400000;
/* ball muddati matni (sayt bilan bir xil hisob): bugun ochilgan mavzu — shu haftaning yakshanbasi 23:59 */
const DUE=(()=>{ const n=Date.now(), d=new Date(n+18000000), day0=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
  const e=new Date(day0+((7-d.getUTCDay())%7+1)*86400000-60000);
  return e.getUTCDate()+"-"+["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"][e.getUTCMonth()]+", yakshanba 23:59"; })();

const ptsOf=id=>{ const p=H.dbGet("students/"+id+"/prog")||{}; return JSON.stringify(p); };
const go=async(p,f)=>{ await p.goto(H.SITE+"/"+f); await ready(p); };
const next=async(p,n)=>{ for(let i=0;i<n;i++){ await p.keyboard.press("ArrowRight"); await sleep(350); } };
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  H.addStu("sA","Ali","Valiyev","AP-223"); H.addStu("sF","Farhod","Karimov","FIZ-21");
  /* oldin to'plangan ballar (m1 da 3 slayd + vaqt) */
  H.dbSet("students/sA/prog/m1",{sl:{slide0:1,slide1:1,slide2:1},tm:{legacy:600}});
  H.dbSet("meta/access/m3",{lim:true,g:{"AP-223":true}});           /* eski yozuv (true) */
  /* 1) 1-mavzu: o'qish rejimi */
  const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{ro:true}); await go(A,"index.html");
  const g=await A.evaluate(()=>{ const e=document.getElementById("rtRoG"); return e?e.innerText.replace(/\s+/g," "):""; });
  ck("1-mavzu: «Bu taqdimot o'qish rejimida» ogohlantirishi chiqdi",/o'qish rejimida/.test(g)&&/ball berilmaydi/.test(g),g.slice(0,200));
  await A.screenshot({path:"ro_notice.png"});
  await A.click("#rtRoOk"); await sleep(300);
  ck("topbarda «📖 O'qish rejimi» belgisi",await A.evaluate(()=>{ const c=document.getElementById("rtRO"); return !!c&&/O'qish rejimi/.test(c.textContent)&&c.getBoundingClientRect().width>0; }));
  ck("o'qish rejimida «PDF» tugmasi yo'q",await A.evaluate(()=>{ const b=document.getElementById("btnPrint"); return !b||getComputedStyle(b).display==="none"; }));
  const before=ptsOf("sA"), tot0=await A.evaluate(()=>RT.points().total);
  await next(A,6); await sleep(1500);
  await A.evaluate(()=>{ try{ RT.award("slide9",1,"slayd"); }catch(e){} });
  await sleep(500);
  const tot1=await A.evaluate(()=>RT.points().total);
  ck("slayd varaqlansa ham ball qo'shilmadi",tot1===tot0,tot0+" → "+tot1);
  /* test slaydi */
  const tst=await A.evaluate(()=>{ const go=document.getElementById("qtGo"), st=document.querySelector(".qt-start");
    return {hidden:!go||getComputedStyle(go).display==="none", msg:st?getComputedStyle(st,"::after").content:""}; });
  ck("test tugmasi yashirin, o'rnida «o'qish rejimida — test ishlanmaydi»",tst.hidden&&/o'qish rejimida/.test(tst.msg),JSON.stringify(tst));
  await A.evaluate(()=>{ const s=[...document.querySelectorAll(".slide")]; const i=s.findIndex(x=>x.querySelector("#testWrap")); if(window.go) window.go(i); });
  await sleep(600); await A.screenshot({path:"ro_test.png"});
  /* ro'yxat */
  await A.click("#rtNavBtn"); await sleep(300);
  const nav=await A.evaluate(()=>[...document.querySelectorAll("#rtNavMenu .rt-navi")].slice(0,7).map(x=>x.textContent.replace(/\s+/g," ").trim()));
  ck("menyuda 1–5 📖 «o'qish», 6-mavzu 🔒",nav.slice(1,5).every(t=>/^📖/.test(t)&&/o'qish/.test(t))&&/^🔒/.test(nav[5]),JSON.stringify(nav));
  await A.screenshot({path:"ro_nav.png"}); await A.keyboard.press("Escape");
  await sleep(4000);
  ck("bazadagi eski ballar o'zgarmadi (m1)",JSON.stringify(H.dbGet("students/sA/prog/m1/sl"))==='{"slide0":1,"slide1":1,"slide2":1}',JSON.stringify(H.dbGet("students/sA/prog/m1")));
  /* 3-mavzu (eski true yozuv) ham o'qish rejimida; FIZ talabasi ham 5-mavzuni o'qiy oladi */
  const F=await H.mk(b,H.stu("sF","Farhod","Karimov","FIZ-21"),{ro:true}); await go(F,"mavzu-5.html");
  ck("FIZ: 5-mavzu ochiq, o'qish rejimida (masala tugmasi yashirin)",await F.evaluate(()=>!document.getElementById("rtAcc")&&!!document.getElementById("rtRoG")&&getComputedStyle(document.getElementById("msGo")).display==="none"));
  await F.click("#rtRoOk"); await sleep(200);
  await go(F,"mavzu-4.html"); await sleep(300);
  ck("4-mavzu: krossvord tugmasi yashirin",await F.evaluate(()=>getComputedStyle(document.getElementById("xwGo")).display==="none"&&/o'qish rejimida/.test(getComputedStyle(document.querySelector(".xw-start"),"::after").content)));
  /* 2) 6-mavzu: hali yopiq */
  await go(A,"mavzu-6.html");
  ck("6-mavzu ochilmaguncha yopiq (🔒 oynasi)",await A.evaluate(()=>!!document.getElementById("rtAcc")&&!document.getElementById("rtRO")));
  /* o'qituvchi 6-mavzuni AP-223 ga ochadi */
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true}); T.on("dialog",x=>x.accept());
  await go(T,"mavzu-6.html"); await T.evaluate(()=>RT.open("tc")); await sleep(3000);
  await T.evaluate(()=>{ const b=document.querySelector('.rt-stab[data-p="mk"]')||[...document.querySelectorAll(".rt-stab")].find(x=>/Baholash/.test(x.textContent)); if(b) b.click(); }); await sleep(1500);
  const hasAcc=await T.$("#accTc .rt-acc");
  if(!hasAcc){ console.log("   tablar:",await T.evaluate(()=>[...document.querySelectorAll(".rt-stab")].map(x=>x.dataset.p+":"+x.textContent).join(" | "))); }
  await T.evaluate(()=>{ const x=document.querySelector('#accTc [data-t="m1"]'); if(x) x.click(); }); await sleep(400);
  const m1=await T.evaluate(()=>{ const r=document.querySelector("#accTc"); return r?r.innerText.replace(/\s+/g," "):""; });
  ck("o'qituvchi: 1-mavzu 📖, «hammaga o'qish rejimida» izohi",/📖 1-mavzu/.test(m1)&&/o'qish rejimida/.test(m1),m1.slice(0,300));
  await T.evaluate(()=>document.querySelector('#accTc [data-t="m6"]').click()); await sleep(400);
  await T.evaluate(()=>[...document.querySelectorAll("#accTc .rt-accg")].find(x=>x.dataset.g==="AP-223").click()); await sleep(1500);
  const v=H.dbGet("meta/access/m6/g/AP-223");
  ck("bazada ochilgan vaqt (server soati) yozildi",typeof v==="number"&&Math.abs(v-Date.now())<60000,JSON.stringify(H.dbGet("meta/access/m6")));
  const chipTxt=await T.evaluate(()=>[...document.querySelectorAll("#accTc .rt-accg")].find(x=>x.dataset.g==="AP-223").textContent);
  ck("chip: 🟢 AP-223 ⏳ "+DUE,/🟢/.test(chipTxt)&&chipTxt.indexOf(DUE)>=0,chipTxt);
  await T.screenshot({path:"ro_tc.png"});
  /* talaba: ball beriladi */
  await go(A,"mavzu-6.html"); await sleep(500);
  ck("6-mavzu ochildi, o'qish rejimi emas",await A.evaluate(()=>!document.getElementById("rtAcc")&&!document.getElementById("rtRO")&&!document.body.classList.contains("rt-ro")));
  const s0=await A.evaluate(()=>RT.points().topics.m6?Object.keys(RT.points().topics.m6.slides||{}).length:0);
  await next(A,3); await sleep(800);
  const s1=await A.evaluate(()=>Object.keys((RT.points().topics.m6||{}).slides||{}).length);
  ck("6-mavzuda slayd ballari yozilmoqda",s1>s0&&s1>=3,s0+" → "+s1);
  ck("ball beriladigan mavzuda «PDF» tugmasi bor",await A.evaluate(()=>{ const b=document.getElementById("btnPrint"); return !!b&&getComputedStyle(b).display!=="none"; }));
  ck("test tugmasi ko'rinadi",await A.evaluate(()=>{ const s=[...document.querySelectorAll(".slide")]; return !!document.querySelector(".qt-start")&&!document.body.classList.contains("rt-ro"); }));
  const tp=await A.evaluate(()=>{ RT.open("tp"); return new Promise(r=>setTimeout(()=>r(document.getElementById("rtTp").innerText.replace(/\s+/g," ")),600)); });
  ck("«Mavzular»: 6-mavzu «ball "+DUE+" gacha», 1-mavzu 📖",tp.indexOf("ball "+DUE+" gacha")>=0&&/O'qish rejimi/.test(tp)&&!/📥 PDF/.test(tp.split("M4")[0]),tp.slice(0,400));
  await A.screenshot({path:"ro_tp.png"});
  /* FIZ hali 6-mavzuni ko'rmaydi */
  await go(F,"mavzu-6.html");
  ck("FIZ: 6-mavzu hali yopiq (muddat tugamagan)",await F.evaluate(()=>!!document.getElementById("rtAcc")));
  /* 3) yakshanba o'tdi: 8 kun oldin ochilgan */
  H.dbSet("meta/access/m6/g/AP-223",Date.now()-8*DAY);
  await go(A,"mavzu-6.html");
  ck("muddat o'tgach: 6-mavzu o'qish rejimida",await A.evaluate(()=>document.body.classList.contains("rt-ro")&&!!document.getElementById("rtRO")));
  const s2=await A.evaluate(()=>Object.keys((RT.points().topics.m6||{}).slides||{}).length);
  await A.evaluate(()=>document.getElementById("rtRoG")&&document.getElementById("rtRoOk").click());
  await next(A,4); await sleep(800);
  const s3=await A.evaluate(()=>Object.keys((RT.points().topics.m6||{}).slides||{}).length);
  ck("o'qish rejimida yangi slayd ballari yo'q, avvalgilari saqlangan",s3===s2&&s2>=3,s2+" → "+s3);
  await go(F,"mavzu-6.html");
  ck("FIZ: endi 6-mavzuni o'qish rejimida o'qiy oladi",await F.evaluate(()=>!document.getElementById("rtAcc")&&document.body.classList.contains("rt-ro")));
  /* o'qituvchi chipda 📖, bosilsa yana yakshanbagacha */
  await T.evaluate(()=>RT.open("tc")); await sleep(2500);
  await T.evaluate(()=>{ const b=[...document.querySelectorAll(".rt-stab")].find(x=>/Baholash/.test(x.textContent)); if(b) b.click(); }); await sleep(1200);
  await T.evaluate(()=>document.querySelector('#accTc [data-t="m6"]').click()); await sleep(400);
  const c2=await T.evaluate(()=>[...document.querySelectorAll("#accTc .rt-accg")].find(x=>x.dataset.g==="AP-223").textContent);
  ck("o'qituvchi: AP-223 chipi 📖",/📖/.test(c2),c2);
  await T.evaluate(()=>[...document.querySelectorAll("#accTc .rt-accg")].find(x=>x.dataset.g==="AP-223").click()); await sleep(1500);
  ck("📖 bosildi → yana ball (yangi vaqt)",Math.abs(H.dbGet("meta/access/m6/g/AP-223")-Date.now())<60000);
  /* 4) jonli o'tish: sahifa ochiq turganda yakshanba 23:59:59 o'tadi */
  const sunEnd=(()=>{ const n=Date.now(), d=new Date(n+18000000), day0=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()); return day0+((7-d.getUTCDay())%7+1)*DAY-18000000; })();
  const L=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),{ro:true});
  await L.addInitScript(e=>{ const rn=Date.now.bind(Date), off=e-8000-rn(); Date.now=()=>rn()+off; },sunEnd);
  await go(L,"mavzu-6.html");
  ck("yakshanba 23:59:52 — hali ball beriladi",await L.evaluate(()=>!document.body.classList.contains("rt-ro")));
  await sleep(11000);
  ck("00:00 dan keyin sahifa o'zi o'qish rejimiga o'tdi (ogohlantirish bilan)",await L.evaluate(()=>document.body.classList.contains("rt-ro")&&!!document.getElementById("rtRoG")));
  /* telefon */
  const M=await H.mk(b,H.stu("sF","Farhod","Karimov","FIZ-21"),{ro:true,mobile:true,vp:{width:390,height:844}}); await go(M,"mavzu-2.html");
  await M.screenshot({path:"ro_m_notice.png"}); await M.click("#rtRoOk"); await sleep(300);
  ck("telefon: belgi ko'rinadi, gorizontal siljish yo'q",await M.evaluate(()=>{ const c=document.getElementById("rtRO"), r=c&&c.getBoundingClientRect(); return !!r&&r.width>0&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth+1; }));
  await M.screenshot({path:"ro_m.png"});
  const D=await H.mk(b,H.stu("sF","Farhod","Karimov","FIZ-21"),{theme:"dark"}); await go(D,"mavzu-3.html"); await sleep(300); await D.screenshot({path:"ro_dark.png"});
  ck("JS xatolari yo'q",[A,F,T,L,M,D].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([A,F,T,L,M,D].map(p=>p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)))).slice(0,500));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
