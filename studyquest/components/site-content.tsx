'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImageUp, MousePointerClick, Pause, RotateCcw, Save, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';

/* ✏️ Saytdagi matn va rasmlarni administrator o'zgartiradi (Sayt boshqaruvi → Matnlar va rasmlar).
   O'zgarishlar /api/site/content dan keladi va sahifaga qo'llanadi: ko'rinib turgan yozuv (bo'shliqlari bitta qilib)
   aynan mos kelsa — yangisi bilan, rasm yo'li mos kelsa — yangi rasm bilan almashtiriladi. Faqat matn sifatida
   (HTML emas) qo'yiladi. Tahrirlash rejimida administrator istalgan yozuv yoki rasm ustiga bosib o'zgartiradi. */

export type SiteContent = {
  texts: Record<string, string>;
  images: Record<string, string>;
  rev: number;
};
const CACHE = 'sq-site-content',
  EDIT = 'sq-edit';
const SKIP = 'script,style,noscript,textarea,code,pre,[contenteditable="true"],[data-se-ui]';
export const normText = (s: string) => s.replace(/\s+/g, ' ').trim();
const letters = /\p{L}/u;

let texts = new Map<string, string>(),
  images = new Map<string, string>();
// Kuzatilayotgan tugunlar: asl qiymati (o — kalit, raw — aynan asl ko'rinishi) va hozir qo'yilgan yangisi.
type Seen = { o: string; raw: string; shown: string };
const textOrigin = new WeakMap<Text, Seen>(),
  attrOrigin = new WeakMap<Element, Seen>(),
  imgOrigin = new WeakMap<HTMLImageElement, Seen & { srcset: string | null }>();
const touched = new Set<Node>();

