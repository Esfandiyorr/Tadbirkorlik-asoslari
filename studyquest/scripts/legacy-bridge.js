/* Same-origin, read-only bridge. Credentials and password hashes are never posted. */
(function () {
  if (parent === window) return;
  var bound = false;
  function emit(index) {
    parent.postMessage(
      {
        source: 'studyquest-legacy',
        type: 'slide',
        topic: window.RT_CFG && RT_CFG.topic,
        index: index,
      },
      location.origin,
    );
  }
  function send() {
    if (!window.RT) return;
    var s = RT.student();
    parent.postMessage(
      {
        source: 'studyquest-legacy',
        type: 'session',
        student: s
          ? {
              id: s.id,
              name: s.name,
              surname: s.surname,
              group: s.group,
              status: s.status,
              learnerType: s.learnerType,
            }
          : null,
      },
      location.origin,
    );
  }
  function bind() {
    if (!window.RT || bound) return;
    bound = true;
    var original = RT.slideSeen;
    RT.slideSeen = function (n) {
      original(n);
      emit(n);
    };
    var cur = document.getElementById('cur');
    if (cur) emit(Math.max(0, parseInt(cur.textContent, 10) - 1));
    if (new URLSearchParams(location.search).get('studyquest') === 'login' && RT.auth)
      RT.auth('log');
  }
  bind();
  var ready = setInterval(function () {
    bind();
    if (bound) clearInterval(ready);
  }, 50);
  setInterval(send, 1000);
  window.addEventListener('message', function (e) {
    if (
      e.origin !== location.origin ||
      e.source !== parent ||
      !e.data ||
      e.data.source !== 'studyquest-parent' ||
      !window.RT
    )
      return;
    if (e.data.type === 'login' && RT.auth) RT.auth(e.data.mode || 'log');
    if (e.data.type === 'teacher') RT.open('tc');
  });
})();
