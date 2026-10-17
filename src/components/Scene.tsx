import { useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { CarModel } from './CarModel';
import { StageDecor } from './StageDecor';
import type { BrandModel, CameraView, RenderStats, SceneSettings } from '../types';

function StatsProbe({ statsRef }: { statsRef: RefObject<RenderStats> }) {
  const acc = useRef({ frames: 0, last: performance.now() });

  useFrame(({ gl }) => {
    const a = acc.current;
    a.frames += 1;
    const now = performance.now();
    const elapsed = now - a.last;
    if (elapsed < 480) return;

    statsRef.current.fps = Math.round((a.frames * 1000) / elapsed);
    statsRef.current.dpr = gl.getPixelRatio();
    a.frames = 0;
    a.last = now;
  });

  return null;
}

interface SceneProps {
  model: BrandModel;
  paint: string;
  view: CameraView;
  settings: SceneSettings;
  statsRef: RefObject<RenderStats>;
  onInteractionChange: (isInteracting: boolean) => void;
  onGeometryStats: (tris: number, calls: number) => void;
}

export function Scene({
  model,
  paint,
  view,
  settings,
  statsRef,
  onInteractionChange,
  onGeometryStats,
}: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [6.15, 0.98, 4.62], fov: 38, near: 0.1, far: 140 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4.5, 6.5, 3.5]} intensity={1.45} />
      <directionalLight position={[-5, 3, -4]} intensity={0.4} />

      <Environment resolution={256} frames={1} environmentIntensity={1.08}>
        <Lightformer
          intensity={1.9}
          position={[0, 6, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 14, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.15}
          position={[-6, 2.4, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[10, 5, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={0.8}
          position={[6, 2.4, -2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[10, 5, 1]}
          color="#fff4e2"
        />
        <Lightformer intensity={0.55} position={[0, 2.5, 7]} scale={[9, 5, 1]} color="#ffffff" />
      </Environment>

      <StageDecor visible={settings.grid} />

      <CarModel
        modelId={model.id}
        paint={paint}
        paintMaterial={model.paintMaterial}
        paintRoughness={model.paintRoughness}
        paintMetalness={model.paintMetalness}
        view={view}
        wireframe={settings.wireframe}
        autoRotate={settings.autoRotate}
        onInteractionChange={onInteractionChange}
        onGeometryStats={onGeometryStats}
      />

      {settings.shadows ? (
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.36}
          scale={14}
          blur={2.6}
          far={5}
          resolution={512}
          color="#4a4a3f"
          frames={Infinity}
        />
      ) : null}

      <StatsProbe statsRef={statsRef} />
    </Canvas>
  );
}
