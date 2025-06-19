
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          auto_backup: boolean | null
          backup_frequency: string | null
          created_at: string | null
          data_retention_days: number | null
          default_language: string | null
          email_notifications: boolean | null
          facebook_api: string | null
          google_ads_api: string | null
          google_analytics_api: string | null
          google_search_console_api: string | null
          id: string
          instagram_api: string | null
          linkedin_api: string | null
          max_workflows: number | null
          n8n_api_key: string | null
          n8n_base_url: string | null
          openrouter_api_key: string | null
          postiz_api_key: string | null
          postiz_api_url: string | null
          sms_notifications: boolean | null
          timezone: string | null
          twitter_api: string | null
          updated_at: string | null
          user_id: string
          whatsapp_ai_enabled: boolean | null
          whatsapp_ai_instructions: string | null
          whatsapp_api_token: string | null
          whatsapp_phone_number_id: string | null
          whatsapp_response_mode: string | null
          whatsapp_verify_token: string | null
        }
        Insert: {
          auto_backup?: boolean | null
          backup_frequency?: string | null
          created_at?: string | null
          data_retention_days?: number | null
          default_language?: string | null
          email_notifications?: boolean | null
          facebook_api?: string | null
          google_ads_api?: string | null
          google_analytics_api?: string | null
          google_search_console_api?: string | null
          id?: string
          instagram_api?: string | null
          linkedin_api?: string | null
          max_workflows?: number | null
          n8n_api_key?: string | null
          n8n_base_url?: string | null
          openrouter_api_key?: string | null
          postiz_api_key?: string | null
          postiz_api_url?: string | null
          sms_notifications?: boolean | null
          timezone?: string | null
          twitter_api?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_ai_enabled?: boolean | null
          whatsapp_ai_instructions?: string | null
          whatsapp_api_token?: string | null
          whatsapp_phone_number_id?: string | null
          whatsapp_response_mode?: string | null
          whatsapp_verify_token?: string | null
        }
        Update: {
          auto_backup?: boolean | null
          backup_frequency?: string | null
          created_at?: string | null
          data_retention_days?: number | null
          default_language?: string | null
          email_notifications?: boolean | null
          facebook_api?: string | null
          google_ads_api?: string | null
          google_analytics_api?: string | null
          google_search_console_api?: string | null
          id?: string
          instagram_api?: string | null
          linkedin_api?: string | null
          max_workflows?: number | null
          n8n_api_key?: string | null
          n8n_base_url?: string | null
          openrouter_api_key?: string | null
          postiz_api_key?: string | null
          postiz_api_url?: string | null
          sms_notifications?: boolean | null
          timezone?: string | null
          twitter_api?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_ai_enabled?: boolean | null
          whatsapp_ai_instructions?: string | null
          whatsapp_api_token?: string | null
          whatsapp_phone_number_id?: string | null
          whatsapp_response_mode?: string | null
          whatsapp_verify_token?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_secrets: {
        Row: {
          created_at: string | null
          encrypted_value: string | null
          id: string
          is_encrypted: boolean | null
          secret_name: string
          secret_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          secret_name: string
          secret_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          secret_name?: string
          secret_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workflow_connections: {
        Row: {
          connection_type: string | null
          created_at: string
          id: string
          source_index: number | null
          source_node_id: string
          target_index: number | null
          target_node_id: string
          workflow_id: string
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          id?: string
          source_index?: number | null
          source_node_id: string
          target_index?: number | null
          target_node_id: string
          workflow_id: string
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          id?: string
          source_index?: number | null
          source_node_id?: string
          target_index?: number | null
          target_node_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_connections_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          error_message: string | null
          execution_data: Json | null
          finished_at: string | null
          id: string
          n8n_execution_id: number | null
          started_at: string
          status: string
          workflow_id: string
        }
        Insert: {
          error_message?: string | null
          execution_data?: Json | null
          finished_at?: string | null
          id?: string
          n8n_execution_id?: number | null
          started_at?: string
          status: string
          workflow_id: string
        }
        Update: {
          error_message?: string | null
          execution_data?: Json | null
          finished_at?: string | null
          id?: string
          n8n_execution_id?: number | null
          started_at?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_nodes: {
        Row: {
          created_at: string
          id: string
          name: string
          node_id: string
          node_type: string
          parameters: Json | null
          position_x: number
          position_y: number
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          node_id: string
          node_type: string
          parameters?: Json | null
          position_x: number
          position_y: number
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          node_id?: string
          node_type?: string
          parameters?: Json | null
          position_x?: number
          position_y?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          json_data: Json
          n8n_workflow_id: string | null
          name: string
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          json_data: Json
          n8n_workflow_id?: string | null
          name: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          json_data?: Json
          n8n_workflow_id?: string | null
          name?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_app_setting: {
        Args: { p_key: string }
        Returns: Json
      }
      get_n8n_secrets: {
        Args: { input_user_id: string }
        Returns: {
          api_key: string
          base_url: string
        }[]
      }
      get_or_create_user_settings: {
        Args: { input_user_id: string }
        Returns: {
          id: string
          user_id: string
          n8n_api_key: string
          n8n_base_url: string
          openrouter_api_key: string
          google_analytics_api: string
          google_search_console_api: string
          google_ads_api: string
          facebook_api: string
          twitter_api: string
          linkedin_api: string
          instagram_api: string
          postiz_api_key: string
          postiz_api_url: string
          whatsapp_api_token: string
          whatsapp_phone_number_id: string
          whatsapp_verify_token: string
          whatsapp_ai_enabled: boolean
          whatsapp_ai_instructions: string
          whatsapp_response_mode: string
          default_language: string
          timezone: string
          email_notifications: boolean
          sms_notifications: boolean
          auto_backup: boolean
          backup_frequency: string
          max_workflows: number
          data_retention_days: number
          created_at: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      save_n8n_secrets: {
        Args: { input_user_id: string; api_key: string; base_url?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "commercial" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "commercial", "client"],
    },
  },
} as const
