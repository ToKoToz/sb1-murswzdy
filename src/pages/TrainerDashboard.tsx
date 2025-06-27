import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Award,
  FileText,
  MessageSquare,
  Plus,
  ArrowRight,
  Target,
  ChevronRight
} from 'lucide-react';

interface TrainerStats {
  assignedTrainings: number;
  totalParticipants: number;
  completedTrainings: number;
  averageRating: number;
  certificatesIssued: number;
  upcomingSessions: number;
}

interface UpcomingTraining {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  location: string;
  participantCount: number;
  status: string;
}

interface RecentActivity {
  id: string;
  type: 'training_completed' | 'participant_signed' | 'certificate_issued' | 'feedback_received';
  title: string;
  description: string;
  timestamp: string;
}

function TrainerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [upcomingTrainings, setUpcomingTrainings] = useState<UpcomingTraining[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        loadTrainerStats(),
        loadUpcomingTrainings(),
        loadRecentActivities()
      ]);
    } catch (error) {
      console.error('Error loading trainer dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrainerStats = async () => {
    if (!user) return;

    try {
      // Get trainer's trainings
      const { data: trainings, error: trainingsError } = await supabase
        .from('trainings')
        .select('id, status')
        .eq('trainer_id', user.id);

      if (trainingsError) throw trainingsError;

      // Get participants for trainer's trainings
      const trainingIds = trainings?.map(t => t.id) || [];
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id, has_signed, training_id')
        .in('training_id', trainingIds);

      if (participantsError) throw participantsError;

      // Get certificates issued
      const { data: certificates, error: certificatesError } = await supabase
        .from('training_certifications')
        .select('id')
        .eq('issued_by', user.id);

      if (certificatesError) throw certificatesError;

      // Get upcoming training sessions
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('trainer_id', user.id)
        .gte('session_date', today)
        .eq('status', 'planned');

      if (sessionsError) throw sessionsError;

      setStats({
        assignedTrainings: trainings?.length || 0,
        totalParticipants: participants?.length || 0,
        completedTrainings: trainings?.filter(t => t.status === 'completed').length || 0,
        averageRating: 4.7, // Mock data - would come from evaluations
        certificatesIssued: certificates?.length || 0,
        upcomingSessions: sessions?.length || 0
      });
    } catch (error) {
      console.error('Error loading trainer stats:', error);
    }
  };

  const loadUpcomingTrainings = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('trainings')
        .select(`
          id,
          title,
          start_date,
          start_time,
          location,
          status,
          participants:participants(count)
        `)
        .eq('trainer_id', user.id)
        .gte('start_date', today)
        .in('status', ['active', 'draft'])
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      const formattedTrainings: UpcomingTraining[] = data?.map(training => ({
        id: training.id,
        title: training.title,
        startDate: training.start_date,
        startTime: training.start_time,
        location: training.location,
        participantCount: training.participants?.[0]?.count || 0,
        status: training.status
      })) || [];

      setUpcomingTrainings(formattedTrainings);
    } catch (error) {
      console.error('Error loading upcoming trainings:', error);
    }
  };

  const loadRecentActivities = async () => {
    // Mock recent activities - in real app would come from activity log
    const mockActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'participant_signed',
        title: 'Nouvelle signature',
        description: 'Marie Dubois a signé la feuille de présence',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'training_completed',
        title: 'Formation terminée',
        description: 'Formation "Sécurité au travail" completée avec succès',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'certificate_issued',
        title: 'Certificat délivré',
        description: 'Certificat envoyé à 12 participants',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'feedback_received',
        title: 'Évaluation reçue',
        description: 'Note moyenne de 4.8/5 pour la dernière formation',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    setRecentActivities(mockActivities);
  };

  const getActivityIcon = (type: string) => {
    const iconMap = {
      training_completed: CheckCircle,
      participant_signed: Users,
      certificate_issued: Award,
      feedback_received: Star
    };
    return iconMap[type as keyof typeof iconMap] || FileText;
  };

  const getActivityColor = (type: string) => {
    const colorMap = {
      training_completed: 'text-success',
      participant_signed: 'text-accent',
      certificate_issued: 'text-warning',
      feedback_received: 'text-primary-600'
    };
    return colorMap[type as keyof typeof colorMap] || 'text-primary-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-accent to-accent-dark rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Bonjour {user?.firstName} ! 👋
        </h1>
        <p className="text-accent-light text-lg">
          Voici un aperçu de votre activité de formation aujourd'hui
        </p>
        <div className="mt-6 flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats?.upcomingSessions || 0}</div>
            <div className="text-accent-light text-sm">Sessions à venir</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats?.totalParticipants || 0}</div>
            <div className="text-accent-light text-sm">Participants totaux</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats?.averageRating || 0}/5</div>
            <div className="text-accent-light text-sm">Note moyenne</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats && [
          {
            label: 'Formations assignées',
            value: stats.assignedTrainings,
            icon: BookOpen,
            color: 'from-accent to-accent-dark',
            change: '+12%'
          },
          {
            label: 'Formations terminées',
            value: stats.completedTrainings,
            icon: CheckCircle,
            color: 'from-success to-success-dark',
            change: '+8%'
          },
          {
            label: 'Certificats délivrés',
            value: stats.certificatesIssued,
            icon: Award,
            color: 'from-warning to-warning-dark',
            change: '+15%'
          },
          {
            label: 'Note moyenne',
            value: `${stats.averageRating}/5`,
            icon: Star,
            color: 'from-primary-600 to-primary-500',
            change: '+0.2'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 border border-primary-200 shadow-lg">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary-800 mb-1">{stat.value}</h3>
              <div className="flex items-center justify-between">
                <p className="text-primary-600 text-sm">{stat.label}</p>
                <span className="text-success text-xs font-medium">
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Trainings */}
        <div className="bg-white rounded-xl border border-primary-200 shadow-lg">
          <div className="p-6 border-b border-primary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary-800 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Prochaines formations</span>
              </h3>
              <Link
                to="/trainings"
                className="text-accent hover:text-accent-dark transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            {upcomingTrainings.length > 0 ? (
              <div className="space-y-4">
                {upcomingTrainings.map((training) => (
                  <Link
                    key={training.id}
                    to={`/trainings/${training.id}`}
                    className="block p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-primary-800 font-medium mb-1">{training.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-primary-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(training.startDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{training.startTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{training.participantCount} participants</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-primary-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                <p className="text-primary-600 text-sm mb-4">Aucune formation prévue</p>
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

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-primary-200 shadow-lg">
          <div className="p-6 border-b border-primary-200">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Activités récentes</span>
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-primary-100`}>
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-800 text-sm font-medium">{activity.title}</p>
                      <p className="text-primary-600 text-xs mt-1">{activity.description}</p>
                      <p className="text-primary-500 text-xs mt-1">
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-lg">
        <div className="p-6 border-b border-primary-200">
          <h3 className="text-lg font-semibold text-primary-800 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Actions rapides</span>
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/trainings/new"
              className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white p-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-3"
            >
              <Plus className="w-5 h-5" />
              <span>Nouvelle formation</span>
            </Link>
            
            <Link
              to="/trainings"
              className="bg-gradient-to-r from-warning to-warning-dark hover:from-warning-dark hover:to-warning text-white p-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-3"
            >
              <BookOpen className="w-5 h-5" />
              <span>Mes formations</span>
            </Link>
            
            <Link
              to="/profile"
              className="bg-gradient-to-r from-success to-success-dark hover:from-success-dark hover:to-success text-white p-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-3"
            >
              <Users className="w-5 h-5" />
              <span>Mon profil</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainerDashboard;