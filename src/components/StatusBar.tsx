import { formatInt } from '../lib/format';
import { useRenderStats } from '../hooks/useRenderStats';
import type { RenderStats } from '../types';
import type { RefObject } from 'react';

export function StatusBar({ statsRef }: { statsRef: RefObject<RenderStats> }) {
  const stats = useRenderStats(statsRef);
  const healthy = stats.fps >= 45;

  return (
    <footer className="relative z-20 flex h-7 shrink-0 items-center gap-3 overflow-hidden border-t border-line bg-panel px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 md:gap-4 md:px-4">
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: healthy ? '#3f8f5f' : 'var(--accent-ink)',
            animation: 'dot-pulse 2.4s ease-in-out infinite',
          }}
        />
        <span className="tabular-nums text-ink-2">{stats.fps || '—'}</span>
        <span className="hidden sm:inline">fps</span>
      </span>

      <span className="hidden whitespace-nowrap sm:inline">
        tris <span className="tabular-nums text-ink-2">{formatInt(stats.tris)}</span>
      </span>
      <span className="hidden whitespace-nowrap md:inline">
        calls <span className="tabular-nums text-ink-2">{formatInt(stats.calls)}</span>
      </span>
      <span className="hidden whitespace-nowrap lg:inline">
        dpr <span className="tabular-nums text-ink-2">{stats.dpr.toFixed(2)}</span>
      </span>

      <span className="ml-auto hidden items-center gap-2 whitespace-nowrap text-[8.5px] tracking-[0.18em] md:flex">
        <span className="text-ink-2">drag</span> orbit
        <span className="text-line">·</span>
        <span className="text-ink-2">scroll</span> zoom
        <span className="text-line">·</span>
        <span className="text-ink-2">← →</span> chassis
      </span>
    </footer>
  );
}
