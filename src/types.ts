export interface BrandModel {
  id: string;
  name: string;
  hp: string;
  zeroToSixty: string;
  topSpeed: string;
  modelUrl: string;
}

export interface BrandColor {
  name: string;
  hex: string;
}

export type CameraView = 'front-3/4' | 'side' | 'engine' | 'interior';
