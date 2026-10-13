import type { Photo, ImageAdjustments, Preset, CurvePoint } from '../types';
import { Slider } from './Slider';
import { Sparkles, Download, RotateCcw, Upload, Wand, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { buildCurveLUT } from '../lib/curve';
import {
  getFilterStyle,
  getTemperatureStyle,
  getTintStyle,
  getVignetteStyle,
} from '../lib/utils';

interface PhotoEditorProps {
  photo: Photo;
  adjustments: ImageAdjustments;
  onUpdateAdjustments: (adjustments: ImageAdjustments) => void;
  onApplyPreset: (preset: Preset) => void;
  onReset: () => void;
  onDownload: (url: string) => void;
  onImportPresets: (files: FileList) => void;
  onExtractLook: (file: File) => void;
  onDeletePreset: (presetId: string) => void;
  presets: Preset[];
}

export default function PhotoEditor({
  photo,
  adjustments,
  onUpdateAdjustments,
  onApplyPreset,
  onReset,
  onDownload,
  onImportPresets,
  onExtractLook,
  onDeletePreset,
  presets,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presetInputRef = useRef<HTMLInputElement>(null);
  const lookInputRef = useRef<HTMLInputElement>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string>(photo.url);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = (key: keyof ImageAdjustments, value: number) => {
    onUpdateAdjustments({ ...adjustments, [key]: value });
  };

  const handleClearCurve = () => {
    const rest = { ...adjustments };
    delete rest.toneCurve;
    onUpdateAdjustments(rest);
  };

  const curvePolyline = (pts?: CurvePoint[]): string => {
    if (!pts) return '';
    const lut = buildCurveLUT(pts);
    let s = `0,${100 - (lut[0] / 255) * 100}`;
    for (let i = 4; i < 256; i += 4) {
      s += ` ${(i / 255) * 100},${100 - (lut[i] / 255) * 100}`;
    }
    return s;
  };

  // Process image with canvas for highlights and shadows (debounced)
  const processImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const curves = adjustments.toneCurve;
    const luts = curves
      ? {
          rgb: curves.rgb ? buildCurveLUT(curves.rgb) : undefined,
          red: curves.red ? buildCurveLUT(curves.red) : undefined,
          green: curves.green ? buildCurveLUT(curves.green) : undefined,
          blue: curves.blue ? buildCurveLUT(curves.blue) : undefined,
        }
      : null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (adjustments.highlights !== 0 || adjustments.shadows !== 0 || luts) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate luminosity (perceived brightness)
          const luminosity = 0.299 * r + 0.587 * g + 0.114 * b;
          const normalizedLum = luminosity / 255;

          let newR = r, newG = g, newB = b;

          // Highlights: affect tones with high luminosity (upper 60%)
          if (adjustments.highlights !== 0 && normalizedLum > 0.4) {
            const highlightMask = Math.pow((normalizedLum - 0.4) / 0.6, 2); // Smooth curve
            const adjustment = adjustments.highlights * highlightMask * 2;
            newR = Math.min(255, Math.max(0, r + adjustment));
            newG = Math.min(255, Math.max(0, g + adjustment));
            newB = Math.min(255, Math.max(0, b + adjustment));
          }

          // Shadows: affect tones with low luminosity (lower 40%)
          if (adjustments.shadows !== 0 && normalizedLum < 0.6) {
            const shadowMask = Math.pow((0.6 - normalizedLum) / 0.6, 2); // Smooth curve
            const adjustment = adjustments.shadows * shadowMask * 2;
            newR = Math.min(255, Math.max(0, newR + adjustment));
            newG = Math.min(255, Math.max(0, newG + adjustment));
            newB = Math.min(255, Math.max(0, newB + adjustment));
          }

          if (luts) {
            newR = Math.round(newR);
            newG = Math.round(newG);
            newB = Math.round(newB);
            if (luts.rgb) {
              newR = luts.rgb[newR];
              newG = luts.rgb[newG];
              newB = luts.rgb[newB];
            }
            if (luts.red) newR = luts.red[newR];
            if (luts.green) newG = luts.green[newG];
            if (luts.blue) newB = luts.blue[newB];
          }

          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      setProcessedImageUrl(canvas.toDataURL());
    };
    img.src = photo.url;
  }, [photo.url, adjustments.highlights, adjustments.shadows, adjustments.toneCurve]);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      processImage();
    }, 150); // 150ms debounce delay

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [photo.url, adjustments.highlights, adjustments.shadows, adjustments.toneCurve]);

  const filterStyle = getFilterStyle(adjustments);

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Image Preview */}
      <div className="flex-1 min-w-0 min-h-0 bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <div className="relative w-full h-full overflow-hidden rounded flex items-center justify-center">
          <div className="relative">
            <img
              src={processedImageUrl}
              alt={photo.name}
              style={filterStyle}
              className="max-w-full max-h-[calc(100vh-190px)] object-contain"
              ref={(img) => {
                if (img) {
                  img.onload = () => {
                    // Trigger re-render to get dimensions
                  };
                }
              }}
            />
            {/* Temperature overlay */}
            {adjustments.temperature !== 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={getTemperatureStyle(adjustments)}
              />
            )}
            {/* Tint overlay */}
            {adjustments.tint !== 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={getTintStyle(adjustments)}
              />
            )}
            {/* Vignette overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={getVignetteStyle(adjustments)}
            />
          </div>
        </div>
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls Panel */}
      <div className="w-[340px] shrink-0 min-h-0 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-6">
        {/* Presets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Presets
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => lookInputRef.current?.click()}
                title="Extract a look from a reference photo"
                className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors"
              >
                <Wand className="w-3 h-3" />
                From photo
              </button>
              <button
                onClick={() => presetInputRef.current?.click()}
                title="Import .xmp preset"
                className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors"
              >
                <Upload className="w-3 h-3" />
                Import
              </button>
              <input
                ref={lookInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) onExtractLook(e.target.files[0]);
                  e.target.value = '';
                }}
              />
              <input
                ref={presetInputRef}
                type="file"
                accept=".xmp"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) onImportPresets(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <div key={preset.id} className="relative group">
                <button
                  onClick={() => onApplyPreset(preset)}
                  className="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm transition-colors"
                >
                  {preset.name}
                </button>
                {preset.custom && (
                  <button
                    onClick={() => onDeletePreset(preset.id)}
                    className="absolute -top-1 -right-1 p-1 bg-neutral-950 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tone Curve */}
        {adjustments.toneCurve && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Tone Curve</h3>
              <button
                onClick={handleClearCurve}
                className="text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                Clear
              </button>
            </div>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-28 bg-neutral-950 rounded-md"
            >
              <line x1="50" y1="0" x2="50" y2="100" stroke="#404040" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#404040" strokeWidth="0.5" />
              {adjustments.toneCurve.rgb && (
                <polyline
                  points={curvePolyline(adjustments.toneCurve.rgb)}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1.5"
                />
              )}
              {adjustments.toneCurve.red && (
                <polyline
                  points={curvePolyline(adjustments.toneCurve.red)}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1"
                />
              )}
              {adjustments.toneCurve.green && (
                <polyline
                  points={curvePolyline(adjustments.toneCurve.green)}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="1"
                />
              )}
              {adjustments.toneCurve.blue && (
                <polyline
                  points={curvePolyline(adjustments.toneCurve.blue)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                />
              )}
            </svg>
          </div>
        )}

        {/* Adjustments */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Adjustments</h3>
          <div className="space-y-4">
            <Slider
              label="Brightness"
              value={adjustments.brightness}
              onChange={(value) => handleSliderChange('brightness', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Contrast"
              value={adjustments.contrast}
              onChange={(value) => handleSliderChange('contrast', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Saturation"
              value={adjustments.saturation}
              onChange={(value) => handleSliderChange('saturation', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Exposure"
              value={adjustments.exposure}
              onChange={(value) => handleSliderChange('exposure', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Highlights"
              value={adjustments.highlights}
              onChange={(value) => handleSliderChange('highlights', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Shadows"
              value={adjustments.shadows}
              onChange={(value) => handleSliderChange('shadows', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Temperature"
              value={adjustments.temperature}
              onChange={(value) => handleSliderChange('temperature', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Tint"
              value={adjustments.tint}
              onChange={(value) => handleSliderChange('tint', value)}
              min={-100}
              max={100}
            />
            <Slider
              label="Vignette"
              value={adjustments.vignette}
              onChange={(value) => handleSliderChange('vignette', value)}
              min={0}
              max={100}
            />
            <Slider
              label="Blur"
              value={adjustments.blur}
              onChange={(value) => handleSliderChange('blur', value)}
              min={0}
              max={20}
              step={0.5}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-neutral-800">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => onDownload(processedImageUrl)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover rounded-md text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
