
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
    // Utiliser la nouvelle clé API Mistral
    const openRouterApiKey = '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';
    
    if (!openRouterApiKey) {
      console.error('OPENROUTER_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Clé API OpenRouter non configurée' }),
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

    console.log('Génération de contenu avec OpenRouter API (Mistral)');
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
        model: 'mistralai/mistral-7b-instruct:free', // Modèle Mistral gratuit
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800 // Réduit pour éviter les problèmes de limites
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur OpenRouter API:', response.status, errorText);
      
      // Gestion spécifique des erreurs courantes
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Limite de tokens atteinte. Essayez avec un prompt plus court.' 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Clé API OpenRouter invalide. Vérifiez votre clé API.' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Limite de requêtes atteinte. Attendez quelques secondes avant de réessayer.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
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

    console.log('Contenu généré avec succès avec Mistral, longueur:', generatedContent.length);

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
      return `${basePrompt} Crée un article de blog engageant et informatif en français. Structure avec titre, introduction, développement et conclusion. Sois concis. ${seoInstructions}`;
    case 'social':
      return `${basePrompt} Crée du contenu social média accrocheur en français. Inclus des hashtags pertinents et un call-to-action. Sois concis et punchy. ${seoInstructions}`;
    case 'email':
      return `${basePrompt} Crée un email marketing persuasif en français avec un objet accrocheur et un CTA fort. Sois concis. ${seoInstructions}`;
    case 'ad':
      return `${basePrompt} Crée une publicité concise et impactante en français. Focus sur le bénéfice client. Maximum 80 mots. ${seoInstructions}`;
    case 'whatsapp':
      return `${basePrompt} Tu es un assistant WhatsApp professionnel. Réponds en français, sois très concis et direct. Messages courts et utiles. ${seoInstructions}`;
    case 'seo-analysis':
      return `${basePrompt} Analyse le contenu fourni pour les aspects SEO. Fournis un rapport concis avec des recommandations en format JSON.`;
    case 'workflow':
      return `${basePrompt} Crée un workflow basé sur la description fournie. Retourne la structure en format JSON avec les étapes.`;
    case 'command':
      return `${basePrompt} Traite la commande fournie et retourne une réponse structurée en format JSON.`;
    default:
      return `${basePrompt} Sois concis et direct dans ta réponse. ${seoInstructions}`;
  }
}
