import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Training } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Users, 
  Search,
  User,
  CheckCircle,
  XCircle,
  X,
  ArrowUpRight,
  Download
} from 'lucide-react';
import Modal from '../components/ui/Modal';

// Types pour les événements du calendrier
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  trainerId: string;
  trainerName: string;
  participants: any[];
  day?: number; // Jour X sur Y dans une formation multi-jours
  totalDays?: number; // Nombre total de jours dans une formation multi-jours
}

function CalendarPage() {
  const { trainings, currentUser } = useData();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Analyser le titre pour extraire les infos de jour (si applicable)
  const parseDayInfo = (title: string): { baseTitle: string; day: number; totalDays: number } | null => {
    // Rechercher un pattern comme "Formation XYZ (Jour 1/3)"
    const match = title.match(/^(.+?)\s*\(Jour\s+(\d+)\/(\d+)\)$/i);
    if (match) {
      return {
        baseTitle: match[1].trim(),
        day: parseInt(match[2], 10),
        totalDays: parseInt(match[3], 10)
      };
    }
    return null;
  };

  // Générer les événements du calendrier depuis les formations
  useEffect(() => {
    if (trainings && trainings.length > 0) {
      const events = trainings
        .filter((training: Training) => training.status !== 'draft') // Exclure les formations en brouillon
        .map((training: Training) => {
          // Analyser le titre pour détecter le format "Formation XYZ (Jour X/Y)"
          const dayInfo = parseDayInfo(training.title);
          
          return {
            id: training.id,
            title: dayInfo ? dayInfo.baseTitle : training.title,
            date: new Date(training.start_date),
            startTime: training.start_time,
            endTime: training.end_time,
            location: training.location,
            status: training.status,
            trainerId: training.trainer_id || '',
            trainerName: training.trainer_name,
            participants: training.participants || [],
            day: dayInfo ? dayInfo.day : undefined,
            totalDays: dayInfo ? dayInfo.totalDays : undefined
          };
        });
      
      setCalendarEvents(events);
    }
  }, [trainings]);

  // Filtrer les événements en fonction du rôle de l'utilisateur
  useEffect(() => {
    if (!calendarEvents.length) return;
    
    let filtered = [...calendarEvents];
    
    // Filtrer par recherche si nécessaire
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.trainerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Si l'utilisateur est un formateur, ne montrer que ses propres formations
    if (user?.role === 'trainer') {
      filtered = filtered.filter(event => event.trainerId === user.id);
    }
    
    setFilteredEvents(filtered);
  }, [calendarEvents, searchTerm, user]);

  // Navigation du calendrier - modifiée pour gérer les deux modes
  const goToPrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'month') {
        // Navigation par mois
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        // Navigation par semaine
        newDate.setDate(prev.getDate() - 7);
      }
      return newDate;
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'month') {
        // Navigation par mois
        newDate.setMonth(prev.getMonth() + 1);
      } else {
        // Navigation par semaine
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Fonctions d'affichage du calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    
    // Ajuster pour commencer la semaine le lundi (0 = Lundi, 6 = Dimanche)
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    return {
      daysInMonth,
      adjustedStartDay,
      year,
      month
    };
  };

  const getMonthName = (date: Date) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[date.getMonth()];
  };

  const getWeekDays = () => {
    return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const openEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

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

  const getEventColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success bg-opacity-90 hover:bg-success';
      case 'draft':
        return 'bg-warning bg-opacity-90 hover:bg-warning';
      case 'completed':
        return 'bg-primary-500 bg-opacity-90 hover:bg-primary-500';
      default:
        return 'bg-primary-400 bg-opacity-90 hover:bg-primary-400';
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

  // Obtenir le titre de la période actuelle (dépendant de la vue)
  const getCurrentPeriodTitle = () => {
    if (currentView === 'month') {
      return `${getMonthName(currentDate)} ${currentDate.getFullYear()}`;
    } else {
      // En vue semaine, on affiche la période
      const currentDay = currentDate.getDay() || 7; // 0 = Dimanche, 1-6 = Lun-Sam, on convertit 0 en 7
      const firstDayOfWeek = new Date(currentDate);
      firstDayOfWeek.setDate(currentDate.getDate() - (currentDay - 1));
      
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      
      // Format: "1 - 7 Janvier 2025" ou "29 Janvier - 4 Février 2025"
      if (firstDayOfWeek.getMonth() === lastDayOfWeek.getMonth()) {
        return `${firstDayOfWeek.getDate()} - ${lastDayOfWeek.getDate()} ${getMonthName(firstDayOfWeek)} ${firstDayOfWeek.getFullYear()}`;
      } else {
        return `${firstDayOfWeek.getDate()} ${getMonthName(firstDayOfWeek)} - ${lastDayOfWeek.getDate()} ${getMonthName(lastDayOfWeek)} ${firstDayOfWeek.getFullYear()}`;
      }
    }
  };

  // Rendu du calendrier mensuel
  const renderMonthView = () => {
    const { daysInMonth, adjustedStartDay, year, month } = getDaysInMonth(currentDate);
    const weekDays = getWeekDays();
    const days = [];
    const today = new Date();
    
    // Ajouter des cellules vides pour les jours avant le début du mois
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[120px] bg-primary-50 border border-primary-200 opacity-50"></div>
      );
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = 
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear();
      
      const dayEvents = getEventsForDate(date);
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`min-h-[120px] bg-white border border-primary-200 p-2 overflow-hidden ${
            isToday ? 'ring-2 ring-accent bg-blue-50' : ''
          }`}
        >
          <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-accent' : 'text-primary-700'} flex justify-between items-center`}>
            <span className={`flex items-center justify-center rounded-full w-7 h-7 ${isToday ? 'bg-accent text-white' : ''}`}>{day}</span>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[90px] pb-1">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-all shadow-sm hover:shadow ${
                  getEventColor(event.status)
                } flex items-center justify-between`}
                onClick={() => openEventModal(event)}
              >
                <div className="truncate font-medium flex-1">
                  {event.title}
                  {event.day !== undefined && (
                    <span className="ml-1 font-bold">
                      (Jour {event.day}/{event.totalDays})
                    </span>
                  )}
                </div>
                <div className="text-[10px] opacity-90 ml-1">{event.startTime}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-px">
        {weekDays.map(day => (
          <div key={day} className="p-2 bg-primary-100 text-primary-800 font-medium text-center text-sm">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  // Rendu du calendrier hebdomadaire
  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const currentDay = currentDate.getDay() || 7; // 0 = Dimanche, 1-6 = Lun-Sam, on convertit 0 en 7
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - (currentDay - 1));
    
    const week = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      
      const isToday = 
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear();
      
      const dayEvents = getEventsForDate(date);
      
      week.push(
        <div key={`week-day-${i}`} className="flex flex-col flex-1">
          <div className={`p-2 ${isToday ? 'bg-accent text-white' : 'bg-primary-100 text-primary-800'} font-medium text-center`}>
            <div>{weekDays[i]}</div>
            <div className={`${isToday ? 'bg-white text-accent' : ''} rounded-full w-6 h-6 flex items-center justify-center mx-auto mt-1`}>{date.getDate()}</div>
          </div>
          <div className="flex-1 min-h-[500px] bg-white border-l border-b border-r border-primary-200 p-2 overflow-y-auto">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`mb-2 p-3 rounded text-sm cursor-pointer hover:opacity-90 transition-all shadow-sm hover:shadow ${getEventColor(event.status)}`}
                onClick={() => openEventModal(event)}
              >
                <div className="font-medium">
                  {event.title}
                  {event.day !== undefined && (
                    <span className="ml-1 font-bold">
                      (Jour {event.day}/{event.totalDays})
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-xs flex flex-col space-y-1">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1.5" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1.5" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </div>
            ))}
            {dayEvents.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-primary-400 text-sm">
                <div className="border-2 border-dashed border-primary-200 rounded-lg p-6 text-center w-full">
                  <p>Aucune formation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex h-full">
        {week}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-primary-200 shadow-lg">
        <div className="flex items-center">
          <CalendarIcon className="w-8 h-8 mr-3 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-primary-800">
              {getCurrentPeriodTitle()}
            </h1>
            <p className="text-primary-600">
              {user?.role === 'admin' 
                ? 'Vue d\'ensemble de toutes les formations' 
                : 'Vue d\'ensemble de vos formations'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <div className="flex items-center space-x-1 bg-white border border-primary-300 rounded-lg overflow-hidden">
            <button
              onClick={goToPrevious}
              className="p-2.5 hover:bg-primary-100 text-primary-700 transition-colors duration-200"
              title={currentView === 'month' ? 'Mois précédent' : 'Semaine précédente'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 hover:bg-primary-100 text-primary-700 font-medium transition-colors duration-200 text-sm"
            >
              Aujourd'hui
            </button>
            <button
              onClick={goToNext}
              className="p-2.5 hover:bg-primary-100 text-primary-700 transition-colors duration-200"
              title={currentView === 'month' ? 'Mois suivant' : 'Semaine suivante'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentView === 'month' 
                  ? 'bg-accent text-white' 
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentView === 'week' 
                  ? 'bg-accent text-white' 
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              Semaine
            </button>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl p-4 border border-primary-200 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, lieu ou formateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl border border-primary-200 overflow-hidden shadow-lg">
        <div className="p-4">
          {currentView === 'month' ? renderMonthView() : renderWeekView()}
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-xl p-4 border border-primary-200 shadow-lg">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-success rounded mr-2"></div>
            <span className="text-sm">Formation active</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-primary-500 rounded mr-2"></div>
            <span className="text-sm">Terminée</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-accent flex items-center justify-center text-xs text-accent font-bold mr-2">
              {new Date().getDate()}
            </div>
            <span className="text-sm">Aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* Modal pour les détails d'événement */}
      {selectedEvent && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeEventModal}
          title={selectedEvent.title}
          size="lg"
        >
          <div className="space-y-6">
            {/* Détails de l'événement */}
            <div className="bg-primary-50 rounded-lg p-6 space-y-4 border border-primary-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-3 mb-3 md:mb-0">
                  <div className={`p-2 rounded ${getStatusColor(selectedEvent.status)}`}>
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-primary-800">
                      {new Date(selectedEvent.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                      {selectedEvent.day !== undefined && (
                        <span className="ml-2 text-accent">
                          (Jour {selectedEvent.day}/{selectedEvent.totalDays})
                        </span>
                      )}
                    </div>
                    <div className="text-primary-600 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5" />
                      <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(selectedEvent.status)}`}>
                  {getStatusLabel(selectedEvent.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary-200 mt-2">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-primary-800">Lieu</div>
                    <div className="text-primary-600">{selectedEvent.location}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-primary-800">Formateur</div>
                    <div className="text-primary-600">{selectedEvent.trainerName}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des participants */}
            <div>
              <h3 className="text-lg font-medium text-primary-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-accent" />
                Participants ({selectedEvent.participants.length})
              </h3>

              {selectedEvent.participants.length > 0 ? (
                <div className="rounded-lg border border-primary-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="text-left p-3 text-primary-800 font-semibold">Participant</th>
                        <th className="text-center p-3 text-primary-800 font-semibold">Signature</th>
                        <th className="text-center p-3 text-primary-800 font-semibold">Présence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200">
                      {selectedEvent.participants.map((participant: any) => (
                        <tr key={participant.id} className="hover:bg-primary-50 transition-colors">
                          <td className="p-3">
                            <div className="font-medium text-primary-800">{participant.name}</div>
                            <div className="text-primary-600 text-xs">{participant.email}</div>
                          </td>
                          <td className="p-3 text-center">
                            {participant.has_signed ? (
                              <div className="flex items-center justify-center text-success">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center text-error">
                                <XCircle className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {participant.is_present ? (
                              <div className="flex items-center justify-center text-success">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center text-error">
                                <XCircle className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-primary-50 p-6 rounded-lg text-center border border-primary-200">
                  <Users className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                  <p className="text-primary-600">Aucun participant inscrit</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-primary-200">
              <button
                onClick={closeEventModal}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
              >
                Fermer
              </button>
              <a
                href={`/trainings/${selectedEvent.id}`}
                className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
              >
                <span>Voir les détails</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Message si aucune formation */}
      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-xl p-8 border border-primary-200 text-center shadow-lg">
          <CalendarIcon className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h3 className="text-xl text-primary-700 font-medium mb-2">
            {searchTerm 
              ? 'Aucune formation ne correspond à votre recherche'
              : user?.role === 'trainer'
                ? 'Vous n\'avez aucune formation planifiée'
                : 'Aucune formation planifiée'
            }
          </h3>
          <p className="text-primary-600 text-sm max-w-md mx-auto mb-6">
            {searchTerm
              ? 'Essayez de modifier vos critères de recherche ou effacez la recherche pour voir toutes vos formations'
              : user?.role === 'admin'
                ? 'Commencez par créer une nouvelle formation pour qu\'elle apparaisse dans le calendrier'
                : 'Contactez l\'administrateur pour planifier des formations'
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarPage;