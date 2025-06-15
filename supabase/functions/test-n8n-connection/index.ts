
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
    console.log('🔍 Test de connexion n8n démarré');
    
    // Récupérer les secrets depuis Supabase
    const n8nApiKey = Deno.env.get('N8N_API_KEY');
    const n8nBaseUrl = Deno.env.get('N8N_BASE_URL') || 'https://n8n.srv860213.hstgr.cloud/api/v1';
    
    console.log('📋 Configuration détectée:', {
      hasApiKey: !!n8nApiKey,
      baseUrl: n8nBaseUrl,
      apiKeyPrefix: n8nApiKey ? n8nApiKey.substring(0, 10) + '...' : 'Aucune'
    });

    if (!n8nApiKey) {
      console.error('❌ Clé API n8n manquante');
      return new Response(JSON.stringify({
        success: false,
        error: 'N8N_API_KEY secret manquant dans Supabase',
        details: 'Vérifiez que la clé API est bien configurée dans les secrets Supabase'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test de connexion avec timeout
    console.log('🌐 Test de connexion vers:', `${n8nBaseUrl}/workflows?limit=1`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout

    try {
      const response = await fetch(`${n8nBaseUrl}/workflows?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': n8nApiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error('❌ Erreur HTTP:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        let errorMessage = `Erreur HTTP ${response.status}`;
        let troubleshooting = '';

        switch (response.status) {
          case 401:
            errorMessage = 'Clé API n8n invalide ou expirée';
            troubleshooting = 'Vérifiez que votre clé API est correcte et active dans n8n';
            break;
          case 403:
            errorMessage = 'Accès refusé - permissions insuffisantes';
            troubleshooting = 'Vérifiez que votre clé API a les permissions "workflow:*"';
            break;
          case 404:
            errorMessage = 'URL API n8n non trouvée';
            troubleshooting = 'Vérifiez que l\'URL de base est correcte et se termine par /api/v1';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Serveur n8n indisponible';
            troubleshooting = 'Le serveur n8n semble avoir des problèmes. Réessayez plus tard.';
            break;
          default:
            troubleshooting = `Erreur serveur: ${errorText}`;
        }

        return new Response(JSON.stringify({
          success: false,
          error: errorMessage,
          troubleshooting,
          details: {
            status: response.status,
            body: errorText,
            url: `${n8nBaseUrl}/workflows?limit=1`
          }
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await response.json();
      console.log('✅ Connexion n8n réussie:', {
        workflowCount: data.data?.length || 0,
        hasNextCursor: !!data.nextCursor
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Connexion n8n établie avec succès',
        details: {
          workflowCount: data.data?.length || 0,
          serverVersion: response.headers.get('server'),
          url: n8nBaseUrl
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ Timeout de connexion');
        return new Response(JSON.stringify({
          success: false,
          error: 'Timeout de connexion (15s)',
          troubleshooting: 'Le serveur n8n ne répond pas. Vérifiez que l\'URL est correcte et que le serveur est accessible.',
          details: { timeout: true, url: n8nBaseUrl }
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.error('🌐 Erreur réseau:', fetchError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erreur de connexion réseau',
        troubleshooting: 'Impossible de joindre le serveur n8n. Vérifiez l\'URL et votre connexion internet.',
        details: {
          error: fetchError.message,
          url: n8nBaseUrl
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erreur interne du service',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
