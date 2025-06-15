
import { supabase } from '@/integrations/supabase/client';
import { Workflow } from '@/types/platform';

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

export interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_id: string;
  node_type: string;
  name: string;
  position_x: number;
  position_y: number;
  parameters: any;
}

export interface WorkflowConnection {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_index: number;
  target_index: number;
  connection_type: string;
}

class WorkflowService {
  private static instance: WorkflowService;

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  async createWorkflowFromJSON(jsonData: N8nWorkflowJSON): Promise<Workflow> {
    try {
      console.log('Création workflow depuis JSON:', jsonData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Validation des données JSON
      if (!jsonData.name || !jsonData.nodes) {
        throw new Error('Données de workflow invalides');
      }

      // Créer le workflow principal
      const workflowData = {
        user_id: user.id,
        name: jsonData.name,
        description: `Workflow importé avec ${jsonData.nodes?.length || 0} nœuds`,
        json_data: jsonData as any,
        status: jsonData.active ? 'active' : 'inactive',
        tags: jsonData.tags?.map(tag => tag.name) || []
      };

      console.log('Données workflow à insérer:', workflowData);

      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert(workflowData)
        .select()
        .single();

      if (workflowError) {
        console.error('Erreur création workflow:', workflowError);
        throw workflowError;
      }

      console.log('Workflow créé:', workflow);

      // Créer les nœuds et connexions
      await this.createNodesAndConnections(workflow.id, jsonData);

      return this.mapToWorkflow(workflow);
    } catch (error) {
      console.error('Erreur création workflow:', error);
      throw new Error(`Impossible de créer le workflow: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  private async createNodesAndConnections(workflowId: string, jsonData: N8nWorkflowJSON) {
    try {
      console.log('Création des nœuds et connexions pour workflow:', workflowId);

      // Créer les nœuds
      if (jsonData.nodes && jsonData.nodes.length > 0) {
        const nodes = jsonData.nodes.map(node => ({
          workflow_id: workflowId,
          node_id: node.id,
          node_type: node.type,
          name: node.name,
          position_x: node.position[0] || 0,
          position_y: node.position[1] || 0,
          parameters: node.parameters || {}
        }));

        console.log('Nœuds à insérer:', nodes);

        const { error: nodesError } = await supabase
          .from('workflow_nodes')
          .insert(nodes);

        if (nodesError) {
          console.error('Erreur insertion nœuds:', nodesError);
          throw nodesError;
        }

        console.log(`${nodes.length} nœuds créés avec succès`);
      }

      // Créer les connexions
      if (jsonData.connections) {
        const connections: any[] = [];
        
        Object.entries(jsonData.connections).forEach(([sourceNodeId, nodeConnections]) => {
          if (nodeConnections.main) {
            nodeConnections.main.forEach((connectionGroup, sourceIndex) => {
              if (Array.isArray(connectionGroup)) {
                connectionGroup.forEach(connection => {
                  connections.push({
                    workflow_id: workflowId,
                    source_node_id: sourceNodeId,
                    target_node_id: connection.node,
                    source_index: sourceIndex,
                    target_index: connection.index || 0,
                    connection_type: connection.type || 'main'
                  });
                });
              }
            });
          }
        });

        if (connections.length > 0) {
          console.log('Connexions à insérer:', connections);

          const { error: connectionsError } = await supabase
            .from('workflow_connections')
            .insert(connections);

          if (connectionsError) {
            console.error('Erreur insertion connexions:', connectionsError);
            throw connectionsError;
          }

          console.log(`${connections.length} connexions créées avec succès`);
        }
      }
    } catch (error) {
      console.error('Erreur création nœuds/connexions:', error);
      throw error;
    }
  }

  async updateWorkflowJSON(workflowId: string, jsonData: N8nWorkflowJSON): Promise<void> {
    try {
      console.log('Mise à jour workflow:', workflowId, jsonData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Mettre à jour le workflow
      const { error: workflowError } = await supabase
        .from('workflows')
        .update({
          json_data: jsonData as any,
          name: jsonData.name,
          tags: jsonData.tags?.map(tag => tag.name) || [],
          status: jsonData.active ? 'active' : 'inactive'
        })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (workflowError) throw workflowError;

      // Supprimer les anciens nœuds et connexions
      await Promise.all([
        supabase.from('workflow_nodes').delete().eq('workflow_id', workflowId),
        supabase.from('workflow_connections').delete().eq('workflow_id', workflowId)
      ]);

      // Recréer les nœuds et connexions
      await this.createNodesAndConnections(workflowId, jsonData);

      console.log('Workflow mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour workflow:', error);
      throw new Error(`Impossible de mettre à jour le workflow: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async getWorkflows(): Promise<Workflow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Utilisateur non authentifié');
        return [];
      }

      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération workflows:', error);
        throw error;
      }

      console.log(`${workflows?.length || 0} workflows récupérés`);
      return (workflows || []).map(workflow => this.mapToWorkflow(workflow));
    } catch (error) {
      console.error('Erreur récupération workflows:', error);
      return [];
    }
  }

  async getWorkflowWithDetails(workflowId: string): Promise<{
    workflow: any;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  } | null> {
    try {
      console.log('Récupération détails workflow:', workflowId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer le workflow, nœuds et connexions en parallèle
      const [workflowResult, nodesResult, connectionsResult] = await Promise.all([
        supabase
          .from('workflows')
          .select('*')
          .eq('id', workflowId)
          .eq('user_id', user.id)
          .single(),
        
        supabase
          .from('workflow_nodes')
          .select('*')
          .eq('workflow_id', workflowId),
        
        supabase
          .from('workflow_connections')
          .select('*')
          .eq('workflow_id', workflowId)
      ]);

      if (workflowResult.error) {
        console.error('Erreur récupération workflow:', workflowResult.error);
        throw workflowResult.error;
      }

      if (nodesResult.error) {
        console.error('Erreur récupération nœuds:', nodesResult.error);
        throw nodesResult.error;
      }

      if (connectionsResult.error) {
        console.error('Erreur récupération connexions:', connectionsResult.error);
        throw connectionsResult.error;
      }

      const result = {
        workflow: workflowResult.data,
        nodes: nodesResult.data || [],
        connections: connectionsResult.data || []
      };

      console.log('Détails workflow récupérés:', {
        workflow: result.workflow.name,
        nodesCount: result.nodes.length,
        connectionsCount: result.connections.length
      });

      return result;
    } catch (error) {
      console.error('Erreur récupération détails workflow:', error);
      return null;
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      console.log('Suppression workflow:', workflowId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Workflow supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression workflow:', error);
      throw new Error(`Impossible de supprimer le workflow: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async updateWorkflowStatus(workflowId: string, status: 'active' | 'inactive' | 'draft'): Promise<void> {
    try {
      console.log('Mise à jour statut workflow:', workflowId, status);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase
        .from('workflows')
        .update({ status })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Statut workflow mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour statut workflow:', error);
      throw new Error(`Impossible de mettre à jour le statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  private mapToWorkflow(workflow: any): Workflow {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      status: workflow.status as 'active' | 'inactive' | 'draft',
      trigger: workflow.json_data?.nodes?.find((n: any) => n.type.includes('trigger') || n.type.includes('start'))?.type || 'manual',
      nodes: [],
      executionCount: 0,
      successRate: 100,
      tags: workflow.tags || [],
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at
    };
  }
}

export const workflowService = WorkflowService.getInstance();
