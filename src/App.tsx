import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import AOS from 'aos';
import { X } from 'lucide-react';
import { useProgress } from '@react-three/drei';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Viewport } from './components/Viewport';
import { Inspector } from './components/Inspector';
import { StatusBar } from './components/StatusBar';
import { Preloader } from './components/Preloader';
import { modelsData } from './data/models';
import { accentInk, accentWash } from './lib/color';
import { useReducedMotion } from './hooks/useReducedMotion';
import type { CameraView, RenderStats, SceneSettings } from './types';

export default function App() {
  const reduced = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [paint, setPaint] = useState(modelsData[0].accent);
  const [view, setView] = useState<CameraView>('front-3/4');
  const [settings, setSettings] = useState<SceneSettings>({
    wireframe: false,
    grid: true,
    shadows: true,
    autoRotate: true,
  });
  const [tab, setTab] = useState<'properties' | 'code'>('properties');
  const [drawer, setDrawer] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [exported, setExported] = useState(false);

  const statsRef = useRef<RenderStats>({ fps: 0, tris: 0, calls: 0, dpr: 1 });
  const model = modelsData[index];

  /* ── Asset readiness ─────────────────────────────────────────── */
  const { active } = useProgress();
  const [started, setStarted] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    if (active) setStarted(true);
  }, [active]);

  useEffect(() => {
    // If nothing is loading (warm cache), stop waiting almost immediately.
    const a = window.setTimeout(() => setStarted(true), 2200);
    const b = window.setTimeout(() => setForceReady(true), 12000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  const ready = forceReady || (started && !active);

  /* ── AOS ─────────────────────────────────────────────────────── */
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: 'ease-out-quart',
      once: true,
      offset: 0,
      disable: reduced,
      disableMutationObserver: true,
    });
    AOS.refreshHard();

    const raf = requestAnimationFrame(() => AOS.refreshHard());

    // Pin anything AOS has already revealed: AOS re-evaluates positions on
    // scroll/resize and can strip the class again, which would blank out rows
    // that have already been seen.
    const lock = window.setInterval(() => {
      document
        .querySelectorAll('[data-aos].aos-animate:not([data-aos-locked])')
        .forEach((el) => el.setAttribute('data-aos-locked', ''));
    }, 400);
    // Failsafe: if anything prevented AOS from revealing an element, never
    // leave content permanently invisible.
    const safety = window.setTimeout(() => {
      document
        .querySelectorAll('[data-aos]:not(.aos-animate)')
        .forEach((el) => el.classList.add('aos-animate'));
    }, 3000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      window.clearInterval(lock);
    };
  }, [reduced]);

  /* ── State transitions ───────────────────────────────────────── */
  useEffect(() => {
    setPaint(modelsData[index].accent);
  }, [index]);

  const step = useCallback((delta: number) => {
    setIndex((prev) => (prev + delta + modelsData.length) % modelsData.length);
  }, []);

  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const toggle = useCallback((key: keyof SceneSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleGeometryStats = useCallback((tris: number, calls: number) => {
    statsRef.current.tris = tris;
    statsRef.current.calls = calls;
  }, []);

  const exportConfig = useCallback(() => {
    const payload = {
      schema: 'kotsebroom/config@1',
      model: model.id,
      paint,
      view,
      ...settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kotsebroom-${model.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 1800);
  }, [model.id, paint, view, settings]);

  /* ── Keyboard ────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key) {
        case 'ArrowRight':
          next();
          break;
        case 'ArrowLeft':
          prev();
          break;
        case '1':
          setView('front-3/4');
          break;
        case '2':
          setView('side');
          break;
        case '3':
          setView('engine');
          break;
        case '4':
          setView('interior');
          break;
        case 'w':
        case 'W':
          toggle('wireframe');
          break;
        case 'g':
        case 'G':
          toggle('grid');
          break;
        case 'r':
        case 'R':
          toggle('autoRotate');
          break;
        case 'Escape':
          setDrawer(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, toggle]);

  const themeVars = useMemo(
    () =>
      ({
        '--accent': paint,
        '--accent-ink': accentInk(paint),
        '--accent-wash': accentWash(paint),
      }) as CSSProperties,
    [paint],
  );

  return (
    <div
      className="relative flex h-[100svh] flex-col overflow-hidden bg-paper text-ink"
      style={themeVars}
    >
      {!loaded ? (
        <Preloader
          ready={ready}
          file={model.file}
          size={model.size}
          reduced={reduced}
          onDone={() => setLoaded(true)}
        />
      ) : null}

      <Header onMenu={() => setDrawer(true)} onExport={exportConfig} exported={exported} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <aside className="hidden w-[226px] shrink-0 border-r border-line lg:block">
          <Sidebar
            activeIndex={index}
            onSelect={setIndex}
            settings={settings}
            onToggle={toggle}
            reduced={reduced}
          />
        </aside>

        <Viewport
          model={model}
          index={index}
          total={modelsData.length}
          paint={paint}
          view={view}
          onView={setView}
          onPrev={prev}
          onNext={next}
          settings={settings}
          statsRef={statsRef}
          onInteractionChange={setInteracting}
          onGeometryStats={handleGeometryStats}
          interacting={interacting}
          reduced={reduced}
        />

        <aside className="shrink-0 border-t border-line lg:w-[310px] lg:border-l lg:border-t-0">
          <Inspector
            model={model}
            paint={paint}
            onPaint={setPaint}
            view={view}
            onView={setView}
            settings={settings}
            onToggle={toggle}
            tab={tab}
            onTab={setTab}
            statsRef={statsRef}
            reduced={reduced}
          />
        </aside>
      </div>

      <StatusBar statsRef={statsRef} />

      {drawer ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Examples">
          <button
            type="button"
            aria-label="Close examples panel"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-ink/20"
          />
          <div
            className="absolute inset-y-0 left-0 w-[270px] border-r border-line bg-panel"
            style={{ animation: 'drawer-in 340ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            <Sidebar
              activeIndex={index}
              onSelect={setIndex}
              settings={settings}
              onToggle={toggle}
              reduced={reduced}
              onNavigate={() => setDrawer(false)}
            />
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Close"
              className="absolute right-2 top-3 flex h-7 w-7 items-center justify-center border border-line bg-sheet text-ink-2"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {model.name} — {model.power} {model.powerUnit}, 0 to 100 in {model.accel} seconds, top speed{' '}
        {model.vmax} km/h. Paint {paint}. Camera {view}.
      </p>
    </div>
  );
}
