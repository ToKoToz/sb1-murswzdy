import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import DatePicker from '../components/ui/DatePicker';
import { 
  ArrowLeft, Save, Calendar, MapPin, Clock, Building, User, 
  BookOpen, Plus, Users, Check, X, Sun, Moon, CalendarDays,
  Trash2, AlertCircle
} from 'lucide-react';
import Alert from '../components/ui/Alert';
import { supabase } from '../lib/supabase';

// Type pour un jour de formation
interface TrainingDay {
  date: string;
  hasMorningSchedule: boolean;
  hasAfternoonSchedule: boolean;
  start_time_morning: string;
  end_time_morning: string;
  start_time_afternoon: string;
  end_time_afternoon: string;
}

function CreateTraining() {
  const navigate = useNavigate();
  const { addTraining, trainers, clients, currentUser, refreshTrainings } = useData();
  
  // État principal du formulaire
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    trainer_id: currentUser?.id || '',
    trainer_name: currentUser?.name || '',
    status: 'active' as const // Modifier de 'draft' à 'active' pour que les formations créées soient visibles
  });
  
  // Gestion des jours de formation
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([{
    date: '',
    hasMorningSchedule: true,
    hasAfternoonSchedule: true,
    start_time_morning: '09:00',
    end_time_morning: '12:00',
    start_time_afternoon: '13:00',
    end_time_afternoon: '17:00'
  }]);
  
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ 
    show: boolean; 
    type: 'success' | 'error' | 'warning' | 'info'; 
    message: string 
  }>({ show: false, type: 'info', message: '' });

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser && !formData.trainer_id) {
      setFormData(prev => ({
        ...prev,
        trainer_id: currentUser.id,
        trainer_name: currentUser.name
      }));
    }
  }, [currentUser, formData.trainer_id]);

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Ajouter un nouveau jour de formation
  const addTrainingDay = () => {
    setTrainingDays(prev => [...prev, {
      date: '',
      hasMorningSchedule: true,
      hasAfternoonSchedule: true,
      start_time_morning: '09:00',
      end_time_morning: '12:00',
      start_time_afternoon: '13:00',
      end_time_afternoon: '17:00'
    }]);
  };

  // Supprimer un jour de formation
  const removeTrainingDay = (index: number) => {
    if (trainingDays.length === 1) {
      showAlert('warning', 'Vous devez avoir au moins un jour de formation');
      return;
    }
    setTrainingDays(prev => prev.filter((_, i) => i !== index));
  };

  // Mettre à jour les informations d'un jour de formation
  const updateTrainingDay = (index: number, updates: Partial<TrainingDay>) => {
    setTrainingDays(prev => prev.map((day, i) => 
      i === index ? { ...day, ...updates } : day
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.company || !formData.location || !formData.trainer_id) {
      showAlert('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!trainingDays.some(day => day.date)) {
      showAlert('error', 'Veuillez sélectionner au moins une date de formation');
      return;
    }

    // Vérifier que chaque jour a au moins un horaire (matin ou après-midi)
    const invalidDays = trainingDays.filter(day => !day.hasMorningSchedule && !day.hasAfternoonSchedule);
    if (invalidDays.length > 0) {
      showAlert('error', 'Chaque jour de formation doit avoir au moins un horaire (matin ou après-midi)');
      return;
    }

    // Vérifier que toutes les dates sont remplies
    if (trainingDays.some(day => !day.date)) {
      showAlert('error', 'Veuillez sélectionner une date pour chaque jour de formation');
      return;
    }
    
    // Trier les jours par date
    const sortedDays = [...trainingDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setIsSubmitting(true);
    
    try {
      const createdTrainings = [];
      
      // Pour chaque jour de formation, créer une formation distincte
      for (let dayIndex = 0; dayIndex < sortedDays.length; dayIndex++) {
        const day = sortedDays[dayIndex];
        
        // Déterminer les horaires de début et fin en fonction des options choisies
        let startTime = '';
        let endTime = '';
        
        if (day.hasMorningSchedule && day.hasAfternoonSchedule) {
          startTime = day.start_time_morning;
          endTime = day.end_time_afternoon;
        } else if (day.hasMorningSchedule) {
          startTime = day.start_time_morning;
          endTime = day.end_time_morning;
        } else if (day.hasAfternoonSchedule) {
          startTime = day.start_time_afternoon;
          endTime = day.end_time_afternoon;
        }

        const trainingData = {
          title: sortedDays.length > 1 
            ? `${formData.title} (Jour ${dayIndex + 1}/${sortedDays.length})` 
            : formData.title,
          company: formData.company,
          location: formData.location,
          start_date: day.date,
          end_date: day.date, // Même date car une journée à la fois
          start_time: startTime,
          end_time: endTime,
          trainer_id: formData.trainer_id,
          trainer_name: formData.trainer_name,
          days: 1, // Toujours 1 car chaque jour est une formation distincte
          status: formData.status // Statut 'active' par défaut
        };

        const result = await addTraining(trainingData);
        
        if (result) {
          createdTrainings.push(result);
          
          // Si c'est le premier jour et qu'on a des participants sélectionnés, les ajouter
          if (dayIndex === 0 && selectedTrainees.length > 0) {
            const selectedClient = clients.find(c => c.name === formData.company);
            if (selectedClient && selectedClient.employees) {
              const selectedEmployees = selectedClient.employees.filter(emp => 
                selectedTrainees.includes(emp.id)
              );
              
              // Préparer les participants pour l'insertion groupée
              const participantsToInsert = selectedEmployees.map(employee => ({
                training_id: result.id,
                name: `${employee.first_name} ${employee.last_name}`,
                email: employee.email,
                company: formData.company,
                has_signed: false,
                is_present: false,
                signature_date: null
              }));
              
              // Insérer tous les participants en une seule requête
              if (participantsToInsert.length > 0) {
                try {
                  const { error } = await supabase
                    .from('participants')
                    .insert(participantsToInsert);
                    
                  if (error) {
                    console.error('Error adding participants:', error);
                    showAlert('error', 'Erreur lors de l\'ajout des participants');
                  }
                } catch (error) {
                  console.error('Error adding participants:', error);
                  showAlert('error', 'Erreur lors de l\'ajout des participants');
                }
              }
            }
          }
        } else {
          showAlert('error', 'Erreur lors de la création de la formation');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Rafraîchir les données pour s'assurer que les participants sont chargés
      await refreshTrainings();
      
      // Attendre un moment pour s'assurer que les données sont propagées
      setTimeout(() => {
        setIsSubmitting(false);
        
        // Rediriger vers le détail de la première formation créée
        if (createdTrainings.length > 0) {
          navigate(`/trainings/${createdTrainings[0].id}`);
        } else {
          // Fallback vers la liste des formations
          navigate('/trainings');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error creating training:', error);
      showAlert('error', 'Erreur lors de la création de la formation');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTrainerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const trainerId = e.target.value;
    const trainer = trainers.find(t => t.id === trainerId);
    setFormData(prev => ({
      ...prev,
      trainer_id: trainerId,
      trainer_name: trainer?.name || currentUser?.name || ''
    }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData(prev => ({ 
      ...prev, 
      company: selectedClient?.name || '' 
    }));
    // Reset selected trainees when company changes
    setSelectedTrainees([]);
  };

  const toggleTrainee = (employeeId: string) => {
    setSelectedTrainees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllTrainees = () => {
    const selectedClient = clients.find(c => c.name === formData.company);
    if (selectedClient && selectedClient.employees) {
      const allEmployeeIds = selectedClient.employees.map(emp => emp.id);
      setSelectedTrainees(allEmployeeIds);
    }
  };

  const deselectAllTrainees = () => {
    setSelectedTrainees([]);
  };

  const selectedClient = clients.find(c => c.name === formData.company);
  const availableEmployees = selectedClient?.employees || [];

  // Fonction pour vérifier si tous les jours ont au moins un horaire activé
  const areAllDaysValid = () => {
    return trainingDays.every(day => day.hasMorningSchedule || day.hasAfternoonSchedule);
  };

  // Show loading state if currentUser is not loaded yet
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-primary-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerte */}
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/trainings"
          className="text-accent hover:text-accent-dark transition-colors duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary-800 mb-2">
            Nouvelle Formation
          </h1>
          <p className="text-primary-600">
            Créez une nouvelle formation et assignez un formateur
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-primary-200 p-8 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-primary-800 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-accent" />
              Informations générales
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Titre de la formation *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                  placeholder="ex: Formation Sécurité au Travail"
                />
              </div>
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Société *
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                    <select
                      value={clients.find(c => c.name === formData.company)?.id || ''}
                      onChange={handleCompanyChange}
                      required
                      className="w-full pl-11 pr-8 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {clients.length === 0 && (
                    <div className="text-sm text-primary-600 bg-primary-50 p-3 rounded-lg border border-primary-200">
                      <p className="mb-2">Aucun client créé.</p>
                      <Link
                        to="/clients"
                        className="inline-flex items-center space-x-1 text-accent hover:text-accent-dark font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Créer un client d'abord</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trainees Selection - MOVED UP */}
          <div>
            <h2 className="text-xl font-semibold text-primary-800 mb-6 flex items-center">
              <Users className="w-6 h-6 mr-3 text-accent" />
              Stagiaires
            </h2>
            
            {formData.company && availableEmployees.length > 0 ? (
              <div className="space-y-4">
                {/* Selection Controls */}
                <div className="flex items-center justify-between bg-primary-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-primary-700 font-medium">
                      {selectedTrainees.length} / {availableEmployees.length} sélectionné(s)
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={selectAllTrainees}
                      className="px-3 py-1 bg-success hover:bg-success-dark text-white rounded text-sm transition-colors duration-200"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllTrainees}
                      className="px-3 py-1 bg-error hover:bg-error-dark text-white rounded text-sm transition-colors duration-200"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                {/* Employees List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                        selectedTrainees.includes(employee.id)
                          ? 'border-accent bg-accent bg-opacity-10'
                          : 'border-primary-300 bg-white hover:border-accent'
                      }`}
                      onClick={() => toggleTrainee(employee.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-primary-800 font-medium">
                            {employee.first_name} {employee.last_name}
                          </h4>
                          <p className="text-primary-600 text-sm">{employee.email}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedTrainees.includes(employee.id)
                            ? 'border-accent bg-accent'
                            : 'border-primary-300'
                        }`}>
                          {selectedTrainees.includes(employee.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message si aucun stagiaire sélectionné */}
                {selectedTrainees.length === 0 && (
                  <div className="text-center py-8 bg-primary-50 rounded-lg border border-primary-200">
                    <Users className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                    <p className="text-primary-600">
                      Sélectionnez les employés qui participeront à cette formation
                    </p>
                    <p className="text-primary-600 mt-2 text-sm">
                      <strong>Note :</strong> Les stagiaires sélectionnés seront inscrits à tous les jours de cette formation
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-primary-50 rounded-lg border border-primary-200">
                <Users className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                {!formData.company ? (
                  <p className="text-primary-600 mb-2">
                    Veuillez sélectionner une société pour afficher les stagiaires disponibles
                  </p>
                ) : (
                  <p className="text-primary-600 mb-2">
                    Aucun employé trouvé pour ce client
                  </p>
                )}
                <Link
                  to="/clients"
                  className="inline-flex items-center space-x-1 text-accent hover:text-accent-dark font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter des employés au client</span>
                </Link>
              </div>
            )}
          </div>

          {/* Location and Trainer */}
          <div>
            <h2 className="text-xl font-semibold text-primary-800 mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3 text-accent" />
              Lieu et formateur
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Lieu de la formation *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                  placeholder="ex: Paris, France"
                />
              </div>
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Formateur assigné *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <select
                    name="trainer_id"
                    value={formData.trainer_id}
                    onChange={handleTrainerChange}
                    required
                    className="w-full pl-11 pr-8 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                  >
                    <option value={currentUser.id}>{currentUser.name} (Vous)</option>
                    {trainers
                      .filter(trainer => trainer.id !== currentUser.id)
                      .map(trainer => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dates et horaires (nouveau format) */}
          <div>
            <h2 className="text-xl font-semibold text-primary-800 mb-6 flex items-center">
              <CalendarDays className="w-6 h-6 mr-3 text-accent" />
              Jours de Formation
              <span className="ml-2 px-2.5 py-0.5 bg-primary-100 text-primary-800 text-sm rounded-full">
                {trainingDays.length} {trainingDays.length > 1 ? 'jours' : 'jour'}
              </span>
            </h2>

            {/* Liste des jours */}
            <div className="space-y-8">
              {trainingDays.map((day, index) => (
                <div 
                  key={index} 
                  className="p-6 border border-primary-200 rounded-lg shadow-sm bg-white relative"
                >
                  {/* En-tête du jour */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-primary-800 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-accent" />
                      Jour {index + 1}
                    </h3>
                    {trainingDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTrainingDay(index)}
                        className="text-error hover:text-error-dark transition-colors p-1.5 rounded-full hover:bg-error-light hover:bg-opacity-20"
                        title="Supprimer ce jour"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Sélection de date */}
                  <div className="mb-6">
                    <label className="block text-primary-700 text-sm font-medium mb-2">
                      Date *
                    </label>
                    <DatePicker
                      value={day.date}
                      onChange={(date: string) => updateTrainingDay(index, { date })}
                      placeholder="Sélectionner la date"
                      required
                    />
                  </div>

                  {/* Schedule Toggles */}
                  <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <h4 className="text-md font-medium text-primary-800 mb-4">
                      Périodes de formation
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Morning Toggle */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-primary-300">
                        <div className="flex items-center space-x-3">
                          <Sun className="w-5 h-5 text-yellow-600" />
                          <span className="text-primary-800 font-medium">Formation le matin</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateTrainingDay(index, { hasMorningSchedule: !day.hasMorningSchedule })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            day.hasMorningSchedule ? 'bg-accent' : 'bg-primary-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              day.hasMorningSchedule ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Afternoon Toggle */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-primary-300">
                        <div className="flex items-center space-x-3">
                          <Moon className="w-5 h-5 text-blue-600" />
                          <span className="text-primary-800 font-medium">Formation l'après-midi</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateTrainingDay(index, { hasAfternoonSchedule: !day.hasAfternoonSchedule })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            day.hasAfternoonSchedule ? 'bg-accent' : 'bg-primary-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              day.hasAfternoonSchedule ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Validation Message */}
                    {!day.hasMorningSchedule && !day.hasAfternoonSchedule && (
                      <div className="mt-4 p-3 bg-error-light bg-opacity-20 border border-error rounded-lg">
                        <p className="text-error-dark text-sm flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Vous devez sélectionner au moins une période (matin ou après-midi)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Horaires détaillés */}
                  <div className="space-y-6">
                    {/* Morning Schedule */}
                    {day.hasMorningSchedule && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
                          <Sun className="w-5 h-5 mr-2 text-yellow-600" />
                          Horaires du matin
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-primary-700 text-sm font-medium mb-2">
                              Heure de début matin *
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                              <input
                                type="time"
                                value={day.start_time_morning}
                                onChange={(e) => updateTrainingDay(index, { start_time_morning: e.target.value })}
                                required={day.hasMorningSchedule}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-primary-700 text-sm font-medium mb-2">
                              Heure de fin matin *
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                              <input
                                type="time"
                                value={day.end_time_morning}
                                onChange={(e) => updateTrainingDay(index, { end_time_morning: e.target.value })}
                                required={day.hasMorningSchedule}
                                min={day.start_time_morning}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Afternoon Schedule */}
                    {day.hasAfternoonSchedule && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
                          <Moon className="w-5 h-5 mr-2 text-blue-600" />
                          Horaires de l'après-midi
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-primary-700 text-sm font-medium mb-2">
                              Heure de début après-midi *
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                              <input
                                type="time"
                                value={day.start_time_afternoon}
                                onChange={(e) => updateTrainingDay(index, { start_time_afternoon: e.target.value })}
                                required={day.hasAfternoonSchedule}
                                min={day.hasMorningSchedule ? day.end_time_morning : undefined}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-primary-700 text-sm font-medium mb-2">
                              Heure de fin après-midi *
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                              <input
                                type="time"
                                value={day.end_time_afternoon}
                                onChange={(e) => updateTrainingDay(index, { end_time_afternoon: e.target.value })}
                                required={day.hasAfternoonSchedule}
                                min={day.start_time_afternoon}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Schedule Summary */}
                    {(day.hasMorningSchedule || day.hasAfternoonSchedule) && (
                      <div className="p-4 bg-accent bg-opacity-10 border border-accent border-opacity-30 rounded-lg">
                        <h4 className="text-primary-800 font-medium mb-3 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Résumé des horaires :
                        </h4>
                        <div className="space-y-2">
                          {day.hasMorningSchedule && (
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                              <span className="text-primary-700">
                                <strong>Matin :</strong> {day.start_time_morning} - {day.end_time_morning}
                              </span>
                            </div>
                          )}
                          {day.hasAfternoonSchedule && (
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                              <span className="text-primary-700">
                                <strong>Après-midi :</strong> {day.start_time_afternoon} - {day.end_time_afternoon}
                              </span>
                            </div>
                          )}
                          {day.hasMorningSchedule && day.hasAfternoonSchedule && (
                            <div className="flex items-center space-x-2 pt-2 border-t border-accent border-opacity-20">
                              <span className="w-3 h-3 bg-accent rounded-full"></span>
                              <span className="text-primary-700">
                                <strong>Journée complète :</strong> {day.start_time_morning} - {day.end_time_afternoon}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton pour ajouter un jour */}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={addTrainingDay}
                className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter un jour</span>
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-primary-200">
            <Link
              to="/trainings"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !areAllDaysValid() || trainingDays.some(day => !day.date)}
              className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>
                {isSubmitting ? 'Création...' : `Créer ${trainingDays.length > 1 ? 'les formations' : 'la formation'}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTraining;