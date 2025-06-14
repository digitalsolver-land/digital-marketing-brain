
import { API_CONFIG } from '@/config/api';
import { Workflow } from '@/types/platform';

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

  async getWorkflows(): Promise<Workflow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erreur récupération workflows:', error);
      return [];
    }
  }

  async createWorkflow(workflow: any): Promise<Workflow> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur création workflow:', error);
      throw new Error('Échec de la création du workflow');
    }
  }

  async updateWorkflow(id: string, workflow: any): Promise<Workflow> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur mise à jour workflow:', error);
      throw new Error('Échec de la mise à jour du workflow');
    }
  }

  async executeWorkflow(id: string, data?: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${id}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur exécution workflow:', error);
      throw new Error('Échec de l\'exécution du workflow');
    }
  }

  async getExecutions(workflowId?: string): Promise<any[]> {
    try {
      const url = workflowId 
        ? `${this.baseUrl}/executions?workflowId=${workflowId}`
        : `${this.baseUrl}/executions`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erreur récupération exécutions:', error);
      return [];
    }
  }

  async activateWorkflow(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/active-workflows/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erreur activation workflow:', error);
      throw new Error('Échec de l\'activation du workflow');
    }
  }

  async deactivateWorkflow(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/active-workflows/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erreur désactivation workflow:', error);
      throw new Error('Échec de la désactivation du workflow');
    }
  }
}

export const n8nService = N8nService.getInstance();
