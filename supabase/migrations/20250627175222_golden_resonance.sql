/*
  # Fix infinite loading issue

  1. Remove all problematic RLS policies
  2. Create simple, non-recursive policies
  3. Ensure proper access control without infinite loops
*/

-- Disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile management for admin operations" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create trainer profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: All authenticated users can read profiles
CREATE POLICY "profiles_select_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "profiles_update_own_policy"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow insert for new users (handled by trigger)
CREATE POLICY "profiles_insert_policy"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Simple admin policy based on specific email
CREATE POLICY "profiles_admin_policy"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    -- Allow if it's the specific admin email
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

-- Ensure the admin user exists and has correct profile
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'jl.calmon@jlc-mercury.com';
    
    -- If admin user exists, ensure profile exists
    IF admin_user_id IS NOT NULL THEN
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
    END IF;
END $$;

-- Clean up storage policies that might cause issues
DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON storage.objects;

-- Create simpler storage policy
CREATE POLICY "profile_pictures_policy"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'profile-pictures')
  WITH CHECK (bucket_id = 'profile-pictures');