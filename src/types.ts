export interface BrandModel {
  id: string;
  name: string;
  variant: string;
  description: string;
  accent: string;
  /** Numeric strings so the HUD can count them up without parsing units. */
  power: string;
  powerUnit: string;
  accel: string;
  accelUnit: string;
  vmax: string;
  vmaxUnit: string;
  /** Inspector / spec-sheet metadata. */
  file: string;
  size: string;
  meshes: number;
  year: string;
  engine: string;
  torque: string;
  weight: string;
  drivetrain: string;
  redline: string;
  /** Substring that identifies the body-paint material inside the GLB. */
  paintMaterial: string;
  paintRoughness: number;
  paintMetalness: number;
}

export type CameraView = 'front-3/4' | 'side' | 'engine' | 'interior';

export interface SceneSettings {
  wireframe: boolean;
  grid: boolean;
  shadows: boolean;
  autoRotate: boolean;
}

export interface RenderStats {
  fps: number;
  tris: number;
  calls: number;
  dpr: number;
}

export interface PaintOption {
  name: string;
  hex: string;
}
