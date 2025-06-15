
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔑 Récupération des secrets n8n')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérification de l'authentification
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      console.error('❌ Token manquant')
      return new Response(
        JSON.stringify({ error: 'Token d\'autorisation manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    
    if (authError || !user) {
      console.error('❌ Erreur auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupération des secrets utilisateur
    const { data: secrets, error: secretsError } = await supabase
      .from('user_secrets')
      .select('secret_name, secret_value')
      .eq('user_id', user.id)
      .in('secret_name', ['n8n_api_key', 'n8n_base_url'])

    // Gestion du cas où la table n'existe pas encore
    if (secretsError) {
      console.log('📋 Table user_secrets non trouvée, retour des valeurs par défaut')
      return new Response(
        JSON.stringify({
          n8n_api_key: null,
          n8n_base_url: 'https://n8n.srv860213.hstgr.cloud/api/v1'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!secrets || secrets.length === 0) {
      console.log('📋 Aucun secret trouvé pour cet utilisateur')
      return new Response(
        JSON.stringify({
          n8n_api_key: null,
          n8n_base_url: 'https://n8n.srv860213.hstgr.cloud/api/v1'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Formatage des secrets pour la réponse
    const secretsMap: Record<string, string> = {}
    secrets.forEach(secret => {
      secretsMap[secret.secret_name] = secret.secret_value
    })

    console.log('📋 Secrets récupérés:', {
      hasApiKey: !!secretsMap.n8n_api_key,
      hasBaseUrl: !!secretsMap.n8n_base_url,
      apiKeyLength: secretsMap.n8n_api_key?.length || 0
    })

    return new Response(
      JSON.stringify({
        n8n_api_key: secretsMap.n8n_api_key || null,
        n8n_base_url: secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud/api/v1'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erreur fonction get-n8n-secrets:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
