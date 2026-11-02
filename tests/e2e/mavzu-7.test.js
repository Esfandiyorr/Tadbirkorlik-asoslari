/* M7 translations, responsive slides, supplied video and actual quiz interaction. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const H=require('../lib/h.js'),{ck,sleep}=H;
const src=fs.readFileSync(path.join(__dirname,'../../mavzu-7.html'),'utf8');
const data=vm.runInNewContext(src.match(/var Q=\[[\s\S]*?\n\];/)[0]+';Q');
const en=JSON.parse(src.match(/var EN=(.*);/)[1]),qen=JSON.parse(src.match(/var QEN=(.*);/)[1]);
(async()=>{
 const b=await H.chromium.launch();
 try {
  H.dbSet('meta/access/m7',{lim:false,at:Date.now()-1000});
  H.addStu('sM7','Dilnoza','Valiyeva','AP-223');
  const p=await H.mk(b,H.stu('sM7','Dilnoza','Valiyeva','AP-223'),{});
  p.on('dialog',d=>d.accept());
  // Check embedding without depending on external YouTube availability.
  await p.route('https://www.youtube-nocookie.com/embed/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Video player stub</title>'}));
  await p.goto(H.SITE+'/mavzu-7.html'); await p.waitForFunction(()=>window.RT_ready); await sleep(800);
  ck('lesson is open to the test student',!await p.locator('body').evaluate(e=>e.classList.contains('rt-locked')));
  ck('18 slides and 15 bilingual questions',await p.locator('.slide').count()===18&&data.length===15&&qen.length===15);
  ck('all slide text has English translations',await p.locator('.slide [data-i]').evaluateAll((els,en)=>els.every(e=>typeof en[e.dataset.i]==='string'&&en[e.dataset.i].length>0),en));
  ck('university logo asset loads',(await p.request.get(H.SITE+'/logo_tersu.png')).ok());
  const lessonText=await p.locator('#deck').textContent();
  ck('group exercise and rubric are removed',!lessonText.includes('Guruh mashqi')&&!lessonText.includes('10 ballik baholash')&&!lessonText.includes('guruh ishi'));
  ck('full English market terms remain in Uzbek slides',['Total Addressable Market','Serviceable Available Market','Serviceable Obtainable Market'].every(term=>lessonText.includes(term)));
  ck('bilingual quiz indices agree',data.every((q,i)=>q.a.length===4&&q.c>=0&&q.c<4&&qen[i].a.length===4&&qen[i].c===q.c));
  const a=p.locator('a[href*="z4hmIU-PiR0"]');
  ck('supplied video link',await a.count()===1&&await a.getAttribute('target')==='_blank'&&(await a.getAttribute('rel')).includes('noopener'));
  const player=p.locator('.lesson-video iframe');
  ck('video embeds the supplied ID and permits fullscreen',await player.count()===1&&(await player.getAttribute('src')).includes('/embed/z4hmIU-PiR0')&&await player.getAttribute('allowfullscreen')!==null);
  for(const [language,width,height] of [['uz',1280,860],['en',390,844]]) {
   await p.setViewportSize({width,height}); if(language==='en') await p.keyboard.press('l');
   const over=[];
   for(let i=0;i<18;i++) {
    await p.evaluate(n=>{location.hash=String(n+1)},i); await sleep(100);
    if(i===0) {
     await sleep(550); // Wait for the slide transition before measuring and capturing.
     const cover=p.locator('.slide.active');
     ck(language+': cover has logo, large heading and four metadata badges',await cover.locator('.big-logo.terdu-logo[role="img"]').count()===1&&await cover.locator('h1.grad').count()===1&&await cover.locator('.meta > div').count()===4);
     const logo=await cover.locator('.big-logo').boundingBox();
     // The floating animation can report 150 CSS pixels as 149.9999847.
     // Allow subpixel rounding while preserving the minimum size and viewport checks.
     const epsilon=0.01;
     ck(language+': logo is visible and fits screen',!!logo&&logo.width>=150-epsilon&&logo.height>=150-epsilon&&logo.x>=-epsilon&&logo.x+logo.width<=width+1,JSON.stringify(logo));
     await p.screenshot({path:'mavzu-7-cover-'+language+'.png'});
    }
    if(i===15) {
     const size=await player.boundingBox();
     ck(language+': embedded player fits slide',!!size&&size.width>200&&size.x>=0&&size.x+size.width<=width+1&&Math.abs(size.width/size.height-16/9)<0.02);
    }
    if(await p.evaluate(()=>{const e=document.querySelector('.slide.active'); return e.scrollWidth>e.clientWidth+1;})) over.push(i+1);
   }
   ck(language+': all slides fit horizontally',over.length===0,JSON.stringify(over));
  }
  ck('English title renders',await p.locator('.slide.active h2').innerText()==='Check your understanding · 15 questions');
  await p.locator('#qtGo').click();
  ck('15 shuffled quiz questions render',await p.locator('#testWrap .qbox').count()===15);
  for(let i=0;i<15;i++) {
   const box=p.locator('#testWrap .qbox').nth(i),text=await box.locator('.q').innerText();
   const qi=qen.findIndex(q=>text.endsWith(q.q)); if(qi<0) throw new Error('Unknown question');
   const opts=box.locator('.opt'),texts=await opts.allTextContents();
   const ai=texts.findIndex(t=>t.slice(2)===qen[qi].a[qen[qi].c]); if(ai<0) throw new Error('Missing answer');
   await opts.nth(ai).click();
   if(i===0) ck('answer explains reasoning',(await box.locator('.fb').innerText()).includes(qen[qi].e));
  }
  ck('all correct answers produce 100%',await p.locator('#pct').innerText()==='100%');
  const errors=p._errs.filter(e=>!/^console:/.test(e));ck('no JavaScript exceptions',errors.length===0,JSON.stringify(errors));
 } finally {await b.close();}
 console.log('FAILS:',H.fails());process.exitCode=H.fails()?1:0;
})().catch(e=>{console.error(e);console.log('FAILS: 1');process.exit(1);});
