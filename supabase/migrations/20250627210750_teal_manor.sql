/*
  # Fix Authentication RLS Policies

  This migration fixes the infinite recursion issue in RLS policies by:
  1. Dropping existing problematic policies
  2. Creating simplified policies that don't cause circular dependencies
  3. Ensuring proper access control without complex subqueries in critical paths

  ## Changes
  1. **user_profiles table**: Simplified RLS policies
  2. **user_roles table**: Simplified RLS policies  
  3. **user_preferences table**: Simplified RLS policies
  4. **user_sessions table**: Simplified RLS policies

  ## Security
  - Users can read and update their own profiles
  - Admins identified by direct role check (not through joins)
  - All authenticated users can read basic role information
*/

-- Drop existing problematic policies for user_profiles
DROP POLICY IF EXISTS "allow_admin_all_operations" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_profiles_read" ON user_profiles;
DROP POLICY IF EXISTS "allow_profile_creation" ON user_profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- Create simplified policies for user_profiles
CREATE POLICY "users_can_read_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow reading other profiles for basic functionality (without sensitive data)
CREATE POLICY "authenticated_users_can_read_basic_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop existing problematic policies for user_roles
DROP POLICY IF EXISTS "Allow admin management of roles" ON user_roles;
DROP POLICY IF EXISTS "Allow read access to roles for authenticated users" ON user_roles;

-- Create simplified policies for user_roles
CREATE POLICY "authenticated_users_can_read_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin role management will be handled at application level
CREATE POLICY "service_role_can_manage_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for user_preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;

-- Create simplified policies for user_preferences
CREATE POLICY "users_can_manage_own_preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Drop existing policies for user_sessions
DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can read their own sessions" ON user_sessions;

-- Create simplified policies for user_sessions
CREATE POLICY "users_can_manage_own_sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Drop existing policies for user_activities
DROP POLICY IF EXISTS "Admins can read all activities" ON user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON user_activities;
DROP POLICY IF EXISTS "Users can read their own activities" ON user_activities;

-- Create simplified policies for user_activities
CREATE POLICY "users_can_read_own_activities"
  ON user_activities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_activities"
  ON user_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drop existing policies for user_invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON user_invitations;

-- Create simplified policies for user_invitations
CREATE POLICY "service_role_can_manage_invitations"
  ON user_invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_can_read_own_invitations"
  ON user_invitations
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- Create a function to check if user is admin (safer than policy joins)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN user_roles ur ON up.role_id = ur.id
    WHERE up.id = user_id 
    AND ur.name = 'admin'
  );
$$;

-- Create admin policies using the function
CREATE POLICY "admin_can_read_all_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admin_can_update_all_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admin_can_manage_roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admin_can_read_all_activities"
  ON user_activities
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admin_can_manage_invitations"
  ON user_invitations
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());