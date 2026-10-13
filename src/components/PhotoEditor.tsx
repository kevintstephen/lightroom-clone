import type { Photo, ImageAdjustments, Preset } from '../types';
import { Slider } from './Slider';
import { Sparkles, Download, RotateCcw } from 'lucide-react';

interface PhotoEditorProps {
  photo: Photo;
  adjustments: ImageAdjustments;
  onUpdateAdjustments: (adjustments: ImageAdjustments) => void;
  onApplyPreset: (preset: Preset) => void;
  onReset: () => void;
  onDownload: () => void;
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
  const handleSliderChange = (key: keyof ImageAdjustments, value: number) => {
    onUpdateAdjustments({ ...adjustments, [key]: value });
  };

  const getFilterStyle = () => {
    const { brightness, contrast, saturation, exposure, temperature, blur } = adjustments;
    return {
      filter: `
        brightness(${1 + (brightness + exposure) / 100})
        contrast(${1 + contrast / 100})
        saturate(${1 + saturation / 100})
        sepia(${temperature > 0 ? temperature / 400 : 0})
        hue-rotate(${temperature * 0.5}deg)
        blur(${blur}px)
      `,
    };
  };

  const getOverlayStyle = () => {
    const { tint, highlights, shadows, vignette } = adjustments;
    
    // Tint: green or magenta overlay
    let tintColor = '';
    if (tint > 0) {
      tintColor = `rgba(0, 255, 0, ${tint / 200})`; // green
    } else if (tint < 0) {
      tintColor = `rgba(255, 0, 255, ${Math.abs(tint) / 200})`; // magenta
    }

    // Highlights and shadows
    const highlightColor = highlights > 0
      ? `rgba(255, 255, 255, ${highlights / 200})`
      : `rgba(0, 0, 0, ${Math.abs(highlights) / 200})`;
    
    const shadowColor = shadows > 0
      ? `rgba(0, 0, 0, ${shadows / 200})`
      : `rgba(255, 255, 255, ${Math.abs(shadows) / 200})`;

    // Vignette - dark edges
    const vignetteStrength = vignette / 100;

    return {
      backgroundColor: tintColor || 'transparent',
      backgroundImage: `
        linear-gradient(to bottom, ${highlightColor}, transparent, ${shadowColor}),
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
          <div className="relative w-full h-auto max-h-[70vh] overflow-hidden rounded">
            <img
              src={photo.url}
              alt={photo.name}
              style={getFilterStyle()}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={getOverlayStyle()}
            />
          </div>
        </div>
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
            onClick={onDownload}
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
