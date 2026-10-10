import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 320;
const RADIUS = 16;
const HEIGHT = 11;

export function Atmosphere({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, drifts } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const drifts = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const radius = 3.5 + Math.pow(Math.random(), 0.6) * RADIUS;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * HEIGHT - 1.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      drifts[i] = 0.12 + Math.random() * 0.5;
    }

    return { positions, drifts };
  }, []);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const attribute = points.geometry.attributes.position as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const index = i * 3 + 1;
      array[index] += drifts[i] * delta;
      if (array[index] > HEIGHT - 1.5) array[index] = -1.5;
    }
    attribute.needsUpdate = true;

    points.rotation.y = state.clock.elapsedTime * 0.018;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={color}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}