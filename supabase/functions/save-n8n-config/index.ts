
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    
    if (authError || !user) {
      console.error('❌ Erreur auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { apiKey, baseUrl } = await req.json()
    
    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'apiKey et baseUrl requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Sauvegarde des secrets n8n pour utilisateur:', user.id)

    // Save secrets
    const { error: secretError1 } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_api_key',
        secret_value: apiKey,
        updated_at: new Date().toISOString()
      })

    const { error: secretError2 } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_base_url', 
        secret_value: baseUrl,
        updated_at: new Date().toISOString()
      })

    if (secretError1 || secretError2) {
      console.error('❌ Erreur sauvegarde secrets:', secretError1 || secretError2)
      throw new Error('Erreur lors de la sauvegarde')
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
