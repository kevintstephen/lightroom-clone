import type { Photo } from '../types';
import { Trash2, Calendar } from 'lucide-react';

interface PhotoLibraryProps {
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => void;
}

export default function PhotoLibrary({ photos, onSelectPhoto, onDeletePhoto }: PhotoLibraryProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Photo Library</h2>
        <p className="text-gray-400">{photos.length} photos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
            onClick={() => onSelectPhoto(photo)}
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-medium truncate">{photo.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-300 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(photo.dateAdded).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.id);
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
