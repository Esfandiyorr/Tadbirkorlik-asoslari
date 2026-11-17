/* 🎉 Slayd uchun ball: yangi slaydga o'tilganda ekran o'rtasida katta «+N ball» animatsiyasi chiqadi
   (N = 30 ÷ slaydlar soni, pastki «Bu slayd: +N» qatori bilan bir xil). Ko'rilgan slaydga qaytganda va
   📖 o'qish rejimida (ball berilmaydi) chiqmaydi. */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const big=p=>p.evaluate(()=>{ const b=document.getElementById("rtBig"); return b?{show:b.classList.contains("show"),full:b.classList.contains("full"),txt:b.innerText.replace(/\s+/g," ").trim()}:null; });
async function bigShown(p,ms){ const t0=Date.now(); while(Date.now()-t0<(ms||4000)){ const v=await big(p); if(v&&v.show) return v; await sleep(120); } return await big(p); }
(async()=>{
  const b=await H.chromium.launch();
  try {
    const now=Date.now();
    H.addStu("sB","Bekzod","Aliyev","AP-223");
    H.dbSet("meta/access/m9",{m:"open",mt:now-60000,lim:false,at:now-60000});   /* 🟢 ball beriladi */
    const A=await H.mk(b,H.stu("sB","Bekzod","Aliyev","AP-223"),{});
    await A.goto(H.SITE+"/mavzu-9.html"); await ready(A);
    const slides=await A.evaluate(()=>document.querySelectorAll(".slide").length);
    const per=String(Math.round(3000/slides)/100).replace(".",",");
    await A.evaluate(()=>{ const x=document.getElementById("rtBig"); if(x) x.classList.remove("show"); });
    await A.keyboard.press("ArrowRight");
    let v=await bigShown(A);
    ck("yangi slayd: katta «+"+per+" ball» chiqdi",!!v&&v.show&&v.txt.indexOf("+"+per+" BALL")>=0,JSON.stringify(v));
    ck("ostida mavzu bali «… / 100»",!!v&&/mavzu bali: [\d,]+ \/ 100/.test(v.txt),JSON.stringify(v));
    await sleep(500);                                    /* paydo bo'lish animatsiyasi tugasin */
    const box=await A.evaluate(()=>{ const r=document.querySelector("#rtBig .rt-big-in").getBoundingClientRect(); return {w:r.width,h:r.height,cx:r.left+r.width/2,vw:innerWidth}; });
    ck("katta va ekran o'rtasida",box.h>=90&&Math.abs(box.cx-box.vw/2)<40,JSON.stringify(box));
    ck("bosishga xalaqit bermaydi (pointer-events: none)",await A.evaluate(()=>getComputedStyle(document.getElementById("rtBig")).pointerEvents==="none"));
    await A.screenshot({path:"slayd_ball.png"});
    await sleep(1900);
    ck("bir necha soniyada o'zi yo'qoladi",!((await big(A))||{}).show);
    /* ko'rilgan slaydga qaytish — ball yo'q, animatsiya ham yo'q */
    await A.keyboard.press("ArrowLeft"); await sleep(1200);
    ck("ko'rilgan slaydga qaytganda chiqmaydi",!((await big(A))||{}).show,JSON.stringify(await big(A)));
    /* oxirgi slaydgacha — hammasi ko'rilganda «30 ball to'liq» */
    for(let i=0;i<slides+2;i++){ await A.keyboard.press("ArrowRight"); await sleep(140); }
    v=await bigShown(A,3000);
    ck("barcha slaydlar ko'rilganda «30 ball to'liq» tabrigi",!!v&&v.full&&/30 ball to'liq/.test(v.txt),JSON.stringify(v));
    await A.close();
    /* 📖 o'qish rejimi: ball berilmaydi — katta animatsiya ham chiqmaydi */
    H.dbSet("meta/access/m9",{m:"read",mt:Date.now()-60000,lim:false,at:1});
    H.addStu("sC","Charos","Karimova","AP-223");
    const C=await H.mk(b,H.stu("sC","Charos","Karimova","AP-223"),{});
    await C.goto(H.SITE+"/mavzu-9.html"); await ready(C);
    await C.keyboard.press("ArrowRight"); await sleep(1500);
    ck("o'qish rejimida katta ball chiqmaydi",!((await big(C))||{}).show,JSON.stringify(await big(C)));
    const errs=[A,C].flatMap(p=>p._errs).filter(e=>!/^console:/.test(e)); ck("JS xatolari yo'q",errs.length===0,JSON.stringify(errs));
  } finally { await b.close(); }
  console.log('FAILS:',H.fails()); process.exitCode=H.fails()?1:0;
})().catch(e=>{ console.error(e); console.log('FAILS: 1'); process.exit(1); });
