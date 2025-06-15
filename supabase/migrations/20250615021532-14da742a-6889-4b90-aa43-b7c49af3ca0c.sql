
-- Ajouter la colonne openrouter_api_key à la table app_settings si elle n'existe pas déjà
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS openrouter_api_key text;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- Activer RLS sur la table app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent pour éviter les conflits
DROP POLICY IF EXISTS "Users can view their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON app_settings;

-- Créer les nouvelles politiques RLS
CREATE POLICY "Users can view their own settings" 
  ON app_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
  ON app_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON app_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);
