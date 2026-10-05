/* Slaydlarni PDF qilish: NODE_PATH=$(npm root -g) node slaydlar.js mavzu-2.html m2.pdf  →  python3 yigish.py m2_img fayllar/M2-mavzu.pdf "M2 · ..." (pymupdf kerak) */
/* node mkpdf2.js <deck.html> <out.pdf> — har bir slaydni ekrandagidek rasmga olib, PDF yig'adi */
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [file,out]=process.argv.slice(2);
  const W=1280,H=720,DSF=1.3;
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:DSF});
  await p.addInitScript(()=>{ try{ localStorage.setItem("terdu_lang","uz"); localStorage.setItem("terdu_theme","light"); }catch(e){} });
  await p.goto("file:///home/user/Tadbirkorlik-asoslari/"+file); await p.waitForTimeout(2500);
  await p.addStyleTag({content:".topbar,.navbar,.progress-wrap,.hint,.overlay,.rt-gate,.rt-ov,.rt-toast,#khBan,#mzTab,#mzPanel,.ch-tab,.ch-panel,.rt-ask,.tb-toggle,#rtAcc{display:none!important} #app,#deck{height:100vh!important} *{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}"});
  const n=await p.evaluate(()=>document.querySelectorAll(".slide").length);
  const imgs=[];
  for(let i=0;i<n;i++){
    await p.evaluate(i=>document.querySelectorAll(".thumb")[i].click(),i); await p.waitForTimeout(500);
    const sh=await p.evaluate(i=>{ const s=document.querySelectorAll(".slide")[i]; s.scrollTop=0; return s.scrollHeight; },i);
    const h=Math.max(H,sh);
    if(h>H){ await p.setViewportSize({width:W,height:h}); await p.waitForTimeout(300); }
    const buf=await p.screenshot({type:"jpeg",quality:76});
    imgs.push({d:buf.toString("base64"),h}); if(h>H) await p.setViewportSize({width:W,height:H});
  }
  const dir=out.replace(/\.pdf$/,"_img"); fs.mkdirSync(dir,{recursive:true});
  imgs.forEach((x,i)=>fs.writeFileSync(dir+"/"+String(i).padStart(2,"0")+".jpg",Buffer.from(x.d,"base64")));
  console.log(file,"slaydlar:",n,"uzun:",imgs.filter(x=>x.h>H).length);
  await b.close(); })();
