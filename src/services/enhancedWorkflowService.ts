import { supabase } from '@/integrations/supabase/client';
import { Workflow } from '@/types/platform';
import { n8nService } from './n8nService';

export interface N8nWorkflowJSON {
  id?: string;
  name: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    typeVersion?: number;
    position: [number, number];
    parameters?: any;
    credentials?: any;
  }>;
  connections: {
    [key: string]: {
      main?: Array<Array<{
        node: string;
        type: string;
        index: number;
      }>>;
    };
  };
  active?: boolean;
  settings?: any;
  staticData?: any;
  meta?: any;
  tags?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  category: string;
  workflow: N8nWorkflowJSON;
}

class EnhancedWorkflowService {
  private static instance: EnhancedWorkflowService;

  public static getInstance(): EnhancedWorkflowService {
    if (!EnhancedWorkflowService.instance) {
      EnhancedWorkflowService.instance = new EnhancedWorkflowService();
    }
    return EnhancedWorkflowService.instance;
  }

  // Créer un workflow depuis un template
  async createWorkflowFromTemplate(template: WorkflowTemplate): Promise<Workflow> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer d'abord dans n8n si disponible
      let n8nWorkflowId: string | undefined;
      try {
        const n8nWorkflow = await n8nService.createWorkflow(template.workflow);
        n8nWorkflowId = n8nWorkflow.id;
      } catch (error) {
        console.log('n8n non disponible, création locale uniquement');
      }

