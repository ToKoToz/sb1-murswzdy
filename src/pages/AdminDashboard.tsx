import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users,
  BookOpen,
  UserCheck,
  TrendingUp,
  Activity,
  Shield,
  Calendar,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTrainings: number;
  completedTrainings: number;
  totalParticipants: number;
  signedParticipants: number;
  pendingInvitations: number;
  userGrowth: number;
  trainingGrowth: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  resource: string;
  timestamp: string;
  details?: string;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  authentication: 'healthy' | 'warning' | 'error';
  lastCheck: string;
}

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivities(),
        checkSystemHealth()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get current month stats
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      
      const [usersResponse, trainingsResponse, participantsResponse, invitationsResponse] = await Promise.all([
        supabase.from('profiles').select('id, created_at'),
        supabase.from('trainings').select('id, status, created_at'),
        supabase.from('participants').select('id, has_signed'),
        supabase.from('user_invitations').select('id, status')
      ]);

      const users = usersResponse.data || [];
      const trainings = trainingsResponse.data || [];
      const participants = participantsResponse.data || [];
      const invitations = invitationsResponse.data || [];

      // Calculate growth rates
      const usersThisMonth = users.filter(u => new Date(u.created_at) >= lastMonth).length;
      const usersLastMonth = users.filter(u => {
        const created = new Date(u.created_at);
        return created >= new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1) && created < lastMonth;
      }).length;

      const trainingsThisMonth = trainings.filter(t => new Date(t.created_at) >= lastMonth).length;
      const trainingsLastMonth = trainings.filter(t => {
        const created = new Date(t.created_at);
        return created >= new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1) && created < lastMonth;
      }).length;

      const userGrowth = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0;
      const trainingGrowth = trainingsLastMonth > 0 ? ((trainingsThisMonth - trainingsLastMonth) / trainingsLastMonth) * 100 : 0;

      setStats({
        totalUsers: users.length,
        activeUsers: users.length, // Since we don't have status field in profiles table
        totalTrainings: trainings.length,
        completedTrainings: trainings.filter(t => t.status === 'completed').length,
        totalParticipants: participants.length,
        signedParticipants: participants.filter(p => p.has_signed).length,
        pendingInvitations: invitations.filter(i => i.status === 'pending').length,
        userGrowth,
        trainingGrowth
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          user:profiles(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        const formattedActivities: RecentActivity[] = data.map(activity => ({
          id: activity.id,
          action: activity.action,
          user: activity.user?.name || 'Utilisateur inconnu',
          resource: activity.resource || '',
          timestamp: activity.created_at,
          details: activity.details ? JSON.stringify(activity.details) : undefined
        }));

        setActivities(formattedActivities);
      } else {
        // If activities table doesn't exist or error occurs, set empty array
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Simple health checks
      const checks = await Promise.allSettled([
        supabase.from('profiles').select('count').limit(1),
        supabase.storage.from('profile-pictures').list('', { limit: 1 }),
        supabase.auth.getSession()
      ]);

      setSystemHealth({
        database: checks[0].status === 'fulfilled' ? 'healthy' : 'error',
        storage: checks[1].status === 'fulfilled' ? 'healthy' : 'error',
        authentication: checks[2].status === 'fulfilled' ? 'healthy' : 'error',
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking system health:', error);
      setSystemHealth({
        database: 'error',
        storage: 'error',
        authentication: 'error',
        lastCheck: new Date().toISOString()
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getActivityIcon = (action: string) => {
    const actionMap: { [key: string]: React.ElementType } = {
      user_login: Users,
      user_logout: Users,
      user_register: UserCheck,
      training_created: BookOpen,
      training_updated: BookOpen,
      profile_updated: Users,
      invitation_sent: Mail
    };

    return actionMap[action] || Activity;
  };

  const getActivityColor = (action: string) => {
    const colorMap: { [key: string]: string } = {
      user_login: 'text-success',
      user_logout: 'text-primary-600',
      user_register: 'text-accent',
      training_created: 'text-warning',
      training_updated: 'text-accent',
      profile_updated: 'text-primary-600',
      invitation_sent: 'text-accent'
    };

    return colorMap[action] || 'text-primary-600';
  };

  const getHealthBadge = (status: 'healthy' | 'warning' | 'error') => {
    const config = {
      healthy: { color: 'bg-success text-white', icon: CheckCircle },
      warning: { color: 'bg-warning text-white', icon: AlertTriangle },
      error: { color: 'bg-error text-white', icon: AlertTriangle }
    };

    const { color, icon: Icon } = config[status];

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{status === 'healthy' ? 'OK' : status === 'warning' ? 'Attention' : 'Erreur'}</span>
      </span>
    );
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-800 mb-2">
            Tableau de bord Administrateur
          </h1>
          <p className="text-primary-600">
            Vue d'ensemble de la plateforme et des activités
          </p>
        </div>

        <button
          onClick={refreshData}
          disabled={refreshing}
          className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats && [
          {
            label: 'Utilisateurs totaux',
            value: stats.totalUsers,
            change: stats.userGrowth,
            icon: Users,
            color: 'from-accent to-accent-dark'
          },
          {
            label: 'Formations actives',
            value: stats.totalTrainings - stats.completedTrainings,
            change: stats.trainingGrowth,
            icon: BookOpen,
            color: 'from-warning to-warning-dark'
          },
          {
            label: 'Signatures collectées',
            value: stats.signedParticipants,
            change: stats.totalParticipants > 0 ? (stats.signedParticipants / stats.totalParticipants) * 100 - 100 : 0,
            icon: UserCheck,
            color: 'from-success to-success-dark'
          },
          {
            label: 'Invitations en attente',
            value: stats.pendingInvitations,
            change: 0,
            icon: Mail,
            color: 'from-primary-600 to-primary-500'
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
                {stat.change !== 0 && (
                  <div className={`flex items-center space-x-1 text-xs ${stat.change > 0 ? 'text-success' : 'text-error'}`}>
                    {stat.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    <span>{Math.abs(stat.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-xl border border-primary-200 shadow-lg">
          <div className="p-6 border-b border-primary-200">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>État du système</span>
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {systemHealth && [
              { label: 'Base de données', status: systemHealth.database },
              { label: 'Stockage', status: systemHealth.storage },
              { label: 'Authentification', status: systemHealth.authentication }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-primary-700">{item.label}</span>
                {getHealthBadge(item.status)}
              </div>
            ))}
            <div className="pt-4 border-t border-primary-200">
              <p className="text-primary-600 text-xs">
                Dernière vérification: {systemHealth && new Date(systemHealth.lastCheck).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-primary-200 shadow-lg">
          <div className="p-6 border-b border-primary-200">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Activités récentes</span>
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.action);
                const colorClass = getActivityColor(activity.action);
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-primary-100`}>
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-800 text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-primary-600 text-xs">
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {activities.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                <p className="text-primary-600 text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-primary-200 shadow-lg">
        <div className="p-6 border-b border-primary-200">
          <h3 className="text-lg font-semibold text-primary-800">Actions rapides</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white p-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-3">
              <UserCheck className="w-5 h-5" />
              <span>Inviter un utilisateur</span>
            </button>
            
            <button className="bg-gradient-to-r from-warning to-warning-dark hover:from-warning-dark hover:to-warning text-white p-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-3">
              <BookOpen className="w-5 h-5" />
              <span>Créer une formation</span>
            </button>
            
            <button className="bg-gradient-to-r from-success to-success-dark hover:from-success-dark hover:to-success text-white p-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-3">
              <Download className="w-5 h-5" />
              <span>Exporter les données</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;