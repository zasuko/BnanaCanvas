import React from 'react';

export const CloverIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.0002 12C12.0002 12 14.5002 7.5 16.5002 8.5C18.5002 9.5 17.5002 12 17.5002 12C17.5002 12 20.0002 11 21.0002 13C22.0002 15 17.5002 16.5 17.5002 16.5C17.5002 16.5 19.5002 19.5 17.5002 20.5C15.5002 21.5 13.5002 17 13.5002 17C13.5002 17 12.0002 21 10.0002 20C8.00024 19 9.50024 15 9.50024 15C9.50024 15 5.50024 16.5 4.50024 14.5C3.50024 12.5 7.50024 12 7.50024 12C7.50024 12 5.00024 9.5 7.00024 8.5C9.00024 7.5 12.0002 12 12.0002 12Z" />
    <path d="M12 12L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const FlowerIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V14H4C2.9 14 2 13.1 2 12C2 10.9 2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" className="text-white drop-shadow-sm" fill="white" stroke="#ffe4e6" strokeWidth="1"/>
    <circle cx="12" cy="12" r="3" className="text-yellow-300" fill="currentColor"/>
  </svg>
);

const Decorations: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top Left Cluster */}
      <CloverIcon className="absolute top-10 -left-4 w-24 h-24 text-secondary/20 animate-float" style={{ animationDelay: '0s' }} />
      <FlowerIcon className="absolute top-32 left-10 w-16 h-16 animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Top Right Cluster */}
      <FlowerIcon className="absolute -top-6 right-10 w-32 h-32 animate-float" style={{ animationDelay: '2s' }} />
      <CloverIcon className="absolute top-40 right-4 w-12 h-12 text-secondary/30 animate-float" style={{ animationDelay: '3s' }} />

      {/* Bottom Left */}
      <FlowerIcon className="absolute bottom-10 left-4 w-20 h-20 animate-float" style={{ animationDelay: '4s' }} />

      {/* Bottom Right */}
      <CloverIcon className="absolute bottom-0 -right-6 w-40 h-40 text-secondary/10 animate-float" style={{ animationDelay: '1.5s' }} />
    </div>
  );
};

export default Decorations;
