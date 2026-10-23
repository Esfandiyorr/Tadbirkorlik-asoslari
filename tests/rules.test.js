/* Firebase qoidalari (xavfsiz rejim) haqiqiy Firebase emulyatorida: chat, rasmlar, arena.
   Qoidalar _reyting-manba/engine_js.txt dagi rulesSecureTxt() dan olinadi (panel o'qituvchiga aynan shuni beradi).
   Java bo'lmasa — o'tkazib yuboriladi (SKIP). Emulyator tests/.cache ga bir marta yuklanadi. */
const fs=require('fs'), path=require('path'), {spawn,spawnSync}=require('child_process');
const JAR_URL="https://storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v4.11.2.jar";
const CACHE=path.join(__dirname,".cache"), JAR=path.join(CACHE,"firebase-database-emulator-v4.11.2.jar");
const src=fs.readFileSync(path.join(__dirname,"..","_reyting-manba","engine_js.txt"),'utf8');
const a=src.indexOf("function khRulesDb"), b=src.indexOf("var RULES=rulesTxt();");
const code=src.slice(a,b).replace(/^function rulesTxt[\s\S]*?\n}\n/m,"");
const rules=new Function(code+"\nreturn rulesSecureTxt();")().split("SIZNING_GMAIL@gmail.com").join("teacher@gmail.com");
const NS="demo"+Date.now(), PORT=+process.env.FB_PORT||9555, U="http://127.0.0.1:"+PORT;
const b64=o=>Buffer.from(JSON.stringify(o)).toString("base64url");
const tok=(uid,extra)=>b64({alg:"none",typ:"JWT"})+"."+b64(Object.assign({uid:uid,sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,aud:"demo",iss:"https://securetoken.google.com/demo",firebase:{sign_in_provider:"anonymous"}},extra||{}))+".";
const TC=tok("tcuid",{email:"teacher@gmail.com",email_verified:true});
async function req(m,path,body,t){
  const r=await fetch(U+"/"+path+".json?ns="+NS+(t?"&auth="+t:""),{method:m,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  return r.status;
}
let fails=0; const ck=(n,c,x)=>{ if(!c) fails++; console.log((c?"OK  ":"FAIL")+" "+n+(x!==undefined?"  "+x:"")); };
async function emulator(){
  if(spawnSync("java",["-version"]).status!==0){ console.log("SKIP: java yo'q — Firebase qoidalari sinovi o'tkazib yuborildi"); process.exit(0); }
  if(!fs.existsSync(JAR)){
    fs.mkdirSync(CACHE,{recursive:true});
    const res=await fetch(JAR_URL); if(!res.ok) throw new Error("emulyator yuklanmadi: "+res.status);
    fs.writeFileSync(JAR,Buffer.from(await res.arrayBuffer()));
  }
  const p=spawn("java",["-jar",JAR,"--port",String(PORT)],{stdio:"ignore"});
  for(let i=0;i<60;i++){ try{ const r=await fetch(U+"/.json?ns=x"); if(r.ok) return p; }catch(e){} await new Promise(r=>setTimeout(r,500)); }
  p.kill(); throw new Error("emulyator ishga tushmadi");
}
let EMU=null;
(async()=>{
  EMU=await emulator();
  let r=await fetch(U+"/.settings/rules.json?ns="+NS,{method:"PUT",headers:{Authorization:"Bearer owner"},body:rules});
  ck("qoidalar emulyatorga qabul qilindi (sintaksis to'g'ri)",r.status===200,r.status+" "+(r.status!==200?(await r.text()).slice(0,600):""));
  if(r.status!==200){ console.log("FAILS: 1"); EMU.kill(); return; }
  /* boshlang'ich holat (owner sifatida) */
  const now=Date.now(), old=now-8*86400000, d2=now-2*86400000;
  await fetch(U+"/.json?ns="+NS,{method:"PUT",headers:{Authorization:"Bearer owner"},body:JSON.stringify({
    students:{sA:{name:"Ali",surname:"V",group:"AP",status:"ok",media:true},sB:{name:"Bobur",surname:"K",group:"AP",status:"ok"},sP:{name:"P",surname:"P",status:"pending"}},
    owners:{sA:{uA:"x"},sB:{uB:"x"},sP:{uP:"x"}},
    chat:{c1:{id:"sB",n:"Bobur K",at:now-3600000,t:"salom"},cOld:{id:"sB",n:"Bobur K",at:old,t:"eski"},
          cVid:{id:"sA",n:"Ali V",at:d2,t:"video",mk:"v1",mt:"video"}},
    media:{m1:{t:"img",d:"data:x",at:now-3600000,by:"sA"},mOld:{t:"img",d:"data:x",at:old,by:"sA"},v1:{t:"video",d:"data:v",at:d2,by:"sA"}},
    arena:{rooms:{R1:{meta:{at:now}}},public:{R1:{at:now}},meta:{cleanAt:1}}
  })});
  const A=tok("uA"), B=tok("uB"), X=tok("uX"), P=tok("uP");
  const msg=(id,t)=>({id:id,n:"Ali V",g:"AP",t:t||"hello",at:Date.now()});
  ck("talaba o'z nomidan yangi xabar qo'sha oladi",await req("PUT","chat/c2",msg("sA"),A)===200);
  ck("birov nomidan yozib bo'lmaydi",await req("PUT","chat/c3",msg("sB"),A)!==200);
  ck("tokensiz yozib bo'lmaydi",await req("PUT","chat/c4",msg("sA"))!==200);
  ck("tasdiqlanmagan talaba yoza olmaydi",await req("PUT","chat/c5",msg("sP"),P)!==200);
  ck("400 belgidan uzun xabar rad etiladi",await req("PUT","chat/c6",msg("sA","x".repeat(401)),A)!==200);
  ck("kelajak vaqti bilan yozib bo'lmaydi",await req("PUT","chat/c7",Object.assign(msg("sA"),{at:Date.now()+86400000}),A)!==200);
  ck("talaba birovning xabarini o'chira olmaydi",await req("DELETE","chat/c1",undefined,A)!==200);
  ck("talaba o'z xabarini ham o'chira olmaydi",await req("DELETE","chat/c2",undefined,A)!==200);
  ck("talaba xabarni o'zgartira olmaydi",await req("PATCH","chat/c1",{t:"buzildi"},B)!==200);
  ck("talaba butun chatni o'chira olmaydi",await req("DELETE","chat",undefined,A)!==200);
  ck("1 haftadan eski xabarni avtomatik tozalash mumkin",await req("DELETE","chat/cOld",undefined,B)===200);
  ck("1 kundan eski videoni xabardan ajratish mumkin",await req("PATCH","chat/cVid",{mk:null,mt:null,vx:1},B)===200);
  ck("o'qituvchi istalgan xabarni o'chira oladi",await req("DELETE","chat/c1",undefined,TC)===200);
  ck("o'qituvchi butun chatni tozalay oladi",await req("DELETE","chat",undefined,TC)===200);
  /* media */
  const med=(by)=>({t:"img",d:"data:image/jpeg;base64,AAAA",at:Date.now(),by:by});
  ck("ruxsati bor talaba rasm qo'sha oladi",await req("PUT","media/m2",med("sA"),A)===200);
  ck("ruxsati yo'q talaba rasm qo'sha olmaydi",await req("PUT","media/m3",med("sB"),B)!==200);
  ck("birov nomidan rasm qo'shib bo'lmaydi",await req("PUT","media/m4",med("sA"),B)!==200);
  ck("talaba yangi rasmni o'chira olmaydi",await req("DELETE","media/m1",undefined,A)!==200);
  ck("1 haftadan eski rasmni tozalash mumkin",await req("DELETE","media/mOld",undefined,B)===200);
  ck("1 kundan eski videoni tozalash mumkin",await req("DELETE","media/v1",undefined,B)===200);
  ck("talaba butun media bo'limini o'chira olmaydi",await req("DELETE","media",undefined,A)!==200);
  ck("o'qituvchi rasmni o'chira oladi",await req("DELETE","media/m2",undefined,TC)===200);
  /* arena */
  ck("arena: xona yaratish/yangilash ishlaydi (tokensiz ham)",await req("PUT","arena/rooms/R2",{meta:{at:Date.now()}})===200&&await req("PATCH","arena/rooms/R1",{state:{s:1}})===200);
  ck("arena: bitta xonani o'chirish ishlaydi",await req("DELETE","arena/public/R1")===200);
  ck("arena: butun arenani o'chirib bo'lmaydi",await req("DELETE","arena",undefined,A)!==200);
  ck("arena: butun rooms bo'limini o'chirib bo'lmaydi",await req("DELETE","arena/rooms")!==200);
  ck("arena: o'qituvchi butun bo'limni tozalay oladi",await req("DELETE","arena/rooms",undefined,TC)===200);
  console.log("FAILS:",fails);
  EMU.kill();
})().catch(e=>{ console.log("ERR",e); if(EMU) EMU.kill(); process.exit(1); });
