
export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  tags?: N8nTag[];
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
}

export interface N8nExecution {
  id: string;
  workflowId?: string;
  mode: string;
  finished: boolean;
  startedAt: string;
  stoppedAt?: string;
  data?: any;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
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
  type: 'string' | 'number' | 'boolean' | 'json';
}

export interface N8nProject {
  id: string;
  name: string;
  type: string;
  relations: any[];
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface RequestOptions {
  limit?: number;
  cursor?: string;
  filter?: Record<string, any>;
  includeData?: boolean;
  workflowId?: string;
}
