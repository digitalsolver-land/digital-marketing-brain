import { n8nConfigManager, N8nConfig } from '@/config/api';
import { supabase } from '@/integrations/supabase/client';

// Types unifiés pour n8n
export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes?: Array<{
    id?: string;
    name?: string;
    type?: string;
    typeVersion?: number;
    position?: [number, number];
    parameters?: any;
    credentials?: any;
  }>;
  connections?: {
    [key: string]: {
      main?: Array<Array<{
        node: string;
        type: string;
        index: number;
      }>>;
    };
  };
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

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface RequestOptions {
  limit?: number;
  cursor?: string;
  includeData?: boolean;
}

// États de connexion possibles
export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

// Interface pour les données JSON de workflow
interface WorkflowJsonData {
  nodes?: any[];
  connections?: any;
  settings?: any;
  staticData?: any;
  tags?: Array<{ id: string; name: string }>;
}

export class UnifiedN8nService {
  private static instance: UnifiedN8nService;
  private config: N8nConfig | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private lastError: string | null = null;

  public static getInstance(): UnifiedN8nService {
    if (!UnifiedN8nService.instance) {
      UnifiedN8nService.instance = new UnifiedN8nService();
    }
    return UnifiedN8nService.instance;
  }

  // === GESTION DE LA CONNEXION AMÉLIORÉE ===
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
        console.log('✅ n8n connecté avec succès via edge function');
        
        // Récupérer aussi la config pour l'utiliser localement
        this.config = await n8nConfigManager.getEffectiveConfig();
        
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

  private async testConnection(): Promise<boolean> {
    try {
      // Fallback : test direct si la fonction edge n'est pas disponible
      this.config = await n8nConfigManager.getEffectiveConfig();
      if (!this.config.apiKey) return false;
      
      await this.makeRequest('/workflows?limit=1');
      return true;
    } catch (error) {
      console.warn('⚠️ Test connexion direct échoué:', error);
      return false;
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

  // === MÉTHODES API AVEC GESTION D'ERREUR AMÉLIORÉE ===
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    if (!this.config) {
      this.config = await n8nConfigManager.getEffectiveConfig();
    }

    if (!this.config.apiKey) {
      throw new Error('Clé API n8n manquante. Configurez votre clé API dans les paramètres.');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const maxRetries = this.config.retries || 3;
    const timeout = this.config.timeout || 10000;
    const retryDelay = this.config.retryDelay || 1000;

    console.log(`🌐 Requête n8n: ${options.method || 'GET'} ${endpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.config.apiKey,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        
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
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout de la requête n8n (${timeout}ms)`);
      }

      // Retry logic pour les erreurs réseau ou serveur
      if (retryCount < maxRetries && this.shouldRetry(error)) {
        const delay = (retryCount + 1) * retryDelay;
        console.warn(`⚠️ Tentative ${retryCount + 1}/${maxRetries} échouée, retry dans ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      console.error(`❌ Erreur requête n8n: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry sur les erreurs réseau ou timeout
    return error instanceof TypeError || 
           (error instanceof Error && error.message.includes('fetch')) ||
           (error instanceof Error && error.message.includes('timeout')) ||
           (error instanceof Error && error.message.includes('503'));
  }

  // === WORKFLOWS ===
  async getWorkflows(options: RequestOptions = {}): Promise<PaginatedResponse<N8nWorkflow>> {
    const params = new URLSearchParams();
    
    // Augmenter la limite par défaut pour récupérer plus de workflows
    const limit = options.limit || 100;
    params.append('limit', limit.toString());
    
    if (options.cursor) params.append('cursor', options.cursor);
    
    const queryString = params.toString();
    const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;
    
    try {
      console.log(`📊 Récupération de ${limit} workflows depuis n8n...`);
      
      const response = await this.makeRequest<{ data: N8nWorkflow[]; nextCursor?: string }>(endpoint);
      
      // Enrichir les données des workflows
      const enrichedWorkflows = await this.enrichWorkflowsData(response.data || []);
      
      console.log(`✅ ${enrichedWorkflows.length} workflows récupérés et enrichis`);
      
      return {
        data: enrichedWorkflows,
        nextCursor: response.nextCursor
      };
    } catch (error) {
      console.error('❌ Erreur récupération workflows:', error);
      // En cas d'erreur, retourner les workflows locaux
      return await this.getLocalWorkflows(options);
    }
  }

  // Enrichir les données des workflows avec des détails supplémentaires
  private async enrichWorkflowsData(workflows: N8nWorkflow[]): Promise<N8nWorkflow[]> {
    const enrichedWorkflows: N8nWorkflow[] = [];
    
    for (const workflow of workflows) {
      try {
        if (workflow.id) {
          // Récupérer les détails complets du workflow
          const detailedWorkflow = await this.getWorkflowDetails(workflow.id);
          enrichedWorkflows.push(detailedWorkflow || workflow);
        } else {
          enrichedWorkflows.push(workflow);
        }
      } catch (error) {
        console.warn(`⚠️ Impossible d'enrichir le workflow ${workflow.name}:`, error);
        enrichedWorkflows.push(workflow);
      }
    }
    
    return enrichedWorkflows;
  }

  // Récupérer les détails complets d'un workflow
  private async getWorkflowDetails(workflowId: string): Promise<N8nWorkflow | null> {
    try {
      const workflow = await this.makeRequest<N8nWorkflow>(`/workflows/${workflowId}`);
      console.log(`📋 Détails récupérés pour workflow ${workflow.name}`);
      return workflow;
    } catch (error) {
      console.warn(`⚠️ Erreur récupération détails workflow ${workflowId}:`, error);
      return null;
    }
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    // Validation
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
      active: workflow.active || false,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {},
      tags: workflow.tags || []
    };

    try {
      console.log(`🚀 Création workflow "${workflow.name}" sur n8n...`);
      const createdWorkflow = await this.makeRequest<N8nWorkflow>('/workflows', {
        method: 'POST',
        body: JSON.stringify(workflowData),
      });
      
      console.log(`✅ Workflow "${createdWorkflow.name}" créé avec succès (ID: ${createdWorkflow.id})`);
      return createdWorkflow;
    } catch (error) {
      console.warn('⚠️ Échec création workflow n8n, fallback local');
      // Fallback: créer en local
      return await this.createLocalWorkflow(workflowData);
    }
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    console.log(`▶️ Activation workflow ${id}...`);
    const result = await this.makeRequest<N8nWorkflow>(`/workflows/${id}/activate`, {
      method: 'POST',
    });
    console.log(`✅ Workflow ${id} activé`);
    return result;
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    console.log(`⏸️ Désactivation workflow ${id}...`);
    const result = await this.makeRequest<N8nWorkflow>(`/workflows/${id}/deactivate`, {
      method: 'POST',
    });
    console.log(`✅ Workflow ${id} désactivé`);
    return result;
  }

  async deleteWorkflow(id: string): Promise<void> {
    console.log(`🗑️ Suppression workflow ${id}...`);
    await this.makeRequest<void>(`/workflows/${id}`, {
      method: 'DELETE',
    });
    console.log(`✅ Workflow ${id} supprimé`);
  }

  // === MÉTHODES LOCALES (FALLBACK) ===
  private async getLocalWorkflows(options: RequestOptions = {}): Promise<PaginatedResponse<N8nWorkflow>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [] };

      let query = supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: workflows, error } = await query;
      
