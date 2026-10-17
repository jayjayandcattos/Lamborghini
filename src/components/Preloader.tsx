import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Mark } from './Mark';
import { pad2 } from '../lib/format';

interface PreloaderProps {
  ready: boolean;
  file: string;
  size: string;
  reduced: boolean;
  onDone: () => void;
}

const SLATS = 7;

export function Preloader({ ready, file, size, reduced, onDone }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const slats = useRef<HTMLDivElement[]>([]);
  const [pct, setPct] = useState(0);
  const [exiting, setExiting] = useState(false);

  // `onDone` is often an inline closure; keeping it in a ref stops the whole
  // progress tween from being torn down and restarted on every parent render.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => doneRef.current(), 260);
      return () => window.clearTimeout(t);
    }

    const counter = { v: 0 };
    const tween = gsap.to(counter, {
      v: ready ? 100 : 88,
      duration: ready ? 1 : 1.5,
      ease: 'power2.out',
      onUpdate: () => setPct(Math.round(counter.v)),
      onComplete: () => {
        if (ready) setExiting(true);
      },
    });

    return () => {
      tween.kill();
    };
  }, [ready, reduced]);

  useEffect(() => {
    if (!exiting) return;
    const tl = gsap.timeline({ onComplete: () => doneRef.current() });
    tl.to('[data-pl-fade]', { opacity: 0, y: -10, duration: 0.28, ease: 'power2.in' });
    tl.to(
      slats.current,
      { scaleY: 0, duration: 0.62, ease: 'expo.inOut', stagger: 0.04, transformOrigin: 'top center' },
      '-=0.1',
    );
    return () => {
      tl.kill();
    };
  }, [exiting]);

  return (
    <div ref={root} className="fixed inset-0 z-50" aria-hidden={exiting}>
      <div className="absolute inset-0 flex">
        {Array.from({ length: SLATS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) slats.current[i] = el;
            }}
            className="h-full flex-1 border-r border-line-2 bg-paper last:border-r-0"
          />
        ))}
      </div>

      <div
        data-pl-fade
        className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6"
      >
        <Mark className="h-11 w-10 text-ink" />

        <div className="flex flex-col items-center gap-1">
          <span className="display text-[46px] tabular-nums text-ink">{pad2(pct)}</span>
          <span className="label">Loading geometry</span>
        </div>

        <div className="relative h-px w-[200px] bg-line">
          <div
            className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex w-[200px] items-baseline justify-between">
          <span className="num text-[9px] uppercase tracking-[0.14em] text-ink-2">{file}</span>
          <span className="num text-[9px] tracking-[0.14em] text-ink-3">{size}</span>
        </div>
      </div>
    </div>
  );
}
