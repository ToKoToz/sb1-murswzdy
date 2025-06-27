import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
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
  UserX
} from 'lucide-react';

function TrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const { getTraining, updateParticipant, addParticipant, removeParticipant } = useData();
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const training = id ? getTraining(id) : undefined;

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

  const generateQRCode = async (participantId: string) => {
    try {
      const url = `${window.location.origin}/signature/${training.id}/${participantId}`;
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#3b82f6',
          light: '#ffffff'
        }
      });
      setQrCodes(prev => ({ ...prev, [participantId]: qrCodeDataURL }));
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleAddParticipant = async () => {
    if (newParticipant.name && newParticipant.email && newParticipant.company) {
      setIsSubmitting(true);
      try {
        const success = await addParticipant(training.id, {
          ...newParticipant,
          has_signed: false,
          is_present: false,
          signature_date: null
        });
        
        if (success) {
          setNewParticipant({ name: '', email: '', company: '' });
          setShowAddParticipant(false);
        } else {
          alert('Erreur lors de l\'ajout du participant');
        }
      } catch (error) {
        console.error('Error adding participant:', error);
        alert('Erreur lors de l\'ajout du participant');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const togglePresence = async (participantId: string, currentPresence: boolean) => {
    try {
      await updateParticipant(training.id, participantId, { is_present: !currentPresence });
    } catch (error) {
      console.error('Error updating presence:', error);
      alert('Erreur lors de la mise à jour de la présence');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      try {
        const success = await removeParticipant(training.id, participantId);
        if (!success) {
          alert('Erreur lors de la suppression du participant');
        }
      } catch (error) {
        console.error('Error removing participant:', error);
        alert('Erreur lors de la suppression du participant');
      }
    }
  };

  const downloadQRCode = (participantId: string, participantName: string) => {
    const qrCode = qrCodes[participantId];
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `qr-code-${participantName.replace(/\s+/g, '-')}.png`;
      link.href = qrCode;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/trainings"
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
              {training.title}
            </h1>
            <p className="text-primary-600">
              Gestion des participants et signatures
            </p>
          </div>
        </div>
      </div>

      {/* Training Info */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-medium">Dates</span>
            </div>
            <p className="text-primary-800">
              {new Date(training.start_date).toLocaleDateString('fr-FR')} - {new Date(training.end_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-medium">Horaires</span>
            </div>
            <p className="text-primary-800">
              {training.start_time} - {training.end_time}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="font-medium">Lieu</span>
            </div>
            <p className="text-primary-800">
              {training.location}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-accent">
              <User className="w-5 h-5 mr-2" />
              <span className="font-medium">Formateur</span>
            </div>
            <p className="text-primary-800">
              {training.trainer_name}
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-primary-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold text-primary-800">
                Participants ({training.participants?.length || 0})
              </h2>
            </div>
            <button
              onClick={() => setShowAddParticipant(true)}
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* Add Participant Form */}
        {showAddParticipant && (
          <div className="p-6 border-b border-primary-200 bg-primary-50">
            <h3 className="text-lg font-medium text-primary-800 mb-4">Ajouter un participant</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nom complet"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                className="px-4 py-2 bg-white border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="email"
                placeholder="Email"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                className="px-4 py-2 bg-white border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="Société"
                value={newParticipant.company}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, company: e.target.value }))}
                className="px-4 py-2 bg-white border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddParticipant}
                disabled={isSubmitting}
                className="bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
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

        {/* Participants List */}
        <div className="divide-y divide-primary-200">
          {training.participants?.map((participant) => (
            <div key={participant.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-primary-800 font-medium mb-1">
                    {participant.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm">
                    <span className="text-primary-600">{participant.email}</span>
                    <span className="text-primary-600">{participant.company}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Signature Status */}
                  <div className="flex items-center space-x-2">
                    {participant.has_signed ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="text-success text-sm">Signé</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-error" />
                        <span className="text-error text-sm">Non signé</span>
                      </>
                    )}
                  </div>

                  {/* Presence Toggle */}
                  <button
                    onClick={() => togglePresence(participant.id, participant.is_present)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
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

                  {/* QR Code */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => generateQRCode(participant.id)}
                      className="bg-accent hover:bg-accent-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Générer QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    {qrCodes[participant.id] && (
                      <button
                        onClick={() => downloadQRCode(participant.id, participant.name)}
                        className="bg-warning hover:bg-warning-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Télécharger QR Code"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Remove Participant */}
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="bg-error hover:bg-error-dark text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Supprimer le participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* QR Code Display */}
              {qrCodes[participant.id] && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-primary-800 font-medium mb-2">
                        QR Code pour signature
                      </h4>
                      <p className="text-primary-600 text-sm">
                        Le participant peut scanner ce code avec son téléphone pour signer
                      </p>
                    </div>
                    <img
                      src={qrCodes[participant.id]}
                      alt={`QR Code pour ${participant.name}`}
                      className="w-24 h-24 border-2 border-accent rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
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