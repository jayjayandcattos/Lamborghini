import { useRef, useMemo, useEffect, useLayoutEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { modelsData } from '../data/models';
import type { CameraView } from '../types';

const TAU = Math.PI * 2;
const HERO_VIEW = 'front-3/4';
const CITY_VIEW = 'city';
const MIN_RADIUS = 1.6;
const MAX_RADIUS = 13;
const ZOOM_SPEED = 0.16;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function dampAngle(current: number, target: number, lambda: number, delta: number) {
  let diff = (target - current) % TAU;
  if (diff > Math.PI) diff -= TAU;
  if (diff < -Math.PI) diff += TAU;
  return current + diff * (1 - Math.exp(-lambda * delta));
}

const CAMERA_VIEWS: Record<CameraView, { position: [number, number, number]; lookAt: [number, number, number] }> = {
  'front-3/4': { position: [5.6, 0.85, 4.2], lookAt: [0, 0.45, 0] },
  side: { position: [6.9, 0.55, 0.7], lookAt: [0, 0.4, 0] },
  engine: { position: [-3.4, 2.4, -4.9], lookAt: [0, 0.6, -0.5] },
  interior: { position: [0.55, 1.02, 0.4], lookAt: [0, 0.85, -1.6] },
  city: { position: [3.4, 1.15, -6.2], lookAt: [0.3, 0.55, 7] },
};

interface CarModelProps {
  modelId: string;
  color: string;
  cameraView: CameraView;
  onInteractionChange?: (isInteracting: boolean) => void;
}

function GLTFAsset({ url, modelId }: { url: string; modelId: string }) {
  const { scene: originalScene } = useGLTF(url);
  const { gl } = useThree();

  const { root, ownedGeometries } = useMemo(() => {
    const cloned = originalScene.clone(true);
    cloned.updateMatrixWorld(true);

    const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const owned = new Set<THREE.BufferGeometry>();

    cloned.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);
      const list = byMaterial.get(material) ?? [];
      list.push(geo);
      byMaterial.set(material, list);
    });

    const merged = new THREE.Group();
    for (const [material, geoms] of byMaterial) {
      const common = [...new Set(Object.keys(geoms[0].attributes))].filter((name) =>
        geoms.every((g) => g.attributes[name] !== undefined),
      );
      const normalized = geoms.map((g) => {
        for (const name of Object.keys(g.attributes)) {
          if (!common.includes(name)) g.deleteAttribute(name);
        }
        return g;
      });
      const allIndexed = normalized.every((g) => g.index);
      const compatible = allIndexed
        ? normalized
        : normalized.map((g) => (g.index ? g.toNonIndexed() : g));
      const mergedGeo = mergeGeometries(compatible, false);
      if (!mergedGeo) continue;
      owned.add(mergedGeo);
      const mesh = new THREE.Mesh(mergedGeo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      merged.add(mesh);
    }

    const measure = merged.children.length > 0 ? merged : cloned;
    const box = new THREE.Box3().setFromObject(measure);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetLength = modelId === 'urus' ? 5.1 : 4.6;
    const factor = targetLength / (Math.max(size.x, size.y, size.z) || 1);

    const wrapper = new THREE.Group();
    wrapper.scale.set(factor, factor, factor);
    wrapper.position.set(-center.x * factor, -box.min.y * factor, -center.z * factor);
    wrapper.add(measure);

    return { root: wrapper, ownedGeometries: owned };
  }, [originalScene, modelId]);

  useEffect(() => {
    return () => {
      ownedGeometries.forEach((g) => g.dispose());
    };
  }, [ownedGeometries]);

  const assetRef = useRef<THREE.Group>(null);
  const startedAt = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const g = assetRef.current;
    if (!g) return;

    if (startedAt.current === null) startedAt.current = clock.elapsedTime;
    const t = clock.elapsedTime - startedAt.current;
    const p = clamp01(t / 1.8);
    const eased = easeOutCubic(p);

    const scale = 0.58 + 0.42 * Math.min(1.08, easeOutBack(p));
    g.scale.setScalar(scale);
    g.rotation.y = TAU * 1.75 * (1 - eased);
    g.position.y = (1 - eased) * 2.4 - Math.sin(clamp01((t - 1.4) / 0.55) * Math.PI) * 0.055;

    if (p < 1) gl.shadowMap.needsUpdate = true;
  });

  return (
    <group ref={assetRef}>
      <primitive object={root} />
    </group>
  );
}

