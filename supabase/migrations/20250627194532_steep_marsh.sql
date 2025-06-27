/*
  # Création des tables et politiques principales

  1. Nouvelles Tables
    - `profiles` - Profils des utilisateurs avec informations détaillées
    - `trainings` - Formations avec toutes les métadonnées
    - `participants` - Participants aux formations avec signatures

  2. Sécurité
    - Activation RLS sur toutes les tables
    - Politiques d'accès appropriées pour chaque rôle
    - Validation des URLs d'images

  3. Fonctionnalités
    - Triggers automatiques pour timestamps
    - Gestion automatique des nouveaux utilisateurs
    - Buckets de stockage pour images
    - Utilisateur administrateur par défaut
*/

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour gérer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'trainer'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider les URLs d'images de profil
CREATE OR REPLACE FUNCTION validate_profile_picture_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'URL n'est pas nulle, vérifier qu'elle commence par une URL valide
  IF NEW.profile_picture_url IS NOT NULL AND NEW.profile_picture_url != '' THEN
    IF NOT (NEW.profile_picture_url ~* '^https?://.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$' OR 
            NEW.profile_picture_url ~* '^https://.*supabase.*storage.*') THEN
      RAISE EXCEPTION 'URL d''image de profil invalide';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
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
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Table des formations
CREATE TABLE IF NOT EXISTS trainings (
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
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Table des participants
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  has_signed boolean DEFAULT false,
  is_present boolean DEFAULT false,
  signature_date timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "allow_all_profiles_read" ON profiles;
DROP POLICY IF EXISTS "allow_own_profile_write" ON profiles;
DROP POLICY IF EXISTS "allow_all_trainings_read" ON trainings;
DROP POLICY IF EXISTS "allow_all_trainings_write" ON trainings;
DROP POLICY IF EXISTS "allow_all_participants_read" ON participants;
DROP POLICY IF EXISTS "allow_all_participants_write" ON participants;

-- Politiques pour la table profiles
CREATE POLICY "allow_all_profiles_read"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_own_profile_write"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politiques pour la table trainings
CREATE POLICY "allow_all_trainings_read"
  ON trainings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_trainings_write"
  ON trainings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour la table participants
CREATE POLICY "allow_all_participants_read"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_participants_write"
  ON participants
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_trainings_updated_at ON trainings;
DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;
DROP TRIGGER IF EXISTS validate_profile_picture_url_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Triggers pour la mise à jour automatique des timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour la validation des URLs d'images de profil
CREATE TRIGGER validate_profile_picture_url_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_picture_url();

-- Trigger pour gérer les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Créer un utilisateur administrateur par défaut
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insérer l'utilisateur admin dans auth.users s'il n'existe pas
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  )
  SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'jl.calmon@jlc-mercury.com',
    crypt('Calm@n251158339846', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "JL Calmon", "role": "admin"}',
    false,
    'authenticated'
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'jl.calmon@jlc-mercury.com'
  )
  RETURNING id INTO admin_user_id;

  -- Insérer le profil admin s'il n'existe pas
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO profiles (
      id,
      name,
      email,
      role,
      phone_number,
      function_title,
      created_at,
      updated_at
    )
    VALUES (
      admin_user_id,
      'JL Calmon',
      'jl.calmon@jlc-mercury.com',
      'admin',
      '+33 6 12 34 56 78',
      'Responsable Formation',
      NOW(),
      NOW()
    );
  ELSE
    -- Si l'utilisateur existe déjà, s'assurer que le profil existe
    INSERT INTO profiles (
      id,
      name,
      email,
      role,
      phone_number,
      function_title,
      created_at,
      updated_at
    )
    SELECT 
      u.id,
      'JL Calmon',
      'jl.calmon@jlc-mercury.com',
      'admin',
      '+33 6 12 34 56 78',
      'Responsable Formation',
      NOW(),
      NOW()
    FROM auth.users u
    WHERE u.email = 'jl.calmon@jlc-mercury.com'
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE email = 'jl.calmon@jlc-mercury.com'
    );
  END IF;
END $$;

-- Créer les buckets de stockage pour les images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-pictures', 'profile-pictures', true),
  ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les politiques de stockage existantes si elles existent
DROP POLICY IF EXISTS "allow_authenticated_upload_profile_pictures" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_read_profile_pictures" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_update_profile_pictures" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_delete_profile_pictures" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_upload_client_logos" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_read_client_logos" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_update_client_logos" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_delete_client_logos" ON storage.objects;

-- Politiques de stockage pour les images de profil
CREATE POLICY "allow_authenticated_upload_profile_pictures"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "allow_public_read_profile_pictures"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "allow_authenticated_update_profile_pictures"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "allow_authenticated_delete_profile_pictures"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-pictures');

-- Politiques de stockage pour les logos clients
CREATE POLICY "allow_authenticated_upload_client_logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-logos');

CREATE POLICY "allow_public_read_client_logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'client-logos');

CREATE POLICY "allow_authenticated_update_client_logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'client-logos');

CREATE POLICY "allow_authenticated_delete_client_logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'client-logos');