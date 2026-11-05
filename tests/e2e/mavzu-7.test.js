/* 📇 7-mavzu «CRM nima?»: 24 slayd, ikki tilli matn, slaydlar ekranga sig'adi, 20 savollik test (6 tasi ochiq) to'liq ishlaydi. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const H=require('../lib/h.js'),{ck,sleep}=H;
const src=fs.readFileSync(path.join(__dirname,'../../mavzu-7.html'),'utf8');
const data=vm.runInNewContext(src.match(/var Q=\[[\s\S]*?\n\];/)[0]+';Q');
const en=JSON.parse(src.match(/var EN=(.*);/)[1]),qen=JSON.parse(src.match(/var QEN=(.*);/)[1]);
async function ready(p){ for(let t=0;t<30;t++){ await sleep(500); if(await p.evaluate(()=>!!window.RT_ready).catch(()=>false)) break; } await sleep(1200); }
(async()=>{
 const b=await H.chromium.launch();
 try {
  H.dbSet('meta/access/m7',{lim:false,at:Date.now()-1000});
  H.addStu('sM7','Dilnoza','Valiyeva','AP-223');
  const p=await H.mk(b,H.stu('sM7','Dilnoza','Valiyeva','AP-223'),{});
  p.on('dialog',d=>d.accept());
  await p.goto(H.SITE+'/mavzu-7.html'); await ready(p);
  ck('mavzu talabaga ochiq',!await p.locator('body').evaluate(e=>e.classList.contains('rt-locked')));
  ck('sarlavha «CRM nima?»',(await p.title()).startsWith('CRM nima?'),await p.title());
  ck('24 slayd va 20 ta ikki tilli savol (6 tasi ochiq)',await p.locator('.slide').count()===24&&data.length===20&&qen.length===20&&data.filter(q=>q.o).length===6);
  ck('barcha slayd matnining inglizcha tarjimasi bor',await p.locator('.slide [data-i]').evaluateAll((els,en)=>els.every(e=>typeof en[e.dataset.i]==='string'&&en[e.dataset.i].length>0),en));
  const text=await p.locator('#deck').textContent();
  ck('asosiy tushunchalar slaydlarda bor',['Customer Relationship Management','sotuv voronkasi','RFM','LTV','CAC','churn','NPS','Bitrix24','amoCRM','Google Sheets',"Shaxsga doir ma'lumotlar"].every(t=>text.includes(t)));
  ck('test indekslari ikki tilda mos',data.every((q,i)=>q.o?(Array.isArray(qen[i].o)&&qen[i].o.length>0):(q.a.length===4&&q.c>=0&&q.c<4&&qen[i].a.length===4&&qen[i].c===q.c)));
  ck('variantlar uzunligi bir xil (javob uzunligidan topilmaydi)',data.filter(q=>!q.o).every(q=>{const L=q.a.map(x=>x.length);return Math.max(...L)-Math.min(...L)<=4;}));
  for(const [language,width,height] of [['uz',1280,860],['en',390,844]]) {
   await p.setViewportSize({width,height}); if(language==='en') await p.keyboard.press('l');
   const over=[];
   for(let i=0;i<24;i++) {
    await p.evaluate(n=>{location.hash=String(n+1)},i); await sleep(100);
    if(i===0) {
     await sleep(550);
     const cover=p.locator('.slide.active');
     ck(language+': muqovada logo, katta sarlavha va 4 ta belgi',await cover.locator('.big-logo.terdu-logo[role="img"]').count()===1&&await cover.locator('h1.grad').count()===1&&await cover.locator('.meta > div').count()===4);
     await p.screenshot({path:'mavzu-7-cover-'+language+'.png'});
    }
    if(await p.evaluate(()=>{const e=document.querySelector('.slide.active'); return e.scrollWidth>e.clientWidth+1;})) over.push(i+1);
   }
   ck(language+': barcha slaydlar eniga sig\'adi',over.length===0,JSON.stringify(over));
  }
  const h1=await p.evaluate(()=>document.querySelector('.slide h1.grad').textContent.trim());
  ck('inglizcha muqova sarlavhasi',h1==='WHAT IS CRM?',h1);
  await p.keyboard.press('l'); await sleep(400);
  await p.evaluate(()=>{location.hash='24'}); await sleep(400);
  await p.click('#qtGo'); await sleep(800);
  ck('20 ta savol chiqdi',await p.locator('#testWrap .qbox').count()===20);
  const qs=await p.evaluate(()=>[...document.querySelectorAll('#testWrap .qbox')].map((b,i)=>({i,t:b.querySelector('.q').innerText,open:!!b.querySelector('.qin')})));
  for(const x of qs) {
   const qi=data.findIndex(q=>x.t.endsWith(q.q.replace(/<[^>]+>/g,'')));
   if(qi<0) throw new Error('Noma\'lum savol: '+x.t.slice(0,60));
   if(x.open) {
    await p.evaluate(([i,v])=>{const bx=document.querySelectorAll('#testWrap .qbox')[i],inp=bx.querySelector('.qin');inp.value=v;inp.dispatchEvent(new Event('input'));bx.querySelector('.qin-go').click();},[x.i,data[qi].o[0]]);
   } else {
    const opts=p.locator('#testWrap .qbox').nth(x.i).locator('.opt'),texts=await opts.allTextContents();
    const ai=texts.findIndex(t=>t.slice(2)===data[qi].a[data[qi].c]); if(ai<0) throw new Error('Javob topilmadi');
    await opts.nth(ai).click();
   }
   await sleep(150);
  }
  ck('hamma to\'g\'ri javob — 100%',await p.locator('#pct').innerText()==='100%',await p.locator('#pct').innerText());
  const errors=p._errs.filter(e=>!/^console:/.test(e)&&!/ERR_TUNNEL|Failed to load/.test(e));ck('JS xatolari yo\'q',errors.length===0,JSON.stringify(errors));
 } finally {await b.close();}
 console.log('FAILS:',H.fails());process.exitCode=H.fails()?1:0;
})().catch(e=>{console.error(e);console.log('FAILS: 1');process.exit(1);});
