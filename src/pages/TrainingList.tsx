import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Alert from '../components/ui/Alert';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  BookOpen,
  Filter,
  Edit,
  Trash2,
  ArrowUpRight,
  Copy,
  ChevronDown,
  CheckCircle,
  GridIcon,
  ListIcon,
  User,
  Building
} from 'lucide-react';
import { supabase } from '../lib/supabase';

function TrainingList() {
  const { user } = useAuth();
  const { trainings, loading, refreshTrainings } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  if (loading) {
    return <LoadingSpinner message="Chargement des formations..." />;
  }

  const showAlertMessage = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleDeleteTraining = (trainingId: string) => {
    setShowDeleteConfirm(trainingId);
  };

  const confirmDeleteTraining = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      // Appel à Supabase pour supprimer la formation
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', showDeleteConfirm);

      if (error) throw error;
      
      showAlertMessage('success', 'Formation supprimée avec succès');
      await refreshTrainings();
    } catch (error) {
      console.error('Error deleting training:', error);
      showAlertMessage('error', 'Erreur lors de la suppression de la formation');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const duplicateTraining = async (training: any) => {
    try {
      // Créer une copie de la formation avec un nouveau titre
      const newTraining = {
        ...training,
        title: `${training.title} (Copie)`,
        status: 'draft' // Toujours créer en brouillon
      };
      
      // Supprimer les champs qui ne doivent pas être copiés
      delete newTraining.id;
      delete newTraining.created_at;
      delete newTraining.updated_at;
      delete newTraining.participants;
      
      // Ajouter la nouvelle formation
      const { data, error } = await supabase
        .from('trainings')
        .insert([newTraining])
        .select();

      if (error) throw error;
      
      showAlertMessage('success', 'Formation dupliquée avec succès');
      
      // Si la duplication a réussi, rediriger vers la nouvelle formation
      if (data && data.length > 0) {
        navigate(`/trainings/${data[0].id}`);
      } else {
        await refreshTrainings();
      }
    } catch (error) {
      console.error('Error duplicating training:', error);
      showAlertMessage('error', 'Erreur lors de la duplication de la formation');
    }
  };

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           training.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           training.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           training.trainer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || training.status === statusFilter;
    
    // Si l'utilisateur est un formateur, ne montrer que ses formations
    const matchesTrainer = user?.role === 'admin' || training.trainer_id === user?.id;
    
    return matchesSearch && matchesStatus && matchesTrainer;
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success bg-opacity-10 border-success';
      case 'draft':
        return 'bg-warning bg-opacity-10 border-warning';
      case 'completed':
        return 'bg-primary-500 bg-opacity-10 border-primary-500';
      default:
        return 'bg-primary-400 bg-opacity-10 border-primary-400';
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

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filteredTrainings.map((training) => (
        <Link
          to={`/trainings/${training.id}`}
          key={training.id} 
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-primary-200" 
        >
          <div className={`p-3 flex justify-between items-center ${getStatusBgColor(training.status)} border-b`}>
            <h3 className="font-medium text-primary-900 truncate max-w-[200px]">{training.title}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(training.status)}`}>
              {getStatusLabel(training.status)}
            </span>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex items-center text-primary-700 text-sm">
              <Building className="w-4 h-4 mr-2 text-primary-500" />
              <span className="truncate">{training.company}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <div className="flex items-center text-primary-600">
                <Calendar className="w-3 h-3 mr-1 text-primary-500 flex-shrink-0" />
                <span className="truncate">{new Date(training.start_date).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <div className="flex items-center text-primary-600">
                <Clock className="w-3 h-3 mr-1 text-primary-500 flex-shrink-0" />
                <span className="truncate">{training.start_time}</span>
              </div>
              
              <div className="flex items-center text-primary-600">
                <MapPin className="w-3 h-3 mr-1 text-primary-500 flex-shrink-0" />
                <span className="truncate">{training.location}</span>
              </div>
              
              <div className="flex items-center text-primary-600">
                <User className="w-3 h-3 mr-1 text-primary-500 flex-shrink-0" />
                <span className="truncate">{training.trainer_name}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-primary-700">
                <Users className="w-4 h-4 mr-1 text-primary-500" />
                <span className="text-xs">
                  {training.participants?.filter(p => p.has_signed).length || 0}/{training.participants?.length || 0} signés
                </span>
              </div>
            </div>
            
            <div className="mt-3 text-center py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent-dark transition-colors">
              Ouvrir la formation
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-xl overflow-hidden border border-primary-200 shadow-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Formation
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Lieu
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Formateur
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                Participants
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-200">
            {filteredTrainings.map((training) => (
              <tr key={training.id} className="hover:bg-primary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-primary-800">{training.title}</div>
                  <div className="text-sm text-primary-600">{training.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-primary-800">
                    {new Date(training.start_date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="text-xs text-primary-600 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {training.start_time} - {training.end_time}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-primary-800 flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-primary-600" />
                    {training.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-primary-800">{training.trainer_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(training.status)}`}>
                    {getStatusLabel(training.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-primary-600" />
                    <span className="text-sm text-primary-800">
                      {training.participants?.length || 0}
                    </span>
                    {training.participants && training.participants.length > 0 && (
                      <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                        {training.participants.filter(p => p.has_signed).length}/{training.participants.length} signés
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/trainings/${training.id}`}
                      className="text-accent hover:text-accent-dark p-1.5 hover:bg-accent-light hover:bg-opacity-10 rounded transition-colors"
                      title="Voir les détails"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </Link>
                    <Link
                      to={`/trainings/${training.id}`}
                      className="text-warning hover:text-warning-dark p-1.5 hover:bg-warning-light hover:bg-opacity-10 rounded transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateTraining(training);
                      }}
                      className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-100 rounded transition-colors"
                      title="Dupliquer"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteTraining(training.id);
                      }}
                      className="text-error hover:text-error-dark p-1.5 hover:bg-error-light hover:bg-opacity-10 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDeleteTraining}
        title="Supprimer la formation"
        message="Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible et supprimera également toutes les données associées comme les participants."
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
      />

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
              {filteredTrainings.length} formation{filteredTrainings.length !== 1 ? 's' : ''} trouvée{filteredTrainings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <div className="bg-white rounded-lg border border-primary-300 p-1 flex">
            <button 
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-primary-700'}`}
              onClick={() => setViewMode('grid')}
              title="Vue en grille"
            >
              <GridIcon className="w-5 h-5" />
            </button>
            <button 
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-accent text-white' : 'text-primary-700'}`}
              onClick={() => setViewMode('table')}
              title="Vue en tableau"
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
          
          <Link
            to="/trainings/new"
            className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle formation</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, société, lieu ou formateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-11 pr-8 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="draft">Brouillon</option>
              <option value="completed">Terminée</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Training Cards/Table */}
      {filteredTrainings.length > 0 ? (
        viewMode === 'grid' ? renderGridView() : renderTableView()
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