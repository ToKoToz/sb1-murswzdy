/*
  # Enhanced Training Management Schema

  1. Amélioration de la table trainings
    - Informations pédagogiques complètes
    - Gestion logistique avancée
    - Informations financières
    - Suivi et évaluation
    - Documents et certifications
    - Configuration flexible

  2. Nouvelles tables associées
    - `training_sessions` - Sessions multiples par formation
    - `training_documents` - Documents associés
    - `training_evaluations` - Évaluations et feedback
    - `training_certifications` - Certifications délivrées

  3. Sécurité et triggers
    - RLS sur toutes les nouvelles tables
    - Triggers pour timestamps automatiques
    - Validation des données
*/

-- Amélioration de la table trainings existante
DO $$
BEGIN
  -- Informations pédagogiques
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'objectives') THEN
    ALTER TABLE trainings ADD COLUMN objectives text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'program_content') THEN
    ALTER TABLE trainings ADD COLUMN program_content jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'prerequisites') THEN
    ALTER TABLE trainings ADD COLUMN prerequisites text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'target_audience') THEN
    ALTER TABLE trainings ADD COLUMN target_audience text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'training_methods') THEN
    ALTER TABLE trainings ADD COLUMN training_methods text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'skill_level') THEN
    ALTER TABLE trainings ADD COLUMN skill_level text CHECK (skill_level IN ('débutant', 'intermédiaire', 'avancé', 'expert'));
  END IF;

  -- Informations logistiques
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'training_type') THEN
    ALTER TABLE trainings ADD COLUMN training_type text CHECK (training_type IN ('présentiel', 'distanciel', 'hybride', 'e-learning'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'max_participants') THEN
    ALTER TABLE trainings ADD COLUMN max_participants integer DEFAULT 20;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'room_requirements') THEN
    ALTER TABLE trainings ADD COLUMN room_requirements text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'equipment_needed') THEN
    ALTER TABLE trainings ADD COLUMN equipment_needed text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'meeting_link') THEN
    ALTER TABLE trainings ADD COLUMN meeting_link text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'access_code') THEN
    ALTER TABLE trainings ADD COLUMN access_code text;
  END IF;

  -- Informations financières
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'price_per_participant') THEN
    ALTER TABLE trainings ADD COLUMN price_per_participant decimal(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'total_budget') THEN
    ALTER TABLE trainings ADD COLUMN total_budget decimal(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'payment_terms') THEN
    ALTER TABLE trainings ADD COLUMN payment_terms text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'invoice_reference') THEN
    ALTER TABLE trainings ADD COLUMN invoice_reference text;
  END IF;

  -- Informations de contact et organisation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'organizer_name') THEN
    ALTER TABLE trainings ADD COLUMN organizer_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'organizer_email') THEN
    ALTER TABLE trainings ADD COLUMN organizer_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'organizer_phone') THEN
    ALTER TABLE trainings ADD COLUMN organizer_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'contact_person') THEN
    ALTER TABLE trainings ADD COLUMN contact_person text;
  END IF;

  -- Suivi et évaluation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'evaluation_method') THEN
    ALTER TABLE trainings ADD COLUMN evaluation_method text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'certification_type') THEN
    ALTER TABLE trainings ADD COLUMN certification_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'certificate_template') THEN
    ALTER TABLE trainings ADD COLUMN certificate_template text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'attendance_required') THEN
    ALTER TABLE trainings ADD COLUMN attendance_required decimal(3,1) DEFAULT 80.0;
  END IF;

  -- Métadonnées
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'internal_notes') THEN
    ALTER TABLE trainings ADD COLUMN internal_notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'tags') THEN
    ALTER TABLE trainings ADD COLUMN tags text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'category') THEN
    ALTER TABLE trainings ADD COLUMN category text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'language') THEN
    ALTER TABLE trainings ADD COLUMN language text DEFAULT 'français';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'timezone') THEN
    ALTER TABLE trainings ADD COLUMN timezone text DEFAULT 'Europe/Paris';
  END IF;
END $$;

-- Créer la table des sessions de formation (pour les formations multi-sessions)
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
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

-- Créer la table des documents associés aux formations
CREATE TABLE IF NOT EXISTS training_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text CHECK (document_type IN ('support_cours', 'exercice', 'evaluation', 'attestation', 'manuel', 'ressource', 'autre')),
  file_url text,
  file_size integer,
  mime_type text,
  description text,
  is_public boolean DEFAULT false,
  access_level text DEFAULT 'participants' CHECK (access_level IN ('public', 'participants', 'trainers', 'admins')),
  download_count integer DEFAULT 0,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table des évaluations de formation
CREATE TABLE IF NOT EXISTS training_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  evaluation_type text CHECK (evaluation_type IN ('pre_formation', 'post_formation', 'satisfaction', 'competences', 'quiz', 'examen')),
  questions jsonb,
  responses jsonb,
  score decimal(5,2),
  max_score decimal(5,2),
  percentage decimal(5,2),
  passed boolean,
  feedback text,
  evaluator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  evaluation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table des certifications délivrées
CREATE TABLE IF NOT EXISTS training_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES trainings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  certificate_type text,
  skills_acquired text[],
  validation_date timestamptz DEFAULT now(),
  expiry_date timestamptz,
  certificate_url text,
  qr_code_data text,
  is_valid boolean DEFAULT true,
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verification_code text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour training_sessions
CREATE POLICY "allow_all_training_sessions_read"
  ON training_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_training_sessions_write"
  ON training_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques RLS pour training_documents
