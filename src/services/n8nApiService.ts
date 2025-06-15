import { supabase } from '@/integrations/supabase/client';
import { getEffectiveN8nConfig } from '@/config/api';

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

export interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isPending: boolean;
  createdAt: string;
}

export interface N8nProject {
  id: string;
  name: string;
  type: string;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
}

export interface N8nTag {
  id: string;
  name: string;
}

export interface N8nVariable {
  id: string;
  key: string;
  type?: string;
  value?: string;
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
}

class N8nApiService {
  private static instance: N8nApiService;
  private readonly REQUEST_TIMEOUT = 10000; // 10 secondes
  private readonly MAX_RETRIES = 3;

  public static getInstance(): N8nApiService {
    if (!N8nApiService.instance) {
      N8nApiService.instance = new N8nApiService();
    }
    return N8nApiService.instance;
  }

  private async getApiConfig() {
    try {
      // Essayer d'abord de récupérer depuis Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('n8n_api_key')
          .eq('user_id', user.id)
          .single();
        
        if (settings?.n8n_api_key) {
          console.log('✅ Clé API n8n récupérée depuis Supabase');
          return {
            baseUrl: 'http://localhost:5678/api/v1',
            apiKey: settings.n8n_api_key
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer la config depuis Supabase:', error);
    }

    // Fallback sur la configuration locale
    const config = getEffectiveN8nConfig();
    console.log('📋 Utilisation configuration locale n8n');
    return config;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const { baseUrl, apiKey } = await this.getApiConfig();
    
    if (!apiKey) {
      throw new Error('Clé API n8n manquante. Configurez votre clé API dans les paramètres.');
    }

    const url = `${baseUrl}${endpoint}`;
    console.log(`🌐 Requête n8n: ${options.method || 'GET'} ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
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
        
        // Gestion des erreurs spécifiques
        if (response.status === 401) {
          throw new Error('Clé API n8n invalide ou expirée');
        } else if (response.status === 403) {
          throw new Error('Accès refusé - vérifiez les permissions de la clé API');
        } else if (response.status === 404) {
          throw new Error('Endpoint API n8n non trouvé');
        } else if (response.status >= 500) {
          throw new Error('Erreur serveur n8n');
        } else {
          throw new Error(`Erreur API n8n (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      console.log(`✅ Requête n8n réussie: ${options.method || 'GET'} ${url}`);
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout de la requête n8n (10s)');
      }

      // Retry logic pour les erreurs réseau
      if (retryCount < this.MAX_RETRIES && 
          (error instanceof TypeError || 
           (error instanceof Error && error.message.includes('fetch')))) {
        console.warn(`⚠️ Tentative ${retryCount + 1}/${this.MAX_RETRIES} échouée, retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      console.error(`❌ Erreur requête n8n: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    }
  }

  async isN8nAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Test de disponibilité n8n...');
      await this.makeRequest('/workflows?limit=1');
      console.log('✅ n8n disponible');
      return true;
    } catch (error) {
      console.warn('⚠️ n8n non disponible:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  // === WORKFLOWS ===
  async getWorkflows(options: RequestOptions = {}): Promise<PaginatedResponse<N8nWorkflow>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const queryString = params.toString();
    const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<{ data: N8nWorkflow[]; nextCursor?: string }>(endpoint);
    
    return {
      data: response.data || [],
      nextCursor: response.nextCursor
    };
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`);
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    // Validation des données avant envoi
    if (!workflow.name?.trim()) {
      throw new Error('Le nom du workflow est requis');
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new Error('Au moins un nœud est requis');
    }

    console.log('🚀 Création workflow n8n:', workflow.name);
    
    const workflowData = {
      name: workflow.name.trim(),
      nodes: workflow.nodes || [],
      connections: workflow.connections || {},
      active: workflow.active || false,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {},
      tags: workflow.tags || []
    };

    return this.makeRequest<N8nWorkflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    console.log('🔄 Mise à jour workflow n8n:', id);
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string): Promise<void> {
    if (!id) throw new Error('ID du workflow requis');
    
    console.log('🗑️ Suppression workflow n8n:', id);
    await this.makeRequest<void>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    console.log('▶️ Activation workflow n8n:', id);
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    if (!id) throw new Error('ID du workflow requis');
    
    console.log('⏸️ Désactivation workflow n8n:', id);
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // === EXECUTIONS ===
  async getExecutions(options: RequestOptions = {}): Promise<PaginatedResponse<N8nExecution>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    if (options.includeData !== undefined) params.append('includeData', options.includeData.toString());
    
    const queryString = params.toString();
    const endpoint = `/executions${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<{ data: N8nExecution[]; nextCursor?: string }>(endpoint);
    
    return {
      data: response.data || [],
      nextCursor: response.nextCursor
    };
  }

  async deleteExecution(id: string): Promise<void> {
    if (!id) throw new Error('ID de l\'exécution requis');
    
    console.log('🗑️ Suppression exécution n8n:', id);
    await this.makeRequest<void>(`/executions/${id}`, {
      method: 'DELETE',
    });
  }

  // === USERS ===
  async getUsers(options: RequestOptions = {}): Promise<PaginatedResponse<N8nUser>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const queryString = params.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<{ data: N8nUser[]; nextCursor?: string }>(endpoint);
    
    return {
      data: response.data || [],
      nextCursor: response.nextCursor
    };
  }

  // === PROJECTS ===
  async getProjects(options: RequestOptions = {}): Promise<PaginatedResponse<N8nProject>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const queryString = params.toString();
    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await this.makeRequest<{ data: N8nProject[]; nextCursor?: string }>(endpoint);
      return {
        data: response.data || [],
        nextCursor: response.nextCursor
      };
    } catch (error) {
      // Les projets peuvent ne pas être disponibles dans toutes les versions de n8n
      console.warn('⚠️ Projets non disponibles:', error);
      return { data: [] };
    }
  }

  async createProject(name: string): Promise<N8nProject> {
    if (!name?.trim()) throw new Error('Nom du projet requis');
    
    console.log('🚀 Création projet n8n:', name);
    return this.makeRequest<N8nProject>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
  }

  // === TAGS ===
  async getTags(options: RequestOptions = {}): Promise<PaginatedResponse<N8nTag>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const queryString = params.toString();
    const endpoint = `/tags${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await this.makeRequest<{ data: N8nTag[]; nextCursor?: string }>(endpoint);
      return {
        data: response.data || [],
        nextCursor: response.nextCursor
      };
    } catch (error) {
      console.warn('⚠️ Tags non disponibles:', error);
      return { data: [] };
    }
  }

  // === VARIABLES ===
  async getVariables(options: RequestOptions = {}): Promise<PaginatedResponse<N8nVariable>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.cursor) params.append('cursor', options.cursor);
    
    const queryString = params.toString();
    const endpoint = `/variables${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await this.makeRequest<{ data: N8nVariable[]; nextCursor?: string }>(endpoint);
      return {
        data: response.data || [],
        nextCursor: response.nextCursor
      };
    } catch (error) {
      console.warn('⚠️ Variables non disponibles:', error);
      return { data: [] };
    }
  }

  // === AUDIT ===
  async generateAudit(): Promise<N8nAuditReport[]> {
    try {
      console.log('🔍 Génération rapport audit n8n...');
      
      // Récupérer les workflows pour audit
      const workflowsResponse = await this.getWorkflows({ limit: 100 });
      const workflows = workflowsResponse.data;
      
      const reports: N8nAuditReport[] = [];
      
      // Audit de sécurité basique
      const securityIssues = workflows.filter(w => {
        return w.nodes?.some(node => 
          node.type?.includes('webhook') && 
          !node.parameters?.authentication
        );
      });

      if (securityIssues.length > 0) {
        reports.push({
          risk: 'high',
          sections: [{
            title: 'Webhooks non sécurisés',
            description: `${securityIssues.length} workflow(s) utilisent des webhooks sans authentification`,
            recommendation: 'Activez l\'authentification sur tous les webhooks pour éviter les accès non autorisés',
            location: securityIssues.flatMap(w => 
              w.nodes?.filter(n => n.type?.includes('webhook')).map(n => ({
                workflowName: w.name,
                nodeName: n.name,
                nodeType: n.type
              })) || []
            )
          }]
        });
      }

      // Audit de performance
      const complexWorkflows = workflows.filter(w => (w.nodes?.length || 0) > 20);
      if (complexWorkflows.length > 0) {
        reports.push({
          risk: 'medium',
          sections: [{
            title: 'Workflows complexes',
            description: `${complexWorkflows.length} workflow(s) ont plus de 20 nœuds`,
            recommendation: 'Considérez diviser les workflows complexes en sous-workflows pour améliorer les performances',
            location: complexWorkflows.map(w => ({
              workflowName: w.name,
              nodeName: `${w.nodes?.length} nœuds`,
              nodeType: 'workflow'
            }))
          }]
        });
      }

      // Si aucun problème trouvé
      if (reports.length === 0) {
        reports.push({
          risk: 'low',
          sections: [{
            title: 'Aucun problème détecté',
            description: 'Votre configuration n8n semble correcte',
            recommendation: 'Continuez à suivre les bonnes pratiques de sécurité et de performance'
          }]
        });
      }

      console.log(`✅ ${reports.length} rapport(s) d'audit généré(s)`);
      return reports;
      
    } catch (error) {
      console.error('❌ Erreur génération audit:', error);
      throw new Error('Impossible de générer le rapport d\'audit');
    }
  }
}

export const n8nApiService = N8nApiService.getInstance();
