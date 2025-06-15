
import { supabase } from '@/integrations/supabase/client';

export class AIService {
  private static instance: AIService;
  private apiKey = '';
  private baseUrl = 'https://openrouter.ai/api/v1';

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async initialize(userId: string) {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('openrouter_api_key')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.openrouter_api_key) {
        this.apiKey = data.openrouter_api_key;
      }
    } catch (error) {
      console.error('Error initializing AI service:', error);
    }
  }

  async generateContent(prompt: string, type: 'blog' | 'social' | 'email' | 'ad' | 'whatsapp', seoKeywords?: string[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API OpenRouter non configurée. Rendez-vous dans les paramètres.');
    }

    try {
      const systemPrompt = this.getSystemPrompt(type, seoKeywords);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur génération contenu:', error);
      throw new Error('Échec de la génération de contenu. Vérifiez votre configuration.');
    }
  }

  async generateWhatsAppResponse(
    userMessage: string, 
    customInstructions?: string, 
    context?: any
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API OpenRouter non configurée');
    }

    try {
      const systemPrompt = `${customInstructions || 'Tu es un assistant WhatsApp professionnel qui répond de manière courtoise et utile.'} 
      
      RÈGLES IMPORTANTES:
      - Réponds en français
      - Sois concis et direct (WhatsApp favorise les messages courts)
      - Reste professionnel mais amical
      - Si tu ne peux pas aider, oriente vers un humain
      - N'invente jamais d'informations
      - Pour les questions complexes, propose un appel ou un rendez-vous
      
      Contexte: ${context ? JSON.stringify(context) : 'Aucun contexte spécifique'}`;
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.6,
          max_tokens: 500
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur génération réponse WhatsApp:', error);
      throw new Error('Échec de la génération de réponse WhatsApp');
    }
  }

  async analyzeSEO(content: string, targetKeywords: string[]): Promise<any> {
    const prompt = `Analyse SEO du contenu suivant pour les mots-clés: ${targetKeywords.join(', ')}\n\nContenu: ${content}`;
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { 
              role: 'system', 
              content: 'Tu es un expert SEO. Analyse le contenu et fournis des recommandations détaillées en JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Erreur analyse SEO:', error);
      throw new Error('Échec de l\'analyse SEO');
    }
  }

  async createWorkflowFromDescription(description: string): Promise<any> {
    const systemPrompt = `Tu es un expert en automatisation n8n. Crée un workflow JSON valide basé sur la description utilisateur. 
    Retourne uniquement le JSON du workflow avec les nodes et connections appropriés.`;
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: description }
          ],
          temperature: 0.4
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Erreur création workflow:', error);
      throw new Error('Échec de la création du workflow');
    }
  }

  async processCommand(command: string, context: any): Promise<any> {
    const systemPrompt = `Tu es l'assistant IA de la plateforme marketing. Tu peux:
    1. Créer des workflows n8n
    2. Analyser des données
    3. Générer du contenu
    4. Faire des appels API
    
    Contexte actuel: ${JSON.stringify(context)}
    
    Interprète la commande et retourne une action à exécuter en JSON.`;
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: command }
          ],
          temperature: 0.5
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Erreur traitement commande:', error);
      throw new Error('Échec du traitement de la commande');
    }
  }

  private getSystemPrompt(type: string, seoKeywords?: string[]): string {
    const basePrompt = 'Tu es un expert en marketing digital et copywriting français.';
    const seoInstructions = seoKeywords ? `Optimise pour les mots-clés: ${seoKeywords.join(', ')}` : '';
    
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
        return `${basePrompt} Crée du contenu optimisé pour WhatsApp en français (court, direct, engageant). Utilise des emojis et un ton conversationnel. ${seoInstructions}`;
      default:
        return basePrompt;
    }
  }
}

export const aiService = AIService.getInstance();
