# GLB Model Integration Guide for Antigravity

This guide provides instructions for integrating real `.glb` 3D models of the Lamborghini supercars into the **Lamborghini Configurator** application.

---

## 1. Asset Storage Location

Put your compiled GLB files in a nested subfolder under public assets so that Vite serves them statically at root path:

*   **Path for Revuelto:** `/public/models/revuelto.glb` (Requested resolved path: `/models/revuelto.glb`)
*   **Path for Huracán STO:** `/public/models/huracan.glb` (Requested resolved path: `/models/huracan.glb`)
*   **Path for Aventador SVJ:** `/public/models/aventador.glb` (Requested resolved path: `/models/aventador.glb`)

*Note: If the `/public` or `/public/models/` directory does not exist, create it in the workspace root.*

---

## 2. Dynamic Detection Framework

The app is built with a **graceful dual-mode rendering system**:
1. It performs a quiet `HEAD` request to check if `/models/[modelId].glb` is available under the correct binary MIME type (`model/gltf-binary` or not containing `text/html`).
2. **If available:** It seamlessly mounts the interactive `GLTFAsset` model inside a React Three Fiber `Suspense` wrapper.
3. **If missing/fails:** It defaults to the premium, low-poly procedural fallback model of the spacecraft-like, high-contrast angular Lambos with complete custom-animated spoilers, rear lights, engine manifold bays, and doors.

---

## 3. Customizing the GLTF Traversal & Painting

The `GLTFAsset` component (defined in `src/components/ProceduralCar.tsx`) performs live texture/material traversal on load to paint the vehicle with the selected custom body color dynamic variables:

```typescript
function GLTFAsset({ url, color }: { url: string; color: string }) {
  const { scene } = useGLTF(url);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          const matName = (child.material.name || '').toLowerCase();
          const nodeName = (child.name || '').toLowerCase();
          
          // Paint matching heuristic matches body panels smoothly
          if (
            matName.includes('paint') ||
            matName.includes('body') ||
            matName.includes('car_paint') ||
            matName.includes('exterior') ||
            nodeName.includes('body') ||
            nodeName.includes('paint')
          ) {
            child.material = child.material.clone();
            child.material.color = colorObj;
            if ('roughness' in child.material) child.material.roughness = 0.15;
            if ('metalness' in child.material) child.material.metalness = 0.9;
            if ('clearcoat' in child.material) child.material.clearcoat = 1.0;
          }
        }
      }
    });
  }, [scene, colorObj]);

  return <primitive object={scene} scale={1.0} position={[0, 0, 0]} />;
}
```

### Steps for optimization:
*   Ensure that the GLB models have clear naming definitions for the exterior body panels (e.g. materials named `Body_Paint` or components named `mesh_body`).
*   If your models use a specific material name for exterior paint, simply update the conditional `matName.includes(...)` inside `ProceduralCar.tsx` to match that texture slot name.
