import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { CarModel } from './components/CarModel';
import { ShieldLogo } from './components/ShieldLogo';
import { modelsData } from './data/models';
import type { CameraView } from './types';

const EASE = [0.25, 1, 0.5, 1] as const;

const CAMERA_VIEWS: { id: CameraView; label: string }[] = [
  { id: 'front-3/4', label: 'FRONT' },
  { id: 'side', label: 'PROFILE' },
  { id: 'engine', label: 'REAR' },
  { id: 'interior', label: 'DETAILS' },
];

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col items-start min-w-[96px]">
      <span className="font-mono text-[9px] tracking-[0.25em] text-gray-500 uppercase mb-1.5">{label}</span>
      <span className="font-display text-xl md:text-2xl font-medium text-white tracking-tight">{value}</span>
      <span className="font-mono text-[8px] tracking-[0.2em] text-lambo-yellow/70 mt-1">{sub}</span>
    </div>
  );
}

export default function App() {
  const [activeModel, setActiveModel] = useState(0);
  const [cameraView, setCameraView] = useState<CameraView>('front-3/4');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const currentModel = modelsData[activeModel];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative w-full h-screen overflow-hidden bg-lambo-dark text-white select-none">
      {/* PRELOADER */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="preloader"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <ShieldLogo className="w-14 h-[70px]" />
            </motion.div>
            <div className="flex flex-col items-center gap-2 mt-6">
              <span className="font-mono text-[11px] tracking-[0.4em] text-lambo-yellow uppercase">
                Automobili Lamborghini
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-gray-500 uppercase">
                Initializing Configurator
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D SCENE */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#050505] to-[#0d0d0d]">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(#FFB300 1.5px, transparent 1.5px)',
              backgroundSize: '40px 40px',
            }}
          />
          <motion.div
            animate={{ x: [0, 80, -40, 0], y: [0, -100, 60, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-10 -left-10 w-[500px] h-[500px] rounded-full bg-lambo-yellow/[0.04] blur-[150px]"
          />
          <motion.div
            animate={{ x: [0, -60, 90, 0], y: [0, 80, -80, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full bg-lambo-yellow/[0.03] blur-[180px]"
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] rounded-full opacity-[0.05]"
            style={{
              background: 'radial-gradient(circle, #FFB300 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [4.5, 1.6, 5.2], fov: 42 }}
          onCreated={(state) => {
            state.gl.shadowMap.autoUpdate = false;
            (window as any).__r3f = state;
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
          <CarModel
            modelId={currentModel.id}
            color="#FFB300"
            cameraView={cameraView}
            onInteractionChange={setIsInteracting}
          />
          <ContactShadows
            key={currentModel.id}
            frames={120}
            resolution={512}
            scale={10}
            blur={2}
            opacity={0.55}
            far={10}
            position={[0, -0.01, 0]}
          />
        </Canvas>
      </div>

      {/* UI OVERLAY */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none p-6 md:p-10">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="flex items-center justify-between pointer-events-none"
        >
          <div className="flex items-center gap-3 pointer-events-auto cursor-pointer">
            <ShieldLogo className="w-6 h-8" />
            <div className="hidden sm:flex flex-col">
              <span className="font-display text-[11px] tracking-[0.3em] text-white leading-tight">LAMBORGHINI</span>
              <span className="font-mono text-[8px] text-gray-500 tracking-[0.3em] uppercase">Configurator</span>
            </div>
          </div>
          <div className="flex items-center gap-5 pointer-events-auto">
            <span className="hidden md:block font-mono text-[9px] tracking-[0.35em] text-gray-500 uppercase">
              Stantia Configuratio
            </span>
            <button className="group flex items-center gap-2 bg-lambo-yellow hover:bg-white transition-colors duration-300 text-black font-mono text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 cursor-pointer">
              Configure Yours
              <ArrowUpRight
                size={13}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </motion.header>

        {/* HERO */}
        <div className="flex-1 flex items-center min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModel.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: isInteracting ? 0 : 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[11px] tracking-[0.3em] text-lambo-yellow font-bold">
                  {pad(activeModel + 1)}
                </span>
                <span className="h-px w-12 bg-lambo-yellow/60" />
                <span className="font-mono text-[10px] tracking-[0.3em] text-gray-500 uppercase">
                  Automobili Lamborghini
                </span>
              </div>
              <h1 className="font-display font-bold text-[13vw] sm:text-7xl lg:text-8xl leading-[0.95] tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                {currentModel.name}
              </h1>
              <h2 className="font-display font-bold text-outline text-xl sm:text-3xl lg:text-4xl tracking-tight mt-3">
                {currentModel.variant}
              </h2>
              <p className="max-w-md text-xs md:text-sm text-gray-400 mt-5 leading-relaxed font-light hidden sm:block">
                {currentModel.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <motion.footer
          animate={{ opacity: isInteracting ? 0 : 1 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-5"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModel.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="pointer-events-auto flex flex-wrap items-start gap-6 md:gap-8 bg-black/30 backdrop-blur-md border border-white/10 px-5 py-4"
            >
              <Stat label="Power" value={currentModel.hp} sub="Combustion + Electric" />
              <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
              <Stat label="0-100 km/h" value={currentModel.acceleration} sub="Instant Torque" />
              <div className="w-px h-10 bg-white/10 self-center hidden sm:block" />
              <Stat label="Max Speed" value={`>${currentModel.topSpeed}`} sub="Electronic Limiter" />
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {/* MODEL SELECTOR */}
            <div className="pointer-events-auto flex flex-col gap-2.5">
              <span className="font-mono text-[9px] tracking-[0.3em] text-gray-500 uppercase">Select Model</span>
              <div className="flex flex-wrap gap-1.5">
                {modelsData.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModel(i)}
                    className={`font-mono text-[10px] tracking-[0.12em] px-3.5 py-2 border transition-all duration-300 cursor-pointer ${
                      i === activeModel
                        ? 'bg-lambo-yellow text-black border-lambo-yellow font-bold'
                        : 'border-white/15 bg-black/30 text-gray-400 hover:text-white hover:border-white/40'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* CAMERA VIEWS */}
            <div className="pointer-events-auto flex flex-col gap-2.5">
              <span className="font-mono text-[9px] tracking-[0.3em] text-gray-500 uppercase">Camera</span>
              <div className="flex flex-wrap gap-1.5">
                {CAMERA_VIEWS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setCameraView(v.id)}
                    className={`font-mono text-[10px] tracking-[0.12em] px-3.5 py-2 border transition-all duration-300 cursor-pointer ${
                      cameraView === v.id
                        ? 'bg-white text-black border-white font-bold'
                        : 'border-white/15 bg-black/30 text-gray-400 hover:text-white hover:border-white/40'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.footer>
      </div>

      {/* EDGE NAVIGATION ARROWS */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={isLoaded ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
        onClick={() => setActiveModel((p) => (p - 1 + modelsData.length) % modelsData.length)}
        aria-label="Previous model"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-auto p-3 border border-white/15 bg-black/30 backdrop-blur-md text-gray-400 hover:text-lambo-yellow hover:border-lambo-yellow/60 transition-colors cursor-pointer"
      >
        <ChevronLeft size={18} />
      </motion.button>
      <motion.button
        initial={{ opacity: 0 }}
        animate={isLoaded ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
        onClick={() => setActiveModel((p) => (p + 1) % modelsData.length)}
        aria-label="Next model"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 pointer-events-auto p-3 border border-white/15 bg-black/30 backdrop-blur-md text-gray-400 hover:text-lambo-yellow hover:border-lambo-yellow/60 transition-colors cursor-pointer"
      >
        <ChevronRight size={18} />
      </motion.button>
    </div>
  );
}
