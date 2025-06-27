import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import DatePicker from '../components/ui/DatePicker';
import { ArrowLeft, Save, Calendar, MapPin, Clock, Building, User, BookOpen, Plus, Users, Check, X, Sun, Moon, CalendarDays } from 'lucide-react';

function CreateTraining() {
  const navigate = useNavigate();
  const { addTraining, trainers, clients, currentUser } = useData();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    start_time_morning: '09:00',
    end_time_morning: '12:00',
    start_time_afternoon: '13:00',
    end_time_afternoon: '17:00',
    trainer_id: currentUser?.id || '',
    trainer_name: currentUser?.name || '',
    days: 1,
    status: 'draft' as const
  });
  
  // Nouveaux états pour les toggles
  const [hasMorningSchedule, setHasMorningSchedule] = useState(true);
  const [hasAfternoonSchedule, setHasAfternoonSchedule] = useState(true);
  
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when currentUser changes
  React.useEffect(() => {
    if (currentUser && !formData.trainer_id) {
      setFormData(prev => ({
        ...prev,
        trainer_id: currentUser.id,
        trainer_name: currentUser.name
      }));
    }
  }, [currentUser, formData.trainer_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate that we have a valid trainer_id
      if (!formData.trainer_id) {
        alert('Veuillez sélectionner un formateur');
        setIsSubmitting(false);
        return;
      }

      // Calculate days between start and end date
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Determine start and end times based on active schedules
      let fullDayStart = '';
      let fullDayEnd = '';
      
      if (hasMorningSchedule && hasAfternoonSchedule) {
        fullDayStart = formData.start_time_morning;
        fullDayEnd = formData.end_time_afternoon;
      } else if (hasMorningSchedule) {
        fullDayStart = formData.start_time_morning;
        fullDayEnd = formData.end_time_morning;
      } else if (hasAfternoonSchedule) {
        fullDayStart = formData.start_time_afternoon;
        fullDayEnd = formData.end_time_afternoon;
      }

      const trainingData = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: fullDayStart,
        end_time: fullDayEnd,
        trainer_id: formData.trainer_id,
        trainer_name: formData.trainer_name,
        days: diffDays,
        status: formData.status
      };

      const result = await addTraining(trainingData);
      
      if (result) {
        // Add selected trainees as participants
        if (selectedTrainees.length > 0) {
          const selectedClient = clients.find(c => c.name === formData.company);
          if (selectedClient && selectedClient.employees) {
            const selectedEmployees = selectedClient.employees.filter(emp => 
              selectedTrainees.includes(emp.id)
            );

            // Add participants using the addParticipant function from DataContext
            const { addParticipant } = await import('../contexts/DataContext');
            
            for (const employee of selectedEmployees) {
              await fetch('/api/participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  training_id: result.id,
                  name: `${employee.first_name} ${employee.last_name}`,
                  email: employee.email,
                  company: formData.company,
                  has_signed: false,
                  is_present: false,
                  signature_date: null
                })
              });
            }
          }
        }
        
        navigate('/trainings');
      } else {
        alert('Erreur lors de la création de la formation');
      }
    } catch (error) {
      console.error('Error creating training:', error);
      alert('Erreur lors de la création de la formation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'start_date' | 'end_date') => (date: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: date };
      
      // Auto-set end date to start date if it's a new training and end date is empty
      if (field === 'start_date' && !prev.end_date) {
        newData.end_date = date;
      }
      
      // Ensure end date is not before start date
      if (field === 'start_date' && prev.end_date && date > prev.end_date) {
        newData.end_date = date;
      }
      
      return newData;
    });
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

  // Validation: au moins un horaire doit être activé
  const isScheduleValid = hasMorningSchedule || hasAfternoonSchedule;

  // Calculate duration info
  const getDurationInfo = () => {
    if (!formData.start_date || !formData.end_date) return null;
    
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      days: diffDays,
      isMultiDay: diffDays > 1,
      isSameDay: diffDays === 1
    };
  };

  const durationInfo = getDurationInfo();
  const selectedClient = clients.find(c => c.name === formData.company);
  const availableEmployees = selectedClient?.employees || [];

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
      {/* Header */}
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
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dates and Times */}
          <div>
            <h2 className="text-xl font-semibold text-primary-800 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-accent" />
              Dates et horaires
            </h2>
            
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Date de début *
                </label>
                <DatePicker
                  value={formData.start_date}
                  onChange={handleDateChange('start_date')}
                  placeholder="Sélectionner la date de début"
                  required
                />
              </div>
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Date de fin *
                </label>
                <DatePicker
                  value={formData.end_date}
                  onChange={handleDateChange('end_date')}
                  placeholder="Sélectionner la date de fin"
                  min={formData.start_date}
                  required
                />
              </div>
            </div>

            {/* Duration Info */}
            {durationInfo && (
              <div className="mb-6 p-4 bg-gradient-to-r from-accent to-accent-light bg-opacity-10 border border-accent border-opacity-30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CalendarDays className="w-5 h-5 text-accent" />
                  <div>
                    <h4 className="text-primary-800 font-medium">
                      Durée de la formation : {durationInfo.days} jour{durationInfo.days > 1 ? 's' : ''}
                    </h4>
                    <p className="text-primary-600 text-sm">
                      {durationInfo.isSameDay 
                        ? 'Formation sur une journée' 
                        : `Formation sur ${durationInfo.days} jours consécutifs`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Toggles */}
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h3 className="text-lg font-medium text-primary-800 mb-4">
                Périodes de formation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Morning Toggle */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-primary-300">
                  <div className="flex items-center space-x-3">
                    <Sun className="w-5 h-5 text-yellow-600" />
                    <span className="text-primary-800 font-medium">Formation le matin</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasMorningSchedule(!hasMorningSchedule)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      hasMorningSchedule ? 'bg-accent' : 'bg-primary-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        hasMorningSchedule ? 'translate-x-6' : 'translate-x-1'
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
                    onClick={() => setHasAfternoonSchedule(!hasAfternoonSchedule)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      hasAfternoonSchedule ? 'bg-accent' : 'bg-primary-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        hasAfternoonSchedule ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Validation Message */}
              {!isScheduleValid && (
                <div className="mt-4 p-3 bg-error-light bg-opacity-20 border border-error rounded-lg">
                  <p className="text-error-dark text-sm">
                    ⚠️ Vous devez sélectionner au moins une période (matin ou après-midi)
                  </p>
                </div>
              )}
            </div>

            {/* Morning Schedule */}
            {hasMorningSchedule && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
                  <Sun className="w-5 h-5 mr-2 text-yellow-600" />
                  Horaires du matin
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-primary-700 text-sm font-medium mb-2">
                      Heure de début matin *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                      <input
                        type="time"
                        name="start_time_morning"
                        value={formData.start_time_morning}
                        onChange={handleChange}
                        required={hasMorningSchedule}
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
                        name="end_time_morning"
                        value={formData.end_time_morning}
                        onChange={handleChange}
                        required={hasMorningSchedule}
                        min={formData.start_time_morning}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Afternoon Schedule */}
            {hasAfternoonSchedule && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
                  <Moon className="w-5 h-5 mr-2 text-blue-600" />
                  Horaires de l'après-midi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-primary-700 text-sm font-medium mb-2">
                      Heure de début après-midi *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                      <input
                        type="time"
                        name="start_time_afternoon"
                        value={formData.start_time_afternoon}
                        onChange={handleChange}
                        required={hasAfternoonSchedule}
                        min={hasMorningSchedule ? formData.end_time_morning : undefined}
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
                        name="end_time_afternoon"
                        value={formData.end_time_afternoon}
                        onChange={handleChange}
                        required={hasAfternoonSchedule}
                        min={formData.start_time_afternoon}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Summary */}
            {isScheduleValid && (
              <div className="p-4 bg-accent bg-opacity-10 border border-accent border-opacity-30 rounded-lg">
                <h4 className="text-primary-800 font-medium mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Résumé des horaires :
                </h4>
                <div className="space-y-2">
                  {hasMorningSchedule && (
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                      <span className="text-primary-700">
                        <strong>Matin :</strong> {formData.start_time_morning} - {formData.end_time_morning}
                      </span>
                    </div>
                  )}
                  {hasAfternoonSchedule && (
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                      <span className="text-primary-700">
                        <strong>Après-midi :</strong> {formData.start_time_afternoon} - {formData.end_time_afternoon}
                      </span>
                    </div>
                  )}
                  {hasMorningSchedule && hasAfternoonSchedule && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-accent border-opacity-20">
                      <span className="w-3 h-3 bg-accent rounded-full"></span>
                      <span className="text-primary-700">
                        <strong>Journée complète :</strong> {formData.start_time_morning} - {formData.end_time_afternoon}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trainees Selection */}
          {formData.company && (
            <div>
              <h2 className="text-xl font-semibold text-primary-800 mb-6 flex items-center">
                <Users className="w-6 h-6 mr-3 text-accent" />
                Stagiaires
              </h2>
              
              {availableEmployees.length > 0 ? (
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

                  {selectedTrainees.length === 0 && (
                    <div className="text-center py-8 bg-primary-50 rounded-lg border border-primary-200">
                      <Users className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                      <p className="text-primary-600">
                        Sélectionnez les employés qui participeront à cette formation
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-primary-50 rounded-lg border border-primary-200">
                  <Users className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                  <p className="text-primary-600 mb-2">
                    Aucun employé trouvé pour ce client
                  </p>
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
          )}

          {/* Status */}
          <div>
            <h2 className="text-xl font-semibold text-primary-800 mb-6">
              Statut de la formation
            </h2>
            <div>
              <label className="block text-primary-700 text-sm font-medium mb-2">
                Statut initial
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full max-w-xs px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
              >
                <option value="draft">Brouillon</option>
                <option value="active">Active</option>
              </select>
              <p className="text-primary-600 text-sm mt-2">
                Vous pourrez modifier le statut plus tard
              </p>
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
              disabled={isSubmitting || !isScheduleValid}
              className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{isSubmitting ? 'Création...' : 'Créer la formation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTraining;