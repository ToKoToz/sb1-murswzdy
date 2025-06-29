/*
  # Create User Preferences Table
  
  This migration creates a table to store user preferences including UI settings,
  date/time formats, and accessibility options.
*/

-- Create user_preferences table if it doesn't already exist
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Theme preferences
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'fr',
  
  -- Format preferences
  date_format text DEFAULT 'DD/MM/YYYY',
  time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  
  -- Accessibility preferences
  larger_text boolean DEFAULT false,
  high_contrast boolean DEFAULT false,
  reduce_animations boolean DEFAULT false,
  
  -- Tracking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy allowing users to manage their own preferences
CREATE POLICY "users_can_manage_own_preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policy allowing admins to view all user preferences
CREATE POLICY "admins_can_view_all_user_preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically create preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the profiles table
CREATE TRIGGER create_user_preferences_for_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();

-- Create default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;