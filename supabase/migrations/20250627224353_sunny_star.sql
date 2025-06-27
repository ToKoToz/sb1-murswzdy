/*
  # Dry Base Migration

  This migration completely resets the database to a clean state.
  It includes:
  1. Dropping ALL existing tables, functions, and sequences.
  2. Recreating a simple, working schema.
  3. Implementing non-recursive RLS policies.
  4. Creating working demo accounts and sample data.
*/

-- Drop ALL existing tables and functions to start completely fresh
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
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

-- Drop ALL functions that might cause issues
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS validate_profile_picture_url() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS email() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_invitations() CASCADE;

-- Drop all sequences
DROP SEQUENCE IF EXISTS certificate_sequence CASCADE;

-- Recreate the utility function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create simple, working tables

-- 1. PROFILES TABLE (main table for both admin and trainers)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'trainer')),
  phone_number text,
  function_title text,
  specialties text[] DEFAULT '{}',
  experience text,
  degrees_certifications text[] DEFAULT '{}',
  profile_picture_url text,
  availability text,
  digital_signature text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. CLIENTS TABLE
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. EMPLOYEES TABLE
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. TRAININGS TABLE
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

-- 5. PARTICIPANTS TABLE
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE, NON-RECURSIVE RLS policies

-- PROFILES: Allow all authenticated users to read profiles, admins to manage all, users to manage own
CREATE POLICY "authenticated_users_can_read_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Simple admin check using direct email comparison (no recursion)
CREATE POLICY "admin_can_manage_all_profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@formation-pro.com', 'jl.calmon@jlc-mercury.com')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@formation-pro.com', 'jl.calmon@jlc-mercury.com')
    )
  );

-- CLIENTS: Simple policies
CREATE POLICY "authenticated_users_can_read_clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_manage_clients"
  ON clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- EMPLOYEES: Simple policies
CREATE POLICY "authenticated_users_can_read_employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_manage_employees"
  ON employees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- TRAININGS: Simple policies
CREATE POLICY "authenticated_users_can_read_trainings"
  ON trainings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_manage_trainings"
  ON trainings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PARTICIPANTS: Simple policies (allow anon for signatures)
CREATE POLICY "all_users_can_read_participants"
  ON participants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "all_users_can_manage_participants"
  ON participants FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON trainings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_employees_client_id ON employees(client_id);
CREATE INDEX idx_trainings_trainer_id ON trainings(trainer_id);
CREATE INDEX idx_participants_training_id ON participants(training_id);

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-pictures', 'profile-pictures', true),
  ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Début de la section de remplacement pour les politiques de stockage

-- Désactiver temporairement RLS sur storage.objects pour faciliter la suppression des politiques
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Supprimer programmatiquement TOUTES les politiques existantes sur storage.objects
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' LOOP
        EXECUTE 'DROP POLICY ' || quote_ident(r.policyname) || ' ON storage.objects;';
    END LOOP;
END $$;

-- Réactiver RLS sur storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Simple storage policies
CREATE POLICY "public_read_profile_pictures"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "authenticated_upload_profile_pictures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "authenticated_update_profile_pictures"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "authenticated_delete_profile_pictures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "public_read_client_logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'client-logos');

CREATE POLICY "authenticated_upload_client_logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-logos');

CREATE POLICY "authenticated_update_client_logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'client-logos');

CREATE POLICY "authenticated_delete_client_logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'client-logos');

-- Fin de la section de remplacement pour les politiques de stockage

-- Create demo data

-- Insert a demo client
INSERT INTO clients (id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'TechCorp Solutions', 'Entreprise de démonstration spécialisée dans les technologies');

-- Insert demo employees for the client
INSERT INTO employees (client_id, first_name, last_name, email) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Jean', 'Dupont', 'jean.dupont@techcorp.com'),
('550e8400-e29b-41d4-a716-446655440000', 'Marie', 'Martin', 'marie.martin@techcorp.com'),
('550e8400-e29b-41d4-a716-446655440000', 'Pierre', 'Bernard', 'pierre.bernard@techcorp.com');

