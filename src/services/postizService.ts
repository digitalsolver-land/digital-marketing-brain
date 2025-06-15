
import { supabase } from '@/integrations/supabase/client';
import { DemoDataService } from './demoDataService';

export interface PostizIntegration {
  id: string;
  name: string;
  identifier: string;
  picture: string;
  disabled: boolean;
  profile: string;
  customer: {
    id: string;
    name: string;
  };
}

export interface PostizPost {
  id: string;
  content: string;
  publishDate: string;
  releaseURL?: string;
  state: 'QUEUE' | 'PUBLISHED' | 'ERROR' | 'DRAFT';
  integration: {
    id: string;
    providerIdentifier: string;
    name: string;
    picture: string;
  };
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface PostizAnalytics {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagement: number;
  topPerformingPost?: PostizPost;
  integrationStats: Array<{
    integrationId: string;
    name: string;
    posts: number;
    engagement: number;
  }>;
}

export interface CreatePostPayload {
  type: 'draft' | 'schedule' | 'now';
  date: string;
  shortLink: boolean;
  posts: {
    integration: { id: string };
    value: {
      content: string;
      id?: string;
      image?: { id: string; path: string }[];
    }[];
    group?: string;
    settings?: any;
  }[];
  tags?: { value: string; label: string }[];
}

export interface UploadResponse {
  id: string;
  name: string;
  path: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostizLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  integrationId: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  notes?: string;
}

export interface AutoPostingRule {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    days?: string[];
  };
  integrations: string[];
  contentType: 'ai_generated' | 'template' | 'rss';
  parameters: {
    prompt?: string;
    template?: string;
    rssUrl?: string;
    keywords?: string[];
  };
}

class PostizService {
  private baseURL = 'https://api.postiz.com/public/v1';
  private apiKey = '';
  private isDemo = false;

  async initialize(userId: string) {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('postiz_api_key, postiz_api_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.postiz_api_key) {
        this.apiKey = data.postiz_api_key;
        this.isDemo = false;
        if (data.postiz_api_url) {
          this.baseURL = data.postiz_api_url;
        }
      } else {
        this.isDemo = true;
        console.log('🎭 Mode démonstration Postiz activé - configurez votre clé API dans les paramètres');
      }
    } catch (error) {
      console.error('Error initializing Postiz service:', error);
      this.isDemo = true;
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
    this.isDemo = !key;
  }

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey && !this.isDemo) {
      throw new Error('API Key Postiz non configurée');
    }

    if (this.isDemo) {
      throw new Error('Mode démonstration - utilisez les méthodes de service spécifiques');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur API Postiz: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getIntegrations(): Promise<PostizIntegration[]> {
    if (this.isDemo) {
      return DemoDataService.simulateAPICall(DemoDataService.getDemoIntegrations(), 800);
    }
    return this.makeRequest<PostizIntegration[]>('/integrations');
  }

  async getPosts(params: {
    display: 'day' | 'week' | 'month';
    day?: number;
    week?: number;
    month?: number;
    year: number;
  }): Promise<{ posts: PostizPost[] }> {
    if (this.isDemo) {
      const demoPosts = DemoDataService.getDemoPosts();
      return DemoDataService.simulateAPICall({ posts: demoPosts }, 1000);
    }

    const queryParams = new URLSearchParams();
    queryParams.append('display', params.display);
    queryParams.append('year', params.year.toString());
    
    if (params.day !== undefined) queryParams.append('day', params.day.toString());
    if (params.week !== undefined) queryParams.append('week', params.week.toString());
    if (params.month !== undefined) queryParams.append('month', params.month.toString());

    return this.makeRequest<{ posts: PostizPost[] }>(`/posts?${queryParams.toString()}`);
  }

  async createPost(payload: CreatePostPayload): Promise<{ postId: string; integration: string }[]> {
    if (this.isDemo) {
      return DemoDataService.createDemoPost();
    }
    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deletePost(postId: string): Promise<{ id: string }> {
    if (this.isDemo) {
      return DemoDataService.deleteDemoPost(postId);
    }
    return this.makeRequest(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async uploadFile(file: File): Promise<UploadResponse> {
    if (this.isDemo) {
      return DemoDataService.uploadDemoFile(file);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erreur upload: ${response.status}`);
    }

    return response.json();
  }

  async getAnalytics(integrationId?: string): Promise<PostizAnalytics> {
    if (this.isDemo) {
      return DemoDataService.getDemoAnalytics();
    }
    
    const endpoint = integrationId ? `/analytics?integration=${integrationId}` : '/analytics';
    return this.makeRequest<PostizAnalytics>(endpoint);
  }

  async getLeads(): Promise<PostizLead[]> {
    if (this.isDemo) {
      return DemoDataService.getDemoLeads();
    }
    return this.makeRequest<PostizLead[]>('/leads');
  }

  async updateLead(leadId: string, updates: Partial<PostizLead>): Promise<PostizLead> {
    if (this.isDemo) {
      return DemoDataService.updateDemoLead(leadId, updates);
    }
    return this.makeRequest<PostizLead>(`/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getAutoPostingRules(): Promise<AutoPostingRule[]> {
    if (this.isDemo) {
      return DemoDataService.getDemoAutoPostingRules();
    }
    return this.makeRequest<AutoPostingRule[]>('/auto-posting/rules');
  }

  async createAutoPostingRule(rule: Omit<AutoPostingRule, 'id'>): Promise<AutoPostingRule> {
    if (this.isDemo) {
      return DemoDataService.createDemoAutoPostingRule(rule);
    }
    return this.makeRequest<AutoPostingRule>('/auto-posting/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async updateAutoPostingRule(ruleId: string, updates: Partial<AutoPostingRule>): Promise<AutoPostingRule> {
    if (this.isDemo) {
      return DemoDataService.updateDemoAutoPostingRule(ruleId, updates);
    }
    return this.makeRequest<AutoPostingRule>(`/auto-posting/rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAutoPostingRule(ruleId: string): Promise<{ id: string }> {
    if (this.isDemo) {
      return DemoDataService.deleteDemoAutoPostingRule(ruleId);
    }
    return this.makeRequest(`/auto-posting/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async triggerAutoPost(ruleId: string): Promise<{ success: boolean; posts: any[] }> {
    if (this.isDemo) {
      return DemoDataService.triggerDemoAutoPost(ruleId);
    }
    return this.makeRequest(`/auto-posting/rules/${ruleId}/trigger`, {
      method: 'POST',
    });
  }

  getDemoStatus(): boolean {
    return this.isDemo;
  }
}

export const postizService = new PostizService();
