'use client';
import { useEffect, useRef, type TouchEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
export function ReaderHeading({
  title,
  topic,
  total,
}: {
  title: string;
  topic: number;
  total: number;
}) {
  return (
    <div className="reader-heading">
      <p>
        <span>Tadbirkorlik asoslari</span>
        <span>
          {topic}-mavzu / {total}
        </span>
      </p>
      <h1>{title}</h1>
    </div>
  );
}
export function ReaderControls({
  index,
  count,
  ready,
  go,
}: {
  index: number;
  count: number;
  ready: boolean;
  go: (index: number) => void;
}) {
  return (
    <footer className="reader-controls" aria-label="Slaydlarni boshqarish">
      <Button
        variant="outline"
        className="reader-previous"
        disabled={!ready || index === 0}
        onClick={() => go(index - 1)}
      >
        <ArrowLeft size={19} />
        <span>Oldingi</span>
      </Button>
      {/* Bitta hisoblagich: ko'rinadigan «4 / 18», ustida shaffof ro'yxat — bosilsa istalgan slaydni tanlash mumkin */}
      <label className="reader-picker">
        <span className="reader-counter" aria-live="polite">
          {index + 1} / {count}
        </span>
        <select
          aria-label="Slaydni tanlash"
          disabled={!ready}
          value={index}
          onChange={(e) => go(Number(e.target.value))}
        >
          {Array.from({ length: count }, (_, i) => (
            <option key={i} value={i}>
              {i + 1} / {count}
            </option>
          ))}
        </select>
      </label>
      <Button
        className="reader-next"
        disabled={!ready || index >= count - 1}
        onClick={() => go(index + 1)}
      >
        <span>Keyingi</span>
        <ArrowRight size={19} />
      </Button>
    </footer>
  );
}
export function useReaderGestures(
  index: number,
  count: number,
  ready: boolean,
  go: (index: number) => void,
  legacy = false,
) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const excluded = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest(
      'input,textarea,select,button,a,video,iframe,table,[contenteditable="true"],[role="button"],.qbox,.xw-grid,.task',
    );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !ready ||
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        (e.target instanceof Element &&
          e.target.closest(
            'input,textarea,select,[contenteditable="true"],.qbox,.xw-grid,.task',
          )) ||
        (legacy && e.target instanceof Element && e.target.closest('.native-document'))
      )
        return;
      const next = e.key === 'ArrowRight' ? index + 1 : e.key === 'ArrowLeft' ? index - 1 : null;
      if (next !== null && next >= 0 && next < count) {
        e.preventDefault();
        go(next);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [index, count, ready, go, legacy]);
  return {
    onTouchStart: (e: TouchEvent) => {
      start.current =
        ready && e.touches.length === 1 && !excluded(e.target)
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : null;
    },
    onTouchCancel: () => {
      start.current = null;
    },
    onTouchEnd: (e: TouchEvent) => {
      const p = start.current;
      start.current = null;
      if (!p || e.changedTouches.length !== 1 || window.getSelection()?.type === 'Range') return;
      const dx = e.changedTouches[0].clientX - p.x,
        dy = e.changedTouches[0].clientY - p.y;
      const next = index + (dx < 0 ? 1 : -1);
      if (
        Math.abs(dx) > 75 &&
        Math.abs(dy) < 40 &&
        Math.abs(dx) > Math.abs(dy) * 2 &&
        next >= 0 &&
        next < count
      )
        go(next);
    },
  };
}
