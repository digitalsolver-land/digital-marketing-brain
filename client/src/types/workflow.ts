
export interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_id: string;
  node_type: string;
  name: string;
  position_x: number;
  position_y: number;
  parameters: any;
}

export interface WorkflowConnection {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_index: number;
  target_index: number;
  connection_type: string;
}

export interface AppSettings {
  id?: string;
  user_id?: string;
  n8n_api_key?: string;
  n8n_base_url?: string;
  openrouter_api_key?: string;
  google_analytics_api?: string;
  google_search_console_api?: string;
  google_ads_api?: string;
  facebook_api?: string;
  twitter_api?: string;
  linkedin_api?: string;
  instagram_api?: string;
  postiz_api_key?: string;
  postiz_api_url?: string;
  whatsapp_api_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_verify_token?: string;
  whatsapp_ai_enabled?: boolean;  
  whatsapp_ai_instructions?: string;
  whatsapp_response_mode?: string;
  default_language?: string;
  timezone?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  auto_backup?: boolean;
  backup_frequency?: string;
  max_workflows?: number;
  data_retention_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

export interface UserWithRoles {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

export type AppRole = "admin" | "moderator" | "user" | "commercial" | "client";
