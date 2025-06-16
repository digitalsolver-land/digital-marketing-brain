
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

    // Récupérer l'utilisateur
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié')
    }

    // Récupérer les secrets n8n
    const { data: secrets, error: secretsError } = await supabase
      .from('user_secrets')
      .select('secret_name, secret_value')
      .eq('user_id', user.id)
      .in('secret_name', ['n8n_api_key', 'n8n_base_url'])

    if (secretsError) {
      throw new Error('Erreur lors de la récupération des secrets')
    }

    const secretsMap: Record<string, string> = {}
    secrets?.forEach(secret => {
      secretsMap[secret.secret_name] = secret.secret_value
    })

    const n8nBaseUrl = secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud'
    const n8nApiKey = secretsMap.n8n_api_key

    const diagnostics = {
      user_id: user.id,
      secrets_found: {
        api_key: !!n8nApiKey,
        base_url: !!n8nBaseUrl,
        api_key_length: n8nApiKey?.length || 0
      },
      base_url: n8nBaseUrl,
      endpoints_tested: {} as Record<string, any>
    }

    if (!n8nApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Clé API n8n manquante',
          diagnostics
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Test des endpoints principaux
    const endpoints = [
      { name: 'workflows', path: '/api/v1/workflows?limit=10' },
      { name: 'executions', path: '/api/v1/executions?limit=5' },
      { name: 'tags', path: '/api/v1/tags' },
      { name: 'variables', path: '/api/v1/variables' },
      { name: 'projects', path: '/api/v1/projects' }
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${n8nBaseUrl}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
            'Content-Type': 'application/json'
          }
        })

        const responseText = await response.text()
        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = responseText
        }

        diagnostics.endpoints_tested[endpoint.name] = {
          status: response.status,
          ok: response.ok,
          data_length: Array.isArray(responseData?.data) ? responseData.data.length : 0,
          error: !response.ok ? responseData : null
        }

        if (endpoint.name === 'workflows' && response.ok && responseData?.data) {
          diagnostics.endpoints_tested[endpoint.name].workflows = responseData.data.map((w: any) => ({
            id: w.id,
            name: w.name,
            active: w.active
          }))
        }

      } catch (error) {
        diagnostics.endpoints_tested[endpoint.name] = {
          error: error.message,
          failed: true
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