/** Rasm kaliti: shu saytdagi yo'l (/terdu-logo.png). Tashqi, data:, avatar va yuklangan rasmlar — yo'q. */
export function srcKey(src: string | null) {
  if (!src || /^(data|blob):/i.test(src)) return null;
  try {
    const u = new URL(src, location.href);
    if (u.origin !== location.origin || /^\/(api|avatars)\//.test(u.pathname)) return null;
    return decodeURI(u.pathname);
  } catch {
    return null;
  }
}
const skipped = (el: Element | null) => !!el?.closest(SKIP);
const swap = (raw: string, r: string) =>
  (raw.match(/^\s*/)?.[0] || '') + r + (raw.match(/\s*$/)?.[0] || '');

/* Har bir tugun uchun bir xil qoida: tugunda asl yoki biz qo'ygan qiymat tursa — joriy o'zgarishga moslanadi
   (o'zgarish olib tashlangan bo'lsa — asl qiymat qaytadi); boshqa qiymat tursa (React yoki dvigatel yangisini
   chizgan) — kuzatuv yangidan boshlanadi. O'zimiz qilgan o'zgarish qayta kelganda hech narsa qilinmaydi. */
function applyText(node: Text) {
  const data = node.data;
  if (data.length > 2000) return;
  const k = normText(data),
    seen = textOrigin.get(node);
  if (seen) {
    if (k === seen.shown || k === seen.o) {
      const r = texts.get(seen.o);
      if (r === undefined) {
        if (data !== seen.raw) node.data = seen.raw;
        textOrigin.delete(node);
        touched.delete(node);
      } else if (k !== r) {
        node.data = swap(seen.raw, r);
        seen.shown = r;
      }
      return;
    }
    textOrigin.delete(node);
    touched.delete(node);
  }
  const r = k && texts.get(k);
  if (!r || skipped(node.parentElement)) return;
  textOrigin.set(node, { o: k, raw: data, shown: r });
  touched.add(node);
  node.data = swap(data, r);
}
function applyPlaceholder(el: Element) {
  const raw = el.getAttribute('placeholder') || '',
    k = normText(raw),
    seen = attrOrigin.get(el);
  if (seen) {
    if (k === seen.shown || k === seen.o) {
      const r = texts.get(seen.o);
      if (r === undefined) {
        if (raw !== seen.raw) el.setAttribute('placeholder', seen.raw);
        attrOrigin.delete(el);
        touched.delete(el);
      } else if (k !== r) {
        el.setAttribute('placeholder', r);
        seen.shown = r;
      }
      return;
    }
    attrOrigin.delete(el);
    touched.delete(el);
  }
  const r = k && texts.get(k);
  if (!r || skipped(el)) return;
  attrOrigin.set(el, { o: k, raw, shown: r });
  touched.add(el);
  el.setAttribute('placeholder', r);
}
function applyImage(img: HTMLImageElement) {
  const src = img.getAttribute('src') || '',
    seen = imgOrigin.get(img);
  if (seen) {
    if (src === seen.shown || srcKey(src) === seen.o) {
      const r = images.get(seen.o);
      if (r === undefined) {
        if (src !== seen.raw) img.setAttribute('src', seen.raw);
        if (seen.srcset) img.setAttribute('srcset', seen.srcset);
        imgOrigin.delete(img);
        touched.delete(img);
      } else if (src !== r) {
        img.setAttribute('src', r);
        seen.shown = r;
      }
      return;
    }
    imgOrigin.delete(img);
    touched.delete(img);
  }
  const k = srcKey(src),
    r = k && images.get(k);
  if (!r || skipped(img)) return;
  imgOrigin.set(img, { o: k!, raw: src, shown: r, srcset: img.getAttribute('srcset') });
  touched.add(img);
  img.removeAttribute('srcset');
  img.setAttribute('src', r);
}
/** Berilgan qism (yoki butun sahifa) ichida o'zgarishlarni qo'llash. Taqdimot nusxasi ham shu bilan o'tadi. */
export function applySiteContent(root: Node) {
  if (!texts.size && !images.size && !touched.size) return;
  if (root.nodeType === 3) return applyText(root as Text);
  if (root.nodeType !== 1 && root.nodeType !== 11) return;
  if (root.nodeType === 1) {
    const el = root as Element;
    if (skipped(el)) return;
    if (el.tagName === 'IMG') applyImage(el as HTMLImageElement);
    if (el.hasAttribute('placeholder')) applyPlaceholder(el);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.nodeType === 1 && (n as Element).matches(SKIP)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === 3) applyText(n as Text);
    else if ((n as Element).tagName === 'IMG') applyImage(n as HTMLImageElement);
    else if ((n as Element).hasAttribute('placeholder')) applyPlaceholder(n as Element);
  }
}
let watch: MutationObserver | null = null,
  watching = false;
function syncWatch() {
  const need = !!(texts.size || images.size || touched.size);
  if (!watch || need === watching) return;
  if (need)
    watch.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['src', 'placeholder'],
    });
  else watch.disconnect();
  watching = need;
}
// Yangi qiymat → asl kalit (taqdimot nusxasi kabi tugunni ko'chirib yozadigan joylarda aslini topish uchun).
let textBack = new Map<string, string>(),
  imageBack = new Map<string, string>();
