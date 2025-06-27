/*
  # Fix admin policies for trainer management

  1. Problem
    - Admin users cannot create trainers due to RLS policies
    - Need to allow admin users to perform all operations on profiles
    
  2. Solution
    - Add specific policy for admin operations
    - Allow admins to create, read, update, delete trainer profiles
    
  3. Security
    - Maintain security by checking user role in auth.users metadata
    - Only allow operations for users with admin role
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "allow_own_profile_write" ON profiles;

-- Create comprehensive admin policy
CREATE POLICY "allow_admin_all_operations"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    -- Allow if it's the user's own profile
    auth.uid() = id
    OR
    -- Allow if the user is an admin (check in auth.users metadata)
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'jl.calmon@jlc-mercury.com'
        OR 
        (auth.users.raw_user_meta_data->>'role') = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Same conditions for insert/update
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'jl.calmon@jlc-mercury.com'
        OR 
        (auth.users.raw_user_meta_data->>'role') = 'admin'
      )
    )
  );

-- Create a specific policy for profile creation
CREATE POLICY "allow_profile_creation"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile
    auth.uid() = id
    OR
    -- Allow admins to create profiles for others
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'jl.calmon@jlc-mercury.com'
        OR 
        (auth.users.raw_user_meta_data->>'role') = 'admin'
      )
    )
  );

-- Ensure the admin user has the correct metadata
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'jl.calmon@jlc-mercury.com';

-- Update the profile to ensure it has admin role
UPDATE profiles 
SET role = 'admin'
WHERE email = 'jl.calmon@jlc-mercury.com';