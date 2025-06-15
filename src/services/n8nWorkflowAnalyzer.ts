
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowAnalysis {
  summary: string;
  errors: string[];
  suggestions: string[];
  complexity: 'low' | 'medium' | 'high';
  nodeCount: number;
  hasConnections: boolean;
}

export interface WorkflowOptimization {
  performance: string[];
  structure: string[];
  best_practices: string[];
}

export class N8nWorkflowAnalyzer {
  private static instance: N8nWorkflowAnalyzer;

  public static getInstance(): N8nWorkflowAnalyzer {
    if (!N8nWorkflowAnalyzer.instance) {
      N8nWorkflowAnalyzer.instance = new N8nWorkflowAnalyzer();
    }
    return N8nWorkflowAnalyzer.instance;
  }

  // Analyser un workflow avec l'IA
  async analyzeWorkflow(workflowData: any): Promise<WorkflowAnalysis> {
    try {
      console.log('🔍 Analyse du workflow avec l\'IA...');
      
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'workflow',
          prompt: `Analyse ce workflow n8n et explique-le de manière claire et détaillée:

${JSON.stringify(workflowData, null, 2)}

Fournis une analyse structurée avec:
1. Un résumé du workflow
2. Les erreurs potentielles détectées
3. Des suggestions d'amélioration
4. Une évaluation de la complexité`
        }
      });

      if (error) throw error;

      // Parser la réponse de l'IA pour extraire les informations structurées
      const analysis = this.parseAIAnalysis(data.content, workflowData);
      return analysis;
    } catch (error) {
      console.error('❌ Erreur analyse workflow:', error);
      return this.getBasicAnalysis(workflowData);
    }
  }

  // Obtenir des suggestions d'optimisation
  async getOptimizationSuggestions(workflowData: any): Promise<WorkflowOptimization> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'optimization',
          prompt: `Analyse ce workflow n8n et propose des optimisations:

${JSON.stringify(workflowData, null, 2)}

Concentre-toi sur:
1. Performance et efficacité
2. Structure et organisation
3. Bonnes pratiques n8n
4. Sécurité et fiabilité`
        }
      });

      if (error) throw error;

      return this.parseOptimizationSuggestions(data.content);
    } catch (error) {
      console.error('❌ Erreur suggestions d\'optimisation:', error);
      return {
        performance: ['Vérifiez les nœuds qui pourraient être optimisés'],
        structure: ['Organisez les nœuds de manière logique'],
        best_practices: ['Utilisez des noms descriptifs pour les nœuds']
      };
    }
  }

  // Corriger automatiquement des erreurs communes
  async fixCommonErrors(workflowData: any): Promise<any> {
    console.log('🔧 Correction automatique des erreurs...');
    
    let fixedWorkflow = { ...workflowData };

    // Correction 1: Ajouter des nœuds manquants
    if (!fixedWorkflow.nodes || fixedWorkflow.nodes.length === 0) {
      fixedWorkflow.nodes = [
        {
          id: 'start',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          position: [250, 300],
          parameters: {}
        }
      ];
    }

    // Correction 2: Initialiser les connexions si manquantes
    if (!fixedWorkflow.connections) {
      fixedWorkflow.connections = {};
    }

    // Correction 3: Vérifier que chaque nœud a un ID unique
    const nodeIds = new Set();
    fixedWorkflow.nodes.forEach((node: any, index: number) => {
      if (!node.id || nodeIds.has(node.id)) {
        node.id = `node_${Date.now()}_${index}`;
      }
      nodeIds.add(node.id);
    });

    // Correction 4: S'assurer que les nœuds ont des positions valides
    fixedWorkflow.nodes.forEach((node: any, index: number) => {
      if (!node.position || !Array.isArray(node.position)) {
        node.position = [250 + (index * 200), 300];
      }
    });

    // Correction 5: Ajouter des paramètres par défaut
    fixedWorkflow.nodes.forEach((node: any) => {
      if (!node.parameters) {
        node.parameters = {};
      }
    });

    return fixedWorkflow;
  }

  // Valider la structure d'un workflow
  validateWorkflow(workflowData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérification de base
    if (!workflowData.name || workflowData.name.trim() === '') {
      errors.push('Le workflow doit avoir un nom');
    }

    if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
      errors.push('Le workflow doit contenir des nœuds');
    } else {
      // Vérifier chaque nœud
      workflowData.nodes.forEach((node: any, index: number) => {
        if (!node.id) {
          errors.push(`Nœud ${index + 1}: ID manquant`);
        }
        if (!node.type) {
          errors.push(`Nœud ${index + 1}: Type manquant`);
        }
        if (!node.name) {
          errors.push(`Nœud ${index + 1}: Nom manquant`);
        }
      });
    }

    // Vérifier les connexions
    if (workflowData.connections) {
      Object.entries(workflowData.connections).forEach(([sourceId, connections]: [string, any]) => {
        const sourceNode = workflowData.nodes?.find((n: any) => n.id === sourceId);
        if (!sourceNode) {
          errors.push(`Connexion invalide: nœud source '${sourceId}' introuvable`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private parseAIAnalysis(aiResponse: string, workflowData: any): WorkflowAnalysis {
    // Analyse basique si l'IA ne répond pas comme attendu
    const nodeCount = workflowData.nodes?.length || 0;
    const hasConnections = workflowData.connections && Object.keys(workflowData.connections).length > 0;
    
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (nodeCount > 10) complexity = 'high';
    else if (nodeCount > 5) complexity = 'medium';

    return {
      summary: aiResponse || `Workflow avec ${nodeCount} nœud(s)`,
      errors: [],
      suggestions: [
        'Ajoutez des descriptions aux nœuds pour une meilleure lisibilité',
        'Vérifiez que tous les nœuds sont correctement connectés'
      ],
      complexity,
      nodeCount,
      hasConnections
    };
  }

  private parseOptimizationSuggestions(aiResponse: string): WorkflowOptimization {
    return {
      performance: [
        'Utilisez des filtres pour réduire le volume de données traitées',
        'Optimisez les requêtes de base de données'
      ],
      structure: [
        'Groupez les nœuds liés logiquement',
        'Utilisez des sous-workflows pour les tâches répétitives'
      ],
      best_practices: [
        'Ajoutez des nœuds de gestion d\'erreur',
        'Documentez votre workflow avec des annotations'
      ]
    };
  }

  private getBasicAnalysis(workflowData: any): WorkflowAnalysis {
    const nodeCount = workflowData.nodes?.length || 0;
    const hasConnections = workflowData.connections && Object.keys(workflowData.connections).length > 0;
    
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (nodeCount > 10) complexity = 'high';
    else if (nodeCount > 5) complexity = 'medium';

    return {
      summary: `Workflow contenant ${nodeCount} nœud(s)`,
      errors: [],
      suggestions: [
        'Ajoutez des descriptions aux nœuds',
        'Vérifiez les connexions entre nœuds'
      ],
      complexity,
      nodeCount,
      hasConnections
    };
  }
}

export const n8nWorkflowAnalyzer = N8nWorkflowAnalyzer.getInstance();
