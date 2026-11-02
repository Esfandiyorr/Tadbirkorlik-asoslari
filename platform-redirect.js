/* Old public links now open the same lesson in the new learning platform. */
(function () {
  if (location.hostname !== 'esfandiyorr.github.io' ||
      !location.pathname.startsWith('/Tadbirkorlik-asoslari/')) return;
  var target = new URL('https://tadbirkorlik-asoslari.vercel.app/');
  var file = location.pathname.split('/').pop() || 'index.html';
  var lesson = /^mavzu-(\d+)\.html$/.exec(file);
  target.hash = lesson ? 'lesson/m' + lesson[1] :
    file === 'arena.html' ? 'arena/live' :
    file === 'tadbirkorlik-asoslari.html' ? 'course/tad-asoslari' : 'home';
  if (file === 'arena.html' && /^#\//.test(location.hash))
    target.searchParams.set('arena', location.hash.slice(0, 200));
  location.replace(target.href);
})();
