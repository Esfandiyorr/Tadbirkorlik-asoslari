/* A local demo iframe has isolated storage and cannot contact the live database. */
(function () {
  if (!window.STUDYQUEST_DEMO_COPY && new URLSearchParams(location.search).get('sqDemo') !== '1')
    return;
  var memory = new Map();
  memory.set(
    'terdu_student',
    JSON.stringify({
      id: 'sq_demo_reader',
      name: 'Demo',
      surname: 'O‘quvchi',
      learnerType: 'independent',
      group: '',
      status: 'pending',
      at: Date.now(),
    }),
  );
  var storage = {
    getItem: function (k) {
      return memory.has(k) ? memory.get(k) : null;
    },
    setItem: function (k, v) {
      memory.set(k, String(v));
    },
    removeItem: function (k) {
      memory.delete(k);
    },
    clear: function () {
      memory.clear();
    },
    key: function (i) {
      return Array.from(memory.keys())[i] || null;
    },
  };
  Object.defineProperty(window, 'localStorage', { value: storage });
  var session = new Map();
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      get length() {
        return session.size;
      },
      getItem: function (k) {
        return session.get(k) || null;
      },
      setItem: function (k, v) {
        session.set(k, String(v));
      },
      removeItem: function (k) {
        session.delete(k);
      },
      clear: function () {
        session.clear();
      },
      key: function (i) {
        return Array.from(session.keys())[i] || null;
      },
    },
  });
  var cfg;
  Object.defineProperty(window, 'RT_CFG', {
    configurable: true,
    get: function () {
      return cfg;
    },
    set: function (v) {
      v.firebase = null;
      v.fbWeb = null;
      v.teacherH = '';
      v.maintenance = { on: false };
      v.topics.forEach(function (t) {
        t.open = true;
        t.read = true;
        t.lim = false;
      });
      cfg = v;
    },
  });
  var fetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    if (
      /firebaseio|firebasedatabase|identitytoolkit|securetoken|firebaseapp|googleapis/.test(
        String(url),
      )
    )
      return Promise.reject(new Error('Live services are disabled in demo'));
    return fetch(url, opts);
  };
})();
