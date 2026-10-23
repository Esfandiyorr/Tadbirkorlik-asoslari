/* O'qituvchi: alifbo tartibi (ism/familiya), baholash jadvali (qotirilgan ustun, mavzu tanlash, 1–5 baho) */
const H=require('../lib/h.js'); const {sleep,ck}=H;
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.$("#rtAnnGo")) await p.click("#rtAnnGo").catch(()=>{}); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1500); }
const tabTc=async(p,k)=>{ await p.evaluate(k=>document.querySelector('.rt-stab[data-p="'+k+'"]').click(),k); await sleep(500); };
const tile=async(p,pre,g)=>{ await p.evaluate(([pre,g])=>document.querySelector('.rt-gtile[data-p="'+pre+'"][data-g="'+g+'"]').click(),[pre,g]); await sleep(600); };
const names=(p,sel)=>p.evaluate(sel=>[...document.querySelectorAll(sel)].map(e=>e.textContent.trim()),sel);
(async()=>{
  const b=await H.chromium.launch(); H.addStu("sI","Isfandiyor","Sayfiddinov","T-123");
  const N=[["s1","Zarina","Abdullayeva",9],["s2","Bobur","Yusupov",8],["s3","O'tkir","Karimov",7],["s4","Aziz","Toshev",6],["s5","Dilnoza","Bakirova",5],["s6","Shoxrux","Aliyev",4]];
  N.forEach(([id,n,s,m])=>{ H.addStu(id,n,s,"AP-223"); H.dbSet("students/"+id+"/manual",{m1:m%5+1}); H.dbSet("students/"+id+"/prog/m2",{sl:{slide0:1,slide1:1},tm:{legacy:300}}); });
  H.addStu("s7","Ali","Valiyev","FIZ-21");
  const T=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true,vp:{width:1000,height:860}}); T.on("dialog",x=>x.accept());
  await T.goto(H.SITE+"/mavzu-6.html"); await ready(T); await T.evaluate(()=>RT.open("tc")); await sleep(3000);
  await tabTc(T,"stu"); await tile(T,"appr","AP-223");
  let L=await names(T,'.rt-tcpane[data-p="stu"] .rt-gsec tbody td:first-child b');
  ck("Talabalar: ism bo'yicha alifbo tartibida",JSON.stringify(L)===JSON.stringify(["Aziz Toshev","Bobur Yusupov","Dilnoza Bakirova","O'tkir Karimov","Shoxrux Aliyev","Zarina Abdullayeva"]),JSON.stringify(L));
  await T.screenshot({path:"mk_stu.png"});
  await T.evaluate(()=>document.querySelector('.rt-tcpane[data-p="stu"] .rt-nms[data-v="s"]').click()); await sleep(600);
  L=await names(T,'.rt-tcpane[data-p="stu"] .rt-gsec tbody td:first-child b');
  ck("«Familiya bo'yicha»: Familiya Ism, familiya tartibida",JSON.stringify(L)===JSON.stringify(["Abdullayeva Zarina","Aliyev Shoxrux","Bakirova Dilnoza","Karimov O'tkir","Toshev Aziz","Yusupov Bobur"]),JSON.stringify(L));
  ck("tanlov brauzerda saqlandi",await T.evaluate(()=>localStorage.getItem("terdu_nmsort"))==="s");
  await T.evaluate(()=>document.querySelector('.rt-tcpane[data-p="stu"] .rt-nms[data-v="n"]').click()); await sleep(600);
  /* Baholash */
  await tabTc(T,"mk"); await tile(T,"marks","AP-223");
  L=await names(T,'#mkWrap tbody td.rt-mstk b');
  ck("Baholash: ism bo'yicha alifbo tartibida, raqamlangan",L[0]==="Aziz Toshev"&&L[5]==="Zarina Abdullayeva"&&await T.evaluate(()=>document.querySelector("#mkWrap tbody td.rt-mstk .rt-mno").textContent)==="1",JSON.stringify(L));
  const cols=await T.evaluate(()=>[...document.querySelectorAll("#mkWrap thead th")].map(x=>x.textContent.trim()));
  ck("faqat ochilgan mavzular (M1–M5, o'qish rejimi 📖)",cols.length===7&&/📖 M1/.test(cols[1])&&/M5/.test(cols[5])&&!cols.some(c=>/M6|M7/.test(c)),JSON.stringify(cols));
  const ov=await T.evaluate(()=>{ const w=document.getElementById("mkWrap"); return w.scrollWidth>w.clientWidth; });
  await T.evaluate(()=>{ const w=document.getElementById("mkWrap"); w.scrollLeft=400; }); await sleep(200);
  const st=await T.evaluate(()=>{ const w=document.getElementById("mkWrap").getBoundingClientRect(), c=document.querySelector("#mkWrap tbody td.rt-mstk").getBoundingClientRect(), h=document.querySelector("#mkWrap thead th.rt-mstk").getBoundingClientRect();
    return {d:Math.round(c.left-w.left),h:Math.round(h.left-w.left),sl:document.getElementById("mkWrap").scrollLeft}; });
  ck("kompyuter: jadval sig'masa ism ustuni qotirilgan",!ov||st.sl>0&&Math.abs(st.d)<=2&&Math.abs(st.h)<=2,JSON.stringify(st)+" ov="+ov);
  await T.screenshot({path:"mk_all.png"});
  /* ➕ → tanlov → 4 */
  const sl0=await T.evaluate(()=>document.getElementById("mkWrap").scrollLeft);
  await T.evaluate(()=>[...document.querySelectorAll("#mkWrap .rt-manual:not(.rt-unlock)")].find(b=>b.dataset.id==="s4"&&b.dataset.t==="m2").click()); await sleep(300);
  ck("➕: 1–5 tanlov oynasi, talaba ismi bilan",await T.evaluate(()=>{ const p=document.getElementById("rtMkPop"); return !!p&&/Aziz Toshev · M2/.test(p.textContent)&&p.querySelectorAll(".rt-mkb").length===5; }));
  await T.screenshot({path:"mk_pop.png"});
  await T.evaluate(()=>document.querySelector('#rtMkPop .rt-mkb[data-v="4"]').click()); await sleep(1200);
  ck("saqlandi: students/s4/manual/m2 = 4",H.dbGet("students/s4/manual/m2")===4,JSON.stringify(H.dbGet("students/s4/manual")));
  ck("katakda «✅ 4», jadval surilgan joyida qoldi",await T.evaluate(()=>/✅ 4/.test([...document.querySelectorAll("#mkWrap .rt-manual:not(.rt-unlock)")].find(b=>b.dataset.id==="s4"&&b.dataset.t==="m2").textContent))&&await T.evaluate(()=>document.getElementById("mkWrap").scrollLeft)===sl0,sl0);
  /* bitta mavzu */
  await T.evaluate(()=>document.querySelector('.rt-mkt[data-mt="m3"]').click()); await sleep(600);
  const c3=await T.evaluate(()=>[...document.querySelectorAll("#mkWrap thead th")].map(x=>x.textContent.trim()));
  ck("M3 tanlandi: keng jadval (baho, slayd, test, vaqt, amaliy baho)",c3.length===7&&/Amaliy dars bahosi/.test(c3[5])&&await T.evaluate(()=>document.querySelectorAll("#mkWrap .rt-mkpick").length)===6,JSON.stringify(c3));
  await T.evaluate(()=>document.querySelector('#mkWrap .rt-mkpick[data-id="s5"] .rt-mkb[data-v="5"]').click()); await sleep(1200);
  ck("bir bosishda 5: bazada va tugma yashil",H.dbGet("students/s5/manual/m3")===5&&await T.evaluate(()=>document.querySelector('#mkWrap .rt-mkpick[data-id="s5"] .rt-mkb.on').dataset.v==="5"));
  await T.screenshot({path:"mk_one.png"});
  await T.evaluate(()=>document.querySelector('#mkWrap .rt-mkpick[data-id="s5"] .rt-mkb[data-v="3"]').click()); await sleep(1200);
  ck("boshqa raqam — o'zgardi (3)",H.dbGet("students/s5/manual/m3")===3);
  await T.evaluate(()=>document.querySelector('#mkWrap .rt-mkpick[data-id="s5"] .rt-mkb.x').click()); await sleep(1200);
  ck("✕ — o'chdi",H.dbGet("students/s5/manual/m3")==null,JSON.stringify(H.dbGet("students/s5/manual")));
  ck("M3 tanlovi saqlanib turdi",await T.evaluate(()=>document.querySelector(".rt-mkt.on").dataset.mt)==="m3");
  /* tekshirish ro'yxati */
  const au=await T.evaluate(()=>[...document.querySelectorAll("#audSel option")].slice(1,4).map(o=>o.textContent.split(" · ")[0]));
  ck("«Talaba ballini tekshirish» ro'yxati alifbo tartibida",JSON.stringify(au)===JSON.stringify(["Ali Valiyev","Aziz Toshev","Bobur Yusupov"]),JSON.stringify(au));
  /* 6-mavzu ochilsa ustun paydo bo'ladi */
  H.dbSet("meta/access/m6",{lim:true,g:{"AP-223":Date.now()}});
  await T.reload(); await ready(T); await T.evaluate(()=>RT.open("tc")); await sleep(3000); await tabTc(T,"mk");
  if(!(await T.$("#mkWrap"))) await tile(T,"marks","AP-223");
  const c6=await T.evaluate(()=>[...document.querySelectorAll(".rt-mkt")].map(x=>x.textContent.trim()));
  ck("6-mavzu ochilgach M6 (🟢) paydo bo'ldi",c6.some(c=>/🟢 M6/.test(c)),JSON.stringify(c6));
  /* telefon */
  const M=await H.mk(b,H.stu("sI","Isfandiyor","Sayfiddinov","T-123"),{tc:true,mobile:true,vp:{width:390,height:844}});
  await M.goto(H.SITE+"/mavzu-6.html"); await ready(M); await M.evaluate(()=>RT.open("tc")); await sleep(3000); await tabTc(M,"mk");
  if(!(await M.$("#mkWrap"))) await tile(M,"marks","AP-223");
  await M.evaluate(()=>document.getElementById("mkWrap").scrollIntoView()); await sleep(200);
  const ov2=await M.evaluate(()=>{ const w=document.getElementById("mkWrap"); return w.scrollWidth>w.clientWidth; });
  await M.evaluate(()=>{ document.getElementById("mkWrap").scrollLeft=300; }); await sleep(200);
  const st2=await M.evaluate(()=>{ const w=document.getElementById("mkWrap").getBoundingClientRect(), c=document.querySelector("#mkWrap tbody td.rt-mstk").getBoundingClientRect(), h=document.querySelector("#mkWrap thead th.rt-mstk").getBoundingClientRect();
    return {d:Math.round(c.left-w.left),h:Math.round(h.left-w.left),sl:document.getElementById("mkWrap").scrollLeft}; });
  ck("telefon: o'ngga surilganda ism ustuni joyida qoladi (qotirilgan)",ov2&&st2.sl>0&&Math.abs(st2.d)<=2&&Math.abs(st2.h)<=2,JSON.stringify(st2));
  await M.screenshot({path:"mk_m_all.png"});
  await M.evaluate(()=>{ const w=document.getElementById("mkWrap"); w.scrollTop=200; }); await sleep(200);
  ck("telefon: pastga surilganda sarlavha joyida qoladi",await M.evaluate(()=>Math.abs(document.querySelector("#mkWrap thead th").getBoundingClientRect().top-document.getElementById("mkWrap").getBoundingClientRect().top)<=2));
  await M.evaluate(()=>document.querySelector('.rt-mkt[data-mt="m2"]').click()); await sleep(600);
  await M.evaluate(()=>document.getElementById("mkWrap").scrollIntoView()); await sleep(200);
  ck("telefon: sahifa yon tomonga surilmaydi, ism ko'rinadi",await M.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector("#mkWrap td.rt-mstk").getBoundingClientRect().width>100));
  await M.screenshot({path:"mk_m.png"});
  ck("JS xatolari yo'q",[T,M].every(p=>!p._errs.filter(e=>!/Failed to load resource|net::ERR/.test(e)).length),JSON.stringify([T,M].map(p=>p._errs)).slice(0,400));
  await b.close(); console.log("FAILS:",H.fails());
})().catch(e=>{ console.log("ERR",e.stack||e.message); process.exit(1); });
