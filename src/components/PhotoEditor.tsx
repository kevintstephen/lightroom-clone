import type { Photo, ImageAdjustments, Preset } from '../types';
import { Slider } from './Slider';
import { Sparkles, Download, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PhotoEditorProps {
  photo: Photo;
  adjustments: ImageAdjustments;
  onUpdateAdjustments: (adjustments: ImageAdjustments) => void;
  onApplyPreset: (preset: Preset) => void;
  onReset: () => void;
  onDownload: (url: string) => void;
  presets: Preset[];
}

export default function PhotoEditor({
  photo,
  adjustments,
  onUpdateAdjustments,
  onApplyPreset,
  onReset,
  onDownload,
  presets,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string>(photo.url);

  const handleSliderChange = (key: keyof ImageAdjustments, value: number) => {
    onUpdateAdjustments({ ...adjustments, [key]: value });
  };

  // Process image with canvas for highlights and shadows
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;

          // Highlights: affect bright areas (brightness > 128)
          if (adjustments.highlights !== 0) {
            const highlightFactor = Math.max(0, (brightness - 128) / 127);
            const highlightAdjustment = adjustments.highlights * highlightFactor * 0.5;
            data[i] = Math.min(255, Math.max(0, r + highlightAdjustment));
            data[i + 1] = Math.min(255, Math.max(0, g + highlightAdjustment));
            data[i + 2] = Math.min(255, Math.max(0, b + highlightAdjustment));
          }

          // Shadows: affect dark areas (brightness < 128)
          if (adjustments.shadows !== 0) {
            const shadowFactor = Math.max(0, (127 - brightness) / 127);
            const shadowAdjustment = adjustments.shadows * shadowFactor * 0.5;
            data[i] = Math.min(255, Math.max(0, r + shadowAdjustment));
            data[i + 1] = Math.min(255, Math.max(0, g + shadowAdjustment));
            data[i + 2] = Math.min(255, Math.max(0, b + shadowAdjustment));
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      setProcessedImageUrl(canvas.toDataURL());
    };
    img.src = photo.url;
  }, [photo.url, adjustments.highlights, adjustments.shadows]);

  const getFilterStyle = () => {
    const { brightness, contrast, saturation, exposure, blur } = adjustments;
    return {
      filter: `
        brightness(${1 + (brightness + exposure) / 100})
        contrast(${1 + contrast / 100})
        saturate(${1 + saturation / 100})
        blur(${blur}px)
      `,
    };
  };

  const getOverlayStyle = () => {
    const { vignette } = adjustments;

    // Vignette - dark edges
    const vignetteStrength = vignette / 100;

    return {
      backgroundColor: 'transparent',
      backgroundImage: `
        radial-gradient(circle, transparent ${50 - vignetteStrength * 50}%, rgba(0,0,0,${vignetteStrength}) 100%)
      `,
      mixBlendMode: 'overlay' as const,
    };
  };

  return (
    <div className="flex gap-6">
      {/* Image Preview */}
      <div className="flex-1">
        <div className="bg-gray-800 rounded-lg p-4 relative">
          <div className="relative w-full h-auto max-h-[70vh] overflow-hidden rounded flex items-center justify-center">
            <div className="relative">
              <img
                src={processedImageUrl}
                alt={photo.name}
                style={getFilterStyle()}
                className="max-w-full max-h-[70vh] object-contain"
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
                  style={{
                    backgroundColor: adjustments.temperature > 0
                      ? `rgba(255, 160, 0, ${adjustments.temperature / 200})`
                      : `rgba(0, 100, 255, ${Math.abs(adjustments.temperature) / 200})`,
                    mixBlendMode: 'overlay' as const,
                  }}
                />
              )}
              {/* Tint overlay */}
              {adjustments.tint !== 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: adjustments.tint > 0
                      ? `rgba(0, 255, 0, ${adjustments.tint / 200})`
                      : `rgba(255, 0, 255, ${Math.abs(adjustments.tint) / 200})`,
                    mixBlendMode: 'overlay' as const,
                  }}
                />
              )}
              {/* Vignette overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={getOverlayStyle()}
              />
            </div>
          </div>
        </div>
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls Panel */}
      <div className="w-80 bg-gray-800 rounded-lg p-6 space-y-6">
        {/* Presets */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Presets
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

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
        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => onDownload(processedImage)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
