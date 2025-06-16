import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Récupérer l'utilisateur depuis le token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Récupérer les paramètres utilisateur
    const { data: settings, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('n8n_api_key, n8n_base_url')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings?.n8n_api_key) {
      return new Response(JSON.stringify({ 
        error: 'Configuration n8n manquante. Configurez votre clé API dans les paramètres.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extraire le chemin et les paramètres de requête
    const url = new URL(req.url)
    const path = url.searchParams.get('path') || '/workflows'
    const n8nUrl = settings.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud'
    
    // Construire l'URL complète pour n8n
    const targetUrl = `${n8nUrl}/api/v1${path}`
    console.log(`🌐 Requête n8n: ${req.method} ${targetUrl}`)

    // Préparer les headers pour n8n
    const n8nHeaders: HeadersInit = {
      'X-N8N-API-KEY': settings.n8n_api_key,
      'Content-Type': 'application/json',
    }

    // Préparer les options de requête
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: n8nHeaders,
    }

    // Ajouter le body si nécessaire
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        const body = await req.text()
        if (body) {
          fetchOptions.body = body
        }
      } catch (e) {
        // Ignore si pas de body
      }
    }

    // Faire l'appel à n8n
    const response = await fetch(targetUrl, fetchOptions)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erreur n8n ${response.status}:`, errorText)
      return new Response(JSON.stringify({ 
        error: `Erreur API n8n: ${response.status} ${response.statusText}`,
        details: errorText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Retourner la réponse de n8n
    const responseData = await response.text()
    
    return new Response(responseData, {
      status: response.status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': response.headers.get('content-type') || 'application/json' 
      },
    })

  } catch (error) {
    console.error('Erreur proxy n8n:', error)
    return new Response(JSON.stringify({ 
      error: `Erreur interne: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})