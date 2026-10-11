/* ⌨️ YOZUV MARAFONI — rasmiy natija hisobi.
   DIQQAT: shu fayl inject.py orqali arena.html ga ham, taqdimot dvigateliga ham AYNAN bir xil qo'yiladi —
   faqat shu yerda o'zgartiring.
   g = /kahoot/games/<kalit>:
     meta {type:"yz", start, dur (soniya), mode ("fin" — marra | "time" — vaqtga), nw (so'zlar soni), min, pr:{a:[5,4,3]}}
     q/0/t  — poyga matni
     p/<sid> — qo'shilgan talabalar {n, g, at}
     a/<i>/<sid>.t — talaba i-so'zni tugatgan payt (server vaqti, har bir nazorat nuqtasi faqat bir marta yoziladi)
   O'rin: eng uzoq yetgan nazorat nuqtasi (ko'p so'z) → unga ertaroq yetgan → oldinroq qo'shilgan.
   Odam uchun imkonsiz tezlik (soniyasiga 15 belgidan ortiq) shubhali deb belgilanadi va sovrin olmaydi. */
function yzWords(t){ return String(t||"").split(" ").filter(function(w){ return w.length>0; }); }
function yzScore(g){
  var m=(g&&g.meta)||{}, P=(g&&g.p)||{}, A=(g&&g.a)||{}, st=+m.start||0, W=+m.nw||0;
  /* vaqtga rejimida taymer tugagach 1,5 soniyagacha kelgan yozuv hisobga olinadi (tarmoq kechikishi) */
  var lim=st+(+m.dur||0)*1000+(m.mode==="time"?1500:4000);
  var words=yzWords(((g&&g.q&&g.q[0])||{}).t), cum=[], c=0;
  for(var k=0;k<words.length;k++){ c+=words[k].length+(k?1:0); cum.push(c); }
  var rows=Object.keys(P).map(function(sid){
    var pp=P[sid]||{}, r={sid:sid,n:pp.n||"?",g:pp.g||"",at:+pp.at||0,w:0,t:0,ch:0,fin:false,sus:false,wpm:0,s:0};
    for(var i=W;i>=1;i--){
      var a=(A[i]||{})[sid], ta=a?+a.t:0;
      if(ta&&ta>=st&&ta<=lim){ r.w=i; r.t=ta-st; break; }
    }
    if(r.w){
      r.ch=cum[r.w-1]||0; r.fin=(r.w===W);
      if(r.t<=0||(r.ch>=20&&r.ch/(r.t/1000)>15)) r.sus=true;
      r.wpm=r.t>0?Math.round(r.w*60000/r.t):0;
    }
    r.s=r.w;
    return r;
  });
  rows.sort(function(x,y){ return (x.sus-y.sus)||(y.w-x.w)||(x.t-y.t)||(x.at-y.at)||(x.sid<y.sid?-1:1); });
  rows.forEach(function(r,i){ r.rank=i+1; });
  var cnt=rows.length, valid=cnt>=(+m.min||3), pr={}, pz=(m.pr&&m.pr.a)||[5,4,3], j=0;
  if(valid) rows.forEach(function(r){ if(j<pz.length&&!r.sus&&r.w>0){ pr[r.sid]=+pz[j]; j++; } });
  return {rows:rows,n:cnt,valid:valid,prizes:pr};
}
