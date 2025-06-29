/*
  # Add signature_data column to participants table
  
  1. Problem
    - Currently, the application only stores a flag indicating if a participant has signed,
      but not the actual signature data

  2. Solution
    - Add a signature_data column to store the participant's signature as a base64 image
    - Use TEXT type since signatures will be stored as base64 strings
    - Make the column nullable for backward compatibility
*/

-- Add the signature_data column to the participants table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participants' AND column_name = 'signature_data'
  ) THEN
    ALTER TABLE participants ADD COLUMN signature_data text;
  END IF;
END $$;

-- Comment on the column to explain its purpose
COMMENT ON COLUMN participants.signature_data IS 'Base64-encoded image data of the participant''s signature';

-- Create an index to improve query performance when fetching signatures
CREATE INDEX IF NOT EXISTS idx_participants_has_signed ON participants(has_signed);