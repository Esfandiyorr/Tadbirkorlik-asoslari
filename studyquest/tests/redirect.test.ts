import { it, expect } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
const script = fs.readFileSync('../platform-redirect.js', 'utf8');
function redirect(file: string, hash = '', hostname = 'esfandiyorr.github.io') {
  let target = '';
  vm.runInNewContext(script, {
    URL,
    location: {
      hostname,
      pathname: '/Tadbirkorlik-asoslari/' + file,
      hash,
      search: '?token=never-transfer-this',
      replace: (url: string) => (target = url),
    },
  });
  return target;
}
it('old course and topic links open the matching route in the new platform', () => {
  expect(redirect('index.html')).toBe('https://tadbirkorlik-asoslari.vercel.app/#home');
  expect(redirect('tadbirkorlik-asoslari.html')).toContain('#course/tad-asoslari');
  expect(redirect('mavzu-7.html', '#5')).toContain('#lesson/m7');
});
it('arena room links preserve public game navigation and never copy credentials', () => {
  const url = new URL(redirect('arena.html', '#/room/ABCD'));
  expect(url.hash).toBe('#arena/live');
  expect(url.searchParams.get('arena')).toBe('#/room/ABCD');
  expect(url.href).not.toContain('never-transfer');
});
it('local tests and copied Vercel presentations do not redirect in a loop', () => {
  expect(redirect('mavzu-1.html', '', 'localhost')).toBe('');
  expect(redirect('mavzu-1.html', '', 'tadbirkorlik-asoslari.vercel.app')).toBe('');
});
