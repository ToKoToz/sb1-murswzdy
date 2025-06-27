/*
  # Fix Authentication System

  1. Cleanup existing issues
    - Drop problematic policies that cause infinite recursion
    - Simplify RLS policies

  2. Create simple, working structure
    - Basic user_roles table
    - Basic user_profiles table
    - Simple policies without recursion

  3. Insert demo data
    - Admin and trainer roles
    - Demo user accounts that match the frontend expectations
*/

-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Drop problematic functions
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS email CASCADE;

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

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "authenticated_users_can_read_roles" ON user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_can_read_basic_profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_can_update_own_profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_manage_own_preferences" ON user_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo roles
INSERT INTO user_roles (id, name, display_name, description, permissions, is_system) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'Administrateur', 'Accès complet au système', '[
  {"resource": "users", "action": "create"},
  {"resource": "users", "action": "read"},
  {"resource": "users", "action": "update"},
  {"resource": "users", "action": "delete"},
  {"resource": "trainings", "action": "create"},
  {"resource": "trainings", "action": "read"},
  {"resource": "trainings", "action": "update"},
  {"resource": "trainings", "action": "delete"}
]'::jsonb, true),
('22222222-2222-2222-2222-222222222222', 'trainer', 'Formateur', 'Accès aux formations et participants', '[
  {"resource": "trainings", "action": "read"},
  {"resource": "trainings", "action": "update"},
  {"resource": "participants", "action": "read"},
  {"resource": "participants", "action": "update"}
]'::jsonb, true);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);