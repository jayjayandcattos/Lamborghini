import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { modelsData } from '../data/models';
import { aos } from '../lib/format';
import type { SceneSettings } from '../types';

interface SidebarProps {
  activeIndex: number;
  onSelect: (index: number) => void;
  settings: SceneSettings;
  onToggle: (key: keyof SceneSettings) => void;
  reduced: boolean;
  onNavigate?: () => void;
}

function Group({
  title,
  count,
  children,
  delay,
  reduced,
}: {
  title: string;
  count?: string;
  children: ReactNode;
  delay: number;
  reduced: boolean;
}) {
  return (
    <div className="mb-4" {...aos('fade-up', delay, !reduced)}>
      <div className="mb-1 flex items-center gap-1.5 px-2">
        <ChevronDown size={10} className="text-ink-3" />
        <span className="label text-[8.5px] text-ink-2">{title}</span>
        {count ? <span className="label ml-auto text-[8.5px]">{count}</span> : null}
      </div>
      <div className="ml-2 border-l border-line-2 pl-1">{children}</div>
    </div>
  );
}

export function Sidebar({
  activeIndex,
  onSelect,
  settings,
  onToggle,
  reduced,
  onNavigate,
}: SidebarProps) {
  const toggles: { key: keyof SceneSettings; label: string }[] = [
    { key: 'wireframe', label: 'wireframe' },
    { key: 'grid', label: 'grid' },
    { key: 'shadows', label: 'contact_shadow' },
    { key: 'autoRotate', label: 'auto_rotate' },
  ];

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <span className="label">Examples</span>
        <span className="label text-[8.5px]">
          {String(activeIndex + 1).padStart(2, '0')} / {String(modelsData.length).padStart(2, '0')}
        </span>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto px-2 py-3.5">
        <Group title="webgl" delay={0} reduced={reduced}>
          <button
            type="button"
            onClick={onNavigate}
            aria-current="page"
            className="flex w-full items-center gap-2 border-l-2 border-[var(--accent)] bg-sheet py-1.5 pl-2.5 pr-2 text-left font-mono text-[10px] text-ink"
          >
            <span className="h-1 w-1 shrink-0 bg-[var(--accent)]" />
            configurator
          </button>

          {toggles.map((t, i) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={settings[t.key]}
              onClick={() => onToggle(t.key)}
              className="group flex w-full items-center gap-2 border-l-2 border-transparent py-1.5 pl-2.5 pr-2 text-left font-mono text-[10px] text-ink-2 transition-colors hover:bg-sheet hover:text-ink"
              {...aos('fade-right', 50 + i * 50, !reduced)}
            >
              <span className="box shrink-0" data-on={settings[t.key]} />
              <span className="truncate">{t.label}</span>
              <span className="ml-auto text-[8px] uppercase tracking-[0.12em] text-ink-3">
                {settings[t.key] ? 'on' : 'off'}
              </span>
            </button>
          ))}
        </Group>

        <Group title="models" count={`${modelsData.length}`} delay={120} reduced={reduced}>
          {modelsData.map((m, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelect(i);
                  onNavigate?.();
                }}
                aria-pressed={active}
                className={`group flex w-full items-center gap-2 border-l-2 py-1.5 pl-2.5 pr-2 text-left font-mono text-[10px] transition-colors ${
                  active
                    ? 'border-[var(--accent)] bg-sheet text-ink'
                    : 'border-transparent text-ink-2 hover:bg-sheet hover:text-ink'
                }`}
                {...aos('fade-right', 150 + i * 50, !reduced)}
              >
                <span
                  className={`h-1 w-1 shrink-0 ${active ? 'bg-[var(--accent)]' : 'bg-line'}`}
                />
                <span className="truncate">{m.file}</span>
                <span className="ml-auto shrink-0 text-[8px] text-ink-3">{m.size}</span>
              </button>
            );
          })}
        </Group>

        <Group title="renderer" delay={320} reduced={reduced}>
          <dl className="pr-2">
            {[
              ['engine', 'webgl2'],
              ['tone', 'neutral'],
              ['env', 'lightformer'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between border-t border-line-2 py-1 pl-2.5 font-mono text-[9px] first:border-t-0"
              >
                <dt className="text-ink-3">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Group>
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="font-mono text-[9px] leading-[1.7] text-ink-3">
          Drag to orbit · scroll to zoom
          <br />
          <span className="text-ink-2">← →</span> switch chassis
        </p>
      </div>
    </div>
  );
}
