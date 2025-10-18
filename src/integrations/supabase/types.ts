export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_traces: {
        Row: {
          created_at: string | null
          final: Json | null
          id: string
          input: Json
          steps: Json
          task_type: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          final?: Json | null
          id?: string
          input: Json
          steps: Json
          task_type: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          final?: Json | null
          id?: string
          input?: Json
          steps?: Json
          task_type?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          error_code: string | null
          id: string
          ip_address: unknown | null
          latency_ms: number | null
          metadata: Json | null
          resource: string | null
          scope: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_code?: string | null
          id?: string
          ip_address?: unknown | null
          latency_ms?: number | null
          metadata?: Json | null
          resource?: string | null
          scope?: string | null
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_code?: string | null
          id?: string
          ip_address?: unknown | null
          latency_ms?: number | null
          metadata?: Json | null
          resource?: string | null
          scope?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_actions: {
        Row: {
          action: string
          confidence: number
          created_at: string
          executed_at: string | null
          id: string
          payload: Json | null
          reasoning: string | null
          status: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          confidence: number
          created_at?: string
          executed_at?: string | null
          id?: string
          payload?: Json | null
          reasoning?: string | null
          status?: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          confidence?: number
          created_at?: string
          executed_at?: string | null
          id?: string
          payload?: Json | null
          reasoning?: string | null
          status?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      beta_feedback: {
        Row: {
          created_at: string | null
          description: string
          id: string
          priority: string | null
          route: string | null
          session_context: Json | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          route?: string | null
          session_context?: Json | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          route?: string | null
          session_context?: Json | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      beta_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      beta_signups: {
        Row: {
          approved_at: string | null
          created_at: string | null
          email: string
          email_volume: string
          id: string
          invite_sent_at: string | null
          name: string
          platform_used: string
          profession: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          email: string
          email_volume: string
          id?: string
          invite_sent_at?: string | null
          name: string
          platform_used: string
          profession: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          email?: string
          email_volume?: string
          id?: string
          invite_sent_at?: string | null
          name?: string
          platform_used?: string
          profession?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_retention_settings: {
        Row: {
          auto_delete_bodies: boolean | null
          cache_duration_hours: number | null
          created_at: string | null
          id: string
          retention_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_delete_bodies?: boolean | null
          cache_duration_hours?: number | null
          created_at?: string | null
          id?: string
          retention_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_delete_bodies?: boolean | null
          cache_duration_hours?: number | null
          created_at?: string | null
          id?: string
          retention_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          response_time_seconds: number | null
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          response_time_seconds?: number | null
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          response_time_seconds?: number | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_queue: {
        Row: {
          attempt: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          name: string
          payload: Json
          scheduled_for: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          attempt?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          name: string
          payload: Json
          scheduled_for?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          attempt?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          name?: string
          payload?: Json
          scheduled_for?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mem_contacts: {
        Row: {
          contact: string
          created_at: string | null
          id: string
          last_interaction: string | null
          notes: string | null
          preferences: Json | null
          user_id: string
        }
        Insert: {
          contact: string
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          notes?: string | null
          preferences?: Json | null
          user_id: string
        }
        Update: {
          contact?: string
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          notes?: string | null
          preferences?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      mem_prefs: {
        Row: {
          created_at: string | null
          flags: Json | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flags?: Json | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          flags?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mem_threads: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          subject: string | null
          summary: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          subject?: string | null
          summary?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          subject?: string | null
          summary?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_connections: {
        Row: {
          access_token: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          steps: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          steps?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          steps?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      privacy_consents: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted: boolean
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          beta_joined_at: string | null
          beta_pioneer: boolean | null
          created_at: string | null
          default_tone: string | null
          email: string
          email_signature: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          beta_joined_at?: string | null
          beta_pioneer?: boolean | null
          created_at?: string | null
          default_tone?: string | null
          email: string
          email_signature?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          beta_joined_at?: string | null
          beta_pioneer?: boolean | null
          created_at?: string | null
          default_tone?: string | null
          email?: string
          email_signature?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      recommendation_preferences: {
        Row: {
          hour_bias: Json | null
          id: string
          updated_at: string
          user_id: string
          weights: Json | null
        }
        Insert: {
          hour_bias?: Json | null
          id?: string
          updated_at?: string
          user_id: string
          weights?: Json | null
        }
        Update: {
          hour_bias?: Json | null
          id?: string
          updated_at?: string
          user_id?: string
          weights?: Json | null
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          body: string
          created_at: string
          id: string
          send_at: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          send_at: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          send_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          user_id?: string
        }
        Relationships: []
      }
      team_patterns: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          last_updated: string | null
          metric: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          last_updated?: string | null
          metric: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          last_updated?: string | null
          metric?: string
          team_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_team_links: {
        Row: {
          created_at: string | null
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_team_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_profiles: {
        Row: {
          created_at: string
          id: string
          profile: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile?: Json
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
      cleanup_expired_oauth_states: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_email_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_oauth_token: {
        Args: { _provider: string; _user_id: string }
        Returns: {
          access_token: string
          expires_at: string
          refresh_token: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_team_role: {
        Args: { _team_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member" | "user" | "team_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "user", "team_manager"],
    },
  },
} as const
