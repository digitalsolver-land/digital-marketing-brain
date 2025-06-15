
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openRouterApiKey) {
      console.error('OPENROUTER_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Clé API OpenRouter non configurée dans les secrets Supabase' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const requestBody = await req.json();
    const { prompt, type, seoKeywords, systemPrompt } = requestBody;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Utiliser le systemPrompt fourni ou créer un prompt système basé sur le type
    const finalSystemPrompt = systemPrompt || getSystemPrompt(type, seoKeywords);

    console.log('Génération de contenu avec OpenRouter API');
    console.log('Type:', type);
    console.log('Prompt:', prompt.substring(0, 100) + '...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://preview--digital-marketing-brain.lovable.app',
        'X-Title': 'Digital Marketing Brain'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur OpenRouter API:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erreur API OpenRouter: ${response.status} - ${errorText}` }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      console.error('Aucune réponse générée par l\'API:', data);
      return new Response(
        JSON.stringify({ error: 'Aucune réponse générée par l\'IA' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const generatedContent = data.choices[0].message.content;

    if (!generatedContent) {
      console.error('Contenu généré vide:', data);
      return new Response(
        JSON.stringify({ error: 'Contenu généré vide' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Contenu généré avec succès, longueur:', generatedContent.length);

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erreur dans generate-ai-content:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne du serveur', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getSystemPrompt(type: string, seoKeywords?: string[]): string {
  const basePrompt = 'Tu es un expert en marketing digital et copywriting français.';
  const seoInstructions = seoKeywords && seoKeywords.length > 0 
    ? `Optimise pour les mots-clés: ${seoKeywords.join(', ')}` 
    : '';
  
  switch (type) {
    case 'blog':
      return `${basePrompt} Crée un article de blog engageant et informatif en français. Structure avec titre, introduction, développement et conclusion. ${seoInstructions}`;
    case 'social':
      return `${basePrompt} Crée du contenu social média accrocheur et viral en français. Inclus des hashtags pertinents et un call-to-action. Adapte le ton selon le réseau (professionnel pour LinkedIn, décontracté pour Instagram/TikTok). ${seoInstructions}`;
    case 'email':
      return `${basePrompt} Crée un email marketing persuasif en français avec un objet accrocheur et un CTA fort. Structure: salutation, accroche, corps du message, CTA. ${seoInstructions}`;
    case 'ad':
      return `${basePrompt} Crée une publicité concise et impactante en français. Focus sur le bénéfice client et l'urgence. Maximum 150 mots. ${seoInstructions}`;
    case 'whatsapp':
      return `${basePrompt} Tu es un assistant WhatsApp professionnel qui répond de manière courtoise et utile. Réponds en français, sois concis et direct (WhatsApp favorise les messages courts). Reste professionnel mais amical. ${seoInstructions}`;
    case 'seo-analysis':
      return `${basePrompt} Analyse le contenu fourni pour les aspects SEO. Fournis un rapport détaillé avec des recommandations d'amélioration en format JSON.`;
    case 'workflow':
      return `${basePrompt} Crée un workflow détaillé basé sur la description fournie. Retourne la structure en format JSON avec les étapes, conditions et actions.`;
    case 'command':
      return `${basePrompt} Traite la commande fournie et retourne une réponse structurée en format JSON.`;
    default:
      return `${basePrompt} ${seoInstructions}`;
  }
}
