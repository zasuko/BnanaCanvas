import type { AspectRatio, PenColor, Resolution, ExtractionFeature, BackgroundColor } from './types';

export const ASPECT_RATIO_OPTIONS: AspectRatio[] = ['Adjust', '1:1', '4:3', '3:4', '16:9', '9:16', '2:3'];

export const RESOLUTION_OPTIONS: Resolution[] = ['1K', '2K', '4K'];

export const PEN_COLORS: PenColor[] = [
    { name: 'Vivid Green', hex: '#00FF00' },
    { name: 'Magenta', hex: '#FF00FF' },
    { name: 'Cyan', hex: '#00FFFF' },
    { name: 'Yellow', hex: '#FFFF00' },
];

export const EXTRACTION_FEATURES: { id: ExtractionFeature; label: string }[] = [
  { id: 'color', label: 'カラー' },
  { id: 'style', label: '画風・スタイル' },
  { id: 'pose', label: '被写体のポーズ' },
  { id: 'composition', label: '画角・構図' },
  { id: 'details', label: '色使い・ディテール' },
  { id: 'expression', label: '表情・感情' },
  { id: 'clothing', label: '服装' },
  { id: 'background', label: '背景' },
  { id: 'hairstyle', label: '髪型' },
  { id: 'text', label: 'テキスト情報' },
];

export const BACKGROUND_COLORS: BackgroundColor[] = [
  { id: 'gray', name: 'Gray', hex: '#808080' },
  { id: 'green', name: 'Vivid Green', hex: '#00FF00' },
  { id: 'cyan', name: 'Vivid Cyan', hex: '#00FFFF' },
  { id: 'magenta', name: 'Vivid Magenta', hex: '#FF00FF' },
];