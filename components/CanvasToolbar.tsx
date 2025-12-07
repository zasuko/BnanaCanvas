import React, { useRef } from 'react';
import { PEN_COLORS } from '../constants';
import type { CanvasTool, PenColor, ImageFile } from '../types';
import EraserIcon from './icons/EraserIcon';
import UndoIcon from './icons/UndoIcon';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';

interface CanvasToolbarProps {
  penSize: number;
  onPenSizeChange: (size: number) => void;
  penColor: string;
  onPenColorChange: (color: string) => void;
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onUndo: () => void;
  onClear: () => void;
  referenceImages: (ImageFile | null)[];
  onDownloadSketch: () => void;
  isSketchEmpty: boolean;
  onUploadReference: (file: ImageFile) => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  penSize,
  onPenSizeChange,
  penColor,
  onPenColorChange,
  tool,
  onToolChange,
  onUndo,
  onClear,
  referenceImages,
  onDownloadSketch,
  isSketchEmpty,
  onUploadReference
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            onUploadReference({ base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
      }
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm flex flex-col gap-4 mb-4">
      {/* Tools and Size */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onToolChange('pen')}
                className={`p-3 rounded-xl transition-all shadow-sm ${tool === 'pen' ? 'bg-primary text-white shadow-primary/30' : 'bg-white text-text-secondary hover:bg-primary/10'}`}
                aria-label="Pen tool"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
            </button>
            <button 
                onClick={() => onToolChange('eraser')}
                className={`p-3 rounded-xl transition-all shadow-sm ${tool === 'eraser' ? 'bg-primary text-white shadow-primary/30' : 'bg-white text-text-secondary hover:bg-primary/10'}`}
                aria-label="Eraser tool"
            >
                <EraserIcon className="h-6 w-6"/>
            </button>
            
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-white border border-border-color text-text-secondary hover:bg-secondary/20 hover:text-green-700 flex items-center gap-2 px-5 shadow-sm transition-colors"
                aria-label="Upload Reference Work"
                title="Upload Reference Work / Background"
            >
                <UploadIcon className="h-6 w-6" />
                <span className="text-sm font-bold hidden md:inline">Ref Image</span>
            </button>

        </div>
        <div className="flex-grow flex items-center gap-3">
            <label htmlFor="pen-size" className="text-sm font-bold text-text-secondary uppercase tracking-wider">Size</label>
            <input
                id="pen-size"
                type="range"
                min="1"
                max="50"
                value={penSize}
                onChange={(e) => onPenSizeChange(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
        </div>
      </div>
      
      {/* Colors and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mr-1">Color</span>
            {PEN_COLORS.map((color) => (
                <button
                    key={color.name}
                    onClick={() => {
                      onPenColorChange(color.hex);
                      onToolChange('pen');
                    }}
                    className={`h-9 w-9 rounded-full border-2 transition-transform transform hover:scale-110 shadow-sm ${penColor === color.hex && tool === 'pen' ? 'border-primary scale-110 ring-2 ring-primary/20' : 'border-white'}`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={`Color ${color.name}`}
                />
            ))}
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onUndo} className="p-3 rounded-xl bg-white border border-border-color text-text-secondary hover:bg-accent/20 hover:text-purple-600 shadow-sm transition-colors" aria-label="Undo">
                <UndoIcon className="h-5 w-5"/>
            </button>
            <button onClick={onClear} className="p-3 rounded-xl bg-white border border-border-color text-text-secondary hover:bg-red-50 hover:text-red-500 shadow-sm transition-colors" aria-label="Clear canvas">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button 
                onClick={onDownloadSketch}
                disabled={isSketchEmpty}
                className="p-3 rounded-xl bg-white border border-border-color text-text-secondary hover:bg-primary/10 hover:text-primary shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                aria-label="Download sketch"
            >
                <DownloadIcon className="h-5 w-5"/>
            </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasToolbar;