import { useEffect, useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import type { BrandModel, CameraView, SceneSettings } from '../types';

interface CodePanelProps {
  model: BrandModel;
  paint: string;
  view: CameraView;
  settings: SceneSettings;
}

const BOOL = (v: boolean) => (
  <span className={v ? 'tok-key' : 'tok-key opacity-60'}>{String(v)}</span>
);

export function CodePanel({ model, paint, view, settings }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const source = [
    '<Configurator>',
    '  <Lamborghini',
    `    model="${model.id}"`,
    `    paint="${paint}"`,
    `    view="${view}"`,
    `    wireframe={${settings.wireframe}}`,
    `    grid={${settings.grid}}`,
    `    autoRotate={${settings.autoRotate}}`,
    '  />',
    '</Configurator>',
  ].join('\n');

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const lines: ReactNode[] = [
    <>
      <span className="tok-punct">&lt;</span>
      <span className="tok-tag">Configurator</span>
      <span className="tok-punct">&gt;</span>
    </>,
    <>
      {'  '}
      <span className="tok-punct">&lt;</span>
      <span className="tok-tag">Lamborghini</span>
    </>,
    <>
      {'    '}
      <span className="tok-attr">model</span>
      <span className="tok-punct">=</span>
      <span className="tok-str">&quot;{model.id}&quot;</span>
    </>,
    <>
      {'    '}
      <span className="tok-attr">paint</span>
      <span className="tok-punct">=</span>
      <span className="tok-str">&quot;{paint}&quot;</span>
    </>,
    <>
      {'    '}
      <span className="tok-attr">view</span>
      <span className="tok-punct">=</span>
      <span className="tok-str">&quot;{view}&quot;</span>
    </>,
    <>
      {'    '}
      <span className="tok-attr">wireframe</span>
      <span className="tok-punct">=</span>
      <span className="tok-punct">{'{'}</span>
      {BOOL(settings.wireframe)}
      <span className="tok-punct">{'}'}</span>
    </>,
    <>
      {'    '}
      <span className="tok-attr">grid</span>
      <span className="tok-punct">=</span>
      <span className="tok-punct">{'{'}</span>
      {BOOL(settings.grid)}
      <span className="tok-punct">{'}'}</span>
    </>,
    <>
      {'    '}
      <span className="tok-attr">autoRotate</span>
      <span className="tok-punct">=</span>
      <span className="tok-punct">{'{'}</span>
      {BOOL(settings.autoRotate)}
      <span className="tok-punct">{'}'}</span>
    </>,
    <>
      {'  '}
      <span className="tok-punct">/&gt;</span>
    </>,
    <>
      <span className="tok-punct">&lt;/</span>
      <span className="tok-tag">Configurator</span>
      <span className="tok-punct">&gt;</span>
    </>,
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label">config.tsx</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 border border-line bg-sheet px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:border-ink hover:text-ink"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>

      <div className="border border-line bg-sheet">
        <div className="flex">
          <div className="select-none border-r border-line-2 bg-panel px-2 py-2.5 text-right font-mono text-[9px] leading-[1.85] text-ink-3">
            {lines.map((_, i) => (
              <div key={i}>{String(i + 1).padStart(2, '0')}</div>
            ))}
          </div>
          <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[10px] leading-[1.85] text-ink-2">
            <code>
              {lines.map((node, i) => (
                <div key={i}>{node}</div>
              ))}
            </code>
          </pre>
        </div>
      </div>

      <p className="mt-3 font-mono text-[9px] leading-[1.7] text-ink-3">
        Every value above is bound to live state — change the paint, the camera or a scene
        flag and this block rewrites itself.
      </p>
    </div>
  );
}
