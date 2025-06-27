import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({ message = "Chargement..." }: LoadingSpinnerProps) {
  console.log('🎡 LoadingSpinner displayed with message:', message);
  
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
        
        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-primary-200 text-xs">
            <p className="text-primary-700 font-medium mb-1">Debug Info:</p>
            <p className="text-primary-600">Timestamp: {new Date().toLocaleTimeString()}</p>
            <p className="text-primary-600">Message: {message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingSpinner;