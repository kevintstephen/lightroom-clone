import type { CurvePoint } from '../types';

function catmullRom(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export function buildCurveLUT(points: CurvePoint[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  const pts = [...points].sort((a, b) => a.x - b.x);

  for (let x = 0; x < 256; x++) {
    if (x <= pts[0].x) {
      lut[x] = pts[0].y;
      continue;
    }
    if (x >= pts[pts.length - 1].x) {
      lut[x] = pts[pts.length - 1].y;
      continue;
    }

    let i = 0;
    while (i < pts.length - 2 && x > pts[i + 1].x) i++;
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p0 = i > 0 ? pts[i - 1] : p1;
    const p3 = i < pts.length - 2 ? pts[i + 2] : p2;
    const t = (x - p1.x) / (p2.x - p1.x || 1);
    lut[x] = catmullRom(t, p0.y, p1.y, p2.y, p3.y);
  }
  return lut;
}
