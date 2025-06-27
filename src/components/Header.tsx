import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, LogOut } from 'lucide-react';

function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
    }
  };

  if (!user) {
    return (
      <header className="bg-white shadow-lg border-b border-primary-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/Logo JLC MERCURY GRIS.png" 
              alt="JLC Mercury Logo" 
              className="w-8 h-8 object-contain"
            />
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
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-8 h-8 object-contain"
          />
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
          <div className="flex items-center space-x-2 text-primary-700">
            <User className="w-5 h-5" />
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 hover:scale-105">
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </button>
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
    </header>
  );
}

export default Header;