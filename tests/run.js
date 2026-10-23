/* Barcha sinovlarni ketma-ket ishga tushiradi: sayt nusxasini yig'adi, mahalliy server ochadi,
   har bir sinov faylini alohida jarayonda bajaradi. Biror sinov yiqilsa — chiqish kodi 1 (GitHub'da qizil ❌). */
const http=require("http"), fs=require("fs"), path=require("path"), {spawn}=require("child_process");
const {build}=require("./lib/site.js");
const PORT=+process.env.PORT||8124, SITE="http://127.0.0.1:"+PORT;
const OUTDIR=path.join(__dirname,".out"); fs.mkdirSync(OUTDIR,{recursive:true});
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript",".css":"text/css; charset=utf-8",
  ".json":"application/json",".webmanifest":"application/manifest+json",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",".ico":"image/x-icon"};
const only=process.argv.slice(2);
const site=build();
const srv=http.createServer((q,r)=>{
  let f=decodeURIComponent(q.url.split("?")[0].split("#")[0]); if(f.endsWith("/")) f+="index.html";
  const p=path.join(site,path.normalize(f).replace(/^(\.\.[\/\\])+/,""));
  if(!p.startsWith(site)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){ r.writeHead(404); r.end("404"); return; }
  r.writeHead(200,{"Content-Type":TYPES[path.extname(p).toLowerCase()]||"application/octet-stream","Cache-Control":"no-cache"});
  fs.createReadStream(p).pipe(r);
});
/* sinov alohida jarayonda (asinxron — server shu jarayonda javob beraveradi) */
function runOne(file){
  return new Promise(res=>{
    const ch=spawn(process.execPath,[file],{cwd:OUTDIR,env:Object.assign({},process.env,{SITE})});
    let out=""; const add=d=>{ out+=d; }; ch.stdout.on("data",add); ch.stderr.on("data",add);
    const kill=setTimeout(()=>{ out+="\nERR vaqt tugadi (15 daqiqa)"; ch.kill("SIGKILL"); },15*60000);
    ch.on("close",code=>{ clearTimeout(kill); res({status:code,out}); });
  });
}
srv.listen(PORT,"127.0.0.1",async()=>{
  const files=[...fs.readdirSync(path.join(__dirname,"e2e")).filter(n=>n.endsWith(".test.js")).map(n=>["e2e",n]),
    ["","worker.test.mjs"],["","rules.test.js"]].filter(([d,n])=>!only.length||only.some(o=>n.indexOf(o)>=0));
  const res=[];
  for(const [d,n] of files){
    const t0=Date.now();
    console.log("\n▶ "+n);
    const r=await runOne(path.join(__dirname,d,n)), out=r.out;
    process.stdout.write(out.split("\n").filter(l=>!/^\s*(\x1b\[2m|- )/.test(l)).join("\n"));
    const m=/FAILS: (\d+)/.exec(out), skip=/^SKIP/m.test(out);
    const ok=skip||(r.status===0&&m&&+m[1]===0);
    res.push([n,ok?(skip?"⏭":"✅"):"❌",Math.round((Date.now()-t0)/1000)+"s"]);
  }
  srv.close();
  console.log("\n================ NATIJA ================");
  res.forEach(x=>console.log(x[1]+" "+x[0]+"  ("+x[2]+")"));
  const bad=res.filter(x=>x[1]==="❌").length;
  console.log(bad?"\n❌ "+bad+" ta sinov yiqildi":"\n✅ Hammasi o'tdi");
  process.exit(bad?1:0);
});
