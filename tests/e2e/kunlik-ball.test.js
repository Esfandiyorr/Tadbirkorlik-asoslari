/* 📅 Kunlik reyting: dvigatel har talabaning kun boshidagi umumiy ballini yozadi — students/<id>/{dd, d0}.
   dd — Toshkent vaqti (UTC+5) bo'yicha bugungi sana, d0 — shu kun boshidagi ball; kunlik ball = total − d0.
   Yangi kun boshlanganda d0 = kechagi umumiy ball; shu kuni boshqa qurilmadan kirilsa ham d0 o'zgarmaydi. */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const today=()=>new Date(Date.now()+18000000).toISOString().slice(0,10);
const rec=()=>H.dbGet("students/sD")||{};
const award=async(p,keys)=>{ for(const k of keys){ await p.evaluate(k=>RT.award(k,1,"slayd"),k); await sleep(250); } await sleep(1500); };
(async()=>{
  const b=await H.chromium.launch();
  try {
    const now=Date.now();
    H.addStu("sD","Dilnoza","Rahimova","AP-223");
    H.dbSet("meta/access/m9",{m:"open",mt:now-60000,lim:false,at:now-60000});   /* 🟢 hammaga ochiq — ball beradi */
    /* 1) birinchi kun: kun boshida ball yo'q (d0 = 0), olingan ballning hammasi — kunlik */
    const A=await H.mk(b,H.stu("sD","Dilnoza","Rahimova","AP-223"),{});
    await A.goto(H.SITE+"/mavzu-9.html"); await ready(A);
    await award(A,["slide1","slide2","slide3"]);
    let r=rec();
    ck("bazada bugungi sana (Toshkent vaqti) — dd",r.dd===today(),JSON.stringify({dd:r.dd,d0:r.d0,total:r.total}));
    ck("kun boshidagi ball d0 = 0, umumiy ball o'sdi",r.d0===0&&r.total>0,JSON.stringify({d0:r.d0,total:r.total}));
    const t1=r.total;
    await A.close();
    /* 2) yangi kun: bazada kechagi sana, boshqa qurilmadan kirish — d0 = kechagi umumiy ball */
    H.dbSet("students/sD/dd","2000-01-01"); H.dbSet("students/sD/d0",0);
    const B=await H.mk(b,H.stu("sD","Dilnoza","Rahimova","AP-223"),{});
    await B.goto(H.SITE+"/mavzu-9.html"); await ready(B);
    await award(B,["slide4","slide5"]);
    r=rec();
    ck("yangi kun: dd bugunga o'tdi, d0 = kechagi umumiy ball",r.dd===today()&&r.d0===t1,JSON.stringify({dd:r.dd,d0:r.d0,t1}));
    ck("yangi kun: kunlik ball faqat bugungi slaydlar",r.total>t1&&r.total-r.d0===r.total-t1&&r.total-r.d0>0,JSON.stringify({total:r.total,d0:r.d0}));
    const t2=r.total;
    await B.close();
    /* 3) shu kuni yana bir qurilma: kun boshi bazadan olinadi, qayta hisoblanmaydi */
    const C=await H.mk(b,H.stu("sD","Dilnoza","Rahimova","AP-223"),{});
    await C.goto(H.SITE+"/mavzu-9.html"); await ready(C);
    await award(C,["slide6"]);
    r=rec();
    ck("o'sha kuni boshqa qurilma: d0 o'zgarmadi",r.dd===today()&&r.d0===t1&&r.total>t2,JSON.stringify({dd:r.dd,d0:r.d0,total:r.total,t2}));
    const errs=[A,B,C].flatMap(p=>p._errs).filter(e=>!/^console:/.test(e)); ck("JS xatolari yo'q",errs.length===0,JSON.stringify(errs));
  } finally { await b.close(); }
  console.log('FAILS:',H.fails()); process.exitCode=H.fails()?1:0;
})().catch(e=>{ console.error(e); console.log('FAILS: 1'); process.exit(1); });
