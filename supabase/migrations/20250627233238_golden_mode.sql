/*
  # Fix missing database tables and permissions

  1. New Tables
    - `training_sessions` - Individual sessions within a training program
    - `training_documents` - Documents and materials for trainings  
    - `training_evaluations` - Participant evaluations and assessments
    - `training_certifications` - Certificates issued to participants

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their related data

  3. Indexes
    - Add performance indexes for common queries
*/

-- Create training_sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  session_number integer NOT NULL DEFAULT 1,
  session_title text,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  trainer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  trainer_name text,
  session_objectives text[],
  session_content jsonb,
  materials_needed text[],
  homework_assigned text,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training_documents table
CREATE TABLE IF NOT EXISTS training_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text DEFAULT 'autre' CHECK (document_type IN ('support_cours', 'exercice', 'evaluation', 'attestation', 'manuel', 'ressource', 'autre')),
  file_url text,
  file_size bigint,
  mime_type text,
  description text,
  is_public boolean DEFAULT false,
  access_level text DEFAULT 'participants' CHECK (access_level IN ('public', 'participants', 'trainers', 'admins')),
  download_count integer DEFAULT 0,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training_evaluations table
CREATE TABLE IF NOT EXISTS training_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  evaluation_type text DEFAULT 'satisfaction' CHECK (evaluation_type IN ('pre_formation', 'post_formation', 'satisfaction', 'competences', 'quiz', 'examen')),
  questions jsonb,
  responses jsonb,
  score numeric(5,2),
  max_score numeric(5,2),
  percentage numeric(5,2),
  passed boolean,
  feedback text,
  evaluator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  evaluation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training_certifications table
CREATE TABLE IF NOT EXISTS training_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL DEFAULT ('CERT-' || extract(year from now()) || '-' || lpad(floor(random() * 999999)::text, 6, '0')),
  certificate_type text,
  skills_acquired text[],
  validation_date timestamptz DEFAULT now(),
  expiry_date timestamptz,
  certificate_url text,
  qr_code_data text,
  is_valid boolean DEFAULT true,
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verification_code text DEFAULT (upper(substr(md5(random()::text), 1, 8))),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certifications ENABLE ROW LEVEL SECURITY;

-- Training Sessions Policies
CREATE POLICY "authenticated_users_can_read_training_sessions"
  ON training_sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "trainers_can_manage_their_sessions"
  ON training_sessions
  FOR ALL
  TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "admin_can_manage_all_sessions"
  ON training_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Training Documents Policies
CREATE POLICY "authenticated_users_can_read_public_documents"
  ON training_documents
  FOR SELECT
  TO authenticated
  USING (is_public = true OR access_level = 'public');

CREATE POLICY "trainers_can_manage_training_documents"
  ON training_documents
  FOR ALL
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = training_documents.training_id 
      AND trainings.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = training_documents.training_id 
      AND trainings.trainer_id = auth.uid()
    )
  );

CREATE POLICY "admin_can_manage_all_documents"
  ON training_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Training Evaluations Policies
CREATE POLICY "authenticated_users_can_read_evaluations"
  ON training_evaluations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "trainers_can_manage_training_evaluations"
  ON training_evaluations
  FOR ALL
  TO authenticated
  USING (
    evaluator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = training_evaluations.training_id 
      AND trainings.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    evaluator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = training_evaluations.training_id 
      AND trainings.trainer_id = auth.uid()
    )
  );

CREATE POLICY "admin_can_manage_all_evaluations"
  ON training_evaluations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Training Certifications Policies
CREATE POLICY "authenticated_users_can_read_certifications"
  ON training_certifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "trainers_can_manage_training_certifications"
  ON training_certifications
  FOR ALL
  TO authenticated
  USING (
    issued_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = training_certifications.training_id 
      AND trainings.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    issued_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = training_certifications.training_id 
      AND trainings.trainer_id = auth.uid()
    )
  );

CREATE POLICY "admin_can_manage_all_certifications"
  ON training_certifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_training_id ON training_sessions(training_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);

CREATE INDEX IF NOT EXISTS idx_training_documents_training_id ON training_documents(training_id);
CREATE INDEX IF NOT EXISTS idx_training_documents_uploaded_by ON training_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_training_documents_type ON training_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_training_evaluations_training_id ON training_evaluations(training_id);
CREATE INDEX IF NOT EXISTS idx_training_evaluations_participant_id ON training_evaluations(participant_id);
CREATE INDEX IF NOT EXISTS idx_training_evaluations_evaluator_id ON training_evaluations(evaluator_id);

CREATE INDEX IF NOT EXISTS idx_training_certifications_training_id ON training_certifications(training_id);
CREATE INDEX IF NOT EXISTS idx_training_certifications_participant_id ON training_certifications(participant_id);
CREATE INDEX IF NOT EXISTS idx_training_certifications_issued_by ON training_certifications(issued_by);
CREATE INDEX IF NOT EXISTS idx_training_certifications_number ON training_certifications(certificate_number);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_training_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_training_sessions_updated_at
      BEFORE UPDATE ON training_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_training_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_training_documents_updated_at
      BEFORE UPDATE ON training_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_training_evaluations_updated_at'
  ) THEN
    CREATE TRIGGER update_training_evaluations_updated_at
      BEFORE UPDATE ON training_evaluations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_training_certifications_updated_at'
  ) THEN
    CREATE TRIGGER update_training_certifications_updated_at
      BEFORE UPDATE ON training_certifications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;