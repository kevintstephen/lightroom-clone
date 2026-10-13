import type { Photo, ImageAdjustments, Preset } from '../types';
import { Slider } from './Slider';
import { Sparkles, Download, RotateCcw, Undo2 } from 'lucide-react';

interface PhotoEditorProps {
  photo: Photo;
  adjustments: ImageAdjustments;
  onUpdateAdjustments: (adjustments: ImageAdjustments) => void;
  onApplyPreset: (preset: Preset) => void;
  onReset: () => void;
  onRevertToOriginal: () => void;
  onDownload: () => void;
  presets: Preset[];
}

export default function PhotoEditor({
  photo,
  adjustments,
  onUpdateAdjustments,
  onApplyPreset,
  onReset,
  onRevertToOriginal,
  onDownload,
  presets,
}: PhotoEditorProps) {
  const handleSliderChange = (key: keyof ImageAdjustments, value: number) => {
    onUpdateAdjustments({ ...adjustments, [key]: value });
  };

  const getFilterStyle = () => {
    const { brightness, contrast, saturation, exposure, temperature, tint, blur } = adjustments;
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
    const { temperature, tint, highlights, shadows, vignette } = adjustments;
    
    // Temperature: warm (orange) or cool (blue) overlay
    const tempColor = temperature > 0
      ? `rgba(255, 140, 0, ${Math.abs(temperature) / 200})` // warm
      : `rgba(0, 100, 255, ${Math.abs(temperature) / 200})`; // cool
    
    // Tint: green or magenta overlay
    const tintColor = tint > 0
      ? `rgba(0, 255, 0, ${Math.abs(tint) / 200})` // green
      : `rgba(255, 0, 255, ${Math.abs(tint) / 200})`; // magenta

    // Highlights and shadows using SVG-like approach
    const highlightColor = highlights > 0
      ? `rgba(255, 255, 255, ${highlights / 200})`
      : `rgba(0, 0, 0, ${Math.abs(highlights) / 200})`;
    
    const shadowColor = shadows > 0
      ? `rgba(0, 0, 0, ${shadows / 200})`
      : `rgba(255, 255, 255, ${Math.abs(shadows) / 200})`;

    return {
      background: `
        radial-gradient(circle, transparent ${50 - vignette / 4}%, rgba(0,0,0,${vignette / 100}) 100%),
        linear-gradient(to bottom, ${highlightColor}, transparent, ${shadowColor}),
        ${tempColor},
        ${tintColor}
      `,
    };
  };

  return (
    <div className="flex gap-6">
      {/* Image Preview */}
      <div className="flex-1">
        <div className="bg-gray-800 rounded-lg p-4 relative">
          <div
            className="w-full h-auto max-h-[70vh] object-contain rounded relative overflow-hidden"
            style={getOverlayStyle()}
          >
            <img
              src={photo.url}
              alt={photo.name}
              style={getFilterStyle()}
              className="w-full h-auto max-h-[70vh] object-contain"
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
            onClick={onRevertToOriginal}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Revert to original photo"
          >
            <Undo2 className="w-4 h-4" />
            Original
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
