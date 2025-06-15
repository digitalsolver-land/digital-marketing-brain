
-- Ajouter les colonnes n8n manquantes à la table app_settings
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS n8n_api_key text,
ADD COLUMN IF NOT EXISTS n8n_base_url text DEFAULT 'http://localhost:5678/api/v1';

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_app_settings_n8n ON app_settings(n8n_api_key) WHERE n8n_api_key IS NOT NULL;
