/* Only the platform copy changes. Standalone archive and shared grading engine stay intact. */
export function adaptPlatformLive(source) {
  function swap(before, after) {
    if (!source.includes(before) || source.indexOf(before) !== source.lastIndexOf(before))
      throw Error('Jonli test moslamasi yangilanishi kerak: ' + before.slice(0, 80));
    source = source.replace(before, after);
  }
  function swapIn(name, next, before, after) {
    const start = source.indexOf('function ' + name + '(');
    const end = source.indexOf('function ' + next + '(', start);
    const part = source.slice(start, end);
    if (start < 0 || end < 0 || !part.includes(before))
      throw Error('Jonli test funksiyasi mos emas: ' + name);
    source = source.slice(0, start) + part.replace(before, after) + source.slice(end);
  }
  function prepend(name, args, code) {
    const head = `function ${name}(${args}){`;
    swap(head, head + '\n' + code);
  }
  prepend('loadMe', '', '  if(window.SQ_LIVE) return ME;');
  prepend(
    'connect',
    'done',
    `  if(window.SQ_LIVE){
    SQ_LIVE.get("session",function(v,st,result){
      if(st===200&&v&&v.player){ ME=v.player; BASE="same-origin"; online=true; done(true); return; }
      APP.innerHTML=card('<div class="center"><h2>'+L("Jonli testga ulanib bo‘lmadi","Could not connect to the live quiz")+'</h2><p class="note">'+esc(result&&result.error||L("Ulanishni tekshirib, qayta urinib ko‘ring.","Check the connection and try again."))+'</p><button type="button" class="btn accent" id="liveRetry">'+L("Qayta urinish","Try again")+'</button> <a href="/#login" target="_top">'+L("Hisobga kirish","Sign in")+'</a></div>');
      document.getElementById("liveRetry").onclick=function(){location.reload();};
    }); return;
  }`,
  );
  prepend('kget', 'p,cb', '  if(window.SQ_LIVE){ SQ_LIVE.get(p,cb); return; }');
  prepend(
    'kput',
    'p,v,cb',
    '  if(window.SQ_LIVE){ SQ_LIVE.put(p,v,LV&&LV.meta?LV.meta.start:undefined,cb); return; }',
  );
  prepend(
    'clockSync',
    'cb',
    '  if(window.SQ_LIVE){ SQ_LIVE.clock(function(skew){ SKEW=skew; cb(); }); return; }',
  );
  swap(
    '  document.getElementById("lvSnd").onclick=function(){',
    '  document.querySelector(\'#lv a.lv-ib[href="#/"]\').setAttribute("aria-label",L("Arenaga qaytish","Back to the arena"));\n  document.getElementById("lvSnd").onclick=function(){',
  );
  swap(
    '  if(!ME) return need();',
    `  if(window.SQ_LIVE&&h==="#/live") return vLive();
  if(SQ_IN&&h==="#/"&&(!ME||(ME.status!=="blocked"&&(ME.learnerType==="independent"||(ME.status&&ME.status!=="ok"))))){
    APP.innerHTML=card('<div class="center"><h2>⚡ '+L("Jonli test barcha uchun","Live quiz for everyone")+'</h2><p class="note">'+L("Guruhga a’zolik talab qilinmaydi. Hisobingiz bilan yoki ismingizni kiritib mehmon bo‘lib qatnashing.","No class membership is required. Join with your account or enter your name as a guest.")+'</p><a class="btn accent" href="/#arena/play/live" target="_top">'+L("Jonli testga o‘tish","Open the live quiz")+'</a> <a class="btn" href="/#arena" target="_top">'+L("Barcha o‘yinlar","All games")+'</a></div>'); return;
  }
  if(!ME) return need();`,
  );
  swap(
    '  saToken(true,function(){\n    claimMe(function(ok){ if(!LV) return; LV.own=ok; clockSync(lvFind); });',
    '  if(window.SQ_LIVE){ LV.own=true; clockSync(lvFind); return; }\n  saToken(true,function(){\n    claimMe(function(ok){ if(!LV) return; LV.own=ok; clockSync(lvFind); });',
  );
  swap(
    '  tmo(fetch(BASE+"/kahoot/idx.json"+q),9000).then(function(r){ return r.ok?r.json():null; }).catch(function(){ return null; }).then(function(idx){',
    '  (window.SQ_LIVE?SQ_LIVE.read("idx"):tmo(fetch(BASE+"/kahoot/idx.json"+q),9000).then(function(r){ return r.ok?r.json():null; })).catch(function(){ return null; }).then(function(idx){',
  );
  swap(
    '      LV.meta=m;',
    `      LV.meta=m;
      if(window.SQ_LIVE){ var game=LV.d; SQ_LIVE.get("games/"+game+"/mine",function(v,st){
        if(st!==200||!v||!LV||LV.d!==game) return;
        var changed=false;
        if(v.joined&&!LV.joined){ LV.joined=true; changed=true; }
        Object.keys(v.answers||{}).forEach(function(i){ if(LV.ans[i]===undefined){ LV.ans[i]=v.answers[i].c; changed=true; } });
        if(changed||v.joined) lvRender();
      }); }`,
  );
  swap(
    '    var old=lvN(); LV.p=v||{}; LV.joined=!!(ME&&LV.p[ME.id]);',
    '    var wasJoined=LV.joined, old=lvN(), mine=ME&&LV.p[ME.id]; LV.p=v||{}; if(wasJoined&&mine&&!LV.p[ME.id]) LV.p[ME.id]=mine; LV.joined=wasJoined||!!(ME&&LV.p[ME.id]);',
  );
  swap(
    '    if(LV.phase==="lobby"&&lvN()!==old) lvLobbyPlayers(old);',
    '    if(wasJoined!==LV.joined) lvRender(); else if(LV.phase==="lobby"&&lvN()!==old) lvLobbyPlayers(old);',
  );
  // The shared-code adapter has already validated that the player identity exists.
  swapIn(
    'lvJoin',
    'lvAnswer',
    '  if(btn){ btn.disabled=true; btn.textContent="⏳ "+L("Qo\'shilmoqda…","Joining…"); }',
    `  if(window.SQ_LIVE&&ME.guest){
    var input=document.getElementById("lvGuestName"), name=input?input.value.trim():"";
    if(name.length<2){ var error=document.getElementById("lvJoinErr"); if(error) error.textContent=L("Ismingizni kiriting (kamida 2 belgi).","Enter your name (at least 2 characters)."); if(input) input.focus(); return; }
    ME.name=name; ME.surname="";
  }
  if(btn){ btn.disabled=true; btn.textContent="⏳ "+L("Qo'shilmoqda…","Joining…"); }`,
  );
  swap(
    ':\'<button type="button" class="lv-btn pulse" id="lvJoin">',
    `:(window.SQ_LIVE&&ME&&ME.guest?'<label class="lv-guest">'+L("Ismingiz","Your name")+'<input id="lvGuestName" autocomplete="nickname" maxlength="60" value="'+esc(ME.name==="Mehmon"?"":ME.name)+'" placeholder="'+L("Ismingizni kiriting","Enter your name")+'"></label>':'')+'<button type="button" class="lv-btn pulse" id="lvJoin">`,
  );
  swap(
    'at:{".sv":"timestamp"}},function(ok,st){\n    if(ok){ LV.joined=true;',
    'at:{".sv":"timestamp"}},function(ok,st,result){\n    if(ok){ LV.joined=true;',
  );
  swap(
    '    if(e) e.textContent=(st===401||st===403)',
    '    if(e&&window.SQ_LIVE){ e.textContent=result&&result.error||L("Qo‘shilib bo‘lmadi. Qayta urinib ko‘ring.","Could not join. Try again."); return; }\n    if(e) e.textContent=(st===401||st===403)',
  );
  // Non-academic participants can win the game without a misleading promise of course grades.
  swap(
    'L("ball reytingga","rating points")',
    '(ME&&ME.academic?L("ball reytingga","rating points"):L("sovrin balli","prize points"))',
  );
  swap(
    'L("asosiy reytingga qo\'shildi","added to the main rating")',
    '(ME&&ME.academic?L("asosiy reytingga qo\'shildi","added to the main rating"):L("jonli test natijasi","live quiz result"))',
  );
  source = source.replace(
    '<head>',
    '<head><script src="live-player.js"></script><style>.lv-guest{display:grid;gap:8px;text-align:left;max-width:400px;margin:20px auto 0;font-weight:800}.lv-guest input{font:inherit;padding:14px;border-radius:12px;border:2px solid #fff;background:#fff;color:#1b1b2f;width:100%;box-sizing:border-box}.lv-guest input:focus{outline:3px solid #ffd60a;outline-offset:2px}@media(prefers-reduced-motion:reduce){.lv *{animation:none!important;transition:none!important}}</style>',
  );
  return source;
}
