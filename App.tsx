// Fix: Add a global declaration for `window.showDirectoryPicker` to resolve TypeScript error.
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ImageUploader from './components/ImageUploader';
import PoseCanvas, { PoseCanvasRef } from './components/PoseCanvas';
import AspectRatioSelector from './components/AspectRatioSelector';
import ResultDisplay from './components/ResultDisplay';
import CanvasToolbar from './components/CanvasToolbar';
import ReferenceWorkSection from './components/ReferenceWorkSection';
import ResolutionSelector from './components/ResolutionSelector';
import BackgroundSettings from './components/BackgroundSettings';
import { generateImage, inpaintImage } from './services/geminiService';
import type { AspectRatio, ImageFile, CanvasTool, Resolution, ExtractionFeature } from './types';
import { ASPECT_RATIO_OPTIONS, PEN_COLORS, RESOLUTION_OPTIONS, BACKGROUND_COLORS } from './constants';
import SessionGallery from './components/SessionGallery';
import JSZip from 'jszip';
import ChevronIcon from './components/icons/ChevronIcon';
import Decorations from './components/Decorations';
import ApiKeyModal from './components/ApiKeyModal';

const App: React.FC = () => {
  const [referenceImages, setReferenceImages] = useState<(ImageFile | null)[]>(Array(4).fill(null));
  const [poseImage, setPoseImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIO_OPTIONS[1]); // Default to 1:1
  const [resolution, setResolution] = useState<Resolution>('1K');
  
  // Reference Work State
  const [referenceWorkImage, setReferenceWorkImage] = useState<ImageFile | null>(null);
  const [extractionFeatures, setExtractionFeatures] = useState<ExtractionFeature[]>(['style', 'color']);
  // Store reference image dimensions for 'Adjust' mode
  const [referenceDimensions, setReferenceDimensions] = useState<{width: number, height: number} | null>(null);

  // Background Settings State
  const [isBackgroundRemoved, setIsBackgroundRemoved] = useState<boolean>(false);
  const [isColorBackground, setIsColorBackground] = useState<boolean>(false);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState<string>(BACKGROUND_COLORS[1].hex); // Default to Green

  // UI State
  const [isSketchExpanded, setIsSketchExpanded] = useState<boolean>(true);
  const [isDraggingSketch, setIsDraggingSketch] = useState<boolean>(false);

  const [sessionGallery, setSessionGallery] = useState<ImageFile[][]>([]);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [penSize, setPenSize] = useState(5);
  const [penColor, setPenColor] = useState(PEN_COLORS[0].hex);
  const [canvasTool, setCanvasTool] = useState<CanvasTool>('pen');
  const poseCanvasRef = useRef<PoseCanvasRef>(null);

  const [isInpainting, setIsInpainting] = useState<boolean>(false);
  const [inpaintingError, setInpaintingError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const [autoSaveDirectory, setAutoSaveDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [isCrossOrigin, setIsCrossOrigin] = useState<boolean>(false);
  const isFileSystemApiSupported = 'showDirectoryPicker' in window;

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
        if (window.self !== window.top) {
            setIsCrossOrigin(true);
        }
    } catch (e) {
        setIsCrossOrigin(true);
    }
  }, []);

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        setApiKey(storedKey);
    } else {
        setIsKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
      localStorage.setItem('gemini_api_key', key);
      setApiKey(key);
      setIsKeyModalOpen(false);
  };

  const handleOpenKeySettings = () => {
      setIsKeyModalOpen(true);
  };

  // Paste Event Listener for Reference Work
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
        // Do not intercept if user is typing in an input or textarea
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
        }
        
        // Only handle if Sketch section is expanded (optional UX choice, keeps it clean)
        if (!isSketchExpanded) return;

        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        processUploadedFile(file);
                        e.preventDefault(); // Prevent default paste behavior
                        return;
                    }
                }
            }
        }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
        window.removeEventListener('paste', handlePaste);
    };
  }, [isSketchExpanded]);

  const processUploadedFile = (file: File) => {
      if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const base64 = ev.target?.result as string;
              handleReferenceWorkUpload({ base64, mimeType: file.type });
          };
          reader.readAsDataURL(file);
      }
  };

  const activeImageHistory = activeGalleryIndex !== null ? sessionGallery[activeGalleryIndex] : [];
  const currentImage = activeImageHistory.length > 0 ? activeImageHistory[activeImageHistory.length - 1] : null;
  const generatedImage = activeImageHistory[0] || null;
  const inpaintingResult = activeImageHistory.length > 1 ? currentImage : null;

  const handleImageChange = useCallback((index: number, file: ImageFile | null) => {
    setReferenceImages(prev => {
      const newImages = [...prev];
      newImages[index] = file;
      return newImages;
    });
  }, []);

  const handleFeatureToggle = (feature: ExtractionFeature) => {
    setExtractionFeatures(prev => 
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };
  
  const handleReferenceWorkUpload = (file: ImageFile) => {
      setReferenceWorkImage(file);
      // Get dimensions for 'Adjust' mode logic
      const img = new Image();
      img.onload = () => {
          setReferenceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          // Force Aspect Ratio to Adjust to match the uploaded image
          setAspectRatio('Adjust');
      };
      img.src = file.base64;
  };
  
  const handleRemoveReferenceWork = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setReferenceWorkImage(null);
      setReferenceDimensions(null);
      // Optionally reset aspect ratio or keep it as is. Keeping it allows user to reset manually.
  };

  // Drag & Drop Handlers for Sketch Area
  const handleSketchDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingSketch(true);
  };

  const handleSketchDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingSketch(false);
  };

  const handleSketchDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingSketch(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processUploadedFile(e.dataTransfer.files[0]);
      }
  };

  const autoSaveImage = useCallback(async (imageFile: ImageFile) => {
    if (!autoSaveDirectory || isCrossOrigin) return;
    setAutoSaveError(null);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const filename = `BC_${year}-${month}-${day}-${hours}${minutes}.png`;
    
    try {
        const handle = await autoSaveDirectory.getFileHandle(filename, { create: true });
        const writable = await handle.createWritable();
        const response = await fetch(imageFile.base64);
        const blob = await response.blob();
        await writable.write(blob);
        await writable.close();
    } catch (err: any) {
        let errorMessage = "An unknown error occurred during auto-save.";
        if (err.name === 'NotAllowedError') {
            errorMessage = "Permission to save files was denied. Please select the folder again and grant access.";
        } else if (err.name === 'AbortError') {
            errorMessage = "File saving was cancelled.";
        }
        console.error("Auto-save failed:", err);
        setAutoSaveError(errorMessage);
        setAutoSaveDirectory(null); 
    }
  }, [autoSaveDirectory, isCrossOrigin]);

  const handleGenerate = async () => {
    if (!apiKey) {
        setIsKeyModalOpen(true);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const b64 = await generateImage(
        apiKey,
        prompt, 
        referenceImages, 
        poseImage, 
        referenceWorkImage,
        extractionFeatures,
        aspectRatio,
        resolution,
        {
            isRemoved: isBackgroundRemoved,
            isColor: isColorBackground,
            colorHex: selectedBackgroundColor
        }
      );
      const newImage: ImageFile = { base64: b64, mimeType: 'image/png' };
      
      setSessionGallery(prev => [...prev, [newImage]]);
      setActiveGalleryIndex(sessionGallery.length);
      autoSaveImage(newImage);

    } catch (e: any) {
       // Check for 403 or permission denied which often means invalid key
       if (e.message && (e.message.includes("403") || e.message.includes("API Key"))) {
           setIsKeyModalOpen(true);
           setError("Invalid API Key. Please update your key settings.");
       } else {
           setError(e.message || "An unknown error occurred");
       }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInpaint = async (inpaintPrompt: string, mask: ImageFile) => {
    if (activeGalleryIndex === null || !currentImage) return;
    if (!apiKey) {
        setIsKeyModalOpen(true);
        return;
    }

    setIsInpainting(true);
    setInpaintingError(null);
    try {
      const b64 = await inpaintImage(apiKey, inpaintPrompt, currentImage, mask);
      const newImage: ImageFile = { base64: b64, mimeType: 'image/png' };
      
      const newGallery = [...sessionGallery];
      newGallery[activeGalleryIndex] = [...newGallery[activeGalleryIndex], newImage];
      setSessionGallery(newGallery);
      autoSaveImage(newImage);

    } catch (e: any) {
        if (e.message && (e.message.includes("403") || e.message.includes("API Key"))) {
            setIsKeyModalOpen(true);
            setInpaintingError("Invalid API Key. Please update your key settings.");
        } else {
            setInpaintingError(e.message || "An unknown error occurred during inpainting.");
        }
    } finally {
      setIsInpainting(false);
    }
  };

  const handleUndoInpaint = () => {
    if (activeGalleryIndex === null || activeImageHistory.length <= 1) return;
    const newGallery = [...sessionGallery];
    newGallery[activeGalleryIndex] = newGallery[activeGalleryIndex].slice(0, -1);
    setSessionGallery(newGallery);
  };

  const handleSelectFolder = async () => {
    setAutoSaveError(null);
    if (!isFileSystemApiSupported) {
        setAutoSaveError("Your browser does not support the File System Access API.");
        return;
    }
    try {
        const handle = await window.showDirectoryPicker();
        setAutoSaveDirectory(handle);
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            setAutoSaveError("Could not get permission to access the folder.");
        }
    }
  };
  
  const handleDownloadAll = async () => {
      if (sessionGallery.length === 0 || isZipping) return;
      setIsZipping(true);
      setError(null);

      try {
          const zip = new JSZip();
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const dateStr = `${year}${month}${day}`;
          
          let counter = 1;
          for (let i = 0; i < sessionGallery.length; i++) {
              const history = sessionGallery[i];
              for (let j = 0; j < history.length; j++) {
                  const imageFile = history[j];
                  const seq = String(counter).padStart(5, '0');
                  const filename = `${dateStr}_${seq}.png`;
                  
                  const response = await fetch(imageFile.base64);
                  const blob = await response.blob();
                  
                  zip.file(filename, blob);
                  counter++;
              }
          }
          
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const zipFilename = `BC_Session_${year}-${month}-${day}-${hours}${minutes}.zip`;

          const link = document.createElement('a');
          link.href = URL.createObjectURL(zipBlob);
          link.download = zipFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      } catch (err) {
          console.error("Failed to create ZIP file:", err);
          setError("Failed to create ZIP file. Please try again.");
      } finally {
          setIsZipping(false);
      }
  };

  const handleDownloadSketch = () => {
    if (!poseImage) return;
    const now = new Date();
    const filename = `Sketch_${now.getTime()}.png`;
    const link = document.createElement('a');
    link.href = poseImage.base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate canvas style based on Aspect Ratio state
  const canvasStyle = useMemo(() => {
      if (aspectRatio === 'Adjust' && referenceDimensions) {
          return { aspectRatio: `${referenceDimensions.width} / ${referenceDimensions.height}` };
      }
      if (aspectRatio === 'Adjust' && !referenceDimensions) {
          return { aspectRatio: '1 / 1' }; // Fallback
      }
      return { aspectRatio: aspectRatio.replace(':', ' / ') };
  }, [aspectRatio, referenceDimensions]);

  return (
    <div className="min-h-screen bg-brand-bg text-text-main p-4 lg:p-8 font-sans selection:bg-primary selection:text-white">
      <Decorations />
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onSave={handleSaveApiKey} 
        onClose={() => setIsKeyModalOpen(false)}
        savedKey={apiKey}
      />
      
      <main className="max-w-screen-2xl mx-auto relative z-10">
        <header className="mb-12 relative">
          <div className="text-center">
             <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-800 drop-shadow-sm">
                <span className="text-primary inline-block transform hover:rotate-12 transition-transform duration-300">🍌</span> Banana <span className="text-primary">Canvas</span>
            </h1>
            <p className="mt-3 text-text-secondary font-medium flex items-center justify-center gap-2 text-lg">
                Create AI Art with Precision & Style
                <span className="text-sm bg-secondary text-white px-2 py-0.5 rounded-full font-bold shadow-sm">PRO</span>
            </p>
          </div>
          
          {/* Key Settings Button */}
          <button 
            onClick={handleOpenKeySettings}
            className="absolute top-0 right-0 p-2 bg-white/50 hover:bg-white rounded-full text-text-secondary hover:text-primary transition-all shadow-sm border border-transparent hover:border-primary/20"
            title="API Key Settings"
            aria-label="API Key Settings"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="flex flex-col gap-8">
            
            {/* 1. Reference Images */}
            <section aria-labelledby="reference-title" className="bg-white/50 p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-shadow">
              <h2 id="reference-title" className="text-xl font-bold mb-5 flex items-center gap-2 text-primary">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm">1</span>
                Reference Images
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {referenceImages.map((img, i) => (
                  <ImageUploader key={i} index={i} imageFile={img} onImageChange={handleImageChange} borderColor={PEN_COLORS[i].hex} />
                ))}
              </div>
            </section>
            
            {/* 2. Format Settings */}
            <section aria-labelledby="format-title" className="bg-white/50 p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-shadow">
              <h2 id="format-title" className="text-xl font-bold mb-5 flex items-center gap-2 text-secondary">
                 <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-white text-sm">2</span>
                 Format & Output
              </h2>
              <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      <div className="flex-1">
                          <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Aspect Ratio</label>
                          <AspectRatioSelector selectedRatio={aspectRatio} onRatioChange={setAspectRatio} />
                      </div>
                      <div className="sm:text-right">
                           <ResolutionSelector selectedResolution={resolution} onResolutionChange={setResolution} />
                      </div>
                  </div>
                  
                  <BackgroundSettings 
                      isBackgroundRemoved={isBackgroundRemoved}
                      onToggleBackgroundRemoved={setIsBackgroundRemoved}
                      isColorBackground={isColorBackground}
                      onToggleColorBackground={setIsColorBackground}
                      selectedColor={selectedBackgroundColor}
                      onColorSelect={setSelectedBackgroundColor}
                  />
              </div>
            </section>

             {/* 3. Pose Sketch & Reference Work */}
            <section aria-labelledby="composition-title" className="bg-white/50 p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-shadow">
              <h2 id="composition-title" className="text-xl font-bold mb-5 flex items-center gap-2 text-accent">
                 <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-sm">3</span>
                 Composition & Style
              </h2>
              
              <ReferenceWorkSection 
                selectedFeatures={extractionFeatures}
                onFeatureToggle={handleFeatureToggle}
                hasImage={!!referenceWorkImage}
              />

              {/* Accordion Toggle */}
              <button 
                  onClick={() => setIsSketchExpanded(!isSketchExpanded)}
                  className="w-full flex items-center justify-between mb-4 p-4 rounded-2xl bg-white border border-border-color hover:border-primary/30 transition-all shadow-sm focus:outline-none group"
                  aria-expanded={isSketchExpanded}
                  aria-controls="pose-sketch-content"
              >
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </div>
                      <div className="text-left">
                          <h3 className="text-xl font-bold text-text-main group-hover:text-primary transition-colors">Pose Sketch</h3>
                          <span className="text-sm text-text-secondary font-medium">Draw a layout or pose guide</span>
                      </div>
                  </div>
                  <ChevronIcon 
                      className={`w-6 h-6 text-text-secondary transition-transform duration-300 ${isSketchExpanded ? 'rotate-180' : ''}`} 
                  />
              </button>
              
              {/* Accordion Content */}
              {isSketchExpanded && (
                  <div id="pose-sketch-content" className="animate-fadeIn">
                    <CanvasToolbar 
                        penSize={penSize}
                        onPenSizeChange={setPenSize}
                        penColor={penColor}
                        onPenColorChange={setPenColor}
                        tool={canvasTool}
                        onToolChange={setCanvasTool}
                        onUndo={() => poseCanvasRef.current?.undo()}
                        onClear={() => poseCanvasRef.current?.clear()}
                        referenceImages={referenceImages}
                        onDownloadSketch={handleDownloadSketch}
                        isSketchEmpty={poseImage === null}
                        onUploadReference={handleReferenceWorkUpload}
                    />
                    <div className="w-full md:w-4/5 mx-auto relative group">
                        <div 
                            style={canvasStyle} 
                            className={`relative rounded-2xl overflow-hidden shadow-md bg-white ${isDraggingSketch ? 'ring-4 ring-primary ring-dashed' : 'border border-gray-100'}`}
                            onDragOver={handleSketchDragOver}
                            onDragLeave={handleSketchDragLeave}
                            onDrop={handleSketchDrop}
                        >
                             <PoseCanvas 
                                ref={poseCanvasRef}
                                onPoseChange={setPoseImage} 
                                aspectRatio={aspectRatio}
                                penSize={penSize}
                                penColor={penColor}
                                tool={canvasTool}
                                backgroundImage={referenceWorkImage}
                            />
                            
                            {/* Visual cue for Drag & Drop if empty */}
                            {!referenceWorkImage && !poseImage && !isDraggingSketch && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                                     <div className="text-center p-4">
                                        <p className="text-base font-bold text-primary mb-1">Sketch Here</p>
                                        <p className="text-sm text-text-secondary">
                                            or Drop Reference Work
                                        </p>
                                     </div>
                                </div>
                            )}
                            
                            {/* Dragging Overlay */}
                             {isDraggingSketch && (
                                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm pointer-events-none flex items-center justify-center z-20">
                                     <p className="text-primary font-bold text-2xl drop-shadow-md bg-white/80 px-6 py-3 rounded-full">Drop Image!</p>
                                </div>
                             )}
                        </div>

                         {/* Remove Reference Work Button (Hover) */}
                         {referenceWorkImage && (
                             <button
                                 onClick={handleRemoveReferenceWork}
                                 className="absolute -top-3 -right-3 bg-white text-red-500 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 z-30 border border-red-100"
                                 title="Remove Reference Work Image"
                                 aria-label="Remove Reference Work Image"
                             >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                 </svg>
                             </button>
                         )}
                    </div>
                  </div>
              )}
            </section>

            {/* 4. Prompt */}
            <section aria-labelledby="prompt-title" className="bg-white/50 p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-shadow">
              <h2 id="prompt-title" className="text-xl font-bold mb-4 flex items-center gap-2 text-text-main">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-text-main text-white text-sm">4</span>
                Prompt
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your imagination... e.g., 'A cute cat wizard in a magical forest, pastel colors, soft lighting'"
                className="w-full h-32 p-4 bg-white border border-border-color rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder-text-secondary/50 shadow-inner resize-none transition-shadow text-base"
              />
            </section>
            
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || (!poseImage && referenceImages.every(img => img === null) && !referenceWorkImage)}
              className="w-full font-bold py-5 px-6 rounded-2xl text-2xl transition-all bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
            >
              {isLoading ? '✨ Creating Masterpiece... ✨' : '✨ Generate Image ✨'}
            </button>
            
             {/* Auto-save Section */}
             {!isCrossOrigin && (
                <section aria-labelledby="autosave-title" className="bg-white/30 p-4 rounded-2xl border border-white/50">
                    <h2 id="autosave-title" className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Auto-Save</h2>
                    {!isFileSystemApiSupported ? (
                        <p className="text-sm text-text-secondary bg-white p-2 rounded-lg border border-border-color inline-block">
                            Browser not supported
                        </p>
                    ) : autoSaveDirectory ? (
                        <p className="text-sm font-bold text-secondary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            Saving to: {autoSaveDirectory.name}
                        </p>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-text-secondary">
                                Save automatically to folder
                            </p>
                            <button onClick={handleSelectFolder} className="text-sm font-bold px-3 py-1.5 rounded-lg bg-white border border-border-color hover:bg-gray-50 text-text-main">
                                Select Folder
                            </button>
                        </div>
                    )}
                    {autoSaveError && <p className="text-sm text-red-400 mt-2 font-medium">{autoSaveError}</p>}
                </section>
             )}

          </div>

          {/* Right Column: Result */}
          <div className="xl:sticky xl:top-6 h-[80vh] xl:h-[calc(100vh-3rem)] flex flex-col gap-6">
            <ResultDisplay
              isLoading={isLoading}
              generatedImage={generatedImage}
              error={error}
              onInpaint={handleInpaint}
              isInpainting={isInpainting}
              inpaintingResult={inpaintingResult}
              inpaintingError={inpaintingError}
              onClearInpaintingError={() => setInpaintingError(null)}
              onUndoInpaint={handleUndoInpaint}
              canUndoInpaint={activeImageHistory.length > 1}
            />
            
            <SessionGallery
                gallery={sessionGallery}
                activeIndex={activeGalleryIndex}
                onSelect={setActiveGalleryIndex}
                onDownloadAll={handleDownloadAll}
                isZipping={isZipping}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;