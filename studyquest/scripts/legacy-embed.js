/* Same-origin presentation controls. No credentials are accepted by this bridge. */
(function () {
  if (parent === window && location.pathname.startsWith('/legacy/')) {
    var file = location.pathname.split('/').pop(),
      lesson = /^mavzu-(\d+)\.html$/.exec(file);
    var target = new URL('/', location.origin);
    target.hash = lesson
      ? 'lesson/m' + lesson[1]
      : file === 'arena.html'
        ? 'arena/live'
        : file === 'tadbirkorlik-asoslari.html'
          ? 'course/tad-asoslari'
          : 'home';
    if (file === 'arena.html' && /^#\//.test(location.hash))
      target.searchParams.set('arena', location.hash.slice(0, 200));
    location.replace(target.href);
    return;
  }
  var mode = new URLSearchParams(location.search).get('sqEmbed');
  if (
    parent === window ||
    !['lesson', 'arena', 'login', 'account', 'teacher', 'chat'].includes(mode)
  )
    return;
  document.documentElement.classList.add('sq-embed', 'sq-' + mode);
  var fit = innerWidth >= 768,
    pending = false;
  function layout() {
    pending = false;
    if (mode === 'login') {
      var input = document.getElementById('lgB');
      if (input) {
        input.placeholder = 'Avvalgi kod yoki parolingiz';
        input.closest('label').firstChild.nodeValue = 'Kod yoki parol';
      }
    }
    if (mode !== 'lesson') return;
    var slide = document.querySelector('.slide.active'),
      deck = document.getElementById('deck');
    if (!slide || !deck) return;
    var inner = slide.querySelector('.inner');
    if (!inner) return;
    inner.style.transform = '';
    slide.style.overflowY = fit ? 'hidden' : 'auto';
    var style = getComputedStyle(slide);
    var available =
      deck.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (fit && inner.scrollHeight > available)
      inner.style.transform = 'scale(' + Math.min(1, available / inner.scrollHeight) + ')';
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(layout);
    }
  }
  window.addEventListener('resize', schedule);
  window.addEventListener('message', function (e) {
    if (
      e.origin !== location.origin ||
      e.source !== parent ||
      e.data?.source !== 'studyquest-parent'
    )
      return;
    if (e.data.type === 'navigate' && Number.isInteger(e.data.index)) {
      var current = Number(document.getElementById('cur')?.textContent || 1) - 1;
      var button = document.getElementById(e.data.index > current ? 'btnNext' : 'btnPrev');
      var dot = document.getElementById('dots')?.children[e.data.index];
      if (e.data.index !== current && dot instanceof HTMLElement) dot.click();
      else if (e.data.index !== current && button && !button.disabled) button.click();
    }
    if (e.data.type === 'fit') fit = !!e.data.value;
    if (e.data.type === 'theme')
      document.documentElement.dataset.theme = e.data.dark ? 'dark' : 'light';
    schedule();
  });
  function ready() {
    new MutationObserver(schedule).observe(document.getElementById('deck') || document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
    });
    if (window.ResizeObserver) {
      var observer = new ResizeObserver(schedule);
      document.querySelectorAll('.slide .inner').forEach(function (el) {
        observer.observe(el);
      });
    }
    document.addEventListener('load', schedule, true);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
