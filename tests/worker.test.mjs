/* fayllar/push-worker.js (v2): shanba eslatmasi — kimga ketishi, matni va shifrlanishi (RFC 8291) tekshiriladi.
   Brauzer kerak emas: Worker moduli Node'da ishga tushiriladi, baza va push xizmati soxta. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const HERE=path.dirname(fileURLToPath(import.meta.url));
const { subtle } = globalThis.crypto;
const b64u=b=>Buffer.from(b).toString("base64url"), ub=s=>new Uint8Array(Buffer.from(s,"base64url"));
let fails=0; const ck=(n,c,x)=>{ if(!c) fails++; console.log((c?"OK  ":"FAIL")+" "+n+(x!==undefined?"  "+x:"")); };
const vk=await subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
const vpub=b64u(new Uint8Array(await subtle.exportKey("raw",vk.publicKey))), vpriv=(await subtle.exportKey("jwk",vk.privateKey)).d;
let code=fs.readFileSync(process.argv[2]||path.join(HERE,"..","fayllar","push-worker.js"),"utf8");
const rep={VAPID_PUB:vpub,VAPID_PRIV:vpriv,DB:"https://db.test",API_KEY:"AK",TEACHER_H:"HH",SITE:"https://site.test/kurs/"};
for(const k in rep) code=code.split("__"+k+"__").join(rep[k]);
/* obunalar: har biri haqiqiy P-256 kalit juftligi bilan */
async function sub(){ const k=await subtle.generateKey({name:"ECDH",namedCurve:"P-256"},true,["deriveBits"]); const a=crypto.getRandomValues(new Uint8Array(16));
  return {k, s:{e:"https://push.test/"+Math.random().toString(36).slice(2),p:b64u(new Uint8Array(await subtle.exportKey("raw",k.publicKey))),a:b64u(a),t:1}}; }
const subs={A1:await sub(),A2:await sub(),B1:await sub(),C1:await sub(),D1:await sub(),E1:await sub()};
const now=Date.now(), H=3600000;
/* shanba 20:00 Toshkent payti — muddat (dushanba 00:00) 28 soatda */
function accEnd(ts){ const d=new Date(+ts+18000000), day0=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()); return day0+((7-d.getUTCDay())%7+1)*86400000-18000000; }
const satEve=accEnd(now)-28*H, opened=satEve-3*24*H;   /* chorshanba ochilgan */
const access={m6:{lim:true,g:{"AP-223":opened,"FIZ-21":true}},m7:{lim:true,s:{sE:opened}},m5:{lim:true,g:{"AP-223":opened-7*24*H}}};
const students={
  sA:{status:"ok",group:"AP-223",topics:{m6:{p:40}},push:{k1:subs.A1.s,k2:subs.A2.s}},
  sB:{status:"ok",group:"AP-223",topics:{m6:{p:100}},push:{k1:subs.B1.s}},          /* tugatgan — eslatma yo'q */
  sC:{status:"ok",group:"FIZ-21",push:{k1:subs.C1.s}},                                /* eski true — muddatsiz, eslatma yo'q */
  sD:{status:"pending",group:"AP-223",push:{k1:subs.D1.s}},                           /* tasdiqlanmagan */
  sE:{status:"ok",group:"T-123",topics:{m7:{p:10}},push:{k1:subs.E1.s}}               /* alohida ochilgan 7-mavzu */
};
const posts=[];
globalThis.fetch=async(u,o)=>{
  u=String(u);
  if(u==="https://db.test/meta/access.json") return new Response(JSON.stringify(access));
  if(u==="https://db.test/students.json") return new Response(JSON.stringify(students));
  if(u.startsWith("https://push.test/")){ posts.push({u,o}); return new Response("",{status:201}); }
  return new Response("{}",{status:404});
};
const realNow=Date.now; Date.now=()=>satEve;
const mod=await import("data:text/javascript,"+encodeURIComponent(code));
ck("GET: v=2",(await (await mod.default.fetch(new Request("https://w.test/"))).json()).v===2);
let P; await mod.default.scheduled({}, {}, {waitUntil:p=>{P=p;}}); const r=await P;
const to=posts.map(p=>Object.keys(subs).find(k=>subs[k].s.e===p.u)).sort();
ck("eslatma: Ali (2 qurilma) va Eldor — boshqalarga yo'q",JSON.stringify(to)==='["A1","A2","E1"]',JSON.stringify(to));
/* shifrni ochish */
async function hkdf(salt,ikm,info,len){ const k=await subtle.importKey("raw",ikm,"HKDF",false,["deriveBits"]); return new Uint8Array(await subtle.deriveBits({name:"HKDF",hash:"SHA-256",salt,info},k,len*8)); }
async function dec(sb,body){
  body=new Uint8Array(body); const salt=body.slice(0,16), idl=body[20], asPub=body.slice(21,21+idl), ct=body.slice(21+idl);
  const asKey=await subtle.importKey("raw",asPub,{name:"ECDH",namedCurve:"P-256"},false,[]);
  const shared=new Uint8Array(await subtle.deriveBits({name:"ECDH",public:asKey},sb.k.privateKey,256));
  const uaPub=ub(sb.s.p), te=new TextEncoder();
  const ikm=await hkdf(ub(sb.s.a),shared,new Uint8Array([...te.encode("WebPush: info\0"),...uaPub,...asPub]),32);
  const cek=await hkdf(salt,ikm,te.encode("Content-Encoding: aes128gcm\0"),16), nonce=await hkdf(salt,ikm,te.encode("Content-Encoding: nonce\0"),12);
  const key=await subtle.importKey("raw",cek,"AES-GCM",false,["decrypt"]);
  const pt=new Uint8Array(await subtle.decrypt({name:"AES-GCM",iv:nonce},key,ct));
  return JSON.parse(new TextDecoder().decode(pt.slice(0,pt.lastIndexOf(2))));
}
const pa=posts.find(p=>p.u===subs.A1.s.e), pe=posts.find(p=>p.u===subs.E1.s.e);
const ma=await dec(subs.A1,pa.o.body), me=await dec(subs.E1,pe.o.body);
console.log("   Ali:",JSON.stringify(ma)); console.log("   Eldor:",JSON.stringify(me));
ck("Ali: «ertaga 23:59 da ball muddati tugaydi», 6-mavzu 40/100, havola mavzu-6",/Ertaga 23:59 da ball muddati tugaydi/.test(ma.t)&&/6-mavzu: 40 \/ 100/.test(ma.b)&&ma.u==="https://site.test/kurs/mavzu-6.html");
ck("Eldor: 7-mavzu (alohida ochilgan)",/7-mavzu: 10 \/ 100/.test(me.b)&&/mavzu-7\.html$/.test(me.u));
ck("VAPID imzosi va sarlavhalar",/^vapid t=.+, k=/.test(pa.o.headers.Authorization)&&pa.o.headers["Content-Encoding"]==="aes128gcm");
ck("natija: 2 talaba, 3 qurilma",r.students===2&&r.sent===3,JSON.stringify(r));
/* muddatga 36 soatdan ko'p qolgan bo'lsa (masalan juma) — eslatma yo'q */
posts.length=0; Date.now=()=>satEve-2*24*H; await mod.default.scheduled({}, {}, {waitUntil:p=>{P=p;}}); await P;
ck("juma kuni ishga tushsa — hech kimga ketmaydi",posts.length===0,posts.length);
Date.now=realNow; console.log("FAILS:",fails);
