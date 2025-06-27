import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'formation-pro-app'
    }
  }
});

// Enhanced Training interface with all new fields
export interface Training {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  trainer_id: string | null;
  trainer_name: string;
  days: number;
  status: 'draft' | 'active' | 'completed';
  
  // Informations pédagogiques
  objectives?: string[];
  program_content?: any;
  prerequisites?: string[];
  target_audience?: string;
  training_methods?: string[];
  skill_level?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  
  // Informations logistiques
  training_type?: 'présentiel' | 'distanciel' | 'hybride' | 'e-learning';
  max_participants?: number;
  room_requirements?: string;
  equipment_needed?: string[];
  meeting_link?: string;
  access_code?: string;
  
  // Informations financières
  price_per_participant?: number;
  total_budget?: number;
  payment_terms?: string;
  invoice_reference?: string;
  
  // Informations de contact
  organizer_name?: string;
  organizer_email?: string;
  organizer_phone?: string;
  contact_person?: string;
  
  // Suivi et évaluation
  evaluation_method?: string[];
  certification_type?: string;
  certificate_template?: string;
  attendance_required?: number;
  
  // Métadonnées
  internal_notes?: string;
  tags?: string[];
  category?: string;
  language?: string;
  timezone?: string;
  
  created_at: string;
  updated_at: string;
  participants?: Participant[];
}

// New interfaces for additional tables
export interface TrainingSession {
  id: string;
  training_id: string;
  session_number: number;
  session_title?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  trainer_id?: string;
  trainer_name?: string;
  session_objectives?: string[];
  session_content?: any;
  materials_needed?: string[];
  homework_assigned?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingDocument {
  id: string;
  training_id: string;
  document_name: string;
  document_type: 'support_cours' | 'exercice' | 'evaluation' | 'attestation' | 'manuel' | 'ressource' | 'autre';
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  is_public: boolean;
  access_level: 'public' | 'participants' | 'trainers' | 'admins';
  download_count: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingEvaluation {
  id: string;
  training_id: string;
  participant_id: string;
  evaluation_type: 'pre_formation' | 'post_formation' | 'satisfaction' | 'competences' | 'quiz' | 'examen';
  questions?: any;
  responses?: any;
  score?: number;
  max_score?: number;
  percentage?: number;
  passed?: boolean;
  feedback?: string;
  evaluator_id?: string;
  evaluation_date: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingCertification {
  id: string;
  training_id: string;
  participant_id: string;
  certificate_number: string;
  certificate_type?: string;
  skills_acquired?: string[];
  validation_date: string;
  expiry_date?: string;
  certificate_url?: string;
  qr_code_data?: string;
  is_valid: boolean;
  issued_by?: string;
  verification_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Existing interfaces
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trainer';
  phone_number?: string;
  function_title?: string;
  specialties?: string[];
  experience?: string;
  degrees_certifications?: string[];
  profile_picture_url?: string;
  availability?: string;
  digital_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  training_id: string;
  name: string;
  email: string;
  company: string;
  has_signed: boolean;
  is_present: boolean;
  signature_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  employees?: Employee[];
}

export interface Employee {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Training categories and types constants
export const TRAINING_CATEGORIES = [
  'Sécurité au travail',
  'Management',
  'Informatique',
  'Langues',
  'Comptabilité',
  'Ressources humaines',
  'Marketing',
  'Vente',
  'Qualité',
  'Environnement',
  'Réglementation',
  'Développement personnel',
  'Technique',
  'Autre'
] as const;

export const TRAINING_METHODS = [
  'Cours magistral',
  'Travaux pratiques',
  'Études de cas',
  'Jeux de rôle',
  'Simulation',
  'E-learning',
  'Blended learning',
  'Coaching',
  'Mentorat',
  'Atelier',
  'Conférence',
  'Webinaire'
] as const;

export const EVALUATION_METHODS = [
  'QCM',
  'Quiz interactif',
  'Examen écrit',
  'Examen oral',
  'Évaluation pratique',
  'Projet',
  'Présentation',
  'Mise en situation',
  'Auto-évaluation',
  'Évaluation par les pairs',
  'Observation',
  'Entretien'
] as const;

// Function title options
export const FUNCTION_TITLE_OPTIONS = [
  'Formateur',
  'Formateur Senior',
  'Formateur Expert',
  'Consultant',
  'Expert Métier',
  'Responsable Formation',
  'Coordinateur Pédagogique',
  'Autre'
] as const;

export type FunctionTitle = typeof FUNCTION_TITLE_OPTIONS[number];

// Helper functions for file upload
export const uploadProfilePicture = async (file: File, userId: string): Promise<string | null> => {
  try {
    console.log('📸 Uploading profile picture for user:', userId);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La taille du fichier ne peut pas dépasser 5MB');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(data.path);

    console.log('✅ Profile picture uploaded successfully');
    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return null;
  }
};

export const uploadClientLogo = async (file: File, clientId: string): Promise<string | null> => {
  try {
    console.log('🏢 Uploading client logo for:', clientId);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La taille du fichier ne peut pas dépasser 5MB');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('client-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading logo:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('client-logos')
      .getPublicUrl(data.path);

    console.log('✅ Client logo uploaded successfully');
    return publicUrl;
  } catch (error) {
    console.error('Error uploading client logo:', error);
    return null;
  }
};

export const uploadTrainingDocument = async (file: File, trainingId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${trainingId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('training-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading document:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('training-documents')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading training document:', error);
    return null;
  }
};

export const deleteProfilePicture = async (url: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'profile-pictures');
    if (bucketIndex === -1) return false;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('profile-pictures')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return false;
  }
};

export const deleteClientLogo = async (url: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'client-logos');
    if (bucketIndex === -1) return false;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('client-logos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting logo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting client logo:', error);
    return false;
  }
};

