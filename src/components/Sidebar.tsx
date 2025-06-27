import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { 
  Home, 
  BookOpen, 
  Plus,
  UserCheck,
  Building2,
  Settings
} from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  const { currentUser } = useData();

  const menuItems = [
    { icon: Home, label: 'Tableau de bord', path: '/' },
    { icon: BookOpen, label: 'Formations', path: '/trainings' },
    { icon: Plus, label: 'Nouvelle formation', path: '/trainings/new' },
    { icon: UserCheck, label: 'Mes Formateurs', path: '/trainers' },
    { icon: Building2, label: 'Mes Clients', path: '/clients' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <div className="bg-white w-64 shadow-xl border-r border-primary-200">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-primary-800 font-bold text-lg">Formation Pro</h1>
            <p className="text-primary-600 text-sm">Gestion des formations</p>
          </div>
        </div>
      </div>

      <nav className="mt-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 hover:bg-primary-50 hover:scale-105 ${
                isActive
                  ? 'bg-accent text-white border-r-4 border-accent'
                  : 'text-primary-700 hover:text-primary-900'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;