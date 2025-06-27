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
        
        {/* Bouton d'urgence après 8 secondes */}
        <div className="mt-6">
          <button
            onClick={() => {
              console.log('🚨 Emergency reload triggered');
              window.location.reload();
            }}
            className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
          >
            Forcer le rechargement
          </button>
        </div>
        
        {/* Debug info en développement */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-primary-200 text-xs max-w-sm">
            <p className="text-primary-700 font-medium mb-1">Debug Info:</p>
            <p className="text-primary-600">Timestamp: {new Date().toLocaleTimeString()}</p>
            <p className="text-primary-600">Message: {message}</p>
            <p className="text-primary-600">URL: {window.location.pathname}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingSpinner;