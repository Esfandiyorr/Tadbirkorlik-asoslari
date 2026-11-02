/* Existing PIN accounts, secure password resets and rejected account writes. */
const H=require('../lib/h.js'),{ck,sleep}=H;
async function ready(p){await p.waitForFunction(()=>window.RT_ready);await sleep(350);}
async function login(p,password){await p.locator('#rtChip').click();await p.locator('#lgN').fill('Aziz');await p.locator('#lgS').fill('Karimov');await p.locator('#lgB').fill(password);await p.locator('#lgGo').click();}
(async()=>{
 const b=await H.chromium.launch();
 try{
  H.dbSet('students/legacy',{id:'legacy',name:'Aziz',surname:'Karimov',group:'AP-223',status:'ok',email:'test@example.com',pk:'a292077ee8e8035f',at:1,prog:{m1:{sl:{slide0:1},ac:{test0:5},tm:{d1:60}}}});
  const p=await H.mk(b,null,{});await p.goto(H.SITE+'/index.html');await ready(p);
  await login(p,'2468');await p.waitForFunction(()=>!document.getElementById('rtGate'));
  ck('existing four-digit PIN still signs in',await p.evaluate(()=>RT.student().id==='legacy'));
  ck('existing points and answers are retained',await p.evaluate(()=>RT.points().total>0&&RT.points().topics.m1.acts.test0===5));
  const admin=await H.mk(b,null,{tc:true});await admin.goto(H.SITE+'/index.html');await ready(admin);await admin.evaluate(()=>RT.open('tc'));
  admin.on('dialog',d=>d.accept('NewPassword2468'));
  await admin.locator('.rt-gtile[data-p="appr"][data-g="AP-223"]').click();
  await admin.waitForSelector('.rt-pin2[data-id="legacy"]',{state:'attached'});
  await admin.locator('.rt-pin2[data-id="legacy"]').click();
  for(let i=0;i<50&&H.DBS.students.legacy.authVersion!==2;i++) await sleep(100);
  ck('teacher reset writes salted password metadata',H.DBS.students.legacy.authVersion===2&&H.DBS.students.legacy.pwSalt.length===32&&H.dbGet('keys/legacy').startsWith('p2:'));
  ck('reset revokes old browser ownership',H.dbGet('owners/legacy')===null);
  const x=await H.mk(b,null,{});await x.goto(H.SITE+'/index.html');await ready(x);
  await login(x,'2468');await x.waitForFunction(()=>document.getElementById('lgErr').style.display!=='none');
  ck('old PIN stops working after password reset',await x.evaluate(()=>!RT.student()));
  await x.locator('#lgB').fill('NewPassword2468');await x.locator('#lgGo').click();await x.waitForFunction(()=>!document.getElementById('rtGate')).catch(async e=>{ console.log('LOGIN DEBUG',JSON.stringify({error:await x.locator('#lgErr').textContent(),version:H.DBS.students.legacy.authVersion,saltLength:(H.DBS.students.legacy.pwSalt||'').length,keyPresent:!!H.dbGet('keys/legacy')})); throw e; });
  ck('new password restores the same account and score',await x.evaluate(()=>RT.student().id==='legacy'&&RT.points().total>0&&RT.points().topics.m1.acts.test0===5));
  const f=await H.mk(b,null,{});await f.goto(H.SITE+'/index.html');await ready(f);await f.locator('#rtReg').click();
  await f.locator('#rtN').fill('Nilufar');await f.locator('#rtS').fill('Saidova');await f.locator('#rtB').fill('1234');await f.locator('#rtGo').click();
  ck('new registration rejects a four-digit password',await f.locator('#rtErr').isVisible());
  await f.route(/firebasedatabase\.app|firebaseio\.com/,r=>r.request().method()==='PATCH'&&new URL(r.request().url()).pathname==='/.json'?r.fulfill({status:403,contentType:'application/json',body:'{"error":"Permission denied"}'}):r.fallback());
  await f.locator('#rtB').fill('SafePassword2468');await f.locator('#rtGo').click();
  await f.waitForFunction(()=>document.getElementById('rtErr').textContent.includes('saqlanmadi'));
  ck('rejected private credential writes do not create accounts',await f.evaluate(()=>!RT.student())&&!Object.values(H.DBS.students).some(s=>s.name==='Nilufar'));
  const errors=[...p._errs,...admin._errs,...x._errs,...f._errs].filter(e=>!/^console:/.test(e));ck('no JavaScript exceptions',errors.length===0,JSON.stringify(errors));
 }finally{await b.close();}
 console.log('FAILS:',H.fails());process.exitCode=H.fails()?1:0;
})().catch(e=>{console.error(e);console.log('FAILS: 1');process.exit(1);});
