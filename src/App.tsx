import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { ArrowUpRight, Hand } from 'lucide-react';
import { CarModel } from './components/CarModel';
import { CityScene } from './components/CityScene';
import { ShieldLogo } from './components/ShieldLogo';
import { AnimatedNumber } from './components/AnimatedNumber';
import { modelsData } from './data/models';
import { useReducedMotion } from './hooks/useReducedMotion';
import type { CameraView } from './types';

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];
const RAIL = 'w-full lg:w-[clamp(320px,30vw,520px)] lg:shrink-0';

const CAMERA_VIEWS: { id: CameraView; label: string }[] = [
  { id: 'front-3/4', label: 'FRONT' },
  { id: 'side', label: 'PROFILE' },
  { id: 'engine', label: 'REAR' },
  { id: 'interior', label: 'DETAILS' },
  { id: 'city', label: 'CITY DRIVE' },
];

const heroVariants = {
  hidden: {},
  show: { transition: { delayChildren: 0.06, staggerChildren: 0.07 } },
};

const rise = {
  hidden: { opacity: 0, y: 26, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};

const line = {
  hidden: { opacity: 0, scaleX: 0 },
  show: { opacity: 1, scaleX: 1, transition: { duration: 0.7, ease: EASE } },
};

const wordStagger = {
  hidden: {},
  show: { transition: { delayChildren: 0.12, staggerChildren: 0.035 } },
};

const letter = {
  hidden: { opacity: 0, y: '60%' },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

function Spec({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <motion.div
      variants={rise}
      className="group flex items-baseline justify-between gap-3 border-t border-white/10 py-2.5 transition-colors duration-500 hover:border-[var(--accent)]"
    >
      <span className="font-mono text-[9px] tracking-[0.28em] text-gray-500 uppercase">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-lg lg:text-xl text-white tabular-nums">
          <AnimatedNumber value={value} />
        </span>
        <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-gray-500 transition-colors duration-500 group-hover:text-[var(--accent)]">
          {unit}
        </span>
      </span>
    </motion.div>
  );
}

function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 1600;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(Math.round((1 - Math.pow(1 - t, 2)) * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
      else onDone();
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black"
      exit={{ opacity: 0, filter: 'blur(14px)', transition: { duration: 0.7, ease: EASE } }}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="text-[var(--accent)]"
      >
        <ShieldLogo animated className="w-16 h-[76px]" />
      </motion.div>

      <div className="flex flex-col items-center gap-3">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
          className="font-mono text-[11px] tracking-[0.42em] text-[var(--accent)] uppercase"
        >
          Automobili Lamborghini
        </motion.span>
        <span className="font-mono text-[9px] tracking-[0.28em] text-gray-600 uppercase">
          Initializing Configurator
        </span>
      </div>

      <div className="flex w-[220px] flex-col gap-2">
        <div className="h-px w-full bg-white/10">
          <motion.div
            className="h-px origin-left bg-[var(--accent)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-[8px] tracking-[0.3em] text-gray-600 uppercase tabular-nums">
          <span>Loading</span>
          <span>{String(progress).padStart(3, '0')}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [activeModel, setActiveModel] = useState(0);
  const [cameraView, setCameraView] = useState<CameraView>('front-3/4');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const reduced = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 55, damping: 18, mass: 0.6 });
  const parallaxY = useSpring(pointerY, { stiffness: 55, damping: 18, mass: 0.6 });

  const currentModel = modelsData[activeModel];
  const words = currentModel.name.split(' ');
  const pad = (n: number) => String(n).padStart(2, '0');
  const accentStyle = { '--accent': currentModel.accent } as CSSProperties;
  const isCity = cameraView === 'city';

  const handleLoaded = useCallback(() => setIsLoaded(true), []);

  const step = useCallback((delta: number) => {
    setActiveModel((prev) => (prev + delta + modelsData.length) % modelsData.length);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step]);

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    pointerX.set((event.clientX / window.innerWidth - 0.5) * 26);
    pointerY.set((event.clientY / window.innerHeight - 0.5) * 26);
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-lambo-dark text-white select-none"
      style={accentStyle}
      onPointerMove={onPointerMove}
    >
      <AnimatePresence>{!isLoaded && <Preloader onDone={handleLoaded} />}</AnimatePresence>

      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { x: parallaxX, y: parallaxY }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#050505] to-[#0d0d0d]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(var(--accent) 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          animate={reduced ? undefined : { x: [0, 70, -40, 0], y: [0, -90, 50, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full blur-[150px]"
          style={{
            backgroundColor: 'var(--accent)',
            opacity: 0.08,
            transition: 'background-color 700ms linear',
          }}
        />
        <motion.div
          animate={reduced ? undefined : { x: [0, -60, 80, 0], y: [0, 80, -70, 0] }}
          transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-16 w-[620px] h-[620px] rounded-full blur-[180px]"
          style={{
            backgroundColor: 'var(--accent)',
            opacity: isCity ? 0.02 : 0.06,
            transition: 'background-color 700ms linear, opacity 900ms linear',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.85) 100%)' }}
        />
      </motion.div>

      <div className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{ alpha: true }}
          camera={{ position: [5.6, 0.85, 4.2], fov: 38 }}
          onCreated={(state) => {
            state.gl.shadowMap.autoUpdate = false;
          }}
        >
          <Environment resolution={256} environmentIntensity={0.8}>
            <Lightformer intensity={2} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} color="#ffffff" />
            <Lightformer intensity={1.5} position={[-5, 1, -1]} rotation={[0, Math.PI / 2, 0]} scale={[8, 2, 1]} color="#ffffff" />
            <Lightformer intensity={1} position={[5, 1, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 2, 1]} color="#ffe9b0" />
            <Lightformer intensity={0.5} position={[0, 2, 5]} scale={[6, 3, 1]} color="#ffffff" />
          </Environment>
          <spotLight
            position={[0, 5, 0]}
            intensity={2}
            angle={Math.PI / 4}
            penumbra={0.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[5, 3, 5]} intensity={1.5} />
          <directionalLight position={[-5, 3, -5]} intensity={0.5} />
          <CityScene active={isCity} color={currentModel.accent} />
          <CarModel
            modelId={currentModel.id}
            color={currentModel.accent}
            cameraView={cameraView}
            onInteractionChange={setIsInteracting}
          />
          <ContactShadows
            key={currentModel.id}
            frames={120}
            resolution={512}
            scale={10}
            blur={2}
            opacity={isCity ? 0.3 : 0.55}
            far={10}
            position={[0, -0.01, 0]}
          />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[48%] bg-gradient-to-r from-black/55 via-black/15 to-transparent lg:block" />

      <motion.div
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-mono text-[8px] tracking-[0.3em] text-gray-600 uppercase lg:left-[58%] lg:flex"
        animate={reduced ? undefined : { opacity: [0.25, 0.7, 0.25] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Hand size={11} />
        Drag to orbit
      </motion.div>

      <div className="pointer-events-none relative z-10 flex h-full flex-col p-5 md:p-8">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="pointer-events-auto flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ShieldLogo className="w-6 h-8 text-[var(--accent)]" />
            <div className="hidden sm:flex flex-col">
              <span className="font-display text-[11px] tracking-[0.3em] text-white leading-tight">
                LAMBORGHINI
              </span>
              <span className="font-mono text-[8px] text-gray-500 tracking-[0.3em] uppercase">
                Configurator
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden md:block font-mono text-[9px] tracking-[0.35em] text-gray-500 uppercase">
             stantia Configuratio
            </span>
            <button className="group flex items-center gap-2 bg-[var(--accent)] hover:bg-white transition-colors duration-300 text-black font-mono text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 cursor-pointer">
              Configure Yours
              <ArrowUpRight
                size={13}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </motion.header>

        <div className="flex-1 min-h-0 flex items-start lg:items-center overflow-hidden">
          <motion.div
            className={`${RAIL} overflow-y-auto overflow-x-hidden scrollbar-none ${
              isInteracting ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
            animate={{ opacity: isInteracting ? 0 : 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentModel.id}
                variants={heroVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -18, transition: { duration: 0.3, ease: EASE } }}
              >
                <motion.div variants={rise} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tracking-[0.3em] font-bold text-[var(--accent)] tabular-nums">
                    {pad(activeModel + 1)}
                  </span>
                  <motion.span
                    variants={line}
                    className="h-px w-10 origin-left bg-[var(--accent)]/70"
                  />
                  <span className="font-mono text-[9px] tracking-[0.3em] text-gray-500 uppercase">
                    Automobili
                  </span>
                </motion.div>

                <h1 className="mt-4 font-display font-bold text-[clamp(1.9rem,7.5vw,3.1rem)] lg:text-[clamp(1.35rem,1.9vw,2.1rem)] leading-[0.98] tracking-tighter text-white">
                  {words.map((word, wi) => (
                    <span
                      key={`${currentModel.id}-${wi}`}
                      className="inline-block overflow-hidden pt-3 pb-1 -mt-3 align-bottom"
                    >
                      <motion.span
                        variants={wordStagger}
                        initial="hidden"
                        animate="show"
                        className="inline-block"
                      >
                        {word.split('').map((char, ci) => (
                          <motion.span
                            key={ci}
                            variants={letter}
                            className="inline-block will-change-transform"
                          >
                            {char}
                          </motion.span>
                        ))}
                      </motion.span>
                      {wi < words.length - 1 ? '\u00A0' : null}
                    </span>
                  ))}
                </h1>

                <motion.h2
                  variants={rise}
                  className="mt-2 font-display font-bold text-outline text-base lg:text-xl tracking-tight"
                >
                  {currentModel.variant}
                </motion.h2>

                <motion.p
                  variants={rise}
                  className="mt-4 max-w-sm text-xs text-gray-400 leading-relaxed font-light"
                >
                  {currentModel.description}
                </motion.p>

                <motion.div variants={rise} className="mt-6 max-w-sm">
                  <Spec label="Power" value={currentModel.hp} unit="Combustion + Electric" />
                  <Spec label="0-100 km/h" value={currentModel.acceleration} unit="Instant Torque" />
                  <Spec label="Max Speed" value={currentModel.topSpeed} unit="Electronic Limiter" />
                </motion.div>

                <motion.div variants={rise} className="mt-6 flex flex-col gap-2.5">
                  <span className="font-mono text-[9px] tracking-[0.3em] text-gray-500 uppercase">
                    Select Model
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {modelsData.map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => setActiveModel(i)}
                        aria-pressed={i === activeModel}
                        className={`relative cursor-pointer border px-3 py-2 font-mono text-[9px] tracking-[0.14em] uppercase transition-colors duration-300 ${
                          i === activeModel
                            ? 'border-transparent text-black'
                            : 'border-white/15 bg-black/30 text-gray-400 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {i === activeModel && (
                          <motion.span
                            layoutId="model-active"
                            className="absolute inset-0"
                            style={{ backgroundColor: currentModel.accent }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span className="relative">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={rise} className="mt-4 flex flex-col gap-2.5">
                  <span className="font-mono text-[9px] tracking-[0.3em] text-gray-500 uppercase">
                    Camera
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CAMERA_VIEWS.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setCameraView(v.id)}
                        aria-pressed={cameraView === v.id}
                        className={`relative cursor-pointer border px-3 py-2 font-mono text-[9px] tracking-[0.14em] uppercase transition-colors duration-300 ${
                          cameraView === v.id
                            ? 'border-white text-black'
                            : 'border-white/15 bg-black/30 text-gray-400 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {cameraView === v.id && (
                          <motion.span
                            layoutId="camera-active"
                            className="absolute inset-0 bg-white"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span className="relative">{v.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                <motion.p
                  variants={rise}
                  className="mt-5 font-mono text-[8px] tracking-[0.25em] text-gray-700 uppercase"
                >
                  ← → keys to switch model
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {currentModel.name} selected, {currentModel.hp}, 0 to 100 in {currentModel.acceleration}, top
        speed {currentModel.topSpeed}
      </p>
    </div>
  );
}