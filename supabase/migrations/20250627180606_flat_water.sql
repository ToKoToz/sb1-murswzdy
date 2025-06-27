/*
  # Fix infinite loading issue

  1. Problem
    - RLS policies causing infinite recursion
    - Auth context stuck in loading state
    - Profile fetching creating loops

  2. Solution
    - Simplify RLS policies to avoid recursion
    - Use direct auth checks instead of profile table queries
    - Ensure proper auth flow without loops
*/

-- Disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainings DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$
BEGIN
    -- Drop profiles policies
    DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_own_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_admin_policy" ON profiles;
    
    -- Drop trainings policies
    DROP POLICY IF EXISTS "trainings_select_policy" ON trainings;
    DROP POLICY IF EXISTS "trainings_admin_policy" ON trainings;
    DROP POLICY IF EXISTS "trainings_trainer_update_policy" ON trainings;
    
    -- Drop participants policies
    DROP POLICY IF EXISTS "participants_select_policy" ON participants;
    DROP POLICY IF EXISTS "participants_admin_policy" ON participants;
    DROP POLICY IF EXISTS "participants_trainer_policy" ON participants;
    DROP POLICY IF EXISTS "participants_signature_policy" ON participants;
    
    -- Drop any other existing policies
    DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Allow profile management for admin operations" ON profiles;
    DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can create trainer profiles" ON profiles;
    DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Trainings are viewable by authenticated users" ON trainings;
    DROP POLICY IF EXISTS "Admins can manage all trainings" ON trainings;
    DROP POLICY IF EXISTS "Trainers can update their assigned trainings" ON trainings;
    DROP POLICY IF EXISTS "Participants are viewable by authenticated users" ON participants;
    DROP POLICY IF EXISTS "Admins can manage all participants" ON participants;
    DROP POLICY IF EXISTS "Trainers can manage participants in their trainings" ON participants;
    DROP POLICY IF EXISTS "Allow signature updates for participants" ON participants;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if policies don't exist
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- PROFILES TABLE POLICIES
-- Allow all authenticated users to read profiles
CREATE POLICY "profiles_select_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own_policy"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_policy"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin policy using direct email check (no recursion)
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

-- TRAININGS TABLE POLICIES
-- Allow all authenticated users to read trainings
CREATE POLICY "trainings_select_policy"
  ON trainings
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin can manage all trainings
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

-- Trainers can update their assigned trainings
CREATE POLICY "trainings_trainer_update_policy"
  ON trainings
  FOR UPDATE
  TO authenticated
  USING (trainer_id = auth.uid());

-- PARTICIPANTS TABLE POLICIES
-- Allow all authenticated users to read participants
CREATE POLICY "participants_select_policy"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin can manage all participants
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

-- Trainers can manage participants in their trainings
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

-- Allow signature updates for QR code functionality (public access)
CREATE POLICY "participants_signature_policy"
  ON participants
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);