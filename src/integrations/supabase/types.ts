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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_configs: {
        Row: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_spy: boolean | null
          llm_model: string | null
          max_tokens: number | null
          product_category:
            | Database["public"]["Enums"]["product_category"]
            | null
          system_prompt: string
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_spy?: boolean | null
          llm_model?: string | null
          max_tokens?: number | null
          product_category?:
            | Database["public"]["Enums"]["product_category"]
            | null
          system_prompt: string
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_name?: string
          agent_type?: Database["public"]["Enums"]["agent_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_spy?: boolean | null
          llm_model?: string | null
          max_tokens?: number | null
          product_category?:
            | Database["public"]["Enums"]["product_category"]
            | null
          system_prompt?: string
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_knowledge_files: {
        Row: {
          agent_category: Database["public"]["Enums"]["product_category"]
          content_embedding: string | null
          created_at: string
          extracted_content: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          processed_at: string | null
          processing_status: string | null
          storage_path: string
          updated_at: string
        }
        Insert: {
          agent_category: Database["public"]["Enums"]["product_category"]
          content_embedding?: string | null
          created_at?: string
          extracted_content?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_status?: string | null
          storage_path: string
          updated_at?: string
        }
        Update: {
          agent_category?: Database["public"]["Enums"]["product_category"]
          content_embedding?: string | null
          created_at?: string
          extracted_content?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_status?: string | null
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_prompt_history: {
        Row: {
          agent_prompt_id: string | null
          change_description: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          prompt_data: Json
          version: number
        }
        Insert: {
          agent_prompt_id?: string | null
          change_description?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          prompt_data: Json
          version: number
        }
        Update: {
          agent_prompt_id?: string | null
          change_description?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          prompt_data?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_prompt_history_agent_prompt_id_fkey"
            columns: ["agent_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_prompts: {
        Row: {
          agent_type: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          knowledge_base: string | null
          llm_model: string | null
          name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          agent_type?: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          llm_model?: string | null
          name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          agent_type?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          llm_model?: string | null
          name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      bot_templates: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          id: string
          intent: string
          is_active: boolean | null
          language: string | null
          next_intents: string[] | null
          quick_replies: Json | null
          template_text: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          intent: string
          is_active?: boolean | null
          language?: string | null
          next_intents?: string[] | null
          quick_replies?: Json | null
          template_text: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          intent?: string
          is_active?: boolean | null
          language?: string | null
          next_intents?: string[] | null
          quick_replies?: Json | null
          template_text?: string
        }
        Relationships: []
      }
      calculation_templates: {
        Row: {
          calculation_type: string
          category: Database["public"]["Enums"]["product_category"] | null
          created_at: string | null
          created_by: string | null
          formula_version: string | null
          id: string
          input_parameters: Json
          is_active: boolean | null
          name: string
          output_template: Json
          updated_at: string | null
        }
        Insert: {
          calculation_type: string
          category?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string | null
          created_by?: string | null
          formula_version?: string | null
          id?: string
          input_parameters?: Json
          is_active?: boolean | null
          name: string
          output_template?: Json
          updated_at?: string | null
        }
        Update: {
          calculation_type?: string
          category?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string | null
          created_by?: string | null
          formula_version?: string | null
          id?: string
          input_parameters?: Json
          is_active?: boolean | null
          name?: string
          output_template?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculation_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      classification_history: {
        Row: {
          analysis_data: Json | null
          classifier_agent_id: string | null
          confidence_score: number
          conversation_id: string
          created_at: string | null
          id: string
          new_product_group: Database["public"]["Enums"]["product_category"]
          old_product_group:
            | Database["public"]["Enums"]["product_category"]
            | null
          trigger_message_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          classifier_agent_id?: string | null
          confidence_score: number
          conversation_id: string
          created_at?: string | null
          id?: string
          new_product_group: Database["public"]["Enums"]["product_category"]
          old_product_group?:
            | Database["public"]["Enums"]["product_category"]
            | null
          trigger_message_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          classifier_agent_id?: string | null
          confidence_score?: number
          conversation_id?: string
          created_at?: string | null
          id?: string
          new_product_group?: Database["public"]["Enums"]["product_category"]
          old_product_group?:
            | Database["public"]["Enums"]["product_category"]
            | null
          trigger_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classification_history_classifier_agent_id_fkey"
            columns: ["classifier_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_history_trigger_message_id_fkey"
            columns: ["trigger_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_keywords: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      classification_logs: {
        Row: {
          classified_category: string | null
          confidence_score: number | null
          conversation_id: string | null
          created_at: string | null
          id: string
          message_text: string
          metadata: Json | null
          processing_time_ms: number | null
          status: string | null
        }
        Insert: {
          classified_category?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_text: string
          metadata?: Json | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Update: {
          classified_category?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_text?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Relationships: []
      }
      classification_rules: {
        Row: {
          action_type: string
          action_value: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          action_value: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          action_value?: string
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_analytics: {
        Row: {
          avg_response_time_seconds: number | null
          by_category: Json | null
          conversion_rate: number | null
          date: string | null
          hot_leads: number | null
          id: string
          messages_received: number | null
          messages_sent: number | null
          qualified_leads: number | null
          total_conversations: number | null
        }
        Insert: {
          avg_response_time_seconds?: number | null
          by_category?: Json | null
          conversion_rate?: number | null
          date?: string | null
          hot_leads?: number | null
          id?: string
          messages_received?: number | null
          messages_sent?: number | null
          qualified_leads?: number | null
          total_conversations?: number | null
        }
        Update: {
          avg_response_time_seconds?: number | null
          by_category?: Json | null
          conversion_rate?: number | null
          date?: string | null
          hot_leads?: number | null
          id?: string
          messages_received?: number | null
          messages_sent?: number | null
          qualified_leads?: number | null
          total_conversations?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          buffer_until: string | null
          classification_updated_at: string | null
          confidence_score: number | null
          created_at: string | null
          current_agent_id: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_state: string | null
          first_message_at: string | null
          id: string
          last_message_at: string | null
          lead_score: number | null
          lead_temperature:
            | Database["public"]["Enums"]["lead_temperature"]
            | null
          metadata: Json | null
          product_group: Database["public"]["Enums"]["product_category"] | null
          profile_pic_url: string | null
          source: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          updated_at: string | null
          whatsapp_name: string | null
          whatsapp_number: string
        }
        Insert: {
          assigned_agent_id?: string | null
          buffer_until?: string | null
          classification_updated_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          current_agent_id?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_state?: string | null
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_score?: number | null
          lead_temperature?:
            | Database["public"]["Enums"]["lead_temperature"]
            | null
          metadata?: Json | null
          product_group?: Database["public"]["Enums"]["product_category"] | null
          profile_pic_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          whatsapp_name?: string | null
          whatsapp_number: string
        }
        Update: {
          assigned_agent_id?: string | null
          buffer_until?: string | null
          classification_updated_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          current_agent_id?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_state?: string | null
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_score?: number | null
          lead_temperature?:
            | Database["public"]["Enums"]["lead_temperature"]
            | null
          metadata?: Json | null
          product_group?: Database["public"]["Enums"]["product_category"] | null
          profile_pic_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          whatsapp_name?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_current_agent_id_fkey"
            columns: ["current_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_to: string | null
          city: string | null
          company: string | null
          conversation_id: string | null
          created_at: string | null
          email: string | null
          id: string
          last_interaction_at: string | null
          name: string
          phone: string
          priority: Database["public"]["Enums"]["customer_priority"] | null
          segment: string | null
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["customer_status"] | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          company?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          name: string
          phone: string
          priority?: Database["public"]["Enums"]["customer_priority"] | null
          segment?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          company?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          name?: string
          phone?: string
          priority?: Database["public"]["Enums"]["customer_priority"] | null
          segment?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_contexts: {
        Row: {
          confidence: number | null
          context_data: Json
          context_type: string
          conversation_id: string
          created_at: string | null
          extractor_agent_id: string | null
          id: string
          is_active: boolean | null
          source_message_id: string | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          context_data: Json
          context_type: string
          conversation_id: string
          created_at?: string | null
          extractor_agent_id?: string | null
          id?: string
          is_active?: boolean | null
          source_message_id?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          context_data?: Json
          context_type?: string
          conversation_id?: string
          created_at?: string | null
          extractor_agent_id?: string | null
          id?: string
          is_active?: boolean | null
          source_message_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_contexts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_contexts_extractor_agent_id_fkey"
            columns: ["extractor_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_contexts_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_patterns: {
        Row: {
          agent_type: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          embedding: string | null
          frequency: number | null
          id: string
          intent: string
          last_seen: string | null
          pattern_text: string
          updated_at: string | null
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          embedding?: string | null
          frequency?: number | null
          id?: string
          intent: string
          last_seen?: string | null
          pattern_text: string
          updated_at?: string | null
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          embedding?: string | null
          frequency?: number | null
          id?: string
          intent?: string
          last_seen?: string | null
          pattern_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_analytics: {
        Row: {
          agent_type: Database["public"]["Enums"]["product_category"]
          average_confidence: number | null
          created_at: string | null
          date: string
          id: string
          knowledge_entries_used: number | null
          new_knowledge_created: number | null
          successful_responses: number | null
          total_queries: number | null
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["product_category"]
          average_confidence?: number | null
          created_at?: string | null
          date?: string
          id?: string
          knowledge_entries_used?: number | null
          new_knowledge_created?: number | null
          successful_responses?: number | null
          total_queries?: number | null
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["product_category"]
          average_confidence?: number | null
          created_at?: string | null
          date?: string
          id?: string
          knowledge_entries_used?: number | null
          new_knowledge_created?: number | null
          successful_responses?: number | null
          total_queries?: number | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          agent_category: Database["public"]["Enums"]["product_category"]
          chunk_index: number
          content: string
          content_embedding: string | null
          created_at: string | null
          file_id: string
          id: string
          metadata: Json | null
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          agent_category: Database["public"]["Enums"]["product_category"]
          chunk_index: number
          content: string
          content_embedding?: string | null
          created_at?: string | null
          file_id: string
          id?: string
          metadata?: Json | null
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_category?: Database["public"]["Enums"]["product_category"]
          chunk_index?: number
          content?: string
          content_embedding?: string | null
          created_at?: string | null
          file_id?: string
          id?: string
          metadata?: Json | null
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "agent_knowledge_files"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_feedback: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          feedback_text: string | null
          feedback_type: string
          id: string
          knowledge_entry_id: string
          message_id: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          feedback_type: string
          id?: string
          knowledge_entry_id: string
          message_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          knowledge_entry_id?: string
          message_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_feedback_knowledge_entry_id_fkey"
            columns: ["knowledge_entry_id"]
            isOneToOne: false
            referencedRelation: "agent_knowledge_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_usage_log: {
        Row: {
          agent_type: Database["public"]["Enums"]["product_category"]
          confidence_score: number | null
          conversation_id: string | null
          created_at: string | null
          id: string
          knowledge_ids: string[]
          query: string
          response_generated: string | null
          user_id: string | null
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["product_category"]
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          knowledge_ids: string[]
          query: string
          response_generated?: string | null
          user_id?: string | null
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["product_category"]
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          knowledge_ids?: string[]
          query?: string
          response_generated?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_usage_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_bot_config: {
        Row: {
          bot_name: string
          created_at: string
          id: string
          is_active: boolean
          phone_number: string
          updated_at: string
          whapi_token: string
        }
        Insert: {
          bot_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number: string
          updated_at?: string
          whapi_token: string
        }
        Update: {
          bot_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number?: string
          updated_at?: string
          whapi_token?: string
        }
        Relationships: []
      }
      lead_distributions: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          sent_at: string
          sent_by_agent_id: string | null
          status: string | null
          summary_text: string
          vendor_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          sent_by_agent_id?: string | null
          status?: string | null
          summary_text: string
          vendor_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sent_at?: string
          sent_by_agent_id?: string | null
          status?: string | null
          summary_text?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_distributions_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_distributions_vendor_id"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      message_buffers: {
        Row: {
          buffer_started_at: string | null
          conversation_id: string | null
          id: string
          messages: Json
          processed: boolean | null
          processed_at: string | null
          processing_started_at: string | null
          should_process_at: string | null
        }
        Insert: {
          buffer_started_at?: string | null
          conversation_id?: string | null
          id?: string
          messages?: Json
          processed?: boolean | null
          processed_at?: string | null
          processing_started_at?: string | null
          should_process_at?: string | null
        }
        Update: {
          buffer_started_at?: string | null
          conversation_id?: string | null
          id?: string
          messages?: Json
          processed?: boolean | null
          processed_at?: string | null
          processing_started_at?: string | null
          should_process_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_buffers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_id: string | null
          agent_type: Database["public"]["Enums"]["agent_type"] | null
          classifier_analysis: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          delivered_at: string | null
          extractor_analysis: Json | null
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          processed_by_classifier: boolean | null
          processed_by_extractor: boolean | null
          read_at: string | null
          sender_name: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          status: Database["public"]["Enums"]["message_status"] | null
          transcription: string | null
          transcription_status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_type?: Database["public"]["Enums"]["agent_type"] | null
          classifier_analysis?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          delivered_at?: string | null
          extractor_analysis?: Json | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          processed_by_classifier?: boolean | null
          processed_by_extractor?: boolean | null
          read_at?: string | null
          sender_name?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          status?: Database["public"]["Enums"]["message_status"] | null
          transcription?: string | null
          transcription_status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_type?: Database["public"]["Enums"]["agent_type"] | null
          classifier_analysis?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          extractor_analysis?: Json | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          processed_by_classifier?: boolean | null
          processed_by_extractor?: boolean | null
          read_at?: string | null
          sender_name?: string | null
          sender_type?: Database["public"]["Enums"]["sender_type"]
          status?: Database["public"]["Enums"]["message_status"] | null
          transcription?: string | null
          transcription_status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          actual_close_date: string | null
          assigned_to: string | null
          conversation_id: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          probability: number | null
          product_category:
            | Database["public"]["Enums"]["product_category"]
            | null
          source: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"] | null
          title: string
          updated_at: string | null
          value: number
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          probability?: number | null
          product_category?:
            | Database["public"]["Enums"]["product_category"]
            | null
          source?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"] | null
          title: string
          updated_at?: string | null
          value?: number
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          probability?: number | null
          product_category?:
            | Database["public"]["Enums"]["product_category"]
            | null
          source?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"] | null
          title?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "opportunities_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number | null
          category: Database["public"]["Enums"]["product_category"] | null
          code: string
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          specifications: Json | null
          subcategory: string | null
          supplier: string | null
          unit: Database["public"]["Enums"]["product_unit"]
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["product_category"] | null
          code: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specifications?: Json | null
          subcategory?: string | null
          supplier?: string | null
          unit: Database["public"]["Enums"]["product_unit"]
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["product_category"] | null
          code?: string
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specifications?: Json | null
          subcategory?: string | null
          supplier?: string | null
          unit?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string
          email: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name: string
          email: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_contexts: {
        Row: {
          budget_range: string | null
          construction_size_m2: number | null
          conversation_id: string
          created_at: string | null
          desired_product: string | null
          energy_bill_value: number | null
          energy_consumption: string | null
          floor_quantity_m2: number | null
          floor_rooms: string | null
          has_architectural_project: boolean | null
          has_energy_backups: boolean | null
          id: string
          materials_list: string[] | null
          notes: string | null
          project_status: string | null
          roof_size_m2: number | null
          roof_status: string | null
          timeline: string | null
          updated_at: string | null
          urgency: string | null
          whatsapp_confirmed: string | null
        }
        Insert: {
          budget_range?: string | null
          construction_size_m2?: number | null
          conversation_id: string
          created_at?: string | null
          desired_product?: string | null
          energy_bill_value?: number | null
          energy_consumption?: string | null
          floor_quantity_m2?: number | null
          floor_rooms?: string | null
          has_architectural_project?: boolean | null
          has_energy_backups?: boolean | null
          id?: string
          materials_list?: string[] | null
          notes?: string | null
          project_status?: string | null
          roof_size_m2?: number | null
          roof_status?: string | null
          timeline?: string | null
          updated_at?: string | null
          urgency?: string | null
          whatsapp_confirmed?: string | null
        }
        Update: {
          budget_range?: string | null
          construction_size_m2?: number | null
          conversation_id?: string
          created_at?: string | null
          desired_product?: string | null
          energy_bill_value?: number | null
          energy_consumption?: string | null
          floor_quantity_m2?: number | null
          floor_rooms?: string | null
          has_architectural_project?: boolean | null
          has_energy_backups?: boolean | null
          id?: string
          materials_list?: string[] | null
          notes?: string | null
          project_status?: string | null
          roof_size_m2?: number | null
          roof_status?: string | null
          timeline?: string | null
          updated_at?: string | null
          urgency?: string | null
          whatsapp_confirmed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contexts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_variables: {
        Row: {
          category: string | null
          description: string | null
          example_value: string | null
          id: string
          variable_name: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          example_value?: string | null
          id?: string
          variable_name: string
        }
        Update: {
          category?: string | null
          description?: string | null
          example_value?: string | null
          id?: string
          variable_name?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string | null
          custom_name: string | null
          description: string | null
          id: string
          product_id: string | null
          proposal_id: string | null
          quantity: number
          sort_order: number | null
          specifications: Json | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          description?: string | null
          id?: string
          product_id?: string | null
          proposal_id?: string | null
          quantity?: number
          sort_order?: number | null
          specifications?: Json | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          description?: string | null
          id?: string
          product_id?: string | null
          proposal_id?: string | null
          quantity?: number
          sort_order?: number | null
          specifications?: Json | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          acceptance_link: string | null
          accepted_at: string | null
          conversation_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string | null
          discount_percentage: number | null
          discount_value: number | null
          final_value: number | null
          id: string
          opportunity_id: string | null
          project_type: Database["public"]["Enums"]["product_category"] | null
          proposal_number: string
          status: Database["public"]["Enums"]["proposal_status"] | null
          title: string
          total_value: number | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          acceptance_link?: string | null
          accepted_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          final_value?: number | null
          id?: string
          opportunity_id?: string | null
          project_type?: Database["public"]["Enums"]["product_category"] | null
          proposal_number: string
          status?: Database["public"]["Enums"]["proposal_status"] | null
          title: string
          total_value?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          acceptance_link?: string | null
          accepted_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          final_value?: number | null
          id?: string
          opportunity_id?: string | null
          project_type?: Database["public"]["Enums"]["product_category"] | null
          proposal_number?: string
          status?: Database["public"]["Enums"]["proposal_status"] | null
          title?: string
          total_value?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "proposals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_alerts: {
        Row: {
          alert_type: string
          analysis_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          vendor_id: string
        }
        Insert: {
          alert_type: string
          analysis_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          vendor_id: string
        }
        Update: {
          alert_type?: string
          analysis_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          vendor_id?: string
        }
        Relationships: []
      }
      quality_metrics: {
        Row: {
          automated_quality_score: number | null
          conversation_id: number
          conversation_satisfaction_score: number | null
          created_at: string | null
          flags: Json | null
          id: number
          metric_date: string
          response_time_avg_minutes: number | null
          response_time_max_minutes: number | null
          total_messages_received: number | null
          total_messages_sent: number | null
          vendor_id: string
        }
        Insert: {
          automated_quality_score?: number | null
          conversation_id: number
          conversation_satisfaction_score?: number | null
          created_at?: string | null
          flags?: Json | null
          id?: number
          metric_date: string
          response_time_avg_minutes?: number | null
          response_time_max_minutes?: number | null
          total_messages_received?: number | null
          total_messages_sent?: number | null
          vendor_id: string
        }
        Update: {
          automated_quality_score?: number | null
          conversation_id?: number
          conversation_satisfaction_score?: number | null
          created_at?: string | null
          flags?: Json | null
          id?: number
          metric_date?: string
          response_time_avg_minutes?: number | null
          response_time_max_minutes?: number | null
          total_messages_received?: number | null
          total_messages_sent?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_metrics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "vendor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_metrics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configs: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          level: string
          message: string
          source: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          level: string
          message: string
          source: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          level?: string
          message?: string
          source?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          opportunity_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          type: Database["public"]["Enums"]["task_type"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          type?: Database["public"]["Enums"]["task_type"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["task_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_conversations: {
        Row: {
          chat_id: string
          conversation_status: string | null
          created_at: string | null
          customer_messages: number | null
          customer_name: string | null
          customer_phone: string
          customer_profile_pic: string | null
          id: number
          last_message_at: string | null
          metadata: Json | null
          total_messages: number | null
          updated_at: string | null
          vendor_id: string
          vendor_messages: number | null
        }
        Insert: {
          chat_id: string
          conversation_status?: string | null
          created_at?: string | null
          customer_messages?: number | null
          customer_name?: string | null
          customer_phone: string
          customer_profile_pic?: string | null
          id?: number
          last_message_at?: string | null
          metadata?: Json | null
          total_messages?: number | null
          updated_at?: string | null
          vendor_id: string
          vendor_messages?: number | null
        }
        Update: {
          chat_id?: string
          conversation_status?: string | null
          created_at?: string | null
          customer_messages?: number | null
          customer_name?: string | null
          customer_phone?: string
          customer_profile_pic?: string | null
          id?: number
          last_message_at?: string | null
          metadata?: Json | null
          total_messages?: number | null
          updated_at?: string | null
          vendor_id?: string
          vendor_messages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_conversations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          chat_id: string
          content: string | null
          conversation_id: number
          created_at: string | null
          from_me: boolean
          from_name: string | null
          from_phone: string | null
          id: number
          is_forwarded: boolean | null
          media_metadata: Json | null
          media_url: string | null
          message_type: string
          metadata: Json | null
          reply_to_message_id: string | null
          status: string | null
          timestamp_whatsapp: string
          vendor_id: string
          whapi_message_id: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          conversation_id: number
          created_at?: string | null
          from_me: boolean
          from_name?: string | null
          from_phone?: string | null
          id?: number
          is_forwarded?: boolean | null
          media_metadata?: Json | null
          media_url?: string | null
          message_type: string
          metadata?: Json | null
          reply_to_message_id?: string | null
          status?: string | null
          timestamp_whatsapp: string
          vendor_id: string
          whapi_message_id: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          conversation_id?: number
          created_at?: string | null
          from_me?: boolean
          from_name?: string | null
          from_phone?: string | null
          id?: number
          is_forwarded?: boolean | null
          media_metadata?: Json | null
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          reply_to_message_id?: string | null
          status?: string | null
          timestamp_whatsapp?: string
          vendor_id?: string
          whapi_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "vendor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_messages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_quality_analysis: {
        Row: {
          agent_id: string | null
          analysis_data: Json
          analyzed_at: string
          conversation_id: number
          created_at: string
          criteria_scores: Json
          id: string
          issues_identified: string[] | null
          message_id: number | null
          quality_score: number | null
          recommendations: string[] | null
          vendor_id: string
        }
        Insert: {
          agent_id?: string | null
          analysis_data?: Json
          analyzed_at?: string
          conversation_id: number
          created_at?: string
          criteria_scores?: Json
          id?: string
          issues_identified?: string[] | null
          message_id?: number | null
          quality_score?: number | null
          recommendations?: string[] | null
          vendor_id: string
        }
        Update: {
          agent_id?: string | null
          analysis_data?: Json
          analyzed_at?: string
          conversation_id?: number
          created_at?: string
          criteria_scores?: Json
          id?: string
          issues_identified?: string[] | null
          message_id?: number | null
          quality_score?: number | null
          recommendations?: string[] | null
          vendor_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone_number: string
          token_configured: boolean
          updated_at: string | null
          whapi_channel_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone_number: string
          token_configured?: boolean
          updated_at?: string | null
          whapi_channel_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone_number?: string
          token_configured?: boolean
          updated_at?: string | null
          whapi_channel_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          payload: Json
          processed: boolean | null
          webhook_type: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          webhook_type?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          webhook_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_responding_agent: {
        Args: { conversation_uuid: string }
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      schedule_buffer_processing: {
        Args: {
          conversation_id_param: string
          cron_expression: string
          job_name: string
        }
        Returns: undefined
      }
      search_knowledge_chunks: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
          target_agent_category: Database["public"]["Enums"]["product_category"]
        }
        Returns: {
          chunk_index: number
          content: string
          file_name: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_knowledge_enhanced: {
        Args: {
          agent_filter?: Database["public"]["Enums"]["product_category"]
          include_general?: boolean
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          created_at: string
          file_name: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_knowledge_files: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
          target_agent_category: Database["public"]["Enums"]["product_category"]
        }
        Returns: {
          content: string
          file_name: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_file_confidence_score: {
        Args: {
          adjustment_factor?: number
          feedback_type: string
          file_id: string
        }
        Returns: undefined
      }
      update_vendor_conversation_stats: {
        Args: { conversation_id_param: number; from_me_param: boolean }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      agent_type:
        | "general"
        | "classifier"
        | "extractor"
        | "specialist"
        | "lead_scorer"
        | "summarizer"
        | "quality_monitor"
      app_role: "admin" | "supervisor" | "atendente"
      conversation_status:
        | "waiting"
        | "active"
        | "in_bot"
        | "with_agent"
        | "qualified"
        | "transferred"
        | "closed"
      customer_priority: "low" | "normal" | "high" | "critical"
      customer_status: "lead" | "prospect" | "customer" | "inactive"
      lead_temperature: "cold" | "warm" | "hot"
      message_status: "sending" | "sent" | "delivered" | "read" | "failed"
      opportunity_stage:
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      product_category:
        | "telha_shingle"
        | "energia_solar"
        | "steel_frame"
        | "drywall_divisorias"
        | "ferramentas"
        | "pisos"
        | "acabamentos"
        | "forros"
        | "saudacao"
        | "institucional"
        | "indefinido"
        | "geral"
      product_unit:
        | "m2"
        | "ml"
        | "peca"
        | "kg"
        | "litro"
        | "unidade"
        | "conjunto"
        | "pacote"
      proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "under_review"
        | "accepted"
        | "rejected"
        | "expired"
      sender_type: "customer" | "bot" | "agent" | "system"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      task_type:
        | "call"
        | "email"
        | "meeting"
        | "follow_up"
        | "proposal"
        | "visit"
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
      agent_type: [
        "general",
        "classifier",
        "extractor",
        "specialist",
        "lead_scorer",
        "summarizer",
        "quality_monitor",
      ],
      app_role: ["admin", "supervisor", "atendente"],
      conversation_status: [
        "waiting",
        "active",
        "in_bot",
        "with_agent",
        "qualified",
        "transferred",
        "closed",
      ],
      customer_priority: ["low", "normal", "high", "critical"],
      customer_status: ["lead", "prospect", "customer", "inactive"],
      lead_temperature: ["cold", "warm", "hot"],
      message_status: ["sending", "sent", "delivered", "read", "failed"],
      opportunity_stage: [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      product_category: [
        "telha_shingle",
        "energia_solar",
        "steel_frame",
        "drywall_divisorias",
        "ferramentas",
        "pisos",
        "acabamentos",
        "forros",
        "saudacao",
        "institucional",
        "indefinido",
        "geral",
      ],
      product_unit: [
        "m2",
        "ml",
        "peca",
        "kg",
        "litro",
        "unidade",
        "conjunto",
        "pacote",
      ],
      proposal_status: [
        "draft",
        "sent",
        "viewed",
        "under_review",
        "accepted",
        "rejected",
        "expired",
      ],
      sender_type: ["customer", "bot", "agent", "system"],
      task_priority: ["low", "normal", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      task_type: ["call", "email", "meeting", "follow_up", "proposal", "visit"],
    },
  },
} as const
