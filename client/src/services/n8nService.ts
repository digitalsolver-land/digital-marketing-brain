
import { supabase } from '@/integrations/supabase/client';

// Types pour l'API n8n (basés sur la documentation officielle)
export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    typeVersion?: number;
    position: [number, number];
    parameters?: any;
    credentials?: any;
    webhookId?: string;
    disabled?: boolean;
    notesInFlow?: boolean;
    notes?: string;
    executeOnce?: boolean;
    alwaysOutputData?: boolean;
    retryOnFail?: boolean;
    maxTries?: number;
    waitBetweenTries?: number;
    continueOnFail?: boolean;
    onError?: string;
    createdAt?: string;
    updatedAt?: string;
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
  settings?: {
    saveExecutionProgress?: boolean;
    saveManualExecutions?: boolean;
    saveDataErrorExecution?: 'all' | 'none';
    saveDataSuccessExecution?: 'all' | 'none';
    executionTimeout?: number;
    errorWorkflow?: string;
    timezone?: string;
    executionOrder?: string;
  };
  staticData?: any;
  tags?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  mode: string;
  finished: boolean;
  startedAt: string;
  stoppedAt?: string;
  data?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface RequestOptions {
  limit?: number;
  cursor?: string;
  includeData?: boolean;
  active?: boolean;
  tags?: string;
  name?: string;
  projectId?: string;
  workflowId?: string;
}

// États de connexion possibles
export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

class N8nService {
  private static instance: N8nService;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private lastError: string | null = null;
  private readonly REQUEST_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 3;

  public static getInstance(): N8nService {
    if (!N8nService.instance) {
      N8nService.instance = new N8nService();
    }
    return N8nService.instance;
  }

  // === GESTION DE LA CONFIGURATION ===
  async updateConfig(config: { apiKey: string; baseUrl: string }): Promise<void> {
    try {
      console.log('🔄 Mise à jour configuration n8n...');
      
      const { error } = await supabase.functions.invoke('save-n8n-config', {
        body: {
          apiKey: config.apiKey,
          baseUrl: config.baseUrl
        }
      });

      if (error) {
        throw new Error(`Erreur sauvegarde config: ${error.message}`);
      }

      console.log('✅ Configuration n8n mise à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur mise à jour config n8n:', error);
      throw error;
    }
  }

  // === GESTION DE LA CONNEXION ===
  async checkConnection(): Promise<{ status: ConnectionStatus; error?: string }> {
    try {
      this.connectionStatus = 'checking';
      this.lastError = null;
      
      console.log('🔍 Vérification connexion n8n...');
      
      const { data, error } = await supabase.functions.invoke('test-n8n-connection');
      
      if (error) {
        console.error('❌ Erreur fonction edge:', error);
        this.connectionStatus = 'error';
        this.lastError = 'Erreur lors du test de connexion';
        return { status: 'error', error: this.lastError };
      }

      if (data?.success) {
        this.connectionStatus = 'connected';
        console.log('✅ n8n connecté avec succès');
        return { status: 'connected' };
      } else {
        this.connectionStatus = 'error';
        this.lastError = data?.error || 'Test de connexion échoué';
        console.error('❌ Test de connexion échoué:', data);
        return { status: 'error', error: this.lastError };
      }
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error instanceof Error ? error.message : 'Erreur de connexion inconnue';
      console.error('❌ Erreur connexion n8n:', this.lastError);
      return { status: 'error', error: this.lastError };
    }
  }

  getConnectionStatus(): { status: ConnectionStatus; error?: string } {
    return {
      status: this.connectionStatus,
      error: this.lastError || undefined
    };
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  // === MÉTHODE GÉNÉRIQUE POUR LES REQUÊTES API ===
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    try {
      console.log(`🌐 Requête n8n: ${options.method || 'GET'} ${endpoint}`);
      
      // Utiliser la fonction proxy Supabase pour faire les appels n8n
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: { 
          path: endpoint,
          method: options.method || 'GET',
          body: options.body
        }
      });

      if (error) {
        console.error('❌ Erreur requête n8n:', error.message);
        throw new Error(error.message || 'Configuration n8n manquante. Configurez votre clé API dans les paramètres.');
      }

