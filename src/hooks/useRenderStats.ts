import { useEffect, useState, type RefObject } from 'react';
import type { RenderStats } from '../types';

/**
 * Polls a mutable stats object written by the render loop. Keeping the poll
 * local means the 3D scene never re-renders just to update a number.
 */
export function useRenderStats(ref: RefObject<RenderStats>, interval = 600): RenderStats {
  const [stats, setStats] = useState<RenderStats>({ fps: 0, tris: 0, calls: 0, dpr: 1 });

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = ref.current;
      setStats({
        fps: next.fps,
        tris: next.tris,
        calls: next.calls,
        dpr: next.dpr,
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [ref, interval]);

  return stats;
}
