import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Menu, X, ArrowUpRight } from 'lucide-react';
import { CarModel } from './components/ProceduralCar';
import { BrandModel, CameraView } from './types';

const modelsData: BrandModel[] = [
  { id: "aventador", name: "AVENTADOR SVJ", hp: "770 CV", zeroToSixty: "2.9s", topSpeed: "350 km/h", modelUrl: "/models/aventador.glb" },
  { id: "huracan", name: "HURACÁN GT", hp: "640 CV", zeroToSixty: "3.0s", topSpeed: "310 km/h", modelUrl: "/models/huracan.glb" },
  { id: "gallardo", name: "GALLARDO SPYDER", hp: "560 CV", zeroToSixty: "3.7s", topSpeed: "325 km/h", modelUrl: "/models/gallardo.glb" },
  { id: "urus", name: "URUS SUPER SUV", hp: "650 CV", zeroToSixty: "3.6s", topSpeed: "305 km/h", modelUrl: "/models/urus.glb" }
];


// Animation variants requested in specification
const uiFadeIn = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] as const } }
};

const statsStagger = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.5 } }
};

export default function App() {
  const [activeModel, setActiveModel] = useState<number>(0);
  const [cameraView, setCameraView] = useState<CameraView>('front-3/4');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeMenuTab, setActiveMenuTab] = useState<string>('Models');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  // Trigger app entry animation shortly after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const currentModel = modelsData[activeModel];

  // Cycles through models sequentially
  const handleNextModel = () => {
    setActiveModel((prev) => (prev + 1) % modelsData.length);
  };

  const handlePrevModel = () => {
    setActiveModel((prev) => (prev - 1 + modelsData.length) % modelsData.length);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-lambo-dark text-white select-none">
      {/* INITIAL STARTUP SCREEN */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="preloader"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
            exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } }}
          >
            <div className="flex flex-col items-center gap-6">
              {/* Premium Inline Gold Metallic Shield */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="w-16 h-20"
              >
                <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
                  <path d="M50 5 L90 25 L90 80 L50 115 L10 80 L10 25 Z" stroke="#FFB300" strokeWidth="4" fill="#050505" />
                  <path d="M50 11 L84 28 L84 77 L50 107 L16 77 L16 28 Z" fill="#0A0A0A" />
                  <path d="M50 35 L48 45 L40 50 L38 55 L45 53 L50 63 L55 53 L62 55 L60 50 L52 45 Z" fill="#FFB300" />
                  <path d="M35 30 Q41 35 47 41 M65 30 Q59 35 53 41" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </motion.div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[12px] font-mono tracking-[0.4em] text-lambo-yellow uppercase">
                  AUTOMOBILI LAMBORGHINI
                </span>
                <span className="text-[9px] font-mono tracking-[0.2em] text-gray-500 uppercase">
                  INITIALIZING CONFIGURATOR ENGINE
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: 3D CANVAS UNDERLAY CONTAINER */}
      <div 
        id="canvas-container"
        className="absolute inset-0 w-full h-screen z-0 bg-gradient-to-b from-[#020202] via-[#050505] to-[#0d0d0d] overflow-hidden"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Dynamic Ambient Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Technical dot grid */}
          <div 
            className="absolute inset-0 opacity-[0.08]" 
            style={{
              backgroundImage: 'radial-gradient(#FFB300 1.5px, transparent 1.5px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Slow moving ambient glowing light sources */}
          <motion.div
            animate={{
              x: [0, 80, -40, 0],
              y: [0, -100, 60, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-10 -left-10 w-[500px] h-[500px] rounded-full bg-lambo-yellow/[0.04] blur-[150px]"
          />
          <motion.div
            animate={{
              x: [0, -60, 90, 0],
              y: [0, 80, -80, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full bg-lambo-yellow/[0.03] blur-[180px]"
          />
          {/* Center halo backdrop glow behind the car */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] rounded-full opacity-[0.05]"
            style={{
              background: 'radial-gradient(circle, #FFB300 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>
        <Canvas shadows camera={{ position: [4.5, 1.8, 5.5], fov: 42 }}>
          {/* Studio-calibre environmental reflections */}
          <Environment preset="studio" environmentIntensity={0.8} />

          {/* Key overhead spotlight defining the metallic paint highlights */}
          <spotLight
            position={[0, 5, 0]}
            intensity={2}
            color="#ffffff"
            angle={Math.PI / 4}
            penumbra={0.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* Directional auxiliary lighting */}
          <directionalLight position={[5, 3, 5]} intensity={1.5} />
          <directionalLight position={[-5, 3, -5]} intensity={0.5} />

          {/* Underlay Car Model Geometry */}
          <CarModel
            modelId={currentModel.id}
            color="#FFB300"
            cameraView={cameraView}
            scale={currentModel.scale}
            position={currentModel.position}
            onInteractionChange={setIsInteracting}
          />

          {/* Realistic soft ground shadows */}
          <ContactShadows
            resolution={1024}
            scale={10}
            blur={2}
            opacity={0.55}
            far={10}
            color="#000000"
            position={[0, -0.01, 0]}
          />
        </Canvas>
      </div>

      {/* SECTION 2: GRAPHICAL USER INTERFACE OVERLAY */}
      <div className="absolute inset-0 w-full h-screen flex flex-col pointer-events-none z-10 p-6 md:p-12">

        {/* 2A. AUTOMOBILI HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -25 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: -25 }}
          transition={{ duration: 1.0, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
          className="w-full flex justify-between items-start pointer-events-none"
        >
          {/* Left Side: Solid Metallic Brand Shield */}
          <div className="flex items-center gap-3 cursor-pointer pointer-events-auto">
            <svg viewBox="0 0 100 120" className="w-8 h-10 fill-[#FFB300]" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5 L90 25 L90 80 L50 115 L10 80 L10 25 Z" stroke="#FFB300" strokeWidth="4" fill="#050505" />
              <path d="M50 11 L84 28 L84 77 L50 107 L16 77 L16 28 Z" fill="#050505" />
              <path d="M50 35 L48 45 L40 50 L38 55 L45 53 L50 63 L55 53 L62 55 L60 50 L52 45 Z" fill="#FFB300" />
              <path d="M35 30 Q41 35 47 41 M65 30 Q59 35 53 41" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-display text-[10px] tracking-widest text-white leading-tight">LAMBORGHINI</span>
              <span className="font-mono text-[8px] text-gray-500 tracking-[0.3em] uppercase">STANTIA CONFIGURATIO</span>
            </div>
          </div>

          {/* Right Side: Horizontal Navigation Menu */}
          <nav className="hidden lg:flex gap-8 text-[11px] font-mono tracking-[0.2em] uppercase pt-2 pointer-events-auto">
            <button
              onClick={() => setActiveMenuTab('Models')}
              className="transition-colors duration-300 relative py-1 cursor-pointer text-lambo-yellow font-bold"
            >
              Models
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-lambo-yellow"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            </button>
          </nav>

          {/* Responsive Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-lambo-yellow cursor-pointer pointer-events-auto"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </motion.header>

        {/* MOBILE NAVIGATION EXPANDED SLIDE-DOWN */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute left-6 right-6 top-24 bg-black/95 border border-gray-800 p-6 pointer-events-auto flex flex-col gap-4 z-40"
            >
              <div className="text-[9px] font-mono tracking-widest text-gray-600 mb-1">NAV NAVIGATION</div>
              <button
                onClick={() => {
                  setActiveMenuTab('Models');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left font-mono py-2 text-[11px] tracking-[0.15em] uppercase flex justify-between items-center text-white"
              >
                <span className="text-lambo-yellow">Models</span>
                <ArrowUpRight size={12} className="text-gray-700" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODEL COMPENDIUM SUB-MENU OVERLAY */}
        {activeMenuTab === 'Models' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: isInteracting ? 0 : 1,
              y: 0,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ pointerEvents: 'none' }}
            className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-4 bg-black/85 border border-gray-800/80 px-6 py-3"
          >
            <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase mr-2 pointer-events-none">SERIES:</span>
            {modelsData.map((m, index) => (
              <button
                key={m.id}
                onClick={() => setActiveModel(index)}
                style={{ pointerEvents: isInteracting ? 'none' : 'auto' }}
                className={`text-[10px] font-mono tracking-[0.1em] px-3 py-1 cursor-pointer pointer-events-auto transition-colors ${activeModel === index
                    ? 'bg-lambo-yellow text-black font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {m.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* 2B. MAIN MODEL DISPLAY TYPOGRAPHY (Left aligned, vertically centered) */}
        <motion.div
          animate={{ opacity: isInteracting ? 0 : 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ pointerEvents: 'none' }}
          className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModel.id}
              variants={uiFadeIn}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, x: 30, transition: { duration: 0.4 } }}
              className="flex flex-col items-start select-none"
            >
              {/* Fine print metadata */}
              <span className="text-[10px] font-mono tracking-[0.3em] text-gray-400 mb-4 uppercase">
                AUTOMOBILI LAMBORGHINI
              </span>

              {/* Huge aggressive heading with drop-shadow and arrow cycling controls */}
              <div className="relative group/title flex items-center">
                {/* Previous model action zone */}
                <button
                  onClick={handlePrevModel}
                  style={{ pointerEvents: isInteracting ? 'none' : 'auto' }}
                  className="absolute -left-12 opacity-0 group-hover/title:opacity-100 group-hover/title:-left-10 transition-all duration-300 pointer-events-auto p-2 bg-black/40 hover:bg-lambo-yellow hover:text-black border border-gray-800 hover:border-lambo-yellow text-white flex items-center justify-center cursor-pointer"
                  title="PREVIOUS MODEL"
                >
                  <ChevronLeft size={16} />
                </button>

                <h1 className="text-[3.6rem] sm:text-[5rem] md:text-[6.8rem] lg:text-[7.6rem] font-display font-bold leading-none tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                  {currentModel.name}
                </h1>

                {/* Next model action zone */}
                <button
                  onClick={handleNextModel}
                  style={{ pointerEvents: isInteracting ? 'none' : 'auto' }}
                  className="absolute -right-12 opacity-0 group-hover/title:opacity-100 group-hover/title:-right-10 transition-all duration-300 pointer-events-auto p-2 bg-black/40 hover:bg-lambo-yellow hover:text-black border border-gray-800 hover:border-lambo-yellow text-white flex items-center justify-center cursor-pointer"
                  title="NEXT MODEL"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Linear outline secondary typography background */}
              <h2 className="text-[2.2rem] sm:text-[3rem] md:text-[4.5rem] font-display font-bold tracking-tight text-outline pointer-events-none mt-1">
                {currentModel.id === 'aventador'
                  ? 'SVJ 63 ROADSTER'
                  : currentModel.id === 'huracan'
                    ? 'LB SILHOUETTE GT'
                    : currentModel.id === 'gallardo'
                      ? 'LP 560-4 SPYDER'
                      : 'URUS PERFORMANCE'}
              </h2>

              {/* Brief engineering description */}
              <p className="max-w-md text-left font-sans text-xs text-gray-400 mt-4 leading-relaxed font-light hidden sm:block">
                {currentModel.id === 'aventador'
                  ? 'Combining groundbreaking aerodynamics, active systems, exceptional track presence, and the raw heart of natural aspiration.'
                  : currentModel.id === 'huracan'
                    ? 'A super sports car inspired by the racing heritage of Lamborghini Squadra Corse. Maximum aerodynamics and racing sensations.'
                    : 'id' in currentModel && currentModel.id === 'gallardo'
                      ? 'A gorgeous open-top spyder featuring a powerful naturally aspirated V10 and a timeless, sharp Italian design.'
                      : 'The ultimate super sports utility vehicle, blending the soul of a supercar with the functionality of an SUV.'
                }
              </p>

              {/* Quick interactive indicators informing active cycling model */}
              <div className="flex gap-2.5 mt-8 pointer-events-none">
                {modelsData.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveModel(idx)}
                    style={{ pointerEvents: isInteracting ? 'none' : 'auto' }}
                    className={`h-1 cursor-pointer pointer-events-auto transition-all duration-500 ${activeModel === idx ? 'w-12 bg-lambo-yellow' : 'w-4 bg-gray-700 hover:bg-gray-400'
                      }`}
                    aria-label={`Select model ${modelsData[idx].name}`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 2C. PERFORMANCE STATS BLOCK (Bottom Left) */}
        <motion.div
          animate={{ opacity: isInteracting ? 0 : 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ pointerEvents: 'none' }}
          className="absolute bottom-6 md:bottom-12 left-6 md:left-12 z-10 pointer-events-none"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModel.id}
              variants={statsStagger}
              initial="initial"
              animate="animate"
              className="pointer-events-auto flex flex-row flex-wrap md:flex-nowrap gap-8 md:gap-14 bg-black/25 backdrop-blur-sm p-4 md:p-6 border-l border-white/20"
            >
              {/* Stat Block: HP */}
              <motion.div variants={uiFadeIn} className="flex flex-col items-start min-w-[100px]">
                <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase mb-1">
                  POWER
                </span>
                <span className="text-[20px] md:text-[25px] font-display font-medium text-white tracking-tight">
                  {currentModel.hp}
                </span>
                <span className="text-[8px] font-mono text-lambo-yellow/70 tracking-wider">COMBUSTION + ELECTRIC</span>
              </motion.div>

              {/* Dividing Line decor */}
              <div className="hidden md:block w-px h-10 bg-gray-800 self-center" />

              {/* Stat Block: 0-100 KM/H */}
              <motion.div variants={uiFadeIn} className="flex flex-col items-start min-w-[100px]">
                <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase mb-1">
                  0-100 KM/H
                </span>
                <span className="text-[20px] md:text-[25px] font-display font-medium text-white tracking-tight">
                  {currentModel.zeroToSixty}
                </span>
                <span className="text-[8px] font-mono text-lambo-yellow/70 tracking-wider font-light">INSTANT TORQUE DELIV</span>
              </motion.div>

              {/* Dividing Line decor */}
              <div className="hidden md:block w-px h-10 bg-gray-800 self-center" />

              {/* Stat Block: SPEED */}
              <motion.div variants={uiFadeIn} className="flex flex-col items-start min-w-[100px]">
                <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase mb-1">
                  MAX SPEED
                </span>
                <span className="text-[20px] md:text-[25px] font-display font-medium text-white tracking-tight">
                  &gt;{currentModel.topSpeed}
                </span>
                <span className="text-[8px] font-mono text-lambo-yellow/70 tracking-wider">ELECTRONIC LIMITER</span>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 2D. CUSTOMIZER CONTROLS (Bottom Right) */}
        <motion.section
          animate={{ opacity: isInteracting ? 0 : 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ pointerEvents: 'none' }}
          className="absolute bottom-6 md:bottom-12 right-6 md:right-12 pointer-events-none flex flex-col items-end gap-6 md:gap-7 z-25"
        >

          {/* CAMERA VIEW CONTROL CORES */}
          <div className="flex flex-col items-end gap-2.5">
            <span className="text-[8px] font-mono text-gray-500 tracking-[0.3em] uppercase mb-1">
              CAMERA PERSPECTIVE
            </span>
            <div className="flex flex-wrap justify-end gap-2 max-w-xs md:max-w-none">
              {(['front-3/4', 'side', 'engine', 'interior'] as CameraView[]).map((view) => {
                const label = view === 'front-3/4' ? 'FRONT' : view === 'side' ? 'PROFILE' : view === 'engine' ? 'BACK VIEW' : 'DETAILS';
                const isActive = cameraView === view;
                return (
                  <button
                    key={view}
                    onClick={() => setCameraView(view)}
                    style={{ pointerEvents: isInteracting ? 'none' : 'auto' }}
                    className={`rounded-full border backdrop-blur-md px-4 py-2 text-[9px] font-mono uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer pointer-events-auto ${isActive
                        ? 'bg-white text-black border-white font-semibold shadow-lg shadow-white/10'
                        : 'border-gray-800 bg-black/40 text-gray-400 hover:text-white hover:border-gray-500'
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>



        </motion.section>

      </div>
    </div>
  );
}
