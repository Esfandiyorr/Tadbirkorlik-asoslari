// Only generated new-platform copies change; original teaching content is archived unchanged.
export function adaptStudentRegistration(source) {
  const names =
    'var cand=a.filter(function(x){ return nrm(x.name)===nrm(n)&&nrm(x.surname)===nrm(sn); });';
  const choice = `
    var choose=document.getElementById("sqNameChoice"),loginButton=document.getElementById("lgGo"),signature=nrm(n)+"|"+nrm(sn);
    if(password==="1111"&&cand.length>1&&loginButton){
      if(choose&&choose.dataset.signature===signature&&choose.value){cand=cand.filter(function(x){return x.id===choose.value;});}
      else{
        if(choose)choose.parentElement.remove();
        var label=document.createElement("label"),select=document.createElement("select"),empty=document.createElement("option");
        label.textContent=T("Guruhingizni tanlang","Choose your group");select.id="sqNameChoice";select.dataset.signature=signature;
        empty.value="";empty.textContent=T("— tanlang —","— choose —");select.appendChild(empty);
        cand.forEach(function(x){var option=document.createElement("option");option.value=x.id;option.textContent=(x.group||T("Guruhsiz","No group"))+" · "+x.id.slice(-4);select.appendChild(option);});
        label.appendChild(select);loginButton.parentElement.insertBefore(label,loginButton);cb(null);
        setTimeout(function(){var error=document.getElementById("lgErr");if(error){error.style.display="block";error.textContent=T("Bir xil ism-familiya topildi. Guruhingizni tanlab, Kirish tugmasini bosing.","Matching names found. Choose your group, then log in.");}},0);return;
      }
    }else if(choose){choose.parentElement.remove();}
  `;
  const sharedLogin = `
      if(password==="1111"&&cand.length===1){
        var candidate=cand[0];saToken(true,function(token){if(!token){cb(null);return;}
          fetch("/api/student-login",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({id:candidate.id,name:n,surname:sn,password:"1111"})})
          .then(function(response){if(!response.ok)throw 0;SEC=true;cb(candidate,"shared1111");}).catch(function(){cb(null);});
        });return;
      }
  `;
  const patches = [
    [
      'function claimOwn(id,pk,cb){',
      'function claimOwn(id,pk,cb){ if(pk==="shared1111"){ saToken(true,function(token){ if(!token){cb(false);return;} fetch("/api/student-login",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({id:id,session:true})}).then(function(response){SEC=response.ok;cb(response.ok);}).catch(function(){cb(false);}); });return; }',
    ],
    [names, names + choice + sharedLogin],
    [
      'password=document.getElementById("rtB").value,selectedType=regType;',
      'password="1111",selectedType=regType;',
    ],
    [
      '    if(!passwordOk(password)) return err("rtErr",T("Parol 8–128 belgidan iborat bo‘lsin.","Use a password of 8–128 characters."));',
      '',
    ],
    [
      'newPassword(n,sn,password).then(function(credentials){',
      'Promise.resolve({key:pkey(n,sn,"1111"),salt:""}).then(function(credentials){',
    ],
    [
      'pk:credentials.key,authVersion:2,pwSalt:credentials.salt,at:',
      'pk:credentials.key,authVersion:1,pwSalt:credentials.salt,at:',
    ],
    [
      'var r=rec(); r.status="pending";',
      'var r=rec(); r.mustChangePassword=true; r.credentialSetupVersion="default1111-v1"; r.status="pending";',
    ],
    [
      'document.getElementById(reg?"rtGo":"lgGo").onclick=reg?doReg:doLog;',
      'if(reg){var defaultPassword=document.getElementById("rtB");defaultPassword.value="1111";defaultPassword.type="text";defaultPassword.readOnly=true;} document.getElementById(reg?"rtGo":"lgGo").onclick=reg?doReg:doLog;',
    ],
  ];
  for (const [before, after] of patches) {
    if (!source.includes(before))
      throw Error('Original registration adapter needs updating: ' + before.slice(0, 50));
    source = source.replace(before, after);
  }
  return source;
}

