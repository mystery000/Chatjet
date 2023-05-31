export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      domains: {
        Row: {
          id: number;
          inserted_at: string;
          name: string;
          project_id: string;
        };
        Insert: {
          id?: number;
          inserted_at?: string;
          name: string;
          project_id: string;
        };
        Update: {
          id?: number;
          inserted_at?: string;
          name?: string;
          project_id?: string;
        };
      };
      file_sections: {
        Row: {
          content: string | null;
          embedding: string | null;
          file_id: number;
          id: number;
          token_count: number | null;
        };
        Insert: {
          content?: string | null;
          embedding?: string | null;
          file_id: number;
          id?: number;
          token_count?: number | null;
        };
        Update: {
          content?: string | null;
          embedding?: string | null;
          file_id?: number;
          id?: number;
          token_count?: number | null;
        };
      };
      files: {
        Row: {
          checksum: string | null;
          id: number;
          meta: Json | null;
          path: string;
          project_id: string | null;
          source_id: string | null;
          updated_at: string;
        };
        Insert: {
          checksum?: string | null;
          id?: number;
          meta?: Json | null;
          path: string;
          project_id?: string | null;
          source_id?: string | null;
          updated_at?: string;
        };
        Update: {
          checksum?: string | null;
          id?: number;
          meta?: Json | null;
          path?: string;
          project_id?: string | null;
          source_id?: string | null;
          updated_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          inserted_at: string;
          team_id: string;
          type: Database['public']['Enums']['membership_type'];
          user_id: string;
        };
        Insert: {
          id?: string;
          inserted_at?: string;
          team_id: string;
          type: Database['public']['Enums']['membership_type'];
          user_id: string;
        };
        Update: {
          id?: string;
          inserted_at?: string;
          team_id?: string;
          type?: Database['public']['Enums']['membership_type'];
          user_id?: string;
        };
      };
      projects: {
        Row: {
          created_by: string;
          github_repo: string | null;
          id: string;
          inserted_at: string;
          is_starter: boolean;
          markprompt_config: Json | null;
          name: string;
          openai_key: string | null;
          private_dev_api_key: string;
          public_api_key: string;
          slug: string;
          team_id: string;
        };
        Insert: {
          created_by: string;
          github_repo?: string | null;
          id?: string;
          inserted_at?: string;
          is_starter?: boolean;
          markprompt_config?: Json | null;
          name: string;
          openai_key?: string | null;
          private_dev_api_key: string;
          public_api_key: string;
          slug: string;
          team_id: string;
        };
        Update: {
          created_by?: string;
          github_repo?: string | null;
          id?: string;
          inserted_at?: string;
          is_starter?: boolean;
          markprompt_config?: Json | null;
          name?: string;
          openai_key?: string | null;
          private_dev_api_key?: string;
          public_api_key?: string;
          slug?: string;
          team_id?: string;
        };
      };
      prompt_configs: {
        Row: {
          config: Json | null;
          created_at: string;
          id: string;
          project_id: string;
          share_key: string | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string;
          id?: string;
          project_id: string;
          share_key?: string | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string;
          id?: string;
          project_id?: string;
          share_key?: string | null;
        };
      };
      query_stats: {
        Row: {
          created_at: string;
          downvoted: boolean | null;
          embedding: string | null;
          id: string;
          no_response: boolean | null;
          processed: boolean;
          project_id: string;
          prompt: string | null;
          response: string | null;
          upvoted: boolean | null;
        };
        Insert: {
          created_at?: string;
          downvoted?: boolean | null;
          embedding?: string | null;
          id?: string;
          no_response?: boolean | null;
          processed?: boolean;
          project_id: string;
          prompt?: string | null;
          response?: string | null;
          upvoted?: boolean | null;
        };
        Update: {
          created_at?: string;
          downvoted?: boolean | null;
          embedding?: string | null;
          id?: string;
          no_response?: boolean | null;
          processed?: boolean;
          project_id?: string;
          prompt?: string | null;
          response?: string | null;
          upvoted?: boolean | null;
        };
      };
      sources: {
        Row: {
          data: Json | null;
          id: string;
          inserted_at: string;
          project_id: string;
          type: Database['public']['Enums']['source_type'];
        };
        Insert: {
          data?: Json | null;
          id?: string;
          inserted_at?: string;
          project_id: string;
          type: Database['public']['Enums']['source_type'];
        };
        Update: {
          data?: Json | null;
          id?: string;
          inserted_at?: string;
          project_id?: string;
          type?: Database['public']['Enums']['source_type'];
        };
      };
      teams: {
        Row: {
          billing_cycle_start: string | null;
          created_by: string;
          id: string;
          inserted_at: string;
          is_enterprise_plan: boolean | null;
          is_personal: boolean | null;
          name: string | null;
          slug: string;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
        };
        Insert: {
          billing_cycle_start?: string | null;
          created_by: string;
          id?: string;
          inserted_at?: string;
          is_enterprise_plan?: boolean | null;
          is_personal?: boolean | null;
          name?: string | null;
          slug: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
        };
        Update: {
          billing_cycle_start?: string | null;
          created_by?: string;
          id?: string;
          inserted_at?: string;
          is_enterprise_plan?: boolean | null;
          is_personal?: boolean | null;
          name?: string | null;
          slug?: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
        };
      };
      tokens: {
        Row: {
          created_by: string;
          id: number;
          inserted_at: string;
          project_id: string;
          value: string;
        };
        Insert: {
          created_by: string;
          id?: number;
          inserted_at?: string;
          project_id: string;
          value: string;
        };
        Update: {
          created_by?: string;
          id?: number;
          inserted_at?: string;
          project_id?: string;
          value?: string;
        };
      };
      user_access_tokens: {
        Row: {
          access_token: string | null;
          expires: number | null;
          id: number;
          meta: Json | null;
          provider: string | null;
          refresh_token: string | null;
          refresh_token_expires: number | null;
          scope: string | null;
          state: string | null;
          user_id: string;
        };
        Insert: {
          access_token?: string | null;
          expires?: number | null;
          id?: number;
          meta?: Json | null;
          provider?: string | null;
          refresh_token?: string | null;
          refresh_token_expires?: number | null;
          scope?: string | null;
          state?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string | null;
          expires?: number | null;
          id?: number;
          meta?: Json | null;
          provider?: string | null;
          refresh_token?: string | null;
          refresh_token_expires?: number | null;
          scope?: string | null;
          state?: string | null;
          user_id?: string;
        };
      };
      users: {
        Row: {
          avatar_url: string | null;
          email: string;
          full_name: string | null;
          has_completed_onboarding: boolean;
          id: string;
          subscribe_to_product_updates: boolean;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          email: string;
          full_name?: string | null;
          has_completed_onboarding?: boolean;
          id: string;
          subscribe_to_product_updates?: boolean;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          email?: string;
          full_name?: string | null;
          has_completed_onboarding?: boolean;
          id?: string;
          subscribe_to_product_updates?: boolean;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ivfflathandler: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      match_file_sections:
        | {
            Args: {
              embedding: string;
              match_threshold: number;
              match_count: number;
              min_content_length: number;
            };
            Returns: {
              path: string;
              content: string;
              token_count: number;
              similarity: number;
            }[];
          }
        | {
            Args: {
              project_id: string;
              embedding: string;
              match_threshold: number;
              match_count: number;
              min_content_length: number;
            };
            Returns: {
              path: string;
              content: string;
              token_count: number;
              similarity: number;
            }[];
          };
      vector_avg: {
        Args: {
          '': number[];
        };
        Returns: string;
      };
      vector_dims: {
        Args: {
          '': string;
        };
        Returns: number;
      };
      vector_norm: {
        Args: {
          '': string;
        };
        Returns: number;
      };
      vector_out: {
        Args: {
          '': string;
        };
        Returns: unknown;
      };
      vector_send: {
        Args: {
          '': string;
        };
        Returns: string;
      };
      vector_typmod_in: {
        Args: {
          '': unknown[];
        };
        Returns: number;
      };
    };
    Enums: {
      membership_type: 'viewer' | 'admin';
      source_type:
        | 'github'
        | 'motif'
        | 'website'
        | 'file-upload'
        | 'api-upload';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
