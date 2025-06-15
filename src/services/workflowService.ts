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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer le workflow principal
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: jsonData.name,
          description: `Workflow importé avec ${jsonData.nodes?.length || 0} nœuds`,
          json_data: jsonData as any,
          status: 'inactive',
          tags: jsonData.tags?.map(tag => tag.name) || []
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Créer les nœuds
      if (jsonData.nodes && jsonData.nodes.length > 0) {
        const nodes = jsonData.nodes.map(node => ({
          workflow_id: workflow.id,
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
                  workflow_id: workflow.id,
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
    } catch (error) {
      console.error('Erreur création workflow:', error);
      throw new Error('Impossible de créer le workflow');
    }
  }

  async updateWorkflowJSON(workflowId: string, jsonData: N8nWorkflowJSON): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Mettre à jour le workflow
      const { error: workflowError } = await supabase
        .from('workflows')
        .update({
          json_data: jsonData as any,
          name: jsonData.name,
          tags: jsonData.tags?.map(tag => tag.name) || []
        })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (workflowError) throw workflowError;

      // Supprimer les anciens nœuds et connexions
      await supabase
        .from('workflow_nodes')
        .delete()
        .eq('workflow_id', workflowId);

      await supabase
        .from('workflow_connections')
        .delete()
        .eq('workflow_id', workflowId);

      // Recréer les nœuds
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

      // Recréer les connexions
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
    } catch (error) {
      console.error('Erreur mise à jour workflow:', error);
      throw new Error('Impossible de mettre à jour le workflow');
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

      return workflows.map(workflow => ({
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
      }));
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

      const { error } = await supabase
        .from('workflows')
        .update({ status })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur mise à jour statut workflow:', error);
      throw new Error('Impossible de mettre à jour le statut');
    }
  }
}

export const workflowService = WorkflowService.getInstance();
