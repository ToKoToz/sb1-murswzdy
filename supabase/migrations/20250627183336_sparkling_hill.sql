/*
  # Ajout de la gestion des clients et employés

  1. Nouvelles tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text) - Nom de l'entreprise cliente
      - `logo_url` (text) - URL du logo de l'entreprise
      - `description` (text) - Description optionnelle
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `employees`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `first_name` (text) - Prénom
      - `last_name` (text) - Nom
      - `email` (text) - Adresse email
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Création du bucket pour les logos des clients

  3. Sécurité
    - Politiques RLS pour la gestion des clients et employés
*/

-- Créer la table clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table clients
CREATE POLICY "allow_all_clients_read"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_clients_write"
  ON clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politiques pour la table employees
CREATE POLICY "allow_all_employees_read"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_employees_write"
  ON employees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Créer les triggers pour updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer le bucket pour les logos des clients
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques pour le storage des logos
CREATE POLICY "client_logos_policy"
  ON storage.objects
  FOR ALL
  TO authenticated, anon
  USING (bucket_id = 'client-logos')
  WITH CHECK (bucket_id = 'client-logos');