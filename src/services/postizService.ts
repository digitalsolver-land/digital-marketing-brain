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
        // Mode démonstration si pas de clé API
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

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': this.apiKey,
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
        'Authorization': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erreur upload: ${response.status}`);
    }

    return response.json();
  }

  getDemoStatus(): boolean {
    return this.isDemo;
  }
}

export const postizService = new PostizService();
