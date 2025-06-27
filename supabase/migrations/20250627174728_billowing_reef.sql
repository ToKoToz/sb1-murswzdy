/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - The existing policies for profiles table are causing infinite recursion
    - Policies are trying to query the profiles table from within profiles table policies
    
  2. Solution
    - Drop the problematic policies that cause recursion
    - Create new policies that don't reference the profiles table within profiles policies
    - Use a simpler approach for admin access using a function or direct auth checks
    
  3. Security
    - Maintain security by allowing users to read their own profiles
    - Allow authenticated users to read all profiles (as per original intent)
    - Allow users to update their own profiles
    - Create a separate approach for admin management
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create trainer profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies without recursion
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For admin operations, we'll use a different approach
-- Create a policy that allows insert/delete based on email domain or specific users
-- This is a temporary solution - in production you'd want a more sophisticated admin system
CREATE POLICY "Allow profile management for admin operations"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    -- Allow if user is updating their own profile
    auth.uid() = id
    OR
    -- Allow if user email contains admin indicator (adjust as needed)
    auth.email() LIKE '%admin%'
  )
  WITH CHECK (
    -- Same conditions for insert/update
    auth.uid() = id
    OR
    auth.email() LIKE '%admin%'
  );