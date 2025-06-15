
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔑 Récupération des secrets n8n');
    
    const n8nApiKey = Deno.env.get('N8N_API_KEY');
    const n8nBaseUrl = Deno.env.get('N8N_BASE_URL');
    
    console.log('📋 Secrets disponibles:', {
      hasApiKey: !!n8nApiKey,
      hasBaseUrl: !!n8nBaseUrl,
      apiKeyPrefix: n8nApiKey ? n8nApiKey.substring(0, 10) + '...' : 'Aucune'
    });

    return new Response(JSON.stringify({
      n8n_api_key: n8nApiKey || null,
      n8n_base_url: n8nBaseUrl || 'https://n8n.srv860213.hstgr.cloud/api/v1'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Erreur récupération secrets:', error);
    return new Response(JSON.stringify({
      error: 'Erreur lors de la récupération des secrets',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
