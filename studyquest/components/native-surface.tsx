'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import morphdom from 'morphdom';
import { useApp } from './provider';
import { Button } from './ui/button';

type Action = Record<string, unknown>;
type Dialog = { kind: 'confirm' | 'prompt'; text: string; value?: string; action: Action };
type Props = {
  src: string;
  title: string;
  id?: string;
  className?: string;
  onLoad?: () => void;
  fit?: boolean;
};
const layoutProperties = new Set([
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'display',
  'grid-template-columns',
  'grid-template-rows',
  'grid-column',
  'grid-row',
  'gap',
  'aspect-ratio',
  'flex',
  'flex-basis',
  'flex-grow',
  'flex-wrap',
  'order',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'background-color',
  'opacity',
  'background-position',
  'background-size',
  'background-repeat',
  'grid-auto-rows',
  'grid-auto-columns',
  'font-size',
  'color',
  'box-shadow',
  'text-shadow',
]);

export const NativeSurface = forwardRef<HTMLIFrameElement, Props>(function NativeSurface(
  { src, title, id, className = '', onLoad, fit = false },
  forwardedRef,
) {
  const frame = useRef<HTMLIFrameElement>(null),
    surface = useRef<HTMLDivElement>(null),
    picker = useRef<HTMLInputElement>(null);
  const { lang, dark, toast } = useApp();
  const [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [answer, setAnswer] = useState('');
  const fileTarget = useRef('');
  const pendingFocus = useRef<{ id: string; start?: number; end?: number } | null>(null);
  const pendingScroll = useRef<{ id: string; options?: ScrollIntoViewOptions } | null>(null);
  useImperativeHandle(forwardedRef, () => frame.current!);
  const send = (data: Action) =>
    frame.current?.contentWindow?.postMessage(
      { source: 'tadbirkorlik-native-parent', ...data },
      location.origin,
    );
  useEffect(() => {
    setLoaded(false);
    setError('');
    pendingFocus.current = null;
    pendingScroll.current = null;
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow ||
        e.data?.source !== 'tadbirkorlik-native'
      )
        return;
      const message = e.data;
      if (message.type === 'scroll' && typeof message.id === 'string')
        pendingScroll.current = message;
      if (
        message.type === 'clipboard' &&
        typeof message.text === 'string' &&
        message.text.length <= 100000
      ) {
        Promise.resolve()
          .then(() => navigator.clipboard.writeText(message.text))
          .then(() => send({ type: 'clipboard-result', id: message.id, ok: true }))
          .catch(() => send({ type: 'clipboard-result', id: message.id, ok: false }));
      }
      if (message.type === 'notice' && typeof message.text === 'string') toast(message.text);
      if (
        message.type === 'dialog' &&
        ['confirm', 'prompt'].includes(message.kind) &&
        message.action
      ) {
        setAnswer(message.value || '');
        setDialog(message);
        return;
      }
      if (message.type === 'focus' && typeof message.id === 'string') {
        pendingFocus.current = message;
        const node = surface.current?.querySelector<HTMLInputElement>(
          '[data-native-id="' + CSS.escape(message.id) + '"]',
        );
        node?.focus({ preventScroll: true });
        if (node && typeof message.start === 'number') {
          try {
            node.setSelectionRange(message.start, message.end);
          } catch {}
        }
      }
      if (message.type === 'file' && picker.current) {
        fileTarget.current = String(message.id);
        picker.current.accept = message.accept || '';
        picker.current.multiple = !!message.multiple;
        picker.current.value = '';
        picker.current.click();
      }
      if (message.type !== 'render' || typeof message.html !== 'string' || !surface.current) return;
      if (message.html.length > 8 * 1024 * 1024) {
        setError('Bu sahifa juda katta. Qidiruv orqali ro‘yxatni qisqartiring.');
        return;
      }
      const html = DOMPurify.sanitize(message.html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'referrerpolicy'],
        FORBID_TAGS: ['script', 'style', 'link', 'meta', 'object', 'embed', 'base'],
        FORBID_ATTR: ['srcdoc', 'style', 'autofocus', 'formaction'],
      });
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      wrapper.querySelectorAll<HTMLElement>('[data-native-background]').forEach((node) => {
        const value = message.assets?.[node.dataset.nativeBackground || ''];
        if (
          typeof value === 'string' &&
          value.length < 4 * 1024 * 1024 &&
          (/^https?:\/\//.test(value) ||
            /^blob:/.test(value) ||
            /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);/i.test(value))
        )
          node.style.backgroundImage = 'url(' + JSON.stringify(value) + ')';
        node.removeAttribute('data-native-background');
      });
      wrapper.querySelectorAll<HTMLElement>('[data-native-layout]').forEach((node) => {
        try {
          const layout = JSON.parse(node.dataset.nativeLayout || '{}');
          for (const [property, value] of Object.entries(layout))
            if (
              layoutProperties.has(property) &&
              typeof value === 'string' &&
              value.length < 160 &&
              !/url|expression|fixed|sticky|[<>]/i.test(value) &&
              CSS.supports(property, value)
            )
              node.style.setProperty(property, value);
        } catch {}
        node.removeAttribute('data-native-layout');
      });
      wrapper.querySelectorAll('iframe').forEach((node) => {
        try {
          const u = new URL(node.src, location.origin);
          if (
            ![
              'www.youtube.com',
              'www.youtube-nocookie.com',
              'youtube.com',
              'player.vimeo.com',
            ].includes(u.hostname) ||
            u.protocol !== 'https:'
          )
            node.remove();
          else {
            node.loading = 'lazy';
            node.referrerPolicy = 'strict-origin-when-cross-origin';
          }
        } catch {
          node.remove();
        }
      });
      wrapper.querySelectorAll<HTMLAnchorElement>('a').forEach((node) => {
        if (node.target === '_blank') node.rel = 'noopener noreferrer';
      });
      morphdom(surface.current, wrapper, {
        childrenOnly: true,
        getNodeKey: (node) =>
          node.nodeType === 1
            ? (node as Element).getAttribute('data-native-id') || (node as Element).id
            : undefined,
        onBeforeElUpdated: (from, to) => {
          if (from.tagName === 'INPUT' && (from as HTMLInputElement).type === 'password')
            to.setAttribute('value', (from as HTMLInputElement).value);
          return true;
        },
      });
      if (Number.isInteger(message.index)) {
        const next = String(message.index);
        if (src.includes('sqEmbed=lesson') && surface.current.dataset.nativeIndex !== next) {
          surface.current.parentElement?.scrollTo({ top: 0 });
          if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
            surface.current.animate([{ opacity: 0.5 }, { opacity: 1 }], {
              duration: 180,
              easing: 'ease-out',
            });
        }
        surface.current.dataset.nativeIndex = next;
      }
      if (pendingFocus.current) {
        const focus = pendingFocus.current;
        const target = surface.current.querySelector<HTMLInputElement>(
          '[data-native-id="' + CSS.escape(focus.id) + '"]',
        );
        if (target) {
          target.focus({ preventScroll: true });
          pendingFocus.current = null;
          if (typeof focus.start === 'number')
            try {
              target.setSelectionRange(focus.start, focus.end ?? focus.start);
            } catch {}
        }
      }
      if (pendingScroll.current) {
        const scroll = pendingScroll.current;
        const target = surface.current.querySelector<HTMLElement>(
          '[data-native-id="' + CSS.escape(scroll.id) + '"]',
        );
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: scroll.options?.block || 'nearest' });
          pendingScroll.current = null;
        }
      }
      setLoaded(true);
      setError('');
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [src, toast]);
  useEffect(() => {
    send({ type: 'language', lang });
    frame.current?.contentWindow?.postMessage(
      { source: 'studyquest-parent', type: 'theme', dark },
      location.origin,
    );
  }, [lang, dark, loaded]);
  useEffect(() => {
    const sync = () =>
      send({ type: 'view-focus', focused: document.hasFocus() && !document.hidden });
    window.addEventListener('focus', sync);
    window.addEventListener('blur', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('blur', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [loaded]);
  useEffect(() => {
    const content = surface.current,
      host = content?.parentElement;
    if (!content || !host) return;
    const resize = () => {
      if (frame.current) {
        frame.current.style.setProperty(
          'width',
          Math.max(320, Math.round(content.clientWidth || host.clientWidth)) + 'px',
          'important',
        );
        frame.current.style.setProperty('height', Math.max(600, innerHeight) + 'px', 'important');
      }
      content.style.transform = '';
      if (!fit || innerWidth < 768) return;
      const styles = getComputedStyle(host),
        available =
          host.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
      if (available > 0 && content.scrollHeight > available)
        content.style.transform = 'scale(' + available / content.scrollHeight + ')';
    };
    const observer = new ResizeObserver(resize);
    observer.observe(content);
    observer.observe(host);
    resize();
    return () => observer.disconnect();
  }, [fit, loaded]);
  useEffect(() => {
    const host = surface.current;
    if (!host) return;
    let lastActivity = 0;
    const forward = (event: Event) => {
      const element = event.target instanceof Element ? event.target : null;
      const node =
        element?.closest<HTMLElement>('[data-native-id]') ||
        (element === host ? host.querySelector<HTMLElement>('[data-native-id]') : null);
      if (!node || !host.contains(node)) return;
      const input = node as HTMLInputElement,
        keyboard = event as KeyboardEvent,
        mouse = event as MouseEvent;
      if (event.type === 'click') {
        const anchor = element?.closest<HTMLAnchorElement>('a[href]');
        if (anchor && anchor.getAttribute('href')?.[0] !== '#') return;
        if (input.tagName !== 'INPUT' || !['checkbox', 'radio'].includes(input.type))
          event.preventDefault();
      }
      if (event.type === 'submit') event.preventDefault();
      if (['input', 'change'].includes(event.type) && ['checkbox', 'radio'].includes(input.type))
        return;
      if (/^key/.test(event.type)) {
        if (
          !element?.closest('input,textarea,select,[contenteditable]') &&
          /^(Arrow|Page)/.test(keyboard.key)
        )
          event.preventDefault();
        event.stopPropagation();
      }
      const rect = node.getBoundingClientRect();
      send({
        type: 'event',
        id: node.dataset.nativeId,
        event: event.type === 'focusin' ? 'focus' : event.type,
        value: input.value,
        checked: event.type === 'click' ? undefined : input.checked,
        files: input.type === 'file' ? Array.from(input.files || []) : undefined,
        key: keyboard.key,
        code: keyboard.code,
        keyCode: keyboard.keyCode,
        metaKey: keyboard.metaKey,
        pointerType: (event as PointerEvent).pointerType,
        pointerId: (event as PointerEvent).pointerId,
        ctrlKey: keyboard.ctrlKey,
        altKey: keyboard.altKey,
        shiftKey: keyboard.shiftKey,
        button: mouse.button,
        detail: mouse.detail,
        x: rect.width ? (mouse.clientX - rect.left) / rect.width : 0,
        y: rect.height ? (mouse.clientY - rect.top) / rect.height : 0,
      });
    };
    const activity = () => {
      if (Date.now() - lastActivity < 1000 || document.hidden) return;
      lastActivity = Date.now();
      send({ type: 'activity' });
    };
    const events = [
      'click',
      'input',
      'change',
      'focusin',
      'keydown',
      'keyup',
      'submit',
      'pointerdown',
      'pointerup',
      'pointermove',
      'mousedown',
      'mouseup',
    ];
    events.forEach((type) => host.addEventListener(type, forward));
    ['pointerdown', 'keydown', 'wheel', 'scroll', 'mousemove'].forEach((type) =>
      document.addEventListener(type, activity, { passive: true, capture: true }),
    );
    return () => {
      events.forEach((type) => host.removeEventListener(type, forward));
      ['pointerdown', 'keydown', 'wheel', 'scroll', 'mousemove'].forEach((type) =>
        document.removeEventListener(type, activity, true),
      );
    };
  }, [src]);
  function resolveDialog(value: string | boolean | null) {
    if (dialog && value !== false && value !== null)
      send({ type: 'dialog-result', kind: dialog.kind, answer: value, action: dialog.action });
    setDialog(null);
  }
  return (
    <div className={'native-surface ' + className + (fit ? ' native-fit' : '')} aria-label={title}>
      {!loaded && !error && (
        <div className="skeleton native-loading" aria-label="Loading content" />
      )}
      {error && <p role="alert">{error}</p>}
      <div ref={surface} className="native-document" data-native-content tabIndex={0} />
      <input
        ref={picker}
        type="file"
        hidden
        onChange={(e) =>
          send({
            type: 'event',
            event: 'change',
            id: fileTarget.current,
            files: Array.from(e.target.files || []),
          })
        }
      />
      <iframe
        ref={frame}
        id={id}
        data-native-engine
        className="native-engine"
        title={title + ' — ma’lumotlar xizmati'}
        aria-hidden="true"
        tabIndex={-1}
        src={src
          .replace(/([?#])/, '$1')
          .replace(/(#.*)?$/, (match) => (src.includes('?') ? '&' : '?') + 'sqNative=1' + match)}
        onLoad={() => {
          send({ type: 'snapshot' });
          send({ type: 'language', lang });
          onLoad?.();
        }}
      />
      {dialog && (
        <div className="modal-backdrop">
          <form
            className="native-dialog panel"
            onSubmit={(e) => {
              e.preventDefault();
              resolveDialog(dialog.kind === 'confirm' ? true : answer);
            }}
          >
            <h2>{lang === 'uz' ? 'Tasdiqlash' : lang === 'en' ? 'Confirm' : 'Подтверждение'}</h2>
            <p>{dialog.text}</p>
            {dialog.kind === 'prompt' && (
              <input
                className="input"
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            )}
            <div>
              <Button type="button" variant="outline" onClick={() => resolveDialog(null)}>
                {lang === 'uz' ? 'Bekor qilish' : 'Cancel'}
              </Button>
              <Button type="submit">{lang === 'uz' ? 'Davom etish' : 'Continue'}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});
