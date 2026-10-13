export interface Photo {
  id: string;
  name: string;
  url: string;
  originalUrl: string;
  blob: Blob;
  dateAdded: Date;
  adjustments: ImageAdjustments;
}

export interface CurvePoint {
  x: number; // 0-255 input
  y: number; // 0-255 output
}

export interface ToneCurves {
  rgb?: CurvePoint[];
  red?: CurvePoint[];
  green?: CurvePoint[];
  blue?: CurvePoint[];
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
  toneCurve?: ToneCurves;
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
  custom?: boolean;
}
