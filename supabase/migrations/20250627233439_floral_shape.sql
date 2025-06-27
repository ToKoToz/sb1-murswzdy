-- Grant SELECT permission on auth.users to anon role
-- This is required for RLS policies that reference auth.users table
GRANT SELECT ON auth.users TO anon;

-- Also grant to authenticated role to ensure complete access
GRANT SELECT ON auth.users TO authenticated;