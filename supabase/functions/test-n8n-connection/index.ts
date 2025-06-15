
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Test de connexion n8n démarré');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérification de l'authentification
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      console.error('❌ Token manquant')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token d\'autorisation manquant' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    
    if (authError || !user) {
      console.error('❌ Erreur auth:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Non autorisé' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupération des secrets utilisateur
    const { data: secrets, error: secretsError } = await supabase
      .from('user_secrets')
      .select('secret_name, secret_value')
      .eq('user_id', user.id)
      .in('secret_name', ['n8n_api_key', 'n8n_base_url'])

    if (secretsError) {
      console.error('❌ Erreur récupération secrets:', secretsError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuration n8n non trouvée',
        troubleshooting: 'Veuillez d\'abord sauvegarder votre configuration n8n'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Formatage des secrets
    const secretsMap: Record<string, string> = {}
    secrets?.forEach(secret => {
      secretsMap[secret.secret_name] = secret.secret_value
    })

    const n8nApiKey = secretsMap.n8n_api_key
    const n8nBaseUrl = secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud/api/v1'
    
    console.log('📋 Configuration:', {
      hasApiKey: !!n8nApiKey,
      baseUrl: n8nBaseUrl,
      keyLength: n8nApiKey?.length || 0
    });

    if (!n8nApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Clé API n8n manquante',
        troubleshooting: 'Veuillez d\'abord sauvegarder votre clé API n8n'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test de connexion avec timeout optimisé
    console.log('🌐 Test vers:', `${n8nBaseUrl}/workflows?limit=1`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondes

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

      console.log('📡 Réponse:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        
        let errorMessage = `Erreur HTTP ${response.status}`;
        let troubleshooting = '';

        switch (response.status) {
          case 401:
            errorMessage = 'Clé API n8n invalide ou expirée';
            troubleshooting = 'Vérifiez que votre clé API est correcte dans les paramètres n8n';
            break;
          case 403:
            errorMessage = 'Accès refusé par n8n';
            troubleshooting = 'Vérifiez les permissions de votre clé API';
            break;
          case 404:
            errorMessage = 'URL API non trouvée';
            troubleshooting = 'Vérifiez que l\'URL se termine par /api/v1 et que n8n est accessible';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Serveur n8n indisponible';
            troubleshooting = 'Le serveur n8n semble avoir des problèmes techniques';
            break;
          default:
            troubleshooting = `Détails: ${errorText}`;
        }

        console.error(`❌ ${errorMessage}:`, errorText);

        return new Response(JSON.stringify({
          success: false,
          error: errorMessage,
          troubleshooting,
          details: {
            status: response.status,
            url: n8nBaseUrl,
            response: errorText
          }
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await response.json();
      console.log('✅ Connexion réussie, workflows trouvés:', data.data?.length || 0);

      return new Response(JSON.stringify({
        success: true,
        message: 'Connexion n8n établie avec succès',
        details: {
          workflowCount: data.data?.length || 0,
          url: n8nBaseUrl,
          serverInfo: data.version || 'Version inconnue'
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
          error: 'Timeout de connexion',
          troubleshooting: 'Le serveur n8n ne répond pas dans les temps. Vérifiez l\'URL et la disponibilité du serveur.',
          details: { timeout: true, url: n8nBaseUrl }
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.error('🌐 Erreur réseau:', fetchError.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erreur de connexion réseau',
        troubleshooting: 'Impossible de joindre le serveur n8n. Vérifiez l\'URL et votre connexion.',
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
    console.error('💥 Erreur générale test-n8n-connection:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erreur interne du service',
      troubleshooting: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
