import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, LogOut, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from './ui/ConfirmDialog';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

function Header({ toggleSidebar, sidebarCollapsed }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <header className="bg-white shadow-lg border-b border-primary-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-primary-800 text-xl font-semibold">
                Chargement...
              </h2>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-lg border-b border-primary-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="text-primary-600 hover:text-primary-800 p-1 rounded-md hover:bg-primary-100 transition-colors"
            aria-label={sidebarCollapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
          <div>
            <h2 className="text-primary-800 text-xl font-semibold">
              Bienvenue, {user.name}
            </h2>
            <p className="text-primary-600 text-sm capitalize">
              {user.role === 'admin' ? 'Administrateur' : 'Formateur'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-primary-700">
            <User className="w-5 h-5" />
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <a href="/settings" className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 hover:scale-105">
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </a>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-error hover:bg-error-dark text-white rounded-lg transition-colors duration-200 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Boîte de dialogue de confirmation pour la déconnexion */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Déconnexion"
        cancelText="Annuler"
        type="warning"
      />
    </header>
  );
}

export default Header;