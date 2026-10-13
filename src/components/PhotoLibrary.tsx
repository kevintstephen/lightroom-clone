import { useState } from 'react';
import type { Photo } from '../types';
import { Trash2, Calendar, Check, X, RefreshCw } from 'lucide-react';
import {
  cn,
  getFilterStyle,
  getTemperatureStyle,
  getTintStyle,
  getVignetteStyle,
} from '../lib/utils';

interface PhotoLibraryProps {
  photos: Photo[];
  selectedIds: string[];
  onToggleSelect: (photo: Photo) => void;
  onOpenPhoto: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => void;
  onSync: () => void;
  onClearSelection: () => void;
}

export default function PhotoLibrary({
  photos,
  selectedIds,
  onToggleSelect,
  onOpenPhoto,
  onDeletePhoto,
  onSync,
  onClearSelection,
}: PhotoLibraryProps) {
  const [justSynced, setJustSynced] = useState(false);
  const selectedCount = selectedIds.length;

  const handleSync = () => {
    onSync();
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 1500);
  };

  return (
    <div className={selectedCount > 0 ? 'pb-20' : ''}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold tracking-tight">Photo Library</h2>
        <p className="text-sm text-neutral-500">
          {photos.length} photos · Click to select, double-click to edit
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => {
          const order = selectedIds.indexOf(photo.id);
          const isSelected = order !== -1;

          return (
            <div
              key={photo.id}
              className={cn(
                'group relative aspect-square bg-neutral-900 rounded-md overflow-hidden cursor-pointer transition-all',
                isSelected
                  ? 'ring-2 ring-accent'
                  : 'hover:ring-1 hover:ring-accent/60'
              )}
              onClick={(e) => {
                if (e.detail === 1) onToggleSelect(photo);
              }}
              onDoubleClick={() => onOpenPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.name}
                style={getFilterStyle(photo.adjustments)}
                className="w-full h-full object-cover"
              />
              {photo.adjustments.temperature !== 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={getTemperatureStyle(photo.adjustments)}
                />
              )}
              {photo.adjustments.tint !== 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={getTintStyle(photo.adjustments)}
                />
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={getVignetteStyle(photo.adjustments)}
              />
              {isSelected && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-[11px] font-semibold text-white">
                  {order + 1}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-medium truncate">{photo.name}</p>
                  <div className="flex items-center gap-1 text-xs text-neutral-300 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(photo.dateAdded).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePhoto(photo.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur border-t border-neutral-800 z-10">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedCount} photo{selectedCount > 1 ? 's' : ''} selected
              </span>
              <span className="text-xs text-neutral-500">
                Edits will copy from selection #1
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClearSelection}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleSync}
                disabled={selectedCount < 2}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm transition-colors',
                  justSynced
                    ? 'bg-emerald-700'
                    : 'bg-accent hover:bg-accent-hover',
                  selectedCount < 2 && 'opacity-40 cursor-not-allowed'
                )}
              >
                {justSynced ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {justSynced ? 'Synced' : 'Synchronize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
