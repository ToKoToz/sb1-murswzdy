import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  BookOpen,
  Filter
} from 'lucide-react';

function TrainingList() {
  const { trainings, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (loading) {
    return <LoadingSpinner message="Chargement des formations..." />;
  }

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || training.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-white';
      case 'draft':
        return 'bg-warning text-white';
      case 'completed':
        return 'bg-primary-500 text-white';
      default:
        return 'bg-primary-400 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'draft':
        return 'Brouillon';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-primary-800 mb-2">
              Formations
            </h1>
            <p className="text-primary-600">
              Gérez vos formations et suivez les signatures
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

      {/* Filters */}
      <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              placeholder="Rechercher par titre ou société..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-11 pr-8 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="draft">Brouillon</option>
              <option value="completed">Terminée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Training Cards */}
      {filteredTrainings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTrainings.map((training) => (
            <Link
              key={training.id}
              to={`/trainings/${training.id}`}
              className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-6 hover:scale-105 hover:bg-primary-50 transition-all duration-200 animate-fade-in shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-primary-800 flex-1 mr-4">
                  {training.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                  {getStatusLabel(training.status)}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-primary-700 text-sm">
                  <BookOpen className="w-4 h-4 mr-2 text-accent" />
                  <span>{training.company}</span>
                </div>
                <div className="flex items-center text-primary-700 text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-accent" />
                  <span>{training.location}</span>
                </div>
                <div className="flex items-center text-primary-700 text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-accent" />
                  <span>
                    {new Date(training.start_date).toLocaleDateString('fr-FR')} - {new Date(training.end_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center text-primary-700 text-sm">
                  <Clock className="w-4 h-4 mr-2 text-accent" />
                  <span>{training.start_time} - {training.end_time}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center text-primary-700">
                  <Users className="w-4 h-4 mr-2 text-accent" />
                  <span className="text-sm">
                    {training.participants?.length || 0} participants
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-primary-800 font-medium">
                    {training.participants?.filter(p => p.has_signed).length || 0} / {training.participants?.length || 0}
                  </div>
                  <div className="text-xs text-primary-600">
                    signatures
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-primary-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-accent to-accent-light h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(training.participants?.length || 0) > 0 ? 
                        ((training.participants?.filter(p => p.has_signed).length || 0) / (training.participants?.length || 1)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-12 text-center shadow-lg">
          <BookOpen className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-primary-700 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'Aucune formation trouvée' : 'Aucune formation créée'}
          </h3>
          <p className="text-primary-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par créer votre première formation'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link
              to="/trainings/new"
              className="inline-flex items-center space-x-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Créer une formation</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default TrainingList;