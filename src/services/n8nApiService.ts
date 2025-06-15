
import { API_CONFIG } from '@/config/api';

// Types complets basés sur l'API n8n
export interface N8nWorkflow {
  id?: string;
  name: string;
  active?: boolean;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: N8nWorkflowSettings;
  staticData?: any;
  createdAt?: string;
  updatedAt?: string;
  tags?: N8nTag[];
}

export interface N8nNode {
  id: string;
  name: string;
  webhookId?: string;
  disabled?: boolean;
  notesInFlow?: boolean;
  notes?: string;
  type: string;
  typeVersion?: number;
  executeOnce?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  continueOnFail?: boolean;
  onError?: string;
  position: [number, number];
  parameters?: any;
  credentials?: { [key: string]: { id: string; name: string } };
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nConnections {
  [nodeId: string]: {
    main?: Array<Array<{
      node: string;
      type: string;
      index: number;
    }>>;
  };
}

export interface N8nWorkflowSettings {
  saveExecutionProgress?: boolean;
  saveManualExecutions?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
  errorWorkflow?: string;
  timezone?: string;
  executionOrder?: 'v0' | 'v1';
}

export interface N8nExecution {
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

export interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPending: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface N8nTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nVariable {
  id: string;
  key: string;
  value: string;
  type?: string;
}

export interface N8nProject {
  id: string;
  name: string;
  type: string;
}

export interface N8nAuditReport {
  risk: string;
  sections: Array<{
    title: string;
    description: string;
    recommendation: string;
    location: Array<{
      kind: string;
      id?: string;
      name?: string;
      workflowId?: string;
      workflowName?: string;
      nodeId?: string;
      nodeName?: string;
      nodeType?: string;
      packageUrl?: string;
    }>;
  }>;
}

export interface N8nCredentialType {
  displayName: string;
  name: string;
  type: string;
  default: boolean;
}

export class N8nApiService {
  private static instance: N8nApiService;
  private apiKey = API_CONFIG.N8N.API_KEY;
  private baseUrl = API_CONFIG.N8N.BASE_URL;

  public static getInstance(): N8nApiService {
    if (!N8nApiService.instance) {
      N8nApiService.instance = new N8nApiService();
    }
    return N8nApiService.instance;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
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
    } catch (error) {
      console.error('n8n API Request failed:', error);
      throw error;
    }
  }

  // ==================== WORKFLOWS ====================
  