/* ⚡ Jonli test (arena.html): talaba umumiy «1111» kod bilan kirgan bo'lsa (yangi platformada eng ko'p uchraydigan
   holat), uning brauzer egaligi server orqali tasdiqlangan — bazada owners/<id>/<uid> = "shared1111:…", brauzerda esa
   kalit o'rnida "shared1111" belgisi turadi. Asl claimMe bu belgini kalit deb bazaga yozmoqchi bo'lardi, qoida rad
   etardi va «Qo'shilish» tugmasi «Hisobingiz shu brauzerda tasdiqlanmagan» deb to'xtardi — talabalar jonli testga
   (va Yozuv marafoniga) kira olmasdi. Endi:
   1) "shared1111" holatida egalik /api/student-login orqali tekshiriladi (taqdimotlardagi claimOwn bilan bir xil);
   2) tekshiruv baribir o'tmasa ham qo'shilishga urinib ko'riladi — asl hakam bazadagi qoida (egalik, tasdiqlangan
      hisob, lobbi vaqti); rad etilsagina tushunarli xabar chiqadi;
   3) xabardagi havola yangi platformadagi kirish sahifasiga olib boradi. */
export function adaptArenaLiveJoin(source) {
  const relogin =
    '"Hisobingiz shu brauzerda tasdiqlanmagan. Saytdan chiqib, ism, familiya va kodingiz bilan qayta kiring, so\'ng shu sahifaga qayting."';
  const patches = [
    [
      'function claimMe(cb){\n  if(!ME||!ME.id||!ME.pk){ cb(false); return; }',
      'function claimMe(cb){\n  if(ME&&ME.id&&ME.pk==="shared1111"){ saToken(true,function(t){ if(!t){ cb(false); return; } tmo(fetch("/api/student-login",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({id:ME.id,session:true})}),9000).then(function(r){ cb(r.ok); }).catch(function(){ cb(false); }); }); return; }\n  if(!ME||!ME.id||!ME.pk){ cb(false); return; }',
    ],
    [
      // jonli test: egalik tasdiqlanmagan bo'lsa ham qo'shilishga urinamiz (hakam — bazadagi qoida)
      'function lvJoin(btn){\n  KS.unlock();\n  if(!LV.own){',
      'function lvJoin(btn){\n  KS.unlock();\n  if(!ME||!ME.id){',
    ],
    [
      'L("Hisobingiz shu brauzerda tasdiqlanmagan. Avval istalgan mavzu taqdimotini ochib, hisobingizga kiring, so\'ng qaytib keling.",\n      "Your account is not confirmed in this browser. Open any lesson, log in, then come back.")+\' <a href="tadbirkorlik-asoslari.html">📚 \'+L("Darsga o\'tish","Go to the lesson")+\'</a>\';',
      'L(' +
        relogin +
        ',\n      "Your account is not confirmed in this browser. Sign out, sign in again with your name and code, then come back.")+\' <a href="/#login" target="_top">🔐 \'+L("Kirish","Sign in")+\'</a>\';',
    ],
    [
      '? L("Qo\'shilib bo\'lmadi: vaqt tugagan, hisob tasdiqlanmagan yoki siz allaqachon qo\'shilgansiz.","Could not join: time is up, the account is not approved, or you have already joined.")',
      '? (snow()>=LV.meta.start?L("Qo\'shilish vaqti tugadi — o\'yin boshlanib bo\'lgan. Keyingi jonli testga lobbi ochilishi bilan qo\'shiling.","Joining has closed — the game has already started. Join the next live quiz as soon as its lobby opens."):(!LV.own?L(' +
        relogin +
        ',"Your account is not confirmed in this browser. Sign out, sign in again with your name and code, then come back."):L("Qo\'shilib bo\'lmadi: hisobingiz o\'qituvchi tomonidan hali tasdiqlanmagan yoki siz allaqachon qo\'shilgansiz.","Could not join: your account is not approved yet, or you have already joined.")))',
    ],
    [
      // Yozuv marafoni (jonli rejim): xuddi shunday — egalik tasdiqlanmasa ham qo'shilishga urinadi
      '      if(!own){ fail(L("Hisobingiz shu brauzerda tasdiqlanmagan. Avval istalgan mavzu taqdimotini ochib, hisobingizga kiring, so\'ng qaytib keling.","Your account is not confirmed in this browser. Open any lesson, sign in, then come back.")+\' <a href="tadbirkorlik-asoslari.html">📚 \'+L("Darsga o\'tish","Go to the lesson")+\'</a>\'); return; }',
      '      if(!own&&!(me&&me.id)){ fail(L(' +
        relogin +
        ',"Your account is not confirmed in this browser. Sign out, sign in again, then come back.")+\' <a href="/#login" target="_top">🔐 \'+L("Kirish","Sign in")+\'</a>\'); return; }',
    ],
  ];
  for (const [before, after] of patches) {
    if (!source.includes(before))
      throw Error('Arena jonli test moslamasi yangilanishi kerak: ' + before.slice(0, 60));
    source = source.replace(before, after);
  }
  return source;
}