function setMaps(c: SiteContent) {
  const oldText = textBack,
    oldImage = imageBack;
  texts = new Map(Object.entries(c.texts || {}).map(([k, v]) => [normText(k), normText(v)]));
  images = new Map(Object.entries(c.images || {}));
  textBack = new Map([...texts].map(([o, n]) => [n, o]));
  imageBack = new Map([...images].map(([o, u]) => [u, o]));
  // Kuzatilmagan, lekin eski yangi qiymatni ko'rsatayotgan tugunlar (masalan, morphdom ko'chirgan) ham olinadi.
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: (n) =>
        n.nodeType === 1 && (n as Element).matches(SKIP)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    },
  );
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === 3 && !textOrigin.has(n as Text)) {
      const t = n as Text,
        k = normText(t.data),
        o = oldText.get(k);
      if (o !== undefined && o !== k) {
        textOrigin.set(t, { o, raw: swap(t.data, o), shown: k });
        touched.add(t);
      }
    } else if ((n as Element).tagName === 'IMG' && !imgOrigin.has(n as HTMLImageElement)) {
      const img = n as HTMLImageElement,
        src = img.getAttribute('src') || '',
        o = oldImage.get(src);
      if (o !== undefined) {
        imgOrigin.set(img, { o, raw: o, shown: src, srcset: null });
        touched.add(img);
      }
    }
  }
  for (const n of [...touched]) {
    if (!n.isConnected) {
      touched.delete(n);
      continue;
    }
    if (n.nodeType === 3) applyText(n as Text);
    else if ((n as Element).tagName === 'IMG') applyImage(n as HTMLImageElement);
    else applyPlaceholder(n as Element);
  }
  applySiteContent(document.body);
  syncWatch();
}
/** Ko'rinib turgan yozuvning asl ko'rinishi (o'zgartirilgan bo'lsa — asl matni). */
export function originalText(node: Text) {
  const k = normText(node.data);
  return textOrigin.get(node)?.o ?? textBack.get(k) ?? k;
}
export function originalPlaceholder(el: Element) {
  const k = normText(el.getAttribute('placeholder') || '');
  return attrOrigin.get(el)?.o ?? textBack.get(k) ?? k;
}
export function originalImage(img: HTMLImageElement) {
  const src = img.getAttribute('src') || '';
  return imgOrigin.get(img)?.o ?? imageBack.get(src) ?? srcKey(src);
}
export function countText(o: string) {
  let n = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode())
    if (!skipped(t.parentElement) && originalText(t as Text) === o) n++;
  return n;
}

const listeners = new Set<(c: SiteContent) => void>();
let current: SiteContent = { texts: {}, images: {}, rev: 0 };
/** Yangi holatni hamma joyga yoyish (administrator saqlaganda darhol). */
export function publishSiteContent(c: SiteContent) {
  current = c;
  try {
    localStorage.setItem(CACHE, JSON.stringify(c));
  } catch {}
  setMaps(c);
  listeners.forEach((f) => f(c));
}
export function useSiteContent() {
  const [c, setC] = useState(current);
  useEffect(() => {
    listeners.add(setC);
    setC(current);
    return () => {
      listeners.delete(setC);
    };
  }, []);
  return c;
}
/** Sayt boshqaruvidan: tahrirlash rejimini yoqib bosh sahifaga o'tish. */
export function startEditMode() {
  try {
    sessionStorage.setItem(EDIT, '1');
  } catch {}
  window.dispatchEvent(new Event('sq-edit'));
  if (location.hash.startsWith('#admin')) location.hash = 'home';
}

/** Butun saytga o'zgarishlarni qo'llovchi qatlam + administrator uchun tahrirlash rejimi. */
export function SiteContentLayer() {
  const { data } = useApp();
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (saved?.texts) publishSiteContent(saved);
    } catch {}
    let stop = false;
    const load = () =>
      fetch('/api/site/content')
        .then((r) => (r.ok ? r.json() : null))
        .then((c: SiteContent | null) => {
          if (!stop && c && c.rev !== current.rev) publishSiteContent(c);
          else if (!stop && c && !current.rev && !c.rev) current = c;
        })
        .catch(() => {});
    void load();
    const timer = setInterval(load, 5 * 60000);
    // Kuzatuvchi faqat o'zgarish bor paytda ulanadi — oddiy holatda sahifaga hech qanday yuk yo'q.
    watch = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'childList') m.addedNodes.forEach((n) => applySiteContent(n));
        else if (m.type === 'characterData') applyText(m.target as Text);
        else if (m.target.nodeType === 1) {
          const el = m.target as Element;
          if (m.attributeName === 'src' && el.tagName === 'IMG') applyImage(el as HTMLImageElement);
          else if (m.attributeName === 'placeholder') applyPlaceholder(el);
        }
      }
    });
    syncWatch();
    return () => {
      stop = true;
      clearInterval(timer);
      watch?.disconnect();
      watch = null;
      watching = false;
    };
  }, []);
  return data?.user?.role === 'admin' ? <EditMode /> : null;
}

