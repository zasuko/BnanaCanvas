import React from 'react';
import type { ExtractionFeature } from '../types';
import { EXTRACTION_FEATURES } from '../constants';

interface ReferenceWorkSectionProps {
  selectedFeatures: ExtractionFeature[];
  onFeatureToggle: (feature: ExtractionFeature) => void;
  hasImage: boolean;
}

const ReferenceWorkSection: React.FC<ReferenceWorkSectionProps> = ({
  selectedFeatures,
  onFeatureToggle,
  hasImage,
}) => {
  return (
    <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm mb-4">
      <div className="flex flex-col gap-4">
        <div>
           <h3 className="text-base font-bold text-text-main mb-1 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-accent"></span>
             Extract Elements
           </h3>
           <p className="text-sm text-text-secondary">
             Available when Reference Work is uploaded below.
           </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
            {EXTRACTION_FEATURES.map((feature) => {
              const isSelected = selectedFeatures.includes(feature.id);
              return (
                <label 
                  key={feature.id} 
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 shadow-inner' 
                      : 'bg-white border-transparent hover:bg-white hover:border-border-color hover:shadow-sm'
                  } ${!hasImage ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-300'}`}>
                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onFeatureToggle(feature.id)}
                    disabled={!hasImage}
                    className="hidden"
                  />
                  <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>{feature.label}</span>
                </label>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ReferenceWorkSection;