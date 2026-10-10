export interface BrandModel {
  id: string;
  name: string;
  variant: string;
  description: string;
  hp: string;
  acceleration: string;
  topSpeed: string;
}

export type CameraView = 'front-3/4' | 'side' | 'engine' | 'interior';
