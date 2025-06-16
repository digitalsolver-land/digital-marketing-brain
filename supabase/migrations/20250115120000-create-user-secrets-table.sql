
-- Créer la table user_secrets pour stocker les clés API de façon sécurisée
CREATE TABLE IF NOT EXISTS public.user_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  secret_name TEXT NOT NULL,
  secret_value TEXT NOT NULL,
  encrypted_value TEXT, -- Pour stockage chiffré futur
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, secret_name)
);

-- Activer RLS sur la table user_secrets
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_secrets
CREATE POLICY "Users can view own secrets" ON public.user_secrets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own secrets" ON public.user_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own secrets" ON public.user_secrets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own secrets" ON public.user_secrets
  FOR DELETE USING (auth.uid() = user_id);

-- Politique pour les admins
CREATE POLICY "Admins can manage all secrets" ON public.user_secrets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_secrets_user_id ON public.user_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_secrets_name ON public.user_secrets(user_id, secret_name);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_user_secrets_updated_at 
  BEFORE UPDATE ON public.user_secrets 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
