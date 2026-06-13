import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface CarModelProps {
  modelId: string;
  color: string;
  cameraView: string;
  scale?: number;
  position?: [number, number, number];
  onInteractionChange?: (isInteracting: boolean) => void;
}

function GLTFAsset({ 
  url, 
  modelId, 
  customScale, 
  customPosition 
}: { 
  url: string; 
  modelId: string;
  customScale?: number;
  customPosition?: [number, number, number];
}) {
  const { scene: originalScene } = useGLTF(url);
  
  // Clone the scene to avoid mutating the cached original
  const scene = useMemo(() => {
    const cloned = originalScene.clone(true);
    // Deep clone materials so each instance is independent
    cloned.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
      }
    });
    return cloned;
  }, [originalScene]);

  const [computedScale, setComputedScale] = useState<number>(1.0);
  const [computedPosition, setComputedPosition] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (!scene || !originalScene) return;

    // 1. Calculate bounding box of the original untransformed scene
    const box = new THREE.Box3().setFromObject(originalScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // 2. Scale factor — target real-world car lengths in meters
    const targetLength = modelId === 'urus' ? 5.1 : 4.6;
    const maxDim = Math.max(size.x, size.y, size.z);
    
    let factor = targetLength / (maxDim || 1);
    if (customScale !== undefined) {
      factor = customScale;
    }
    setComputedScale(factor);

    // 3. Position offset to ground the wheels (y=0) and center the model
    let offset: [number, number, number] = [
      -center.x * factor,
      -box.min.y * factor,
      -center.z * factor
    ];
    if (customPosition !== undefined) {
      offset = customPosition;
    }
    setComputedPosition(offset);

    // 4. Enable shadows on all meshes
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, originalScene, modelId, customScale, customPosition]);

  const assetRef = useRef<THREE.Group>(null);
  const animProgress = useRef(0);

  useEffect(() => {
    animProgress.current = 0;
    if (assetRef.current) {
      assetRef.current.scale.set(0, 0, 0);
      assetRef.current.position.set(0, -1.0, 0);
      assetRef.current.rotation.set(0, -Math.PI, 0);
    }
  }, [computedScale, computedPosition]);

  useFrame(() => {
    if (!assetRef.current) return;

    animProgress.current = THREE.MathUtils.lerp(animProgress.current, 1, 0.04);
    
    const currentScale = animProgress.current * computedScale;
    assetRef.current.scale.set(currentScale, currentScale, currentScale);

    const startY = computedPosition[1] - 1.0;
    assetRef.current.position.y = THREE.MathUtils.lerp(startY, computedPosition[1], animProgress.current);
    assetRef.current.position.x = computedPosition[0];
    assetRef.current.position.z = computedPosition[2];

    assetRef.current.rotation.y = THREE.MathUtils.lerp(-Math.PI, 0, animProgress.current);
  });

  return (
    <group ref={assetRef}>
      <primitive key={url} object={scene} />
    </group>
  );
}

