
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: string;
  nodes: any[];
  executionCount: number;
  successRate: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  n8nWorkflowId?: string;
  jsonData?: any;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  avatarUrl?: string;
  preferences: any;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  type: 'email' | 'social' | 'ads';
  startDate: string;
  endDate?: string;
  budget?: number;
  spent?: number;
  impressions: number;
  clicks: number;
  conversions: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'blocked';
  source: string;
  lastInteraction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio';
  timestamp: string;
  read: boolean;
  metadata?: any;
}

export interface Conversation {
  id: string;
  contactId: string;
  platform: 'whatsapp' | 'email' | 'sms';
  status: 'open' | 'closed' | 'pending';
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}
