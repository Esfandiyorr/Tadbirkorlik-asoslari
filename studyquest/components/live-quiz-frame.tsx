'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { useApp } from './provider';

/** The stage keeps the arena CSS. The parent supplies authenticated requests, never bearer tokens. */
export function LiveQuizFrame() {
  const { data, legacy, lang, request } = useApp();
  const frame = useRef<HTMLIFrameElement>(null);
  const transport = useRef(request);
  useLayoutEffect(() => {
    transport.current = request;
  }, [request]);
  const identity = data?.user?.id || legacy?.id || 'guest';
  const signedIn = !!data?.user || !!legacy;
  useLayoutEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function receive(e: MessageEvent) {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow ||
        e.data?.source !== 'studyquest-live-player'
      )
        return;
      if (e.data.type === 'exit') {
        location.hash = 'arena';
        return;
      }
      const { id, method, path, value, start } = e.data;
      if (
        typeof id !== 'string' ||
        id.length > 80 ||
        !['GET', 'POST'].includes(method) ||
        typeof path !== 'string' ||
        path.length > 220
      )
        return;
      let status = 0,
        body: unknown;
      try {
        const url = '/api/live' + (method === 'GET' ? '?path=' + encodeURIComponent(path) : '');
        const init: RequestInit = {
          method,
          signal: controller.signal,
          cache: 'no-store',
          ...(method === 'POST'
            ? {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  path,
                  value,
                  ...(typeof start === 'number' ? { start } : {}),
                }),
              }
            : {}),
        };
        const response = await (signedIn ? transport.current(url, init) : fetch(url, init));
        status = response.status;
        body = await response.json();
      } catch {
        body = { error: 'Ulanish uzildi. Qayta urinib ko‘ring.' };
      }
      if (active && e.source === frame.current?.contentWindow)
        frame.current.contentWindow?.postMessage(
          { source: 'studyquest-live-parent', id, status, body },
          location.origin,
        );
    }
    window.addEventListener('message', receive);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('message', receive);
    };
  }, [identity, signedIn]);
  const src =
    '/legacy/arena.html?sqEmbed=arena&sqLive=1' +
    (data?.mode === 'demo' ? '&sqDemo=1' : '') +
    '#/live';
  // Sahifa (≈0,5 MB) yuklanguncha o'z yuklanish ekrani: yarim yuklangan eski sahifa ko'rinmaydi.
  const [loaded, setLoaded] = useState('');
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  return (
    <div className="arena-live">
      <iframe
        ref={frame}
        key={identity}
        className="arena-live-frame"
        src={src}
        title={L('Jonli test', 'Live quiz', 'Живой тест')}
        allow="autoplay; fullscreen"
        onLoad={() => setLoaded(identity)}
      />
      {loaded !== identity && (
        <div className="arena-live-loading" role="status">
          <span className="arena-live-shapes" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <b>{L('Jonli test ochilmoqda…', 'Opening the live quiz…', 'Открываем живой тест…')}</b>
        </div>
      )}
    </div>
  );
}
