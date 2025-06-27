/*
  # Complete fix for infinite loading issue

  1. Problem Analysis
    - RLS policies causing infinite recursion
    - Auth context potentially stuck in loading state
    - Profile fetching issues

  2. Solution
    - Completely rebuild RLS policies without recursion
    - Ensure proper auth flow
    - Fix profile creation and access
*/

-- Disable RLS on all tables to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainings DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_policy" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile management for admin operations" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create trainer profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

-- Drop training policies
DROP POLICY IF EXISTS "Trainings are viewable by authenticated users" ON trainings;
DROP POLICY IF EXISTS "Admins can manage all trainings" ON trainings;
DROP POLICY IF EXISTS "Trainers can update their assigned trainings" ON trainings;

-- Drop participant policies
DROP POLICY IF EXISTS "Participants are viewable by authenticated users" ON participants;
DROP POLICY IF EXISTS "Admins can manage all participants" ON participants;
DROP POLICY IF EXISTS "Trainers can manage participants in their trainings" ON participants;
DROP POLICY IF EXISTS "Allow signature updates for participants" ON participants;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "profiles_select_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own_policy"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_policy"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Simple admin policy using direct auth.users check (no recursion)
CREATE POLICY "profiles_admin_policy"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'jl.calmon@jlc-mercury.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'jl.calmon@jlc-mercury.com'
    )
  );

-- Simple policies for trainings
CREATE POLICY "trainings_select_policy"
  ON trainings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "trainings_admin_policy"
  ON trainings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'jl.calmon@jlc-mercury.com'
    )
  );

CREATE POLICY "trainings_trainer_update_policy"
  ON trainings
  FOR UPDATE
  TO authenticated
  USING (trainer_id = auth.uid());

-- Simple policies for participants
CREATE POLICY "participants_select_policy"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "participants_admin_policy"
  ON participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'jl.calmon@jlc-mercury.com'
    )
  );

CREATE POLICY "participants_trainer_policy"
  ON participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainings
      WHERE trainings.id = participants.training_id 
      AND trainings.trainer_id = auth.uid()
    )
  );

-- Allow signature updates for QR code functionality
CREATE POLICY "participants_signature_policy"
  ON participants
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure admin user exists with correct data
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'jl.calmon@jlc-mercury.com';
    
    -- If admin user doesn't exist, create it
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
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
            'jl.calmon@jlc-mercury.com',
            crypt('Calm@n251158339846', gen_salt('bf')),
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
            '{"name": "JL Calmon", "role": "admin"}',
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
        );
        
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
            format('{"sub": "%s", "email": "%s"}', admin_user_id::text, 'jl.calmon@jlc-mercury.com')::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
    
    -- Ensure profile exists
    INSERT INTO profiles (
        id,
        name,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'JL Calmon',
        'jl.calmon@jlc-mercury.com',
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = 'JL Calmon',
        email = 'jl.calmon@jlc-mercury.com',
        role = 'admin',
        updated_at = NOW();
        
END $$;

-- Clean up storage policies
DROP POLICY IF EXISTS "profile_pictures_policy" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Create simple storage policy
CREATE POLICY "storage_policy"
  ON storage.objects
  FOR ALL
  TO authenticated, anon
  USING (bucket_id = 'profile-pictures')
  WITH CHECK (bucket_id = 'profile-pictures');