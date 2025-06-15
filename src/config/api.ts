
// Configuration des APIs et clés
export const API_CONFIG = {
  N8N: {
    BASE_URL: 'https://n8n.io/api/v1',
    API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YzUxM2U4Yi1lZmVjLTQyZWEtOGE2NS05ZGNkMjA3NDBhMTQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ5NTE2MzEzLCJleHAiOjE3NTcyODI0MDB9.u8uPwxckTxV6RqE66YcSUYFY4WZtHIYTQpC_vQiPk0Y'
  },
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1',
    API_KEY: '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'
  },
  WHATSAPP: {
    BASE_URL: 'https://graph.facebook.com/v18.0',
    API_TOKEN: import.meta.env.VITE_WHATSAPP_API_TOKEN || '',
    PHONE_NUMBER_ID: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '',
    VERIFY_TOKEN: import.meta.env.VITE_WHATSAPP_VERIFY_TOKEN || ''
  },
  GOOGLE: {
    ANALYTICS_API: import.meta.env.VITE_GOOGLE_ANALYTICS_API || '',
    SEARCH_CONSOLE_API: import.meta.env.VITE_GOOGLE_SEARCH_CONSOLE_API || '',
    ADS_API: import.meta.env.VITE_GOOGLE_ADS_API || ''
  },
  SOCIAL: {
    FACEBOOK_API: import.meta.env.VITE_FACEBOOK_API || '',
    TWITTER_API: import.meta.env.VITE_TWITTER_API || '',
    LINKEDIN_API: import.meta.env.VITE_LINKEDIN_API || '',
    INSTAGRAM_API: import.meta.env.VITE_INSTAGRAM_API || ''
  }
};

export const ENDPOINTS = {
  N8N: {
    WORKFLOWS: '/workflows',
    EXECUTIONS: '/executions',
    ACTIVE_WORKFLOWS: '/active-workflows'
  },
  AI: {
    CHAT: '/chat/completions',
    CONTENT_GENERATION: '/generate/content',
    ANALYSIS: '/analyze'
  },
  WHATSAPP: {
    SEND_MESSAGE: '/messages',
    WEBHOOK: '/webhook'
  }
};
