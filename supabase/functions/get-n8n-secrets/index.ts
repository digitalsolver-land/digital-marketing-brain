
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { 
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    // Récupérer l'utilisateur depuis le token JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('❌ Erreur authentification:', authError)
      throw new Error('Utilisateur non authentifié')
    }

    console.log('✅ Utilisateur authentifié:', user.id)

    // Récupérer les secrets n8n depuis user_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('user_secrets')
      .select('secret_name, secret_value')
      .eq('user_id', user.id)
      .in('secret_name', ['n8n_api_key', 'n8n_base_url'])

    if (secretsError) {
      console.error('❌ Erreur récupération secrets:', secretsError)
      throw new Error('Erreur lors de la récupération des secrets')
    }

    // Convertir en objet pour faciliter l'utilisation
    const secretsMap: Record<string, string> = {}
    secrets?.forEach(secret => {
      secretsMap[secret.secret_name] = secret.secret_value
    })

    // Vérifier si on a les clés nécessaires
    if (!secretsMap.n8n_api_key) {
      return new Response(
        JSON.stringify({ 
          error: 'Clé API n8n non configurée',
          hasConfig: false
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Secrets n8n récupérés avec succès')

    return new Response(
      JSON.stringify({ 
        apiKey: secretsMap.n8n_api_key,
        baseUrl: secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud',
        hasConfig: true
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
        details: error.message,
        hasConfig: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Début récupération secrets n8n')
    
    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables d\'environnement manquantes')
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incomplète' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token d\'authentification manquant')
      return new Response(
        JSON.stringify({ error: 'Authentification requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Vérifier l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Erreur authentification:', authError)
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.id)

    // Récupérer les secrets n8n
    const { data: secrets, error: secretsError } = await supabase
      .from('user_secrets')
      .select('secret_name, secret_value')
      .eq('user_id', user.id)
      .in('secret_name', ['n8n_api_key', 'n8n_base_url'])

    if (secretsError) {
      console.error('❌ Erreur récupération secrets:', secretsError)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur récupération configuration',
          details: secretsError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transformer en objet pour faciliter l'utilisation
    const secretsMap: Record<string, string> = {}
    secrets?.forEach(secret => {
      secretsMap[secret.secret_name] = secret.secret_value
    })

    console.log('📋 Secrets trouvés:', Object.keys(secretsMap))

    // Retourner les secrets avec des noms normalisés
    const response = {
      apiKey: secretsMap.n8n_api_key || null,
      baseUrl: secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud',
      n8n_api_key: secretsMap.n8n_api_key || null,
      n8n_base_url: secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud',
      hasConfig: !!(secretsMap.n8n_api_key && secretsMap.n8n_base_url),
      timestamp: new Date().toISOString()
    }

    console.log('✅ Configuration récupérée avec succès')

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erreur générale fonction get-n8n-secrets:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne du serveur',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
