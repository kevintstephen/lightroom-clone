import { useState, useRef, useEffect } from 'react';
import type { Photo, ImageAdjustments, Preset } from './types';
import { defaultAdjustments } from './types';
import { Upload, Image as ImageIcon, Sliders } from 'lucide-react';
import PhotoLibrary from './components/PhotoLibrary';
import PhotoEditor from './components/PhotoEditor';
import { cn } from './lib/utils';
import {
  loadPhotos,
  savePhoto,
  deletePhotoRecord,
  toStoredPhoto,
  loadPresets,
  savePreset,
  deletePresetRecord,
} from './lib/db';
import { parseXmpPreset } from './lib/presets';
import { analyzeLookImage } from './lib/analyze';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<Photo[]>([]);
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    loadPhotos()
      .then((stored) => {
        setPhotos(
          stored.map((p) => {
            const url = URL.createObjectURL(p.blob);
            return { ...p, url, originalUrl: url };
          })
        );
      })
      .catch((err) => console.warn('Could not load photo library:', err))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    loadPresets()
      .then(setCustomPresets)
      .catch((err) => console.warn('Could not load presets:', err));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const newPhoto: Photo = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        originalUrl: url,
        blob: file,
        dateAdded: new Date(),
        adjustments: { ...defaultAdjustments },
      };
      setPhotos((prev) => [...prev, newPhoto]);
      savePhoto(toStoredPhoto(newPhoto)).catch((err) =>
        console.warn('Could not save photo:', err)
      );
    });

    e.target.value = '';
  };

  const handleSelectPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setView('editor');
  };

  const handleToggleSelect = (photo: Photo) => {
    const next = selectedIds.includes(photo.id)
      ? selectedIds.filter((id) => id !== photo.id)
      : [...selectedIds, photo.id];
    setSelectedIds(next);
    setSelectedPhoto(photos.find((p) => p.id === next[0]) ?? null);
  };

  const handleSyncPhotos = () => {
    if (selectedIds.length < 2) return;
    const source = photos.find((p) => p.id === selectedIds[0]);
    if (!source) return;
    const targetIds = new Set(selectedIds.slice(1));

    const updated = photos
      .filter((p) => targetIds.has(p.id))
      .map((p) => ({ ...p, adjustments: { ...source.adjustments } }));
    setPhotos((prev) =>
      prev.map((p) =>
        targetIds.has(p.id) ? { ...p, adjustments: { ...source.adjustments } } : p
      )
    );
    if (selectedPhoto && targetIds.has(selectedPhoto.id)) {
      setSelectedPhoto({ ...selectedPhoto, adjustments: { ...source.adjustments } });
    }
    updated.forEach((p) =>
      savePhoto(toStoredPhoto(p)).catch((err) =>
        console.warn('Could not save synced adjustments:', err)
      )
    );
  };

  const handleClearSelection = () => setSelectedIds([]);

  const handleUpdateAdjustments = (adjustments: ImageAdjustments) => {
    if (!selectedPhoto) return;
    const photoId = selectedPhoto.id;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, adjustments } : p
      )
    );
    setSelectedPhoto({ ...selectedPhoto, adjustments });

    const timers = saveTimersRef.current;
    const existing = timers.get(photoId);
    if (existing) clearTimeout(existing);
    timers.set(
      photoId,
      setTimeout(() => {
        timers.delete(photoId);
        const photo = photosRef.current.find((p) => p.id === photoId);
        if (photo) {
          savePhoto(toStoredPhoto(photo)).catch((err) =>
            console.warn('Could not save adjustments:', err)
          );
        }
      }, 500)
    );
  };

  const handleApplyPreset = (preset: Preset) => {
    if (!selectedPhoto) return;
    handleUpdateAdjustments(preset.adjustments);
  };

  const handleResetAdjustments = () => {
    if (!selectedPhoto) return;
    handleUpdateAdjustments({ ...defaultAdjustments });
  };

  const handleImportPresets = (files: FileList) => {
    Array.from(files).forEach(async (file) => {
      try {
        const preset = parseXmpPreset(file.name, await file.text());
        if (!preset) {
          console.warn(`Could not parse preset: ${file.name}`);
          return;
        }
        setCustomPresets((prev) => [...prev, preset]);
        savePreset(preset).catch((err) =>
          console.warn('Could not save preset:', err)
        );
      } catch (err) {
        console.warn(`Could not import preset ${file.name}:`, err);
      }
    });
  };

  const handleExtractLook = async (file: File) => {
    try {
      const adjustments = await analyzeLookImage(file);
      const preset: Preset = {
        id: crypto.randomUUID(),
        name: `Look: ${file.name.replace(/\.[^.]+$/, '')}`,
        adjustments,
        custom: true,
      };
      setCustomPresets((prev) => [...prev, preset]);
      savePreset(preset).catch((err) =>
        console.warn('Could not save preset:', err)
      );
      if (selectedPhoto) handleApplyPreset(preset);
    } catch (err) {
      console.warn(`Could not analyze ${file.name}:`, err);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
    deletePresetRecord(presetId).catch((err) =>
      console.warn('Could not delete preset:', err)
    );
  };

  const handleDeletePhoto = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (photo) URL.revokeObjectURL(photo.url);

    const pending = saveTimersRef.current.get(photoId);
    if (pending) {
      clearTimeout(pending);
      saveTimersRef.current.delete(photoId);
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setSelectedIds((prev) => prev.filter((id) => id !== photoId));
    deletePhotoRecord(photoId).catch((err) =>
      console.warn('Could not delete photo:', err)
    );
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
      setView('library');
    }
  };

  const handleDownloadPhoto = (url: string) => {
    if (!selectedPhoto) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `edited-${selectedPhoto.name}`;
    link.click();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="shrink-0 bg-neutral-900 border-b border-neutral-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-accent" />
            <h1 className="text-lg font-semibold tracking-tight">Aperture</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setView('library');
                setSelectedPhoto(null);
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm transition-colors',
                view === 'library'
                  ? 'bg-accent text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              )}
            >
              <ImageIcon className="w-4 h-4" />
              Library
            </button>
            <button
              onClick={() => selectedPhoto && setView('editor')}
              disabled={!selectedPhoto}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm transition-colors',
                view === 'editor'
                  ? 'bg-accent text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300',
                !selectedPhoto && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Sliders className="w-4 h-4" />
              Editor
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm bg-accent hover:bg-accent-hover text-white transition-colors"
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
      <main className="flex-1 min-h-0 overflow-y-auto">
        {view === 'library' ? (
          <div className="max-w-[1600px] mx-auto p-6">
            <PhotoLibrary
              photos={photos}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onOpenPhoto={handleSelectPhoto}
              onDeletePhoto={handleDeletePhoto}
              onSync={handleSyncPhotos}
              onClearSelection={handleClearSelection}
            />
            {/* Loading State */}
            {!loaded && (
              <div className="flex items-center justify-center py-20 text-neutral-500">
                <p>Loading library...</p>
              </div>
            )}
            {/* Empty State */}
            {loaded && photos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <ImageIcon className="w-20 h-20 mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-neutral-300">No photos yet</h2>
                <p className="mb-6">Import photos to get started</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover rounded-md text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import Photos
                </button>
              </div>
            )}
          </div>
        ) : (
          selectedPhoto && (
            <div className="h-full max-w-[1600px] mx-auto p-6">
              <PhotoEditor
                photo={selectedPhoto}
                adjustments={selectedPhoto.adjustments}
                onUpdateAdjustments={handleUpdateAdjustments}
                onApplyPreset={handleApplyPreset}
                onReset={handleResetAdjustments}
                onDownload={handleDownloadPhoto}
                onImportPresets={handleImportPresets}
                onExtractLook={handleExtractLook}
                onDeletePreset={handleDeletePreset}
                presets={[...presets, ...customPresets]}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
