
import { supabase } from '@/integrations/supabase/client';

// Types pour l'API n8n
export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters?: any;
  }>;
  connections: any;
  settings?: any;
  tags?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nApiResponse<T> {
  data: T[];
  nextCursor?: string;
}

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

class N8nApi {
  private static instance: N8nApi;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private lastError: string | null = null;

  public static getInstance(): N8nApi {
    if (!N8nApi.instance) {
      N8nApi.instance = new N8nApi();
    }
    return N8nApi.instance;
  }

  // Vérifier la connexion
  async checkConnection(): Promise<{ status: ConnectionStatus; error?: string }> {
    try {
      this.connectionStatus = 'checking';
      console.log('🔍 Test de connexion n8n...');
      
      const { data, error } = await supabase.functions.invoke('test-n8n-connection');
      
      if (error) {
        this.connectionStatus = 'error';
        this.lastError = 'Erreur lors du test de connexion';
        return { status: 'error', error: this.lastError };
      }

      if (data?.success) {
        this.connectionStatus = 'connected';
        this.lastError = null;
        console.log('✅ n8n connecté avec succès');
        return { status: 'connected' };
      } else {
        this.connectionStatus = 'error';
        this.lastError = data?.error || 'Test de connexion échoué';
        return { status: 'error', error: this.lastError };
      }
    } catch (error) {
      this.connectionStatus = 'error';
      this.lastError = error instanceof Error ? error.message : 'Erreur de connexion';
      return { status: 'error', error: this.lastError };
    }
  }

  // Obtenir le statut de connexion
  getConnectionStatus(): { status: ConnectionStatus; error?: string } {
    return { status: this.connectionStatus, error: this.lastError || undefined };
  }

  // Requête générique sécurisée
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { data: secrets, error: secretsError } = await supabase.functions.invoke('get-n8n-secrets');
    
    if (secretsError || !secrets?.n8n_api_key) {
      throw new Error('Configuration n8n manquante');
    }

    const url = `${secrets.n8n_base_url}${endpoint}`;
    console.log(`🌐 Requête n8n: ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': secrets.n8n_api_key,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue');
      throw new Error(`Erreur API n8n (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // API Methods
  async getWorkflows(): Promise<N8nApiResponse<N8nWorkflow>> {
    try {
      const result = await this.makeRequest<any>('/workflows?limit=100');
      return Array.isArray(result) ? { data: result } : result;
    } catch (error) {
      console.error('❌ Erreur getWorkflows:', error);
      throw error;
    }
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/activate`, { method: 'POST' });
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}/deactivate`, { method: 'POST' });
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.makeRequest(`/workflows/${id}`, { method: 'DELETE' });
  }

  getWorkflowUrl(workflowId: string): string {
    return `https://n8n.srv860213.hstgr.cloud/workflow/${workflowId}`;
  }

  // Sauvegarder la configuration
  async saveConfig(config: { apiKey: string; baseUrl: string }): Promise<void> {
    const { error } = await supabase.functions.invoke('save-n8n-config', {
      body: config
    });
    if (error) throw new Error(`Erreur sauvegarde: ${error.message}`);
  }
}

export const n8nApi = N8nApi.getInstance();
