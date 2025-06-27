import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, error } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Vérification des permissions..." />;
  }

  // Show error if there's an auth error
  if (error) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md w-full shadow-lg border border-primary-200">
          <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-error text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-primary-800 mb-4">
            Erreur d'authentification
          </h2>
          <p className="text-primary-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;