import { useState, useRef } from 'react';
import { Photo, ImageAdjustments, defaultAdjustments, Preset } from './types';
import { Upload, Image as ImageIcon, Sliders, Sparkles, Download, Trash2, RotateCcw } from 'lucide-react';
import PhotoLibrary from './components/PhotoLibrary';
import PhotoEditor from './components/PhotoEditor';
import { cn } from './lib/utils';

const presets: Preset[] = [
  {
    id: 'vivid',
    name: 'Vivid',
    adjustments: { ...defaultAdjustments, saturation: 30, contrast: 15, brightness: 5 }
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    adjustments: { ...defaultAdjustments, contrast: 30, saturation: -10, shadows: -20 }
  },
  {
    id: 'soft',
    name: 'Soft',
    adjustments: { ...defaultAdjustments, brightness: 10, contrast: -10, saturation: -15 }
  },
  {
    id: 'black-and-white',
    name: 'B&W',
    adjustments: { ...defaultAdjustments, saturation: -100, contrast: 20 }
  },
  {
    id: 'warm',
    name: 'Warm',
    adjustments: { ...defaultAdjustments, temperature: 20, saturation: 10 }
  },
  {
    id: 'cool',
    name: 'Cool',
    adjustments: { ...defaultAdjustments, temperature: -20, saturation: 5 }
  },
];

function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [view, setView] = useState<'library' | 'editor'>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newPhoto: Photo = {
          id: crypto.randomUUID(),
          name: file.name,
          url,
          originalUrl: url,
          dateAdded: new Date(),
          adjustments: { ...defaultAdjustments },
        };
        setPhotos((prev) => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSelectPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setView('editor');
  };

  const handleUpdateAdjustments = (adjustments: ImageAdjustments) => {
    if (!selectedPhoto) return;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === selectedPhoto.id ? { ...p, adjustments } : p
      )
    );
    setSelectedPhoto({ ...selectedPhoto, adjustments });
  };

  const handleApplyPreset = (preset: Preset) => {
    if (!selectedPhoto) return;
    handleUpdateAdjustments(preset.adjustments);
  };

  const handleResetAdjustments = () => {
    if (!selectedPhoto) return;
    handleUpdateAdjustments({ ...defaultAdjustments });
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
      setView('library');
    }
  };

  const handleDownloadPhoto = () => {
    if (!selectedPhoto) return;
    const link = document.createElement('a');
    link.href = selectedPhoto.url;
    link.download = `edited-${selectedPhoto.name}`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold">Lightroom Clone</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setView('library');
                setSelectedPhoto(null);
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                view === 'library' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              )}
            >
              <ImageIcon className="w-4 h-4" />
              Library
            </button>
            <button
              onClick={() => selectedPhoto && setView('editor')}
              disabled={!selectedPhoto}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                view === 'editor' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600',
                !selectedPhoto && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Sliders className="w-4 h-4" />
              Editor
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {view === 'library' ? (
          <PhotoLibrary
            photos={photos}
            onSelectPhoto={handleSelectPhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        ) : (
          selectedPhoto && (
            <PhotoEditor
              photo={selectedPhoto}
              adjustments={selectedPhoto.adjustments}
              onUpdateAdjustments={handleUpdateAdjustments}
              onApplyPreset={handleApplyPreset}
              onReset={handleResetAdjustments}
              onDownload={handleDownloadPhoto}
              presets={presets}
            />
          )
        )}
      </main>

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ImageIcon className="w-24 h-24 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No photos yet</h2>
          <p className="mb-6">Import photos to get started</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Import Photos
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
