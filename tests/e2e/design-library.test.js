const H=require('../lib/h.js'),{ck,sleep}=H;
async function ready(p){await p.waitForFunction(()=>window.RT_ready);await sleep(250);}
(async()=>{
 const b=await H.chromium.launch();
 try{
  const a=await H.mk(b,null,{tc:true});await a.setViewportSize({width:1440,height:950});await a.goto(H.SITE+'/index.html');await ready(a);
  await a.evaluate(()=>RT.open('tc'));await a.locator('.rt-stab[data-p="design"]').click();await sleep(200);
  ck('teacher has two design choices',await a.locator('.rt-design-card').count()===2);
  await a.screenshot({path:'login-design-library.png'});
  for(const id of ['workspace','rocket']){
   await a.locator('.rt-design-preview[data-design="'+id+'"]').click();await sleep(650);
   ck(id+': preview has selected design',await a.locator('#rtGate').getAttribute('data-design')===id);
   ck(id+': preview cannot create or sign into accounts',await a.locator('#lgGo').isDisabled()&&await a.locator('#lgB').isDisabled());
   const logo=await a.locator('.rt-auth-brand .terdu-logo').boundingBox(),title=await a.locator('#rtAuthTitle').boundingBox();
   ck(id+': TerDU logo is above visible login title',logo&&title&&logo.y+logo.height<title.y&&await a.locator('#rtAuthTitle').isVisible());
   if(id==='rocket') ck('rocket uses the approved artwork and a small seal',logo.width<=48&&await a.locator('.rt-auth-layout').evaluate(e=>getComputedStyle(e).backgroundImage.includes('auth-rocket-background.webp')));
   await a.screenshot({path:'login-'+id+'-desktop.png'});
   await a.locator('[data-m="reg"]').click();await sleep(650);
   ck(id+': registration still has only three inputs',await a.locator('#rtGateBody input').count()===3&&await a.locator('#rtG,#rtE').count()===0);
   if(id==='workspace'){
    await a.waitForFunction(()=>{const v=document.querySelector('.rt-auth-video');return v.readyState>=2&&!v.paused&&v.currentTime>.2;});
    ck('animation uses the high-resolution 60 fps source',await a.locator('.rt-auth-video').evaluate(v=>v.videoWidth===748&&v.videoHeight===748));
    ck('workspace plays the uploaded animation beside the real form',await a.locator('.rt-auth-video').evaluate(v=>v.muted&&v.loop&&v.playsInline&&v.getBoundingClientRect().right<document.querySelector('.rt-auth-main').getBoundingClientRect().left));
    await a.locator('.rt-auth-video').evaluate(v=>v.currentTime=v.duration-.15);await sleep(600);
    ck('animation loops without a form interaction',await a.locator('.rt-auth-video').evaluate(v=>!v.paused&&v.currentTime<1.5));
    await a.locator('.rt-auth-motion').click();const stopped=await a.locator('.rt-auth-video').evaluate(v=>v.currentTime);await sleep(250);
    ck('pause control stops playback',await a.locator('.rt-auth-video').evaluate((v,t)=>v.paused&&Math.abs(v.currentTime-t)<.05,stopped));
    await a.locator('.rt-auth-motion').click();await a.waitForFunction(()=>!document.querySelector('.rt-auth-video').paused);
    await a.emulateMedia({reducedMotion:'reduce'});await a.waitForFunction(()=>document.querySelector('.rt-auth-video').paused);
    ck('reduced-motion preference stops animation',await a.locator('.rt-auth-video').evaluate(v=>v.paused));
    await a.emulateMedia({reducedMotion:'no-preference'});await a.waitForFunction(()=>!document.querySelector('.rt-auth-video').paused);
   }
   await a.setViewportSize({width:390,height:844});await sleep(150);
   ck(id+': mobile form fits viewport',await a.locator('#rtGate').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   ck(id+': mobile hides decorative scene',!await a.locator('.rt-auth-visual').isVisible());
   ck(id+': hidden video is paused on mobile',await a.locator('.rt-auth-video').evaluate(v=>v.paused));
   await a.screenshot({path:'login-'+id+'-mobile.png'});
   await a.locator('#rtGateX').click();await a.setViewportSize({width:1440,height:950});
  }
  ck('previews do not change shared settings',!H.dbGet('meta/design'));
  await a.locator('.rt-design-apply[data-design="rocket"]').click();await a.waitForFunction(()=>document.getElementById('rtDesignStatus').textContent.includes('saqlandi'));
  ck('teacher choice is persisted',H.dbGet('meta/design').login==='rocket');
  const p=await H.mk(b,null,{});await p.goto(H.SITE+'/index.html');await ready(p);await p.locator('#rtChip').click();
  ck('new visitor receives the shared design',await p.locator('#rtGate').getAttribute('data-design')==='rocket');
  ck('visitor cannot see teacher library',await p.locator('#rtDesignLibrary').count()===0);
  await p.locator('#rtGateX').click();await p.reload();await ready(p);await p.locator('#rtReg').click();
  ck('choice survives a reload and registration uses it',await p.locator('#rtGate').getAttribute('data-design')==='rocket');
  await a.route('**/meta/design.json*',r=>r.request().method()==='PUT'?r.fulfill({status:403,contentType:'application/json',body:'{"error":"denied"}'}):r.fallback());
  await a.locator('.rt-design-apply[data-design="workspace"]').click();await a.waitForFunction(()=>document.getElementById('rtDesignStatus').textContent.includes('Saqlanmadi'));
  ck('rejected save preserves active choice',H.dbGet('meta/design').login==='rocket'&&await a.locator('.rt-design-card.on .rt-design-apply').getAttribute('data-design')==='rocket');
  H.dbSet('meta/design',{login:'unknown-design'});
  const invalid=await H.mk(b,null,{});await invalid.goto(H.SITE+'/index.html');await ready(invalid);await invalid.locator('#rtChip').click();
  ck('unknown design id falls back safely',await invalid.locator('#rtGate').getAttribute('data-design')==='workspace');
  await invalid.locator('#rtGateX').click();await invalid.setViewportSize({width:390,height:844});await invalid.locator('#rtChip').click();
  ck('mobile never downloads decorative video',await invalid.locator('.rt-auth-video source').evaluateAll(s=>s.every(x=>!x.hasAttribute('src'))));
  const fallback=await H.mk(b,null,{});await fallback.emulateMedia({reducedMotion:'reduce'});await fallback.goto(H.SITE+'/index.html');await ready(fallback);await fallback.locator('#rtChip').click();
  ck('reduced motion starts with a poster and no video download',await fallback.locator('.rt-auth-video').evaluate(v=>v.paused&&!v.dataset.loaded&&!!v.poster));
  await fallback.route('**/auth-workspace.webm*',r=>r.abort());await fallback.route('**/auth-workspace.mp4*',r=>r.abort());await fallback.emulateMedia({reducedMotion:'no-preference'});await sleep(500);
  ck('unavailable media leaves login and its poster available',await fallback.locator('#lgGo').isEnabled()&&await fallback.locator('.rt-auth-video').isVisible());
  const errors=[...a._errs,...p._errs,...invalid._errs].filter(e=>!/^console:/.test(e));ck('no JavaScript exceptions',errors.length===0,JSON.stringify(errors));
 }finally{await b.close();}
 console.log('FAILS:',H.fails());process.exitCode=H.fails()?1:0;
})().catch(e=>{console.error(e);console.log('FAILS: 1');process.exit(1);});
