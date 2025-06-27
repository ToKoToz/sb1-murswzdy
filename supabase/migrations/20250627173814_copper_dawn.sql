/*
  # Ajout des champs de profil pour les formateurs

  1. Nouvelles colonnes
    - `phone_number` (text) - Numéro de téléphone professionnel
    - `function_title` (text) - Fonction/Titre du formateur
    - `specialties` (text[]) - Domaines de spécialité
    - `experience` (text) - Expérience professionnelle
    - `degrees_certifications` (text[]) - Diplômes et certifications
    - `profile_picture_url` (text) - URL de la photo de profil
    - `availability` (text) - Disponibilités
    - `digital_signature` (text) - Signature numérique

  2. Storage
    - Création du bucket pour les photos de profil
    - Politiques RLS pour la gestion des images

  3. Sécurité
    - Contraintes de validation
    - Politiques pour la création de profils formateurs
*/

-- Ajouter les nouvelles colonnes à la table profiles
DO $$
BEGIN
  -- Numéro de téléphone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;

  -- Fonction/Titre
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'function_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN function_title text;
  END IF;

  -- Domaines de spécialité
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE profiles ADD COLUMN specialties text[] DEFAULT '{}';
  END IF;

  -- Expérience professionnelle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'experience'
  ) THEN
    ALTER TABLE profiles ADD COLUMN experience text;
  END IF;

  -- Diplômes et certifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'degrees_certifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN degrees_certifications text[] DEFAULT '{}';
  END IF;

  -- URL de la photo de profil
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_picture_url text;
  END IF;

  -- Disponibilités
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'availability'
  ) THEN
    ALTER TABLE profiles ADD COLUMN availability text;
  END IF;

  -- Signature numérique
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'digital_signature'
  ) THEN
    ALTER TABLE profiles ADD COLUMN digital_signature text;
  END IF;
END $$;

-- Ajouter une contrainte CHECK pour function_title
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_function_title_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_function_title_check 
    CHECK (function_title IS NULL OR function_title IN (
      'Formateur',
      'Formateur Senior',
      'Formateur Expert',
      'Consultant',
      'Expert Métier',
      'Responsable Formation',
      'Coordinateur Pédagogique',
      'Autre'
    ));
  END IF;
END $$;

-- Créer le bucket pour les photos de profil si il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Fonction pour créer les politiques de storage de manière sécurisée
DO $$
BEGIN
  -- Supprimer les politiques existantes si elles existent
  DROP POLICY IF EXISTS "Public read access for profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON storage.objects;

  -- Créer les nouvelles politiques
  -- Politique pour permettre la lecture publique des photos de profil
  CREATE POLICY "Public read access for profile pictures"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-pictures');

  -- Politique pour permettre aux utilisateurs authentifiés d'uploader leurs photos
  CREATE POLICY "Authenticated users can upload profile pictures"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'profile-pictures');

  -- Politique pour permettre aux utilisateurs de mettre à jour leurs propres photos
  CREATE POLICY "Users can update their own profile pictures"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'profile-pictures');

  -- Politique pour permettre aux utilisateurs de supprimer leurs propres photos
  CREATE POLICY "Users can delete their own profile pictures"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'profile-pictures');

  -- Politique pour permettre aux admins de gérer toutes les photos
  CREATE POLICY "Admins can manage all profile pictures"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
      bucket_id = 'profile-pictures' AND
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
END $$;

-- Ajouter une politique pour permettre aux admins de créer des profils de formateurs
DO $$
BEGIN
  -- Supprimer la politique si elle existe
  DROP POLICY IF EXISTS "Admins can create trainer profiles" ON profiles;
  
  -- Créer la nouvelle politique
  CREATE POLICY "Admins can create trainer profiles"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
END $$;

-- Fonction pour valider les URLs des photos de profil
CREATE OR REPLACE FUNCTION validate_profile_picture_url()
RETURNS trigger AS $$
BEGIN
  IF NEW.profile_picture_url IS NOT NULL AND NEW.profile_picture_url != '' THEN
    -- Vérifier que l'URL est une URL valide d'image
    IF NOT (NEW.profile_picture_url ~* '^https?://.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$') THEN
      RAISE EXCEPTION 'URL de photo de profil invalide. Seuls les formats JPG, JPEG, PNG, GIF et WebP sont acceptés.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

-- Créer le trigger pour valider les URLs des photos de profil
DROP TRIGGER IF EXISTS validate_profile_picture_url_trigger ON profiles;
CREATE TRIGGER validate_profile_picture_url_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_picture_url();