export function CarModel({ modelId, color, cameraView, scale, position, onInteractionChange }: CarModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const curLookAt = useRef(new THREE.Vector3(0, 0.4, 0));
  const orbitRef = useRef<any>(null);
  const shouldLerpRef = useRef(true);
  const [hasRealModel, setHasRealModel] = useState<boolean | null>(null);

  // Quick head check to see if local static GLB is present
  useEffect(() => {
    const checkFile = async () => {
      try {
        const res = await fetch(`/models/${modelId}.glb`, { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.toLowerCase().includes('text/html')) {
          setHasRealModel(true);
        } else {
          setHasRealModel(false);
        }
      } catch (e) {
        setHasRealModel(false);
      }
    };
    checkFile();
  }, [modelId]);

  // Trigger camera reset animation whenever perspective changes
  useEffect(() => {
    shouldLerpRef.current = true;
    onInteractionChange?.(true); // Fade out surrounding UI while camera animates
  }, [cameraView, modelId, onInteractionChange]);

  // Camera lerping logic is run on every frame
  useFrame((state) => {
    let targetPos: [number, number, number] = [4.5, 1.6, 5.2];
    let targetLookAt: [number, number, number] = [0, 0.3, 0.2];

    switch (cameraView) {
      case 'front-3/4':
        targetPos = [4.5, 1.6, 5.2];
        targetLookAt = [0, 0.3, 0.2];
        break;
      case 'side':
        targetPos = [6.0, 1.1, 0];
        targetLookAt = [0, 0.3, 0];
        break;
      case 'engine':
        targetPos = [0, 2.5, -3.2];
        targetLookAt = [0, 0.7, -0.9];
        break;
      case 'interior':
        targetPos = [0.0, 1.05, 0.25];
        targetLookAt = [0, 0.95, -1.5];
        break;
      default:
        targetPos = [4.5, 1.8, 5.5];
        targetLookAt = [0, 0.4, 0];
    }

    if (shouldLerpRef.current) {
      // Smoothly interpolate camera position
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetPos[0], 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetPos[1], 0.05);
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetPos[2], 0.05);

      if (orbitRef.current) {
        // Smoothly interpolate the OrbitControls target focus point
        orbitRef.current.target.x = THREE.MathUtils.lerp(orbitRef.current.target.x, targetLookAt[0], 0.05);
        orbitRef.current.target.y = THREE.MathUtils.lerp(orbitRef.current.target.y, targetLookAt[1], 0.05);
        orbitRef.current.target.z = THREE.MathUtils.lerp(orbitRef.current.target.z, targetLookAt[2], 0.05);
        orbitRef.current.update();
      } else {
        const targetL = new THREE.Vector3(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
        curLookAt.current.lerp(targetL, 0.05);
        state.camera.lookAt(curLookAt.current);
      }

      // Check distance to target to end the transition cleanly and fade back in
      const dx = state.camera.position.x - targetPos[0];
      const dy = state.camera.position.y - targetPos[1];
      const dz = state.camera.position.z - targetPos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 0.04) {
        shouldLerpRef.current = false;
        // Snap directly to final positions to prevent infinite micro-lerping
        state.camera.position.set(targetPos[0], targetPos[1], targetPos[2]);
        if (orbitRef.current) {
          orbitRef.current.target.set(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
          orbitRef.current.update();
        }
        onInteractionChange?.(false); // Fade surrounding UI back in!
      }
    }
  });

  // Slow orbital idle rotation when not in engine or interior view and not currently dragged
  useFrame((state) => {
    if (groupRef.current && cameraView !== 'engine' && cameraView !== 'interior') {
      if (shouldLerpRef.current) {
        const time = state.clock.getElapsedTime();
        groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.08;
      }
    } else if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
    }
  });

  // Material parameters cached for efficiency
  const paintColor = useMemo(() => new THREE.Color(color), [color]);

  // Handle glass panel engine-hatch opening angle when in engine view
  const hatchRotation = cameraView === 'engine' ? -0.4 : 0.0;
  const currHatchRot = useRef(0);
  useFrame(() => {
    currHatchRot.current = THREE.MathUtils.lerp(currHatchRot.current, hatchRotation, 0.08);
  });

  return (
    <>
      {hasRealModel ? (
        <group ref={groupRef} position={[0, 0, 0]}>
          <Suspense fallback={
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshBasicMaterial color="#FFB300" wireframe />
            </mesh>
          }>
            <GLTFAsset 
              key={modelId}
              url={`/models/${modelId}.glb`} 
              modelId={modelId}
              customScale={scale}
              customPosition={position}
            />
          </Suspense>
        </group>
      ) : (
        <group ref={groupRef} position={[0, 0, 0]}>
        {/* 1. CHASSIS / FLOOR GRID CORE */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.08, 4.4]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.9} metalness={0.4} />
      </mesh>

      {/* 2. REAR DIFFUSER & FRONT SPLITTER ACCENTS (AGGRESSIVE SHARP EDGES) */}
      {/* Front splitter */}
      <mesh position={[0, 0.17, 2.2]} castShadow>
        <boxGeometry args={[1.9, 0.05, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Winglets left and right on front splitter */}
      <mesh position={[-0.95, 0.23, 2.25]}>
        <boxGeometry args={[0.04, 0.15, 0.3]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh position={[0.95, 0.23, 2.25]}>
        <boxGeometry args={[0.04, 0.15, 0.3]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>

      {/* Rear diffuser */}
      <mesh position={[0, 0.16, -2.2]} castShadow>
        <boxGeometry args={[1.95, 0.12, 0.3]} />
        <meshStandardMaterial color="#111111" roughness={0.7} />
      </mesh>

      {/* 3. WHEELS & CALIPERS */}
      {/* Front Left */}
      <group position={[-1.02, 0.35, 1.45]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.34, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Rims */}
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.03, 10]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.3} metalness={1.0} />
        </mesh>
        {/* Caliper */}
        <mesh position={[-0.1, 0.15, 0]}>
          <boxGeometry args={[0.05, 0.14, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[1.02, 0.35, 1.45]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.34, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Rims */}
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.03, 10]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.3} metalness={1.0} />
        </mesh>
        {/* Caliper */}
        <mesh position={[0.1, 0.15, 0]}>
          <boxGeometry args={[0.05, 0.14, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Rear Left */}
      <group position={[-1.04, 0.38, -1.35]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.38, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Rims */}
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.03, 12]} />
          <meshStandardMaterial color="#222222" roughness={0.3} metalness={1.0} />
        </mesh>
        {/* Caliper */}
        <mesh position={[-0.12, 0.16, 0]}>
          <boxGeometry args={[0.05, 0.16, 0.09]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Rear Right */}
      <group position={[1.04, 0.38, -1.35]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.38, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Rims */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.03, 12]} />
          <meshStandardMaterial color="#222222" roughness={0.3} metalness={1.0} />
        </mesh>
        {/* Caliper */}
        <mesh position={[0.12, 0.16, 0]}>
          <boxGeometry args={[0.05, 0.16, 0.09]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>


      {/* 4. MAIN COCKPIT & WINDOW GLASS SURFACE */}
      {/* Windshield */}
      <mesh position={[0, 0.85, 0.4]} rotation={[-0.72, 0, 0]} castShadow>
        <planeGeometry args={[1.5, 1.2]} />
        <meshPhysicalMaterial color="#0A0A0A" thickness={0.5} roughness={0.02} metalness={0.9} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Roof Panel */}
      <mesh position={[0, 1.15, -0.4]} castShadow>
        <boxGeometry args={[1.35, 0.04, 1.0]} />
        <meshPhysicalMaterial color="#111111" roughness={0.15} metalness={0.9} clearcoat={1.0} />
      </mesh>
      {/* Side Glass Lines */}
      <mesh position={[-0.8, 0.85, -0.1]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[1.8, 0.5]} />
        <meshPhysicalMaterial color="#080808" thickness={0.4} roughness={0.03} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.8, 0.85, -0.1]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[1.8, 0.5]} />
        <meshPhysicalMaterial color="#080808" thickness={0.4} roughness={0.03} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>


      {/* 5. INTERIOR CABIN ACCENTS (Visible or camera-interior) */}
      <group position={[0, 0.5, 0.1]}>
        {/* Dashboard dash */}
        <mesh position={[0, 0.35, 0.5]}>
          <boxGeometry args={[1.4, 0.15, 0.4]} />
          <meshStandardMaterial color="#0b0b0b" roughness={0.85} />
        </mesh>
        {/* Yellow stitched center screen console */}
        <mesh position={[0, 0.15, 0.3]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.25, 0.4, 0.08]} />
          <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>
        {/* Steering Wheel */}
        <mesh position={[-0.35, 0.3, 0.25]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.13, 0.026, 8, 24]} />
          <meshStandardMaterial color="#000" roughness={0.8} />
        </mesh>
        {/* Sports Bucket Seats */}
        {/* Left Seat */}
        <group position={[-0.35, 0.1, -0.4]}>
          <mesh castShadow>
            <boxGeometry args={[0.48, 0.55, 0.45]} />
            <meshStandardMaterial color="#121212" roughness={0.8} />
          </mesh>
          {/* Carbon seat trim lines */}
          <mesh position={[0, 0, 0.23]}>
            <boxGeometry args={[0.4, 0.5, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        </group>
        {/* Right Seat */}
        <group position={[0.35, 0.1, -0.4]}>
          <mesh castShadow>
            <boxGeometry args={[0.48, 0.55, 0.45]} />
            <meshStandardMaterial color="#121212" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.23]}>
            <boxGeometry args={[0.4, 0.5, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        </group>
      </group>


      {/* 6. ENGINE COMPARTMENT (Visible in Engine View) */}
      <group position={[0, 0.6, -1.0]}>
        {/* Engine Block Base */}
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.3, 1.0]} />
          <meshStandardMaterial color="#1C1C1C" roughness={0.7} metalness={0.9} />
        </mesh>

        {/* Dynamic V10/V12 Red/Gold manifolds */}
        {modelId === 'revuelto' ? (
          /* V12 Golden manifolds */
          <group>
            <mesh position={[-0.2, 0.2, 0]}>
              <boxGeometry args={[0.18, 0.1, 0.8]} />
              <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0.2, 0.2, 0]}>
              <boxGeometry args={[0.18, 0.1, 0.8]} />
              <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.08, 0.05, 0.7]} />
              <meshStandardMaterial color="#d4fe00" emissive="#332d00" roughness={0.1} />
            </mesh>
          </group>
        ) : (
          /* V10 Bright Red manifolds */
          <group>
            <mesh position={[-0.18, 0.2, 0]}>
              <boxGeometry args={[0.15, 0.08, 0.74]} />
              <meshStandardMaterial color="#B22222" roughness={0.4} metalness={0.7} />
            </mesh>
            <mesh position={[0.18, 0.2, 0]}>
              <boxGeometry args={[0.15, 0.08, 0.74]} />
              <meshStandardMaterial color="#B22222" roughness={0.4} metalness={0.7} />
            </mesh>
          </group>
        )}

        {/* Carbon fiber shock tower brace */}
        <mesh position={[0, 0.24, -0.3]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[1.2, 0.04, 0.04]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.24, -0.3]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[1.2, 0.04, 0.04]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
      </group>

      {/* Opening / Sliding Glass engine hatch */}
      <group position={[0, 0.8, -1.0]} rotation={[currHatchRot.current, 0, 0]}>
        {/* Hatch glass panel framed in carbon */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 0.03, 1.1]} />
          <meshPhysicalMaterial color="#222222" transparent opacity={0.65} roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Heat dissipation vents */}
        <mesh position={[0, 0.02, 0.2]}>
          <boxGeometry args={[0.8, 0.015, 0.1]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.02, -0.2]}>
          <boxGeometry args={[0.8, 0.015, 0.1]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>


      {/* 7. DYNAMIC CAR BODY PANELS (VARYING BY MODEL CHOSEN) */}
      {/* Front Nose Bonnet / Hood */}
      <mesh position={[0, 0.42, 1.3]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[1.9, 0.14, 1.4]} />
        <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} clearcoatRoughness={0.1} />
      </mesh>

      {/* Dynamic Front Fender Arches (Rear/Front) */}
      <mesh position={[-0.92, 0.45, 1.15]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.35, 1.2]} />
        <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
      </mesh>
      <mesh position={[0.92, 0.45, 1.15]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.35, 1.2]} />
        <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
      </mesh>

      {/* Side Doors (with sculpted carbon channels) */}
      <mesh position={[-0.94, 0.5, -0.1]} castShadow>
        <boxGeometry args={[0.15, 0.55, 1.4]} />
        <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
      </mesh>
      <mesh position={[0.94, 0.5, -0.1]} castShadow>
        <boxGeometry args={[0.15, 0.55, 1.4]} />
        <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
      </mesh>

      {/* Big Side Air Intakes */}
      <mesh position={[-0.92, 0.5, -0.9]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.5]} />
        <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
      </mesh>
      <mesh position={[0.92, 0.5, -0.9]} castShadow>
        <boxGeometry args={[0.18, 0.6, 0.5]} />
        <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
      </mesh>
      {/* Dark intake screen meshes inside the scoops */}
      <mesh position={[-0.93, 0.5, -0.75]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.02, 0.5, 0.15]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.9} />
      </mesh>
      <mesh position={[0.93, 0.5, -0.75]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.02, 0.5, 0.15]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.9} />
      </mesh>

      {/* MODEL SPECIFIC EXTRA AERODYNAMIC PANELS */}
      {modelId === 'revuelto' && (
        /* REVUELTO STRUCTURE AND HIGHLIGHTS */
        <group>
          {/* Active sleek integrated dual rear spoiler lip */}
          <group position={[0, 0.82, -1.9]}>
            <mesh position={[-0.65, 0, 0]} castShadow>
              <boxGeometry args={[0.65, 0.05, 0.3]} />
              <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
            </mesh>
            <mesh position={[0.65, 0, 0]} castShadow>
              <boxGeometry args={[0.65, 0.05, 0.3]} />
              <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
            </mesh>
          </group>

          {/* Front Y-Shaped ultra lights */}
          <group position={[0, 0.34, 1.95]}>
            {/* Left Y Light */}
            <mesh position={[-0.72, 0.1, 0.08]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.22, 0.02, 0.02]} />
              <meshBasicMaterial color="#FFB300" toneMapped={false} />
            </mesh>
            <mesh position={[-0.8, 0.02, 0.08]} rotation={[0, 0, -1.1]}>
              <boxGeometry args={[0.15, 0.02, 0.02]} />
              <meshBasicMaterial color="#FFB300" toneMapped={false} />
            </mesh>

            {/* Right Y Light */}
            <mesh position={[0.72, 0.1, 0.08]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.22, 0.02, 0.02]} />
              <meshBasicMaterial color="#FFB300" toneMapped={false} />
            </mesh>
            <mesh position={[0.8, 0.02, 0.08]} rotation={[0, 0, 1.1]}>
              <boxGeometry args={[0.15, 0.02, 0.02]} />
              <meshBasicMaterial color="#FFB300" toneMapped={false} />
            </mesh>
          </group>
        </group>
      )}

      {modelId === 'huracan' && (
        /* HURACÁN STO COUPE COMPACT AGGRESSIVE ACCENTS */
        <group>
          {/* High STO Wing on premium center supports */}
          <group position={[0, 1.25, -1.9]}>
            {/* Two elevated struts */}
            <mesh position={[-0.45, -0.2, 0.1]} rotation={[0.4, 0, 0]} castShadow>
              <boxGeometry args={[0.04, 0.45, 0.12]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
            </mesh>
            <mesh position={[0.45, -0.2, 0.1]} rotation={[0.4, 0, 0]} castShadow>
              <boxGeometry args={[0.04, 0.45, 0.12]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
            </mesh>
            {/* Huge high aerodynamic wing board */}
            <mesh castShadow>
              <boxGeometry args={[1.9, 0.03, 0.38]} />
              <meshStandardMaterial color="#121212" roughness={0.3} metalness={0.9} />
            </mesh>
            {/* STO wing tips */}
            <mesh position={[-0.95, -0.06, 0]}>
              <boxGeometry args={[0.03, 0.15, 0.42]} />
              <meshStandardMaterial color={paintColor} roughness={0.15} metalness={0.9} />
            </mesh>
            <mesh position={[0.95, -0.06, 0]}>
              <boxGeometry args={[0.03, 0.15, 0.42]} />
              <meshStandardMaterial color={paintColor} roughness={0.15} metalness={0.9} />
            </mesh>
          </group>

          {/* Roof Scoop and Central Stability Fin */}
          <group position={[0, 1.23, -0.6]}>
            {/* Scoop duct intake */}
            <mesh position={[0, 0.05, 0.7]} rotation={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.34, 0.12, 0.4]} />
              <meshStandardMaterial color="#1d1d1d" roughness={0.3} />
            </mesh>
            {/* Fin stretching back down to the engine area */}
            <mesh position={[0, 0.01, -0.3]} castShadow>
              <boxGeometry args={[0.03, 0.28, 1.2]} />
              <meshStandardMaterial color="#121212" roughness={0.25} />
            </mesh>
          </group>

          {/* STO Dual Bonnet Hood Air Vents */}
          <group position={[0, 0.48, 1.3]}>
            <mesh position={[-0.34, 0.02, 0.2]}>
              <boxGeometry args={[0.26, 0.025, 0.4]} />
              <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            <mesh position={[0.34, 0.02, 0.2]}>
              <boxGeometry args={[0.26, 0.025, 0.4]} />
              <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
          </group>
        </group>
      )}

      {modelId === 'aventador' && (
        /* AVENTADOR SVJ SHARP BODY LINES & MASSIVE FIXED WING */
        <group>
          {/* SVJ SV Wing with central ALA intake strut */}
          <group position={[0, 1.35, -1.9]}>
            {/* Center intake strut */}
            <mesh position={[0, -0.22, 0.0]} rotation={[-0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.15, 0.45, 0.18]} />
              <meshStandardMaterial color="#111" roughness={0.3} />
            </mesh>
            {/* Outer struts */}
            <mesh position={[-0.7, -0.22, 0]} rotation={[0.4, 0, -0.1]} castShadow>
              <boxGeometry args={[0.03, 0.45, 0.1]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
            </mesh>
            <mesh position={[0.7, -0.22, 0]} rotation={[0.4, 0, 0.1]} castShadow>
              <boxGeometry args={[0.03, 0.45, 0.1]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
            </mesh>
            {/* Main wing blade */}
            <mesh castShadow>
              <boxGeometry args={[1.96, 0.03, 0.4]} />
              <meshPhysicalMaterial color={paintColor} roughness={0.15} metalness={0.9} clearcoat={1.0} />
            </mesh>
            {/* Center aerodynamic split lip */}
            <mesh position={[0, 0.025, 0.02]}>
              <boxGeometry args={[0.4, 0.035, 0.2]} />
              <meshStandardMaterial color="#121212" roughness={0.4} />
            </mesh>
          </group>

          {/* SVJ Front Hood Twin Split Vent Grids */}
          <group position={[0, 0.49, 1.25]}>
            <mesh position={[-0.18, 0.02, 0.3]}>
              <boxGeometry args={[0.12, 0.021, 0.22]} />
              <meshStandardMaterial color="#1c1c1c" roughness={0.9} />
            </mesh>
            <mesh position={[0.18, 0.02, 0.3]}>
              <boxGeometry args={[0.12, 0.021, 0.22]} />
              <meshStandardMaterial color="#1c1c1c" roughness={0.9} />
            </mesh>
          </group>
        </group>
      )}


      {/* 8. TRADITIONAL HEADLIGHTS & EMBLEMS */}
      {/* Laser headlights (bright glowing white nodes) */}
      <mesh position={[-0.8, 0.4, 1.95]}>
        <boxGeometry args={[0.15, 0.04, 0.08]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.8, 0.4, 1.95]}>
        <boxGeometry args={[0.15, 0.04, 0.08]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Gold brand shield nose emblem */}
      <mesh position={[0, 0.495, 1.92]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.05, 0.06, 0.01]} />
        <meshStandardMaterial color="#FFB300" roughness={0.1} metalness={1.0} />
      </mesh>

      {/* Rear continuous single LED brake string */}
      <mesh position={[0, 0.72, -2.12]}>
        <boxGeometry args={[1.7, 0.02, 0.02]} />
        <meshBasicMaterial color="#FF0000" toneMapped={false} />
      </mesh>
      {/* Secondary rear taillight blocks */}
      <mesh position={[-0.75, 0.68, -2.11]}>
        <boxGeometry args={[0.18, 0.04, 0.02]} />
        <meshBasicMaterial color="#FF0000" toneMapped={false} />
      </mesh>
      <mesh position={[0.75, 0.68, -2.11]}>
        <boxGeometry args={[0.18, 0.04, 0.02]} />
        <meshBasicMaterial color="#FF0000" toneMapped={false} />
      </mesh>
        </group>
      )}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2.2}
        maxDistance={11}
        onStart={() => {
          shouldLerpRef.current = false;
          onInteractionChange?.(true);
        }}
        onEnd={() => {
          onInteractionChange?.(false);
        }}
      />
    </>
  );
}
