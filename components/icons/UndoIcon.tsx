import React from 'react';

const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M21 13v-2a4 4 0 0 0-4-4H7l-2-2" />
    <path d="M5 21v-2a4 4 0 0 1 4-4h11" />
    <polyline points="3 13 7 9 3 5" />
  </svg>
);

export default UndoIcon;
