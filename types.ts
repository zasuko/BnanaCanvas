

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | 'Adjust';

export type Resolution = '1K' | '2K' | '4K';

export interface ImageFile {
  base64: string;
  mimeType: string;
}

export type CanvasTool = 'pen' | 'eraser';

export type PenColor = {
  name: string;
  hex: string;
};

export type ExtractionFeature = 
  | 'color'
  | 'style'
  | 'pose'
  | 'composition'
  | 'details'
  | 'expression'
  | 'text'
  | 'clothing'
  | 'background'
  | 'hairstyle';

export interface BackgroundColor {
  id: string;
  name: string;
  hex: string;
}