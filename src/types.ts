export interface Photo {
  id: string;
  name: string;
  url: string;
  originalUrl: string;
  dateAdded: Date;
  adjustments: ImageAdjustments;
}

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  vignette: number;
  blur: number;
  sharpen: number;
}

export const defaultAdjustments: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vignette: 0,
  blur: 0,
  sharpen: 0,
};

export interface Preset {
  id: string;
  name: string;
  adjustments: ImageAdjustments;
}
