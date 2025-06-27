/*
  # Système complet de gestion des utilisateurs et authentification

  1. Nouvelles Tables
    - `user_permissions` - Permissions granulaires du système
    - `user_roles` - Rôles avec permissions associées
    - `user_profiles` - Profils utilisateurs détaillés
    - `user_sessions` - Gestion des sessions utilisateur
    - `user_invitations` - Système d'invitations
    - `user_activities` - Logs d'activité et audit
    - `user_preferences` - Préférences utilisateur personnalisables

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques basées sur les rôles
    - Audit trail complet
    - Sessions sécurisées

  3. Fonctionnalités
    - Système de permissions granulaires
    - Invitations avec tokens
    - Logs d'activité automatiques
    - Préférences personnalisables
*/

-- Table des permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table des rôles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des profils utilisateurs (remplace profiles)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role_id uuid REFERENCES user_roles(id) ON DELETE SET NULL,
  status text DEFAULT 'pending_verification' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
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

-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  refresh_token text UNIQUE,
  expires_at timestamptz NOT NULL,
  device_info text,
  ip_address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table des invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role_id uuid REFERENCES user_roles(id) ON DELETE CASCADE,
  invited_by_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table des activités utilisateur
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Table des préférences utilisateur
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'fr',
  timezone text DEFAULT 'Europe/Paris',
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT false,
  week_starts_on integer DEFAULT 1 CHECK (week_starts_on BETWEEN 0 AND 6),
  date_format text DEFAULT 'DD/MM/YYYY',
  time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Insérer les permissions de base
INSERT INTO user_permissions (name, resource, action, description) VALUES
  ('users:read', 'users', 'read', 'Lire les utilisateurs'),
  ('users:create', 'users', 'create', 'Créer des utilisateurs'),
  ('users:update', 'users', 'update', 'Modifier des utilisateurs'),
  ('users:delete', 'users', 'delete', 'Supprimer des utilisateurs'),
  ('trainings:read', 'trainings', 'read', 'Lire les formations'),
  ('trainings:create', 'trainings', 'create', 'Créer des formations'),
  ('trainings:update', 'trainings', 'update', 'Modifier des formations'),
  ('trainings:delete', 'trainings', 'delete', 'Supprimer des formations'),
  ('participants:read', 'participants', 'read', 'Lire les participants'),
  ('participants:create', 'participants', 'create', 'Créer des participants'),
  ('participants:update', 'participants', 'update', 'Modifier des participants'),
  ('participants:delete', 'participants', 'delete', 'Supprimer des participants'),
  ('system:admin', 'system', 'admin', 'Administration système')
ON CONFLICT (name) DO NOTHING;

-- Insérer les rôles de base avec permissions en JSON
DO $$
DECLARE
    admin_role_id uuid := gen_random_uuid();
    trainer_role_id uuid := gen_random_uuid();
    admin_permissions jsonb;
    trainer_permissions jsonb;
BEGIN
    -- Définir les permissions admin
    admin_permissions := jsonb_build_array(
        jsonb_build_object('id', '1', 'name', 'users:read', 'resource', 'users', 'action', 'read'),
        jsonb_build_object('id', '2', 'name', 'users:create', 'resource', 'users', 'action', 'create'),
        jsonb_build_object('id', '3', 'name', 'users:update', 'resource', 'users', 'action', 'update'),
        jsonb_build_object('id', '4', 'name', 'users:delete', 'resource', 'users', 'action', 'delete'),
        jsonb_build_object('id', '5', 'name', 'trainings:read', 'resource', 'trainings', 'action', 'read'),
        jsonb_build_object('id', '6', 'name', 'trainings:create', 'resource', 'trainings', 'action', 'create'),
        jsonb_build_object('id', '7', 'name', 'trainings:update', 'resource', 'trainings', 'action', 'update'),
        jsonb_build_object('id', '8', 'name', 'trainings:delete', 'resource', 'trainings', 'action', 'delete'),
        jsonb_build_object('id', '9', 'name', 'participants:read', 'resource', 'participants', 'action', 'read'),
        jsonb_build_object('id', '10', 'name', 'participants:create', 'resource', 'participants', 'action', 'create'),
        jsonb_build_object('id', '11', 'name', 'participants:update', 'resource', 'participants', 'action', 'update'),
        jsonb_build_object('id', '12', 'name', 'participants:delete', 'resource', 'participants', 'action', 'delete'),
        jsonb_build_object('id', '13', 'name', 'system:admin', 'resource', 'system', 'action', 'admin')
    );

    -- Définir les permissions formateur
    trainer_permissions := jsonb_build_array(
        jsonb_build_object('id', '5', 'name', 'trainings:read', 'resource', 'trainings', 'action', 'read'),
        jsonb_build_object('id', '6', 'name', 'trainings:create', 'resource', 'trainings', 'action', 'create'),
        jsonb_build_object('id', '7', 'name', 'trainings:update', 'resource', 'trainings', 'action', 'update'),
        jsonb_build_object('id', '9', 'name', 'participants:read', 'resource', 'participants', 'action', 'read'),
        jsonb_build_object('id', '10', 'name', 'participants:create', 'resource', 'participants', 'action', 'create'),
        jsonb_build_object('id', '11', 'name', 'participants:update', 'resource', 'participants', 'action', 'update')
    );

    -- Insérer le rôle admin
    INSERT INTO user_roles (id, name, display_name, description, permissions, is_system)
    VALUES (
        admin_role_id,
        'admin',
        'Administrateur',
        'Accès complet à toutes les fonctionnalités',
        admin_permissions,
        true
    )
    ON CONFLICT (name) DO NOTHING;

    -- Insérer le rôle trainer
    INSERT INTO user_roles (id, name, display_name, description, permissions, is_system)
    VALUES (
        trainer_role_id,
        'trainer',
        'Formateur',
        'Accès aux formations et participants',
        trainer_permissions,
        true
    )
    ON CONFLICT (name) DO NOTHING;
