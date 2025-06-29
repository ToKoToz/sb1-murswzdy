import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
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
import SignatureSessionPage from './pages/SignatureSessionPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  console.log('🎯 AppContent render:', { 
    isLoading, 
    isAuthenticated, 
    user: user?.email, 
    role: user?.role
  });

  // Show loading spinner with timeout protection
  if (isLoading) {
    return <LoadingSpinner message="Vérification de l'authentification..." />;
  }

  // If not authenticated, show login or public pages
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signature/:trainingId/:participantId" element={<SignaturePage />} />
        <Route path="/signature-session/:trainingId/:sessionType" element={<SignatureSessionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, show protected routes with DataProvider and PreferencesProvider
  return (
    <DataProvider>
      <PreferencesProvider>
        <Routes>
          {/* Public signature pages */}
          <Route path="/signature/:trainingId/:participantId" element={<SignaturePage />} />
          <Route path="/signature-session/:trainingId/:sessionType" element={<SignatureSessionPage />} />
          
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
                  {user?.role === 'admin' && (
                    <Route path="/trainings/new" element={<CreateTraining />} />
                  )}
                  <Route path="/trainings/:id" element={<TrainingDetail />} />
                  <Route path="/trainers" element={<TrainerManagement />} />
                  <Route path="/clients" element={<ClientManagement />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </PreferencesProvider>
    </DataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-primary-50 transition-colors duration-300">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;