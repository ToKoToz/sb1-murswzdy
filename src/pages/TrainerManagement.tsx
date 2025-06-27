import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { supabase, Profile, FUNCTION_TITLE_OPTIONS, uploadProfilePicture, deleteProfilePicture, createTrainer } from '../lib/supabase';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Alert from '../components/ui/Alert';
import { 
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Camera
} from 'lucide-react';

function TrainerManagement() {
  const { currentUser, refreshTrainers } = useData();
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    function_title: '',
    specialties: [] as string[],
    experience: '',
    degrees_certifications: [] as string[],
    availability: '',
    profile_picture_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // États pour les dialogues de confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // État pour les alertes
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setAlert({ show: true, type, message, title });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 5000);
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trainer')
        .order('name');

      if (error) {
        console.error('Error fetching trainers:', error);
        showAlert('error', 'Erreur lors du chargement des formateurs');
        return;
      }

      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      showAlert('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, trainerId?: string) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Veuillez sélectionner un fichier image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'La taille du fichier ne peut pas dépasser 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Use a temporary ID for new trainers, or the actual trainer ID for existing ones
      const userId = trainerId || `temp-${Date.now()}`;
      const imageUrl = await uploadProfilePicture(file, userId);
      
      if (imageUrl) {
        setFormData(prev => ({ ...prev, profile_picture_url: imageUrl }));
        showAlert('success', 'Image téléchargée avec succès');
      } else {
        showAlert('error', 'Erreur lors du téléchargement de l\'image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('error', 'Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTrainer) {
        // Update existing trainer
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            phone_number: formData.phone_number || null,
            function_title: formData.function_title || null,
            specialties: formData.specialties,
            experience: formData.experience || null,
            degrees_certifications: formData.degrees_certifications,
            availability: formData.availability || null,
            profile_picture_url: formData.profile_picture_url || null
          })
          .eq('id', editingTrainer.id);

        if (error) {
          console.error('Error updating trainer:', error);
          showAlert('error', 'Erreur lors de la mise à jour du formateur');
          return;
        }

        showAlert('success', 'Formateur mis à jour avec succès');
      } else {
        // Create new trainer using Edge Function
        const result = await createTrainer({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number,
          function_title: formData.function_title,
          specialties: formData.specialties,
          experience: formData.experience,
          degrees_certifications: formData.degrees_certifications,
          availability: formData.availability,
          profile_picture_url: formData.profile_picture_url
        });

        if (!result.success) {
          console.error('Error creating trainer:', result.error);
          showAlert('error', `Erreur lors de la création du formateur: ${result.error}`);
          return;
        }

        showAlert('success', 'Formateur créé avec succès');
      }

      await fetchTrainers();
      await refreshTrainers();
      resetForm();
    } catch (error) {
      console.error('Error saving trainer:', error);
      showAlert('error', 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (trainer: Profile) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      email: trainer.email,
      phone_number: trainer.phone_number || '',
      function_title: trainer.function_title || '',
      specialties: trainer.specialties || [],
      experience: trainer.experience || '',
      degrees_certifications: trainer.degrees_certifications || [],
      availability: trainer.availability || '',
      profile_picture_url: trainer.profile_picture_url || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (trainer: Profile) => {
    showConfirmDialog(
      'Supprimer le formateur',
      `Êtes-vous sûr de vouloir supprimer le formateur ${trainer.name} ? Cette action est irréversible.`,
      async () => {
        try {
          // Delete profile picture if exists
          if (trainer.profile_picture_url) {
            await deleteProfilePicture(trainer.profile_picture_url);
          }

          // Delete the profile directly (simplified for demo)
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', trainer.id);

          if (error) {
            console.error('Error deleting trainer:', error);
            showAlert('error', 'Erreur lors de la suppression du formateur');
            return;
          }

          await fetchTrainers();
          await refreshTrainers();
          showAlert('success', 'Formateur supprimé avec succès');
        } catch (error) {
          console.error('Error deleting trainer:', error);
          showAlert('error', 'Erreur lors de la suppression du formateur');
        }
      },
      'danger'
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      function_title: '',
      specialties: [],
      experience: '',
      degrees_certifications: [],
      availability: '',
      profile_picture_url: ''
    });
    setEditingTrainer(null);
    setShowAddForm(false);
  };

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trainer.function_title && trainer.function_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-16 h-16 object-contain animate-pulse"
          />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert.show && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === 'danger' ? 'Supprimer' : 'Confirmer'}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="text-accent hover:text-accent-dark transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <img 
            src="/Logo JLC MERCURY GRIS.png" 
            alt="JLC Mercury Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-primary-800 mb-2">
              Gestion des Formateurs
            </h1>
            <p className="text-primary-600">
              Gérez les profils et informations des formateurs
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau formateur</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-primary-200 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou fonction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary-800">
              {editingTrainer ? 'Modifier le formateur' : 'Nouveau formateur'}
            </h2>
            <button
              onClick={resetForm}
              className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo de profil */}
            <div>
              <label className="block text-primary-700 text-sm font-medium mb-2">
                Photo de profil (optionnelle)
              </label>
              <div className="flex items-center space-x-4">
                {formData.profile_picture_url ? (
                  <img
                    src={formData.profile_picture_url}
                    alt="Photo de profil"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, editingTrainer?.id);
                    }}
                    className="hidden"
                    id="profile-picture"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="profile-picture"
                    className={`inline-flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg cursor-pointer transition-colors duration-200 ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{uploadingImage ? 'Téléchargement...' : 'Choisir une photo'}</span>
                  </label>
                  {formData.profile_picture_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, profile_picture_url: '' }))}
                      className="ml-2 text-error hover:text-error-dark text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Nom et prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Email professionnel *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={!!editingTrainer}
                    className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 disabled:bg-primary-100 disabled:cursor-not-allowed"
                    placeholder="jean.dupont@formation.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Numéro de téléphone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Fonction/Titre *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <select
                    value={formData.function_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, function_title: e.target.value }))}
                    required
                    className="w-full pl-11 pr-8 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Sélectionner une fonction</option>
                    {FUNCTION_TITLE_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Informations complémentaires */}
            <div>
              <label className="block text-primary-700 text-sm font-medium mb-2">
                Expérience professionnelle
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                placeholder="Décrivez brièvement l'expérience professionnelle du formateur..."
              />
            </div>

            <div>
              <label className="block text-primary-700 text-sm font-medium mb-2">
                Disponibilités
              </label>
              <textarea
                value={formData.availability}
                onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                placeholder="Créneaux ou périodes de disponibilité..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-primary-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trainers List */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-primary-200">
          <h2 className="text-xl font-semibold text-primary-800">
            Formateurs ({filteredTrainers.length})
          </h2>
        </div>

        <div className="divide-y divide-primary-200">
          {filteredTrainers.map((trainer) => (
            <div key={trainer.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {trainer.profile_picture_url ? (
                    <img
                      src={trainer.profile_picture_url}
                      alt={trainer.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-primary-800 font-medium mb-1">
                      {trainer.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm">
                      <span className="text-primary-600">{trainer.email}</span>
                      {trainer.phone_number && (
                        <span className="text-primary-600">{trainer.phone_number}</span>
                      )}
                      {trainer.function_title && (
                        <span className="px-2 py-1 bg-accent bg-opacity-10 text-accent rounded-full text-xs">
                          {trainer.function_title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(trainer)}
                    className="bg-warning hover:bg-warning-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(trainer)}
                    className="bg-error hover:bg-error-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTrainers.length === 0 && (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-primary-700 font-medium mb-2">
              {searchTerm ? 'Aucun formateur trouvé' : 'Aucun formateur'}
            </h3>
            <p className="text-primary-600 text-sm mb-4">
              {searchTerm 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier formateur'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Ajouter le premier formateur
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerManagement;