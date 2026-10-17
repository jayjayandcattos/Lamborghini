import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  reduced?: boolean;
}

/**
 * Per-character mask reveal. Words are kept `nowrap` so the line never breaks
 * mid-word, and each glyph gets its own overflow-hidden box so the mask is
 * exact rather than approximated with a blur.
 */
export function SplitText({ text, className = '', delay = 0, reduced = false }: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const chars = el.querySelectorAll<HTMLElement>('[data-char]');
    const tween = gsap.fromTo(
      chars,
      { yPercent: 58, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.016,
        delay,
        overwrite: true,
      },
    );

    return () => {
      tween.kill();
    };
  }, [text, delay, reduced]);

  const words = text.split(' ');

  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span
          key={`${text}-${wi}`}
          className="inline-block whitespace-nowrap"
          aria-hidden="true"
        >
          {Array.from(word).map((char, ci) => (
            <span key={ci} data-char className="inline-block will-change-transform">
              {char}
            </span>
          ))}
          {wi < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  );
}