-- Create demo users with working authentication
DO $$
DECLARE
    admin_user_id uuid := '33333333-3333-3333-3333-333333333333';
    trainer_user_id uuid := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- Delete existing users if they exist
    DELETE FROM auth.identities WHERE user_id IN (admin_user_id, trainer_user_id);
    DELETE FROM auth.users WHERE id IN (admin_user_id, trainer_user_id);

    -- Insert admin user into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        email_change_confirm_status,
        is_sso_user
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_user_id,
        'authenticated',
        'authenticated',
        'admin@formation-pro.com',
        crypt('AdminDemo2024!', gen_salt('bf')),
        NOW(),
        NOW(),
        NULL,
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Admin System", "role": "admin"}',
        FALSE,
        NOW(),
        NOW(),
        0,
        FALSE
    );

    -- Insert admin identity
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        admin_user_id,
        admin_user_id::text,
        format('{"sub": "%s", "email": "%s"}', admin_user_id::text, 'admin@formation-pro.com')::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    -- Insert trainer user into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        email_change_confirm_status,
        is_sso_user
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        trainer_user_id,
        'authenticated',
        'authenticated',
        'formateur@formation-pro.com',
        crypt('TrainerDemo2024!', gen_salt('bf')),
        NOW(),
        NOW(),
        NULL,
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Marie Dubois", "role": "trainer"}',
        FALSE,
        NOW(),
        NOW(),
        0,
        FALSE
    );

    -- Insert trainer identity
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        trainer_user_id,
        trainer_user_id::text,
        format('{"sub": "%s", "email": "%s"}', trainer_user_id::text, 'formateur@formation-pro.com')::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    -- Create admin profile
    INSERT INTO profiles (
        id,
        name,
        email,
        role,
        phone_number,
        function_title,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'Admin System',
        'admin@formation-pro.com',
        'admin',
        '+33 1 23 45 67 89',
        'Administrateur',
        NOW(),
        NOW()
    );

    -- Create trainer profile
    INSERT INTO profiles (
        id,
        name,
        email,
        role,
        phone_number,
        function_title,
        experience,
        created_at,
        updated_at
    ) VALUES (
        trainer_user_id,
        'Marie Dubois',
        'formateur@formation-pro.com',
        'trainer',
        '+33 6 12 34 56 78',
        'Formatrice Senior',
        '5 ans d''expérience dans la formation professionnelle',
        NOW(),
        NOW()
    );

END $$;

-- Create a demo training
INSERT INTO trainings (
    id,
    title,
    company,
    location,
    start_date,
    end_date,
    start_time,
    end_time,
    trainer_id,
    trainer_name,
    days,
    status,
    objectives,
    target_audience,
    skill_level,
    training_type
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'Formation Sécurité au Travail',
    'TechCorp Solutions',
    'Paris, France',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '7 days',
    '09:00',
    '17:00',
    '44444444-4444-4444-4444-444444444444',
    'Marie Dubois',
    1,
    'active',
    ARRAY['Comprendre les enjeux de sécurité', 'Maîtriser les bonnes pratiques', 'Appliquer les procédures'],
    'Tous les employés',
    'débutant',
    'présentiel'
);

-- Create demo participants for the training
INSERT INTO participants (training_id, name, email, company, has_signed, is_present) VALUES
('66666666-6666-6666-6666-666666666666', 'Jean Dupont', 'jean.dupont@techcorp.com', 'TechCorp Solutions', false, false),
('66666666-6666-6666-6666-666666666666', 'Marie Martin', 'marie.martin@techcorp.com', 'TechCorp Solutions', true, true),
('66666666-6666-6666-6666-666666666666', 'Pierre Bernard', 'pierre.bernard@techcorp.com', 'TechCorp Solutions', false, false);