type Target =
  | { kind: 'text'; o: string; shown: string }
  | { kind: 'placeholder'; o: string; shown: string }
  | { kind: 'image'; o: string; shown: string };

function EditMode() {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [on, setOn] = useState(false),
    [paused, setPaused] = useState(false),
    [target, setTarget] = useState<Target | null>(null);
  const hover = useRef<Element | null>(null);
  useEffect(() => {
    const sync = () => {
      try {
        setOn(sessionStorage.getItem(EDIT) === '1');
      } catch {}
    };
    sync();
    window.addEventListener('sq-edit', sync);
    return () => window.removeEventListener('sq-edit', sync);
  }, []);
  const finish = useCallback(() => {
    try {
      sessionStorage.removeItem(EDIT);
    } catch {}
    setOn(false);
    setTarget(null);
  }, []);
  useEffect(() => {
    if (!on || paused) return;
    document.documentElement.classList.add('se-editing');
    const unmark = () => {
      hover.current?.classList.remove('se-hover');
      hover.current = null;
    };
    const pick = (e: MouseEvent): Target | null => {
      const el = e.target as Element | null;
      if (!el || el.closest('[data-se-ui]')) return null;
      const img = el.closest('img');
      if (img) {
        const o = originalImage(img as HTMLImageElement);
        return o ? { kind: 'image', o, shown: (img as HTMLImageElement).src } : null;
      }
      if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.getAttribute('placeholder'))
        return {
          kind: 'placeholder',
          o: originalPlaceholder(el),
          shown: el.getAttribute('placeholder')!,
        };
      const doc = document as Document & {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
      };
      let node: Node | null | undefined =
        doc.caretPositionFromPoint?.(e.clientX, e.clientY)?.offsetNode ??
        doc.caretRangeFromPoint?.(e.clientX, e.clientY)?.startContainer;
      if (!(node?.nodeType === 3 && el.contains(node) && letters.test((node as Text).data))) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        node = null;
        for (let t = walker.nextNode(); t; t = walker.nextNode())
          if (letters.test((t as Text).data) && !skipped(t.parentElement)) {
            node = t;
            break;
          }
      }
      if (!node || skipped(node.parentElement)) return null;
      return { kind: 'text', o: originalText(node as Text), shown: normText((node as Text).data) };
    };
    const move = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (!el || el === hover.current) return;
      unmark();
      if (el.closest('[data-se-ui]')) return;
      hover.current = el;
      el.classList.add('se-hover');
    };
    const click = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('[data-se-ui]')) return;
      e.preventDefault();
      e.stopPropagation();
      const t = pick(e);
      if (t && t.kind !== 'image' && !letters.test(t.o))
        return toast(
          L(
            'Bu son yoki belgi — uni o‘zgartirib bo‘lmaydi.',
            'This is a number or symbol — it cannot be changed.',
            'Это число или символ — изменить нельзя.',
          ),
        );
      if (t) setTarget(t);
    };
    const block = (e: Event) => {
      if (!(e.target as Element | null)?.closest?.('[data-se-ui]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('mouseover', move, true);
    document.addEventListener('click', click, true);
    document.addEventListener('submit', block, true);
    document.addEventListener('auxclick', block, true);
    return () => {
      unmark();
      document.documentElement.classList.remove('se-editing');
      document.removeEventListener('mouseover', move, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('submit', block, true);
      document.removeEventListener('auxclick', block, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, paused, toast, lang]);
  if (!on) return null;
  return createPortal(
    <>
      <div
        className="se-bar"
        data-se-ui
        role="region"
        aria-label={L('Tahrirlash rejimi', 'Edit mode', 'Режим правки')}
      >
        <span>
          {paused
            ? L(
                '🧭 Sahifalar bo‘ylab yuring, keyin «Tahrirlashga qaytish»ni bosing.',
                '🧭 Browse the pages, then press “Back to editing”.',
                '🧭 Перейдите на нужную страницу и нажмите «Вернуться к правке».',
              )
            : L(
                '✏️ O‘zgartirmoqchi bo‘lgan yozuv yoki rasm ustiga bosing.',
                '✏️ Click any text or picture to change it.',
                '✏️ Нажмите на текст или картинку, чтобы изменить.',
              )}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setPaused(!paused)}>
          {paused ? <MousePointerClick size={14} /> : <Pause size={14} />}
          {paused
            ? L('Tahrirlashga qaytish', 'Back to editing', 'Вернуться к правке')
            : L('Sahifalar bo‘ylab yurish', 'Browse pages', 'Перейти по страницам')}
        </Button>
        <Button size="sm" onClick={finish}>
          <X size={14} />
          {L('Tayyor', 'Done', 'Готово')}
        </Button>
      </div>
      {target && (
        <Editor
          target={target}
          close={() => setTarget(null)}
          request={request}
          toast={toast}
          L={L}
        />
      )}
    </>,
    document.body,
  );
}

function Editor({
  target,
  close,
  request,
  toast,
  L,
}: {
  target: Target;
  close: () => void;
  request: (url: string, init?: RequestInit) => Promise<Response>;
  toast: (m: string) => void;
  L: (uz: string, en: string, ru: string) => string;
}) {
  const content = useSiteContent();
  const changed = target.kind === 'image' ? content.images[target.o] : content.texts[target.o];
  const [value, setValue] = useState(target.kind === 'image' ? '' : changed || target.o),
    [file, setFile] = useState<{ blob: Blob; url: string } | null>(null),
    [busy, setBusy] = useState(false);
  const count = target.kind === 'text' ? countText(target.o) : 0;
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [close]);
  async function post(input: unknown) {
    const r = await request('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'siteText', input }),
      }),
      v = await r.json();
    if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
    return v as SiteContent;
  }
  async function run(work: () => Promise<SiteContent>, done: string) {
    setBusy(true);
    try {
      publishSiteContent(await work());
      toast(done);
      close();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const save = () =>
    target.kind === 'image'
      ? file &&
        run(
          async () => {
            const form = new FormData();
            form.append('o', target.o);
            form.append('file', file.blob, 'rasm');
            const r = await request('/api/site/upload', { method: 'POST', body: form }),
              v = await r.json();
            if (!r.ok) throw new Error(v.error || 'Xatolik');
            return v;
          },
          L('Rasm almashtirildi ✅', 'Picture replaced ✅', 'Картинка заменена ✅'),
        )
      : run(
          () => post({ op: 'set', o: target.o, n: value }),
          L('Matn saqlandi ✅', 'Text saved ✅', 'Текст сохранён ✅'),
        );
  const reset = () =>
    run(
      () =>
        post(
          target.kind === 'image'
            ? { op: 'removeImage', o: target.o }
            : { op: 'remove', o: target.o },
        ),
      L('Asl holiga qaytarildi', 'Restored the original', 'Возвращён исходный вариант'),
    );
  return (
    <div
      className="se-scrim"
      data-se-ui
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section className="se-dialog" role="dialog" aria-modal="true" aria-labelledby="se-title">
        <h2 id="se-title">
          {target.kind === 'image'
            ? L('🖼 Rasmni almashtirish', '🖼 Replace the picture', '🖼 Заменить картинку')
            : L('✏️ Matnni o‘zgartirish', '✏️ Change the text', '✏️ Изменить текст')}
        </h2>
        {target.kind === 'image' ? (
          <>
            <div className="se-images">
              <figure>
                <img src={file?.url || target.shown} alt="" />
                <figcaption>
                  {file
                    ? L('Yangi rasm', 'New picture', 'Новая картинка')
                    : L('Hozirgi rasm', 'Current picture', 'Текущая картинка')}
                </figcaption>
              </figure>
            </div>
            <label className="se-file">
              <ImageUp size={16} />
              {L('Yangi rasm tanlash', 'Choose a new picture', 'Выбрать новую картинку')}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  try {
                    const blob = await shrink(f);
                    setFile({ blob, url: URL.createObjectURL(blob) });
                  } catch (err) {
                    toast((err as Error).message);
                  }
                }}
              />
            </label>
            <p className="se-note">
              {L(
                'Rasm saytning hamma joyida almashadi (masalan, logotip menyuda ham, kirish sahifasida ham). Katta rasm avtomatik kichraytiriladi.',
                'The picture changes everywhere on the site (e.g. the logo in the menu and on the sign-in page). Large pictures are shrunk automatically.',
                'Картинка меняется на всём сайте (например, логотип в меню и на странице входа). Большие картинки уменьшаются автоматически.',
              )}
            </p>
          </>
        ) : (
          <>
            <p className="se-label">{L('Asl matn', 'Original text', 'Исходный текст')}</p>
            <blockquote className="se-original">{target.o}</blockquote>
            <label className="se-label" htmlFor="se-new">
              {L('Yangi matn', 'New text', 'Новый текст')}
            </label>
            <textarea
              id="se-new"
              rows={Math.min(8, Math.max(2, Math.ceil(value.length / 60)))}
              maxLength={2000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            <p className="se-note">
              {target.kind === 'placeholder'
                ? L(
                    'Bu — kiritish maydonidagi kulrang yordamchi yozuv.',
                    'This is the grey hint inside an input.',
                    'Это серая подсказка в поле ввода.',
                  )
                : L(
                    `Saytning hamma joyida aynan shu yozuv o‘zgaradi (bu sahifada ${Math.max(1, count)} ta joyda). Faqat hozirgi tildagi ko‘rinishi o‘zgaradi.`,
                    `This exact text changes everywhere on the site (${Math.max(1, count)} place(s) on this page). Only the current language is changed.`,
                    `Этот текст меняется на всём сайте (${Math.max(1, count)} на этой странице). Меняется только текущий язык.`,
                  )}
            </p>
          </>
        )}
        <div className="se-actions">
          <Button
            disabled={
              busy ||
              (target.kind === 'image'
                ? !file
                : !normText(value) || normText(value) === normText(changed || target.o))
            }
            onClick={() => void save()}
          >
            <Save size={15} />
            {L('Saqlash', 'Save', 'Сохранить')}
          </Button>
          {changed && (
            <Button variant="outline" disabled={busy} onClick={() => void reset()}>
              <RotateCcw size={15} />
              {L('Asl holiga qaytarish', 'Restore the original', 'Вернуть исходный')}
            </Button>
          )}
          <Button variant="ghost" disabled={busy} onClick={close}>
            {L('Bekor qilish', 'Cancel', 'Отмена')}
          </Button>
        </div>
      </section>
    </div>
  );
}

/** Rasmni brauzerda kichraytirish: eng uzun tomoni 1600 px gacha, WEBP (iloji bo'lmasa — PNG/JPEG). */
export async function shrink(file: File, max = 1600): Promise<Blob> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type))
    throw new Error('PNG, JPEG, WEBP yoki GIF rasm tanlang.');
  if (file.type === 'image/gif') {
    if (file.size > 3 * 1024 * 1024) throw new Error('GIF 3 MB dan oshmasin.');
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 400000) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = (type: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, 0.86));
  let out = await blob('image/webp');
  if (!out || out.type !== 'image/webp')
    out = await blob(file.type === 'image/png' ? 'image/png' : 'image/jpeg');
  if (!out) throw new Error('Rasmni tayyorlab bo‘lmadi.');
  if (out.size > 3 * 1024 * 1024) throw new Error('Rasm juda katta — kichikroq rasm tanlang.');
  return out;
}
