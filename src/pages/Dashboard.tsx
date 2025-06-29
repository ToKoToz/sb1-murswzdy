import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Plus,
  TrendingUp,
  Clock,
  UserCheck
} from 'lucide-react';

function Dashboard() {
  const { trainings, loading, currentUser } = useData();

  if (loading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />;
  }

  // Filtrer pour n'inclure que les formations actives (pas les brouillons)
  const activeTrainings = trainings.filter(t => t.status === 'active');
  const totalParticipants = trainings.reduce((acc, t) => acc + (t.participants?.length || 0), 0);
  const signedParticipants = trainings.reduce((acc, t) => 
    acc + (t.participants?.filter(p => p.has_signed).length || 0), 0
  );
  const completionRate = totalParticipants > 0 ? Math.round((signedParticipants / totalParticipants) * 100) : 0;

  const stats = [
    {
      icon: BookOpen,
      label: 'Formations actives',
      value: activeTrainings.length,
      color: 'from-accent to-accent-light',
      textColor: 'text-white'
    },
    {
      icon: Users,
      label: 'Total participants',
      value: totalParticipants,
      color: 'from-success to-success-light',
      textColor: 'text-white'
    },
    {
      icon: UserCheck,
      label: 'Signatures collectées',
      value: signedParticipants,
      color: 'from-warning to-warning-light',
      textColor: 'text-white'
    },
    {
      icon: TrendingUp,
      label: 'Taux de complétion',
      value: `${completionRate}%`,
      color: 'from-primary-600 to-primary-500',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-12 h-12 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-primary-800 mb-2">
              Tableau de bord
            </h1>
            <p className="text-primary-600">
              Vue d'ensemble de vos formations et activités
            </p>
          </div>
        </div>
        <Link
          to="/trainings/new"
          className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle formation</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white backdrop-blur-sm rounded-xl p-6 border border-primary-200 hover:scale-105 transition-all duration-200 animate-slide-in shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <h3 className="text-2xl font-bold text-primary-800 mb-1">
                {stat.value}
              </h3>
              <p className="text-primary-600 text-sm">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Trainings */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-primary-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-primary-800">
              Formations récentes
            </h2>
            <Link
              to="/trainings"
              className="text-accent hover:text-accent-dark text-sm font-medium transition-colors duration-200"
            >
              Voir toutes →
            </Link>
          </div>
        </div>

        <div className="divide-y divide-primary-200">
          {/* Filtrer pour n'afficher que les formations actives ou terminées (pas de brouillons) */}
          {trainings
            .filter(t => t.status !== 'draft') // Exclure les brouillons
            .slice(0, 5) // Prendre les 5 premières
            .map((training) => (
            <Link
              key={training.id}
              to={`/trainings/${training.id}`}
              className="block p-6 hover:bg-primary-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-primary-800 font-medium mb-1">
                    {training.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-primary-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(training.start_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{training.start_time} - {training.end_time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{training.participants?.length || 0} participants</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-primary-800">
                      {training.participants?.filter(p => p.has_signed).length || 0} / {training.participants?.length || 0}
                    </div>
                    <div className="text-xs text-primary-600">
                      signatures
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    training.status === 'active' ? 'bg-success' :
                    training.status === 'draft' ? 'bg-warning' :
                    'bg-primary-400'
                  }`}></div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {trainings.filter(t => t.status !== 'draft').length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-primary-700 font-medium mb-2">
              Aucune formation créée
            </h3>
            <p className="text-primary-600 text-sm mb-4">
              Commencez par créer votre première formation
            </p>
            <Link
              to="/trainings/new"
              className="inline-flex items-center space-x-2 bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une formation</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;