
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔧 Début sauvegarde configuration n8n')
    
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      console.error('❌ Méthode non autorisée:', req.method)
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le client Supabase avec les bonnes clés
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables d\'environnement manquantes')
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incomplète' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔑 Configuration Supabase OK')

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
    console.log('🔍 Token reçu:', token.substring(0, 20) + '...')

    // Vérifier l'utilisateur avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('❌ Erreur authentification:', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Token invalide',
          details: authError.message 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user) {
      console.error('❌ Utilisateur non trouvé')
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.id)

    // Parser le body de la requête
    let body
    try {
      const rawBody = await req.text()
      console.log('📝 Body reçu:', rawBody)
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Format JSON invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { apiKey, baseUrl } = body

    // Validation des données
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      console.error('❌ Clé API manquante ou invalide')
      return new Response(
        JSON.stringify({ error: 'Clé API requise et valide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
      console.error('❌ URL de base manquante ou invalide')
      return new Response(
        JSON.stringify({ error: 'URL de base requise et valide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Données validées - API Key:', apiKey.substring(0, 10) + '...', 'Base URL:', baseUrl)

    // Sauvegarder les secrets avec upsert
    const timestamp = new Date().toISOString()

    // Sauvegarder la clé API
    console.log('💾 Sauvegarde clé API...')
    const { error: apiKeyError } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_api_key',
        secret_value: apiKey.trim(),
        updated_at: timestamp
      }, {
        onConflict: 'user_id,secret_name'
      })

    if (apiKeyError) {
      console.error('❌ Erreur sauvegarde clé API:', apiKeyError)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur sauvegarde clé API',
          details: apiKeyError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sauvegarder l'URL de base
    console.log('💾 Sauvegarde URL de base...')
    const { error: baseUrlError } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_base_url',
        secret_value: baseUrl.trim(),
        updated_at: timestamp
      }, {
        onConflict: 'user_id,secret_name'
      })

    if (baseUrlError) {
      console.error('❌ Erreur sauvegarde URL de base:', baseUrlError)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur sauvegarde URL de base',
          details: baseUrlError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Configuration n8n sauvegardée avec succès')

    // Vérifier la sauvegarde
    const { data: verification, error: verifyError } = await supabase
      .from('user_secrets')
      .select('secret_name, created_at, updated_at')
      .eq('user_id', user.id)
      .in('secret_name', ['n8n_api_key', 'n8n_base_url'])

    if (verifyError) {
      console.warn('⚠️ Erreur vérification:', verifyError)
    } else {
      console.log('🔍 Vérification sauvegarde:', verification)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Configuration n8n sauvegardée avec succès',
        timestamp: timestamp,
        user_id: user.id,
        secrets_saved: ['n8n_api_key', 'n8n_base_url']
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erreur générale fonction save-n8n-config:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne du serveur',
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
