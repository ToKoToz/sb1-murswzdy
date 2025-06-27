import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Training, Participant, Client } from '../lib/supabase';
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
  addTraining: (training: Omit<Training, 'id' | 'created_at' | 'updated_at'>) => Promise<Training | null>;
  updateTraining: (id: string, updates: Partial<Training>) => Promise<boolean>;
  updateParticipant: (trainingId: string, participantId: string, updates: Partial<Participant>) => Promise<boolean>;
  addParticipant: (trainingId: string, participant: Omit<Participant, 'id' | 'training_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  removeParticipant: (trainingId: string, participantId: string) => Promise<boolean>;
  getTraining: (id: string) => Training | undefined;
  refreshTrainings: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshTrainers: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

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

      if (trainingsError) throw trainingsError;

      console.log('📋 Fetching participants...');
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');

      if (participantsError) throw participantsError;

      const trainingsWithParticipants = (trainingsData || []).map(training => ({
        ...training,
        participants: (participantsData || []).filter(p => p.training_id === training.id)
      }));

      console.log('✅ Trainings loaded:', trainingsWithParticipants.length);
      setTrainings(trainingsWithParticipants);
    } catch (error) {
      console.error('❌ Error fetching trainings:', error);
      setTrainings([]);
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

      if (error) throw error;
      
      console.log('✅ Trainers loaded:', data?.length || 0);
      setTrainers(data || []);
    } catch (error) {
      console.error('❌ Error fetching trainers:', error);
      setTrainers([]);
    }
  };

  const fetchClients = async () => {
    try {
      console.log('🏢 Fetching clients...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (clientsError) throw clientsError;

      console.log('👥 Fetching employees...');
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('last_name');

      if (employeesError) throw employeesError;

      const clientsWithEmployees = (clientsData || []).map(client => ({
        ...client,
        employees: (employeesData || []).filter(emp => emp.client_id === client.id)
      }));

      console.log('✅ Clients loaded:', clientsWithEmployees.length);
      setClients(clientsWithEmployees);
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      setClients([]);
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

      if (error) throw error;

      await refreshTrainings();
      console.log('✅ Training added successfully');
      return data;
    } catch (error) {
      console.error('❌ Error adding training:', error);
      setError('Erreur lors de l\'ajout de la formation');
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

      if (error) throw error;

      await refreshTrainings();
      console.log('✅ Training updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating training:', error);
      setError('Erreur lors de la mise à jour de la formation');
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

      if (error) throw error;

      await refreshTrainings();
      console.log('✅ Participant updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating participant:', error);
      setError('Erreur lors de la mise à jour du participant');
      return false;
    }
  };

  const addParticipant = async (trainingId: string, participantData: Omit<Participant, 'id' | 'training_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      console.log('➕ Adding participant to training:', trainingId);
      const { error } = await supabase
        .from('participants')
        .insert([{ ...participantData, training_id: trainingId }]);

      if (error) throw error;

      await refreshTrainings();
      console.log('✅ Participant added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      setError('Erreur lors de l\'ajout du participant');
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

      if (error) throw error;

      await refreshTrainings();
      console.log('✅ Participant removed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      setError('Erreur lors de la suppression du participant');
      return false;
    }
  };

  const getTraining = (id: string): Training | undefined => {
    return trainings.find(training => training.id === id);
  };

  const refreshTrainings = async () => {
    await fetchTrainings();
  };

  const refreshClients = async () => {
    await fetchClients();
  };

  const refreshTrainers = async () => {
    await fetchTrainers();
  };

  return (
    <DataContext.Provider value={{
      trainings,
      trainers,
      clients,
      loading,
      error,
      currentUser: user,
      addTraining,
      updateTraining,
      updateParticipant,
      addParticipant,
      removeParticipant,
      getTraining,
      refreshTrainings,
      refreshClients,
      refreshTrainers
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