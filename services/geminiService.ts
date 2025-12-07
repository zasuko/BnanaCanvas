import { GoogleGenAI, Modality, Part } from "@google/genai";
import type { ImageFile, AspectRatio, Resolution, ExtractionFeature } from '../types';
import { PEN_COLORS, EXTRACTION_FEATURES, BACKGROUND_COLORS } from "../constants";

const fileToGenerativePart = (base64: string, mimeType: string): Part => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
};

const getClosestSupportedAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    const supported = [
        { name: '1:1', value: 1.0 },
        { name: '4:3', value: 4/3 },
        { name: '3:4', value: 3/4 },
        { name: '16:9', value: 16/9 },
        { name: '9:16', value: 9/16 },
    ];
    
    return supported.reduce((prev, curr) => {
        return (Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev);
    }).name;
};

const createOutpaintingData = (
  original: ImageFile,
  aspectRatio: AspectRatio
): Promise<{ padded: ImageFile; mask: ImageFile; finalRatio: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      let targetRatioNum: number;
      let finalRatioStr: string;

      if (aspectRatio === 'Adjust') {
          targetRatioNum = img.naturalWidth / img.naturalHeight;
          finalRatioStr = getClosestSupportedAspectRatio(img.naturalWidth, img.naturalHeight);
      } else {
          const [wRatio, hRatio] = aspectRatio.split(':').map(Number);
          targetRatioNum = wRatio / hRatio;
          finalRatioStr = aspectRatio;
      }

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const currentRatio = w / h;

      let targetW, targetH;

      if (currentRatio > targetRatioNum) {
        targetW = w;
        targetH = Math.round(w / targetRatioNum);
      } else {
        targetH = h;
        targetW = Math.round(h * targetRatioNum);
      }

      const paddedCanvas = document.createElement('canvas');
      paddedCanvas.width = targetW;
      paddedCanvas.height = targetH;
      const pCtx = paddedCanvas.getContext('2d');
      
      if (!pCtx) {
          reject(new Error("Could not create canvas context"));
          return;
      }

      pCtx.fillStyle = '#000000';
      pCtx.fillRect(0, 0, targetW, targetH);
      
      const dx = Math.round((targetW - w) / 2);
      const dy = Math.round((targetH - h) / 2);
      pCtx.drawImage(img, dx, dy, w, h);

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = targetW;
      maskCanvas.height = targetH;
      const mCtx = maskCanvas.getContext('2d');
      
      if (!mCtx) {
          reject(new Error("Could not create canvas context"));
          return;
      }

      mCtx.fillStyle = '#FFFFFF';
      mCtx.fillRect(0, 0, targetW, targetH);
      
      mCtx.fillStyle = '#000000';
      
      const overlap = 4; 
      const safeOverlap = Math.min(overlap, w/4, h/4);

      mCtx.fillRect(dx + safeOverlap, dy + safeOverlap, w - (safeOverlap * 2), h - (safeOverlap * 2));

      resolve({
        padded: { base64: paddedCanvas.toDataURL('image/png'), mimeType: 'image/png' },
        mask: { base64: maskCanvas.toDataURL('image/png'), mimeType: 'image/png' },
        finalRatio: finalRatioStr
      });
    };
    img.onerror = (e) => reject(e);
    img.src = original.base64;
  });
};

