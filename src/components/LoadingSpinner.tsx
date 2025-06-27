import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({ message = "Chargement..." }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4 max-w-md text-center">
        <img 
          src="/Logo JLC MERCURY GRIS.png" 
          alt="JLC Mercury Logo" 
          className="w-16 h-16 object-contain animate-pulse"
        />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        <p className="text-primary-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;