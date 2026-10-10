import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

const SEGMENTS = 6;
const SEGMENT_LENGTH = 44;
const ROAD_HALF = 5;
const CURB_OUTER = 5.7;
const WALK_OUTER = 8.2;
const BUILDING_LINE = 9;
const DRIVE_SPEED = 21;
const FOG_COLOR = 0x06070a;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paint(geometry: THREE.BufferGeometry, hex: number) {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color(hex);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function box(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  hex: number,
) {
  return paint(new THREE.BoxGeometry(width, height, depth).translate(x, y, z), hex);
}

interface CitySceneProps {
  active: boolean;
  color: string;
}

export function CityScene({ active, color }: CitySceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useRef(0);
  const fade = useRef(0);
  const accent = useRef(new THREE.Color(color));
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    accent.current.set(color);
  }, [color]);

  const { structure, glow, owned } = useMemo(() => {
    const solid: THREE.BufferGeometry[] = [];
    const lit: THREE.BufferGeometry[] = [];
    const rand = mulberry32(20260416);
    const tones = [0x11151d, 0x161a24, 0x0e1219, 0x1b2029, 0x121722];
    const lamps = [0xffd9a0, 0xffc46b, 0xfff0d0, 0xffb968];

    const build = (offsetZ: number) => {
      solid.push(
        box(ROAD_HALF * 2, 0.12, SEGMENT_LENGTH, 0, -0.04, offsetZ + SEGMENT_LENGTH / 2, 0x0a0b0e),
      );

      for (const side of [-1, 1]) {
        solid.push(
          box(CURB_OUTER - ROAD_HALF, 0.3, SEGMENT_LENGTH, side * ((ROAD_HALF + CURB_OUTER) / 2), 0.09, offsetZ + SEGMENT_LENGTH / 2, 0x15181e),
        );
        solid.push(
          box(WALK_OUTER - CURB_OUTER, 0.22, SEGMENT_LENGTH, side * ((CURB_OUTER + WALK_OUTER) / 2), 0.05, offsetZ + SEGMENT_LENGTH / 2, 0x1b1f26),
        );
      }

      for (let z = offsetZ + 2; z < offsetZ + SEGMENT_LENGTH; z += 4) {
        lit.push(box(0.34, 0.02, 2.1, 0, 0.03, z, 0xfff4d6));
      }
      for (const side of [-1, 1]) {
        lit.push(box(0.16, 0.02, SEGMENT_LENGTH, side * 4.35, 0.03, offsetZ + SEGMENT_LENGTH / 2, 0xf2e6c8));
      }

      for (let z = offsetZ + 10; z < offsetZ + SEGMENT_LENGTH; z += 22) {
        for (const side of [-1, 1]) {
          solid.push(box(0.22, 6.4, 0.22, side * 5.4, 3.2, z, 0x1a1d23));
          solid.push(box(1.9, 0.16, 0.16, side * 4.5, 6.3, z, 0x1a1d23));
          lit.push(box(0.85, 0.1, 0.5, side * 3.7, 6.22, z, lamps[Math.floor(rand() * lamps.length)]));
        }
      }

      let z = offsetZ;
      while (z < offsetZ + SEGMENT_LENGTH) {
        const depth = 7 + rand() * 9;
        const width = 6 + rand() * 7;
        const height = 9 + rand() * 38;
        const tone = tones[Math.floor(rand() * tones.length)];

        for (const side of [-1, 1]) {
          const x = side * (BUILDING_LINE + width / 2 + rand() * 2.5);
          solid.push(box(width, height, depth, x, height / 2, z + depth / 2, tone));

          const bands = Math.max(2, Math.floor(height / 3.4));
          for (let b = 0; b < bands; b++) {
            if (rand() > 0.52) continue;
            const y = 2.2 + b * 3.2;
            if (y > height - 1.2) break;
            lit.push(
              box(
                0.08,
                1.05,
                depth * (0.35 + rand() * 0.5),
                x - side * (width / 2 + 0.05),
                y,
                z + depth / 2,
                lamps[Math.floor(rand() * lamps.length)],
              ),
            );
          }
        }
        z += depth + 1.6 + rand() * 3;
      }
    };

    for (let i = 0; i < SEGMENTS; i++) build(i * SEGMENT_LENGTH);

    const structureGeo = mergeGeometries(solid, false);
    const glowGeo = mergeGeometries(lit, false);
    solid.forEach((g) => g.dispose());
    lit.forEach((g) => g.dispose());

    return {
      structure: structureGeo,
      glow: glowGeo,
      owned: [structureGeo, glowGeo].filter(Boolean) as THREE.BufferGeometry[],
    };
  }, []);

  useEffect(() => {
    const fog = new THREE.Fog(FOG_COLOR, 400, 900);
    scene.fog = fog;
    return () => {
      scene.fog = null;
      owned.forEach((g) => g.dispose());
    };
  }, [scene, owned]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    fade.current = THREE.MathUtils.damp(fade.current, active ? 1 : 0, active ? 2.4 : 1.7, delta);
    if (active) scroll.current = (scroll.current + delta * DRIVE_SPEED) % SEGMENT_LENGTH;

    group.position.z = -scroll.current;
    group.visible = fade.current > 0.008;

    const structureMesh = group.children[0] as THREE.Mesh;
    const glowMesh = group.children[1] as THREE.Mesh;
    const structureMat = structureMesh.material as THREE.MeshStandardMaterial;
    const glowMat = glowMesh.material as THREE.MeshBasicMaterial;
    const fadeIn = fade.current;

    structureMat.opacity = fadeIn;
    structureMat.transparent = fadeIn < 0.995;
    structureMat.depthWrite = fadeIn > 0.6;
    glowMat.opacity = fadeIn;
    glowMat.transparent = fadeIn < 0.995;

    structureMat.emissive.copy(accent.current).multiplyScalar(0.05 * fadeIn);
    structureMat.emissiveIntensity = fadeIn;

    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = THREE.MathUtils.lerp(320, 16, fadeIn);
      fog.far = THREE.MathUtils.lerp(760, 165, fadeIn);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={structure}>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh geometry={glow}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
    </group>
  );
}