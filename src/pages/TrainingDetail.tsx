import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DatePicker from '../components/ui/DatePicker';
import ConfirmDialog from '../components/ui/ConfirmDialog'; // Import ConfirmDialog
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import QRCode from 'qrcode';
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  User,
  Users,
  QrCode,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Download,
  UserCheck,
  UserX,
  Edit,
  Save,
  X,
  Building,
  Pencil,
  Copy,
  LinkIcon,
  Sun,
  Moon,
  Maximize2,
  Check
} from 'lucide-react';

function TrainingDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    getTraining, 
    updateTraining, 
    updateParticipant, 
    addParticipant, 
    removeParticipant, 
    trainers,
    refreshTrainings 
  } = useData();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showAddMultipleParticipants, setShowAddMultipleParticipants] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [editableTrainingData, setEditableTrainingData] = useState<any>({});
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [sessionQrCodes, setSessionQrCodes] = useState<{ matin: string, apresmidi: string }>({ matin: '', apresmidi: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmParticipant, setShowDeleteConfirmParticipant] = useState<string | null>(null); // Renamed to avoid conflict
  const [showDeleteConfirmTraining, setShowDeleteConfirmTraining] = useState(false); // New state for training deletion
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [showSessionQRModal, setShowSessionQRModal] = useState<'matin' | 'apresmidi' | null>(null);
  const [activeTab, setActiveTab] = useState<'matin' | 'apresmidi'>('matin');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const training = id ? getTraining(id) : undefined;

  useEffect(() => {
    if (training) {
      setEditableTrainingData({
        title: training.title,
        company: training.company,
        location: training.location,
        start_date: training.start_date,
        end_date: training.end_date,
        start_time: training.start_time,
        end_time: training.end_time,
        trainer_id: training.trainer_id || '',
        trainer_name: training.trainer_name
      });
      
      // Generate session QR codes
      generateSessionQRCode('matin');
      generateSessionQRCode('apresmidi');
    }
  }, [training]);

  const showAlertMessage = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const generateQRCode = async (participantId: string) => {
    try {
      const url = `${window.location.origin}/signature/${training?.id}/${participantId}`;
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000', // Noir au lieu du bleu
          light: '#ffffff'
        }
      });
      setQrCodes(prev => ({ ...prev, [participantId]: qrCodeDataURL }));
    } catch (error) {
      console.error('Error generating QR code:', error);
      showAlertMessage('error', 'Erreur lors de la génération du QR code');
    }
  };
  
  const generateSessionQRCode = async (session: 'matin' | 'apresmidi') => {
    try {
      const url = `${window.location.origin}/signature-session/${training?.id}/${session}`;
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000', // Black QR code
          light: '#ffffff'
        }
      });
      
      setSessionQrCodes(prev => ({
        ...prev,
        [session]: qrCodeDataURL
      }));
    } catch (error) {
      console.error('Error generating session QR code:', error);
      showAlertMessage('error', 'Erreur lors de la génération du QR code de session');
    }
  };

  const handleEditClick = () => {
    if (!training) return;
    
    setEditableTrainingData({
      title: training.title,
      company: training.company,
      location: training.location,
      start_date: training.start_date,
      end_date: training.end_date,
      start_time: training.start_time,
      end_time: training.end_time,
      trainer_id: training.trainer_id || '',
      trainer_name: training.trainer_name
    });
    
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    
    // Reset the editable data to the original values
    if (training) {
      setEditableTrainingData({
        title: training.title,
        company: training.company,
        location: training.location,
        start_date: training.start_date,
        end_date: training.end_date,
        start_time: training.start_time,
        end_time: training.end_time,
        trainer_id: training.trainer_id || '',
        trainer_name: training.trainer_name
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!training || !id) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate data
      if (!editableTrainingData.title || !editableTrainingData.location || 
          !editableTrainingData.start_date || !editableTrainingData.end_date || 
          !editableTrainingData.start_time || !editableTrainingData.end_time) {
        showAlertMessage('error', 'Veuillez remplir tous les champs obligatoires');
        setIsSubmitting(false);
        return;
      }
      
      // If trainer is changed, update trainer name
      if (editableTrainingData.trainer_id !== training.trainer_id) {
        const selectedTrainer = trainers.find(t => t.id === editableTrainingData.trainer_id);
        if (selectedTrainer) {
          editableTrainingData.trainer_name = selectedTrainer.name;
        }
      }
      
      // Update training
      const success = await updateTraining(id, editableTrainingData);
      
      if (success) {
        showAlertMessage('success', 'Formation mise à jour avec succès');
        setIsEditing(false);
        await refreshTrainings(); // Refresh to get the updated data
      } else {
        showAlertMessage('error', 'Erreur lors de la mise à jour de la formation');
      }
    } catch (error) {
      console.error('Error updating training:', error);
      showAlertMessage('error', 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!training || !id) return;
    
    if (!newParticipant.name || !newParticipant.email) {
      showAlertMessage('error', 'Veuillez saisir au moins le nom et l\'email du participant');
      return;
    }
    
    // Default company to training company if not provided
    const participantData = {
      ...newParticipant,
      company: newParticipant.company || training.company,
      has_signed: false,
      is_present: false,
      signature_date: null
    };
    
    setIsSubmitting(true);
    
    try {
      const success = await addParticipant(id, participantData);
      
      if (success) {
        showAlertMessage('success', 'Participant ajouté avec succès');
        setNewParticipant({ name: '', email: '', company: '' });
        setShowAddParticipant(false);
      } else {
        showAlertMessage('error', 'Erreur lors de l\'ajout du participant');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      showAlertMessage('error', 'Une erreur est survenue lors de l\'ajout du participant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMultipleParticipants = async () => {
    if (!training || !id) return;
    
    if (selectedParticipants.length === 0) {
      showAlertMessage('warning', 'Veuillez sélectionner au moins un employé');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Récupération des employés sélectionnés
      // Ceci est un exemple simplifié, vous devrez adapter à votre modèle de données
      const participantsToAdd = selectedParticipants.map(employeeId => ({
        name: `Employé ${employeeId}`, // À remplacer par la vraie donnée
        email: `employee${employeeId}@example.com`, // À remplacer par la vraie donnée
        company: training.company,
        has_signed: false,
        is_present: false
      }));
      
      // Ajout des participants
      for (const participant of participantsToAdd) {
        await addParticipant(id, participant);
      }
      
      showAlertMessage('success', `${participantsToAdd.length} participants ajoutés avec succès`);
      setSelectedParticipants([]);
      setShowAddMultipleParticipants(false);
    } catch (error) {
      console.error('Error adding multiple participants:', error);
      showAlertMessage('error', 'Une erreur est survenue lors de l\'ajout des participants');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmParticipant = (participantId: string) => {
    setShowDeleteConfirmParticipant(participantId);
  };

  const handleRemoveParticipant = async () => {
    if (!training || !id || !showDeleteConfirmParticipant) return;
    
    try {
      const success = await removeParticipant(id, showDeleteConfirmParticipant);
      
      if (success) {
        showAlertMessage('success', 'Participant supprimé avec succès');
      } else {
        showAlertMessage('error', 'Erreur lors de la suppression du participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      showAlertMessage('error', 'Une erreur est survenue lors de la suppression du participant');
    } finally {
      setShowDeleteConfirmParticipant(null);
    }
  };

  const togglePresence = async (participantId: string, currentPresence: boolean) => {
    if (!training || !id) return;
    
    try {
      await updateParticipant(id, participantId, { is_present: !currentPresence });
      showAlertMessage('success', `Participant marqué comme ${!currentPresence ? 'présent' : 'absent'}`);
    } catch (error) {
      console.error('Error updating presence:', error);
      showAlertMessage('error', 'Erreur lors de la mise à jour de la présence');
    }
  };

  const downloadQRCode = (participantId: string, participantName: string) => {
    const qrCode = qrCodes[participantId];
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `qr-code-${participantName.replace(/\s+/g, '-')}.png`;
      link.href = qrCode;
      link.click();
    } else {
      showAlertMessage('error', 'Le QR code n\'a pas encore été généré. Cliquez d\'abord sur l\'icône QR code.');
    }
  };
  
  const downloadSessionQRCode = (session: 'matin' | 'apresmidi') => {
    const qrCode = sessionQrCodes[session];
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `qr-code-session-${session}.png`;
      link.href = qrCode;
      link.click();
    } else {
      showAlertMessage('error', 'Le QR code n\'a pas encore été généré.');
    }
  };

  const copySessionLink = (session: 'matin' | 'apresmidi') => {
    const url = `${window.location.origin}/signature-session/${training?.id}/${session}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        showAlertMessage('success', 'Lien copié dans le presse-papiers');
      })
      .catch(err => {
        console.error('Error copying link:', err);
        showAlertMessage('error', 'Erreur lors de la copie du lien');
      });
  };
  
  const copyParticipantLink = (participantId: string) => {
    const url = `${window.location.origin}/signature/${training?.id}/${participantId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        showAlertMessage('success', 'Lien copié dans le presse-papiers');
      })
      .catch(err => {
        console.error('Error copying link:', err);
        showAlertMessage('error', 'Erreur lors de la copie du lien');
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableTrainingData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: string) => (value: string) => {
    setEditableTrainingData(prev => ({ ...prev, [field]: value }));
  };

  const handleTrainerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const trainerId = e.target.value;
    const trainer = trainers.find(t => t.id === trainerId);
    
    setEditableTrainingData(prev => ({
      ...prev,
      trainer_id: trainerId,
      trainer_name: trainer?.name || ''
    }));
  };

  const confirmDeleteTrainingAction = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      showAlertMessage('success', 'Formation supprimée avec succès');
      
      // Rediriger vers la liste des formations après un court délai
      setTimeout(() => {
        navigate('/trainings');
      }, 1500);
    } catch (error) {
      console.error('Error deleting training:', error);
      showAlertMessage('error', 'Erreur lors de la suppression de la formation');
    } finally {
      setShowDeleteConfirmTraining(false); // Close the dialog
    }
  };
  
  const toggleSelectAllParticipants = () => {
    if (selectedParticipants.length === training?.participants?.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(training?.participants?.map(p => p.id) || []);
    }
  };
  
  const toggleSelectParticipant = (participantId: string) => {
    if (selectedParticipants.includes(participantId)) {
      setSelectedParticipants(prev => prev.filter(id => id !== participantId));
    } else {
      setSelectedParticipants(prev => [...prev, participantId]);
    }
  };

  if (!training) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-primary-800 mb-4">Formation non trouvée</h2>
        <Link
          to="/trainings"
          className="text-accent hover:text-accent-dark transition-colors duration-200"
        >
          ← Retour aux formations
        </Link>
      </div>
    );
  }

  // Déterminer si l'utilisateur a les droits d'édition
  const canEdit = user?.role === 'admin' || training.trainer_id === user?.id;
  
  // Filtrer les participants selon la session active
  const filteredParticipants = training.participants?.filter(participant => {
    if (activeTab === 'matin') {
      // Pour la session du matin, montrer tous sauf ceux qui ont déjà signé uniquement pour l'après-midi
      return participant.session_presence !== 'apresmidi';
    } else {
      // Pour la session de l'après-midi, montrer tous sauf ceux qui ont déjà signé uniquement pour le matin
      return participant.session_presence !== 'matin';
    }
  });

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

      {/* Confirmation Dialog for participant deletion */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirmParticipant}
        onClose={() => setShowDeleteConfirmParticipant(null)}
        onConfirm={handleRemoveParticipant}
        title="Supprimer le participant"
        message="Êtes-vous sûr de vouloir supprimer ce participant ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
      />
      
      {/* Confirmation Dialog for training deletion */}
      <ConfirmDialog
        isOpen={showDeleteConfirmTraining}
        onClose={() => setShowDeleteConfirmTraining(false)}
        onConfirm={confirmDeleteTrainingAction}
        title="Supprimer la formation"
        message="Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible"
        type="danger"
        confirmText="Supprimer"
        cancelText="Annuler"
      />
      
      {/* QR Code Modal */}
      <Modal
        isOpen={!!showQRModal}
        onClose={() => setShowQRModal(null)}
        title="QR Code pour signature individuelle"
        size="md"
      >
        {showQRModal && training.participants && (
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg border border-primary-200 inline-block mb-4">
              <img 
                src={qrCodes[showQRModal]} 
                alt="QR Code pour signature" 
                className="w-64 h-64 mx-auto" 
              />
            </div>
            
            <p className="text-primary-700 mb-4">
              {training.participants.find(p => p.id === showQRModal)?.name}
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => copyParticipantLink(showQRModal)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copier le lien</span>
              </button>
              
              <button
                onClick={() => downloadQRCode(
                  showQRModal, 
                  training.participants.find(p => p.id === showQRModal)?.name || 'participant'
                )}
                className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Session QR Code Modal */}
      <Modal
        isOpen={!!showSessionQRModal}
        onClose={() => setShowSessionQRModal(null)}
        title={`QR Code pour signatures de la session ${showSessionQRModal === 'matin' ? 'du matin' : 'de l\'après-midi'}`}
        size="md"
      >
        {showSessionQRModal && (
          <div className="text-center">
            <div className="bg-white p-6 rounded-lg border border-primary-200 inline-block mb-4">
              <img 
                src={sessionQrCodes[showSessionQRModal]} 
                alt={`QR Code session ${showSessionQRModal}`} 
                className="w-64 h-64 mx-auto" 
              />
            </div>
            
            <p className="text-primary-700 mb-4">
              Session {showSessionQRModal === 'matin' ? 'du matin' : 'de l\'après-midi'} pour "{training.title}"
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => copySessionLink(showSessionQRModal)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copier le lien</span>
              </button>
              
              <button
                onClick={() => downloadSessionQRCode(showSessionQRModal)}
                className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/trainings"
            className="text-accent hover:text-accent-dark transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            {isEditing ? (
              <input
                type="text"
                name="title"
                value={editableTrainingData.title}
                onChange={handleInputChange}
                className="text-3xl font-bold text-primary-800 mb-2 w-full bg-primary-50 border border-primary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            ) : (
              <h1 className="text-3xl font-bold text-primary-800 mb-2">
                {training.title}
              </h1>
            )}
            <p className="text-primary-600">
              Gestion des participants et signatures
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          {canEdit && (
            isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditClick}
                  className="bg-warning hover:bg-warning-dark text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowDeleteConfirmTraining(true)} // Open custom dialog
                    className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* Training Info */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Dates */}
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-medium">Dates</span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-primary-600 text-sm mb-1">Date de début</label>
                  <DatePicker
                    value={editableTrainingData.start_date}
                    onChange={handleDateChange('start_date')}
                    placeholder="Sélectionner une date"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-primary-600 text-sm mb-1">Date de fin</label>
                  <DatePicker
                    value={editableTrainingData.end_date}
                    onChange={handleDateChange('end_date')}
                    placeholder="Sélectionner une date"
                    min={editableTrainingData.start_date}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <p className="text-primary-800">
                {new Date(training.start_date).toLocaleDateString('fr-FR')} - {new Date(training.end_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          {/* Horaires */}
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-medium">Horaires</span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-primary-600 text-sm mb-1">Heure de début</label>
                  <input
                    type="time"
                    name="start_time"
                    value={editableTrainingData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg text-primary-800"
                  />
                </div>
                <div>
                  <label className="block text-primary-600 text-sm mb-1">Heure de fin</label>
                  <input
                    type="time"
                    name="end_time"
                    value={editableTrainingData.end_time}
                    onChange={handleInputChange}
                    min={editableTrainingData.start_time}
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg text-primary-800"
                  />
                </div>
              </div>
            ) : (
              <p className="text-primary-800">
                {training.start_time} - {training.end_time}
              </p>
            )}
          </div>

          {/* Lieu */}
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="font-medium">Lieu</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={editableTrainingData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg text-primary-800"
                placeholder="Ex: Paris, France"
              />
            ) : (
              <p className="text-primary-800">
                {training.location}
              </p>
            )}
          </div>

          {/* Entreprise */}
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <Building className="w-5 h-5 mr-2" />
              <span className="font-medium">Entreprise</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                name="company"
                value={editableTrainingData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg text-primary-800"
                placeholder="Nom de l'entreprise"
              />
            ) : (
              <p className="text-primary-800">
                {training.company}
              </p>
            )}
          </div>

          {/* Formateur */}
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <User className="w-5 h-5 mr-2" />
              <span className="font-medium">Formateur</span>
            </div>
            {isEditing ? (
              <select
                name="trainer_id"
                value={editableTrainingData.trainer_id}
                onChange={handleTrainerChange}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg text-primary-800"
              >
                <option value="">Sélectionner un formateur</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-primary-800">
                {training.trainer_name}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Session Tabs */}
      <div className="bg-white rounded-xl border border-primary-200 overflow-hidden shadow-lg">
        <div className="flex border-b border-primary-200">
          <button
            onClick={() => setActiveTab('matin')}
            className={`flex-1 py-4 px-6 flex items-center justify-center space-x-2 font-medium ${
              activeTab === 'matin' 
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' 
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Sun className={`w-5 h-5 ${activeTab === 'matin' ? 'text-amber-500' : 'text-primary-500'}`} />
            <span>Session Matin</span>
          </button>
          <button
            onClick={() => setActiveTab('apresmidi')}
            className={`flex-1 py-4 px-6 flex items-center justify-center space-x-2 font-medium ${
              activeTab === 'apresmidi' 
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Moon className={`w-5 h-5 ${activeTab === 'apresmidi' ? 'text-blue-500' : 'text-primary-500'}`} />
            <span>Session Après-midi</span>
          </button>
        </div>
        
        {/* Session Actions */}
        <div className={`p-6 border-b border-primary-200 ${
          activeTab === 'matin' ? 'bg-amber-50' : 'bg-blue-50'
        }`}>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-800 mb-1">
                Session {activeTab === 'matin' ? 'du matin' : 'de l\'après-midi'}
              </h3>
              <p className="text-primary-600 text-sm">
                {activeTab === 'matin' 
                  ? `${training.start_time} - 12:00` 
                  : `13:00 - ${training.end_time}`}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSessionQRModal(activeTab)}
                className={`px-4 py-2 ${
                  activeTab === 'matin' 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code de session</span>
              </button>
              
              <button
                onClick={() => copySessionLink(activeTab)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copier le lien</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 shadow-lg">
        <div className="p-6 border-b border-primary-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold text-primary-800">
                Participants ({filteredParticipants?.length || 0})
              </h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddMultipleParticipants(true)}
                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Ajouter plusieurs</span>
              </button>
              <button
                onClick={() => setShowAddParticipant(true)}
                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Add Participant Form */}
        {showAddParticipant && (
          <div className="p-6 border-b border-primary-200 bg-primary-50">
            <h3 className="text-lg font-medium text-primary-800 mb-4">Ajouter un participant</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nom complet *"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                className="px-4 py-2 bg-white border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                className="px-4 py-2 bg-white border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
              <input
                type="text"
                placeholder="Société (optionnel)"
                value={newParticipant.company}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, company: e.target.value }))}
                className="px-4 py-2 bg-white border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddParticipant}
                disabled={isSubmitting}
                className="bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Ajout...' : 'Ajouter'}</span>
              </button>
              <button
                onClick={() => {
                  setShowAddParticipant(false);
                  setNewParticipant({ name: '', email: '', company: '' });
                }}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Add Multiple Participants Form */}
        {showAddMultipleParticipants && (
          <div className="p-6 border-b border-primary-200 bg-primary-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-primary-800">Ajouter des employés</h3>
              <button
                onClick={() => setShowAddMultipleParticipants(false)}
                className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4 bg-white rounded-lg border border-primary-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-primary-800 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span>Employés disponibles</span>
                </h4>
                
                <button 
                  onClick={toggleSelectAllParticipants}
                  className="text-accent hover:text-accent-dark text-sm font-medium"
                >
                  {selectedParticipants.length === training.participants?.length 
                    ? 'Désélectionner tout' 
                    : 'Sélectionner tout'}
                </button>
              </div>
              
              {/* Liste des employés à sélectionner - à compléter avec vos données réelles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {/* Exemple d'employés à remplacer */}
                {[1, 2, 3, 4, 5].map(id => (
                  <div
                    key={id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-between ${
                      selectedParticipants.includes(String(id))
                        ? 'bg-accent bg-opacity-10 border border-accent'
                        : 'bg-primary-50 border border-primary-200 hover:border-accent'
                    }`}
                    onClick={() => toggleSelectParticipant(String(id))}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                        {id}
                      </div>
                      <div>
                        <div className="font-medium text-primary-800">Employé {id}</div>
                        <div className="text-xs text-primary-600">employee{id}@example.com</div>
                      </div>
                    </div>
                    
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedParticipants.includes(String(id))
                        ? 'bg-accent border-accent'
                        : 'border-primary-400'
                    }`}>
                      {selectedParticipants.includes(String(id)) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddMultipleParticipants(false)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMultipleParticipants}
                disabled={isSubmitting || selectedParticipants.length === 0}
                className="bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isSubmitting 
                    ? 'Ajout en cours...' 
                    : `Ajouter ${selectedParticipants.length} participant${selectedParticipants.length > 1 ? 's' : ''}`
                  }
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-200">
            <thead className="bg-primary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Participant
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Signature Matin
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Signature Après-midi
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Présence
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-200">
              {filteredParticipants?.map((participant) => (
                <tr key={participant.id} className="hover:bg-primary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-800">{participant.name}</div>
                    <div className="text-xs text-primary-600 flex flex-col sm:flex-row sm:space-x-2">
                      <span>{participant.email}</span>
                      {participant.company && (
                        <span className="text-primary-500 sm:before:content-['•'] sm:before:mx-1">
                          {participant.company}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Signature Status - Matin */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {(participant.session_presence === 'matin' || participant.session_presence === 'journee') ? (
                      <div className="inline-flex items-center text-success">
                        <CheckCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm">Signé</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center text-error">
                        <XCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm">Non signé</span>
                      </div>
                    )}
                  </td>
                  
                  {/* Signature Status - Après-midi */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {(participant.session_presence === 'apresmidi' || participant.session_presence === 'journee') ? (
                      <div className="inline-flex items-center text-success">
                        <CheckCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm">Signé</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center text-error">
                        <XCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm">Non signé</span>
                      </div>
                    )}
                  </td>
                  
                  {/* Presence Toggle */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => togglePresence(participant.id, participant.is_present)}
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        participant.is_present
                          ? 'bg-success hover:bg-success-dark text-white'
                          : 'bg-error hover:bg-error-dark text-white'
                      }`}
                    >
                      {participant.is_present ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Présent</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4" />
                          <span>Absent</span>
                        </>
                      )}
                    </button>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          generateQRCode(participant.id);
                          setShowQRModal(participant.id);
                        }}
                        className="text-accent hover:text-accent-dark p-1.5 hover:bg-accent-light hover:bg-opacity-10 rounded transition-colors"
                        title="Générer QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => copyParticipantLink(participant.id)}
                        className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-100 rounded transition-colors"
                        title="Copier le lien"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteConfirmParticipant(participant.id)}
                        className="text-error hover:text-error-dark p-1.5 hover:bg-error-light hover:bg-opacity-10 rounded transition-colors"
                        title="Supprimer le participant"
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

        {(!training.participants || training.participants.length === 0) && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-primary-700 font-medium mb-2">
              Aucun participant
            </h3>
            <p className="text-primary-600 text-sm mb-4">
              Ajoutez des participants à cette formation
            </p>
            <button
              onClick={() => setShowAddParticipant(true)}
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              Ajouter le premier participant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainingDetail;