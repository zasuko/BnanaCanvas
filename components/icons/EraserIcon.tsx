import React from 'react';

const EraserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    {...props}
  >
    <path d="M19.45,3.05a1,1,0,0,0-1.42,0L5.3,15.78a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0L19.45,4.46A1,1,0,0,0,19.45,3.05Z" />
    <path d="M21.29,5.88,18.12,2.71a1,1,0,0,0-1.41,0L13,6.41l4.24,4.24,3.71-3.71A1,1,0,0,0,21.29,5.88Z" />
    <path d="M3.71,17.19l-1.42,1.42a1,1,0,0,0,0,1.41l1,1a1,1,0,0,0,1.41,0l1.42-1.42Z" />
  </svg>
);

export default EraserIcon;
