
export const API_CONFIG = {
  N8N: {
    BASE_URL: 'http://localhost:5678/api/v1',
    API_KEY: '',
    // Configuration par défaut pour les tests
    DEFAULT_SETTINGS: {
      timeout: 10000,
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
      // 1. Essayer Supabase d'abord
      const supabaseConfig = await this.getSupabaseConfig();
      if (supabaseConfig?.apiKey) {
        console.log('✅ Configuration n8n depuis Supabase');
        return supabaseConfig;
      }

      // 2. Fallback sur localStorage
      const localConfig = this.getLocalConfig();
      if (localConfig?.apiKey) {
        console.log('✅ Configuration n8n depuis localStorage');
        return localConfig;
      }

      // 3. Configuration par défaut (sans clé API)
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

  // Configuration depuis Supabase
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
        console.warn('⚠️ Aucun paramètre n8n trouvé:', error);
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
      console.warn('⚠️ Erreur config Supabase:', error);
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
      // Sauvegarder dans localStorage
      const localSettings = {
        n8n_api_key: config.apiKey,
        n8n_base_url: config.baseUrl || API_CONFIG.N8N.BASE_URL
      };
      localStorage.setItem('n8n_user_settings', JSON.stringify(localSettings));

      // Essayer de sauvegarder dans Supabase
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
        }
      } catch (supabaseError) {
        console.warn('⚠️ Impossible de sauvegarder dans Supabase:', supabaseError);
      }

      console.log('✅ Configuration n8n sauvegardée');
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
