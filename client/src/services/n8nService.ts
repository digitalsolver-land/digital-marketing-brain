
import { supabase } from '@/integrations/supabase/client';

// Interfaces pour les réponses API n8n
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
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

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

export interface N8nConfig {
  apiKey: string;
  baseUrl: string;
}

class N8nService {
  private static instance: N8nService;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private lastError: string | null = null;
  private readonly REQUEST_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 3;
  private circuitBreakerOpen = false;
  private circuitBreakerTimeout: NodeJS.Timeout | null = null;
  private failureCount = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  public static getInstance(): N8nService {
    if (!N8nService.instance) {
      N8nService.instance = new N8nService();
    }
    return N8nService.instance;
  }

  // Méthode pour obtenir la configuration depuis user_secrets
  private async getN8nConfig(): Promise<N8nConfig | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-n8n-secrets');
      
      if (error) {
        console.error('❌ Erreur récupération config n8n:', error);
        return null;
      }

      if (data?.apiKey && data?.baseUrl) {
        return {
          apiKey: data.apiKey,
          baseUrl: data.baseUrl
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur récupération config n8n:', error);
      return null;
    }
  }

  async updateConfig(config: N8nConfig): Promise<void> {
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

      // Réinitialiser le circuit breaker en cas de succès
      this.resetCircuitBreaker();
      
      console.log('✅ Configuration n8n mise à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur mise à jour config n8n:', error);
      this.handleFailure();
      throw error;
    }
  }

  async checkConnection(): Promise<{ status: ConnectionStatus; error?: string }> {
    if (this.circuitBreakerOpen) {
      return { 
        status: 'error', 
        error: 'Service temporairement indisponible (circuit breaker ouvert)' 
      };
    }

    try {
      this.connectionStatus = 'checking';
      this.lastError = null;
      
      console.log('🔍 Vérification connexion n8n...');
      
      const { data, error } = await supabase.functions.invoke('test-n8n-connection');
      
      if (error) {
        console.error('❌ Erreur fonction edge:', error);
        this.connectionStatus = 'error';
        this.lastError = 'Erreur lors du test de connexion';
        this.handleFailure();
        return { status: 'error', error: this.lastError };
      }

      if (data?.success) {
        this.connectionStatus = 'connected';
        this.resetCircuitBreaker();
        console.log('✅ n8n connecté avec succès');
        return { status: 'connected' };
      } else {
        this.connectionStatus = 'error';
        this.lastError = data?.error || 'Test de connexion échoué';
        this.handleFailure();
        console.error('❌ Test de connexion échoué:', data);
        return { status: 'error', error: this.lastError };
      }
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error instanceof Error ? error.message : 'Erreur de connexion inconnue';
      this.handleFailure();
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
    return this.connectionStatus === 'connected' && !this.circuitBreakerOpen;
  }

  // Circuit breaker methods
  private handleFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.openCircuitBreaker();
    }
  }

  private openCircuitBreaker(): void {
    console.warn('🔒 Circuit breaker ouvert - Service n8n temporairement indisponible');
    this.circuitBreakerOpen = true;
    this.circuitBreakerTimeout = setTimeout(() => {
      this.circuitBreakerOpen = false;
      this.failureCount = 0;
      console.log('🔓 Circuit breaker fermé - Service n8n disponible');
    }, this.CIRCUIT_BREAKER_TIMEOUT);
  }

  private resetCircuitBreaker(): void {
    this.failureCount = 0;
    if (this.circuitBreakerTimeout) {
      clearTimeout(this.circuitBreakerTimeout);
      this.circuitBreakerTimeout = null;
    }
    this.circuitBreakerOpen = false;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    if (this.circuitBreakerOpen) {
      throw new Error('Service n8n temporairement indisponible');
    }

    try {
      console.log(`🌐 Requête n8n: ${options.method || 'GET'} ${endpoint}`);
      
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

      // Réinitialiser le circuit breaker en cas de succès
      this.resetCircuitBreaker();
      return data;
    } catch (error) {
      console.error(`❌ Erreur requête (tentative ${retryCount + 1}/${this.MAX_RETRIES}):`, error);
      
      // Ne pas retry si c'est une erreur d'authentification ou de configuration
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('Authentication') || 
          errorMessage.includes('API key') ||
          errorMessage.includes('401')) {
        this.handleFailure();
        throw error;
      }
      
      if (retryCount < this.MAX_RETRIES - 1) {
        const delay = Math.min(Math.pow(2, retryCount) * 1000, 10000); // Max 10s
        console.log(`🔄 Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      this.handleFailure();
      throw error;
    }
  }

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

  async getWorkflowUrl(workflowId: string): Promise<string> {
    const config = await this.getN8nConfig();
    const baseUrl = config?.baseUrl || 'https://n8n.srv860213.hstgr.cloud';
    return `${baseUrl}/workflow/${workflowId}`;
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

  async getProjects(options: RequestOptions = {}): Promise<PaginatedResponse<N8nProject>> {
    const queryParams = this.buildQueryParams(options);
    return this.makeRequest<PaginatedResponse<N8nProject>>(`/projects${queryParams}`);
  }

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

  // Méthodes pour le monitoring
  getMetrics() {
    return {
      connectionStatus: this.connectionStatus,
      circuitBreakerOpen: this.circuitBreakerOpen,
      failureCount: this.failureCount,
      lastError: this.lastError
    };
  }
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
