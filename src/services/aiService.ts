
import { API_CONFIG } from '@/config/api';

export class AIService {
  private static instance: AIService;
  private apiKey = API_CONFIG.OPENROUTER.API_KEY;
  private baseUrl = API_CONFIG.OPENROUTER.BASE_URL;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateContent(prompt: string, type: 'blog' | 'social' | 'email' | 'ad', seoKeywords?: string[]): Promise<string> {
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

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur génération contenu:', error);
      throw new Error('Échec de la génération de contenu');
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
    const basePrompt = 'Tu es un expert en marketing digital et copywriting.';
    const seoInstructions = seoKeywords ? `Optimise pour les mots-clés: ${seoKeywords.join(', ')}` : '';
    
    switch (type) {
      case 'blog':
        return `${basePrompt} Crée un article de blog engageant et informatif. ${seoInstructions}`;
      case 'social':
        return `${basePrompt} Crée du contenu social média accrocheur et viral. ${seoInstructions}`;
      case 'email':
        return `${basePrompt} Crée un email marketing persuasif avec un CTA fort. ${seoInstructions}`;
      case 'ad':
        return `${basePrompt} Crée une publicité concise et impactante. ${seoInstructions}`;
      default:
        return basePrompt;
    }
  }
}

export const aiService = AIService.getInstance();
