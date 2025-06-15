
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
    console.log('💾 Début sauvegarde configuration n8n')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérification du token d'authentification
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      console.error('❌ Token d\'autorisation manquant')
      return new Response(
        JSON.stringify({ error: 'Token d\'autorisation requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    
    if (authError || !user) {
      console.error('❌ Erreur d\'authentification:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Utilisateur non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Lecture et validation des données
    const body = await req.json().catch(() => ({}))
    const { apiKey, baseUrl } = body
    
    if (!apiKey?.trim()) {
      console.error('❌ Clé API manquante')
      return new Response(
        JSON.stringify({ error: 'Clé API n8n requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!baseUrl?.trim()) {
      console.error('❌ URL de base manquante')
      return new Response(
        JSON.stringify({ error: 'URL de base n8n requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Sauvegarde pour utilisateur:', user.id)
    console.log('🔗 URL de base:', baseUrl)

    // Créer la table user_secrets si elle n'existe pas
    const { error: createTableError } = await supabase.rpc('create_user_secrets_table').catch(() => ({ error: null }))
    
    // Créer la table manuellement si la fonction RPC n'existe pas
    if (createTableError) {
      console.log('📋 Création de la table user_secrets via SQL direct')
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_secrets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            secret_name TEXT NOT NULL,
            secret_value TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, secret_name)
          );
          
          ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can manage their own secrets" ON public.user_secrets;
          CREATE POLICY "Users can manage their own secrets" ON public.user_secrets
            FOR ALL USING (auth.uid() = user_id);
        `
      }).catch(() => ({ error: { message: 'Table creation via SQL failed' } }))
    }

    // Sauvegarder la clé API
    console.log('💾 Sauvegarde de la clé API...')
    const { error: apiKeyError } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_api_key',
        secret_value: apiKey.trim(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,secret_name'
      })

    if (apiKeyError) {
      console.error('❌ Erreur sauvegarde API key:', apiKeyError)
      
      // Tentative de création directe si la table n'existe pas
      if (apiKeyError.code === 'PGRST116' || apiKeyError.message?.includes('relation')) {
        console.log('🔄 Tentative de création directe de l\'entrée...')
        const { error: insertError } = await supabase
          .from('user_secrets')
          .insert({
            user_id: user.id,
            secret_name: 'n8n_api_key',
            secret_value: apiKey.trim()
          })
        
        if (insertError) {
          console.error('❌ Erreur création directe:', insertError)
          return new Response(
            JSON.stringify({ 
              error: 'Impossible de sauvegarder la clé API',
              details: insertError.message,
              suggestion: 'Vérifiez que la base de données est correctement configurée'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Erreur lors de la sauvegarde de la clé API',
            details: apiKeyError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Sauvegarder l'URL de base
    console.log('💾 Sauvegarde de l\'URL de base...')
    const { error: urlError } = await supabase
      .from('user_secrets')
      .upsert({
        user_id: user.id,
        secret_name: 'n8n_base_url',
        secret_value: baseUrl.trim(),
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
        message: 'Configuration n8n sauvegardée avec succès'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Erreur générale save-n8n-config:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur interne',
        details: error.message,
        suggestion: 'Veuillez réessayer dans quelques instants'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
