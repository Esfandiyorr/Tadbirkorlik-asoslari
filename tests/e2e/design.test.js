/* Visual redesign: account flows, calm reading surface and desktop full screen. */
const H=require('../lib/h.js'),{ck,sleep}=H;
async function ready(p){await p.waitForFunction(()=>window.RT_ready);for(const id of ['rtAnnGo','rtRoOk']){const e=p.locator('#'+id);if(await e.count()) await e.click();}await p.evaluate(()=>{const e=document.getElementById('rtEm');if(e)e.remove();});await sleep(250);}
(async()=>{
 const b=await H.chromium.launch();
 try {
  const p=await H.mk(b,null,{});
  await p.goto(H.SITE+'/index.html');await ready(p);
  await p.locator('#rtReg').click();
  ck('registration remains a dialog with existing form fields',await p.locator('#rtGate[role="dialog"]').count()===1&&await p.locator('#rtN').count()===1&&await p.locator('#rtE').count()===0&&await p.locator('#rtG').count()===0);
  for(const [name,width,height] of [['desktop',1440,1000],['laptop',1366,768],['mobile',390,844]]){
   await p.setViewportSize({width,height});await sleep(150);
   const size=await p.locator('#rtGate').evaluate(e=>({w:e.scrollWidth,c:e.clientWidth,columns:getComputedStyle(e.querySelector('.rt-form')).gridTemplateColumns}));
   ck(name+': account screen fits horizontally',size.w<=size.c+1,JSON.stringify(size));
   ck(name+': account form is one column',size.columns.split(' ').length===1);
   ck(name+': reference illustration adapts to screen',await p.locator('.rt-auth-visual').isVisible()===(width>900));
   await p.screenshot({path:'design-register-'+name+'.png'});
  }
  await p.locator('#rtGo').click();
  ck('empty registration gives a visible validation error',await p.locator('#rtErr').isVisible());
  await p.locator('[data-m="log"]').click();
  ck('switching tabs changes the illustration scene',await p.locator('#rtGate').getAttribute('data-mode')==='log');
  ck('login tab preserves the actual login form',await p.locator('#lgN').count()===1&&await p.locator('#lgB').count()===1);
  await p.screenshot({path:'design-login-mobile.png'});
  await p.locator('#rtGateX').click();
  ck('closing account screen returns to the portal',await p.locator('#rtGate').count()===0);
  await p.locator('#rtReg').click();
  await p.locator('#rtN').fill('Dilnoza');await p.locator('#rtS').fill('Valiyeva');await p.locator('#rtB').fill('Talaba2468');
  await p.locator('#rtGo').click();await p.waitForFunction(()=>!document.getElementById('rtGate')).catch(async e=>{console.log('REGISTRATION DEBUG',JSON.stringify({error:await p.locator('#rtErr').textContent(),nameLength:(await p.locator('#rtN').inputValue()).length,surnameLength:(await p.locator('#rtS').inputValue()).length,passwordLength:(await p.locator('#rtB').inputValue()).length}));throw e;});await sleep(300);
  ck('registration still creates a pending student',Object.values(H.DBS.students).some(s=>s.name==='Dilnoza'&&s.status==='pending'));
  const created=Object.values(H.DBS.students).find(s=>s.name==='Dilnoza');
  ck('registration defers group and email',created.group===''&&!created.email);
  ck('password uses versioned salted credentials',created.authVersion===2&&created.pwSalt.length===32&&!JSON.stringify(created).includes('Talaba2468'));
  await p.locator('#rtEdit').click();
  await p.locator('#cvG').selectOption('AP-223');await p.locator('#cvSaveB').click();await sleep(250);
  ck('pending student selects group in profile without losing account',H.DBS.students[created.id].group==='AP-223'&&H.DBS.students[created.id].status==='pending');
  ck('email is optional in profile',await p.locator('#cvE').inputValue()==='');
  await p.locator('#rtClose').click();
  // A different browser must prove the same password and retain the existing record.
  H.dbSet('students/'+created.id+'/status','ok');
  const login=await H.mk(b,null,{});await login.goto(H.SITE+'/index.html');await ready(login);
  await login.locator('#rtChip').click();await login.locator('#lgN').fill('Dilnoza');await login.locator('#lgS').fill('Valiyeva');await login.locator('#lgB').fill('WrongPassword');await login.locator('#lgGo').click();
  await login.waitForFunction(()=>document.getElementById('lgErr').style.display!=='none');
  ck('wrong password cannot sign in',await login.locator('#rtGate').count()===1&&await login.evaluate(()=>!RT.student()));
  await login.locator('#lgB').fill('Talaba2468');await login.locator('#lgGo').click();await login.waitForFunction(()=>!document.getElementById('rtGate'));
  ck('password login from another browser preserves identity',await login.evaluate(id=>RT.student().id===id,created.id));
  await sleep(1200);ck('missing email never blocks reading',await login.locator('#rtEm').count()===0);
  H.addStu('sDesign','Ali','Valiyev','AP-223');
  for(let i=1;i<=15;i++) H.dbSet('meta/access/m'+i,{lim:false,at:Date.now()-1000});
  const r=await H.mk(b,H.stu('sDesign','Ali','Valiyev','AP-223'),{});
  await r.route('https://www.youtube-nocookie.com/embed/**',q=>q.fulfill({contentType:'text/html',body:'<!doctype html><title>Video</title>'}));
  await r.goto(H.SITE+'/mavzu-7.html#11');await ready(r);await sleep(500);
  ck('desktop app occupies the viewport',await r.evaluate(()=>Math.abs(document.querySelector('div#app').getBoundingClientRect().height-innerHeight)<2));
  ck('reading surface has no decorative background gradient',await r.evaluate(()=>getComputedStyle(document.body).backgroundImage==='none'));
  ck('full screen control is available',await r.locator('#btnFull').isVisible());
  await r.screenshot({path:'design-before-fullscreen.png'});
  await r.locator('#btnFull').click();await r.waitForFunction(()=>!!document.fullscreenElement);
  ck('full screen enters through the real browser API',await r.evaluate(()=>!!document.fullscreenElement));
  await r.locator('#btnFull').click();await r.waitForFunction(()=>!document.fullscreenElement);
  ck('full screen exits through the same control',await r.evaluate(()=>!document.fullscreenElement));
  await r.screenshot({path:'design-reading-desktop.png'});
  await r.locator('#rtTheme').click();await sleep(250);
  ck('dark reading mode is retained',await r.evaluate(()=>document.documentElement.dataset.theme==='dark'));
  await r.screenshot({path:'design-reading-dark.png'});
  await r.locator('#rtTheme').click();
  for(const width of [1440,390]){
   await r.setViewportSize({width,height:900});
   for(let i=1;i<=15;i++){
    await r.goto(H.SITE+'/mavzu-'+i+'.html#2');await ready(r);
    const overflow=await r.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.querySelector('.slide.active').scrollWidth>document.querySelector('.slide.active').clientWidth+1);
    ck(width+'px: topic '+i+' fits viewport',!overflow);
   }
  }
  const errors=[...p._errs,...r._errs].filter(e=>!/^console:/.test(e));ck('no JavaScript exceptions',errors.length===0,JSON.stringify(errors));
 }finally{await b.close();}
 console.log('FAILS:',H.fails());process.exitCode=H.fails()?1:0;
})().catch(e=>{console.error(e);console.log('FAILS: 1');process.exit(1);});