      if (data?.error) {
        console.error('❌ Erreur API n8n:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`❌ Erreur requête (tentative ${retryCount + 1}/${this.MAX_RETRIES}):`, error);
      
      if (retryCount < this.MAX_RETRIES - 1) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  // === PARAMÈTRES DE REQUÊTE ===
  private buildQueryParams(options: RequestOptions): string {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    if (options.includeData !== undefined) params.append('includeData', options.includeData.toString());
    if (options.active !== undefined) params.append('active', options.active.toString());
    if (options.tags) params.append('tags', options.tags);
    if (options.name) params.append('name', options.name);
    if (options.projectId) params.append('projectId', options.projectId);
    if (options.workflowId) params.append('workflowId', options.workflowId);
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  // === GESTION DES WORKFLOWS ===
  async getWorkflows(options: RequestOptions = {}): Promise<PaginatedResponse<N8nWorkflow>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nWorkflow>>(`/workflows${queryParams}`);
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`);
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow)
    });
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow)
    });
  }

  async deleteWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // === EXECUTIONS ===
  async getExecutions(options: RequestOptions = {}): Promise<PaginatedResponse<N8nExecution>> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/executions${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<N8nExecution>>(endpoint);
  }

  async getExecution(id: string): Promise<N8nExecution> {
    if (!id) throw new Error('ID de l\'exécution requis');
    return this.makeRequest<N8nExecution>(`/executions/${id}`);
  }

  async deleteExecution(id: string): Promise<N8nExecution> {
    if (!id) throw new Error('ID de l\'exécution requis');
    
    return this.makeRequest<N8nExecution>(`/executions/${id}`, {
      method: 'DELETE',
    });
  }

  // === MÉTHODES UTILITAIRES ===
  async executeWorkflow(workflowId: string, inputData: any = {}): Promise<any> {
    try {
      console.log(`🚀 Demande d'exécution du workflow: ${workflowId}`);
      
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow non trouvé');
      }

      if (!workflow.active) {
        console.log('🔄 Activation du workflow avant exécution...');
        await this.activateWorkflow(workflowId);
      }

      console.log('💡 Le workflow est maintenant actif et prêt à être déclenché');
      
      return {
        success: true,
        message: `Workflow "${workflow.name}" est maintenant actif et prêt à être déclenché`,
        workflowId: workflowId,
        workflowName: workflow.name,
        isActive: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur exécution workflow:', error);
      throw error;
    }
  }

  getWorkflowUrl(workflowId: string): string {
    return `https://n8n.srv860213.hstgr.cloud/workflow/${workflowId}`;
  }

  async workflowExists(workflowId: string): Promise<boolean> {
    try {
      await this.getWorkflow(workflowId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async importAllWorkflows(): Promise<N8nWorkflow[]> {
    console.log('🔄 Importation complète des workflows depuis n8n...');
    
    const allWorkflows: N8nWorkflow[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const result = await this.getWorkflows({ 
          limit: 50, 
          cursor 
        });
        
        allWorkflows.push(...result.data);
        cursor = result.nextCursor;
        hasMore = !!cursor;
        
        console.log(`📊 ${allWorkflows.length} workflows importés jusqu'à présent...`);
      } catch (error) {
        console.error('❌ Erreur lors de l\'importation:', error);
        break;
      }
    }
    
    console.log(`✅ Importation terminée: ${allWorkflows.length} workflows`);
    return allWorkflows;
  }

  // === GESTION DES TAGS ===
  async getTags(options: RequestOptions = {}): Promise<PaginatedResponse<N8nTag>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nTag>>(`/tags${queryParams}`);
  }

  async getTag(id: string): Promise<N8nTag> {
    return this.makeRequest<N8nTag>(`/tags/${id}`);
  }

  async createTag(tag: { name: string }): Promise<N8nTag> {
    return this.makeRequest<N8nTag>('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tag)
    });
  }

  async updateTag(id: string, tag: { name: string }): Promise<N8nTag> {
    return this.makeRequest<N8nTag>(`/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tag)
    });
  }

  async deleteTag(id: string): Promise<N8nTag> {
    return this.makeRequest<N8nTag>(`/tags/${id}`, {
      method: 'DELETE'
    });
  }

  async getWorkflowTags(workflowId: string): Promise<N8nTag[]> {
    return this.makeRequest<N8nTag[]>(`/workflows/${workflowId}/tags`);
  }

  async updateWorkflowTags(workflowId: string, tagIds: Array<{ id: string }>): Promise<N8nTag[]> {
    return this.makeRequest<N8nTag[]>(`/workflows/${workflowId}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tagIds)
    });
  }

  // === GESTION DES VARIABLES ===
  async getVariables(options: RequestOptions = {}): Promise<PaginatedResponse<N8nVariable>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nVariable>>(`/variables${queryParams}`);
  }

  async createVariable(variable: { key: string; value: string; type?: string }): Promise<void> {
    await this.makeRequest<void>('/variables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variable)
    });
  }

  async updateVariable(id: string, variable: { key: string; value: string; type?: string }): Promise<void> {
    await this.makeRequest<void>(`/variables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variable)
    });
  }

  async deleteVariable(id: string): Promise<void> {
    await this.makeRequest<void>(`/variables/${id}`, {
      method: 'DELETE'
    });
  }

  // === GESTION DES PROJETS ===
  async getProjects(options: RequestOptions = {}): Promise<PaginatedResponse<N8nProject>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nProject>>(`/projects${queryParams}`);
  }

  async createProject(project: { name: string; type?: string }): Promise<void> {
    await this.makeRequest<void>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  }

  async updateProject(projectId: string, project: { name: string; type?: string }): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  async transferWorkflowToProject(workflowId: string, destinationProjectId: string): Promise<void> {
    await this.makeRequest<void>(`/workflows/${workflowId}/transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationProjectId })
    });
  }

  async addUsersToProject(projectId: string, relations: Array<{ userId: string; role: string }>): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relations })
    });
  }

  async deleteUserFromProject(projectId: string, userId: string): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async changeUserRoleInProject(projectId: string, userId: string, role: string): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
  }

  // === GESTION DES CREDENTIALS ===
  async createCredential(credential: { name: string; type: string; data: any }): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>('/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential)
    });
  }

  async deleteCredential(id: string): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>(`/credentials/${id}`, {
      method: 'DELETE'
    });
  }

  async getCredentialSchema(credentialTypeName: string): Promise<any> {
    return this.makeRequest<any>(`/credentials/schema/${credentialTypeName}`);
  }

  async transferCredentialToProject(credentialId: string, destinationProjectId: string): Promise<void> {
    await this.makeRequest<void>(`/credentials/${credentialId}/transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationProjectId })
    });
  }

  // === AUDIT DE SECURITE ===
  async generateAudit(options?: { 
    additionalOptions?: {
      daysAbandonedWorkflow?: number;
      categories?: Array<'credentials' | 'database' | 'nodes' | 'filesystem' | 'instance'>;
    }
  }): Promise<any> {
    return this.makeRequest<any>('/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {})
    });
  }

  // === GESTION DES UTILISATEURS (Enterprise) ===
  async getUsers(options: RequestOptions & { includeRole?: boolean } = {}): Promise<PaginatedResponse<N8nUser>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nUser>>(`/users${queryParams}`);
  }

  async getUser(id: string, includeRole?: boolean): Promise<N8nUser> {
    const queryParams = includeRole ? '?includeRole=true' : '';
    return this.makeRequest<N8nUser>(`/users/${id}${queryParams}`);
  }

  async createUsers(users: Array<{ email: string; role: 'global:admin' | 'global:member' }>): Promise<any> {
    return this.makeRequest<any>('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.makeRequest<void>(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async changeUserRole(id: string, newRoleName: 'global:admin' | 'global:member'): Promise<void> {
    await this.makeRequest<void>(`/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRoleName })
    });
  }

  // === CONTROLE DE SOURCE ===
  async pullFromRepository(options: { force?: boolean; variables?: any }): Promise<any> {
    return this.makeRequest<any>('/source-control/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
  }
}