END $$;

-- Créer l'utilisateur administrateur par défaut
DO $$
DECLARE
    admin_user_id uuid;
    admin_role_id uuid;
BEGIN
    -- Obtenir l'ID du rôle admin
    SELECT id INTO admin_role_id FROM user_roles WHERE name = 'admin';
    
    -- Créer l'utilisateur admin s'il n'existe pas
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
        'admin@formation-pro.com',
        crypt('AdminDemo2024!', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Admin", "last_name": "System", "role": "admin"}',
        false,
        'authenticated'
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@formation-pro.com'
    )
    RETURNING id INTO admin_user_id;

    -- Si l'utilisateur existait déjà, récupérer son ID
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@formation-pro.com';
    END IF;

    -- Créer le profil admin
    INSERT INTO user_profiles (
        id,
        email,
        first_name,
        last_name,
        role_id,
        status,
        email_verified_at,
        created_at,
        updated_at
    )
    VALUES (
        admin_user_id,
        'admin@formation-pro.com',
        'Admin',
        'System',
        admin_role_id,
        'active',
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role_id = admin_role_id,
        status = 'active',
        updated_at = NOW();

    -- Créer les préférences par défaut
    INSERT INTO user_preferences (user_id)
    VALUES (admin_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Créer un utilisateur formateur de démo
DO $$
DECLARE
    trainer_user_id uuid;
    trainer_role_id uuid;
BEGIN
    -- Obtenir l'ID du rôle trainer
    SELECT id INTO trainer_role_id FROM user_roles WHERE name = 'trainer';
    
    -- Créer l'utilisateur formateur s'il n'existe pas
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
        'formateur@formation-pro.com',
        crypt('TrainerDemo2024!', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Marie", "last_name": "Dubois", "role": "trainer"}',
        false,
        'authenticated'
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'formateur@formation-pro.com'
    )
    RETURNING id INTO trainer_user_id;

    -- Si l'utilisateur existait déjà, récupérer son ID
    IF trainer_user_id IS NULL THEN
        SELECT id INTO trainer_user_id FROM auth.users WHERE email = 'formateur@formation-pro.com';
    END IF;

    -- Créer le profil formateur
    INSERT INTO user_profiles (
        id,
        email,
        first_name,
        last_name,
        role_id,
        status,
        email_verified_at,
        job_title,
        department,
        created_at,
        updated_at
    )
    VALUES (
        trainer_user_id,
        'formateur@formation-pro.com',
        'Marie',
        'Dubois',
        trainer_role_id,
        'active',
        NOW(),
        'Formatrice Senior',
        'Formation',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role_id = trainer_role_id,
        status = 'active',
        updated_at = NOW();

    -- Créer les préférences par défaut
    INSERT INTO user_preferences (user_id)
    VALUES (trainer_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Politiques RLS pour user_permissions
CREATE POLICY "Allow read access to permissions for authenticated users"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Politiques RLS pour user_roles
CREATE POLICY "Allow read access to roles for authenticated users"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin management of roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

-- Politiques RLS pour user_profiles
CREATE POLICY "Users can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

-- Politiques RLS pour user_sessions
CREATE POLICY "Users can read their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour user_invitations
CREATE POLICY "Admins can manage invitations"
  ON user_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

-- Politiques RLS pour user_activities
CREATE POLICY "Users can read their own activities"
  ON user_activities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all activities"
  ON user_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "System can insert activities"
  ON user_activities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour user_preferences
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers pour updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour gérer la création automatique de profil
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id uuid;
BEGIN
    -- Obtenir l'ID du rôle par défaut (trainer)
    SELECT id INTO default_role_id FROM user_roles WHERE name = 'trainer';
    
    -- Créer le profil utilisateur
    INSERT INTO user_profiles (
        id,
        email,
        first_name,
        last_name,
        role_id,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role_id')::uuid, default_role_id),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active' ELSE 'pending_verification' END,
        NOW(),
        NOW()
    );
    
    -- Créer les préférences par défaut
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour la création automatique de profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Nettoyer les sessions expirées (fonction utilitaire)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR is_active = false;
END;
$$ LANGUAGE plpgsql;

-- Nettoyer les invitations expirées (fonction utilitaire)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE user_invitations
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;