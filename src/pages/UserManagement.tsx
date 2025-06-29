import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  UserPlus,
  Send,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  MoreHorizontal
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

interface UserInvitation {
  id: string;
  email: string;
  role_id: string;
  role?: UserRole;
  invited_by_id?: string;
  invited_by?: { name: string };
  token: string;
  expires_at: string;
  status: string;
  created_at: string;
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    roleId: '',
    message: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadRoles(),
        loadInvitations()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const loadRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('name');

    if (!error && data) {
      setRoles(data);
    }
  };

  const loadInvitations = async () => {
    const { data, error } = await supabase
      .from('user_invitations')
      .select(`
        *,
        role:user_roles(*),
        invited_by:profiles(name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInvitations(data);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.roleId) return;

    try {
      const token = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { error } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteForm.email,
          role_id: inviteForm.roleId,
          invited_by_id: currentUser?.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (!error) {
        // Send invitation email (would use edge function in real app)
        await sendInvitationEmail(inviteForm.email, token, inviteForm.message);
        
        setShowInviteModal(false);
        setInviteForm({ email: '', roleId: '', message: '' });
        await loadInvitations();
      }
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  const generateInviteToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const sendInvitationEmail = async (email: string, token: string, message: string) => {
    // In a real app, this would call an edge function to send email
    const inviteUrl = `${window.location.origin}/register?token=${token}`;
    console.log('Invitation email would be sent to:', email, 'with URL:', inviteUrl);
  };

  const getStatusBadge = (role: string) => {
    const statusMap = {
      admin: { color: 'bg-error text-white', icon: Shield },
      trainer: { color: 'bg-accent text-white', icon: Users }
    };

    const config = statusMap[role as keyof typeof statusMap] || { color: 'bg-primary-400 text-white', icon: Users };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{role === 'admin' ? 'Administrateur' : role === 'trainer' ? 'Formateur' : role}</span>
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

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
            Gestion des Utilisateurs
          </h1>
          <p className="text-primary-600">
            Gérez les comptes utilisateurs, rôles et permissions
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Inviter un utilisateur</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total utilisateurs', value: users.length, icon: Users, color: 'from-accent to-accent-dark' },
          { label: 'Administrateurs', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'from-error to-error-dark' },
          { label: 'Formateurs', value: users.filter(u => u.role === 'trainer').length, icon: Users, color: 'from-warning to-warning-dark' },
          { label: 'Invitations envoyées', value: invitations.filter(i => i.status === 'pending').length, icon: Mail, color: 'from-primary-600 to-primary-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 border border-primary-200 shadow-lg">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-primary-800 mb-1">{stat.value}</h3>
              <p className="text-primary-600 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-primary-200 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-11 pr-8 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="trainer">Formateur</option>
            </select>
          </div>

          <div></div>

          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-primary-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50 border-b border-primary-200">
              <tr>
                <th className="text-left py-4 px-6 text-primary-800 font-semibold">Utilisateur</th>
                <th className="text-left py-4 px-6 text-primary-800 font-semibold">Rôle</th>
                <th className="text-left py-4 px-6 text-primary-800 font-semibold">Date de création</th>
                <th className="text-left py-4 px-6 text-primary-800 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-primary-50 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-accent to-accent-dark rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-primary-800 font-medium">
                          {user.name}
                        </h3>
                        <p className="text-primary-600 text-sm">{user.email}</p>
                        {user.phone_number && (
                          <p className="text-primary-500 text-xs flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone_number}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(user.role)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-primary-700 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-primary-600 hover:text-accent transition-colors duration-200 p-2 rounded-lg hover:bg-primary-100"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {user.id !== currentUser?.id && (
                        <div className="relative group">
                          <button
                            className="text-primary-600 hover:text-primary-800 transition-colors duration-200 p-2 rounded-lg hover:bg-primary-100"
                            title="Plus d'actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-primary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <button className="w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 transition-colors duration-200">
                              Envoyer message
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-light hover:bg-opacity-10 transition-colors duration-200">
                              Désactiver
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-primary-700 font-medium mb-2">
              {searchTerm || roleFilter !== 'all' 
                ? 'Aucun utilisateur trouvé' 
                : 'Aucun utilisateur'
              }
            </h3>
            <p className="text-primary-600 text-sm">
              {searchTerm || roleFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par inviter votre premier utilisateur'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <div className="bg-white rounded-xl border border-primary-200 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-primary-200">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Invitations en attente ({invitations.filter(i => i.status === 'pending').length})</span>
            </h3>
          </div>
          <div className="divide-y divide-primary-200">
            {invitations.filter(i => i.status === 'pending').map((invitation) => (
              <div key={invitation.id} className="p-6 flex items-center justify-between">
                <div>
                  <h4 className="text-primary-800 font-medium">{invitation.email}</h4>
                  <p className="text-primary-600 text-sm">
                    Rôle: {invitation.role?.display_name} • 
                    Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="text-accent hover:text-accent-dark transition-colors duration-200 p-2 rounded-lg hover:bg-accent hover:bg-opacity-10"
                    title="Renvoyer l'invitation"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    className="text-error hover:text-error-dark transition-colors duration-200 p-2 rounded-lg hover:bg-error hover:bg-opacity-10"
                    title="Annuler l'invitation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-primary-200 w-full max-w-md mx-4">
            <div className="p-6 border-b border-primary-200">
              <h3 className="text-xl font-semibold text-primary-800">Inviter un utilisateur</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="utilisateur@email.com"
                />
              </div>
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Rôle
                </label>
                <select
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, roleId: e.target.value }))}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-primary-700 text-sm font-medium mb-2">
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-300 rounded-lg text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Bienvenue dans l'équipe !"
                />
              </div>
            </div>
            <div className="p-6 border-t border-primary-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleInviteUser}
                disabled={!inviteForm.email || !inviteForm.roleId}
                className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer l'invitation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;