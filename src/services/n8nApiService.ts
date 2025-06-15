
import { supabase } from '@/integrations/supabase/client';

export interface N8nWorkflow {
  id: string;
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

export interface N8nConfig {
  apiKey: string;
  baseUrl: string;
}

class N8nApiService {
  private config: N8nConfig | null = null;

  async loadConfig(): Promise<N8nConfig> {
    try {
      const { data, error } = await supabase.functions.invoke('get-n8n-secrets');
      
      if (error || !data?.n8n_api_key) {
        throw new Error('Configuration n8n manquante');
      }

      this.config = {
        apiKey: data.n8n_api_key,
        baseUrl: data.n8n_base_url || 'https://n8n.srv860213.hstgr.cloud/api/v1'
      };

      return this.config;
    } catch (error) {
      console.error('❌ Erreur chargement config n8n:', error);
      throw error;
    }
  }

  async saveConfig(config: N8nConfig): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('save-n8n-config', {
        body: config
      });

      if (error) {
        throw new Error(`Erreur sauvegarde: ${error.message}`);
      }

      this.config = config;
    } catch (error) {
      console.error('❌ Erreur sauvegarde config:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('test-n8n-connection');
      
      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      throw new Error('Configuration n8n non disponible');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.config.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue');
      throw new Error(`Erreur API n8n (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async getWorkflows(): Promise<N8nWorkflow[]> {
    try {
      console.log('📥 Récupération workflows n8n...');
      const result = await this.makeRequest<any>('/workflows?limit=100');
      
      const workflows = Array.isArray(result) ? result : (result.data || []);
      console.log(`✅ ${workflows.length} workflows récupérés`);
      
      return workflows;
    } catch (error) {
      console.error('❌ Erreur getWorkflows:', error);
      throw error;
    }
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>(`/workflows/${id}`);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.makeRequest(`/workflows/${id}`, { method: 'DELETE' });
    console.log(`🗑️ Workflow ${id} supprimé`);
  }

  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    const result = await this.makeRequest<N8nWorkflow>(`/workflows/${id}/activate`, { method: 'POST' });
    console.log(`▶️ Workflow ${id} activé`);
    return result;
  }

  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    const result = await this.makeRequest<N8nWorkflow>(`/workflows/${id}/deactivate`, { method: 'POST' });
    console.log(`⏸️ Workflow ${id} désactivé`);
    return result;
  }

  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const result = await this.makeRequest<N8nWorkflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
    console.log(`✨ Workflow créé: ${result.name}`);
    return result;
  }

  getWorkflowUrl(id: string): string {
    return `https://n8n.srv860213.hstgr.cloud/workflow/${id}`;
  }
}

export const n8nApiService = new N8nApiService();
