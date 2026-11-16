/* RS 24: faqat yangi R4–R11 uchun mahalliy tayyorgarlik testi.
   Akademik ball, urinish va bazaga yozuv yo'q. R12 — kuzatuv, testsiz.
   Q, qOk va qIsOpen taqdimotdan olinadi; renderTest til dvigatelining ilgagi. */
var RS_MIN = __RS_MIN__, RS_STATE = null, RS_TIMER = null;
// Oxirgi ifoda sync-legacy.mjs dagi muharrir savollari versiyasi bilan mos.
function rsKey(){ var s=window.RT&&RT.student&&RT.student(); return "terdu_restoran_practice_"+RT_CFG.topic+"_"+(s?s.id:"anon"); }
function rsSave() {
  try { localStorage.setItem(rsKey(), JSON.stringify(RS_STATE)); } catch (e) {}
}
function rsLoad() {
  try { RS_STATE = JSON.parse(localStorage.getItem(rsKey()) || 'null'); } catch (e) { RS_STATE = null; }
  if (RS_STATE && (RS_STATE.version !== 1 || RS_STATE.order.length !== Q.length)) RS_STATE = null;
}
function rsShuffle(list) {
  for (var i = list.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), temp = list[i]; list[i] = list[j]; list[j] = temp;
  }
  return list;
}
function rsLeft() { return Math.max(0, RS_STATE.at + RS_MIN * 60000 - Date.now()); }
function rsClock(ms) { var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
function rsStart() {
  if (!confirm('Tayyorgarlik mashqi: ' + Q.length + ' ta savol, ' + RS_MIN + ' daqiqa. Rasmiy bahoga yozilmaydi. Boshlaysizmi?')) return;
  RS_STATE = { version: 1, at: Date.now(), done: false, answers: {},
    order: rsShuffle(Q.map(function (_, i) { return i; })), options: {} };
  Q.forEach(function (q, i) { if (q.a) RS_STATE.options[i] = rsShuffle(q.a.map(function (_, j) { return j; })); });
  rsSave(); renderTest(); rsTick();
}
function rsFinish() {
  if (!RS_STATE || RS_STATE.done) return;
  RS_STATE.done = true; clearInterval(RS_TIMER); rsSave(); renderTest();
}
function rsAnswer(index, value) {
  if (!RS_STATE || RS_STATE.done || RS_STATE.answers[index] !== undefined) return;
  if (!rsLeft()) { rsFinish(); return; }
  if (qIsOpen(index)) { value = String(value).trim().slice(0, 60); if (!value) return; }
  RS_STATE.answers[index] = value; rsSave();
  if (Object.keys(RS_STATE.answers).length === Q.length) rsFinish(); else renderTest();
}
function rsTick() {
  clearInterval(RS_TIMER);
  if (!RS_STATE || RS_STATE.done) return;
  RS_TIMER = setInterval(function () {
    if (!rsLeft()) { rsFinish(); return; }
    var timer = document.getElementById('qtTime'); if (timer) timer.textContent = rsClock(rsLeft());
  }, 1000);
}
function renderTest() {
  var wrap = document.getElementById('testWrap');
  if (!wrap || !Q.length) return;
  if (RS_STATE && !RS_STATE.done && !rsLeft()) { rsFinish(); return; }
  wrap.innerHTML = '';
  document.getElementById('scoreMax').textContent = Q.length;
  var correct = RS_STATE ? Q.reduce(function (sum, _, i) { return sum + (qOk(i, RS_STATE.answers[i]) ? 1 : 0); }, 0) : 0;
  document.getElementById('scoreNow').textContent = correct;
  document.getElementById('answered').textContent = RS_STATE ? Object.keys(RS_STATE.answers).length : 0;
  var result = document.getElementById('result'); result.classList.toggle('show', !!(RS_STATE && RS_STATE.done));
  if (RS_STATE && RS_STATE.done) {
    document.getElementById('pct').textContent = correct + ' / ' + Q.length;
    document.getElementById('resTitle').textContent = 'Tayyorgarlik natijasi';
    document.getElementById('resTxt').textContent = 'Bu mashq rasmiy imtihon bahosi emas. Izohlarni o‘qing va xato yo‘nalishni qayta mashq qiling.';
  }
  if (!RS_STATE || RS_STATE.done) {
    var start = document.createElement('button'); start.type = 'button'; start.className = 'btn accent'; start.id = 'qtGo';
    start.textContent = RS_STATE ? 'Yangi mashqni boshlash' : 'Tayyorgarlik testini boshlash · ' + RS_MIN + ' daqiqa';
    start.onclick = rsStart; wrap.appendChild(start);
  }
  if (!RS_STATE) return;
  if (!RS_STATE.done) {
    var status = document.createElement('p'); status.innerHTML = '⏱ Qolgan vaqt: <b id="qtTime">' + rsClock(rsLeft()) + '</b> · faqat mashq';
    var finish = document.createElement('button'); finish.type = 'button'; finish.className = 'btn'; finish.id = 'qtEnd'; finish.textContent = 'Mashqni yakunlash';
    finish.onclick = function () { if (confirm('Javobsiz savollar ham 0 hisoblanadi. Yakunlaysizmi?')) rsFinish(); };
    wrap.appendChild(status); wrap.appendChild(finish);
  }
  RS_STATE.order.forEach(function (index, position) {
    var q = Q[index], picked = RS_STATE.answers[index], box = document.createElement('div'); box.className = 'qbox';
    var heading = document.createElement('p'); heading.className = 'q'; heading.innerHTML = '<i>' + (position + 1) + '</i>' + q.q; box.appendChild(heading);
    if (qIsOpen(index)) {
      if (picked === undefined && !RS_STATE.done) {
        var input = document.createElement('input'); input.className = 'qin'; input.maxLength = 60; input.setAttribute('aria-label', 'Javob ' + (position + 1));
        var submit = document.createElement('button'); submit.type = 'button'; submit.className = 'btn'; submit.textContent = 'Javob berish';
        submit.onclick = function () { rsAnswer(index, input.value); };
        input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); rsAnswer(index, input.value); } };
        box.appendChild(input); box.appendChild(submit);
      } else {
        var written = document.createElement('p'); written.textContent = picked === undefined ? 'Javobsiz' : 'Javobingiz: ' + picked; box.appendChild(written);
      }
    } else RS_STATE.options[index].forEach(function (answer) {
      var option = document.createElement('button'); option.type = 'button'; option.className = 'opt'; option.textContent = q.a[answer];
      option.disabled = picked !== undefined || RS_STATE.done;
      if (picked === answer) option.classList.add(qOk(index, picked) ? 'right' : 'wrong');
      option.onclick = function () { rsAnswer(index, answer); }; box.appendChild(option);
    });
    if (RS_STATE.done) {
      var feedback = document.createElement('p'); feedback.className = 'fb show ' + (qOk(index, picked) ? 'ok' : 'no');
      feedback.textContent = (qOk(index, picked) ? '✓ ' : '↻ ') + q.e; box.appendChild(feedback);
    }
    wrap.appendChild(box);
  });
}
if (Q.length) { rsLoad(); renderTest(); rsTick(); }
var rsReset = document.getElementById('btnReset');
if (rsReset) rsReset.onclick = function () {
  if (!confirm('Faqat shu tayyorgarlik mashqini tozalaysizmi?')) return;
  clearInterval(RS_TIMER); RS_STATE = null; rsSave(); renderTest();
};
