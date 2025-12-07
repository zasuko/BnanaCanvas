import React from 'react';
import type { ImageFile } from '../types';
import DownloadIcon from './icons/DownloadIcon';

interface SessionGalleryProps {
  gallery: ImageFile[][];
  activeIndex: number | null;
  onSelect: (index: number) => void;
  onDownloadAll: () => void;
  isZipping: boolean;
}

const SessionGallery: React.FC<SessionGalleryProps> = ({ gallery, activeIndex, onSelect, onDownloadAll, isZipping }) => {
  if (gallery.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-text-main">Session Gallery</h2>
        <button
          onClick={onDownloadAll}
          disabled={isZipping}
          className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          <span>{isZipping ? 'Zipping...' : 'Download All as ZIP'}</span>
        </button>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-3 bg-surface rounded-lg border border-border-color">
        {gallery.map((history, index) => {
          const thumbnail = history[0];
          const editCount = history.length - 1;
          const isActive = index === activeIndex;

          return (
            <div
              key={index}
              onClick={() => onSelect(index)}
              className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${isActive ? 'border-primary' : 'border-transparent'} hover:border-primary/70 transition-all group`}
              aria-label={`Select image ${index + 1}`}
            >
              <img src={thumbnail.base64} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover" />
              {editCount > 0 && (
                <div className="absolute top-1 right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center pointer-events-none">
                  {editCount}
                </div>
              )}
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <p className="text-white text-sm font-bold">View</p>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionGallery;
