
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
  GOOGLE: {
    ANALYTICS_API: process.env.GOOGLE_ANALYTICS_API,
    SEARCH_CONSOLE_API: process.env.GOOGLE_SEARCH_CONSOLE_API,
    ADS_API: process.env.GOOGLE_ADS_API
  },
  SOCIAL: {
    FACEBOOK_API: process.env.FACEBOOK_API,
    TWITTER_API: process.env.TWITTER_API,
    LINKEDIN_API: process.env.LINKEDIN_API,
    INSTAGRAM_API: process.env.INSTAGRAM_API
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
  }
};