export const generateImage = async (
  apiKey: string,
  prompt: string,
  referenceImages: (ImageFile | null)[],
  poseImage: ImageFile | null,
  referenceWorkImage: ImageFile | null,
  extractionFeatures: ExtractionFeature[],
  aspectRatio: AspectRatio,
  resolution: Resolution,
  backgroundConfig?: { isRemoved: boolean; isColor: boolean; colorHex: string }
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const parts: Part[] = [];
  const validReferenceImages = referenceImages.filter((img): img is ImageFile => img !== null);

  let effectiveAspectRatio = aspectRatio;
  
  if (aspectRatio === 'Adjust') {
      const guideImage = poseImage || referenceWorkImage || validReferenceImages[0];
      if (guideImage) {
           await new Promise<void>((resolve) => {
               const img = new Image();
               img.onload = () => {
                   effectiveAspectRatio = getClosestSupportedAspectRatio(img.naturalWidth, img.naturalHeight) as AspectRatio;
                   resolve();
               };
               img.src = guideImage.base64;
           });
      } else {
          effectiveAspectRatio = '1:1';
      }
  }

  let backgroundInstruction = "";
  if (backgroundConfig) {
      if (backgroundConfig.isRemoved) {
          backgroundInstruction = "\n\nIMPORTANT: The main subject MUST be strictly isolated on a PURE WHITE background. The background must be completely empty and white (hex #FFFFFF), with no shadows, no scenery, and no artifacts.";
      } else if (backgroundConfig.isColor && backgroundConfig.colorHex) {
          const colorObj = BACKGROUND_COLORS.find(c => c.hex === backgroundConfig.colorHex);
          const colorName = colorObj ? colorObj.name : "solid color";
          backgroundInstruction = `\n\nIMPORTANT: The main subject MUST be depicted on a flat, solid ${colorName} background. The background should be uniform in color (hex ${backgroundConfig.colorHex}) with minimal shading.`;
      }
  }

  if (validReferenceImages.length === 1 && !poseImage && !referenceWorkImage) {
      const sourceImage = validReferenceImages[0];
      
      const { padded, mask, finalRatio } = await createOutpaintingData(sourceImage, aspectRatio);
      
      effectiveAspectRatio = finalRatio as AspectRatio;
      
      parts.push(fileToGenerativePart(padded.base64, padded.mimeType));
      parts.push(fileToGenerativePart(mask.base64, mask.mimeType));
      
      const promptContent = prompt.trim() || "Extend the image to fill the empty space.";
      const outpaintInstruction = `Instructions: ${promptContent}\n\nThe provided image has been padded. The white area of the mask indicates the empty padding that needs to be filled. The black area of the mask indicates the original image. Generate new content for the white area to seamlessly extend the scene.`;
      
      parts.push({ text: outpaintInstruction + backgroundInstruction });

      const imageConfig = { aspectRatio: effectiveAspectRatio, imageSize: resolution };

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: imageConfig,
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }

  } else {
      if (validReferenceImages.length === 0 && !poseImage && !referenceWorkImage) {
          throw new Error("Please provide at least one reference image, a pose drawing, or a reference work.");
      }

      for (const img of validReferenceImages) {
        parts.push(fileToGenerativePart(img.base64, img.mimeType));
      }

      if (referenceWorkImage) {
          parts.push(fileToGenerativePart(referenceWorkImage.base64, referenceWorkImage.mimeType));
      }

      if (poseImage) {
        parts.push(fileToGenerativePart(poseImage.base64, poseImage.mimeType));
      }

      let fullPrompt = `Instructions: ${prompt}`;
      
      if (referenceWorkImage) {
          fullPrompt += `\n\n### Reference Work Instructions:\n`;
          fullPrompt += `A "Reference Work" image has been provided. You MUST extract ONLY the following elements from it to guide the generation:\n`;
          
          if (extractionFeatures.length > 0) {
             const featureLabels = extractionFeatures.map(f => {
                 const match = EXTRACTION_FEATURES.find(ef => ef.id === f);
                 return match ? match.label : f;
             });
             fullPrompt += `EXTRACT THESE FEATURES: ${featureLabels.join(', ')}.\n`;
          } else {
             fullPrompt += `EXTRACT: General vibe and composition.\n`;
          }
          fullPrompt += `Use these extracted features to re-imagine the subjects from the other reference images.`;
      }

      if (poseImage) {
          fullPrompt += `\n\n### Pose Instructions:\nA pose drawing is provided to guide the structural composition.`;

          const colorMappings: string[] = [];
          let imageCounter = 1;
          referenceImages.forEach((image, index) => {
              if (image) {
                  const colorName = PEN_COLORS[index].name;
                  colorMappings.push(`- The color ${colorName} in the pose drawing corresponds to Reference Image ${imageCounter} (Subject).`);
                  imageCounter++;
              }
          });

          if (colorMappings.length > 0) {
              fullPrompt += `\nThe drawing uses colors to map to the reference images. Follow these mappings strictly:\n${colorMappings.join('\n')}`;
          } else {
              fullPrompt += `\nInterpret the pose drawing creatively to structure the output image.`;
          }
      } 
      
      fullPrompt += backgroundInstruction;

      parts.push({ text: fullPrompt });

      const imageConfig = { aspectRatio: effectiveAspectRatio as any, imageSize: resolution };

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: imageConfig,
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }
  }

  throw new Error("No image was generated. The model may have refused the request.");
};


export const inpaintImage = async (
  apiKey: string,
  prompt: string,
  originalImage: ImageFile,
  maskImage: ImageFile
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: Part[] = [
    fileToGenerativePart(originalImage.base64, originalImage.mimeType),
    fileToGenerativePart(maskImage.base64, maskImage.mimeType),
    { text: `You will be given two images. The first is the original image. The second image contains a mask indicating an area to modify. Inpaint the masked area on the original image based on this instruction: "${prompt}"` },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
  }
  
  throw new Error("Inpainting failed. The model may have refused the request.");
};