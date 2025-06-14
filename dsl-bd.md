
# Documentation de la Base de Données - Plateforme Marketing AI

## Architecture Générale

### Stack Technique
- **Frontend**: React.js + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **APIs**: n8n, OpenRouter AI, Google APIs, Social Media APIs
- **Authentification**: Supabase Auth (JWT)
- **Stockage**: Supabase Storage pour les fichiers
- **Cache**: Redis (intégré dans Supabase)

## Schéma de Base de Données

### 1. Authentification et Utilisateurs

#### Table: `users` (gérée par Supabase Auth)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'admin',
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Workflows n8n

#### Table: `workflows`
```sql
CREATE TABLE public.workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  n8n_workflow_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft', 'error')),
  workflow_data JSONB NOT NULL DEFAULT '{}',
  trigger_type TEXT,
  schedule TEXT,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_execution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table: `workflow_executions`
```sql
CREATE TABLE public.workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  n8n_execution_id TEXT,
  status TEXT CHECK (status IN ('success', 'error', 'cancelled', 'running')),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  execution_data JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Conversations IA

#### Table: `ai_conversations`
```sql
CREATE TABLE public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table: `ai_messages`
```sql
CREATE TABLE public.ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  actions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Génération de Contenu

#### Table: `content_templates`
```sql
CREATE TABLE public.content_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('blog', 'social', 'email', 'ad')),
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  seo_optimized BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table: `generated_content`
```sql
CREATE TABLE public.generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.content_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('blog', 'social', 'email', 'ad')),
  keywords JSONB DEFAULT '[]',
  seo_analysis JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Campagnes Marketing

#### Table: `campaigns`
```sql
CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('seo', 'sem', 'social', 'email', 'integrated')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  target_audience JSONB DEFAULT '{}',
  goals JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table: `campaign_performance`
```sql
CREATE TABLE public.campaign_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);
```

### 6. Analytics et Métriques

#### Table: `analytics_data`
```sql
CREATE TABLE public.analytics_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'google_analytics', 'search_console', 'facebook', etc.
  metric_type TEXT NOT NULL, -- 'traffic', 'conversions', 'engagement', etc.
  date DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source, metric_type, date)
);
```

#### Table: `seo_keywords`
```sql
CREATE TABLE public.seo_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  current_position INTEGER,
  previous_position INTEGER,
  search_volume INTEGER,
  difficulty INTEGER,
  url TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, keyword, date)
);
```

### 7. Concurrents

#### Table: `competitors`
```sql
CREATE TABLE public.competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table: `competitor_analysis`
```sql
CREATE TABLE public.competitor_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  analysis_date DATE DEFAULT CURRENT_DATE,
  seo_metrics JSONB DEFAULT '{}',
  content_metrics JSONB DEFAULT '{}',
  social_metrics JSONB DEFAULT '{}',
  traffic_estimate INTEGER,
  keyword_count INTEGER,
  backlink_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Réseaux Sociaux

#### Table: `social_accounts`
```sql
CREATE TABLE public.social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube')),
  account_name TEXT NOT NULL,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table: `social_posts`
```sql
CREATE TABLE public.social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  engagement_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. Intégrations APIs

#### Table: `api_integrations`
```sql
CREATE TABLE public.api_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- 'google_analytics', 'facebook_ads', etc.
  api_key TEXT,
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10. Système de Notifications

#### Table: `notifications`
```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS)

### Politique de Sécurité
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
-- ... pour toutes les autres tables

-- Politique pour les profils
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour les workflows
CREATE POLICY "Users can manage own workflows" ON public.workflows
  FOR ALL USING (auth.uid() = user_id);

-- Politique générale pour toutes les tables avec user_id
CREATE POLICY "Users can manage own data" ON public.{table_name}
  FOR ALL USING (auth.uid() = user_id);
```

## Indexes pour Performance

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_analytics_data_user_date ON public.analytics_data(user_id, date);
CREATE INDEX idx_seo_keywords_user_keyword ON public.seo_keywords(user_id, keyword);
CREATE INDEX idx_campaign_performance_campaign_date ON public.campaign_performance(campaign_id, date);
```

## Fonctions et Triggers

### Fonction de mise à jour automatique du timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur toutes les tables avec updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... répéter pour toutes les autres tables
```

### Fonction de calcul des métriques en temps réel
```sql
CREATE OR REPLACE FUNCTION calculate_campaign_metrics(campaign_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  metrics JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_impressions', COALESCE(SUM(impressions), 0),
    'total_clicks', COALESCE(SUM(clicks), 0),
    'total_conversions', COALESCE(SUM(conversions), 0),
    'total_cost', COALESCE(SUM(cost), 0),
    'avg_ctr', COALESCE(AVG(ctr), 0),
    'avg_cpc', COALESCE(AVG(cpc), 0),
    'total_roas', COALESCE(AVG(roas), 0)
  ) INTO metrics
  FROM public.campaign_performance
  WHERE campaign_id = campaign_uuid;
  
  RETURN metrics;
END;
$$ LANGUAGE plpgsql;
```

## Configuration Supabase

### Variables d'Environnement
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Edge Functions
Les Edge Functions Supabase seront utilisées pour :
1. **Synchronisation des données externes** (Google Analytics, Facebook, etc.)
2. **Traitement des webhooks** n8n
3. **Génération de rapports** automatisés
4. **Nettoyage des données** anciennes

### Storage Buckets
```sql
-- Bucket pour les fichiers utilisateur
INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-content', 'generated-content', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Politiques de storage
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Plan de Migration et Évolutivité

### Phase 1 - MVP
- Tables essentielles (users, workflows, ai_conversations)
- Intégration de base avec n8n et OpenRouter
- Dashboard simple

### Phase 2 - Fonctionnalités Avancées
- Système de campagnes complet
- Analytics détaillées
- Intégrations sociales

### Phase 3 - Intelligence Artificielle
- Recommandations automatiques
- Prédictions de performance
- Optimisation continue

### Monitoring et Observabilité
- Logs applicatifs via Supabase
- Métriques de performance
- Alertes en temps réel
- Backup automatique quotidien

Cette architecture garantit une scalabilité horizontale, une sécurité robuste et une performance optimale pour la plateforme Marketing AI.
