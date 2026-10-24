/* 🔗 Havola (Telegram, WhatsApp …) ko'rinishi: har bir sahifada nom «IsfandiyorSayfiddinov», rasm — TerDU gerbi + Isfandiyor
   (absolyut manzil, 1200×630 JPEG, 300 KB dan kichik), twitter kartochkasi, dublikat teglar yo'q. Brauzer kerak emas. */
const fs=require("fs"), path=require("path");
const ROOT=path.resolve(__dirname,".."), cfg=JSON.parse(fs.readFileSync(path.join(ROOT,"_reyting-manba","config.json"),"utf8"));
let fails=0; const ck=(n,c,x)=>{ if(!c) fails++; console.log((c?"OK  ":"FAIL")+" "+n+(x!==undefined?"  "+String(x).slice(0,220):"")); };
const pages=fs.readdirSync(ROOT).filter(n=>/\.html$/.test(n)).sort();
const meta=(h,k,v)=>{ const m=new RegExp('<meta\\s+(?:property|name)="'+k+'"\\s+content="([^"]*)"',"g"); const a=[]; let r; while((r=m.exec(h))) a.push(r[1]); return a; };
/* JPEG o'lchami */
function jpegSize(b){ let i=2; while(i<b.length){ if(b[i]!==0xFF){ i++; continue; } const m=b[i+1]; if(m>=0xC0&&m<=0xCF&&![0xC4,0xC8,0xCC].includes(m)) return [b.readUInt16BE(i+7),b.readUInt16BE(i+5)]; i+=2+b.readUInt16BE(i+2); } return null; }
const img=path.join(ROOT,"fayllar","havola-isfandiyor.jpg");
ck("havola rasmi bor, JPEG",fs.existsSync(img)&&fs.readFileSync(img).slice(0,2).toString("hex")==="ffd8");
const sz=jpegSize(fs.readFileSync(img)); ck("rasm o'lchami 1200×630",!!sz&&sz[0]===1200&&sz[1]===630,JSON.stringify(sz));
ck("rasm 300 KB dan kichik (WhatsApp talabi)",fs.statSync(img).size<300*1024,Math.round(fs.statSync(img).size/1024)+" KB");
ck("kvadrat logo ham bor",fs.existsSync(path.join(ROOT,"fayllar","logo-isfandiyor.png")));
ck("sayt manzili https:// bilan, havola nomi «IsfandiyorSayfiddinov»",/^https:\/\/.+\/$/.test(cfg.siteUrl)&&cfg.linkName==="IsfandiyorSayfiddinov",cfg.siteUrl);
for(const f of pages){
  const h=fs.readFileSync(path.join(ROOT,f),"utf8"), t=meta(h,"og:title"), im=meta(h,"og:image"), d=meta(h,"og:description");
  const ok=t.length===1&&t[0]==="IsfandiyorSayfiddinov"&&meta(h,"og:site_name")[0]==="IsfandiyorSayfiddinov"&&meta(h,"twitter:title")[0]==="IsfandiyorSayfiddinov"
    &&im.length===1&&im[0].indexOf(cfg.siteUrl+"fayllar/havola-isfandiyor.jpg")===0&&meta(h,"twitter:image")[0]===im[0]&&meta(h,"twitter:card")[0]==="summary_large_image"
    &&meta(h,"og:image:width")[0]==="1200"&&meta(h,"og:image:height")[0]==="630"&&d.length===1&&d[0].length>20&&meta(h,"og:url")[0].indexOf(cfg.siteUrl)===0&&(h.match(/og:title/g)||[]).length===1;
  ck(f+": havola nomi «IsfandiyorSayfiddinov», rasm absolyut, bitta to'plam",ok,t.join("|")+" · "+im.join("|").slice(-40)+" · "+d.join("|"));
}
const topics=pages.filter(f=>/^mavzu-\d+\.html$/.test(f));
ck("mavzu sahifalarida tavsif «N-mavzu: …»",topics.every(f=>{ const n=+f.match(/\d+/)[0]; return meta(fs.readFileSync(path.join(ROOT,f),"utf8"),"og:description")[0].indexOf(n+"-mavzu: ")===0; }));
ck("portalning (index.html) brauzer sarlavhasi ham «IsfandiyorSayfiddinov — …»",/<title>IsfandiyorSayfiddinov — /.test(fs.readFileSync(path.join(ROOT,"index.html"),"utf8")));
const ph=fs.readFileSync(path.join(ROOT,"index.html"),"utf8"), ch=fs.readFileSync(path.join(ROOT,"tadbirkorlik-asoslari.html"),"utf8");
ck("havola tavsifi: portalda sayt va fan nomi («Fan: Tadbirkorlik asoslari»), fan sahifasida — fan",/o'quv platformasi/.test(meta(ph,"og:description")[0])&&/Fan: Tadbirkorlik asoslari/.test(meta(ph,"og:description")[0])&&/^Tadbirkorlik asoslari fani/.test(meta(ch,"og:description")[0]),meta(ph,"og:description")[0]);
ck("og:url: portal — sayt bosh manzili, fan sahifasi — o'z manzili",meta(ph,"og:url")[0]===cfg.siteUrl&&meta(ch,"og:url")[0]===cfg.siteUrl+"tadbirkorlik-asoslari.html");
console.log("FAILS:",fails);
