-- Add the session_presence column to the participants table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participants' AND column_name = 'session_presence'
  ) THEN
    -- Add the column with a check constraint for allowed values
    ALTER TABLE participants ADD COLUMN session_presence text;
    
    -- Add constraint to validate values
    ALTER TABLE participants ADD CONSTRAINT participants_session_presence_check
      CHECK (session_presence IS NULL OR session_presence IN ('matin', 'apresmidi', 'journee'));
  END IF;
END $$;

-- Comment on the column to explain its purpose
COMMENT ON COLUMN participants.session_presence IS 'Tracks which session the participant attended: morning, afternoon, or full day';

-- Update existing participants to have a default value
UPDATE participants
SET session_presence = CASE
  WHEN has_signed = true THEN 'journee'
  ELSE NULL
END
WHERE session_presence IS NULL;

-- Create an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_participants_session_presence ON participants(session_presence);