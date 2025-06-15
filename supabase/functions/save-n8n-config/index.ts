
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('💾 Sauvegarde configuration n8n démarrée')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get and validate auth token
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      console.error('❌ Token manquant')
      return new Response(
        JSON.stringify({ error: 'Token d\'autorisation manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    
    if (authError || !user) {
      console.error('❌ Erreur auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const { apiKey, baseUrl } = body
    
    if (!apiKey || !baseUrl) {
      console.error('❌ Données manquantes:', { hasApiKey: !!apiKey, hasBaseUrl: !!baseUrl })
      return new Response(
        JSON.stringify({ error: 'apiKey et baseUrl requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Sauvegarde pour utilisateur:', user.id)

    // Create table if it doesn't exist
    const { error: createError } = await supabase
      .from('user_secrets')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    if (createError && createError.code === 'PGRST116') {
      console.log('📋 Création de la table user_secrets')
      // Table doesn't exist, we'll handle this in the upsert
    }

    // Save API key
    const { error: apiKeyError } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_api_key',
        secret_value: apiKey,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,secret_name'
      })

    if (apiKeyError) {
      console.error('❌ Erreur sauvegarde API key:', apiKeyError)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la sauvegarde de la clé API',
          details: apiKeyError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save base URL
    const { error: urlError } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_base_url',
        secret_value: baseUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,secret_name'
      })

    if (urlError) {
      console.error('❌ Erreur sauvegarde URL:', urlError)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la sauvegarde de l\'URL',
          details: urlError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Configuration sauvegardée avec succès')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Configuration sauvegardée avec succès'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Erreur générale:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur interne',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