CREATE POLICY "allow_all_training_documents_read"
  ON training_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_public_training_documents_read"
  ON training_documents FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "allow_all_training_documents_write"
  ON training_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques RLS pour training_evaluations
CREATE POLICY "allow_all_training_evaluations_read"
  ON training_evaluations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_training_evaluations_write"
  ON training_evaluations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques RLS pour training_certifications
CREATE POLICY "allow_all_training_certifications_read"
  ON training_certifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_public_training_certifications_verification"
  ON training_certifications FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_all_training_certifications_write"
  ON training_certifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Créer les triggers pour updated_at
CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_documents_updated_at
  BEFORE UPDATE ON training_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_evaluations_updated_at
  BEFORE UPDATE ON training_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_certifications_updated_at
  BEFORE UPDATE ON training_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_training_sessions_training_id ON training_sessions(training_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_training_documents_training_id ON training_documents(training_id);
CREATE INDEX IF NOT EXISTS idx_training_documents_type ON training_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_training_evaluations_training_id ON training_evaluations(training_id);
CREATE INDEX IF NOT EXISTS idx_training_evaluations_participant_id ON training_evaluations(participant_id);
CREATE INDEX IF NOT EXISTS idx_training_certifications_training_id ON training_certifications(training_id);
CREATE INDEX IF NOT EXISTS idx_training_certifications_participant_id ON training_certifications(participant_id);
CREATE INDEX IF NOT EXISTS idx_training_certifications_number ON training_certifications(certificate_number);

-- Créer le bucket pour les documents de formation
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-documents', 'training-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Créer le bucket pour les certificats
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-certificates', 'training-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage pour les documents de formation
CREATE POLICY "allow_authenticated_upload_training_documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'training-documents');

CREATE POLICY "allow_authenticated_read_training_documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'training-documents');

CREATE POLICY "allow_authenticated_update_training_documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'training-documents');

CREATE POLICY "allow_authenticated_delete_training_documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'training-documents');

-- Politiques de stockage pour les certificats
CREATE POLICY "allow_authenticated_upload_training_certificates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'training-certificates');

CREATE POLICY "allow_public_read_training_certificates"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'training-certificates');

CREATE POLICY "allow_authenticated_update_training_certificates"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'training-certificates');

CREATE POLICY "allow_authenticated_delete_training_certificates"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'training-certificates');

-- Fonction pour générer un numéro de certificat unique
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS text AS $$
DECLARE
  cert_number text;
  year_suffix text;
BEGIN
  year_suffix := EXTRACT(YEAR FROM now())::text;
  cert_number := 'CERT-' || year_suffix || '-' || LPAD(nextval('certificate_sequence')::text, 6, '0');
  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Créer la séquence pour les numéros de certificat
CREATE SEQUENCE IF NOT EXISTS certificate_sequence START 1000;

-- Fonction pour valider les URLs de documents
CREATE OR REPLACE FUNCTION validate_document_url()
RETURNS trigger AS $$
BEGIN
  IF NEW.file_url IS NOT NULL AND NEW.file_url != '' THEN
    -- Vérifier que l'URL est valide
    IF NOT (NEW.file_url ~* '^https?://.*' OR NEW.file_url ~* '^/.*') THEN
      RAISE EXCEPTION 'URL de document invalide';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour valider les URLs de documents
CREATE TRIGGER validate_document_url_trigger
  BEFORE INSERT OR UPDATE ON training_documents
  FOR EACH ROW
  EXECUTE FUNCTION validate_document_url();

-- Fonction pour générer automatiquement le numéro de certificat
CREATE OR REPLACE FUNCTION auto_generate_certificate_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.certificate_number IS NULL OR NEW.certificate_number = '' THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour générer automatiquement les numéros de certificat
CREATE TRIGGER auto_generate_certificate_number_trigger
  BEFORE INSERT ON training_certifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_certificate_number();

-- Ajouter des contraintes pour assurer l'intégrité des données
ALTER TABLE training_sessions ADD CONSTRAINT check_session_time 
  CHECK (end_time > start_time);

ALTER TABLE training_evaluations ADD CONSTRAINT check_score_range 
  CHECK (score >= 0 AND score <= max_score);

ALTER TABLE training_evaluations ADD CONSTRAINT check_percentage_range 
  CHECK (percentage >= 0 AND percentage <= 100);

-- Créer des vues pour simplifier les requêtes complexes
CREATE OR REPLACE VIEW training_overview AS
SELECT 
  t.*,
  COUNT(DISTINCT p.id) as total_participants,
  COUNT(DISTINCT CASE WHEN p.has_signed THEN p.id END) as signed_participants,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(DISTINCT c.id) as total_certificates,
  AVG(e.score) as average_score
FROM trainings t
LEFT JOIN participants p ON t.id = p.training_id
LEFT JOIN training_sessions s ON t.id = s.training_id
LEFT JOIN training_documents d ON t.id = d.training_id
LEFT JOIN training_certifications c ON t.id = c.training_id
LEFT JOIN training_evaluations e ON t.id = e.training_id AND e.evaluation_type = 'post_formation'
GROUP BY t.id;

-- Accorder les permissions sur la vue
GRANT SELECT ON training_overview TO authenticated, anon;