  async getWorkflows(params?: {
    active?: boolean;
    tags?: string;
    name?: string;
    projectId?: string;
    excludePinnedData?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nWorkflow[]; nextCursor?: string }> {
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
    
    return await this.makeRequest(endpoint);
  }

  async getWorkflow(id: string, excludePinnedData?: boolean): Promise<N8nWorkflow> {
    const searchParams = new URLSearchParams();
    if (excludePinnedData) searchParams.append('excludePinnedData', 'true');
    
    const queryString = searchParams.toString();
    const endpoint = `/workflows/${id}${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    return await this.makeRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow)
    });
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    return await this.makeRequest(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow)
    });
  }

  async deleteWorkflow(id: string): Promise<N8nWorkflow> {
    return await this.makeRequest(`/workflows/${id}`, {
      method: 'DELETE'
    });
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    return await this.makeRequest(`/workflows/${id}/activate`, {
      method: 'POST'
    });
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    return await this.makeRequest(`/workflows/${id}/deactivate`, {
      method: 'POST'
    });
  }

  async transferWorkflow(id: string, destinationProjectId: string): Promise<void> {
    await this.makeRequest(`/workflows/${id}/transfer`, {
      method: 'PUT',
      body: JSON.stringify({ destinationProjectId })
    });
  }

  async getWorkflowTags(workflowId: string): Promise<N8nTag[]> {
    return await this.makeRequest(`/workflows/${workflowId}/tags`);
  }

  async updateWorkflowTags(workflowId: string, tagIds: string[]): Promise<N8nTag[]> {
    const tags = tagIds.map(id => ({ id }));
    return await this.makeRequest(`/workflows/${workflowId}/tags`, {
      method: 'PUT',
      body: JSON.stringify(tags)
    });
  }

  // ==================== EXECUTIONS ====================
  
  async getExecutions(params?: {
    includeData?: boolean;
    status?: 'error' | 'success' | 'waiting';
    workflowId?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nExecution[]; nextCursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.includeData !== undefined) searchParams.append('includeData', params.includeData.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.workflowId) searchParams.append('workflowId', params.workflowId);
    if (params?.projectId) searchParams.append('projectId', params.projectId);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.cursor) searchParams.append('cursor', params.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/executions${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async getExecution(id: number, includeData?: boolean): Promise<N8nExecution> {
    const searchParams = new URLSearchParams();
    if (includeData) searchParams.append('includeData', 'true');
    
    const queryString = searchParams.toString();
    const endpoint = `/executions/${id}${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async deleteExecution(id: number): Promise<N8nExecution> {
    return await this.makeRequest(`/executions/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== CREDENTIALS ====================
  
  async createCredential(credential: { name: string; type: string; data: any }): Promise<N8nCredential> {
    return await this.makeRequest('/credentials', {
      method: 'POST',
      body: JSON.stringify(credential)
    });
  }

  async deleteCredential(id: string): Promise<N8nCredential> {
    return await this.makeRequest(`/credentials/${id}`, {
      method: 'DELETE'
    });
  }

  async transferCredential(id: string, destinationProjectId: string): Promise<void> {
    await this.makeRequest(`/credentials/${id}/transfer`, {
      method: 'PUT',
      body: JSON.stringify({ destinationProjectId })
    });
  }

  async getCredentialSchema(credentialTypeName: string): Promise<N8nCredentialType> {
    return await this.makeRequest(`/credentials/schema/${credentialTypeName}`);
  }

  // ==================== TAGS ====================
  
  async getTags(params?: { limit?: number; cursor?: string }): Promise<{ data: N8nTag[]; nextCursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.cursor) searchParams.append('cursor', params.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/tags${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async createTag(name: string): Promise<N8nTag> {
    return await this.makeRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async getTag(id: string): Promise<N8nTag> {
    return await this.makeRequest(`/tags/${id}`);
  }

  async updateTag(id: string, name: string): Promise<N8nTag> {
    return await this.makeRequest(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  async deleteTag(id: string): Promise<N8nTag> {
    return await this.makeRequest(`/tags/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== VARIABLES ====================
  
  async getVariables(params?: { limit?: number; cursor?: string }): Promise<{ data: N8nVariable[]; nextCursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.cursor) searchParams.append('cursor', params.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/variables${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async createVariable(variable: { key: string; value: string; type?: string }): Promise<void> {
    await this.makeRequest('/variables', {
      method: 'POST',
      body: JSON.stringify(variable)
    });
  }

  async updateVariable(id: string, variable: { key: string; value: string; type?: string }): Promise<void> {
    await this.makeRequest(`/variables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(variable)
    });
  }

  async deleteVariable(id: string): Promise<void> {
    await this.makeRequest(`/variables/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== USERS ====================
  
  async getUsers(params?: {
    limit?: number;
    cursor?: string;
    includeRole?: boolean;
    projectId?: string;
  }): Promise<{ data: N8nUser[]; nextCursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.cursor) searchParams.append('cursor', params.cursor);
    if (params?.includeRole) searchParams.append('includeRole', params.includeRole.toString());
    if (params?.projectId) searchParams.append('projectId', params.projectId);

    const queryString = searchParams.toString();
    const endpoint = `/users${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async createUsers(users: Array<{ email: string; role?: 'global:admin' | 'global:member' }>): Promise<any> {
    return await this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(users)
    });
  }

  async getUser(id: string, includeRole?: boolean): Promise<N8nUser> {
    const searchParams = new URLSearchParams();
    if (includeRole) searchParams.append('includeRole', 'true');
    
    const queryString = searchParams.toString();
    const endpoint = `/users/${id}${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async deleteUser(id: string): Promise<void> {
    await this.makeRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async updateUserRole(id: string, newRoleName: 'global:admin' | 'global:member'): Promise<void> {
    await this.makeRequest(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ newRoleName })
    });
  }

  // ==================== PROJECTS ====================
  
  async getProjects(params?: { limit?: number; cursor?: string }): Promise<{ data: N8nProject[]; nextCursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.cursor) searchParams.append('cursor', params.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/projects${queryString ? '?' + queryString : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async createProject(name: string, type?: string): Promise<N8nProject> {
    return await this.makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, type })
    });
  }

  async updateProject(projectId: string, name: string): Promise<N8nProject> {
    return await this.makeRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.makeRequest(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // ==================== AUDIT ====================
  
  async generateAudit(additionalOptions?: any): Promise<N8nAuditReport[]> {
    return await this.makeRequest('/audit', {
      method: 'POST',
      body: JSON.stringify({ additionalOptions })
    });
  }

  // ==================== SOURCE CONTROL ====================
  
  async pullFromRepository(options?: { force?: boolean; variables?: any }): Promise<any> {
    return await this.makeRequest('/source-control/pull', {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }
}

export const n8nApiService = N8nApiService.getInstance();
