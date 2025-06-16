
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erreur lors de la récupération de la configuration' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Convertir en objet pour faciliter l'utilisation
    const secretsMap: Record<string, string> = {}
    secrets?.forEach(secret => {
      secretsMap[secret.secret_name] = secret.secret_value
    })

    // Vérifier si on a les clés nécessaires
    if (!secretsMap.n8n_api_key) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Clé API n8n non configurée. Veuillez configurer votre clé API dans les paramètres.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const n8nUrl = secretsMap.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud'
    const n8nApiKey = secretsMap.n8n_api_key

    console.log(`🔍 Test connexion n8n: ${n8nUrl}`)

    // Tests multiples pour vérifier la connexion
    const tests = [
      {
        name: 'API Health Check',
        url: `${n8nUrl}/api/v1/active-workflows`,
        method: 'GET'
      },
      {
        name: 'Workflows Access',
        url: `${n8nUrl}/api/v1/workflows?limit=1`,
        method: 'GET'
      },
      {
        name: 'User Info',
        url: `${n8nUrl}/api/v1/me`,
        method: 'GET'
      }
    ]

    const results = []
    let allPassed = true

    for (const test of tests) {
      try {
        console.log(`🧪 Test: ${test.name}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout per test

        const testResponse = await fetch(test.url, {
          method: test.method,
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Replit-N8N-Test/1.0'
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        const testResult = {
          name: test.name,
          success: testResponse.ok,
          status: testResponse.status,
          statusText: testResponse.statusText
        }

        if (!testResponse.ok) {
          allPassed = false
          const errorText = await testResponse.text()
          testResult.error = errorText
          console.error(`❌ ${test.name} échoué:`, testResponse.status, errorText)
        } else {
          console.log(`✅ ${test.name} réussi`)
        }

        results.push(testResult)

      } catch (error) {
        allPassed = false
        const testResult = {
          name: test.name,
          success: false,
          error: error.message
        }
        results.push(testResult)
        console.error(`❌ ${test.name} erreur:`, error.message)
      }
    }

    if (allPassed) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Connexion n8n établie avec succès',
        baseUrl: n8nUrl,
        tests: results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Certains tests de connexion ont échoué',
        baseUrl: n8nUrl,
        tests: results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('❌ Erreur test connexion n8n:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Erreur interne: ${error.message}`,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
