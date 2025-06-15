
export const API_CONFIG = {
  N8N: {
    BASE_URL: 'https://n8n.srv860213.hstgr.cloud/api/v1',
    API_KEY: '',
    // Configuration par défaut pour les tests
    DEFAULT_SETTINGS: {
      timeout: 15000,
      retries: 3,
      retryDelay: 1000
    }
  },
  OPENROUTER: {
    API_KEY: '',
    BASE_URL: 'https://openrouter.ai/api/v1'
  },
  POSTIZ: {
    API_URL: 'https://api.postiz.com/public/v1',
    API_KEY: ''
  }
};

// Interface pour la configuration n8n
export interface N8nConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Gestionnaire centralisé de configuration n8n
export class N8nConfigManager {
  private static instance: N8nConfigManager;
  
  public static getInstance(): N8nConfigManager {
    if (!N8nConfigManager.instance) {
      N8nConfigManager.instance = new N8nConfigManager();
    }
    return N8nConfigManager.instance;
  }

  // Récupérer la configuration effective depuis multiple sources
  async getEffectiveConfig(): Promise<N8nConfig> {
    try {
      console.log('🔍 Récupération configuration n8n...');
      
      // 1. Essayer d'abord les secrets Supabase via edge function
      const supabaseSecretsConfig = await this.getSupabaseSecretsConfig();
      if (supabaseSecretsConfig?.apiKey) {
        console.log('✅ Configuration n8n depuis secrets Supabase');
        return supabaseSecretsConfig;
      }

      // 2. Essayer Supabase database ensuite
      const supabaseConfig = await this.getSupabaseConfig();
      if (supabaseConfig?.apiKey) {
        console.log('✅ Configuration n8n depuis Supabase database');
        return supabaseConfig;
      }

      // 3. Fallback sur localStorage
      const localConfig = this.getLocalConfig();
      if (localConfig?.apiKey) {
        console.log('✅ Configuration n8n depuis localStorage');
        return localConfig;
      }

      // 4. Configuration par défaut (sans clé API)
      console.warn('⚠️ Aucune clé API n8n configurée');
      return {
        apiKey: '',
        baseUrl: API_CONFIG.N8N.BASE_URL,
        ...API_CONFIG.N8N.DEFAULT_SETTINGS
      };
    } catch (error) {
      console.error('❌ Erreur récupération config n8n:', error);
      return {
        apiKey: '',
        baseUrl: API_CONFIG.N8N.BASE_URL,
        ...API_CONFIG.N8N.DEFAULT_SETTINGS
      };
    }
  }

  // Configuration depuis les secrets Supabase (via edge function)
  private async getSupabaseSecretsConfig(): Promise<N8nConfig | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Utiliser une edge function simple pour récupérer les secrets
      const { data, error } = await supabase.functions.invoke('get-n8n-secrets');
      
      if (error || !data?.n8n_api_key) {
        console.log('ℹ️ Secrets Supabase non disponibles ou non configurés');
        return null;
      }
      
      return {
        apiKey: data.n8n_api_key,
        baseUrl: data.n8n_base_url || API_CONFIG.N8N.BASE_URL,
        ...API_CONFIG.N8N.DEFAULT_SETTINGS
      };
    } catch (error) {
      console.warn('⚠️ Erreur récupération secrets Supabase:', error);
      return null;
    }
  }

  // Configuration depuis Supabase database
  private async getSupabaseConfig(): Promise<N8nConfig | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('n8n_api_key, n8n_base_url')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.log('ℹ️ Aucun paramètre n8n trouvé en base:', error.message);
        return null;
      }
      
      if (settings?.n8n_api_key) {
        return {
          apiKey: settings.n8n_api_key,
          baseUrl: settings.n8n_base_url || API_CONFIG.N8N.BASE_URL,
          ...API_CONFIG.N8N.DEFAULT_SETTINGS
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur config Supabase database:', error);
    }
    return null;
  }

  // Configuration depuis localStorage
  private getLocalConfig(): N8nConfig | null {
    try {
      const userSettings = localStorage.getItem('n8n_user_settings');
      if (userSettings) {
        const settings = JSON.parse(userSettings);
        if (settings.n8n_api_key) {
          return {
            apiKey: settings.n8n_api_key,
            baseUrl: settings.n8n_base_url || API_CONFIG.N8N.BASE_URL,
            ...API_CONFIG.N8N.DEFAULT_SETTINGS
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur config localStorage:', error);
    }
    return null;
  }

  // Sauvegarder la configuration
  async saveConfig(config: Partial<N8nConfig>): Promise<void> {
    try {
      console.log('💾 Sauvegarde configuration n8n...');
      
      // Sauvegarder dans localStorage (toujours comme fallback)
      const localSettings = {
        n8n_api_key: config.apiKey,
        n8n_base_url: config.baseUrl || API_CONFIG.N8N.BASE_URL
      };
      localStorage.setItem('n8n_user_settings', JSON.stringify(localSettings));

      // Essayer de sauvegarder dans Supabase database
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && config.apiKey) {
          await supabase
            .from('app_settings')
            .upsert({
              user_id: user.id,
              n8n_api_key: config.apiKey,
              n8n_base_url: config.baseUrl || API_CONFIG.N8N.BASE_URL
            });
          console.log('✅ Configuration sauvegardée en base Supabase');
        }
      } catch (supabaseError) {
        console.warn('⚠️ Impossible de sauvegarder en base Supabase:', supabaseError);
      }

      console.log('✅ Configuration n8n sauvegardée (localStorage + Supabase si possible)');
    } catch (error) {
      console.error('❌ Erreur sauvegarde config:', error);
      throw new Error('Impossible de sauvegarder la configuration');
    }
  }

  // Valider la configuration
  validateConfig(config: N8nConfig): boolean {
    return !!(config.apiKey && config.baseUrl);
  }
}

// Instance singleton
export const n8nConfigManager = N8nConfigManager.getInstance();

// Export de la fonction pour compatibilité
export const getEffectiveN8nConfig = () => n8nConfigManager.getEffectiveConfig();
