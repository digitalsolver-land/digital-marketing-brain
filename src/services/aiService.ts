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
    // Plus besoin d'initialiser avec la clé API car elle est dans les secrets Supabase
    console.log('AI Service initialized - using Supabase Edge Function');
  }

  async generateContent(prompt: string, type: 'blog' | 'social' | 'email' | 'ad' | 'whatsapp', seoKeywords?: string[]): Promise<string> {
    try {
      console.log('Calling Supabase Edge Function for content generation');
      
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          prompt,
          type,
          seoKeywords: seoKeywords || []
        }
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        throw new Error(error.message || 'Erreur lors de la génération de contenu');
      }

      if (!data || !data.content) {
        throw new Error('Aucun contenu généré');
      }

      return data.content;
    } catch (error) {
      console.error('Erreur génération contenu:', error);
      throw new Error(error instanceof Error ? error.message : 'Échec de la génération de contenu');
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

      if (error) throw error;
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

      if (error) throw error;
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

      if (error) throw error;
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

      if (error) throw error;
      return JSON.parse(data.content);
    } catch (error) {
      console.error('Erreur traitement commande:', error);
      throw new Error('Échec du traitement de la commande');
    }
  }
}

export const aiService = AIService.getInstance();
