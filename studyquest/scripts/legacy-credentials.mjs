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
  const patches = [
    [names, names + choice],
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
