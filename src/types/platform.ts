export interface DashboardMetrics {
  seo: {
    organicTraffic: number;
    keywordRankings: number;
    backlinks: number;
    technicalIssues: number;
  };
  sem: {
    impressions: number;
    clicks: number;
    ctr: number;
    cost: number;
    conversions: number;
  };
  social: {
    followers: number;
    engagement: number;
    reach: number;
    posts: number;
  };
  overall: {
    totalVisits: number;
    conversionRate: number;
    roi: number;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: string;
  nodes: WorkflowNode[];
  lastExecution?: Date;
  executionCount: number;
  successRate: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface AIConversation {
  id: string;
  messages: ChatMessage[];
  context: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
}

export interface AIAction {
  type: 'workflow_creation' | 'api_call' | 'content_generation' | 'analysis';
  description: string;
  payload: any;
  status: 'pending' | 'completed' | 'failed';
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'blog' | 'social' | 'email' | 'ad';
  template: string;
  variables: string[];
  seoOptimized: boolean;
}

export interface CompetitorAnalysis {
  competitor: string;
  domain: string;
  seoMetrics: {
    organicKeywords: number;
    organicTraffic: number;
    backlinks: number;
  };
  contentStrategy: {
    postFrequency: number;
    topTopics: string[];
    avgEngagement: number;
  };
  lastUpdated: Date;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'seo' | 'sem' | 'social' | 'integrated';
  status: 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  budget: number;
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
  };
}
