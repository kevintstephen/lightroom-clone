import type { CurvePoint, ImageAdjustments, ToneCurves } from '../types';
import { defaultAdjustments } from '../types';

const MAX_SAMPLE_DIM = 256;
const CURVE_INPUTS = [0, 32, 64, 96, 128, 160, 192, 224, 255];
const TYPICAL_COLORFULNESS = 35;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Histogram specification: curve maps input percentile -> reference's value
// at that percentile (inverse CDF), assuming roughly uniform input.
function channelCurvePoints(hist: Uint32Array, total: number): CurvePoint[] {
  const cdf = new Float64Array(256);
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    cdf[v] = acc / total;
  }
  return CURVE_INPUTS.map((x) => {
    const target = x / 255;
    let v = 0;
    while (v < 255 && cdf[v] < target) v++;
    return { x, y: v };
  });
}

export async function analyzeLookImage(file: Blob): Promise<ImageAdjustments> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SAMPLE_DIM / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const histR = new Uint32Array(256);
    const histG = new Uint32Array(256);
    const histB = new Uint32Array(256);
    let sumRg = 0;
    let sumYb = 0;
    let sumRgSq = 0;
    let sumYbSq = 0;
    const n = w * h;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      histR[r]++;
      histG[g]++;
      histB[b]++;
      const rg = r - g;
      const yb = (r + g) / 2 - b;
      sumRg += rg;
      sumYb += yb;
      sumRgSq += rg * rg;
      sumYbSq += yb * yb;
    }

    const toneCurve: ToneCurves = {
      red: channelCurvePoints(histR, n),
      green: channelCurvePoints(histG, n),
      blue: channelCurvePoints(histB, n),
    };

    // Hasler-Suesstrunk colorfulness metric -> saturation slider estimate
    const muRg = sumRg / n;
    const muYb = sumYb / n;
    const sdRg = Math.sqrt(sumRgSq / n - muRg * muRg);
    const sdYb = Math.sqrt(sumYbSq / n - muYb * muYb);
    const colorfulness =
      Math.sqrt(sdRg * sdRg + sdYb * sdYb) +
      0.3 * Math.sqrt(muRg * muRg + muYb * muYb);

    return {
      ...defaultAdjustments,
      saturation: Math.max(
        -100,
        Math.min(100, Math.round((colorfulness / TYPICAL_COLORFULNESS - 1) * 100))
      ),
      toneCurve,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
