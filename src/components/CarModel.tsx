import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { modelsData } from '../data/models';
import type { CameraView } from '../types';

const TAU = Math.PI * 2;
const HERO_VIEW: CameraView = 'front-3/4';
const BASE_FOV = 38;
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

const CAMERA_VIEWS: Record<
  CameraView,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  'front-3/4': { position: [6.15, 0.98, 4.62], lookAt: [0, 0.45, 0] },
  side: { position: [7.2, 0.6, 0.7], lookAt: [0, 0.4, 0] },
  engine: { position: [-3.6, 2.5, -5.0], lookAt: [0, 0.6, -0.5] },
  interior: { position: [0.5, 1.0, 0.38], lookAt: [0, 0.82, -1.5] },
};

interface GLTFAssetProps {
  url: string;
  modelId: string;
  paint: string;
  paintMaterial: string;
  paintRoughness: number;
  paintMetalness: number;
  wireframe: boolean;
  onGeometryStats?: (tris: number, calls: number) => void;
}

function GLTFAsset({
  url,
  modelId,
  paint,
  paintMaterial,
  paintRoughness,
  paintMetalness,
  wireframe,
  onGeometryStats,
}: GLTFAssetProps) {
  const { scene: originalScene } = useGLTF(url);

  const { root, materials, paintMaterials, tris, calls } = useMemo(() => {
    const cloned = originalScene.clone(true);
    cloned.updateMatrixWorld(true);

    // Group every mesh by material so the ~1.5k nodes collapse into a couple
    // of dozen draw calls before anything hits the GPU.
    const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();

    cloned.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (!material) return;
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);
      const list = byMaterial.get(material) ?? [];
      list.push(geo);
      byMaterial.set(material, list);
    });

    const merged = new THREE.Group();
    const ownedMaterials: THREE.Material[] = [];
    const paintMats: THREE.MeshStandardMaterial[] = [];
    let triangles = 0;
    let drawCalls = 0;

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

      triangles +=
        (mergedGeo.index ? mergedGeo.index.count : mergedGeo.attributes.position.count) / 3;
      drawCalls += 1;

      // Every material is cloned so paint + wireframe can be applied without
      // mutating the cached GLTF asset shared across model switches.
      const mat = material.clone() as THREE.MeshStandardMaterial;
      ownedMaterials.push(mat);

      if (mat.name && mat.name.includes(paintMaterial)) {
        paintMats.push(mat);
        mat.envMapIntensity = 1.35;
      }

      const mesh = new THREE.Mesh(mergedGeo, mat);
      merged.add(mesh);
    }

    const measure = merged.children.length > 0 ? merged : cloned;
    const box = new THREE.Box3().setFromObject(measure);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetLength = modelId === 'urus' ? 5.1 : 4.9;
    const factor = targetLength / (Math.max(size.x, size.y, size.z) || 1);

    const wrapper = new THREE.Group();
    wrapper.scale.set(factor, factor, factor);
    wrapper.position.set(-center.x * factor, -box.min.y * factor, -center.z * factor);
    wrapper.add(measure);

    return {
      root: wrapper,
      materials: ownedMaterials,
      paintMaterials: paintMats,
      tris: Math.round(triangles),
      calls: drawCalls,
    };
  }, [originalScene, modelId, paintMaterial]);

  useEffect(() => {
    onGeometryStats?.(tris, calls);
  }, [onGeometryStats, tris, calls]);

  useEffect(() => {
    return () => {
      materials.forEach((m) => m.dispose());
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
    };
  }, [materials, root]);

  useEffect(() => {
    paintMaterials.forEach((m) => {
      m.color.set(paint);
      m.roughness = paintRoughness;
      m.metalness = paintMetalness;
      m.needsUpdate = true;
    });
  }, [paintMaterials, paint, paintRoughness, paintMetalness]);

  useEffect(() => {
    materials.forEach((m) => {
      if ('wireframe' in m) {
        (m as THREE.MeshStandardMaterial).wireframe = wireframe;
        m.needsUpdate = true;
      }
    });
  }, [materials, wireframe]);

  const assetRef = useRef<THREE.Group>(null);
  const startedAt = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const g = assetRef.current;
    if (!g) return;

    if (startedAt.current === null) startedAt.current = clock.elapsedTime;
    const t = clock.elapsedTime - startedAt.current;
    const p = clamp01(t / 1.6);
    const eased = easeOutCubic(p);

    const scale = 0.62 + 0.38 * Math.min(1.06, easeOutBack(p));
    g.scale.setScalar(scale);
    g.rotation.y = TAU * 1.25 * (1 - eased);
    g.position.y = (1 - eased) * 1.6 - Math.sin(clamp01((t - 1.2) / 0.5) * Math.PI) * 0.04;
  });

  return (
    <group ref={assetRef}>
      <primitive object={root} />
    </group>
  );
}

interface CarModelProps {
  modelId: string;
  paint: string;
  paintMaterial: string;
  paintRoughness: number;
  paintMetalness: number;
  view: CameraView;
  wireframe: boolean;
  autoRotate: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
  onGeometryStats?: (tris: number, calls: number) => void;
}

export function CarModel({
  modelId,
  paint,
  paintMaterial,
  paintRoughness,
  paintMetalness,
  view,
  wireframe,
  autoRotate,
  onInteractionChange,
  onGeometryStats,
}: CarModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const shouldLerp = useRef(true);
  const dragging = useRef(false);
  const idleFor = useRef(0);
  const angle = useRef(0);
  const introPending = useRef(true);
  const zoomTarget = useRef(6);
  const zoomValue = useRef(6);
  const glow = useMemo(() => new THREE.Color(paint), [paint]);

  const { camera, gl, size } = useThree();
  const shift = size.width >= 720 ? Math.min(size.width * 0.16, 190) : 0;

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
  }, [view, modelId, onInteractionChange]);

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

  useFrame((state, rawDelta) => {
    const g = groupRef.current;
    if (!g) return;

    // Cap the timestep: a stalled tab (or a very slow frame) would otherwise
    // let the camera smoothing overshoot catastrophically.
    const delta = Math.min(rawDelta, 1 / 30);

    const cam = state.camera;
    const t = state.clock.elapsedTime;

    if (introPending.current) {
      introPending.current = false;
    }

    idleFor.current += delta;
    if (dragging.current) idleFor.current = 0;

    if (shouldLerp.current && !dragging.current) {
      const preset = CAMERA_VIEWS[view] ?? CAMERA_VIEWS[HERO_VIEW];
      const lambda = 5;

      // Portrait viewports are much narrower than the preset framing assumes,
      // so pull the camera back proportionally to keep the whole body in frame.
      const aspect = size.width / Math.max(size.height, 1);
      const fit =
        aspect < 1.1 ? THREE.MathUtils.clamp(1.1 / Math.max(aspect, 0.55), 1, 1.62) : 1;

      const target: [number, number, number] = [
        preset.lookAt[0] + (preset.position[0] - preset.lookAt[0]) * fit,
        preset.lookAt[1] + (preset.position[1] - preset.lookAt[1]) * fit,
        preset.lookAt[2] + (preset.position[2] - preset.lookAt[2]) * fit,
      ];

      zoomTarget.current = Math.hypot(
        target[0] - preset.lookAt[0],
        target[1] - preset.lookAt[1],
        target[2] - preset.lookAt[2],
      );

      cam.position.x = THREE.MathUtils.damp(cam.position.x, target[0], lambda, delta);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, target[1], lambda, delta);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, target[2], lambda, delta);

      if (orbitRef.current) {
        orbitRef.current.target.x = THREE.MathUtils.damp(
          orbitRef.current.target.x,
          preset.lookAt[0],
          lambda,
          delta,
        );
        orbitRef.current.target.y = THREE.MathUtils.damp(
          orbitRef.current.target.y,
          preset.lookAt[1],
          lambda,
          delta,
        );
        orbitRef.current.target.z = THREE.MathUtils.damp(
          orbitRef.current.target.z,
          preset.lookAt[2],
          lambda,
          delta,
        );
        orbitRef.current.update();
      } else {
        cam.lookAt(preset.lookAt[0], preset.lookAt[1], preset.lookAt[2]);
      }

      const dx = cam.position.x - target[0];
      const dy = cam.position.y - target[1];
      const dz = cam.position.z - target[2];
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.04) {
        shouldLerp.current = false;
        cam.position.set(target[0], target[1], target[2]);
        if (orbitRef.current) {
          orbitRef.current.target.set(preset.lookAt[0], preset.lookAt[1], preset.lookAt[2]);
          orbitRef.current.update();
        }
        onInteractionChange?.(false);
      }
    }

    const pivot = orbitRef.current ? orbitRef.current.target : cam.position;
    const distance = cam.position.distanceTo(pivot);

    if (shouldLerp.current) {
      zoomValue.current = distance;
    } else {
      zoomTarget.current = THREE.MathUtils.clamp(zoomTarget.current, MIN_RADIUS, MAX_RADIUS);
      zoomValue.current = THREE.MathUtils.damp(zoomValue.current, zoomTarget.current, 6, delta);

      if (Math.abs(zoomValue.current - distance) > 0.0005 && distance > 0.0001) {
        const scale = zoomValue.current / distance;
        cam.position.set(
          pivot.x + (cam.position.x - pivot.x) * scale,
          pivot.y + (cam.position.y - pivot.y) * scale,
          pivot.z + (cam.position.z - pivot.z) * scale,
        );
      }
    }

    const isHero = view === HERO_VIEW;

    if (autoRotate && !dragging.current && idleFor.current > 1.2) {
      angle.current += delta * 0.13;
    } else {
      angle.current = dampAngle(angle.current, 0, 2.2, delta);
    }

    g.rotation.y = angle.current;
    g.position.y = Math.sin(t * 0.55) * 0.018;
    g.rotation.z = Math.sin(t * 0.37) * 0.006;

    const perspective = cam as THREE.PerspectiveCamera;
    const settling = isHero && autoRotate && idleFor.current > 1.2;
    const targetFov = settling ? BASE_FOV + Math.sin(t * 0.28) * 0.8 : BASE_FOV;
    if (Math.abs(perspective.fov - targetFov) > 0.002) {
      perspective.fov = THREE.MathUtils.damp(perspective.fov, targetFov, 2, delta);
      perspective.updateProjectionMatrix();
    }

    if (glowRef.current) {
      glowRef.current.intensity = 1.1 + Math.sin(t * 1.1) * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={glowRef} position={[0, 0.12, 0]} intensity={1.1} distance={5} decay={2} color={glow} />
      <Suspense
        fallback={
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.9, 0.35, 1.9]} />
            <meshBasicMaterial color="#b9b7ac" wireframe />
          </mesh>
        }
      >
        <GLTFAsset
          key={modelId}
          url={`/models/${modelId}.glb`}
          modelId={modelId}
          paint={paint}
          paintMaterial={paintMaterial}
          paintRoughness={paintRoughness}
          paintMetalness={paintMetalness}
          wireframe={wireframe}
          onGeometryStats={onGeometryStats}
        />
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
