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
    saveDataErrorExecution?: string;
    saveDataSuccessExecution?: string;
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
  retryOf?: number;
  retrySuccessId?: string;
  waitTill?: string;
  customData?: any;
}

export interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isPending: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface N8nProject {
  id: string;
  name: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
  data?: any;
}

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

export interface N8nAuditReport {
  risk: 'low' | 'medium' | 'high';
  sections: Array<{
    title: string;
    description: string;
    recommendation: string;
    location?: Array<{
      workflowName?: string;
      nodeName?: string;
      nodeType?: string;
    }>;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface RequestOptions {
  limit?: number;
  cursor?: string;
  includeData?: boolean;
  includeRole?: boolean;
  active?: boolean;
  tags?: string;
  name?: string;
  projectId?: string;
  excludePinnedData?: boolean;
  status?: 'error' | 'success' | 'waiting';
  workflowId?: string;
}

// États de connexion possibles
export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

class N8nService {
  private static instance: N8nService;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private lastError: string | null = null;
  private readonly REQUEST_TIMEOUT = 30000; // 30 secondes
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
      
      // Sauvegarder dans Supabase via la fonction edge
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
      
      // Utiliser la fonction edge pour un test plus robuste
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
      
      // Récupérer la configuration depuis Supabase
      const { data: secrets, error: secretsError } = await supabase.functions.invoke('get-n8n-secrets');
      
      if (secretsError || !secrets?.n8n_api_key) {
        console.error('❌ Erreur récupération secrets:', secretsError);
        throw new Error('Configuration n8n manquante. Configurez votre clé API dans les paramètres.');
      }

      const apiKey = secrets.n8n_api_key;
      const baseUrl = secrets.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud/api/v1';
      
      if (!apiKey) {
        throw new Error('Clé API n8n manquante. Configurez votre clé API dans les paramètres.');
      }

      const url = `${baseUrl}${endpoint}`;
      console.log(`🔗 URL finale: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': apiKey,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error(`❌ Erreur HTTP ${response.status}:`, errorText);
        
        switch (response.status) {
          case 401:
            throw new Error('Clé API n8n invalide ou expirée');
          case 403:
            throw new Error('Accès refusé - vérifiez les permissions de la clé API');
          case 404:
            throw new Error('Endpoint API n8n non trouvé');
          case 429:
            throw new Error('Limite de taux API atteinte, veuillez patienter');
          case 500:
          case 502:
          case 503:
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
    if (options.includeRole !== undefined) params.append('includeRole', options.includeRole.toString());
    if (options.active !== undefined) params.append('active', options.active.toString());
    if (options.tags) params.append('tags', options.tags);
    if (options.name) params.append('name', options.name);
    if (options.projectId) params.append('projectId', options.projectId);
    if (options.excludePinnedData !== undefined) params.append('excludePinnedData', options.excludePinnedData.toString());
    if (options.status) params.append('status', options.status);
    if (options.workflowId) params.append('workflowId', options.workflowId);
    
    return params.toString();
  }

  // === WORKFLOWS ===
  async getWorkflows(options: RequestOptions = {}): Promise<PaginatedResponse<N8nWorkflow>> {
    try {
      const queryString = this.buildQueryParams(options);
      const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;
      
      console.log('📥 Récupération workflows n8n...');
      const result = await this.makeRequest<PaginatedResponse<N8nWorkflow>>(endpoint);
      
      // Validation du format de retour
      if (!result) {
        console.warn('⚠️ Aucune donnée reçue, retour format par défaut');
        return { data: [], nextCursor: undefined };
      }
      
      // Si l'API retourne directement un tableau (pas encapsulé)
      if (Array.isArray(result)) {
        console.log(`✅ ${result.length} workflows récupérés (format tableau)`);
        return { data: result, nextCursor: undefined };
      }
      
      // Si l'API retourne un objet avec data
      if (result.data && Array.isArray(result.data)) {
        console.log(`✅ ${result.data.length} workflows récupérés (format encapsulé)`);
        return result;
      }
      
      console.warn('⚠️ Format de réponse inattendu:', result);
      return { data: [], nextCursor: undefined };
      
    } catch (error) {
      console.error('❌ Erreur getWorkflows:', error);
      throw error;
    }
  }

  async getWorkflow(id: string, options: RequestOptions = {}): Promise<N8nWorkflow> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/workflows/${id}${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<N8nWorkflow>(endpoint);
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

  async transferWorkflow(id: string, destinationProjectId: string): Promise<void> {
    if (!id) throw new Error('ID du workflow requis');
    if (!destinationProjectId) throw new Error('ID du projet de destination requis');
    
    await this.makeRequest<void>(`/workflows/${id}/transfer`, {
      method: 'PUT',
      body: JSON.stringify({ destinationProjectId }),
    });
  }

  async getWorkflowTags(id: string): Promise<N8nTag[]> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nTag[]>(`/workflows/${id}/tags`);
  }

  async updateWorkflowTags(id: string, tags: Array<{ id: string }>): Promise<N8nTag[]> {
    if (!id) throw new Error('ID du workflow requis');
    
    return this.makeRequest<N8nTag[]>(`/workflows/${id}/tags`, {
      method: 'PUT',
      body: JSON.stringify(tags),
    });
  }

  // === EXECUTIONS ===
  async getExecutions(options: RequestOptions = {}): Promise<PaginatedResponse<N8nExecution>> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/executions${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<N8nExecution>>(endpoint);
  }

  async getExecution(id: string, options: RequestOptions = {}): Promise<N8nExecution> {
    if (!id) throw new Error('ID de l\'exécution requis');
    
    const queryString = this.buildQueryParams(options);
    const endpoint = `/executions/${id}${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<N8nExecution>(endpoint);
  }

  async deleteExecution(id: string): Promise<N8nExecution> {
    if (!id) throw new Error('ID de l\'exécution requis');
    
    return this.makeRequest<N8nExecution>(`/executions/${id}`, {
      method: 'DELETE',
    });
  }

  // === USERS ===
  async getUsers(options: RequestOptions = {}): Promise<PaginatedResponse<N8nUser>> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<N8nUser>>(endpoint);
  }

  async getUser(id: string, options: RequestOptions = {}): Promise<N8nUser> {
    if (!id) throw new Error('ID de l\'utilisateur requis');
    
    const queryString = this.buildQueryParams(options);
    const endpoint = `/users/${id}${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<N8nUser>(endpoint);
  }

  async createUsers(users: Array<{ email: string; role?: string }>): Promise<any> {
    if (!users || users.length === 0) {
      throw new Error('Au moins un utilisateur est requis');
    }

    return this.makeRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(users),
    });
  }

  async deleteUser(id: string): Promise<void> {
    if (!id) throw new Error('ID de l\'utilisateur requis');
    
    await this.makeRequest<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateUserRole(id: string, newRoleName: string): Promise<void> {
    if (!id) throw new Error('ID de l\'utilisateur requis');
    if (!newRoleName) throw new Error('Nouveau rôle requis');
    
    await this.makeRequest<void>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ newRoleName }),
    });
  }

  // === PROJECTS ===
  async getProjects(options: RequestOptions = {}): Promise<PaginatedResponse<N8nProject>> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<N8nProject>>(endpoint);
  }

  async createProject(name: string): Promise<N8nProject> {
    if (!name?.trim()) throw new Error('Nom du projet requis');
    
    return this.makeRequest<N8nProject>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
  }

  async updateProject(projectId: string, name: string): Promise<void> {
    if (!projectId) throw new Error('ID du projet requis');
    if (!name?.trim()) throw new Error('Nom du projet requis');
    
    await this.makeRequest<void>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: name.trim() }),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!projectId) throw new Error('ID du projet requis');
    
    await this.makeRequest<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async addUsersToProject(projectId: string, relations: Array<{ userId: string; role: string }>): Promise<void> {
    if (!projectId) throw new Error('ID du projet requis');
    if (!relations || relations.length === 0) throw new Error('Relations utilisateur requises');
    
    await this.makeRequest<void>(`/projects/${projectId}/users`, {
      method: 'POST',
      body: JSON.stringify({ relations }),
    });
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    if (!projectId) throw new Error('ID du projet requis');
    if (!userId) throw new Error('ID de l\'utilisateur requis');
    
    await this.makeRequest<void>(`/projects/${projectId}/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateUserRoleInProject(projectId: string, userId: string, role: string): Promise<void> {
    if (!projectId) throw new Error('ID du projet requis');
    if (!userId) throw new Error('ID de l\'utilisateur requis');
    if (!role) throw new Error('Rôle requis');
    
    await this.makeRequest<void>(`/projects/${projectId}/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // === CREDENTIALS ===
  async createCredential(credential: { name: string; type: string; data: any }): Promise<N8nCredential> {
    if (!credential.name?.trim()) throw new Error('Nom du credential requis');
    if (!credential.type?.trim()) throw new Error('Type du credential requis');
    if (!credential.data) throw new Error('Données du credential requises');
    
    return this.makeRequest<N8nCredential>('/credentials', {
      method: 'POST',
      body: JSON.stringify(credential),
    });
  }

  async deleteCredential(id: string): Promise<N8nCredential> {
    if (!id) throw new Error('ID du credential requis');
    
    return this.makeRequest<N8nCredential>(`/credentials/${id}`, {
      method: 'DELETE',
    });
  }

  async getCredentialSchema(credentialTypeName: string): Promise<any> {
    if (!credentialTypeName) throw new Error('Nom du type de credential requis');
    
    return this.makeRequest<any>(`/credentials/schema/${credentialTypeName}`);
  }

  async transferCredential(id: string, destinationProjectId: string): Promise<void> {
    if (!id) throw new Error('ID du credential requis');
    if (!destinationProjectId) throw new Error('ID du projet de destination requis');
    
    await this.makeRequest<void>(`/credentials/${id}/transfer`, {
      method: 'PUT',
      body: JSON.stringify({ destinationProjectId }),
    });
  }

  // === TAGS ===
  async getTags(options: RequestOptions = {}): Promise<PaginatedResponse<N8nTag>> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/tags${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<N8nTag>>(endpoint);
  }

  async getTag(id: string): Promise<N8nTag> {
    if (!id) throw new Error('ID du tag requis');
    
    return this.makeRequest<N8nTag>(`/tags/${id}`);
  }

  async createTag(name: string): Promise<N8nTag> {
    if (!name?.trim()) throw new Error('Nom du tag requis');
    
    return this.makeRequest<N8nTag>('/tags', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
  }

  async updateTag(id: string, name: string): Promise<N8nTag> {
    if (!id) throw new Error('ID du tag requis');
    if (!name?.trim()) throw new Error('Nom du tag requis');
    
    return this.makeRequest<N8nTag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: name.trim() }),
    });
  }

  async deleteTag(id: string): Promise<N8nTag> {
    if (!id) throw new Error('ID du tag requis');
    
    return this.makeRequest<N8nTag>(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // === VARIABLES ===
  async getVariables(options: RequestOptions = {}): Promise<PaginatedResponse<N8nVariable>> {
    const queryString = this.buildQueryParams(options);
    const endpoint = `/variables${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest<PaginatedResponse<N8nVariable>>(endpoint);
  }

  async createVariable(key: string, value: string): Promise<void> {
    if (!key?.trim()) throw new Error('Clé de la variable requise');
    if (value === undefined || value === null) throw new Error('Valeur de la variable requise');
    
    await this.makeRequest<void>('/variables', {
      method: 'POST',
      body: JSON.stringify({ key: key.trim(), value }),
    });
  }

  async updateVariable(id: string, key: string, value: string): Promise<void> {
    if (!id) throw new Error('ID de la variable requis');
    if (!key?.trim()) throw new Error('Clé de la variable requise');
    if (value === undefined || value === null) throw new Error('Valeur de la variable requise');
    
    await this.makeRequest<void>(`/variables/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ key: key.trim(), value }),
    });
  }

  async deleteVariable(id: string): Promise<void> {
    if (!id) throw new Error('ID de la variable requis');
    
    await this.makeRequest<void>(`/variables/${id}`, {
      method: 'DELETE',
    });
  }

  // === AUDIT ===
  async generateAudit(additionalOptions?: { daysAbandonedWorkflow?: number; categories?: string[] }): Promise<any> {
    return this.makeRequest<any>('/audit', {
      method: 'POST',
      body: JSON.stringify({ additionalOptions: additionalOptions || {} }),
    });
  }

  // === SOURCE CONTROL ===
  async pullFromRemoteRepository(options: { force?: boolean; variables?: Record<string, any> }): Promise<any> {
    return this.makeRequest<any>('/source-control/pull', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // === MÉTHODES UTILITAIRES ===
  async executeWorkflow(workflowId: string, inputData: any = {}): Promise<any> {
    try {
      console.log(`🚀 Demande d'exécution du workflow: ${workflowId}`);
      
      // D'abord, s'assurer que le workflow est actif
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow non trouvé');
      }

      if (!workflow.active) {
        console.log('🔄 Activation du workflow avant exécution...');
        await this.activateWorkflow(workflowId);
      }

      console.log('⚠️ L\'exécution directe via API n\'est pas supportée par n8n');
      console.log('💡 Le workflow doit être déclenché par son trigger configuré');
      
      return {
        success: true,
        message: `Workflow "${workflow.name}" est maintenant actif et prêt à être déclenché`,
        workflowId: workflowId,
        workflowName: workflow.name,
        isActive: true,
        triggerInfo: 'Le workflow sera déclenché selon sa configuration de trigger',
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

  // === MÉTHODES DE COMPATIBILITÉ ===
  async getWorkflowExecutions(workflowId: string, options: RequestOptions = {}): Promise<PaginatedResponse<N8nExecution>> {
    return this.getExecutions({ ...options, workflowId });
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
}

export const n8nService = N8nService.getInstance();
