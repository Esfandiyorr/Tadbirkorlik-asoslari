/* Topbar: TerDU, ☀️/🌙, jonli belgilar, savol va takliflar */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.$("#rtEm")) await p.evaluate(()=>document.getElementById("rtEm").remove()); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1000); }
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sA","Ali","Valiyev","AP-223"); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  ["sA","sI"].forEach(id=>H.dbSet("students/"+id+"/email","x@y.uz"));
  for(const [nm,o] of [["d",{}],["m",{mobile:true,vp:{width:390,height:844}}]]){
    const A=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"),o);
    await A.goto(H.SITE+"/index.html#2"); await ready(A); await sleep(600);
    const r=await A.evaluate(()=>{ const tb=document.querySelector(".topbar"), q=id=>document.getElementById(id), vis=e=>!!e&&getComputedStyle(e).display!=="none"&&e.getBoundingClientRect().width>0;
      return {h:Math.round(tb.getBoundingClientRect().height),brand:tb.querySelector(".brand").innerText.trim(),grid:vis(q("btnGrid")),full:vis(q("btnFull")),oldTheme:vis(q("btnTheme")),
        sw:vis(q("rtTheme")),swRight:q("rtTheme").getBoundingClientRect().right>innerWidth-80,swTop:q("rtTheme").getBoundingClientRect().top<60,
        ask:q("rtAsk")?q("rtAsk").innerText.trim():"",anim:[...tb.querySelectorAll(".tb-ic")].map(i=>i.textContent+":"+getComputedStyle(i).animationName).join(" "),
        tgl:q("tbToggle")?{d:getComputedStyle(q("tbToggle")).display,r:Math.round(innerWidth-q("tbToggle").getBoundingClientRect().right)}:null}; });
    console.log("   ",nm,JSON.stringify(r));
    ck(nm+": logo yonida «TerDU», «Termiz davlat universiteti» yo'q",r.brand==="TerDU");
    ck(nm+": «Slaydlar», «Ekran» va eski «Tun/Kun» tugmalari yo'q",!r.grid&&!r.full&&!r.oldTheme);
    ck(nm+": ☀️/🌙 almashtirgich o'ng tepada",r.sw&&r.swRight&&r.swTop);
    ck(nm+": «🙋 Savol va takliflar»",/^🙋\s*Savol va takliflar$/.test(r.ask),r.ask);
    ck(nm+": belgilar jonli (animatsiya bor)",/🙋:tbWave/.test(r.anim)&&/🏆:tbHop/.test(r.anim)&&/🎮:tbWiggle/.test(r.anim)&&/📖:tbFlip/.test(r.anim)&&/🌐:tbSpin/.test(r.anim),r.anim);
    if(nm==="m") ck("telefon: yig'ish tugmasi o'ng chetda (yozuvni to'smaydi)",r.tgl&&r.tgl.d==="flex"&&r.tgl.r<=14,JSON.stringify(r.tgl));
    await A.screenshot({path:"tb_"+nm+".png",clip:{x:0,y:0,width:o.vp?390:1280,height:o.vp?220:90}});
    /* tun/kun */
    await A.click("#rtTheme"); await sleep(500);
    ck(nm+": quyosh/oy bosilsa tungi rejim",await A.evaluate(()=>document.documentElement.getAttribute("data-theme")==="dark"&&document.getElementById("rtTheme").classList.contains("dark")));
    await A.screenshot({path:"tb_"+nm+"_dark.png",clip:{x:0,y:0,width:o.vp?390:1280,height:o.vp?220:90}});
    await A.click("#rtTheme"); await sleep(400);
    ck(nm+": qayta bosilsa kunduzgi",await A.evaluate(()=>document.documentElement.getAttribute("data-theme")==="light"));
    ck(nm+": talabada 🎨 (fon) tugmasi yo'q",!(await A.$("#rtTbBg")));
    ck(nm+": JS xatolari yo'q",!A._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length,JSON.stringify(A._errs));
  }
  /* o'qituvchi fon tanlaydi */
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true});
  await T.goto(H.SITE+"/index.html"); await ready(T); await sleep(600);
  ck("o'qituvchida 🎨 tugmasi",!!(await T.$("#rtTbBg")));
  await T.click("#rtTbBg"); await sleep(400);
  ck("fonlar ro'yxati: 15 ta (standart + 14)",await T.evaluate(()=>document.querySelectorAll("#rtTbMenu .rt-tbopt").length)===15);
  await T.screenshot({path:"tb_menu.png"});
  await T.evaluate(()=>[...document.querySelectorAll("#rtTbMenu .rt-tbopt")].find(x=>x.dataset.id==="t2").click()); await sleep(800);
  ck("tanlandi: meta/tb = t2, topbarda darhol",(H.dbGet("meta/tb")||{}).bg==="t2"&&await T.evaluate(()=>document.querySelector(".topbar").classList.contains("tbg-t2")));
  const S2=await H.mk(b,H.stu("sA","Ali","Valiyev","AP-223"));
  await S2.goto(H.SITE+"/index.html"); await ready(S2); await sleep(600);
  ck("talabada ham bo'r doskasi foni, TerDU oq",await S2.evaluate(()=>{ const tb=document.querySelector(".topbar"); return tb.classList.contains("tbg-t2")&&tb.classList.contains("tb-dk")&&getComputedStyle(tb.querySelector(".tb-name")).webkitTextFillColor==="rgb(255, 255, 255)"; }));
  await S2.screenshot({path:"tb_t2.png",clip:{x:0,y:0,width:1280,height:90}});
  for(const id of ["t1","t3","t5","t6","t7","t9","t11","t13","t14"]){ await S2.evaluate(id=>tbBgSet?0:0,id).catch(()=>{}); }
  ck("JS xatolari yo'q (o'qituvchi)",!T._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length,JSON.stringify(T._errs));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
