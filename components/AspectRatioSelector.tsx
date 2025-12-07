import React from 'react';
import { ASPECT_RATIO_OPTIONS } from '../constants';
import type { AspectRatio } from '../types';

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onRatioChange }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white/50 p-2 rounded-2xl border border-white">
      {ASPECT_RATIO_OPTIONS.map((ratio) => (
        <button
          key={ratio}
          onClick={() => onRatioChange(ratio)}
          className={`py-2.5 px-1 rounded-xl font-bold text-sm transition-all ${
            selectedRatio === ratio
              ? 'bg-white text-primary shadow-md ring-1 ring-primary/20 transform scale-105'
              : 'text-text-secondary hover:bg-white/80 hover:text-text-main'
          }`}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
};

export default AspectRatioSelector;