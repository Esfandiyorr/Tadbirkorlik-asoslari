/* ================== KV — krossvord tuzuvchi (Arena uchun) ==================
   Savol-javoblardan krossvord katakchalarini o'zi tuzadi va PDF qiladi.
   - KV.build(items, opts)  -> {rows, cols, cells, words, unplaced, skipped, stats}
   - KV.verify(puzzle)      -> {ok, errors}   (tuzilgan setkani qayta tekshiradi)
   - KV.pdf(puzzle, meta)   -> Promise<Blob>  (A4, savollar + javoblar sahifasi; faqat brauzerda)
   - KV.parseLines(text)    -> [{q, a}]       ("Savol | Javob" qatorlaridan)
   Bu fayl _reyting-manba/inject.py orqali arena.html ga qo'shiladi. */
(function(root){
"use strict";
var MAXLEN=25, MAXWORDS=40, G=64;
/* ---------- matn: javobni kataklarga ajratish ---------- */
function normApos(s){ return String(s==null?"":s).replace(/[ʻʼ'`’‘´ʹ]/g,"'"); }
function tok(raw,digraph){
  if(digraph===undefined) digraph=true;
  var cp=Array.from(normApos(raw).toUpperCase()), out=[], i=0;
  while(i<cp.length){
    var ch=cp[i], nx=cp[i+1];
    if(digraph){
      if((ch==="O"||ch==="G")&&nx==="'"){ out.push(ch+"'"); i+=2; continue; }
      if((ch==="S"||ch==="C")&&nx==="H"){ out.push(ch+"H"); i+=2; continue; }
    }
    if(/[\p{L}\p{N}]/u.test(ch)) out.push(ch);
    i++;
  }
  return out;
}
/* "Bozor iqtisodiyoti" -> "(5,11)" */
function lensOf(raw,digraph){
  var parts=String(raw||"").split(/[\s\-–—]+/).map(function(p){ return tok(p,digraph).length; }).filter(Boolean);
  return parts.length>1?"("+parts.join(",")+")":"("+(parts[0]||0)+")";
}
/* ---------- tasodifiy son (seed) ---------- */
function rng(seed){ var a=(seed>>>0)||1; return function(){ a=(a+0x6D2B79F5)>>>0; var t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
/* ---------- bitta urinish ---------- */
function attempt(W,rnd){
  var letter=new Uint16Array(G*G), mark=new Uint8Array(G*G), filled=[], placed=[];
  var minR=G,maxR=0,minC=G,maxC=0;
  function canPlace(ids,r,c,dir){
    var n=ids.length, dr=dir?1:0, dc=dir?0:1, r2=r+dr*(n-1), c2=c+dc*(n-1);
    if(r<2||c<2||r2>G-3||c2>G-3) return -1;
    if(letter[(r-dr)*G+(c-dc)]||letter[(r2+dr)*G+(c2+dc)]) return -1;
    var bit=dir?2:1, inter=0;
    for(var i=0;i<n;i++){
      var p=(r+dr*i)*G+(c+dc*i), v=letter[p];
      if(v){ if(v!==ids[i]||(mark[p]&bit)) return -1; inter++; }
      else if(dir?(letter[p-1]||letter[p+1]):(letter[p-G]||letter[p+G])) return -1;
    }
    return inter;
  }
  function put(w,ids,r,c,dir){
    var dr=dir?1:0, dc=dir?0:1, bit=dir?2:1;
    for(var i=0;i<ids.length;i++){
      var rr=r+dr*i, cc=c+dc*i, p=rr*G+cc;
      if(!letter[p]){ letter[p]=ids[i]; filled.push(p); }
      mark[p]|=bit;
      if(rr<minR)minR=rr; if(rr>maxR)maxR=rr; if(cc<minC)minC=cc; if(cc>maxC)maxC=cc;
    }
    placed.push({w:w,r:r,c:c,dir:dir});
  }
  var order=W.map(function(_,i){ return i; }).sort(function(a,b){ return (W[b].ids.length+rnd()*4)-(W[a].ids.length+rnd()*4); });
  /* birinchi so'z — markazda */
  var f=order.shift(), fw=W[f], fdir=rnd()<.5?0:1;
  put(f,fw.ids,fdir?(G>>1)-(fw.ids.length>>1):(G>>1),fdir?(G>>1):(G>>1)-(fw.ids.length>>1),fdir);
  var rest=order, progress=true;
  while(rest.length&&progress){
    progress=false; var next=[];
    for(var k=0;k<rest.length;k++){
      var wi=rest[k], ids=W[wi].ids, best=null, bs=-1e9;
      for(var q=0;q<filled.length;q++){
        var p=filled[q], v=letter[p], pr=(p/G)|0, pc=p%G;
        for(var i=0;i<ids.length;i++){
          if(ids[i]!==v) continue;
          for(var dir=0;dir<2;dir++){
            var r=dir?pr-i:pr, c=dir?pc:pc-i, inter=canPlace(ids,r,c,dir);
            if(inter<1) continue;
            var nr0=Math.min(minR,r), nr1=Math.max(maxR,dir?r+ids.length-1:r), nc0=Math.min(minC,c), nc1=Math.max(maxC,dir?c:c+ids.length-1);
            var h=nr1-nr0+1, w=nc1-nc0+1;
            var sc=inter*60-h*w-Math.abs(h-w)*3+rnd()*8;
            if(sc>bs){ bs=sc; best={r:r,c:c,dir:dir}; }
          }
        }
      }
      if(best){ put(wi,ids,best.r,best.c,best.dir); progress=true; } else next.push(wi);
    }
    rest=next;
  }
  var cross=0; for(var z=0;z<filled.length;z++) if(mark[filled[z]]===3) cross++;
  var h2=maxR-minR+1, w2=maxC-minC+1;
  return {placed:placed,cross:cross,h:h2,w:w2,minR:minR,minC:minC,letter:letter,
          score:placed.length*1e5+cross*50-h2*w2*2-Math.abs(h2-w2)*4};
}
/* ---------- asosiy: build ---------- */
function build(items,opts){
  opts=opts||{};
  var digraph=opts.digraph!==false, seed=opts.seed==null?1:opts.seed, attempts=opts.attempts||350, ms=opts.ms||450;
  var entries=[], skipped=[], seen={}, tbl={}, nid=0;
  (items||[]).forEach(function(it,idx){
    var a=it&&it.a!=null?it.a:(it&&it.answer), q=it&&it.q!=null?it.q:(it&&it.clue);
    if(a==null||String(a).trim()==="") return;                       /* bo'sh qator — hisobga olinmaydi */
    var t=tok(a,digraph);
    if(t.length<2){ skipped.push({i:idx,why:"short"}); return; }
    if(t.length>MAXLEN){ skipped.push({i:idx,why:"long"}); return; }
    var key=t.join("|");
    if(seen[key]){ skipped.push({i:idx,why:"dup"}); return; }
    if(entries.length>=MAXWORDS){ skipped.push({i:idx,why:"many"}); return; }
    seen[key]=1;
    var ids=t.map(function(x){ return tbl[x]||(tbl[x]=++nid); });
    entries.push({i:idx,q:String(q||"").trim(),raw:String(a).trim(),t:t,ids:ids});
  });
  var res={rows:0,cols:0,cells:[],words:[],unplaced:[],skipped:skipped,stats:{words:entries.length,placed:0,cross:0}};
  if(entries.length<2){ res.unplaced=entries.map(function(e){ return {i:e.i,why:"nofit"}; }); if(entries.length===1) res.unplaced[0].why="alone"; return res; }
  var rnd=rng(seed*7919+entries.length), best=null, t0=Date.now();
  for(var a=0;a<attempts&&(a<8||Date.now()-t0<ms);a++){
    var r=attempt(entries,rnd);
    if(!best||r.score>best.score) best=r;
  }
  /* kesish va katakchalarni yig'ish */
  var inv=[]; Object.keys(tbl).forEach(function(k){ inv[tbl[k]]=k; });
  var rows=best.h, cols=best.w, cells=[];
  for(var y=0;y<rows;y++){ var row=[]; for(var x=0;x<cols;x++){ var id=best.letter[(best.minR+y)*G+best.minC+x]; row.push(id?inv[id]:""); } cells.push(row); }
  /* raqamlash: o'qish tartibida */
  var num=[], n=0, starts={};
  for(var yy=0;yy<rows;yy++){ num.push([]); for(var xx=0;xx<cols;xx++){
    var has=!!cells[yy][xx], sa=has&&!(xx>0&&cells[yy][xx-1])&&(xx+1<cols&&!!cells[yy][xx+1]), sd=has&&!(yy>0&&cells[yy-1][xx])&&(yy+1<rows&&!!cells[yy+1][xx]);
    if(sa||sd){ n++; num[yy].push(n); if(sa) starts[yy+","+xx+",A"]=n; if(sd) starts[yy+","+xx+",D"]=n; } else num[yy].push(0);
  } }
  var placedSet={};
  var words=best.placed.map(function(pl){
    var e=entries[pl.w], r0=pl.r-best.minR, c0=pl.c-best.minC, d=pl.dir?"D":"A";
    placedSet[pl.w]=1;
    return {i:e.i,n:starts[r0+","+c0+","+d],dir:d,r:r0,c:c0,len:e.t.length,cells:e.t.slice(),answer:e.t.join(""),clue:e.q,lens:lensOf(e.raw,digraph)};
  }).sort(function(a,b){ return a.n-b.n||(a.dir<b.dir?-1:1); });
  entries.forEach(function(e,k){ if(!placedSet[k]) res.unplaced.push({i:e.i,why:"nofit"}); });
  res.rows=rows; res.cols=cols; res.cells=cells; res.num=num; res.words=words;
  res.stats={words:entries.length,placed:words.length,cross:best.cross};
  return res;
}
/* ---------- tekshiruv: setkadagi har bir 2+ harfli qator aynan joylangan so'z bo'lishi kerak ---------- */
function verify(p){
  var errs=[], rows=p.rows, cols=p.cols, c=p.cells, have={};
  p.words.forEach(function(w){ have[w.r+","+w.c+","+w.dir]=w; });
  function cell(r,x){ return r>=0&&x>=0&&r<rows&&x<cols?c[r][x]:""; }
  var cnt=0;
  for(var r=0;r<rows;r++) for(var x=0;x<cols;x++){
    if(!c[r][x]) continue;
    [["A",0,1],["D",1,0]].forEach(function(d){
      if(cell(r-d[1],x-d[2])) return;                          /* qator boshi emas */
      var len=0; while(cell(r+d[1]*len,x+d[2]*len)) len++;
      if(len<2) return;
      var w=have[r+","+x+","+d[0]];
      if(!w){ errs.push("rejasiz qator: "+d[0]+" "+r+","+x); return; }
      cnt++;
      if(w.len!==len) errs.push("uzunlik mos emas: "+w.answer);
      for(var i=0;i<len;i++) if(cell(r+d[1]*i,x+d[2]*i)!==w.cells[i]) errs.push("harf mos emas: "+w.answer);
    });
  }
  if(cnt!==p.words.length) errs.push("so'zlar soni mos emas: "+cnt+" / "+p.words.length);
  /* bog'langanlik: hamma so'z bitta butun bo'lishi kerak */
  if(p.words.length){
    var seen={}, stack=[p.words[0]], got=1; seen[0]=1;
    function cellsOf(w){ var o=[]; for(var i=0;i<w.len;i++) o.push((w.r+(w.dir==="D"?i:0))+","+(w.c+(w.dir==="A"?i:0))); return o; }
    var idx={}; p.words.forEach(function(w,k){ cellsOf(w).forEach(function(s){ (idx[s]=idx[s]||[]).push(k); }); });
    var q=[0]; while(q.length){ var k=q.pop(); cellsOf(p.words[k]).forEach(function(s){ idx[s].forEach(function(j){ if(!seen[j]){ seen[j]=1; got++; q.push(j); } }); }); }
    if(got!==p.words.length) errs.push("krossvord bitta butun emas: "+got+" / "+p.words.length);
  }
  return {ok:!errs.length,errors:errs};
}
/* ---------- "Savol | Javob" matnini o'qish ---------- */
function parseLines(text){
  var out=[];
  String(text||"").split(/\r?\n/).forEach(function(line){
    line=line.trim(); if(!line) return;
    var q,a,m;
    if(line.indexOf("\t")>=0){ var p=line.split("\t"); q=p[0]; a=p[1]; }
    else if(line.indexOf("|")>=0){ var j=line.lastIndexOf("|"); q=line.slice(0,j); a=line.slice(j+1); }
    else if((m=line.match(/^(.*\S)\s+[=–—-]+\s+(\S[^=–—-]*)$/))){ q=m[1]; a=m[2]; }
    else { q=line; a=""; }
    out.push({q:(q||"").trim(),a:(a||"").trim()});
  });
  return out;
}
/* ---------- namuna ---------- */
var SAMPLE=[
 ["Daromad olish maqsadida tashabbus bilan ish yurituvchi shaxs","Tadbirkor"],
 ["Daromaddan xarajat ayirilgandan keyin qoladigan qism","Foyda"],
 ["Sotuvdan tushgan jami pul","Daromad"],
 ["Mahsulot yoki xizmatni sotib oluvchi odam","Mijoz"],
 ["Sotuvchi va xaridor uchrashadigan joy yoki tizim","Bozor"],
 ["Bank beradigan, foiz bilan qaytariladigan qarz","Kredit"],
 ["Davlat byudjetiga to'lanadigan majburiy to'lov","Soliq"],
 ["Ishlab chiqarilgan va sotiladigan tovar","Mahsulot"],
 ["Biznes uchun sarflangan pul","Xarajat"],
 ["Natija kafolatlanmagan holat","Risk"],
 ["Tez o'sishga mo'ljallangan yosh kompaniya","Startap"],
 ["Foyda olish maqsadidagi faoliyat","Biznes"],
 ["Bir mijoz uchun bahslashuvchi firmalar o'rtasidagi kurash","Raqobat"],
 ["Mahsulotning pul bilan ifodalangan qiymati","Narx"]];
function sample(){ return SAMPLE.map(function(x){ return {q:x[0],a:x[1]}; }); }

/* ======================= PDF (A4, rasm sahifalar) =======================
   Har bir sahifa canvas'da 200 dpi da chiziladi va JPEG qilib PDF ga joylanadi —
   shuning uchun har qanday harf (o', g', kirill) to'g'ri chiqadi. */
var PXMM=200/25.4;
function mm(v){ return Math.round(v*PXMM); }
var FONT='system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
function wrap(ctx,text,maxW){
  var words=String(text).split(/\s+/), lines=[], cur="";
  words.forEach(function(w){
    var t=cur?cur+" "+w:w;
    if(ctx.measureText(t).width<=maxW||!cur) cur=t; else { lines.push(cur); cur=w; }
  });
  if(cur) lines.push(cur);
  return lines;
}
function drawGrid(ctx,p,x0,y0,cell,show){
  var lw=Math.max(2,Math.round(cell*.045));
  ctx.lineWidth=lw; ctx.strokeStyle="#1b2433"; ctx.lineJoin="miter";
  for(var r=0;r<p.rows;r++) for(var c=0;c<p.cols;c++){
    var t=p.cells[r][c]; if(!t) continue;
    var x=x0+c*cell, y=y0+r*cell;
    ctx.fillStyle="#ffffff"; ctx.fillRect(x,y,cell,cell);
    ctx.strokeRect(x+lw/2,y+lw/2,cell-lw,cell-lw);
    var n=p.num[r][c];
    if(n){ ctx.fillStyle="#1b2433"; ctx.font="700 "+Math.round(cell*.27)+"px "+FONT; ctx.textAlign="left"; ctx.textBaseline="top"; ctx.fillText(String(n),x+lw+Math.round(cell*.05),y+lw+Math.round(cell*.02)); }
    if(show){ ctx.fillStyle="#1d4ed8"; ctx.font="800 "+Math.round(cell*(t.length>1?.42:.58))+"px "+FONT; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(t,x+cell/2,y+cell*.58); }
  }
}
function pdfPages(p,meta){
  meta=meta||{};
  var W=mm(210), H=mm(297), M=mm(14), pages=[];
  function newPage(){
    var cv=document.createElement("canvas"); cv.width=W; cv.height=H; var ctx=cv.getContext("2d");
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,H); pages.push({cv:cv,ctx:ctx}); return pages[pages.length-1];
  }
  function title(pg,txt,y){
    var ctx=pg.ctx, sz=Math.round(mm(9.5));
    ctx.font="800 "+sz+"px "+FONT; while(ctx.measureText(txt).width>W-2*M&&sz>mm(5)){ sz-=2; ctx.font="800 "+sz+"px "+FONT; }
    ctx.fillStyle="#0d1b2a"; ctx.textAlign="left"; ctx.textBaseline="alphabetic"; ctx.fillText(txt,M,y);
    return sz;
  }
  function band(pg){ var g=pg.ctx.createLinearGradient(M,0,W-M,0); g.addColorStop(0,"#12a150"); g.addColorStop(.5,"#0891b2"); g.addColorStop(1,"#7c3aed"); pg.ctx.fillStyle=g; pg.ctx.fillRect(M,mm(11),W-2*M,mm(2)); }
  var T=meta.title||"Krossvord";
  /* ---- 1-sahifa: sarlavha, katakchalar ---- */
  var pg=newPage(); band(pg);
  title(pg,T,mm(25));
  var ctx=pg.ctx;
  ctx.font="500 "+mm(3.6)+"px "+FONT; ctx.fillStyle="#5b6b82"; ctx.textAlign="left";
  ctx.fillText("Tadbirkorlik asoslari · Termiz davlat universiteti · O'yin arenasi",M,mm(31.5));
  /* ism / guruh / sana chiziqlari */
  ctx.font="600 "+mm(3.6)+"px "+FONT; ctx.fillStyle="#1b2433";
  var fy=mm(41);
  [["Ism-familiya:",M,mm(80)],["Guruh:",M+mm(88),mm(40)],["Sana:",M+mm(134),W-M-(M+mm(134))]].forEach(function(f){
    ctx.fillText(f[0],f[1],fy); var tw=ctx.measureText(f[0]).width;
    ctx.strokeStyle="#9aa6b8"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(f[1]+tw+mm(2),fy+mm(.6)); ctx.lineTo(f[1]+f[2]-mm(2),fy+mm(.6)); ctx.stroke();
  });
  var gy=mm(50), maxGW=W-2*M, maxGH=mm(138);
  var colW=Math.floor((W-2*M-mm(10))/2), fz=mm(3.7), lh=Math.round(fz*1.32), gap=Math.round(fz*.55), bottom=H-mm(18), topN=mm(24);
  /* savollar to'liq 1-sahifaga sig'ishi uchun katakchani iloji boricha kattaroq, lekin yetarli darajada tanlash */
  function colHeight(list){
    var c=pages[0].ctx, h=Math.round(fz*1.9); c.font="500 "+fz+"px "+FONT;
    var nw=(c.font="800 "+fz+"px "+FONT,c.measureText("00. ").width); c.font="500 "+fz+"px "+FONT;
    list.forEach(function(w){ h+=wrap(c,(w.clue||"(savol yozilmagan)")+" "+w.lens,colW-nw).length*lh+gap; });
    return h;
  }
  var needA=colHeight(p.words.filter(function(w){ return w.dir==="A"; })), needD=colHeight(p.words.filter(function(w){ return w.dir==="D"; })), need=Math.max(needA,needD);
  var maxCell=Math.min(Math.floor(maxGW/p.cols),Math.floor(maxGH/p.rows),mm(12)), minCell=Math.min(maxCell,mm(7)), cell=maxCell;
  while(cell>minCell&&gy+cell*p.rows+mm(9)+need>bottom) cell-=2;
  var gw=cell*p.cols, gx=Math.round((W-gw)/2);
  drawGrid(ctx,p,gx,gy,cell,false);
  var yAfter=gy+cell*p.rows+mm(9);
  /* ---- savollar: ikki ustun, sahifalarga oqadi ---- */
  var cols=[{x:M,pg:0,y:yAfter,list:p.words.filter(function(w){ return w.dir==="A"; }),head:"GORIZONTAL  →"},
            {x:M+colW+mm(10),pg:0,y:yAfter,list:p.words.filter(function(w){ return w.dir==="D"; }),head:"VERTIKAL  ↓"}];
  function page(i){ while(pages.length<=i){ var q=newPage(); band(q); q.ctx.font="700 "+mm(4)+"px "+FONT; q.ctx.fillStyle="#5b6b82"; q.ctx.textAlign="left"; q.ctx.fillText(T+" — savollar (davomi)",M,mm(21)); } return pages[i]; }
  function ensure(col,need){ if(col.y+need>bottom){ col.pg++; col.y=topN+mm(4); } }
  cols.forEach(function(col){
    ensure(col,mm(12)); var c=page(col.pg).ctx;
    c.font="800 "+Math.round(fz*1.02)+"px "+FONT; c.fillStyle="#12a150"; c.textAlign="left"; c.textBaseline="alphabetic";
    c.fillText(col.head,col.x,col.y+fz); col.y+=Math.round(fz*1.9);
    col.list.forEach(function(w){
      var c2=page(col.pg).ctx, numW;
      c2.font="800 "+fz+"px "+FONT; numW=c2.measureText("00. ").width;
      var text=(w.clue||"(savol yozilmagan)")+" "+w.lens;
      c2.font="500 "+fz+"px "+FONT;
      var lines=wrap(c2,text,colW-numW);
      ensure(col,lines.length*lh+gap);
      var cc=page(col.pg).ctx;
      cc.textAlign="left"; cc.textBaseline="alphabetic";
      cc.font="800 "+fz+"px "+FONT; cc.fillStyle="#0d1b2a"; cc.fillText(w.n+".",col.x,col.y+fz);
      cc.font="500 "+fz+"px "+FONT; cc.fillStyle="#1b2433";
      lines.forEach(function(ln,k){ cc.fillText(ln,col.x+numW,col.y+fz+k*lh); });
      col.y+=lines.length*lh+gap;
    });
  });
  /* ---- javoblar sahifasi ---- */
  var ap=newPage(); band(ap);
  title(ap,"Javoblar — "+T,mm(25));
  ap.ctx.font="500 "+mm(3.6)+"px "+FONT; ap.ctx.fillStyle="#5b6b82"; ap.ctx.textAlign="left"; ap.ctx.fillText("Tekshirish uchun. Avval o'zingiz yechib ko'ring!",M,mm(31.5));
  var acell=Math.min(Math.floor(maxGW/p.cols),Math.floor(mm(110)/p.rows),mm(9)), aw=acell*p.cols;
  drawGrid(ap.ctx,p,Math.round((W-aw)/2),mm(40),acell,true);
  var ay=mm(40)+acell*p.rows+mm(10), api=pages.length-1, ac=ap.ctx;
  var acols=[{x:M,list:p.words.filter(function(w){ return w.dir==="A"; }),head:"GORIZONTAL  →",y:ay},{x:M+colW+mm(10),list:p.words.filter(function(w){ return w.dir==="D"; }),head:"VERTIKAL  ↓",y:ay}];
  acols.forEach(function(col){
    var pgi=api, y=col.y;
    function cur(){ while(pages.length<=pgi){ var q=newPage(); band(q); } return pages[pgi].ctx; }
    var c=cur(); c.font="800 "+Math.round(fz*1.02)+"px "+FONT; c.fillStyle="#12a150"; c.textAlign="left"; c.textBaseline="alphabetic"; c.fillText(col.head,col.x,y+fz); y+=Math.round(fz*1.9);
    col.list.forEach(function(w){
      if(y+lh*1.6>bottom){ pgi++; y=topN+mm(4); }
      var cc=cur(); cc.textAlign="left"; cc.textBaseline="alphabetic";
      cc.font="800 "+fz+"px "+FONT; cc.fillStyle="#0d1b2a"; cc.fillText(w.n+".",col.x,y+fz);
      cc.font="700 "+fz+"px "+FONT; cc.fillStyle="#1d4ed8"; cc.fillText(w.cells.join(""),col.x+mm(9),y+fz);
      y+=Math.round(lh*1.25);
    });
  });
  /* ---- pastki yozuv va sahifa raqami ---- */
  pages.forEach(function(q,i){
    var c=q.ctx; c.font="500 "+mm(3.1)+"px "+FONT; c.fillStyle="#7a879b"; c.textBaseline="alphabetic";
    c.textAlign="left"; c.fillText((meta.author?("Tuzdi: "+meta.author+(meta.group?" ("+meta.group+")":"")+" · "):"")+"TerDU · Tadbirkorlik asoslari · Arena krossvord",M,H-mm(9));
    c.textAlign="right"; c.fillText((i+1)+" / "+pages.length,W-M,H-mm(9));
  });
  return pages;
}
/* ---------- PDF fayl yig'ish ---------- */
function utf16hex(s){ var h="FEFF"; for(var i=0;i<s.length;i++){ h+=("000"+s.charCodeAt(i).toString(16)).slice(-4); } return "<"+h.toUpperCase()+">"; }
function assemble(jpgs,info){
  var enc=new TextEncoder(), parts=[], off=0, xr=[];
  function put(x){ var b=typeof x==="string"?enc.encode(x):x; parts.push(b); off+=b.length; }
  function obj(n,body){ xr[n]=off; put(n+" 0 obj\n"+body+"\nendobj\n"); }
  var PW=595.28, PH=841.89, n=jpgs.length;
  put("%PDF-1.4\n"); put(new Uint8Array([37,226,227,207,211,10]));
  obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  var kids=[]; for(var i=0;i<n;i++) kids.push((4+i*3)+" 0 R");
  obj(2,"<< /Type /Pages /Kids ["+kids.join(" ")+"] /Count "+n+" >>");
  var d=new Date(), pad=function(v){ return ("0"+v).slice(-2); };
  var cd="D:"+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
  obj(3,"<< /Title "+utf16hex(info.title||"Krossvord")+" /Author "+utf16hex(info.author||"TerDU Arena")+" /Creator "+utf16hex("TerDU Arena — krossvord")+" /CreationDate ("+cd+") >>");
  for(var k=0;k<n;k++){
    var po=4+k*3, co=po+1, io=po+2;
    obj(po,"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+PW+" "+PH+"] /Resources << /XObject << /Im0 "+io+" 0 R >> >> /Contents "+co+" 0 R >>");
    var cs="q "+PW+" 0 0 "+PH+" 0 0 cm /Im0 Do Q";
    obj(co,"<< /Length "+cs.length+" >>\nstream\n"+cs+"\nendstream");
    xr[io]=off;
    put(io+" 0 obj\n<< /Type /XObject /Subtype /Image /Width "+jpgs[k].w+" /Height "+jpgs[k].h+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+jpgs[k].b.length+" >>\nstream\n");
    put(jpgs[k].b); put("\nendstream\nendobj\n");
  }
  var total=4+n*3, xo=off, x="xref\n0 "+total+"\n0000000000 65535 f \n";
  for(var j=1;j<total;j++) x+=("0000000000"+xr[j]).slice(-10)+" 00000 n \n";
  put(x+"trailer\n<< /Size "+total+" /Root 1 0 R /Info 3 0 R >>\nstartxref\n"+xo+"\n%%EOF");
  return new Blob(parts,{type:"application/pdf"});
}
function pdf(p,meta){
  var pages=pdfPages(p,meta);
  return Promise.all(pages.map(function(q){
    return new Promise(function(res,rej){ q.cv.toBlob(function(b){ b?res(b):rej(new Error("jpeg")); },"image/jpeg",.92); })
      .then(function(b){ return b.arrayBuffer(); }).then(function(ab){ return {b:new Uint8Array(ab),w:q.cv.width,h:q.cv.height}; });
  })).then(function(j){ return assemble(j,{title:(meta&&meta.title)||"Krossvord",author:(meta&&meta.author)||""}); });
}
var KV={tok:tok,lens:lensOf,build:build,verify:verify,parseLines:parseLines,sample:sample,pdf:pdf,pages:pdfPages,max:{len:MAXLEN,words:MAXWORDS}};
root.KV=KV;
if(typeof module!=="undefined"&&module.exports) module.exports=KV;
})(typeof window!=="undefined"?window:globalThis);
