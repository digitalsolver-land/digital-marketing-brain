
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
    const { path, method = 'GET', body } = await req.json()
    
    if (!path) {
      throw new Error('Chemin API requis')
    }

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
      throw new Error('Configuration n8n manquante. Configurez votre clé API dans les paramètres.')
    }

    const n8nBaseUrl = secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud'
    const n8nApiKey = secretsMap.n8n_api_key

    console.log(`🌐 Proxy n8n: ${method} ${path}`)

    // Construire l'URL complète
    const fullUrl = `${n8nBaseUrl}/api/v1${path}`
    
    // Préparer les headers pour n8n
    const headers: Record<string, string> = {
      'X-N8N-API-KEY': n8nApiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'Replit-N8N-Proxy/1.0'
    }

    // Options pour la requête
    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    // Ajouter le body si nécessaire
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    // Faire la requête vers n8n avec timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Lire la réponse
      const responseText = await response.text()
      let responseData

      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      if (!response.ok) {
        console.error(`❌ Erreur API n8n (${response.status}):`, responseData)
        throw new Error(`Erreur API n8n: ${response.status} ${response.statusText}`)
      }

      console.log(`✅ Requête n8n réussie: ${method} ${path}`)

      return new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout de la requête n8n (30s)')
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error('❌ Erreur proxy n8n:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur interne du proxy n8n',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
