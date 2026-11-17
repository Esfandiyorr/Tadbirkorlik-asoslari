/* Styled arena stage → same-origin parent → validated server API. No credentials cross this bridge. */
(function () {
  if (parent === window || new URLSearchParams(location.search).get('sqLive') !== '1') return;
  var pending = new Map(),
    serial = 0;
  document.addEventListener(
    'click',
    function (e) {
      const link = e.target instanceof Element ? e.target.closest('.lv a[href="#/"]') : null;
      if (!link) return;
      e.preventDefault();
      parent.postMessage({ source: 'studyquest-live-player', type: 'exit' }, location.origin);
    },
    true,
  );
  addEventListener('message', function (e) {
    if (
      e.origin !== location.origin ||
      e.source !== parent ||
      e.data?.source !== 'studyquest-live-parent'
    )
      return;
    var item = pending.get(e.data.id);
    if (!item) return;
    clearTimeout(item.timer);
    pending.delete(e.data.id);
    item.done(e.data.body || {}, e.data.status || 0);
  });
  function request(method, path, value, start, done) {
    var id = Date.now() + '-' + ++serial;
    var timer = setTimeout(function () {
      pending.delete(id);
      done({ error: 'Ulanish uzildi. Qayta urinib ko‘ring.' }, 0);
    }, 12000);
    pending.set(id, { timer: timer, done: done });
    parent.postMessage(
      {
        source: 'studyquest-live-player',
        id: id,
        method: method,
        path: path,
        value: value,
        start: start,
      },
      location.origin,
    );
  }
  function get(path, cb) {
    request('GET', path, undefined, undefined, function (r, status) {
      cb(status === 200 ? (path === 'session' ? r : r.value) : null, status, r);
    });
  }
  window.SQ_LIVE = {
    get: get,
    read: function (path) {
      return new Promise(function (resolve) {
        get(path, function (v) {
          resolve(v);
        });
      });
    },
    put: function (path, value, start, cb) {
      request('POST', path, value, start, function (r, status) {
        cb(status === 200, status, r);
      });
    },
    clock: function (done) {
      var count = 0,
        best;
      (function sample() {
        if (count++ >= 3) {
          done(best ? best.skew : 0);
          return;
        }
        var before = Date.now();
        get('clock', function (now, status) {
          var after = Date.now();
          if (status === 200 && typeof now === 'number' && (!best || after - before < best.rtt))
            best = { rtt: after - before, skew: now - (before + after) / 2 };
          sample();
        });
      })();
    },
  };
})();
