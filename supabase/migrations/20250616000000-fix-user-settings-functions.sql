
-- Fonction pour récupérer ou créer les paramètres utilisateur
CREATE OR REPLACE FUNCTION public.get_or_create_user_settings(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  n8n_api_key TEXT,
  openrouter_api_key TEXT,
  google_analytics_api TEXT,
  google_search_console_api TEXT,
  google_ads_api TEXT,
  facebook_api TEXT,
  twitter_api TEXT,
  linkedin_api TEXT,
  instagram_api TEXT,
  default_language TEXT,
  timezone TEXT,
  email_notifications BOOLEAN,
  sms_notifications BOOLEAN,
  auto_backup BOOLEAN,
  backup_frequency TEXT,
  max_workflows INTEGER,
  data_retention_days INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  postiz_api_key TEXT,
  postiz_api_url TEXT,
  whatsapp_api_token TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_verify_token TEXT,
  whatsapp_ai_enabled BOOLEAN,
  whatsapp_ai_instructions TEXT,
  whatsapp_response_mode TEXT,
  n8n_base_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings_record RECORD;
BEGIN
  -- Essayer de récupérer les paramètres existants
  SELECT * FROM public.user_secrets 
  WHERE user_secrets.user_id = p_user_id 
  INTO settings_record;
  
  -- Si aucun paramètre n'existe, en créer un nouveau
  IF settings_record IS NULL THEN
    INSERT INTO public.user_secrets (
      user_id,
      default_language,
      timezone,
      email_notifications,
      sms_notifications,
      auto_backup,
      backup_frequency,
      max_workflows,
      data_retention_days,
      whatsapp_ai_enabled,
      whatsapp_response_mode
    ) VALUES (
      p_user_id,
      'fr',
      'Europe/Paris',
      true,
      false,
      true,
      'daily',
      50,
      30,
      false,
      'manual'
    )
    RETURNING * INTO settings_record;
  END IF;
  
  -- Retourner les paramètres
  RETURN QUERY
  SELECT 
    settings_record.id,
    settings_record.user_id,
    settings_record.n8n_api_key,
    settings_record.openrouter_api_key,
    settings_record.google_analytics_api,
    settings_record.google_search_console_api,
    settings_record.google_ads_api,
    settings_record.facebook_api,
    settings_record.twitter_api,
    settings_record.linkedin_api,
    settings_record.instagram_api,
    settings_record.default_language,
    settings_record.timezone,
    settings_record.email_notifications,
    settings_record.sms_notifications,
    settings_record.auto_backup,
    settings_record.backup_frequency,
    settings_record.max_workflows,
    settings_record.data_retention_days,
    settings_record.created_at,
    settings_record.updated_at,
    settings_record.postiz_api_key,
    settings_record.postiz_api_url,
    settings_record.whatsapp_api_token,
    settings_record.whatsapp_phone_number_id,
    settings_record.whatsapp_verify_token,
    settings_record.whatsapp_ai_enabled,
    settings_record.whatsapp_ai_instructions,
    settings_record.whatsapp_response_mode,
    settings_record.n8n_base_url;
END;
$$;

-- Fonction pour créer la table app_settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);

-- Fonction pour gérer les paramètres de l'application
CREATE OR REPLACE FUNCTION public.get_app_setting(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT app_settings.setting_value 
  FROM public.app_settings 
  WHERE app_settings.setting_key = p_key
  INTO setting_value;
  
  RETURN COALESCE(setting_value, '{}'::jsonb);
END;
$$;

-- Fonction pour définir un paramètre d'application
CREATE OR REPLACE FUNCTION public.set_app_setting(p_key TEXT, p_value JSONB, p_description TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.app_settings (setting_key, setting_value, description)
  VALUES (p_key, p_value, p_description)
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = p_value,
    description = COALESCE(p_description, app_settings.description),
    updated_at = now();
END;
$$;

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour app_settings (lecture publique pour les paramètres publics)
CREATE POLICY "Public settings are readable by everyone" ON public.app_settings
  FOR SELECT USING (is_public = true);

-- Politique RLS pour les administrateurs
CREATE POLICY "Admins can manage all settings" ON public.app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      JOIN public.roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );
