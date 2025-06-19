import { supabase } from '@/integrations/supabase/client';
import { WorkflowNode, WorkflowConnection } from '@/types/workflow';
import { convertNullToUndefined } from '@/lib/typeHelpers';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  json_data: any;
  status: string;
  user_id: string;
  n8n_workflow_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowWithNodes {
  workflow: Workflow;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface N8nWorkflowJSON {
  id?: string;
  name: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters?: any;
  }>;
  connections: Record<string, any>;
  active?: boolean;
  settings?: any;
  staticData?: any;
  tags?: Array<{ name: string }>;
}

class WorkflowService {
  async getAllWorkflows(): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération workflows:', error);
      throw new Error(`Erreur de récupération des workflows: ${error.message}`);
    }

    // Convert database types to interface types
    return (data || []).map(item => ({
      ...item,
      description: item.description || undefined,
      n8n_workflow_id: item.n8n_workflow_id || undefined,
      tags: item.tags || undefined
    }));
  }

  async getWorkflowById(id: string): Promise<WorkflowWithNodes | null> {
    console.log('🔍 Récupération workflow:', id);

    try {
      // Récupérer le workflow principal
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (workflowError) {
        console.error('❌ Erreur workflow:', workflowError);
        throw workflowError;
      }

      if (!workflow) {
        console.log('❌ Workflow non trouvé:', id);
        return null;
      }

      // Récupérer les nœuds
      const { data: nodes, error: nodesError } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', id);

      if (nodesError) {
        console.error('❌ Erreur nœuds:', nodesError);
        throw nodesError;
      }

      // Récupérer les connexions
      const { data: connections, error: connectionsError } = await supabase
        .from('workflow_connections')
        .select('*')
        .eq('workflow_id', id);

      if (connectionsError) {
        console.error('❌ Erreur connexions:', connectionsError);
        throw connectionsError;
      }

      console.log('✅ Workflow récupéré:', {
        workflow: workflow.name,
        nodes: nodes?.length || 0,
        connections: connections?.length || 0
      });

      // Convert database types to interface types
      const convertedWorkflow: Workflow = {
        ...workflow,
        description: workflow.description || undefined,
        n8n_workflow_id: workflow.n8n_workflow_id || undefined,
        tags: workflow.tags || undefined
      };

      const convertedNodes: WorkflowNode[] = (nodes || []).map(node => ({
        id: node.id,
        workflow_id: node.workflow_id,
        node_id: node.node_id,
        node_type: node.node_type,
        name: node.name,
        position_x: node.position_x,
        position_y: node.position_y,
        parameters: node.parameters || {}
      }));

      const convertedConnections: WorkflowConnection[] = (connections || []).map(conn => ({
        id: conn.id,
        workflow_id: conn.workflow_id,
        source_node_id: conn.source_node_id,
        target_node_id: conn.target_node_id,
        source_index: conn.source_index ?? 0,
        target_index: conn.target_index ?? 0,
        connection_type: conn.connection_type || 'main'
      }));

      return {
        workflow: convertedWorkflow,
        nodes: convertedNodes,
        connections: convertedConnections
      };

    } catch (error) {
      console.error('❌ Erreur complète récupération workflow:', error);
      throw error;
    }
  }

  async createWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const newWorkflow = {
      name: workflow.name || 'Nouveau Workflow',
      description: workflow.description || '',
      json_data: workflow.json_data || { nodes: [], connections: {} },
      status: workflow.status || 'inactive',
      user_id: userData.user.id,
      tags: workflow.tags || [],
      n8n_workflow_id: workflow.n8n_workflow_id
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert([newWorkflow])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création workflow:', error);
      throw new Error(`Erreur de création: ${error.message}`);
    }

    console.log('✅ Workflow créé:', data.id);
    
    // Convert database type to interface type
    return {
      ...data,
      description: data.description || undefined,
      n8n_workflow_id: data.n8n_workflow_id || undefined,
      tags: data.tags || undefined
    };
  }

  async createWorkflowFromJSON(workflowData: N8nWorkflowJSON): Promise<Workflow> {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const workflow = await this.createWorkflow({
      name: workflowData.name,
      description: `Workflow importé: ${workflowData.name}`,
      json_data: workflowData,
      status: workflowData.active ? 'active' : 'inactive',
      tags: workflowData.tags?.map(tag => tag.name) || []
    });

    // Create nodes
    if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
      for (const node of workflowData.nodes) {
        await supabase
          .from('workflow_nodes')
          .insert([{
            workflow_id: workflow.id,
            node_id: node.id,
            node_type: node.type,
            name: node.name,
            position_x: node.position[0] || 0,
            position_y: node.position[1] || 0,
            parameters: node.parameters || {}
          }]);
      }
    }

    // Create connections
    if (workflowData.connections && typeof workflowData.connections === 'object') {
      for (const [sourceNodeId, sourceConnections] of Object.entries(workflowData.connections)) {
        if (sourceConnections && typeof sourceConnections === 'object') {
          for (const [connectionType, connectionArray] of Object.entries(sourceConnections)) {
            if (Array.isArray(connectionArray)) {
              connectionArray.forEach((connGroup: any, sourceIndex: number) => {
                if (Array.isArray(connGroup)) {
                  connGroup.forEach((conn: any) => {
                    supabase
                      .from('workflow_connections')
                      .insert([{
                        workflow_id: workflow.id,
                        source_node_id: sourceNodeId,
                        target_node_id: conn.node,
                        source_index: sourceIndex,
                        target_index: conn.index || 0,
                        connection_type: connectionType
                      }]);
                  });
                }
              });
            }
          }
        }
      }
    }

    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur mise à jour workflow:', error);
      throw new Error(`Erreur de mise à jour: ${error.message}`);
    }

    console.log('✅ Workflow mis à jour:', id);
  }

  async deleteWorkflow(id: string): Promise<void> {
    // Supprimer d'abord les nœuds et connexions liés
    const { error: nodesError } = await supabase
      .from('workflow_nodes')
      .delete()
      .eq('workflow_id', id);

    if (nodesError) {
      console.error('❌ Erreur suppression nœuds:', nodesError);
    }

    const { error: connectionsError } = await supabase
      .from('workflow_connections')
      .delete()
      .eq('workflow_id', id);

    if (connectionsError) {
      console.error('❌ Erreur suppression connexions:', connectionsError);
    }

    // Supprimer le workflow
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur suppression workflow:', error);
      throw new Error(`Erreur de suppression: ${error.message}`);
    }

    console.log('✅ Workflow supprimé:', id);
  }

  async importWorkflowFromN8n(n8nWorkflow: any): Promise<WorkflowWithNodes> {
    console.log('📥 Import workflow n8n:', n8nWorkflow.name);

    try {
      // Créer le workflow principal
      const workflow = await this.createWorkflow({
        name: n8nWorkflow.name,
        description: `Importé depuis n8n: ${n8nWorkflow.name}`,
        json_data: n8nWorkflow,
        status: n8nWorkflow.active ? 'active' : 'inactive',
        n8n_workflow_id: n8nWorkflow.id?.toString(),
        tags: n8nWorkflow.tags || []
      });

      // Créer les nœuds
      const nodes: WorkflowNode[] = [];
      if (n8nWorkflow.nodes && Array.isArray(n8nWorkflow.nodes)) {
        for (const n8nNode of n8nWorkflow.nodes) {
          const node = {
            id: undefined, // Auto-généré par Supabase
            workflow_id: workflow.id,
            node_id: n8nNode.id,
            node_type: n8nNode.type,
            name: n8nNode.name,
            position_x: n8nNode.position?.[0] || 0,
            position_y: n8nNode.position?.[1] || 0,
            parameters: n8nNode.parameters || {}
          };

          const { data: createdNode, error } = await supabase
            .from('workflow_nodes')
            .insert([node])
            .select()
            .single();

          if (error) {
            console.error('❌ Erreur création nœud:', error);
            continue;
          }

          nodes.push(createdNode);
        }
      }

      // Créer les connexions
      const connections: WorkflowConnection[] = [];
      if (n8nWorkflow.connections && typeof n8nWorkflow.connections === 'object') {
        for (const [sourceNodeId, sourceConnections] of Object.entries(n8nWorkflow.connections)) {
          if (sourceConnections && typeof sourceConnections === 'object') {
            for (const [connectionType, connectionArray] of Object.entries(sourceConnections)) {
              if (Array.isArray(connectionArray)) {
                connectionArray.forEach((connGroup, sourceIndex) => {
                  if (Array.isArray(connGroup)) {
                    connGroup.forEach(conn => {
                      const connection = {
                        id: undefined, // Auto-généré par Supabase
                        workflow_id: workflow.id,
                        source_node_id: sourceNodeId,
                        target_node_id: conn.node,
                        source_index: sourceIndex,
                        target_index: conn.index || 0,
                        connection_type: connectionType
                      };

                      supabase
                        .from('workflow_connections')
                        .insert([connection])
                        .select()
                        .single()
                        .then(({ data: createdConnection, error }) => {
                          if (error) {
                            console.error('❌ Erreur création connexion:', error);
                          } else if (createdConnection) {
                            connections.push({
                              id: createdConnection.id,
                              workflow_id: createdConnection.workflow_id,
                              source_node_id: createdConnection.source_node_id,
                              target_node_id: createdConnection.target_node_id,
                              source_index: createdConnection.source_index ?? 0,
                              target_index: createdConnection.target_index ?? 0,
                              connection_type: createdConnection.connection_type || 'main'
                            });
                          }
                        });
                    });
                  }
                });
              }
            }
          }
        }
      }

      console.log('✅ Workflow importé:', {
        id: workflow.id,
        name: workflow.name,
        nodes: nodes.length,
        connections: connections.length
      });

      return {
        workflow,
        nodes,
        connections
      };

    } catch (error) {
      console.error('❌ Erreur import workflow:', error);
      throw error;
    }
  }

  async exportWorkflowToN8n(workflowId: string): Promise<any> {
    const workflowData = await this.getWorkflowById(workflowId);
    
    if (!workflowData) {
      throw new Error('Workflow non trouvé');
    }

    const { workflow, nodes, connections } = workflowData;

    // Convertir au format n8n
    const n8nWorkflow = {
      name: workflow.name,
      active: workflow.status === 'active',
      nodes: nodes.map(node => ({
        id: node.node_id,
        name: node.name,
        type: node.node_type,
        position: [node.position_x, node.position_y],
        parameters: node.parameters
      })),
      connections: connections.reduce((acc, conn) => {
        if (!acc[conn.source_node_id]) {
          acc[conn.source_node_id] = { main: [] };
        }
        if (!acc[conn.source_node_id].main[conn.source_index]) {
          acc[conn.source_node_id].main[conn.source_index] = [];
        }
        acc[conn.source_node_id].main[conn.source_index].push({
          node: conn.target_node_id,
          type: conn.connection_type,
          index: conn.target_index
        });
        return acc;
      }, {} as any),
      tags: workflow.tags || []
    };

    return n8nWorkflow;
  }

  async duplicateWorkflow(sourceId: string, newName?: string): Promise<Workflow> {
    const sourceWorkflow = await this.getWorkflowById(sourceId);
    
    if (!sourceWorkflow) {
      throw new Error('Workflow source non trouvé');
    }

    const { workflow, nodes, connections } = sourceWorkflow;

    // Créer le nouveau workflow
    const newWorkflow = await this.createWorkflow({
      name: newName || `${workflow.name} (copie)`,
      description: workflow.description,
      json_data: workflow.json_data,
      status: 'inactive', // Les copies sont inactives par défaut
      tags: workflow.tags
    });

    // Dupliquer les nœuds
    const nodeIdMapping: { [oldId: string]: string } = {};
    for (const node of nodes) {
      const newNodeId = `${node.node_id}_copy_${Date.now()}`;
      nodeIdMapping[node.node_id] = newNodeId;

      await supabase
        .from('workflow_nodes')
        .insert([{
          workflow_id: newWorkflow.id,
          node_id: newNodeId,
          node_type: node.node_type,
          name: node.name,
          position_x: node.position_x + 50, // Décaler légèrement
          position_y: node.position_y + 50,
          parameters: node.parameters
        }]);
    }

    // Dupliquer les connexions avec les nouveaux IDs
    for (const connection of connections) {
      const newSourceId = nodeIdMapping[connection.source_node_id];
      const newTargetId = nodeIdMapping[connection.target_node_id];

      if (newSourceId && newTargetId) {
        await supabase
          .from('workflow_connections')
          .insert([{
            workflow_id: newWorkflow.id,
            source_node_id: newSourceId,
            target_node_id: newTargetId,
            source_index: connection.source_index,
            target_index: connection.target_index,
            connection_type: connection.connection_type
          }]);
      }
    }

    console.log('✅ Workflow dupliqué:', newWorkflow.id);
    return newWorkflow;
  }

  async getUserWorkflows(userId?: string): Promise<Workflow[]> {
    let query = supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération workflows utilisateur:', error);
      throw new Error(`Erreur de récupération: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      description: item.description || undefined,
      n8n_workflow_id: item.n8n_workflow_id || undefined,
      tags: item.tags || undefined
    }));
  }

  async getWorkflowsByTag(tag: string): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .contains('tags', [tag])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération workflows par tag:', error);
      throw new Error(`Erreur de récupération: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      description: item.description || undefined,
      n8n_workflow_id: item.n8n_workflow_id || undefined,
      tags: item.tags || undefined
    }));
  }

  async searchWorkflows(query: string): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur recherche workflows:', error);
      throw new Error(`Erreur de recherche: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      description: item.description || undefined,
      n8n_workflow_id: item.n8n_workflow_id || undefined,
      tags: item.tags || undefined
    }));
  }

  async getWorkflowStats() {
    const { data: totalData, error: totalError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true });

    const { data: activeData, error: activeError } = await supabase
      .from('workflows')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (totalError || activeError) {
      console.error('❌ Erreur stats workflows:', totalError || activeError);
      throw new Error('Erreur de récupération des statistiques');
    }

    return {
      total: totalData?.length || 0,
      active: activeData?.length || 0,
      inactive: (totalData?.length || 0) - (activeData?.length || 0)
    };
  }
}

export const workflowService = new WorkflowService();
