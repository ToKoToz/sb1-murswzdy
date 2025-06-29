import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Training, Participant, Client, testSupabaseConnection } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Profile interface matching the database structure
interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone_number?: string;
  function_title?: string;
  specialties?: string[];
  experience?: string;
  degrees_certifications?: string[];
  profile_picture_url?: string;
  availability?: string;
  created_at: string;
  updated_at: string;
}

interface DataContextType {
  trainings: Training[];
  trainers: Profile[];
  clients: Client[];
  loading: boolean;
  error: string | null;
  currentUser: any;
  connectionStatus: 'testing' | 'connected' | 'failed' | 'idle';
  addTraining: (training: Omit<Training, 'id' | 'created_at' | 'updated_at'>) => Promise<Training | null>;
  updateTraining: (id: string, updates: Partial<Training>) => Promise<boolean>;
  updateParticipant: (trainingId: string, participantId: string, updates: Partial<Participant>) => Promise<boolean>;
  addParticipant: (trainingId: string, participant: Omit<Participant, 'id' | 'training_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  removeParticipant: (trainingId: string, participantId: string) => Promise<boolean>;
  getTraining: (id: string) => Training | undefined;
  refreshTrainings: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshTrainers: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | 'idle'>('idle');
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      initializeData();
    }
  }, [isAuthenticated]);

  const initializeData = async () => {
    if (!isAuthenticated) return;
    
    console.log('🚀 DataContext: Initializing data...');
    setConnectionStatus('testing');
    setError(null);
    
    // First test Supabase connectivity
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest.success) {
      console.error('❌ DataContext: Supabase connection failed:', connectionTest.error);
      setConnectionStatus('failed');
      setError(`Erreur de connexion à la base de données: ${connectionTest.error}`);
      return;
    }
    
    setConnectionStatus('connected');
    await fetchData();
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    console.log('📥 DataContext: Fetching data...');
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTrainings(),
        fetchTrainers(),
        fetchClients()
      ]);
      console.log('✅ DataContext: All data fetched successfully');
    } catch (error) {
      console.error('❌ DataContext: Error fetching data:', error);
      setError('Erreur de chargement des données');
      
      // If this is a network error, update connection status
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setConnectionStatus('failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    try {
      console.log('📋 Fetching trainings...');
      const { data: trainingsData, error: trainingsError } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false });

      if (trainingsError) {
        console.error('❌ Trainings query error:', trainingsError);
        throw new Error(`Erreur lors du chargement des formations: ${trainingsError.message}`);
      }

      console.log('📋 Fetching participants...');
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');

      if (participantsError) {
        console.error('❌ Participants query error:', participantsError);
        throw new Error(`Erreur lors du chargement des participants: ${participantsError.message}`);
      }

      const trainingsWithParticipants = (trainingsData || []).map(training => ({
        ...training,
        participants: (participantsData || []).filter(p => p.training_id === training.id)
      }));

      console.log('✅ Trainings loaded:', trainingsWithParticipants.length);
      setTrainings(trainingsWithParticipants);
    } catch (error) {
      console.error('❌ Error fetching trainings:', error);
      setTrainings([]);
      throw error;
    }
  };

  const fetchTrainers = async () => {
    try {
      console.log('👨‍🏫 Fetching trainers...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trainer')
        .order('name');

      if (error) {
        console.error('❌ Trainers query error:', error);
        throw new Error(`Erreur lors du chargement des formateurs: ${error.message}`);
      }
      
      console.log('✅ Trainers loaded:', data?.length || 0);
      setTrainers(data || []);
    } catch (error) {
      console.error('❌ Error fetching trainers:', error);
      setTrainers([]);
      throw error;
    }
  };

  const fetchClients = async () => {
    try {
      console.log('🏢 Fetching clients...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (clientsError) {
        console.error('❌ Clients query error:', clientsError);
        throw new Error(`Erreur lors du chargement des clients: ${clientsError.message}`);
      }

      console.log('👥 Fetching employees...');
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('last_name');

      if (employeesError) {
        console.error('❌ Employees query error:', employeesError);
        throw new Error(`Erreur lors du chargement des employés: ${employeesError.message}`);
      }

      const clientsWithEmployees = (clientsData || []).map(client => ({
        ...client,
        employees: (employeesData || []).filter(emp => emp.client_id === client.id)
      }));

      console.log('✅ Clients loaded:', clientsWithEmployees.length);
      setClients(clientsWithEmployees);
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      setClients([]);
      throw error;
    }
  };

  const addTraining = async (trainingData: Omit<Training, 'id' | 'created_at' | 'updated_at'>): Promise<Training | null> => {
    try {
      console.log('➕ Adding training:', trainingData.title);
      const { data, error } = await supabase
        .from('trainings')
        .insert([trainingData])
        .select()
        .single();

      if (error) {
        console.error('❌ Add training error:', error);
        throw new Error(`Erreur lors de l'ajout de la formation: ${error.message}`);
      }

      console.log('✅ Training added successfully');
      
      // Immediately update local training data to include the new training (initially without participants)
      setTrainings(prev => [{ ...data, participants: [] }, ...prev]);
      
      return data;
    } catch (error) {
      console.error('❌ Error adding training:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la formation');
      return null;
    }
  };

  const updateTraining = async (id: string, updates: Partial<Training>): Promise<boolean> => {
    try {
      console.log('📝 Updating training:', id);
      const { error } = await supabase
        .from('trainings')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('❌ Update training error:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      await refreshTrainings();
      console.log('✅ Training updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating training:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la formation');
      return false;
    }
  };

  const updateParticipant = async (trainingId: string, participantId: string, updates: Partial<Participant>): Promise<boolean> => {
    try {
      console.log('📝 Updating participant:', participantId);
      const { error } = await supabase
        .from('participants')
        .update(updates)
        .eq('id', participantId)
        .eq('training_id', trainingId);

      if (error) {
        console.error('❌ Update participant error:', error);
        throw new Error(`Erreur lors de la mise à jour du participant: ${error.message}`);
      }

      // Update local state immediately
      setTrainings(prevTrainings => {
        return prevTrainings.map(training => {
          if (training.id === trainingId) {
            return {
              ...training,
              participants: (training.participants || []).map(p => 
                p.id === participantId ? { ...p, ...updates } : p
              )
            };
          }
          return training;
        });
      });
      
      console.log('✅ Participant updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating participant:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du participant');
      return false;
    }
  };

  const addParticipant = async (trainingId: string, participantData: Omit<Participant, 'id' | 'training_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      console.log('➕ Adding participant to training:', trainingId);
      const { data, error } = await supabase
        .from('participants')
        .insert([{ ...participantData, training_id: trainingId }])
        .select();

      if (error) {
        console.error('❌ Add participant error:', error);
        throw new Error(`Erreur lors de l'ajout du participant: ${error.message}`);
      }

      // Update local state immediately
      setTrainings(prevTrainings => {
        return prevTrainings.map(training => {
          if (training.id === trainingId) {
            return {
              ...training,
              participants: [...(training.participants || []), ...data]
            };
          }
          return training;
        });
      });

      console.log('✅ Participant added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'ajout du participant');
      return false;
    }
  };

  const removeParticipant = async (trainingId: string, participantId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Removing participant:', participantId);
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId)
        .eq('training_id', trainingId);

      if (error) {
        console.error('❌ Remove participant error:', error);
        throw new Error(`Erreur lors de la suppression du participant: ${error.message}`);
      }

      // Update local state immediately
      setTrainings(prevTrainings => {
        return prevTrainings.map(training => {
          if (training.id === trainingId) {
            return {
              ...training,
              participants: (training.participants || []).filter(p => p.id !== participantId)
            };
          }
          return training;
        });
      });

      console.log('✅ Participant removed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression du participant');
      return false;
    }
  };

  const getTraining = (id: string): Training | undefined => {
    return trainings.find(training => training.id === id);
  };

  const refreshTrainings = async () => {
    if (connectionStatus === 'failed') {
      await retryConnection();
      return;
    }
    await fetchTrainings();
  };

  const refreshClients = async () => {
    if (connectionStatus === 'failed') {
      await retryConnection();
      return;
    }
    await fetchClients();
  };

  const refreshTrainers = async () => {
    if (connectionStatus === 'failed') {
      await retryConnection();
      return;
    }
    await fetchTrainers();
  };

  const retryConnection = async () => {
    console.log('🔄 Retrying Supabase connection...');
    await initializeData();
  };

  return (
    <DataContext.Provider value={{
      trainings,
      trainers,
      clients,
      loading,
      error,
      currentUser: user,
      connectionStatus,
      addTraining,
      updateTraining,
      updateParticipant,
      addParticipant,
      removeParticipant,
      getTraining,
      refreshTrainings,
      refreshClients,
      refreshTrainers,
      retryConnection
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}