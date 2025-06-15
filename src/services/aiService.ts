
import { supabase } from '@/integrations/supabase/client';

export class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async initialize(userId: string) {
    console.log('AI Service initialized - using Supabase Edge Function');
  }

  async generateContent(prompt: string, type: 'blog' | 'social' | 'email' | 'ad' | 'whatsapp', seoKeywords?: string[]): Promise<string> {
    try {
      console.log('Calling Supabase Edge Function for content generation');
      console.log('Prompt:', prompt.substring(0, 100) + '...');
      console.log('Type:', type);
      console.log('SEO Keywords:', seoKeywords);
      
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt: prompt.trim(),
          type,
          seoKeywords: seoKeywords || []
        }
      });

      console.log('Edge Function response:', data);
      console.log('Edge Function error:', error);

      if (error) {
        console.error('Erreur Edge Function:', error);
        throw new Error(`Erreur de l'Edge Function: ${error.message || 'Erreur inconnue'}`);
      }

      if (!data) {
        throw new Error('Aucune donnée retournée par l\'Edge Function');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.content) {
        throw new Error('Aucun contenu généré dans la réponse');
      }

      console.log('Contenu généré avec succès, longueur:', data.content.length);
      return data.content;

    } catch (error) {
      console.error('Erreur génération contenu:', error);
      
      // Messages d'erreur plus explicites
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error('Service IA non disponible. Veuillez réessayer plus tard.');
        }
        if (error.message.includes('unauthorized')) {
          throw new Error('Configuration IA manquante. Vérifiez vos paramètres.');
        }
        if (error.message.includes('API')) {
          throw new Error('Erreur de l\'API IA. Vérifiez votre configuration.');
        }
        throw error;
      }
      
      throw new Error('Échec de la génération de contenu. Veuillez réessayer.');
    }
  }

  async generateWhatsAppResponse(
    userMessage: string, 
    customInstructions?: string, 
    context?: any
  ): Promise<string> {
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
      
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt: userMessage,
          type: 'whatsapp',
          systemPrompt
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.content) throw new Error('Aucun contenu généré');
      
      return data.content;
    } catch (error) {
      console.error('Erreur génération réponse WhatsApp:', error);
      throw new Error('Échec de la génération de réponse WhatsApp');
    }
  }

  async analyzeSEO(content: string, targetKeywords: string[]): Promise<any> {
    const prompt = `Analyse SEO du contenu suivant pour les mots-clés: ${targetKeywords.join(', ')}\n\nContenu: ${content}`;
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt,
          type: 'seo-analysis'
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.content) throw new Error('Aucune analyse générée');
      
      return JSON.parse(data.content);
    } catch (error) {
      console.error('Erreur analyse SEO:', error);
      throw new Error('Échec de l\'analyse SEO');
    }
  }

  async createWorkflowFromDescription(description: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt: description,
          type: 'workflow'
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.content) throw new Error('Aucun workflow généré');
      
      return JSON.parse(data.content);
    } catch (error) {
      console.error('Erreur création workflow:', error);
      throw new Error('Échec de la création du workflow');
    }
  }

  async processCommand(command: string, context: any): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt: command,
          type: 'command',
          context
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.content) throw new Error('Aucune réponse générée');
      
      return JSON.parse(data.content);
    } catch (error) {
      console.error('Erreur traitement commande:', error);
      throw new Error('Échec du traitement de la commande');
    }
  }
}

export const aiService = AIService.getInstance();
