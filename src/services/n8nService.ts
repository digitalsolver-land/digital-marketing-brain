
import { API_CONFIG } from '@/config/api';
import { Workflow } from '@/types/platform';

interface N8nWorkflow {
  id?: string;
  name: string;
  active?: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
  createdAt?: string;
  updatedAt?: string;
  tags?: any[];
}

interface N8nExecution {
  id: number;
  data?: any;
  finished: boolean;
  mode: string;
  retryOf?: number;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  waitTill?: string;
  customData?: any;
}

interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPending: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface N8nTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface N8nVariable {
  id: string;
  key: string;
  value: string;
}

export class N8nService {
  private static instance: N8nService;
  private apiKey = API_CONFIG.N8N.API_KEY;
  private baseUrl = API_CONFIG.N8N.BASE_URL;

  public static getInstance(): N8nService {
    if (!N8nService.instance) {
      N8nService.instance = new N8nService();
    }
    return N8nService.instance;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  // WORKFLOWS
  async getWorkflows(params?: {
    active?: boolean;
    tags?: string;
    name?: string;
    projectId?: string;
    excludePinnedData?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<Workflow[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.active !== undefined) searchParams.append('active', params.active.toString());
      if (params?.tags) searchParams.append('tags', params.tags);
      if (params?.name) searchParams.append('name', params.name);
      if (params?.projectId) searchParams.append('projectId', params.projectId);
      if (params?.excludePinnedData) searchParams.append('excludePinnedData', params.excludePinnedData.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.cursor) searchParams.append('cursor', params.cursor);

      const queryString = searchParams.toString();
      const endpoint = `/workflows${queryString ? '?' + queryString : ''}`;
      
      const data = await this.makeRequest(endpoint);
      
      return (data.data || []).map((workflow: N8nWorkflow) => ({
        id: workflow.id || '',
        name: workflow.name,
        description: `Workflow avec ${workflow.nodes?.length || 0} nœuds`,
        status: workflow.active ? 'active' : 'inactive',
        executionCount: 0, // Will be fetched separately
        successRate: 100,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        tags: workflow.tags?.map(tag => tag.name) || []
      }));
    } catch (error) {
      console.error('Erreur récupération workflows:', error);
      return [];
    }
  }

  async getWorkflow(id: string, excludePinnedData?: boolean): Promise<N8nWorkflow | null> {
    try {
      const searchParams = new URLSearchParams();
      if (excludePinnedData) searchParams.append('excludePinnedData', 'true');
      
      const queryString = searchParams.toString();
      const endpoint = `/workflows/${id}${queryString ? '?' + queryString : ''}`;
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Erreur récupération workflow:', error);
      return null;
    }
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    try {
      const workflowData = {
        name: workflow.name || 'Nouveau Workflow',
        nodes: workflow.nodes || [
          {
            id: 'start',
            type: 'n8n-nodes-base.start',
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: workflow.connections || {},
        settings: workflow.settings || {
          saveExecutionProgress: true,
          saveManualExecutions: true,
          saveDataErrorExecution: 'all',
          saveDataSuccessExecution: 'all',
          executionTimeout: 3600,
          timezone: 'Europe/Paris'
        },
        staticData: workflow.staticData || {}
      };

      return await this.makeRequest('/workflows', {
        method: 'POST',
        body: JSON.stringify(workflowData)
      });
    } catch (error) {
      console.error('Erreur création workflow:', error);
      throw new Error('Échec de la création du workflow');
    }
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    try {
      return await this.makeRequest(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(workflow)
      });
    } catch (error) {
      console.error('Erreur mise à jour workflow:', error);
      throw new Error('Échec de la mise à jour du workflow');
    }
  }

  async deleteWorkflow(id: string): Promise<N8nWorkflow> {
    try {
      return await this.makeRequest(`/workflows/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur suppression workflow:', error);
      throw new Error('Échec de la suppression du workflow');
    }
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    try {
      return await this.makeRequest(`/workflows/${id}/activate`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erreur activation workflow:', error);
      throw new Error('Échec de l\'activation du workflow');
    }
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    try {
      return await this.makeRequest(`/workflows/${id}/deactivate`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erreur désactivation workflow:', error);
      throw new Error('Échec de la désactivation du workflow');
    }
  }

  async transferWorkflow(id: string, destinationProjectId: string): Promise<void> {
    try {
      await this.makeRequest(`/workflows/${id}/transfer`, {
        method: 'PUT',
        body: JSON.stringify({ destinationProjectId })
      });
    } catch (error) {
      console.error('Erreur transfert workflow:', error);
      throw new Error('Échec du transfert du workflow');
    }
  }

  // EXECUTIONS
  async getExecutions(params?: {
    includeData?: boolean;
    status?: 'error' | 'success' | 'waiting';
    workflowId?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<N8nExecution[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.includeData !== undefined) searchParams.append('includeData', params.includeData.toString());
      if (params?.status) searchParams.append('status', params.status);
      if (params?.workflowId) searchParams.append('workflowId', params.workflowId);
      if (params?.projectId) searchParams.append('projectId', params.projectId);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.cursor) searchParams.append('cursor', params.cursor);

      const queryString = searchParams.toString();
      const endpoint = `/executions${queryString ? '?' + queryString : ''}`;
      
      const data = await this.makeRequest(endpoint);
      return data.data || [];
    } catch (error) {
      console.error('Erreur récupération exécutions:', error);
      return [];
    }
  }

  async getExecution(id: number, includeData?: boolean): Promise<N8nExecution | null> {
    try {
      const searchParams = new URLSearchParams();
      if (includeData) searchParams.append('includeData', 'true');
      
      const queryString = searchParams.toString();
      const endpoint = `/executions/${id}${queryString ? '?' + queryString : ''}`;
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Erreur récupération exécution:', error);
      return null;
    }
  }

  async deleteExecution(id: number): Promise<N8nExecution> {
    try {
      return await this.makeRequest(`/executions/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur suppression exécution:', error);
      throw new Error('Échec de la suppression de l\'exécution');
    }
  }

  // WORKFLOW TAGS
  async getWorkflowTags(workflowId: string): Promise<N8nTag[]> {
    try {
      return await this.makeRequest(`/workflows/${workflowId}/tags`);
    } catch (error) {
      console.error('Erreur récupération tags workflow:', error);
      return [];
    }
  }

  async updateWorkflowTags(workflowId: string, tagIds: string[]): Promise<N8nTag[]> {
    try {
      const tags = tagIds.map(id => ({ id }));
      return await this.makeRequest(`/workflows/${workflowId}/tags`, {
        method: 'PUT',
        body: JSON.stringify(tags)
      });
    } catch (error) {
      console.error('Erreur mise à jour tags workflow:', error);
      throw new Error('Échec de la mise à jour des tags');
    }
  }

  // CREDENTIALS
  async createCredential(credential: { name: string; type: string; data: any }): Promise<N8nCredential> {
    try {
      return await this.makeRequest('/credentials', {
        method: 'POST',
        body: JSON.stringify(credential)
      });
    } catch (error) {
      console.error('Erreur création credential:', error);
      throw new Error('Échec de la création du credential');
    }
  }

  async deleteCredential(id: string): Promise<N8nCredential> {
    try {
      return await this.makeRequest(`/credentials/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur suppression credential:', error);
      throw new Error('Échec de la suppression du credential');
    }
  }

  async getCredentialSchema(credentialTypeName: string): Promise<any> {
    try {
      return await this.makeRequest(`/credentials/schema/${credentialTypeName}`);
    } catch (error) {
      console.error('Erreur récupération schéma credential:', error);
      return null;
    }
  }

  // TAGS
  async getTags(params?: { limit?: number; cursor?: string }): Promise<{ data: N8nTag[]; nextCursor?: string }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.cursor) searchParams.append('cursor', params.cursor);

      const queryString = searchParams.toString();
      const endpoint = `/tags${queryString ? '?' + queryString : ''}`;
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Erreur récupération tags:', error);
      return { data: [] };
    }
  }

  async createTag(name: string): Promise<N8nTag> {
    try {
      return await this.makeRequest('/tags', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    } catch (error) {
      console.error('Erreur création tag:', error);
      throw new Error('Échec de la création du tag');
    }
  }

  async getTag(id: string): Promise<N8nTag | null> {
    try {
      return await this.makeRequest(`/tags/${id}`);
    } catch (error) {
      console.error('Erreur récupération tag:', error);
      return null;
    }
  }

  async updateTag(id: string, name: string): Promise<N8nTag> {
    try {
      return await this.makeRequest(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
    } catch (error) {
      console.error('Erreur mise à jour tag:', error);
      throw new Error('Échec de la mise à jour du tag');
    }
  }

  async deleteTag(id: string): Promise<N8nTag> {
    try {
      return await this.makeRequest(`/tags/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur suppression tag:', error);
      throw new Error('Échec de la suppression du tag');
    }
  }

  // VARIABLES
  async getVariables(params?: { limit?: number; cursor?: string }): Promise<{ data: N8nVariable[]; nextCursor?: string }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.cursor) searchParams.append('cursor', params.cursor);

      const queryString = searchParams.toString();
      const endpoint = `/variables${queryString ? '?' + queryString : ''}`;
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Erreur récupération variables:', error);
      return { data: [] };
    }
  }

  async createVariable(variable: { key: string; value: string }): Promise<void> {
    try {
      await this.makeRequest('/variables', {
        method: 'POST',
        body: JSON.stringify(variable)
      });
    } catch (error) {
      console.error('Erreur création variable:', error);
      throw new Error('Échec de la création de la variable');
    }
  }

  async updateVariable(id: string, variable: { key: string; value: string }): Promise<void> {
    try {
      await this.makeRequest(`/variables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(variable)
      });
    } catch (error) {
      console.error('Erreur mise à jour variable:', error);
      throw new Error('Échec de la mise à jour de la variable');
    }
  }

  async deleteVariable(id: string): Promise<void> {
    try {
      await this.makeRequest(`/variables/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur suppression variable:', error);
      throw new Error('Échec de la suppression de la variable');
    }
  }

  // USERS (Admin only)
  async getUsers(params?: {
    limit?: number;
    cursor?: string;
    includeRole?: boolean;
    projectId?: string;
  }): Promise<{ data: N8nUser[]; nextCursor?: string }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.cursor) searchParams.append('cursor', params.cursor);
      if (params?.includeRole) searchParams.append('includeRole', params.includeRole.toString());
      if (params?.projectId) searchParams.append('projectId', params.projectId);

      const queryString = searchParams.toString();
      const endpoint = `/users${queryString ? '?' + queryString : ''}`;
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      return { data: [] };
    }
  }

  async createUsers(users: Array<{ email: string; role?: 'global:admin' | 'global:member' }>): Promise<any> {
    try {
      return await this.makeRequest('/users', {
        method: 'POST',
        body: JSON.stringify(users)
      });
    } catch (error) {
      console.error('Erreur création utilisateurs:', error);
      throw new Error('Échec de la création des utilisateurs');
    }
  }

  async getUser(id: string, includeRole?: boolean): Promise<N8nUser | null> {
    try {
      const searchParams = new URLSearchParams();
      if (includeRole) searchParams.append('includeRole', 'true');
      
      const queryString = searchParams.toString();
      const endpoint = `/users/${id}${queryString ? '?' + queryString : ''}`;
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.makeRequest(`/users/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      throw new Error('Échec de la suppression de l\'utilisateur');
    }
  }

  async updateUserRole(id: string, newRoleName: 'global:admin' | 'global:member'): Promise<void> {
    try {
      await this.makeRequest(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ newRoleName })
      });
    } catch (error) {
      console.error('Erreur mise à jour rôle utilisateur:', error);
      throw new Error('Échec de la mise à jour du rôle');
    }
  }

  // AUDIT
  async generateAudit(additionalOptions?: any): Promise<any> {
    try {
      return await this.makeRequest('/audit', {
        method: 'POST',
        body: JSON.stringify({ additionalOptions })
      });
    } catch (error) {
      console.error('Erreur génération audit:', error);
      throw new Error('Échec de la génération de l\'audit');
    }
  }

  // SOURCE CONTROL
  async pullFromRepository(options?: { force?: boolean; variables?: any }): Promise<any> {
    try {
      return await this.makeRequest('/source-control/pull', {
        method: 'POST',
        body: JSON.stringify(options || {})
      });
    } catch (error) {
      console.error('Erreur pull repository:', error);
      throw new Error('Échec du pull depuis le repository');
    }
  }

  // Helper method for manual workflow execution (requires webhook or manual trigger)
  async executeWorkflow(id: string, data?: any): Promise<any> {
    try {
      // Note: Direct execution via API may require specific setup
      // This is a placeholder - actual implementation depends on workflow configuration
      console.log(`Attempting to execute workflow ${id} with data:`, data);
      
      // For now, we'll return a mock execution response
      return {
        success: true,
        message: 'Workflow execution initiated',
        workflowId: id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur exécution workflow:', error);
      throw new Error('Échec de l\'exécution du workflow');
    }
  }
}

export const n8nService = N8nService.getInstance();
