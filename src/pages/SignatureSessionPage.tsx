import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PenTool, Check, X, RotateCcw, Users, ChevronDown, User, CheckCircle, Sun, Moon } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  company: string;
  has_signed: boolean;
  is_present: boolean;
  signature_date: string | null;
  signature_data?: string;
  session_presence?: 'matin' | 'apresmidi' | 'journee' | null;
}

interface Training {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  trainer_name: string;
}

function SignatureSessionPage() {
  const { trainingId, sessionType } = useParams<{ trainingId: string; sessionType: string }>();
  const navigate = useNavigate();
  const [training, setTraining] = useState<Training | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Conversion de sessionType en texte lisible
  const sessionDisplay = sessionType === 'matin' ? 'du matin' : 'de l\'après-midi';
  
  useEffect(() => {
    if (trainingId) {
      fetchData();
    }
  }, [trainingId]);

  useEffect(() => {
    // Détecter les clics à l'extérieur du dropdown pour le fermer
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données de la formation
      const { data: trainingData, error: trainingError } = await supabase
        .from('trainings')
        .select('id, title, company, location, start_date, end_date, start_time, end_time, trainer_name')
        .eq('id', trainingId)
        .single();

      if (trainingError) {
        console.error('Error fetching training:', trainingError);
        return;
      }

      setTraining(trainingData);

      // Récupérer les participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('training_id', trainingId)
        .order('name');

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      setParticipants(participantsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajuster la taille du canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Configurer le style de dessin
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Remplir le fond
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (signing) {
      initializeCanvas();
    }
  }, [signing]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const confirmSignature = async () => {
    if (!hasSignature || !selectedParticipant) return;

    try {
      // Capture la signature comme une image base64
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const signatureData = canvas.toDataURL('image/png');
      
      // Mettre à jour les informations de présence spécifiques à la session
      let updates: Record<string, any> = {
        has_signed: true,
        is_present: true,
        signature_date: new Date().toISOString(),
        signature_data: signatureData
      };
      
      // Ajouter la session spécifique (matin ou après-midi)
      if (sessionType === 'matin') {
        updates.session_presence = selectedParticipant.session_presence === 'apresmidi' ? 'journee' : 'matin';
      } else {
        updates.session_presence = selectedParticipant.session_presence === 'matin' ? 'journee' : 'apresmidi';
      }
      
      const { error } = await supabase
        .from('participants')
        .update(updates)
        .eq('id', selectedParticipant.id)
        .eq('training_id', trainingId);

      if (error) {
        console.error('Error saving signature:', error);
        alert('Erreur lors de l\'enregistrement de la signature');
        return;
      }

      setSignatureComplete(true);
      
      // Mettre à jour la liste des participants
      const updatedParticipants = participants.map(p => 
        p.id === selectedParticipant.id 
          ? { ...p, ...updates } 
          : p
      );
      
      setParticipants(updatedParticipants);
      setSigning(false);
      setSelectedParticipant(null);
      
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleSelectParticipant = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDropdownOpen(false);
  };

  const handleStartSignature = () => {
    if (!selectedParticipant) {
      alert('Veuillez sélectionner un participant');
      return;
    }
    
    setSigning(true);
    setHasSignature(false);
    setTimeout(() => initializeCanvas(), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="text-primary-600">Chargement de la page de signature...</p>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md w-full shadow-lg border border-primary-200">
          <X className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-800 mb-4">
            Lien invalide
          </h2>
          <p className="text-primary-600">
            Cette page de signature n'est pas valide ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  if (signatureComplete) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md w-full animate-scale-in shadow-lg border border-primary-200">
          <Check className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-800 mb-4">
            Signature enregistrée !
          </h2>
          <p className="text-primary-600 mb-6">
            Merci, votre signature a été enregistrée avec succès pour la session {sessionDisplay}.
          </p>
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="text-sm text-primary-700 space-y-1">
              <p><strong>Formation :</strong> {training.title}</p>
              <p><strong>Date :</strong> {new Date(training.start_date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Session :</strong> {sessionType === 'matin' ? 'Matin' : 'Après-midi'}</p>
              <p><strong>Lieu :</strong> {training.location}</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all duration-200"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 p-4">
      <div className="max-w-2xl mx-auto">
        {signing ? (
          <div className="bg-white rounded-xl border border-primary-200 overflow-hidden animate-fade-in shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary-800">
                  Signature électronique
                </h1>
                <button
                  onClick={() => setSigning(false)}
                  className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-2 text-sm mt-2">
                <p className="text-primary-700">
                  <strong>Participant :</strong> {selectedParticipant?.name}
                </p>
                <p className="text-primary-700">
                  <strong>Formation :</strong> {training.title}
                </p>
                <p className="text-primary-700">
                  <strong>Session :</strong> {sessionType === 'matin' ? 'Matin' : 'Après-midi'}
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="p-6">
              <div className="bg-white rounded-lg border-2 border-accent relative">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-primary-800">
                      <PenTool className="w-5 h-5" />
                      <span className="font-medium">Signez dans la zone ci-dessous</span>
                    </div>
                    <button
                      onClick={clearSignature}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Effacer</span>
                    </button>
                  </div>
                  
                  <canvas
                    ref={canvasRef}
                    className="w-full h-48 border border-primary-300 rounded cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  
                  <p className="text-xs text-primary-500 mt-2 text-center">
                    Utilisez votre doigt ou stylet pour signer
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setSigning(false)}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmSignature}
                  disabled={!hasSignature}
                  className="flex-1 bg-success hover:bg-success-dark disabled:bg-primary-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Confirmer la signature</span>
                </button>
              </div>

              <div className="mt-4 p-4 bg-accent bg-opacity-10 rounded-lg border border-accent border-opacity-30">
                <p className="text-primary-800 text-sm">
                  <strong>Information :</strong> En signant ce document, vous confirmez votre présence à cette formation. 
                  Votre signature sera enregistrée de manière sécurisée.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-primary-200 overflow-hidden animate-fade-in shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-primary-200">
              <div className="flex items-center space-x-3">
                {sessionType === 'matin' ? (
                  <Sun className="w-6 h-6 text-amber-500" />
                ) : (
                  <Moon className="w-6 h-6 text-blue-500" />
                )}
                <h1 className="text-2xl font-bold text-primary-800">
                  Feuille de présence - Session {sessionDisplay}
                </h1>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-primary-700">
                  <strong>Formation :</strong> {training.title}
                </p>
                <p className="text-primary-700">
                  <strong>Date :</strong> {new Date(training.start_date).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-primary-700">
                  <strong>Horaires :</strong> {sessionType === 'matin' ? 
                    `${training.start_time} - 12:00` : 
                    `13:00 - ${training.end_time}`}
                </p>
                <p className="text-primary-700">
                  <strong>Lieu :</strong> {training.location}
                </p>
                <p className="text-primary-700">
                  <strong>Entreprise :</strong> {training.company}
                </p>
                <p className="text-primary-700">
                  <strong>Formateur :</strong> {training.trainer_name}
                </p>
              </div>
            </div>
            
            {/* Participant Selection */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-accent" />
                Sélectionnez votre nom pour signer
              </h3>

              <div className="relative" ref={dropdownRef}>
                <div 
                  className="w-full p-3 border border-primary-300 rounded-lg bg-primary-50 flex justify-between items-center cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary-600" />
                    <span className={selectedParticipant ? 'text-primary-800 font-medium' : 'text-primary-500'}>
                      {selectedParticipant ? selectedParticipant.name : 'Choisir un participant'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-primary-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-primary-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {participants.filter(p => {
                      // Pour le matin, exclure ceux qui ont déjà signé pour le matin ou toute la journée
                      if (sessionType === 'matin') {
                        return !(p.session_presence === 'matin' || p.session_presence === 'journee');
                      } 
                      // Pour l'après-midi, exclure ceux qui ont déjà signé pour l'après-midi ou toute la journée
                      else {
                        return !(p.session_presence === 'apresmidi' || p.session_presence === 'journee');
                      }
                    }).length > 0 ? (
                      participants
                        .filter(p => {
                          if (sessionType === 'matin') {
                            return !(p.session_presence === 'matin' || p.session_presence === 'journee');
                          } else {
                            return !(p.session_presence === 'apresmidi' || p.session_presence === 'journee');
                          }
                        })
                        .map(participant => (
                          <div
                            key={participant.id}
                            className="p-3 hover:bg-primary-50 cursor-pointer border-b border-primary-100 flex items-center space-x-2"
                            onClick={() => handleSelectParticipant(participant)}
                          >
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                              {participant.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-primary-800">{participant.name}</div>
                              <div className="text-xs text-primary-600">{participant.email}</div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="p-4 text-center text-primary-600">
                        Tous les participants ont déjà signé pour cette session
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleStartSignature}
                disabled={!selectedParticipant}
                className="mt-6 w-full bg-accent hover:bg-accent-dark disabled:bg-primary-300 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                <PenTool className="w-5 h-5" />
                <span>Signer maintenant</span>
              </button>
              
              <div className="mt-8 p-4 border border-primary-200 rounded-lg bg-primary-50">
                <h4 className="font-medium text-primary-800 mb-2">Participants ayant déjà signé pour cette session:</h4>
                {participants.filter(p => {
                  if (sessionType === 'matin') {
                    return p.session_presence === 'matin' || p.session_presence === 'journee';
                  } else {
                    return p.session_presence === 'apresmidi' || p.session_presence === 'journee';
                  }
                }).length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {participants
                      .filter(p => {
                        if (sessionType === 'matin') {
                          return p.session_presence === 'matin' || p.session_presence === 'journee';
                        } else {
                          return p.session_presence === 'apresmidi' || p.session_presence === 'journee';
                        }
                      })
                      .map(participant => (
                        <div key={participant.id} className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-primary-200">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-primary-800">{participant.name}</span>
                          <span className="text-xs text-primary-600">
                            {participant.signature_date && 
                              new Date(participant.signature_date).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-primary-600 text-sm">Aucune signature pour l'instant</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignatureSessionPage;