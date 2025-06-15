
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
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from request
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
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

    // Parse request body
    const body = await req.json()
    const { apiKey, baseUrl } = body
    
    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'apiKey et baseUrl requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Sauvegarde des secrets n8n pour utilisateur:', user.id)

    // Ensure user_secrets table exists and create if needed
    const { error: createTableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_secrets (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          secret_name VARCHAR(255) NOT NULL,
          secret_value TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, secret_name)
        );
      `
    }).catch(() => ({ error: null })) // Ignore if table exists

    // Save secrets using upsert
    const { error: secretError1 } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_api_key',
        secret_value: apiKey,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,secret_name'
      })

    if (secretError1) {
      console.error('❌ Erreur sauvegarde API key:', secretError1)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la sauvegarde de la clé API',
          details: secretError1.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: secretError2 } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_base_url', 
        secret_value: baseUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,secret_name'
      })

    if (secretError2) {
      console.error('❌ Erreur sauvegarde URL de base:', secretError2)
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la sauvegarde de l\'URL de base',
          details: secretError2.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Configuration n8n sauvegardée avec succès')

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
    console.error('❌ Erreur fonction save-n8n-config:', error)
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
