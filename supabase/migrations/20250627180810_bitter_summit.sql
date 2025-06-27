/*
  # Complete fix for infinite loading issue
  
  1. Disable RLS completely and recreate with minimal policies
  2. Fix auth flow and profile creation
  3. Ensure no recursive queries
*/

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainings DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies completely
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
    
    -- Drop all policies on trainings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trainings') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON trainings';
    END LOOP;
    
    -- Drop all policies on participants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'participants') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON participants';
    END LOOP;
END $$;

-- Temporarily disable RLS to allow data operations
-- We'll create very simple policies that don't cause recursion

-- Re-enable RLS with minimal policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- PROFILES: Ultra-simple policies
CREATE POLICY "allow_all_profiles_read"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_own_profile_write"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- TRAININGS: Ultra-simple policies
CREATE POLICY "allow_all_trainings_read"
  ON trainings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_trainings_write"
  ON trainings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PARTICIPANTS: Ultra-simple policies
CREATE POLICY "allow_all_participants_read"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_participants_write"
  ON participants FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Ensure admin user exists and is properly configured
DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean := false;
BEGIN
    -- Check if admin user exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'jl.calmon@jlc-mercury.com'
    ) INTO admin_exists;
    
    -- If admin doesn't exist, create it
    IF NOT admin_exists THEN
        admin_user_id := gen_random_uuid();
        
        -- Insert into auth.users
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
            'jl.calmon@jlc-mercury.com',
            crypt('Calm@n251158339846', gen_salt('bf')),
            NOW(),
            NOW(),
            NULL,
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "JL Calmon", "role": "admin"}',
            FALSE,
            NOW(),
            NOW(),
            0,
            FALSE
        );
        
        -- Insert into auth.identities
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
    ELSE
        -- Get existing admin user ID
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'jl.calmon@jlc-mercury.com';
    END IF;
    
    -- Ensure profile exists for admin
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