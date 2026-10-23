/* Reyting jadvali ixcham, telefonda yon tomonga surilmaydi */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.$("#rtEm")) await p.evaluate(()=>document.getElementById("rtEm").remove()); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const N=["Ali Valiyev","Bobur Karimov","Charos Usmonova","Dilnoza Rahimova","Eldor Tursunov","Feruza Nazarova","Gulnoza Saidova","Hasan Qodirov","Iroda Ergasheva","Jasur Xolmatov","Kamola Yusupova","Laziz Abdullayev"];
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  N.forEach((n,i)=>{ const [a,c]=n.split(" "); const id="s"+i; H.addStu(id,a,c,i%2?"FIZ-223":"AP-223"); H.dbSet("students/"+id+"/email","x@y.uz");
    H.dbSet("students/"+id+"/prog/m1",{sl:Object.fromEntries([...Array(18-i)].map((_,k)=>["slide"+k,1])),ac:Object.fromEntries([...Array(Math.max(0,12-i))].map((_,k)=>["test"+k,5])),tm:{d1:3600-200*i},qa:1}); });
  H.dbSet("students/s1/ns",{f:"n2",b:"b6",g:"fl-uz"}); H.dbSet("meta/nick",{s1:"Biznes_Sher"});
  for(const [nm,o] of [["d",{}],["m",{mobile:true,vp:{width:390,height:844}}]]){
    const A=await H.mk(b,H.stu("s0","Ali","Valiyev","AP-223"),o);
    await A.goto(H.SITE+"/index.html"); await ready(A); await A.evaluate(()=>RT.open("top")); await sleep(2500);
    const r=await A.evaluate(()=>{ const rows=[...document.querySelectorAll("#rtTop tbody tr")]; const hs=rows.map(x=>x.getBoundingClientRect().height);
      const W=innerWidth, over=rows.some(x=>{ const q=x.getBoundingClientRect(); return q.right>W+1||[...x.children].some(c=>c.getBoundingClientRect().right>W+1); });
      return {n:rows.length,hmax:Math.max(...hs),hmin:Math.min(...hs),over,page:document.documentElement.scrollWidth<=W+1}; });
    console.log("   ",nm,JSON.stringify(r));
    ck(nm+": 12 qator, hech biri ekrandan chiqmaydi",r.n===12&&!r.over&&r.page,JSON.stringify(r));
    ck(nm+": qatorlar ixcham (eng balandi ≤ "+(nm==="d"?64:66)+"px)",r.hmax<=(nm==="d"?64:66),r.hmax);
    if(nm==="m"){ const t=await A.evaluate(()=>{ const r=document.querySelector("#rtTop tbody tr"); return r.innerText.replace(/\s+/g," ")+" | "+[...r.querySelectorAll("td[data-l]")].map(td=>getComputedStyle(td,"::before").content).join(","); });
      ck("telefonda qatorda: ism, ball, guruh, «baho», «dars» belgilari",/AP-223|FIZ-223/.test(t)&&/"baho "/.test(t)&&/"dars "/.test(t),t); }
    await A.evaluate(()=>{ const t=document.querySelector("#rtTop table"); t.scrollIntoView(); });
    await A.screenshot({path:"cmp_"+nm+".png"});
    if(nm==="m"){ await A.evaluate(()=>document.querySelector("#rtTop .rt-pts").click()); await sleep(400); ck("telefonda ball bosilsa profil ochiladi",!!(await A.$("#rtProf"))); }
    if(nm==="d") ck("kompyuter: sovrin yozuvi katakdan chiqmaydi",await A.evaluate(()=>[...document.querySelectorAll("#rtTop .rt-prize small")].every(s=>{ const a=s.getBoundingClientRect(), t=s.closest("tr").getBoundingClientRect(); return a.left>=t.left; })));
    ck(nm+": JS xatolari yo'q",!A._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length,JSON.stringify(A._errs));
  }
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true,mobile:true,vp:{width:390,height:844}});
  await T.goto(H.SITE+"/index.html"); await ready(T); await T.evaluate(()=>RT.open("top")); await sleep(2500);
  ck("o'qituvchi telefonda: 🗑 tugmasi ekranda",await T.evaluate(()=>{ const b=document.querySelector("#rtTop .rt-del").getBoundingClientRect(); return b.right<=innerWidth+1&&b.width>0; }));
  await T.evaluate(()=>document.querySelector("#rtTop table").scrollIntoView()); await T.screenshot({path:"cmp_tc.png"});
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