      if (error) throw error;

      const n8nWorkflows: N8nWorkflow[] = (workflows || []).map(w => {
        const jsonData = w.json_data as WorkflowJsonData;
        return {
          id: w.n8n_workflow_id || w.id,
          name: w.name,
          active: w.status === 'active',
          nodes: jsonData?.nodes || [],
          connections: jsonData?.connections || {},
          settings: jsonData?.settings || {},
          staticData: jsonData?.staticData || {},
          tags: jsonData?.tags || [],
          createdAt: w.created_at,
          updatedAt: w.updated_at
        };
      });

      console.log(`✅ ${n8nWorkflows.length} workflows locaux récupérés`);
      return { data: n8nWorkflows };
    } catch (error) {
      console.error('❌ Erreur workflows locaux:', error);
      return { data: [] };
    }
  }

  private async createLocalWorkflow(workflowData: any): Promise<N8nWorkflow> {
    const { enhancedWorkflowService } = await import('./enhancedWorkflowService');
    const localWorkflow = await enhancedWorkflowService.createWorkflowFromJSON(workflowData);
    
    return {
      id: localWorkflow.id,
      name: localWorkflow.name,
      active: localWorkflow.status === 'active',
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: workflowData.settings,
      staticData: workflowData.staticData,
      tags: workflowData.tags,
      createdAt: localWorkflow.createdAt,
      updatedAt: localWorkflow.updatedAt
    };
  }

  // === MÉTHODES D'IMPORTATION ET SYNCHRONISATION ===
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

  // === CONFIGURATION ===
  async updateConfig(newConfig: Partial<N8nConfig>): Promise<void> {
    await n8nConfigManager.saveConfig(newConfig);
    this.config = await n8nConfigManager.getEffectiveConfig();
    
    // Re-tester la connexion avec la nouvelle config
    await this.checkConnection();
  }

  // === MÉTHODES UTILITAIRES ===
  async executeWorkflow(workflowId: string, inputData: any = {}): Promise<any> {
    try {
      console.log('🚀 Exécution du workflow:', workflowId);
      
      const config = await this.getConfiguration();
      
      const response = await fetch(`${config.baseUrl}/executions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: workflowId,
          runData: inputData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const execution = await response.json();
      console.log('✅ Workflow exécuté:', execution);
      
      return execution;
    } catch (error) {
      console.error('❌ Erreur exécution workflow:', error);
      throw error;
    }
  }

  async getWorkflowExecutions(workflowId: string, options: RequestOptions = {}): Promise<PaginatedResponse<N8nExecution>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const queryString = params.toString();
    const endpoint = `/workflows/${workflowId}/executions${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await this.makeRequest<{ data: N8nExecution[]; nextCursor?: string }>(endpoint);
      return {
        data: response.data || [],
        nextCursor: response.nextCursor
      };
    } catch (error) {
      console.error(`❌ Erreur récupération exécutions workflow ${workflowId}:`, error);
      return { data: [] };
    }
  }
}

export const unifiedN8nService = UnifiedN8nService.getInstance();