// Types additionnels pour les nouvelles fonctionnalités
export interface N8nTag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isOwner?: boolean;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const n8nService = N8nService.getInstance();
            throw new Error('Erreur serveur n8n - service temporairement indisponible');
          default:
            throw new Error(`Erreur API n8n (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      console.log(`✅ Requête n8n réussie: ${options.method || 'GET'} ${endpoint}`);
      return data;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout de la requête n8n (${this.REQUEST_TIMEOUT}ms)`);
      }

      // Retry logic pour les erreurs réseau ou serveur
      if (retryCount < this.MAX_RETRIES && this.shouldRetry(error)) {
        const delay = (retryCount + 1) * 1000;
        console.warn(`⚠️ Tentative ${retryCount + 1}/${this.MAX_RETRIES} échouée, retry dans ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      console.error(`❌ Erreur requête n8n: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    return error instanceof TypeError || 
           (error instanceof Error && error.message.includes('fetch')) ||
           (error instanceof Error && error.message.includes('timeout')) ||
           (error instanceof Error && error.message.includes('503'));
  }

  private buildQueryParams(options: RequestOptions = {}): string {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    if (options.includeData !== undefined) params.append('includeData', options.includeData.toString());
    if (options.active !== undefined) params.append('active', options.active.toString());
    if (options.tags) params.append('tags', options.tags);
    if (options.name) params.append('name', options.name);
    if (options.projectId) params.append('projectId', options.projectId);
    if (options.workflowId) params.append('workflowId', options.workflowId);
    
    return params.toString();
  }

  // === WORKFLOWS ===
  async getWorkflows(options: RequestOptions = {}): Promise<PaginatedResponse<N8nWorkflow>> {
    try {
      const queryString = this.buildQueryParams(options);
      const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;
      
      console.log('📥 Récupération workflows n8n...');
      const result = await this.makeRequest<any>(endpoint);
      
      // Validation et normalisation du format de retour
      if (!result) {
        console.warn('⚠️ Aucune donnée reçue');
        return { data: [], nextCursor: undefined };
      }
      
      // Si l'API retourne directement un tableau
      if (Array.isArray(result)) {
        console.log(`✅ ${result.length} workflows récupérés (format tableau)`);
        return { data: result, nextCursor: undefined };
      }
      
      // Si l'API retourne un objet avec data
      if (result.data && Array.isArray(result.data)) {
        console.log(`✅ ${result.data.length} workflows récupérés`);
        return result;
      }
      
      console.warn('⚠️ Format de réponse inattendu:', result);
      return { data: [], nextCursor: undefined };
      
    } catch (error) {
      console.error('❌ Erreur getWorkflows:', error);
      throw error;
    }
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`);
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    if (!workflow.name?.trim()) {
      throw new Error('Le nom du workflow est requis');
    }
    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new Error('Au moins un nœud est requis');
    }

    const workflowData = {
      name: workflow.name.trim(),
      nodes: workflow.nodes,
      connections: workflow.connections || {},
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    };

    return this.makeRequest<N8nWorkflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // === EXECUTIONS ===
  async getExecutions(options: RequestOptions = {}): Promise<PaginatedResponse<N8nExecution>> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/executions${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<N8nExecution>>(endpoint);
  }

  async getExecution(id: string): Promise<N8nExecution> {
    if (!id) throw new Error('ID de l\'exécution requis');
    return this.makeRequest<N8nExecution>(`/executions/${id}`);
  }

  async deleteExecution(id: string): Promise<N8nExecution> {
    if (!id) throw new Error('ID de l\'exécution requis');
    
    return this.makeRequest<N8nExecution>(`/executions/${id}`, {
      method: 'DELETE',
    });
  }

  // === MÉTHODES UTILITAIRES ===
  async executeWorkflow(workflowId: string, inputData: any = {}): Promise<any> {
    try {
      console.log(`🚀 Demande d'exécution du workflow: ${workflowId}`);
      
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow non trouvé');
      }

      if (!workflow.active) {
        console.log('🔄 Activation du workflow avant exécution...');
        await this.activateWorkflow(workflowId);
      }

      console.log('💡 Le workflow est maintenant actif et prêt à être déclenché');
      
      return {
        success: true,
        message: `Workflow "${workflow.name}" est maintenant actif et prêt à être déclenché`,
        workflowId: workflowId,
        workflowName: workflow.name,
        isActive: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur exécution workflow:', error);
      throw error;
    }
  }

  getWorkflowUrl(workflowId: string): string {
    return `https://n8n.srv860213.hstgr.cloud/workflow/${workflowId}`;
  }

  async workflowExists(workflowId: string): Promise<boolean> {
    try {
      await this.getWorkflow(workflowId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async importAllWorkflows(): Promise<N8nWorkflow[]> {
    console.log('🔄 Importation complète des workflows depuis n8n...');
    
    const allWorkflows: N8nWorkflow[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const result = await this.getWorkflows({ 
          limit: 50, 
          cursor 
        });
        
        allWorkflows.push(...result.data);
        cursor = result.nextCursor;
        hasMore = !!cursor;
        
        console.log(`📊 ${allWorkflows.length} workflows importés jusqu'à présent...`);
      } catch (error) {
        console.error('❌ Erreur lors de l\'importation:', error);
        break;
      }
    }
    
    console.log(`✅ Importation terminée: ${allWorkflows.length} workflows`);
    return allWorkflows;
  }

  // === GESTION DES TAGS ===
  async getTags(options: RequestOptions = {}): Promise<PaginatedResponse<N8nTag>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nTag>>(`/tags${queryParams}`);
  }

  async getTag(id: string): Promise<N8nTag> {
    return this.makeRequest<N8nTag>(`/tags/${id}`);
  }

  async createTag(tag: { name: string }): Promise<N8nTag> {
    return this.makeRequest<N8nTag>('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tag)
    });
  }

  async updateTag(id: string, tag: { name: string }): Promise<N8nTag> {
    return this.makeRequest<N8nTag>(`/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tag)
    });
  }

  async deleteTag(id: string): Promise<N8nTag> {
    return this.makeRequest<N8nTag>(`/tags/${id}`, {
      method: 'DELETE'
    });
  }

  async getWorkflowTags(workflowId: string): Promise<N8nTag[]> {
    return this.makeRequest<N8nTag[]>(`/workflows/${workflowId}/tags`);
  }

  async updateWorkflowTags(workflowId: string, tagIds: Array<{ id: string }>): Promise<N8nTag[]> {
    return this.makeRequest<N8nTag[]>(`/workflows/${workflowId}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tagIds)
    });
  }

  // === GESTION DES VARIABLES ===
  async getVariables(options: RequestOptions = {}): Promise<PaginatedResponse<N8nVariable>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nVariable>>(`/variables${queryParams}`);
  }

  async createVariable(variable: { key: string; value: string; type?: string }): Promise<void> {
    await this.makeRequest<void>('/variables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variable)
    });
  }

  async updateVariable(id: string, variable: { key: string; value: string; type?: string }): Promise<void> {
    await this.makeRequest<void>(`/variables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variable)
    });
  }

  async deleteVariable(id: string): Promise<void> {
    await this.makeRequest<void>(`/variables/${id}`, {
      method: 'DELETE'
    });
  }

  // === GESTION DES PROJETS ===
  async getProjects(options: RequestOptions = {}): Promise<PaginatedResponse<N8nProject>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nProject>>(`/projects${queryParams}`);
  }

  async createProject(project: { name: string; type?: string }): Promise<void> {
    await this.makeRequest<void>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  }

  async updateProject(projectId: string, project: { name: string; type?: string }): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  async transferWorkflowToProject(workflowId: string, destinationProjectId: string): Promise<void> {
    await this.makeRequest<void>(`/workflows/${workflowId}/transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationProjectId })
    });
  }

  async addUsersToProject(projectId: string, relations: Array<{ userId: string; role: string }>): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relations })
    });
  }

  async deleteUserFromProject(projectId: string, userId: string): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async changeUserRoleInProject(projectId: string, userId: string, role: string): Promise<void> {
    await this.makeRequest<void>(`/projects/${projectId}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
  }

  // === GESTION DES CREDENTIALS ===
  async createCredential(credential: { name: string; type: string; data: any }): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>('/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential)
    });
  }

  async deleteCredential(id: string): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>(`/credentials/${id}`, {
      method: 'DELETE'
    });
  }

  async getCredentialSchema(credentialTypeName: string): Promise<any> {
    return this.makeRequest<any>(`/credentials/schema/${credentialTypeName}`);
  }

  async transferCredentialToProject(credentialId: string, destinationProjectId: string): Promise<void> {
    await this.makeRequest<void>(`/credentials/${credentialId}/transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationProjectId })
    });
  }

  // === AUDIT DE SECURITE ===
  async generateAudit(options?: { 
    additionalOptions?: {
      daysAbandonedWorkflow?: number;
      categories?: Array<'credentials' | 'database' | 'nodes' | 'filesystem' | 'instance'>;
    }
  }): Promise<any> {
    return this.makeRequest<any>('/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {})
    });
  }

  // === GESTION DES UTILISATEURS (Enterprise) ===
  async getUsers(options: RequestOptions & { includeRole?: boolean } = {}): Promise<PaginatedResponse<N8nUser>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nUser>>(`/users${queryParams}`);
  }

  async getUser(id: string, includeRole?: boolean): Promise<N8nUser> {
    const queryParams = includeRole ? '?includeRole=true' : '';
    return this.makeRequest<N8nUser>(`/users/${id}${queryParams}`);
  }

  async createUsers(users: Array<{ email: string; role: 'global:admin' | 'global:member' }>): Promise<any> {
    return this.makeRequest<any>('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.makeRequest<void>(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async changeUserRole(id: string, newRoleName: 'global:admin' | 'global:member'): Promise<void> {
    await this.makeRequest<void>(`/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRoleName })
    });
  }

  // === CONTROLE DE SOURCE ===
  async pullFromRepository(options: { force?: boolean; variables?: any }): Promise<any> {
    return this.makeRequest<any>('/source-control/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
  }
}

// Types additionnels pour les nouvelles fonctionnalités
export interface N8nTag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isOwner?: boolean;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const n8nService = N8nService.getInstance();
