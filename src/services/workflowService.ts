
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
      console.log('🚀 Création workflow depuis JSON:', jsonData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non authentifié');
        throw new Error('Utilisateur non authentifié');
      }

      // Validation des données JSON
      if (!jsonData.name?.trim()) {
        console.error('❌ Nom de workflow manquant');
        throw new Error('Le nom du workflow est requis');
      }

      if (!jsonData.nodes || jsonData.nodes.length === 0) {
        console.error('❌ Aucun nœud fourni');
        throw new Error('Au moins un nœud est requis');
      }

      // Validation des nœuds
      for (const node of jsonData.nodes) {
        if (!node.id || !node.name || !node.type) {
          console.error('❌ Nœud invalide:', node);
          throw new Error('Tous les nœuds doivent avoir un id, name et type');
        }
        if (!Array.isArray(node.position) || node.position.length !== 2) {
          console.error('❌ Position invalide pour le nœud:', node);
          throw new Error('La position du nœud doit être un tableau [x, y]');
        }
      }

      // Créer le workflow principal
      const workflowData = {
        user_id: user.id,
        name: jsonData.name.trim(),
        description: `Workflow avec ${jsonData.nodes.length} nœud(s)`,
        json_data: jsonData as any,
        status: jsonData.active ? 'active' : 'inactive',
        tags: jsonData.tags?.map(tag => tag.name) || []
      };

      console.log('📝 Données workflow à insérer:', {
        ...workflowData,
        json_data: '[OBJECT]' // Éviter d'afficher tout l'objet JSON
      });

      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert(workflowData)
        .select()
        .single();

      if (workflowError) {
        console.error('❌ Erreur création workflow:', workflowError);
        throw new Error(`Erreur base de données: ${workflowError.message}`);
      }

      console.log('✅ Workflow créé avec ID:', workflow.id);

      // Créer les nœuds et connexions
      await this.createNodesAndConnections(workflow.id, jsonData);

      console.log('🎉 Workflow créé avec succès!');
      return this.mapToWorkflow(workflow);
    } catch (error) {
      console.error('💥 Erreur création workflow:', error);
      
      if (error instanceof Error) {
        throw new Error(`Impossible de créer le workflow: ${error.message}`);
      } else {
        throw new Error('Impossible de créer le workflow: Erreur inconnue');
      }
    }
  }

  private async createNodesAndConnections(workflowId: string, jsonData: N8nWorkflowJSON) {
    try {
      console.log('🔗 Création des nœuds et connexions pour workflow:', workflowId);

      // Créer les nœuds
      if (jsonData.nodes && jsonData.nodes.length > 0) {
        const nodes = jsonData.nodes.map(node => {
          const nodeData = {
            workflow_id: workflowId,
            node_id: node.id,
            node_type: node.type,
            name: node.name,
            position_x: Number(node.position[0]) || 0,
            position_y: Number(node.position[1]) || 0,
            parameters: node.parameters || {}
          };
          
          console.log('📦 Nœud préparé:', nodeData);
          return nodeData;
        });

        console.log(`📊 Insertion de ${nodes.length} nœuds...`);

        const { error: nodesError } = await supabase
          .from('workflow_nodes')
          .insert(nodes);

        if (nodesError) {
          console.error('❌ Erreur insertion nœuds:', nodesError);
          throw new Error(`Erreur lors de l'insertion des nœuds: ${nodesError.message}`);
        }

        console.log(`✅ ${nodes.length} nœuds créés avec succès`);
      }

      // Créer les connexions
      if (jsonData.connections && Object.keys(jsonData.connections).length > 0) {
        const connections: any[] = [];
        
        Object.entries(jsonData.connections).forEach(([sourceNodeId, nodeConnections]) => {
          if (nodeConnections.main) {
            nodeConnections.main.forEach((connectionGroup, sourceIndex) => {
              if (Array.isArray(connectionGroup)) {
                connectionGroup.forEach(connection => {
                  const connectionData = {
                    workflow_id: workflowId,
                    source_node_id: sourceNodeId,
                    target_node_id: connection.node,
                    source_index: sourceIndex,
                    target_index: connection.index || 0,
                    connection_type: connection.type || 'main'
                  };
                  
                  console.log('🔗 Connexion préparée:', connectionData);
                  connections.push(connectionData);
                });
              }
            });
          }
        });

        if (connections.length > 0) {
          console.log(`🔗 Insertion de ${connections.length} connexions...`);

          const { error: connectionsError } = await supabase
            .from('workflow_connections')
            .insert(connections);

          if (connectionsError) {
            console.error('❌ Erreur insertion connexions:', connectionsError);
            throw new Error(`Erreur lors de l'insertion des connexions: ${connectionsError.message}`);
          }

          console.log(`✅ ${connections.length} connexions créées avec succès`);
        } else {
          console.log('ℹ️ Aucune connexion à créer');
        }
      } else {
        console.log('ℹ️ Aucune connexion définie');
      }
    } catch (error) {
      console.error('💥 Erreur création nœuds/connexions:', error);
      throw error;
    }
  }

  async updateWorkflowJSON(workflowId: string, jsonData: N8nWorkflowJSON): Promise<void> {
    try {
      console.log('🔄 Mise à jour workflow:', workflowId);

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

      if (workflowError) {
        console.error('❌ Erreur mise à jour workflow:', workflowError);
        throw workflowError;
      }

      // Supprimer les anciens nœuds et connexions
      console.log('🗑️ Suppression des anciens nœuds et connexions...');
      const [nodesResult, connectionsResult] = await Promise.allSettled([
        supabase.from('workflow_nodes').delete().eq('workflow_id', workflowId),
        supabase.from('workflow_connections').delete().eq('workflow_id', workflowId)
      ]);

      if (nodesResult.status === 'rejected') {
        console.warn('⚠️ Erreur suppression nœuds:', nodesResult.reason);
      }
      if (connectionsResult.status === 'rejected') {
        console.warn('⚠️ Erreur suppression connexions:', connectionsResult.reason);
      }

      // Recréer les nœuds et connexions
      await this.createNodesAndConnections(workflowId, jsonData);

      console.log('✅ Workflow mis à jour avec succès');
    } catch (error) {
      console.error('💥 Erreur mise à jour workflow:', error);
      throw new Error(`Impossible de mettre à jour le workflow: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async getWorkflows(): Promise<Workflow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ Utilisateur non authentifié');
        return [];
      }

      console.log('📊 Récupération des workflows pour l\'utilisateur:', user.id);

      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération workflows:', error);
        throw error;
      }

      console.log(`✅ ${workflows?.length || 0} workflows récupérés`);
      return (workflows || []).map(workflow => this.mapToWorkflow(workflow));
    } catch (error) {
      console.error('💥 Erreur récupération workflows:', error);
      return [];
    }
  }

  async getWorkflowWithDetails(workflowId: string): Promise<{
    workflow: any;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  } | null> {
    try {
      console.log('🔍 Récupération détails workflow:', workflowId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer le workflow, nœuds et connexions en parallèle
      const [workflowResult, nodesResult, connectionsResult] = await Promise.allSettled([
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

      if (workflowResult.status === 'rejected' || workflowResult.value.error) {
        console.error('❌ Erreur récupération workflow:', workflowResult.status === 'rejected' ? workflowResult.reason : workflowResult.value.error);
        return null;
      }

      const nodes = nodesResult.status === 'fulfilled' && !nodesResult.value.error ? nodesResult.value.data || [] : [];
      const connections = connectionsResult.status === 'fulfilled' && !connectionsResult.value.error ? connectionsResult.value.data || [] : [];

      const result = {
        workflow: workflowResult.value.data,
        nodes,
        connections
      };

      console.log('✅ Détails workflow récupérés:', {
        workflow: result.workflow.name,
        nodesCount: result.nodes.length,
        connectionsCount: result.connections.length
      });

      return result;
    } catch (error) {
      console.error('💥 Erreur récupération détails workflow:', error);
      return null;
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      console.log('🗑️ Suppression workflow:', workflowId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erreur suppression workflow:', error);
        throw error;
      }

      console.log('✅ Workflow supprimé avec succès');
    } catch (error) {
      console.error('💥 Erreur suppression workflow:', error);
      throw new Error(`Impossible de supprimer le workflow: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async updateWorkflowStatus(workflowId: string, status: 'active' | 'inactive' | 'draft'): Promise<void> {
    try {
      console.log('🔄 Mise à jour statut workflow:', workflowId, status);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase
        .from('workflows')
        .update({ status })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        throw error;
      }

      console.log('✅ Statut workflow mis à jour avec succès');
    } catch (error) {
      console.error('💥 Erreur mise à jour statut workflow:', error);
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