export function CarModel({ modelId, color, cameraView, onInteractionChange }: CarModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const shouldLerp = useRef(true);
  const dragging = useRef(false);
  const idleFor = useRef(0);
  const angle = useRef(0);
  const introStart = useRef(0);
  const introPending = useRef(true);
  const zoomTarget = useRef(6);
  const zoomValue = useRef(6);
  const zoomVelocity = useRef(0);
  const glow = useMemo(() => new THREE.Color(color), [color]);

  const { camera, gl, size } = useThree();
  const shift = size.width >= 1024 ? Math.min(size.width * 0.15, 200) : 0;

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (shift <= 0) {
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
      return;
    }
    cam.setViewOffset(size.width, size.height, -shift, 0, size.width, size.height);
    return () => {
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
    };
  }, [camera, shift, size.width, size.height]);

  const modelIndex = modelsData.findIndex((m) => m.id === modelId);

  useEffect(() => {
    [1, -1].forEach((d) => {
      const neighbor = modelsData[(modelIndex + d + modelsData.length) % modelsData.length];
      useGLTF.preload(`/models/${neighbor.id}.glb`);
    });
  }, [modelIndex]);

  useEffect(() => {
    shouldLerp.current = true;
    idleFor.current = 0;
    introPending.current = true;
    onInteractionChange?.(true);
  }, [cameraView, modelId, onInteractionChange]);

  useEffect(() => {
    const element = gl.domElement;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const magnitude = Math.min(Math.abs(event.deltaY) / 100, 1.6);
      const step = event.deltaY > 0 ? 1 + magnitude * ZOOM_SPEED : 1 - magnitude * ZOOM_SPEED;
      zoomTarget.current = THREE.MathUtils.clamp(zoomTarget.current * step, MIN_RADIUS, MAX_RADIUS);
      shouldLerp.current = false;
      idleFor.current = 0;
    };

    const pinchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    let pinchStart = 0;
    let pinchRadius = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      pinchStart = pinchDistance(event.touches);
      pinchRadius = zoomTarget.current;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || pinchStart <= 0) return;
      event.preventDefault();
      const ratio = pinchStart / Math.max(pinchDistance(event.touches), 1);
      zoomTarget.current = THREE.MathUtils.clamp(pinchRadius * ratio, MIN_RADIUS, MAX_RADIUS);
      shouldLerp.current = false;
      idleFor.current = 0;
    };

    const onTouchEnd = () => {
      pinchStart = 0;
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
    element.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const cam = state.camera;
    const t = state.clock.elapsedTime;

    if (introPending.current) {
      introStart.current = t;
      introPending.current = false;
    }

    idleFor.current += delta;
    if (dragging.current) idleFor.current = 0;

    if (shouldLerp.current && !dragging.current) {
      const view = CAMERA_VIEWS[cameraView] ?? CAMERA_VIEWS[HERO_VIEW];
      const lambda = 5;
      const presetRadius = Math.hypot(
        view.position[0] - view.lookAt[0],
        view.position[1] - view.lookAt[1],
        view.position[2] - view.lookAt[2],
      );

      zoomTarget.current = presetRadius;

      cam.position.x = THREE.MathUtils.damp(cam.position.x, view.position[0], lambda, delta);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, view.position[1], lambda, delta);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, view.position[2], lambda, delta);

      if (orbitRef.current) {
        orbitRef.current.target.x = THREE.MathUtils.damp(orbitRef.current.target.x, view.lookAt[0], lambda, delta);
        orbitRef.current.target.y = THREE.MathUtils.damp(orbitRef.current.target.y, view.lookAt[1], lambda, delta);
        orbitRef.current.target.z = THREE.MathUtils.damp(orbitRef.current.target.z, view.lookAt[2], lambda, delta);
        orbitRef.current.update();
      } else {
        cam.lookAt(view.lookAt[0], view.lookAt[1], view.lookAt[2]);
      }

      const dx = cam.position.x - view.position[0];
      const dy = cam.position.y - view.position[1];
      const dz = cam.position.z - view.position[2];
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.04) {
        shouldLerp.current = false;
        cam.position.set(view.position[0], view.position[1], view.position[2]);
        if (orbitRef.current) {
          orbitRef.current.target.set(view.lookAt[0], view.lookAt[1], view.lookAt[2]);
          orbitRef.current.update();
        }
        onInteractionChange?.(false);
      }
    }

    const pivot = orbitRef.current ? orbitRef.current.target : cam.position;
    const distance = cam.position.distanceTo(pivot);

    if (shouldLerp.current) {
      zoomValue.current = distance;
      zoomVelocity.current = 0;
    } else {
      const omega = 7;
      const accel = omega * omega * (zoomTarget.current - zoomValue.current) - 2 * omega * zoomVelocity.current;
      zoomVelocity.current += accel * delta;
      zoomValue.current += zoomVelocity.current * delta;

      if (zoomValue.current < MIN_RADIUS) {
        zoomValue.current = MIN_RADIUS;
        zoomVelocity.current = Math.max(0, zoomVelocity.current);
      } else if (zoomValue.current > MAX_RADIUS) {
        zoomValue.current = MAX_RADIUS;
        zoomVelocity.current = Math.min(0, zoomVelocity.current);
      }

      if (Math.abs(zoomValue.current - distance) > 0.0005 && distance > 0.0001) {
        const scale = zoomValue.current / distance;
        cam.position.set(
          pivot.x + (cam.position.x - pivot.x) * scale,
          pivot.y + (cam.position.y - pivot.y) * scale,
          pivot.z + (cam.position.z - pivot.z) * scale,
        );
      }
    }

    const isHero = cameraView === HERO_VIEW;
    const isCity = cameraView === CITY_VIEW;

    if (isHero && !dragging.current && idleFor.current > 1.4) {
      angle.current += delta * 0.13;
    } else if (!isHero && !isCity) {
      angle.current = dampAngle(angle.current, 0, 2.2, delta);
    }

    g.rotation.y = angle.current;
    g.position.y = Math.sin(t * 0.55) * 0.022 + (isCity ? Math.sin(t * 2.4) * 0.004 : 0);
    g.rotation.z = Math.sin(t * 0.37) * 0.007;
    g.rotation.x = Math.sin(t * 0.29 + 1.2) * 0.005;

    const idleBoost = idleFor.current > 1.4 ? 1 : 0;
    const flash = Math.max(0, 1 - (t - introStart.current) / 1.2) ** 2;

    if (glowRef.current) {
      glowRef.current.intensity = 3.2 + Math.sin(t * 1.1) * 0.9 + idleBoost * 1.6 + flash;
    }

    if (rimRef.current) {
      const orbit = t * 0.16;
      rimRef.current.position.set(Math.cos(orbit) * 7, 3.4, Math.sin(orbit) * 7);
      rimRef.current.intensity = 0.6 + Math.sin(t * 0.5) * 0.25 + idleBoost * 0.35 + flash * 1.5;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight
        ref={glowRef}
        position={[0, 0.15, 0]}
        intensity={4}
        distance={6}
        decay={2}
        color={glow}
      />
      <directionalLight ref={rimRef} position={[5, 3, 5]} intensity={0.8} color={glow} />
      <Suspense
        fallback={
          <mesh>
            <icosahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial color="#FFB300" wireframe />
          </mesh>
        }
      >
        <GLTFAsset key={modelId} url={`/models/${modelId}.glb`} modelId={modelId} />
      </Suspense>
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minPolarAngle={0.18}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
        minDistance={0.6}
        maxDistance={11}
        onStart={() => {
          dragging.current = true;
          shouldLerp.current = false;
          onInteractionChange?.(true);
        }}
        onEnd={() => {
          dragging.current = false;
          idleFor.current = 0;
          onInteractionChange?.(false);
        }}
      />
    </group>
  );
}