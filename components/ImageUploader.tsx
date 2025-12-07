import React, { useState, useCallback, useRef } from 'react';
import type { ImageFile } from '../types';
import UploadIcon from './icons/UploadIcon';

interface ImageUploaderProps {
  index: number;
  imageFile: ImageFile | null;
  onImageChange: (index: number, file: ImageFile | null) => void;
  borderColor: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ index, imageFile, onImageChange, borderColor }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          onImageChange(index, { base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          onImageChange(index, { base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
      }
    }
  }, [index, onImageChange]);
  
  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onImageChange(index, null);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  // If the border color is White (#FFFFFF), use a visible gray (#CBD5E1) instead so the frame is visible.
  // Otherwise use the color directly.
  const displayBorderColor = borderColor.toUpperCase() === '#FFFFFF' ? '#cbd5e1' : borderColor;

  const borderClass = isDragging 
    ? 'border-primary bg-primary/5' 
    : 'hover:bg-white border-dashed bg-white';

  return (
    <div
      className={`relative aspect-square w-full rounded-2xl border-4 ${borderClass} transition-all duration-200 flex items-center justify-center cursor-pointer group shadow-sm`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileSelect}
      style={{ borderColor: isDragging ? undefined : displayBorderColor }}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
      />
      {imageFile ? (
        <>
          <img src={imageFile.base64} alt={`Reference ${index + 1}`} className="object-cover w-full h-full rounded-xl" />
          <button 
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
            aria-label="Remove image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <div className="text-center text-text-secondary">
          <UploadIcon className="h-10 w-10 mx-auto mb-2 opacity-50" style={{ color: displayBorderColor === '#cbd5e1' ? undefined : displayBorderColor }} />
          <p className="text-sm font-medium">Click to Add</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;