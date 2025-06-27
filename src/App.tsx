import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import UserManagement from './pages/UserManagement';
import TrainingList from './pages/TrainingList';
import TrainingDetail from './pages/TrainingDetail';
import CreateTraining from './pages/CreateTraining';
import TrainerManagement from './pages/TrainerManagement';
import ClientManagement from './pages/ClientManagement';
import SignaturePage from './pages/SignaturePage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { user, isLoading, isAuthenticated, error } = useAuth();

  console.log('🎯 AppContent render:', { 
    isLoading, 
    isAuthenticated, 
    user: user?.email, 
    role: user?.role,
    error 
  });

  // Show error state if there's an error
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
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Réessayer
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner with timeout protection
  if (isLoading) {
    return <LoadingSpinner message="Vérification de l'authentification..." />;
  }

  // If not authenticated, show login or public pages
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signature/:trainingId/:participantId" element={<SignaturePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, show protected routes with DataProvider
  return (
    <DataProvider>
      <Routes>
        {/* Public signature page */}
        <Route path="/signature/:trainingId/:participantId" element={<SignaturePage />} />
        
        {/* Redirect to login if trying to access login while authenticated */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        
        {/* Protected routes with role-based dashboards */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                {/* Role-based dashboard routing */}
                <Route 
                  path="/" 
                  element={
                    user?.role === 'admin' ? (
                      <AdminDashboard />
                    ) : (
                      <TrainerDashboard />
                    )
                  } 
                />
                
                {/* Admin-only routes */}
                {user?.role === 'admin' && (
                  <>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/users" element={<UserManagement />} />
                  </>
                )}
                
                {/* Trainer dashboard route */}
                {user?.role === 'trainer' && (
                  <Route path="/trainer" element={<TrainerDashboard />} />
                )}
                
                {/* Common routes available to all authenticated users */}
                <Route path="/trainings" element={<TrainingList />} />
                <Route path="/trainings/new" element={<CreateTraining />} />
                <Route path="/trainings/:id" element={<TrainingDetail />} />
                <Route path="/trainers" element={<TrainerManagement />} />
                <Route path="/clients" element={<ClientManagement />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </DataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-primary-50">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;