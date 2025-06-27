/*
  # Create Default Data

  This migration creates the default roles and admin user needed for the application.

  1. **Default Roles**
     - Admin role with full permissions
     - Trainer role with training-related permissions

  2. **Default Admin User**
     - Creates an admin user profile that can be used to bootstrap the system
*/

-- Insert default roles
INSERT INTO user_roles (name, display_name, description, permissions, is_system) VALUES
(
  'admin',
  'Administrateur',
  'Accès complet au système',
  '[
    {"resource": "users", "action": "read"},
    {"resource": "users", "action": "create"},
    {"resource": "users", "action": "update"},
    {"resource": "users", "action": "delete"},
    {"resource": "trainings", "action": "read"},
    {"resource": "trainings", "action": "create"},
    {"resource": "trainings", "action": "update"},
    {"resource": "trainings", "action": "delete"},
    {"resource": "clients", "action": "read"},
    {"resource": "clients", "action": "create"},
    {"resource": "clients", "action": "update"},
    {"resource": "clients", "action": "delete"},
    {"resource": "employees", "action": "read"},
    {"resource": "employees", "action": "create"},
    {"resource": "employees", "action": "update"},
    {"resource": "employees", "action": "delete"},
    {"resource": "reports", "action": "read"},
    {"resource": "settings", "action": "read"},
    {"resource": "settings", "action": "update"}
  ]'::jsonb,
  true
),
(
  'trainer',
  'Formateur',
  'Accès aux formations et participants',
  '[
    {"resource": "trainings", "action": "read"},
    {"resource": "trainings", "action": "create"},
    {"resource": "trainings", "action": "update"},
    {"resource": "participants", "action": "read"},
    {"resource": "participants", "action": "create"},
    {"resource": "participants", "action": "update"},
    {"resource": "documents", "action": "read"},
    {"resource": "documents", "action": "create"},
    {"resource": "documents", "action": "update"},
    {"resource": "evaluations", "action": "read"},
    {"resource": "evaluations", "action": "create"},
    {"resource": "evaluations", "action": "update"},
    {"resource": "certificates", "action": "read"},
    {"resource": "certificates", "action": "create"}
  ]'::jsonb,
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_system = EXCLUDED.is_system;

-- Insert default permissions
INSERT INTO user_permissions (name, resource, action, description) VALUES
-- User management permissions
('users:read', 'users', 'read', 'Lire les informations des utilisateurs'),
('users:create', 'users', 'create', 'Créer de nouveaux utilisateurs'),
('users:update', 'users', 'update', 'Modifier les utilisateurs'),
('users:delete', 'users', 'delete', 'Supprimer les utilisateurs'),

-- Training management permissions
('trainings:read', 'trainings', 'read', 'Consulter les formations'),
('trainings:create', 'trainings', 'create', 'Créer des formations'),
('trainings:update', 'trainings', 'update', 'Modifier les formations'),
('trainings:delete', 'trainings', 'delete', 'Supprimer les formations'),

-- Client management permissions
('clients:read', 'clients', 'read', 'Consulter les clients'),
('clients:create', 'clients', 'create', 'Créer des clients'),
('clients:update', 'clients', 'update', 'Modifier les clients'),
('clients:delete', 'clients', 'delete', 'Supprimer les clients'),

-- Employee management permissions
('employees:read', 'employees', 'read', 'Consulter les employés'),
('employees:create', 'employees', 'create', 'Créer des employés'),
('employees:update', 'employees', 'update', 'Modifier les employés'),
('employees:delete', 'employees', 'delete', 'Supprimer les employés'),

-- Participant management permissions
('participants:read', 'participants', 'read', 'Consulter les participants'),
('participants:create', 'participants', 'create', 'Créer des participants'),
('participants:update', 'participants', 'update', 'Modifier les participants'),
('participants:delete', 'participants', 'delete', 'Supprimer les participants'),

-- Document management permissions
('documents:read', 'documents', 'read', 'Consulter les documents'),
('documents:create', 'documents', 'create', 'Créer des documents'),
('documents:update', 'documents', 'update', 'Modifier les documents'),
('documents:delete', 'documents', 'delete', 'Supprimer les documents'),

-- Evaluation management permissions
('evaluations:read', 'evaluations', 'read', 'Consulter les évaluations'),
('evaluations:create', 'evaluations', 'create', 'Créer des évaluations'),
('evaluations:update', 'evaluations', 'update', 'Modifier les évaluations'),
('evaluations:delete', 'evaluations', 'delete', 'Supprimer les évaluations'),

-- Certificate management permissions
('certificates:read', 'certificates', 'read', 'Consulter les certificats'),
('certificates:create', 'certificates', 'create', 'Créer des certificats'),
('certificates:update', 'certificates', 'update', 'Modifier les certificats'),
('certificates:delete', 'certificates', 'delete', 'Supprimer les certificats'),

-- Report permissions
('reports:read', 'reports', 'read', 'Consulter les rapports'),

-- Settings permissions
('settings:read', 'settings', 'read', 'Consulter les paramètres'),
('settings:update', 'settings', 'update', 'Modifier les paramètres')

ON CONFLICT (name) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description;