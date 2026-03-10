Initialising login role...
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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          business_logo_url: string | null
          business_name: string
          default_down_payment_pct: number
          default_expiry_days: number | null
          default_expiry_type: Database["public"]["Enums"]["expiry_type"]
          default_price_set_id: string | null
          default_quota_max_type:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          default_quota_max_value: number | null
          default_quota_min_type:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          default_quota_min_value: number | null
          default_quota_mode: Database["public"]["Enums"]["quota_mode"]
          id: number
          vat_enabled: boolean
          vat_rate_bps: number
        }
        Insert: {
          business_logo_url?: string | null
          business_name?: string
          default_down_payment_pct?: number
          default_expiry_days?: number | null
          default_expiry_type?: Database["public"]["Enums"]["expiry_type"]
          default_price_set_id?: string | null
          default_quota_max_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          default_quota_max_value?: number | null
          default_quota_min_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          default_quota_min_value?: number | null
          default_quota_mode?: Database["public"]["Enums"]["quota_mode"]
          id?: number
          vat_enabled?: boolean
          vat_rate_bps?: number
        }
        Update: {
          business_logo_url?: string | null
          business_name?: string
          default_down_payment_pct?: number
          default_expiry_days?: number | null
          default_expiry_type?: Database["public"]["Enums"]["expiry_type"]
          default_price_set_id?: string | null
          default_quota_max_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          default_quota_max_value?: number | null
          default_quota_min_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          default_quota_min_value?: number | null
          default_quota_mode?: Database["public"]["Enums"]["quota_mode"]
          id?: number
          vat_enabled?: boolean
          vat_rate_bps?: number
        }
        Relationships: [
          {
            foreignKeyName: "global_settings_default_price_set_id_fkey"
            columns: ["default_price_set_id"]
            isOneToOne: false
            referencedRelation: "price_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      global_volume_tiers: {
        Row: {
          id: string
          max_qty: number | null
          min_qty: number
          name: string
          price_multiplier_bps: number
          sort_order: number
        }
        Insert: {
          id?: string
          max_qty?: number | null
          min_qty: number
          name: string
          price_multiplier_bps?: number
          sort_order?: number
        }
        Update: {
          id?: string
          max_qty?: number | null
          min_qty?: number
          name?: string
          price_multiplier_bps?: number
          sort_order?: number
        }
        Relationships: []
      }
      item_pricing: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          price_set_id: string
          retail_price: number
          updated_at: string | null
          use_global_volume_tiers: boolean
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          price_set_id: string
          retail_price?: number
          updated_at?: string | null
          use_global_volume_tiers?: boolean
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          price_set_id?: string
          retail_price?: number
          updated_at?: string | null
          use_global_volume_tiers?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "item_pricing_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_pricing_price_set_id_fkey"
            columns: ["price_set_id"]
            isOneToOne: false
            referencedRelation: "price_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      item_sets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          markup_type: Database["public"]["Enums"]["markup_type"]
          markup_value: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          markup_type?: Database["public"]["Enums"]["markup_type"]
          markup_value?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          markup_type?: Database["public"]["Enums"]["markup_type"]
          markup_value?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      item_volume_tiers: {
        Row: {
          id: string
          item_pricing_id: string
          max_qty: number | null
          min_qty: number
          unit_price: number
        }
        Insert: {
          id?: string
          item_pricing_id: string
          max_qty?: number | null
          min_qty: number
          unit_price: number
        }
        Update: {
          id?: string
          item_pricing_id?: string
          max_qty?: number | null
          min_qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_volume_tiers_item_pricing_id_fkey"
            columns: ["item_pricing_id"]
            isOneToOne: false
            referencedRelation: "item_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          base_cost: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_order_qty: number
          name: string
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          base_cost?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_order_qty?: number
          name: string
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          base_cost?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_order_qty?: number
          name?: string
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      price_sets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quota_override_log: {
        Row: {
          created_at: string | null
          id: string
          net_profit_at_override: number
          overridden_by: string | null
          quota_status_at_override: string
          quote_id: string
          reason: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          net_profit_at_override: number
          overridden_by?: string | null
          quota_status_at_override: string
          quote_id: string
          reason: string
        }
        Update: {
          created_at?: string | null
          id?: string
          net_profit_at_override?: number
          overridden_by?: string | null
          quota_status_at_override?: string
          quote_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "quota_override_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_incidentals: {
        Row: {
          cost: number
          id: string
          name: string
          quote_id: string
          sort_order: number
        }
        Insert: {
          cost?: number
          id?: string
          name: string
          quote_id: string
          sort_order?: number
        }
        Update: {
          cost?: number
          id?: string
          name?: string
          quote_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_incidentals_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          description_override: string | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          id: string
          item_id: string | null
          price_variance_bps: number | null
          quantity: number
          quote_id: string
          set_id: string | null
          sort_order: number
          sourced_from_line_item_id: string | null
          unit_base_cost: number
          unit_retail_price: number
        }
        Insert: {
          description_override?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          id?: string
          item_id?: string | null
          price_variance_bps?: number | null
          quantity?: number
          quote_id: string
          set_id?: string | null
          sort_order?: number
          sourced_from_line_item_id?: string | null
          unit_base_cost: number
          unit_retail_price: number
        }
        Update: {
          description_override?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          id?: string
          item_id?: string | null
          price_variance_bps?: number | null
          quantity?: number
          quote_id?: string
          set_id?: string | null
          sort_order?: number
          sourced_from_line_item_id?: string | null
          unit_base_cost?: number
          unit_retail_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "item_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_sourced_from_line_item_id_fkey"
            columns: ["sourced_from_line_item_id"]
            isOneToOne: false
            referencedRelation: "quote_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          method: string | null
          notes: string | null
          payment_date: string
          quote_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          payment_date: string
          quote_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          payment_date?: string
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_rush_orders: {
        Row: {
          id: string
          label: string
          quote_id: string
          surcharge_type: Database["public"]["Enums"]["markup_type"]
          surcharge_value: number
        }
        Insert: {
          id?: string
          label?: string
          quote_id: string
          surcharge_type?: Database["public"]["Enums"]["markup_type"]
          surcharge_value?: number
        }
        Update: {
          id?: string
          label?: string
          quote_id?: string
          surcharge_type?: Database["public"]["Enums"]["markup_type"]
          surcharge_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_rush_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_sequences: {
        Row: {
          last_seq: number
          year: number
        }
        Insert: {
          last_seq?: number
          year: number
        }
        Update: {
          last_seq?: number
          year?: number
        }
        Relationships: []
      }
      quotes: {
        Row: {
          agent_markup_type: Database["public"]["Enums"]["markup_type"] | null
          agent_markup_value: number | null
          commission_referred_by: string | null
          commission_type: Database["public"]["Enums"]["commission_type"] | null
          commission_value: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name_override: string | null
          down_payment_pct: number
          expiry_date: string | null
          expiry_days: number | null
          expiry_type: Database["public"]["Enums"]["expiry_type"]
          id: string
          notes: string | null
          price_set_id: string
          quota_max_type:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          quota_max_value: number | null
          quota_min_type:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          quota_min_value: number | null
          quota_mode: Database["public"]["Enums"]["quota_mode"]
          quote_number: string
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string | null
          vat_enabled: boolean
          vat_rate_bps: number | null
        }
        Insert: {
          agent_markup_type?: Database["public"]["Enums"]["markup_type"] | null
          agent_markup_value?: number | null
          commission_referred_by?: string | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          commission_value?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name_override?: string | null
          down_payment_pct?: number
          expiry_date?: string | null
          expiry_days?: number | null
          expiry_type?: Database["public"]["Enums"]["expiry_type"]
          id?: string
          notes?: string | null
          price_set_id: string
          quota_max_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          quota_max_value?: number | null
          quota_min_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          quota_min_value?: number | null
          quota_mode?: Database["public"]["Enums"]["quota_mode"]
          quote_number?: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string | null
          vat_enabled?: boolean
          vat_rate_bps?: number | null
        }
        Update: {
          agent_markup_type?: Database["public"]["Enums"]["markup_type"] | null
          agent_markup_value?: number | null
          commission_referred_by?: string | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          commission_value?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name_override?: string | null
          down_payment_pct?: number
          expiry_date?: string | null
          expiry_days?: number | null
          expiry_type?: Database["public"]["Enums"]["expiry_type"]
          id?: string
          notes?: string | null
          price_set_id?: string
          quota_max_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          quota_max_value?: number | null
          quota_min_type?:
            | Database["public"]["Enums"]["quota_target_type"]
            | null
          quota_min_value?: number | null
          quota_mode?: Database["public"]["Enums"]["quota_mode"]
          quote_number?: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string | null
          vat_enabled?: boolean
          vat_rate_bps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_price_set_id_fkey"
            columns: ["price_set_id"]
            isOneToOne: false
            referencedRelation: "price_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      set_items: {
        Row: {
          default_quantity: number
          id: string
          item_id: string
          set_id: string
          sort_order: number
        }
        Insert: {
          default_quantity?: number
          id?: string
          item_id: string
          set_id: string
          sort_order?: number
        }
        Update: {
          default_quantity?: number
          id?: string
          item_id?: string
          set_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "set_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "item_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_quote_number: { Args: never; Returns: string }
    }
    Enums: {
      commission_type: "percentage" | "fixed"
      discount_type: "percentage" | "fixed_per_item"
      expiry_type: "none" | "fixed" | "relative"
      markup_type: "percentage" | "fixed"
      quota_mode: "soft" | "hard"
      quota_target_type: "fixed" | "percentage"
      quote_status: "draft" | "active" | "accepted" | "cancelled"
      user_role: "super_user" | "staff"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      commission_type: ["percentage", "fixed"],
      discount_type: ["percentage", "fixed_per_item"],
      expiry_type: ["none", "fixed", "relative"],
      markup_type: ["percentage", "fixed"],
      quota_mode: ["soft", "hard"],
      quota_target_type: ["fixed", "percentage"],
      quote_status: ["draft", "active", "accepted", "cancelled"],
      user_role: ["super_user", "staff"],
    },
  },
} as const
