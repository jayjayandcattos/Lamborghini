import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const PARTS = /^([^\d]*)([\d.]+)([\s\S]*)$/;

function parse(value: string) {
  const match = PARTS.exec(value);
  if (!match) return { prefix: '', decimals: 0, suffix: value, target: Number.NaN };
  const raw = match[2];
  const dot = raw.indexOf('.');
  return {
    prefix: match[1],
    decimals: dot === -1 ? 0 : raw.length - dot - 1,
    suffix: match[3],
    target: Number.parseFloat(raw),
  };
}

interface AnimatedNumberProps {
  value: string;
  duration?: number;
}

export function AnimatedNumber({ value, duration = 900 }: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const { prefix, decimals, suffix, target } = parse(value);
  const [display, setDisplay] = useState(() => (reduced ? target : 0));
  const current = useRef(display);

  useEffect(() => {
    if (Number.isNaN(target) || reduced || duration <= 0) {
      current.current = target;
      setDisplay(target);
      return;
    }

    let frame = 0;
    const from = current.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      current.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  if (Number.isNaN(target)) return <>{value}</>;

  return (
    <>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </>
  );
}