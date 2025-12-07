import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageFile } from '../types';
import EraserIcon from './icons/EraserIcon';
import DownloadIcon from './icons/DownloadIcon';
import UndoIcon from './icons/UndoIcon';

interface ResultDisplayProps {
  isLoading: boolean;
  generatedImage: ImageFile | null;
  error: string | null;
  onInpaint: (prompt: string, mask: ImageFile) => void;
  isInpainting: boolean;
  inpaintingResult: ImageFile | null;
  inpaintingError: string | null;
  onClearInpaintingError: () => void;
  onUndoInpaint: () => void;
  canUndoInpaint: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  isLoading,
  generatedImage,
  error,
  onInpaint,
  isInpainting,
  inpaintingResult,
  inpaintingError,
  onClearInpaintingError,
  onUndoInpaint,
  canUndoInpaint,
}) => {
  const [isMasking, setIsMasking] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const history = useRef<ImageData[]>([]);

  const displayImage = inpaintingResult || generatedImage;

  const getContext = (): CanvasRenderingContext2D | null => {
    return canvasRef.current ? canvasRef.current.getContext('2d') : null;
  };

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (canvas && context) {
      history.current.push(context.getImageData(0, 0, canvas.width, canvas.height));
    }
  }, []);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && image && displayImage) {
      const { naturalWidth, naturalHeight } = image;
      const { width, height } = image.getBoundingClientRect();
      
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = getContext();
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        history.current = [context.getImageData(0, 0, canvas.width, canvas.height)];
      }
    }
  }, [displayImage]);

  useEffect(() => {
    if (displayImage && isMasking) {
        const image = imageRef.current;
        const observer = new ResizeObserver(() => {
            resetCanvas();
        });
        if(image) {
            observer.observe(image);
        }
        return () => {
            if(image) {
                observer.unobserve(image);
            }
        };
    }
  }, [displayImage, isMasking, resetCanvas]);

  useEffect(() => {
    if (isMasking) {
      resetCanvas();
    }
  }, [isMasking, resetCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): {x: number, y: number} | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return {x, y};
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e); // Draw a point on click
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    
    const context = getContext();
    if (!context) return;

    context.fillStyle = 'rgba(255, 143, 171, 0.7)'; // Primary pink semi-transparent
    context.beginPath();
    context.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  };
  
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  }, [isDrawing, saveState]);

  const handleInpaint = () => {
    const canvas = canvasRef.current;
    if (!canvas || !inpaintPrompt || !displayImage) return;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (maskCtx) {
      maskCtx.fillStyle = '#000000';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskCtx.drawImage(canvas, 0, 0);

      const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
          // Check for pinkish color (R > 100, G < 200, B > 100 approx)
          if (data[i] > 100 && data[i+3] > 0) {
              data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
          } else {
              data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
          }
          data[i+3] = 255;
      }
      maskCtx.putImageData(imageData, 0, 0);
      
      const mimeType = 'image/png';
      const base64 = maskCanvas.toDataURL(mimeType);
      onInpaint(inpaintPrompt, { base64, mimeType });
      setIsMasking(false);
    }
  };
  
  const undoMask = () => {
    if (history.current.length > 1) { // Can't undo the initial blank state
      history.current.pop();
      const context = getContext();
      const canvas = canvasRef.current;
      if (context && canvas) {
        context.putImageData(history.current[history.current.length - 1], 0, 0);
      }
    }
  };

  const clearMask = () => {
    resetCanvas();
  };

  const handleDownload = (image: ImageFile | null) => {
    if (!image) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Format: BC_YYYY-MM-DD-HHMM as per user's example
    const filename = `BC_${year}-${month}-${day}-${hours}${minutes}.png`;
    
    const link = document.createElement('a');
    link.href = image.base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentError = inpaintingError || error;
  const currentLoading = isInpainting || isLoading;

  const renderContent = () => {
    if (currentLoading && !displayImage) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-20 h-20 border-8 border-dashed rounded-full animate-spin border-primary/30 border-t-primary"></div>
          <p className="text-primary font-bold animate-pulse text-2xl">{isLoading ? "Creating Magic..." : "Refining Artwork..."}</p>
        </div>
      );
    }

    if (currentError && !displayImage) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-red-400 font-bold text-xl">Oops!</p>
          <p className="text-text-secondary mt-2 max-w-xs text-base">{currentError}</p>
        </div>
      );
    }

    if (displayImage) {
      return (
        <div className="relative w-full h-full flex items-center justify-center group/imagedisplay p-2">
          <img
            ref={imageRef}
            src={displayImage.base64}
            alt={inpaintingResult ? "Inpainted result" : "Generated image"}
            className="object-contain w-full h-full max-w-full max-h-full rounded-lg shadow-sm"
            onLoad={resetCanvas}
          />
          <button
            onClick={() => handleDownload(displayImage)}
            className="absolute top-4 right-4 bg-white text-primary py-2 px-4 rounded-xl shadow-lg opacity-0 group-hover/imagedisplay:opacity-100 focus-within:opacity-100 hover:opacity-100 transition-all z-10 flex items-center gap-2 text-base font-bold hover:scale-105"
            aria-label="Download image"
          >
            <DownloadIcon className="w-5 h-5" />
            <span>Download</span>
          </button>
          {isMasking && (
             <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
          )}
          {isInpainting && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                <p className="text-primary font-bold text-xl">Inpainting...</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-32 h-32 bg-brand-bg rounded-full flex items-center justify-center mb-6">
            <svg className="w-16 h-16 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <p className="text-2xl font-bold text-text-main mb-3">Ready to Create!</p>
        <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
          Upload reference images, sketch a pose, or just write a prompt to start generating your artwork.
        </p>
      </div>
    );
  };
  
  return (
    <div className="h-full bg-white rounded-3xl border border-white shadow-lg shadow-pink-100/50 flex flex-col overflow-hidden">
      {/* Updated background pattern color to #fee176 */}
      <div className="flex-grow flex items-center justify-center overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZWUxNzYiLz48L3N2Zz4=')]">
        {renderContent()}
      </div>
      {generatedImage && !isLoading && (
        <div className="p-4 border-t border-border-color bg-white rounded-b-3xl">
           {isMasking ? (
             <>
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={inpaintPrompt}
                        onChange={(e) => setInpaintPrompt(e.target.value)}
                        placeholder="What should we change? (e.g., 'Add a red bow')"
                        className="w-full p-3 bg-brand-bg border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder-text-secondary text-base"
                    />
                    <div className="flex items-center gap-4">
                        <label htmlFor="brush-size" className="text-sm font-bold text-text-secondary">Brush</label>
                        <input
                            id="brush-size"
                            type="range"
                            min="10"
                            max="100"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                    {inpaintingError && <p className="text-sm text-red-400 font-medium bg-red-50 p-2 rounded-lg">{inpaintingError}</p>}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsMasking(false)} className="px-5 py-2.5 rounded-xl text-text-secondary font-bold hover:bg-gray-100 transition-colors text-base">Cancel</button>
                        <button onClick={undoMask} className="px-5 py-2.5 rounded-xl bg-gray-100 text-text-main font-bold hover:bg-gray-200 transition-colors text-base">Undo</button>
                        <button onClick={clearMask} className="px-5 py-2.5 rounded-xl bg-gray-100 text-text-main font-bold hover:bg-gray-200 transition-colors text-base">Clear</button>
                        <button 
                            onClick={handleInpaint} 
                            disabled={!inpaintPrompt || isInpainting}
                            className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all text-base"
                        >
                          {isInpainting ? 'Applying...' : 'Apply Magic'}
                        </button>
                    </div>
                </div>
             </>
           ) : (
            <>
              {inpaintingError && <p className="text-sm text-red-400 mb-2 font-medium">{inpaintingError}</p>}
              <div className="flex items-center justify-center gap-3">
                {canUndoInpaint && (
                  <button
                    onClick={onUndoInpaint}
                    className="flex-1 flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-2xl transition-all bg-white border border-border-color text-text-secondary hover:bg-gray-50 hover:text-text-main shadow-sm text-base"
                    aria-label="Undo last inpaint"
                  >
                    <UndoIcon className="w-5 h-5" />
                    <span>Undo</span>
                  </button>
                )}
                <button
                    onClick={() => { onClearInpaintingError(); setIsMasking(true); }}
                    className="flex-1 flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-2xl transition-all bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30 hover:-translate-y-0.5 text-base"
                >
                    <EraserIcon className="w-5 h-5"/>
                    <span>Magic Edit</span>
                </button>
              </div>
            </>
           )}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;