      // Créer dans la base locale
      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: template.name,
          description: template.description,
          json_data: template.workflow as any,
          n8n_workflow_id: n8nWorkflowId,
          status: 'inactive',
          tags: [template.category]
        })
        .select()
        .single();

      if (error) throw error;

      // Créer les nœuds et connexions
      await this.createNodesAndConnections(workflow.id, template.workflow);

      return this.mapToWorkflow(workflow);
    } catch (error) {
      console.error('Erreur création workflow depuis template:', error);
      throw new Error('Impossible de créer le workflow depuis le template');
    }
  }

  // Synchroniser avec n8n
  async syncWithN8n(workflowId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (workflow.n8n_workflow_id) {
        // Synchroniser depuis n8n
        const n8nWorkflow = await n8nService.getWorkflow(workflow.n8n_workflow_id);
        
        // Mettre à jour la version locale
        await supabase
          .from('workflows')
          .update({
            json_data: n8nWorkflow as any,
            status: n8nWorkflow.active ? 'active' : 'inactive'
          })
          .eq('id', workflowId);
      } else {
        // Créer dans n8n si pas encore fait
        const jsonData = workflow.json_data as unknown as N8nWorkflowJSON;
        const n8nWorkflow = await n8nService.createWorkflow(jsonData);
        
        await supabase
          .from('workflows')
          .update({ n8n_workflow_id: n8nWorkflow.id })
          .eq('id', workflowId);
      }
    } catch (error) {
      console.error('Erreur synchronisation n8n:', error);
      throw new Error('Impossible de synchroniser avec n8n');
    }
  }

  // Dupliquer un workflow
  async duplicateWorkflow(workflowId: string, newName?: string): Promise<Workflow> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const details = await this.getWorkflowWithDetails(workflowId);
      if (!details) throw new Error('Workflow non trouvé');

      const jsonData = details.workflow.json_data as unknown as N8nWorkflowJSON;
      const duplicatedWorkflow = {
        ...jsonData,
        name: newName || `${details.workflow.name} (Copie)`,
        id: undefined // Retirer l'ID pour créer un nouveau workflow
      };

      return await this.createWorkflowFromJSON(duplicatedWorkflow);
    } catch (error) {
      console.error('Erreur duplication workflow:', error);
      throw new Error('Impossible de dupliquer le workflow');
    }
  }

  // Exporter un workflow
  async exportWorkflow(workflowId: string): Promise<N8nWorkflowJSON> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return workflow.json_data as unknown as N8nWorkflowJSON;
    } catch (error) {
      console.error('Erreur export workflow:', error);
      throw new Error('Impossible d\'exporter le workflow');
    }
  }

  // Obtenir les statistiques d'un workflow
  async getWorkflowStats(workflowId: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: Date;
  }> {
    try {
      const { data: executions, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId);

      if (error) throw error;

      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'success').length;
      const failedExecutions = executions.filter(e => e.status === 'error').length;
      
      const executionTimes = executions
        .filter(e => e.started_at && e.finished_at)
        .map(e => new Date(e.finished_at!).getTime() - new Date(e.started_at).getTime());
      
      const averageExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
        : 0;

      const lastExecution = executions.length > 0 
        ? new Date(Math.max(...executions.map(e => new Date(e.started_at).getTime())))
        : undefined;

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime,
        lastExecution
      };
    } catch (error) {
      console.error('Erreur statistiques workflow:', error);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      };
    }
  }

  // Méthodes existantes du service original
  async createWorkflowFromJSON(jsonData: N8nWorkflowJSON): Promise<Workflow> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer d'abord dans n8n si disponible
      let n8nWorkflowId: string | undefined;
      try {
        const n8nWorkflow = await n8nService.createWorkflow(jsonData);
        n8nWorkflowId = n8nWorkflow.id;
      } catch (error) {
        console.log('n8n non disponible, création locale uniquement');
      }

      // Créer le workflow principal
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: jsonData.name,
          description: `Workflow importé avec ${jsonData.nodes?.length || 0} nœuds`,
          json_data: jsonData as any,
          n8n_workflow_id: n8nWorkflowId,
          status: 'inactive',
          tags: jsonData.tags?.map(tag => tag.name) || []
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Créer les nœuds et connexions
      await this.createNodesAndConnections(workflow.id, jsonData);

      return this.mapToWorkflow(workflow);
    } catch (error) {
      console.error('Erreur création workflow:', error);
      throw new Error('Impossible de créer le workflow');
    }
  }

  private async createNodesAndConnections(workflowId: string, jsonData: N8nWorkflowJSON) {
    // Créer les nœuds
    if (jsonData.nodes && jsonData.nodes.length > 0) {
      const nodes = jsonData.nodes.map(node => ({
        workflow_id: workflowId,
        node_id: node.id,
        node_type: node.type,
        name: node.name,
        position_x: node.position[0],
        position_y: node.position[1],
        parameters: node.parameters || {}
      }));

      const { error: nodesError } = await supabase
        .from('workflow_nodes')
        .insert(nodes);

      if (nodesError) throw nodesError;
    }

    // Créer les connexions
    if (jsonData.connections) {
      const connections: any[] = [];
      
      Object.entries(jsonData.connections).forEach(([sourceNodeId, nodeConnections]) => {
        if (nodeConnections.main) {
          nodeConnections.main.forEach((connectionGroup, sourceIndex) => {
            connectionGroup.forEach(connection => {
              connections.push({
                workflow_id: workflowId,
                source_node_id: sourceNodeId,
                target_node_id: connection.node,
                source_index: sourceIndex,
                target_index: connection.index,
                connection_type: connection.type
              });
            });
          });
        }
      });

      if (connections.length > 0) {
        const { error: connectionsError } = await supabase
          .from('workflow_connections')
          .insert(connections);

        if (connectionsError) throw connectionsError;
      }
    }
  }

  async getWorkflows(): Promise<Workflow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return workflows.map(workflow => this.mapToWorkflow(workflow));
    } catch (error) {
      console.error('Erreur récupération workflows:', error);
      return [];
    }
  }

  async getWorkflowWithDetails(workflowId: string): Promise<{
    workflow: any;
    nodes: any[];
    connections: any[];
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Récupérer le workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('user_id', user.id)
        .single();

      if (workflowError) throw workflowError;

      // Récupérer les nœuds
      const { data: nodes, error: nodesError } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', workflowId);

      if (nodesError) throw nodesError;

      // Récupérer les connexions
      const { data: connections, error: connectionsError } = await supabase
        .from('workflow_connections')
        .select('*')
        .eq('workflow_id', workflowId);

      if (connectionsError) throw connectionsError;

      return {
        workflow,
        nodes: nodes || [],
        connections: connections || []
      };
    } catch (error) {
      console.error('Erreur récupération détails workflow:', error);
      return null;
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Supprimer aussi de n8n si existe
      const { data: workflow } = await supabase
        .from('workflows')
        .select('n8n_workflow_id')
        .eq('id', workflowId)
        .eq('user_id', user.id)
        .single();

      if (workflow?.n8n_workflow_id) {
        try {
          await n8nService.deleteWorkflow(workflow.n8n_workflow_id);
        } catch (error) {
          console.log('Erreur suppression n8n, continuons avec la suppression locale');
        }
      }

      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression workflow:', error);
      throw new Error('Impossible de supprimer le workflow');
    }
  }

  async updateWorkflowStatus(workflowId: string, status: 'active' | 'inactive' | 'draft'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mettre à jour le statut local
      const { error } = await supabase
        .from('workflows')
        .update({ status })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Synchroniser avec n8n si possible
      const { data: workflow } = await supabase
        .from('workflows')
        .select('n8n_workflow_id')
        .eq('id', workflowId)
        .eq('user_id', user.id)
        .single();

      if (workflow?.n8n_workflow_id) {
        try {
          if (status === 'active') {
            await n8nService.activateWorkflow(workflow.n8n_workflow_id);
          } else {
            await n8nService.deactivateWorkflow(workflow.n8n_workflow_id);
          }
        } catch (error) {
          console.log('Erreur synchronisation statut n8n');
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour statut workflow:', error);
      throw new Error('Impossible de mettre à jour le statut');
    }
  }

  private mapToWorkflow(workflow: any): Workflow {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      status: workflow.status as 'active' | 'inactive' | 'draft',
      trigger: 'manual',
      nodes: [],
      executionCount: 0,
      successRate: 100,
      tags: workflow.tags || [],
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at
    };
  }
}

export const enhancedWorkflowService = EnhancedWorkflowService.getInstance();
