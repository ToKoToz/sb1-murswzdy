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
  Users,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const { currentUser, trainings } = useData();

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { 
        icon: Home, 
        label: 'Tableau de bord', 
        path: '/',
        description: 'Vue d\'ensemble',
        roles: ['admin', 'trainer']
      },
      { 
        icon: BookOpen, 
        label: 'Formations', 
        path: '/trainings',
        description: 'Gérer les formations',
        // Afficher uniquement les formations actives (pas les brouillons)
        badge: trainings?.filter(t => t.status === 'active').length || 0,
        roles: ['admin', 'trainer']
      },
      { 
        icon: Plus, 
        label: 'Nouvelle formation', 
        path: '/trainings/new',
        description: 'Créer une formation',
        roles: ['admin'] // Uniquement pour les admins
      },
      { 
        icon: Calendar, 
        label: 'Calendrier', 
        path: '/calendar',
        description: 'Planification',
        roles: ['admin', 'trainer']
      },
      { 
        icon: UserCheck, 
        label: 'Mes Formateurs', 
        path: '/trainers',
        description: 'Équipe pédagogique',
        roles: ['admin'] // Only admins can manage trainers
      },
      { 
        icon: Building2, 
        label: 'Mes Clients', 
        path: '/clients',
        description: 'Gestion clients',
        roles: ['admin'] // Only admins can manage clients
      },
      { 
        icon: Users, 
        label: 'Utilisateurs', 
        path: '/users',
        description: 'Gestion des utilisateurs',
        roles: ['admin'] // Only admins can manage users
      },
      { 
        icon: Settings, 
        label: 'Paramètres', 
        path: '/settings',
        description: 'Configuration',
        roles: ['admin', 'trainer']
      },
    ];

    // Filter items based on user role
    return baseItems.filter(item => 
      !item.roles || item.roles.includes(currentUser?.role || 'trainer')
    );
  };

  const menuItems = getMenuItems();

  return (
    <div className={`bg-white shadow-sm border-r border-gray-200 h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className={`${collapsed ? 'p-3' : 'p-6'} border-b border-gray-200`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3 mb-4'}`}>
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-8 h-8 object-contain"
          />
          {!collapsed && (
            <div>
              <h1 className="text-gray-900 font-semibold text-lg">
                Gestion Formations
              </h1>
              <p className="text-gray-500 text-xs">
                Plateforme de formation
              </p>
            </div>
          )}
        </div>
        
        {/* User Info */}
        {!collapsed && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              {currentUser?.profile_picture_url ? (
                <img 
                  src={currentUser.profile_picture_url} 
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
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
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-2 py-3' : 'p-4'}`}>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${collapsed ? 'justify-center' : ''} 
                  ${collapsed ? 'px-2' : 'px-3'} py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && item.badge > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Role-specific information */}
        {!collapsed && (
          <>
            {currentUser?.role === 'trainer' && (
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 font-medium mb-1">Mode Formateur</p>
                <p className="text-xs text-blue-600">
                  Vous avez accès à la gestion de vos formations et participants.
                </p>
              </div>
            )}

            {currentUser?.role === 'admin' && (
              <div className="mt-6 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-800 font-medium mb-1">Mode Administrateur</p>
                <p className="text-xs text-red-600">
                  Vous avez un accès complet à toutes les fonctionnalités.
                </p>
              </div>
            )}
          </>
        )}
      </nav>

      {/* Stats */}
      {!collapsed && (
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
      )}

      {/* Footer */}
      <div className={`${collapsed ? 'py-4' : 'p-4'} border-t border-gray-200 ${collapsed ? 'text-center' : ''}`}>
        <p className="text-xs text-gray-500 text-center">
          © 2024 JLC
        </p>
      </div>
    </div>
  );
}

export default Sidebar;