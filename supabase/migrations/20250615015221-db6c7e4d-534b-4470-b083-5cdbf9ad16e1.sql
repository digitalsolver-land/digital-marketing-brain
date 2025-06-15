
-- Ajouter les colonnes Postiz à la table app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS postiz_api_key text,
ADD COLUMN IF NOT EXISTS postiz_api_url text DEFAULT 'https://api.postiz.com/public/v1';

-- Ajouter les colonnes WhatsApp manquantes aussi
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS whatsapp_api_token text,
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id text,
ADD COLUMN IF NOT EXISTS whatsapp_verify_token text,
ADD COLUMN IF NOT EXISTS whatsapp_ai_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_ai_instructions text DEFAULT 'Tu es un assistant professionnel qui répond aux questions des clients de manière courtoise et utile.',
ADD COLUMN IF NOT EXISTS whatsapp_response_mode text DEFAULT 'auto';
