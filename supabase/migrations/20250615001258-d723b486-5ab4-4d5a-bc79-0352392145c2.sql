
-- Mettre à jour l'enum des rôles pour inclure commercial et client
ALTER TYPE public.app_role ADD VALUE 'commercial';
ALTER TYPE public.app_role ADD VALUE 'client';

-- Créer une table pour les paramètres de l'application
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  n8n_api_key TEXT,
  openrouter_api_key TEXT,
  google_analytics_api TEXT,
  google_search_console_api TEXT,
  google_ads_api TEXT,
  facebook_api TEXT,
  twitter_api TEXT,
  linkedin_api TEXT,
  instagram_api TEXT,
  default_language TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Europe/Paris',
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  auto_backup BOOLEAN DEFAULT true,
  backup_frequency TEXT DEFAULT 'daily',
  max_workflows INTEGER DEFAULT 50,
  data_retention_days INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Activer RLS sur la table des paramètres
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour les paramètres
CREATE POLICY "Users can view own settings" ON public.app_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.app_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.app_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all settings" ON public.app_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Mettre à jour les politiques pour permettre aux admins de gérer tous les rôles
CREATE POLICY "Admins can insert user roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles" ON public.user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
