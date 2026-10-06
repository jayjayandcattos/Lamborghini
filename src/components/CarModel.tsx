import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { modelsData } from '../data/models';
import type { CameraView } from '../types';

interface CarModelProps {
  modelId: string;
  color: string;
  cameraView: CameraView;
  onInteractionChange?: (isInteracting: boolean) => void;
}

const CAMERA_VIEWS: Record<CameraView, { position: [number, number, number]; lookAt: [number, number, number] }> = {
  'front-3/4': { position: [4.5, 1.6, 5.2], lookAt: [0, 0.3, 0.2] },
  side: { position: [6.0, 1.1, 0], lookAt: [0, 0.3, 0] },
  engine: { position: [0, 2.5, -3.2], lookAt: [0, 0.7, -0.9] },
  interior: { position: [0, 1.05, 0.25], lookAt: [0, 0.95, -1.5] },
};

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
        geoms.every((g) => g.attributes[name] !== undefined)
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
  const progress = useRef(0);

  useFrame((_, delta) => {
    const g = assetRef.current;
    if (!g) return;
    progress.current = Math.min(1, THREE.MathUtils.damp(progress.current, 1, 4, delta));
    const p = progress.current;
    g.scale.set(p, p, p);
    g.position.y = p - 1;
    g.rotation.y = THREE.MathUtils.lerp(-Math.PI, 0, p);
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
  const shouldLerp = useRef(true);
  const glow = useMemo(() => new THREE.Color(color), [color]);

  const modelIndex = modelsData.findIndex((m) => m.id === modelId);

  useEffect(() => {
    [1, -1].forEach((d) => {
      const neighbor = modelsData[(modelIndex + d + modelsData.length) % modelsData.length];
      useGLTF.preload(`/models/${neighbor.id}.glb`);
    });
  }, [modelIndex]);

  useEffect(() => {
    shouldLerp.current = true;
    onInteractionChange?.(true);
  }, [cameraView, modelId, onInteractionChange]);

  useFrame((state, delta) => {
    if (!shouldLerp.current) return;
    const view = CAMERA_VIEWS[cameraView] ?? CAMERA_VIEWS['front-3/4'];
    const cam = state.camera;
    const lambda = 5;

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
  });

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (cameraView === 'engine' || cameraView === 'interior') {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, 0, 5, delta);
    } else {
      g.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0.15, 0]} intensity={4} distance={5} decay={2} color={glow} />
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
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={0.6}
        maxDistance={11}
        onStart={() => {
          shouldLerp.current = false;
          onInteractionChange?.(true);
        }}
        onEnd={() => onInteractionChange?.(false)}
      />
    </group>
  );
}
