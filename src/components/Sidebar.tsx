import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { 
  Home, 
  BookOpen, 
  Plus,
  UserCheck,
  Building2,
  Settings,
  Users
} from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  const { currentUser, trainings } = useData();

  const menuItems = [
    { 
      icon: Home, 
      label: 'Tableau de bord', 
      path: '/',
      description: 'Vue d\'ensemble'
    },
    { 
      icon: BookOpen, 
      label: 'Formations', 
      path: '/trainings',
      description: 'Gérer les formations',
      badge: trainings?.length || 0
    },
    { 
      icon: Plus, 
      label: 'Nouvelle formation', 
      path: '/trainings/new',
      description: 'Créer une formation'
    },
    { 
      icon: UserCheck, 
      label: 'Mes Formateurs', 
      path: '/trainers',
      description: 'Équipe pédagogique'
    },
    { 
      icon: Building2, 
      label: 'Mes Clients', 
      path: '/clients',
      description: 'Gestion clients'
    },
    { 
      icon: Settings, 
      label: 'Paramètres', 
      path: '/settings',
      description: 'Configuration'
    },
  ];

  return (
    <div className="bg-white w-64 shadow-sm border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-gray-900 font-semibold text-lg">
              Formation Pro
            </h1>
            <p className="text-gray-500 text-xs">
              Plateforme de formation
            </p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-medium text-sm truncate">
                {currentUser?.name || 'Utilisateur'}
              </p>
              <p className="text-gray-500 text-xs capitalize">
                {currentUser?.role === 'admin' ? 'Administrateur' : 'Formateur'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Stats */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-gray-900 font-medium text-sm mb-3">
            Aperçu rapide
          </h4>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {trainings?.filter(t => t.status === 'active').length || 0}
              </div>
              <div className="text-xs text-gray-500">Actives</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {trainings?.reduce((acc, t) => acc + (t.participants?.length || 0), 0) || 0}
              </div>
              <div className="text-xs text-gray-500">Participants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2024 JLC Mercury
        </p>
      </div>
    </div>
  );
}

export default Sidebar;