import { CodePanel } from './CodePanel';
import { cameraViews, paintOptions } from '../data/models';
import { aos, formatInt } from '../lib/format';
import { useRenderStats } from '../hooks/useRenderStats';
import type { BrandModel, CameraView, RenderStats, SceneSettings } from '../types';
import type { RefObject, ReactNode } from 'react';

interface InspectorProps {
  model: BrandModel;
  paint: string;
  onPaint: (hex: string) => void;
  view: CameraView;
  onView: (view: CameraView) => void;
  settings: SceneSettings;
  onToggle: (key: keyof SceneSettings) => void;
  tab: 'properties' | 'code';
  onTab: (tab: 'properties' | 'code') => void;
  statsRef: RefObject<RenderStats>;
  reduced: boolean;
}

function Section({
  title,
  children,
  delay,
  reduced,
}: {
  title: string;
  children: ReactNode;
  delay: number;
  reduced: boolean;
}) {
  return (
    <section className="mb-5 last:mb-0" {...aos('fade-up', delay, !reduced)}>
      <div className="mb-1 flex items-center gap-2">
        <span className="label text-[8.5px]">{title}</span>
        <span className="h-px flex-1 bg-line-2" />
      </div>
      {children}
    </section>
  );
}

function Row({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="row">
      <dt>{k}</dt>
      <dd className={accent ? 'text-[var(--accent-ink)]' : undefined}>{v}</dd>
    </div>
  );
}

export function Inspector({
  model,
  paint,
  onPaint,
  view,
  onView,
  settings,
  onToggle,
  tab,
  onTab,
  statsRef,
  reduced,
}: InspectorProps) {
  const stats = useRenderStats(statsRef);
  const paintName = paintOptions.find((p) => p.hex.toLowerCase() === paint.toLowerCase())?.name ?? 'Custom';

  const sceneRows: { key: keyof SceneSettings; label: string }[] = [
    { key: 'wireframe', label: 'wireframe' },
    { key: 'grid', label: 'grid' },
    { key: 'shadows', label: 'contactShadow' },
    { key: 'autoRotate', label: 'autoRotate' },
  ];

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex items-stretch gap-4 border-b border-line px-4">
        <div role="tablist" aria-label="Inspector view" className="flex gap-4">
          {(['properties', 'code'] as const).map((id) => {
            const active = tab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onTab(id)}
                className={`relative py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                  active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {id}
                {active ? <span className="absolute inset-x-0 bottom-0 h-px bg-ink" /> : null}
              </button>
            );
          })}
        </div>
        <span className="label ml-auto self-center text-[8px] text-ink-3">{model.id}</span>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto px-4 py-4">
        {tab === 'properties' ? (
          <>
            <Section title="Object" delay={0} reduced={reduced}>
              <dl>
                <Row k="file" v={model.file} />
                <Row k="meshes" v={formatInt(model.meshes)} />
                <Row k="triangles" v={formatInt(stats.tris)} />
                <Row k="drawCalls" v={formatInt(stats.calls)} />
              </dl>
            </Section>

            <Section title="Material" delay={60} reduced={reduced}>
              <div className="mt-2 grid grid-cols-8 gap-1">
                {paintOptions.map((p) => {
                  const active = p.hex.toLowerCase() === paint.toLowerCase();
                  return (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => onPaint(p.hex)}
                      aria-pressed={active}
                      aria-label={`${p.name} — ${p.hex}`}
                      title={p.name}
                      className={`aspect-square border border-line transition-transform duration-200 hover:-translate-y-px ${
                        active ? 'outline outline-2 outline-offset-1 outline-ink' : ''
                      }`}
                      style={{ backgroundColor: p.hex }}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-mono text-[10px] text-ink">{paintName}</span>
                <span className="num text-[9px] uppercase text-ink-3">{paint}</span>
              </div>
              <dl className="mt-2">
                <Row k="roughness" v={model.paintRoughness.toFixed(2)} />
                <Row k="metalness" v={model.paintMetalness.toFixed(2)} />
                <Row k="envIntensity" v="1.35" />
              </dl>
            </Section>

            <Section title="Scene" delay={120} reduced={reduced}>
              {sceneRows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  aria-pressed={settings[row.key]}
                  onClick={() => onToggle(row.key)}
                  className="flex w-full items-center justify-between border-t border-line-2 py-[7px] text-left first:border-t-0"
                >
                  <span className="font-mono text-[10px] text-ink-2">{row.label}</span>
                  <span className="box" data-on={settings[row.key]} />
                </button>
              ))}
            </Section>

            <Section title="Camera" delay={180} reduced={reduced}>
              {cameraViews.map((c) => {
                const active = view === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onView(c.id)}
                    className="flex w-full items-baseline justify-between border-t border-line-2 py-[6px] text-left first:border-t-0"
                  >
                    <span className="flex items-center gap-2 font-mono text-[10px]">
                      <span
                        className={`h-1 w-1 ${active ? 'bg-[var(--accent)]' : 'bg-line'}`}
                      />
                      <span className={active ? 'text-ink' : 'text-ink-2'}>{c.label}</span>
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-3">
                      {c.hint}
                    </span>
                  </button>
                );
              })}
              <dl className="mt-1">
                <Row k="fov" v="38°" />
              </dl>
            </Section>

            <Section title="Powertrain" delay={240} reduced={reduced}>
              <dl>
                <Row k="engine" v={model.engine} />
                <Row k="torque" v={model.torque} />
                <Row k="redline" v={model.redline} />
                <Row k="drive" v={model.drivetrain} />
                <Row k="weight" v={model.weight} />
                <Row k="modelYear" v={model.year} />
              </dl>
            </Section>
          </>
        ) : (
          <CodePanel model={model} paint={paint} view={view} settings={settings} />
        )}
      </div>
    </div>
  );
}
