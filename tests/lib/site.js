/* Sinov uchun sayt nusxasi (tests/.site): repo fayllari + o'qituvchini taqlid qilish.
   O'qituvchi haqiqiy saytda Google orqali kiradi; sinovda esa sahifaga window.__TT qo'yilsa, u o'qituvchi
   hisoblanadi (faqat shu nusxada — repo fayllariga tegilmaydi). */
const fs=require("fs"), path=require("path");
const ROOT=path.resolve(__dirname,"..",".."), OUT=path.resolve(__dirname,"..",".site");
const SKIP=/\.(pdf|docx|mp3|mp4)$/i;
function copyDir(a,b){
  fs.mkdirSync(b,{recursive:true});
  for(const n of fs.readdirSync(a)){
    const pa=path.join(a,n), pb=path.join(b,n), st=fs.statSync(pa);
    if(st.isDirectory()) copyDir(pa,pb); else if(!SKIP.test(n)) fs.copyFileSync(pa,pb);
  }
}
function build(){
  fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
  for(const n of fs.readdirSync(ROOT)){
    if(/\.(html|js|css|webmanifest|png)$/i.test(n)) fs.copyFileSync(path.join(ROOT,n),path.join(OUT,n));
  }
  copyDir(path.join(ROOT,"fayllar"),path.join(OUT,"fayllar"));
  /* fayllar/puzzle/rasmlar.json ni GitHub Pages (Jekyll) tuzadi — sinov nusxasida o'zimiz shu ko'rinishda yozamiz */
  const pzd=path.join(OUT,"fayllar","puzzle");
  if(fs.existsSync(pzd)) fs.writeFileSync(path.join(pzd,"rasmlar.json"),JSON.stringify(fs.readdirSync(pzd).filter(n=>/\.(jpe?g|png|webp)$/i.test(n)).sort()
    .map(n=>({f:"/fayllar/puzzle/"+n,n:n.replace(/\.[^.]+$/,"")}))));
  const p=path.join(OUT,"rt-engine.js"); let s=fs.readFileSync(p,"utf8");
  const a='var tcList=[], isTc=false;', b='var FBV="10.12.2", FB_AUTH=null, fbWaiters=null, TC_USER=null;';
  if(s.indexOf(a)<0||s.indexOf(b)<0) throw new Error("rt-engine.js: o'qituvchi taqlidi uchun qator topilmadi");
  s=s.replace(a,'var tcList=[], isTc=!!window.__TT;')
     .replace(b,'var FBV="10.12.2", FB_AUTH=null, fbWaiters=null, TC_USER=window.__TT?{email:"t@t.uz",getIdToken:function(){return Promise.resolve("tok");}}:null;');
  const c='function tcHere(){ if(isTc) return true;';
  if(s.indexOf(c)<0) throw new Error("rt-engine.js: tcHere topilmadi");
  s=s.replace(c,'function tcHere(){ if(isTc||window.__TT2) return true;');      /* sinov: o'qituvchi keyinroq kirganini taqlid qilish */
  fs.writeFileSync(p,s);
  /* config.json da «texnik ishlar» yoqilgan bo'lishi mumkin — oddiy sinovlar uchun nusxada o'chiramiz (alohida sinov uni o'zi yoqadi) */
  for(const n of fs.readdirSync(OUT)) if(/\.html$/i.test(n)){
    const q=path.join(OUT,n), h=fs.readFileSync(q,"utf8"), h2=h.replace(/"maintenance": \{"on": true/g,'"maintenance": {"on": false');
    if(h2!==h) fs.writeFileSync(q,h2);
  }
  return OUT;
}
module.exports={build,OUT,ROOT};
