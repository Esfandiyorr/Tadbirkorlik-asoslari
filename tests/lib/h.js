/* Sinov yordamchisi: soxta Firebase (xotirada, server vaqti bilan), talaba/o'qituvchi brauzer konteksti.
   Sahifalar haqiqiy (tests/.site — run.js yig'adi), faqat bazaga so'rovlar shu yerda javob oladi. */
const { chromium } = require('playwright');
const SITE=process.env.SITE||"http://127.0.0.1:8124";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; function ck(n,c,x){ if(!c) fails++; console.log((c?"OK  ":"FAIL")+" "+n+(x!==undefined?"  "+String(x).slice(0,300):"")); }
const DBS={students:{},meta:{},kahoot:{cfg:{on:false,time:"20:00",nq:10,qsec:15,min:7,lobby:10},bank:{},idx:{},res:{}},owners:{},arena:{}};
function dbGet(path){ let o=DBS; for(const k of path.split("/").filter(Boolean)){ if(o==null||typeof o!=="object") return null; o=o[k]; } return o===undefined?null:o; }
function dbSet(path,val){ const ks=path.split("/").filter(Boolean); let o=DBS; for(let i=0;i<ks.length-1;i++){ if(o[ks[i]]==null||typeof o[ks[i]]!=="object") o[ks[i]]={}; o=o[ks[i]]; } if(val===null) delete o[ks[ks.length-1]]; else o[ks[ks.length-1]]=val; }
function sv(v,now){ if(v&&typeof v==="object"){ if(v[".sv"]==="timestamp") return now; const o=Array.isArray(v)?[]:{}; for(const k in v) o[k]=sv(v[k],now); return o; } return v; }
const CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"GET,PUT,POST,PATCH,DELETE,OPTIONS"};
/* qoidalarning kahoot qismini soddalashtirib tekshiramiz (yozuv poygasi uchun muhim joylar) */
function kRule(m,path,body,now){
  const p=path.split("/");
  /* 🔑 hisobga egalik (kirish): owners/<talaba>/<brauzer> ga faqat to'g'ri PIN izi yoziladi — haqiqiy qoidadagi «claim».
     Yopiq «keys/<talaba>» bor bo'lsa — shunga, bo'lmasa students/<talaba>/pk ga teng bo'lishi kerak; yozuv yo'q bo'lsa — yangi */
  if(p[0]==="owners"&&p.length===3&&m==="PUT"){
    const k=dbGet("keys/"+p[1]), pk=dbGet("students/"+p[1]+"/pk");
    if(k!=null) return body===k;
    if(pk!=null) return body===pk;
    return true;
  }
  if(p[0]!=="kahoot") return true;
  if(p[1]==="games"&&p.length>=3){
    const g=dbGet("kahoot/games/"+p[2])||{}, meta=g.meta||{};
    if(m==="GET"){
      if(p.length===3) return +meta.end<=now;
      if(p[3]==="meta"||p[3]==="p") return true;
      if(p[3]==="q"&&p[4]!=null) return +(((g.q||{})[p[4]])||{}).at<=now;
      if(p[3]==="k"&&p[4]!=null) return +(((g.k||{})[p[4]])||{}).cl+1500<=now;
      if(p[3]==="a"&&p[4]!=null) return +(((g.k||{})[p[4]])||{}).cl+1500<=now;
      return false;
    }
    if(p[3]==="p"&&p[4]){ if(dbGet(path)) return false; return now>=+meta.open&&now<+meta.start; }
    if(p[3]==="a"&&p[5]){ if(dbGet(path)) return false; if(!dbGet("kahoot/games/"+p[2]+"/p/"+p[5])) return false;
      const q=(g.q||{})[p[4]], k=(g.k||{})[p[4]]; return !!(q&&k&&+q.at<=now&&now<=+k.cl&&body&&body.t===now); }
  }
  return true;
}
let RULES=true;
async function mk(b,stu,o){
  o=o||{};
  const ctx=await b.newContext(Object.assign({serviceWorkers:o.sw?"allow":"block",viewport:o.vp||{width:1280,height:860},deviceScaleFactor:o.dsf||1,isMobile:!!o.mobile,hasTouch:!!o.mobile},o.ua?{userAgent:o.ua}:{}));
  await ctx.route(/firebasedatabase\.app|firebaseio\.com/,async r=>{
    const rq=r.request(), u=new URL(rq.url()), m=rq.method(), now=Date.now();
    if(m==="OPTIONS") return r.fulfill({status:204,headers:CORS});
    const path=decodeURIComponent(u.pathname).replace(/^\/|\.json$/g,"");
    let body=null; try{ body=rq.postData()?sv(JSON.parse(rq.postData()),now):null; }catch(e){}
    if(RULES&&!kRule(m,path,body,now)) return r.fulfill({status:401,headers:CORS,contentType:"application/json",body:'{"error":"Permission denied"}'});
    let out=null;
    if(m==="GET"){ out=dbGet(path);
      if(u.searchParams.get("shallow")&&out&&typeof out==="object"){ const t={}; Object.keys(out).forEach(k=>t[k]=true); out=t; }
      if(u.searchParams.get("orderBy")&&out&&typeof out==="object"){ const sa=JSON.parse(u.searchParams.get("startAt")||'""'), lim=+u.searchParams.get("limitToFirst")||1e9; const t={}; Object.keys(out).sort().filter(k=>k>=sa).slice(0,lim).forEach(k=>t[k]=out[k]); out=t; } }
    else if(m==="PUT"){ dbSet(path,body); out=body; }
    else if(m==="PATCH"){ if(body&&typeof body==="object") Object.keys(body).forEach(k=>dbSet((path?path+"/":"")+k,body[k])); out=body; }
    else if(m==="DELETE"){ dbSet(path,null); }
    r.fulfill({status:200,headers:CORS,contentType:"application/json",body:JSON.stringify(out)});
  });
  let uid="uid"+Math.random().toString(36).slice(2,7);
  await ctx.route(/identitytoolkit|securetoken/,r=>r.fulfill({status:200,headers:CORS,contentType:"application/json",body:JSON.stringify({idToken:"fake",refreshToken:"rt",expiresIn:"3600",localId:uid,id_token:"fake",refresh_token:"rt",expires_in:"3600",user_id:uid})}));
  await ctx.addInitScript((a)=>{ try{ if(!a.land) sessionStorage.setItem("terdu_landed","1"); if(!a.ro) for(let i=1;i<=15;i++) sessionStorage.setItem("terdu_ro_m"+i,"1"); localStorage.setItem("terdu_lang","uz"); if(a.s&&!(a.once&&localStorage.getItem("terdu_student"))) localStorage.setItem("terdu_student",JSON.stringify(a.s)); if(a.t) window.__TT="tok"; if(a.th) localStorage.setItem("terdu_theme",a.th); if(a.mute) localStorage.setItem("terdu_mute","1"); if(a.pm&&!localStorage.getItem("terdu_pwa_msg")) localStorage.setItem("terdu_pwa_msg","2026-10-19"); }catch(e){} },{s:stu,t:o.tc,th:o.theme,mute:o.mute!==false,once:!!o.once,pm:!o.pwa,ro:!!o.ro,land:!!o.land});
  const p=await ctx.newPage(); p._errs=[]; p.on('pageerror',e=>p._errs.push(e.message)); p.on('console',m=>{ if(m.type()==="error") p._errs.push("console: "+m.text()); });
  return p;
}
const stu=(id,n,s,g)=>({id,name:n,surname:s,group:g,status:"ok",pk:"PK"+id,at:Date.now(),email:"x@t.uz"});
function addStu(id,n,s,g){ DBS.students[id]={id,name:n,surname:s,group:g,status:"ok",pk:"PK"+id,at:1}; }
module.exports={chromium,SITE,sleep,ck,DBS,dbGet,dbSet,mk,stu,addStu,fails:()=>fails,setRules:v=>{RULES=v;}};
