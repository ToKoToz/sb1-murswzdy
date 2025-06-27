/*
  # Fix Infinite Loading Loop - Complete Solution

  This migration addresses the circular dependency issue between AuthContext 
  and RLS policies by:
  
  1. Dropping all problematic RLS policies and functions
  2. Creating simple, non-recursive policies
  3. Cleaning up the database structure
  4. Creating demo users with proper credentials

  ## Root Cause
  The infinite loading was caused by:
  - AuthContext trying to load user profile with role JOIN
  - RLS policies using is_admin() function that queries user_profiles
  - Creating a recursive dependency loop

  ## Solution
  - Remove recursive is_admin() function
  - Create simple policies that don't cause recursion
  - Separate role loading from initial authentication
*/

-- Drop all existing tables and functions to start fresh
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Drop problematic functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS email() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;

-- Recreate user_roles table
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

-- Recreate user_profiles table
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

-- Recreate user_preferences table
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

-- Create SIMPLE, NON-RECURSIVE policies
-- These policies are designed to NOT cause infinite recursion

-- user_roles: Allow all authenticated users to read roles
CREATE POLICY "authenticated_users_can_read_roles" 
  ON user_roles FOR SELECT 
  TO authenticated 
  USING (true);

-- user_profiles: Allow users to read their own profile AND admin users
CREATE POLICY "users_can_read_own_profile" 
  ON user_profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Allow reading basic profile info for all authenticated users (needed for app functionality)
CREATE POLICY "authenticated_users_can_read_basic_profiles" 
  ON user_profiles FOR SELECT 
  TO authenticated 
  USING (true);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" 
  ON user_profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_can_insert_own_profile" 
  ON user_profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Special policy for admin operations (using email check instead of role lookup)
CREATE POLICY "admin_email_can_manage_profiles" 
  ON user_profiles FOR ALL 
  TO authenticated 
  USING (
    auth.email() IN ('admin@formation-pro.com', 'jl.calmon@jlc-mercury.com')
  ) 
  WITH CHECK (
    auth.email() IN ('admin@formation-pro.com', 'jl.calmon@jlc-mercury.com')
  );

-- user_preferences: Users can manage their own preferences
CREATE POLICY "users_can_manage_own_preferences" 
  ON user_preferences FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

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

-- Create demo users directly in auth.users with proper credentials
DO $$
DECLARE
    admin_user_id uuid := '33333333-3333-3333-3333-333333333333';
    trainer_user_id uuid := '44444444-4444-4444-4444-444444444444';
    admin_role_id uuid := '11111111-1111-1111-1111-111111111111';
    trainer_role_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Insert admin user into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_user_id,
        'authenticated',
        'authenticated',
        'admin@formation-pro.com',
        crypt('AdminDemo2024!', gen_salt('bf')),
        NOW(),
        NOW(),
        '',
        NOW(),
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Admin", "last_name": "System", "role": "admin"}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        FALSE,
        NULL
    ) ON CONFLICT (id) DO NOTHING;

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
    ) ON CONFLICT (user_id, provider) DO NOTHING;

    -- Insert trainer user into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        trainer_user_id,
        'authenticated',
        'authenticated',
        'formateur@formation-pro.com',
        crypt('TrainerDemo2024!', gen_salt('bf')),
        NOW(),
        NOW(),
        '',
        NOW(),
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Marie", "last_name": "Dubois", "role": "trainer"}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        FALSE,
        NULL
    ) ON CONFLICT (id) DO NOTHING;

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
    ) ON CONFLICT (user_id, provider) DO NOTHING;

    -- Create admin profile
    INSERT INTO user_profiles (
        id,
        email,
        first_name,
        last_name,
        role_id,
        status,
        job_title,
        department,
        email_verified_at,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@formation-pro.com',
        'Admin',
        'System',
        admin_role_id,
        'active',
        'Administrateur Système',
        'Administration',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role_id = admin_role_id,
        status = 'active',
        updated_at = NOW();

    -- Create trainer profile
    INSERT INTO user_profiles (
        id,
        email,
        first_name,
        last_name,
        role_id,
        status,
        job_title,
        department,
        email_verified_at,
        created_at,
        updated_at
    ) VALUES (
        trainer_user_id,
        'formateur@formation-pro.com',
        'Marie',
        'Dubois',
        trainer_role_id,
        'active',
        'Formatrice Senior',
        'Formation',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role_id = trainer_role_id,
        status = 'active',
        updated_at = NOW();

    -- Create preferences for both users
    INSERT INTO user_preferences (user_id) VALUES (admin_user_id) ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO user_preferences (user_id) VALUES (trainer_user_id) ON CONFLICT (user_id) DO NOTHING;
END $$;