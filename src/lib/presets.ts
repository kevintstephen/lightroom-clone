import type { CurvePoint, ImageAdjustments, Preset, ToneCurves } from '../types';
import { defaultAdjustments } from '../types';

type NumericKey = keyof typeof defaultAdjustments;

const clamp = (v: number, min = -100, max = 100) =>
  Math.min(max, Math.max(min, Math.round(v)));

function getAttr(el: Element, name: string): string | null {
  const attr = Array.from(el.attributes).find((a) => a.localName === name);
  return attr?.value ?? null;
}

function getNum(el: Element, name: string): number | null {
  const raw = getAttr(el, name);
  if (raw === null) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

function getCurve(desc: Element, tag: string): CurvePoint[] | undefined {
  const el = desc.getElementsByTagNameNS('*', tag)[0];
  if (!el) return undefined;
  const pts = Array.from(el.getElementsByTagNameNS('*', 'li'))
    .map((li) => {
      const [x, y] = (li.textContent ?? '')
        .split(',')
        .map((s) => parseFloat(s.trim()));
      return { x, y };
    })
    .filter((p) => !isNaN(p.x) && !isNaN(p.y));
  return pts.length >= 2 ? pts : undefined;
}

export function parseXmpPreset(filename: string, text: string): Preset | null {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.querySelector('parsererror')) return null;
  const desc = doc.getElementsByTagNameNS('*', 'Description')[0];
  if (!desc) return null;

  const adjustments: ImageAdjustments = { ...defaultAdjustments };
  const apply = (attr: string, key: NumericKey, scale = 1) => {
    const n = getNum(desc, attr);
    if (n !== null) adjustments[key] = clamp(n * scale);
  };

  apply('Exposure', 'exposure', 20); // stops (-5..+5) -> slider (-100..+100)
  apply('Contrast', 'contrast');
  apply('Saturation', 'saturation');
  apply('Highlights', 'highlights');
  apply('Shadows', 'shadows');
  apply('Sharpness', 'sharpen');

  // White balance: incremental offsets preferred; absolute Kelvin maps around 5500K neutral
  const incTemp = getNum(desc, 'IncrementalTemperature');
  const absTemp = getNum(desc, 'Temperature');
  if (incTemp !== null) adjustments.temperature = clamp(incTemp);
  else if (absTemp !== null) adjustments.temperature = clamp((absTemp - 5500) / 50);

  // LR tint: + = magenta, - = green; ours is the inverse. Scale -150..+150 -> -100..+100
  const incTint = getNum(desc, 'IncrementalTint');
  const absTint = getNum(desc, 'Tint');
  if (incTint !== null) adjustments.tint = clamp(-incTint * (2 / 3));
  else if (absTint !== null) adjustments.tint = clamp(-absTint * (2 / 3));

  // LR vignette: negative darkens edges; ours only darkens (0..100)
  const vig = getNum(desc, 'PostCropVignetteAmount');
  if (vig !== null && vig < 0) adjustments.vignette = clamp(-vig, 0, 100);

  const toneCurve: ToneCurves = {
    rgb: getCurve(desc, 'ToneCurvePV2012'),
    red: getCurve(desc, 'ToneCurvePV2012Red'),
    green: getCurve(desc, 'ToneCurvePV2012Green'),
    blue: getCurve(desc, 'ToneCurvePV2012Blue'),
  };
  if (toneCurve.rgb || toneCurve.red || toneCurve.green || toneCurve.blue) {
    adjustments.toneCurve = toneCurve;
  }

  return {
    id: crypto.randomUUID(),
    name: filename.replace(/\.[^.]+$/, ''),
    adjustments,
    custom: true,
  };
}