// Trainer creation function using Edge Function
export const createTrainer = async (trainerData: {
  name: string;
  email: string;
  phone_number?: string;
  function_title?: string;
  specialties?: string[];
  experience?: string;
  degrees_certifications?: string[];
  availability?: string;
  profile_picture_url?: string;
}): Promise<{ success: boolean; error?: string; trainer?: any }> => {
  try {
    console.log('Creating trainer via Edge Function...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'No active session' };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/create-trainer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trainerData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Edge function error:', result);
      return { success: false, error: result.error || 'Failed to create trainer' };
    }

    return { success: true, trainer: result.trainer };
  } catch (error) {
    console.error('Error creating trainer:', error);
    return { success: false, error: 'Network error occurred' };
  }
};

// New helper functions for enhanced training management
export const createTrainingSession = async (sessionData: Omit<TrainingSession, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingSession | null> => {
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating training session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating training session:', error);
    return null;
  }
};

export const createTrainingDocument = async (documentData: Omit<TrainingDocument, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingDocument | null> => {
  try {
    const { data, error } = await supabase
      .from('training_documents')
      .insert([documentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating training document:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating training document:', error);
    return null;
  }
};

export const createTrainingEvaluation = async (evaluationData: Omit<TrainingEvaluation, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingEvaluation | null> => {
  try {
    const { data, error } = await supabase
      .from('training_evaluations')
      .insert([evaluationData])
      .select()
      .single();

    if (error) {
      console.error('Error creating training evaluation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating training evaluation:', error);
    return null;
  }
};

export const createTrainingCertification = async (certificationData: Omit<TrainingCertification, 'id' | 'certificate_number' | 'created_at' | 'updated_at'>): Promise<TrainingCertification | null> => {
  try {
    const { data, error } = await supabase
      .from('training_certifications')
      .insert([certificationData])
      .select()
      .single();

    if (error) {
      console.error('Error creating training certification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating training certification:', error);
    return null;
  }
};

// Get enhanced training overview
export const getTrainingOverview = async (trainingId: string) => {
  try {
    const { data, error } = await supabase
      .from('training_overview')
      .select('*')
      .eq('id', trainingId)
      .single();

    if (error) {
      console.error('Error fetching training overview:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching training overview:', error);
    return null;
  }
};