import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { ImageFile, AspectRatio, CanvasTool, PenColor } from '../types';

interface PoseCanvasProps {
  onPoseChange: (file: ImageFile | null) => void;
  aspectRatio: AspectRatio;
  penSize: number;
  penColor: string;
  tool: CanvasTool;
  backgroundImage: ImageFile | null;
}

export interface PoseCanvasRef {
  undo: () => void;
  clear: () => void;
}

const PoseCanvas = forwardRef<PoseCanvasRef, PoseCanvasProps>(({ onPoseChange, aspectRatio, penSize, penColor, tool, backgroundImage }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const history = useRef<ImageData[]>([]);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

  const getContext = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  };
  
  // Load background image object to state
  useEffect(() => {
    if (backgroundImage) {
        const img = new Image();
        img.onload = () => setBgImg(img);
        img.src = backgroundImage.base64;
    } else {
        setBgImg(null);
    }
  }, [backgroundImage]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (canvas && context) {
      history.current.push(context.getImageData(0, 0, canvas.width, canvas.height));
    }
  }, []);

  const restoreState = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (canvas && context && history.current.length > 0) {
      context.putImageData(history.current[history.current.length - 1], 0, 0);
      const base64 = canvas.toDataURL('image/png');
      onPoseChange({ base64, mimeType: 'image/png' });
    }
  }, [onPoseChange]);

  // Main drawing function that handles background and history reset on resize
  const drawCanvasContent = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    // Fill Background - Changed to White for Light Theme
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Background Image (Contain Logic)
    if (bgImg) {
           const hRatio = canvas.width / bgImg.width;
           const vRatio = canvas.height / bgImg.height;
           const ratio = Math.min(hRatio, vRatio);
           
           const targetW = bgImg.width * ratio;
           const targetH = bgImg.height * ratio;
           
           const centerShift_x = (canvas.width - targetW) / 2;
           const centerShift_y = (canvas.height - targetH) / 2;
           
           context.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height,
                             centerShift_x, centerShift_y, targetW, targetH);
    }
    
    // We update the parent with the new base64 state (even if just background)
    const base64 = canvas.toDataURL('image/png');
    onPoseChange({ base64, mimeType: 'image/png' });
    
    // Reset history to this new clean state (resizing invalidates old strokes in this model)
    history.current = [context.getImageData(0, 0, canvas.width, canvas.height)];

  }, [bgImg, onPoseChange]);

  // Handle Resize using ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
        const { width, height } = canvas.getBoundingClientRect();
        // Only update if dimensions actually changed
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            drawCanvasContent();
        }
    });
    observer.observe(canvas);
    
    // Also trigger draw if bgImg loaded (and size didn't necessarily change)
    if (bgImg) {
        drawCanvasContent();
    } else {
        // If no bg image, we still ensure the canvas is initialized
        const { width, height } = canvas.getBoundingClientRect();
        if (canvas.width !== width || canvas.height !== height) {
             canvas.width = width;
             canvas.height = height;
        }
        drawCanvasContent();
    }

    return () => observer.disconnect();
  }, [bgImg, drawCanvasContent]);


  // Expose undo and clear methods to parent component
  useImperativeHandle(ref, () => ({
    undo: () => {
      if (history.current.length > 1) { 
        history.current.pop();
        restoreState();
      }
    },
    clear: () => {
        // Just triggering drawCanvasContent will effectively clear sketches and redraw BG
        drawCanvasContent();
    }
  }));


  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    const context = getContext();
    if (!context) return;
    
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = getContext();
    if (!context) return;

    context.strokeStyle = penColor;
    context.lineWidth = penSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    if (tool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.strokeStyle = "rgba(255,255,255,1)"; // White eraser logic essentially for alpha
    } else {
      context.globalCompositeOperation = 'source-over';
    }
    
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = useCallback(() => {
    const context = getContext();
    if (!context || !isDrawing) return;

    context.closePath();
    setIsDrawing(false);
    
    // Reset composite operation to default just in case
    context.globalCompositeOperation = 'source-over';
    
    saveState(); // Save state after a stroke is completed

    if (canvasRef.current) {
      const base64 = canvasRef.current.toDataURL('image/png');
      onPoseChange({ base64, mimeType: 'image/png' });
    }
  }, [onPoseChange, isDrawing, saveState]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-surface rounded-2xl border-2 border-border-color cursor-crosshair touch-none block shadow-sm"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
});

export default PoseCanvas;