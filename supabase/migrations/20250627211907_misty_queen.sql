/*
  # Reset Database with Demo Accounts

  1. Cleanup
    - Drop all existing tables in correct order
    - Remove all existing data

  2. Core Tables Recreation
    - `user_roles` - User role definitions
    - `user_profiles` - User profile information  
    - `user_preferences` - User preferences
    - `clients` - Client companies
    - `profiles` - Trainer profiles (legacy compatibility)
    - `trainings` - Training sessions
    - `participants` - Training participants

  3. Demo Data
    - Admin role and user account
    - Trainer role and user account
    - Sample client and training data

  4. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Drop all existing tables in reverse dependency order
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS training_evaluations CASCADE;
DROP TABLE IF EXISTS training_certifications CASCADE;
DROP TABLE IF EXISTS training_documents CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop views
DROP VIEW IF EXISTS training_overview CASCADE;

-- Drop functions that might cause issues
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS validate_profile_picture_url CASCADE;
DROP FUNCTION IF EXISTS validate_document_url CASCADE;
DROP FUNCTION IF EXISTS auto_generate_certificate_number CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_signup CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS email CASCADE;

-- Recreate utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN user_roles ur ON up.role_id = ur.id
    WHERE up.id = auth.uid() AND ur.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION email()
RETURNS TEXT AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user_roles table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_read_roles" ON user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_can_manage_roles" ON user_roles
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role_id uuid REFERENCES user_roles(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
  phone text,
  department text,
  job_title text,
  bio text,
  profile_picture text,
  last_login_at timestamptz,
  email_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

CREATE POLICY "users_can_read_own_profile" ON user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_can_read_all_profiles" ON user_profiles
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "admin_can_update_all_profiles" ON user_profiles
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "authenticated_users_can_read_basic_profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user_preferences table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'fr',
  timezone text DEFAULT 'Europe/Paris',
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT false,
  week_starts_on integer DEFAULT 1 CHECK (week_starts_on >= 0 AND week_starts_on <= 6),
  date_format text DEFAULT 'DD/MM/YYYY',
  time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_manage_own_preferences" ON user_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_clients_read" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_all_clients_write" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profiles table (for trainer profiles, legacy compatibility)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'trainer')),
  phone_number text,
  function_title text CHECK (function_title IN ('Formateur', 'Formateur Senior', 'Formateur Expert', 'Consultant', 'Expert Métier', 'Responsable Formation', 'Coordinateur Pédagogique', 'Autre')),
  specialties text[] DEFAULT '{}',
  experience text,
  degrees_certifications text[] DEFAULT '{}',
  profile_picture_url text,
  availability text,
  digital_signature text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_profiles_read" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_profile_creation" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "allow_admin_all_operations" ON profiles
  FOR ALL TO authenticated USING (auth.uid() = id OR is_admin()) WITH CHECK (auth.uid() = id OR is_admin());

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trainings table
CREATE TABLE trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  trainer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  trainer_name text NOT NULL,
  days integer DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  objectives text[],
  program_content jsonb,
  prerequisites text[],
  target_audience text,
  training_methods text[],
  skill_level text CHECK (skill_level IN ('débutant', 'intermédiaire', 'avancé', 'expert')),
  training_type text CHECK (training_type IN ('présentiel', 'distanciel', 'hybride', 'e-learning')),
  max_participants integer DEFAULT 20,
  room_requirements text,
  equipment_needed text[],
  meeting_link text,
  access_code text,
  price_per_participant numeric(10,2),
  total_budget numeric(10,2),
  payment_terms text,
  invoice_reference text,
  organizer_name text,
  organizer_email text,
  organizer_phone text,
  contact_person text,
  evaluation_method text[],
  certification_type text,
  certificate_template text,
  attendance_required numeric(3,1) DEFAULT 80.0,
  internal_notes text,
  tags text[],
  category text,
  language text DEFAULT 'français',
  timezone text DEFAULT 'Europe/Paris',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_trainings_read" ON trainings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_all_trainings_write" ON trainings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON trainings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create participants table
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  has_signed boolean DEFAULT false,
  is_present boolean DEFAULT false,
  signature_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_participants_read" ON participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_all_participants_write" ON participants
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo roles
INSERT INTO user_roles (id, name, display_name, description, permissions, is_system) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'admin', 'Administrateur', 'Accès complet au système', '[
  {"resource": "users", "action": "create"},
  {"resource": "users", "action": "read"},
  {"resource": "users", "action": "update"},
  {"resource": "users", "action": "delete"},
  {"resource": "trainings", "action": "create"},
  {"resource": "trainings", "action": "read"},
  {"resource": "trainings", "action": "update"},
  {"resource": "trainings", "action": "delete"},
  {"resource": "clients", "action": "create"},
  {"resource": "clients", "action": "read"},
  {"resource": "clients", "action": "update"},
  {"resource": "clients", "action": "delete"}
]'::jsonb, true),
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'trainer', 'Formateur', 'Accès aux formations et participants', '[
  {"resource": "trainings", "action": "read"},
  {"resource": "trainings", "action": "update"},
  {"resource": "participants", "action": "read"},
  {"resource": "participants", "action": "update"}
]'::jsonb, true);

-- Insert demo client
INSERT INTO clients (id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Entreprise Demo', 'Client de démonstration pour les formations');

-- Note: Les utilisateurs doivent être créés dans Supabase Auth avec ces emails:
-- admin@formation-pro.com (mot de passe: AdminDemo2024!)
-- formateur@formation-pro.com (mot de passe: TrainerDemo2024!)

-- The actual user profiles will be created when users first log in via a trigger
-- or by the application logic that handles the missing profile scenario