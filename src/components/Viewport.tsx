import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { SplitText } from './SplitText';
import { Scene } from './Scene';
import { cameraViews } from '../data/models';
import { pad2 } from '../lib/format';
import type { BrandModel, CameraView, RenderStats, SceneSettings } from '../types';
import type { RefObject } from 'react';

interface ViewportProps {
  model: BrandModel;
  index: number;
  total: number;
  paint: string;
  view: CameraView;
  onView: (view: CameraView) => void;
  onPrev: () => void;
  onNext: () => void;
  settings: SceneSettings;
  statsRef: RefObject<RenderStats>;
  onInteractionChange: (isInteracting: boolean) => void;
  onGeometryStats: (tris: number, calls: number) => void;
  interacting: boolean;
  reduced: boolean;
}

function Spec({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="border-r border-line px-3.5 py-2 last:border-r-0 md:px-4 md:py-2.5">
      <div className="label text-[7.5px] tracking-[0.22em] md:text-[8px]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="display text-[19px] tabular-nums text-ink md:text-[22px]">
          <AnimatedNumber value={value} />
        </span>
        <span className="num text-[7.5px] uppercase tracking-[0.12em] text-ink-3 md:text-[8px]">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function Viewport({
  model,
  index,
  total,
  paint,
  view,
  onView,
  onPrev,
  onNext,
  settings,
  statsRef,
  onInteractionChange,
  onGeometryStats,
  interacting,
  reduced,
}: ViewportProps) {
  return (
    <section className="relative min-h-[56svh] flex-1 overflow-hidden border-b border-line bg-paper lg:min-h-0 lg:border-b-0">
      <div className="blueprint pointer-events-none absolute inset-0" />

      <div className="absolute inset-0">
        <Scene
          model={model}
          paint={paint}
          view={view}
          settings={settings}
          statsRef={statsRef}
          onInteractionChange={onInteractionChange}
          onGeometryStats={onGeometryStats}
        />
      </div>

      {/* Paper wash so the type stays legible over the render. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-paper/95 via-paper/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper/90 to-transparent" />

      {/* ── Top HUD ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 md:p-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="num text-[10px] font-medium text-[var(--accent-ink)]">
              {pad2(index + 1)}
            </span>
            <span className="h-px w-6 bg-[var(--accent)]" />
            <span className="label text-[8px]">Automobili</span>
          </div>

          <h1 className="display mt-2.5 max-w-[86vw] text-[clamp(1.75rem,4.6vw,3rem)] uppercase text-ink lg:max-w-[34rem]">
            <SplitText text={model.name} reduced={reduced} />
          </h1>

          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.26em] text-[var(--accent-ink)] md:text-[10px]">
            {model.variant}
          </p>

          <p
            className="mt-3 hidden max-w-[36ch] text-[12.5px] leading-[1.7] text-ink-2 transition-opacity duration-500 sm:block"
            style={{ opacity: interacting ? 0 : 1 }}
          >
            {model.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous chassis"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center border border-line bg-sheet/70 text-ink-2 backdrop-blur-[1px] transition-colors hover:border-ink hover:text-ink"
            >
              <ArrowLeft size={12} />
            </button>
            <span className="num px-1.5 text-[9px] tabular-nums text-ink-3">
              {pad2(index + 1)} / {pad2(total)}
            </span>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next chassis"
              className="pointer-events-auto flex h-7 w-7 items-center justify-center border border-line bg-sheet/70 text-ink-2 backdrop-blur-[1px] transition-colors hover:border-ink hover:text-ink"
            >
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="hidden flex-col items-end gap-1 md:flex">
            <span className="label text-[8px]">View</span>
            <span className="num text-[11px] text-ink">{view}</span>
            <span className="mt-1 h-px w-10 bg-line" />
            <span className="num text-[9px] text-ink-3">fov 38°</span>
          </div>
        </div>
      </div>

      {/* ── Bottom HUD ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between md:p-7">
        <div className="pointer-events-auto flex w-full border-y border-line bg-sheet/80 backdrop-blur-[2px] md:w-auto">
          <Spec label="Power" value={model.power} unit={model.powerUnit} />
          <Spec label="0 – 100" value={model.accel} unit={model.accelUnit} />
          <Spec label="V-max" value={model.vmax} unit={model.vmaxUnit} />
        </div>

        <div className="pointer-events-auto flex flex-col gap-1.5">
          <span className="label text-[7.5px] tracking-[0.22em]">Camera</span>
          <div className="flex border border-line bg-sheet/80 backdrop-blur-[2px]">
            {cameraViews.map((c) => {
              const active = view === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onView(c.id)}
                  className={`px-2.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                    active
                      ? 'bg-ink text-paper'
                      : 'text-ink-3 hover:bg-line-2 hover:text-ink'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
