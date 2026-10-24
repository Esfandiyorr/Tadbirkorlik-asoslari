/* Logo va havola rasmini yaratadi (Playwright + Chromium kerak: tests/ papkasida `npm install`).
   Ishga tushirish:  cd tests && node ../_reyting-manba/logo/yasash.js
   Natija: fayllar/havola-isfandiyor.jpg (1200×630 — havola yuborilganda chiqadigan rasm; JPEG, 300 KB dan kichik — WhatsApp
   shuni talab qiladi), fayllar/logo-isfandiyor.png (1024×1024 kvadrat logo) */
const path=require("path"), fs=require("fs");
let chromium; try{ ({chromium}=require("playwright")); }catch(e){ ({chromium}=require(path.join(__dirname,"..","..","tests","node_modules","playwright"))); }
const ROOT=path.resolve(__dirname,"..",".."), HTML="file://"+path.join(__dirname,"logo.html");
(async()=>{
  const b=await chromium.launch();
  for(const [q,w,h,out] of [["?w",1200,630,"havola-isfandiyor.jpg"],["?sq",1024,1024,"logo-isfandiyor.png"]]){
    const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
    await p.goto(HTML+q); await p.waitForTimeout(400);
    await p.screenshot(Object.assign({path:path.join(ROOT,"fayllar",out)},/\.jpg$/.test(out)?{type:"jpeg",quality:90}:{type:"png"}));
    console.log(out, w+"×"+h, Math.round(fs.statSync(path.join(ROOT,"fayllar",out)).size/1024)+" KB");
    await p.close();
  }
  await b.close();
})();
