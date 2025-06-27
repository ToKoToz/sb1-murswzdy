import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import UserManagement from './pages/UserManagement';
import TrainingList from './pages/TrainingList';
import TrainingDetail from './pages/TrainingDetail';
import CreateTraining from './pages/CreateTraining';
import ClientManagement from './pages/ClientManagement';
import SignaturePage from './pages/SignaturePage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Chargement de l'application..." />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signature/:trainingId/:participantId" element={<SignaturePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
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
                  user?.role?.name === 'admin' ? (
                    <AdminDashboard />
                  ) : (
                    <TrainerDashboard />
                  )
                } 
              />
              
              {/* Admin-only routes */}
              {user?.role?.name === 'admin' && (
                <>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/users" element={<UserManagement />} />
                </>
              )}
              
              {/* Trainer dashboard route */}
              {user?.role?.name === 'trainer' && (
                <Route path="/trainer" element={<TrainerDashboard />} />
              )}
              
              {/* Common routes available to all authenticated users */}
              <Route path="/trainings" element={<TrainingList />} />
              <Route path="/trainings/new" element={<CreateTraining />} />
              <Route path="/trainings/:id" element={<TrainingDetail />} />
              <Route path="/clients" element={<ClientManagement />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
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