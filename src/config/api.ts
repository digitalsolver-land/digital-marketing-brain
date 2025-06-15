
export const API_CONFIG = {
  N8N: {
    BASE_URL: import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/api/v1',
    API_KEY: import.meta.env.VITE_N8N_API_KEY || '',
    // Fallback pour les clés stockées dans les paramètres utilisateur
    get EFFECTIVE_API_KEY() {
      // Récupérer depuis les paramètres utilisateur si disponible
      const userSettings = localStorage.getItem('n8n_user_settings');
      if (userSettings) {
        try {
          const settings = JSON.parse(userSettings);
          return settings.n8n_api_key || this.API_KEY;
        } catch (error) {
          console.warn('Erreur lecture paramètres n8n:', error);
        }
      }
      return this.API_KEY;
    }
  },
  OPENROUTER: {
    API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY || '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',
    BASE_URL: 'https://openrouter.ai/api/v1'
  },
  POSTIZ: {
    API_URL: import.meta.env.VITE_POSTIZ_API_URL || 'https://api.postiz.com/public/v1',
    API_KEY: import.meta.env.VITE_POSTIZ_API_KEY || ''
  }
};

// Fonction pour mettre à jour les clés API depuis les paramètres utilisateur
export const updateN8nConfig = (apiKey: string, baseUrl?: string) => {
  const settings = {
    n8n_api_key: apiKey,
    n8n_base_url: baseUrl || API_CONFIG.N8N.BASE_URL
  };
  
  localStorage.setItem('n8n_user_settings', JSON.stringify(settings));
  console.log('✅ Configuration n8n mise à jour');
};

// Fonction pour récupérer la configuration effective
export const getEffectiveN8nConfig = () => {
  const userSettings = localStorage.getItem('n8n_user_settings');
  
  if (userSettings) {
    try {
      const settings = JSON.parse(userSettings);
      return {
        apiKey: settings.n8n_api_key || API_CONFIG.N8N.API_KEY,
        baseUrl: settings.n8n_base_url || API_CONFIG.N8N.BASE_URL
      };
    } catch (error) {
      console.warn('Erreur lecture paramètres n8n:', error);
    }
  }
  
  return {
    apiKey: API_CONFIG.N8N.API_KEY,
    baseUrl: API_CONFIG.N8N.BASE_URL
  };
};
