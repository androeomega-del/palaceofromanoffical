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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bg_products: {
        Row: {
          brand: string | null
          category: string | null
          color: string | null
          created_at: string
          currency: string | null
          description: string | null
          description_plain: string | null
          gender: string | null
          group_sku: string
          handle: string
          id: string
          in_stock: boolean
          main_picture: string | null
          material: string | null
          modified_at: string | null
          name: string | null
          origin: string | null
          pictures: string[]
          product_condition: string | null
          retail_price: number | null
          subcategory: string | null
          subsubcategory: string | null
          total_stock: number
          wholesale_price: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_plain?: string | null
          gender?: string | null
          group_sku: string
          handle: string
          id?: string
          in_stock?: boolean
          main_picture?: string | null
          material?: string | null
          modified_at?: string | null
          name?: string | null
          origin?: string | null
          pictures?: string[]
          product_condition?: string | null
          retail_price?: number | null
          subcategory?: string | null
          subsubcategory?: string | null
          total_stock?: number
          wholesale_price?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_plain?: string | null
          gender?: string | null
          group_sku?: string
          handle?: string
          id?: string
          in_stock?: boolean
          main_picture?: string | null
          material?: string | null
          modified_at?: string | null
          name?: string | null
          origin?: string | null
          pictures?: string[]
          product_condition?: string | null
          retail_price?: number | null
          subcategory?: string | null
          subsubcategory?: string | null
          total_stock?: number
          wholesale_price?: number | null
        }
        Relationships: []
      }
      bg_variants: {
        Row: {
          created_at: string
          group_sku: string
          id: string
          mpn: string | null
          product_sku: string
          quantity: number
          size: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          group_sku: string
          id?: string
          mpn?: string | null
          product_sku: string
          quantity?: number
          size?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          group_sku?: string
          id?: string
          mpn?: string | null
          product_sku?: string
          quantity?: number
          size?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bg_variants_group_sku_fkey"
            columns: ["group_sku"]
            isOneToOne: false
            referencedRelation: "bg_products"
            referencedColumns: ["group_sku"]
          },
        ]
      }
      cart_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          page_path: string | null
          price_usd: number | null
          product_handle: string | null
          product_title: string | null
          quantity: number
          session_id: string | null
          user_agent: string | null
          variant_id: string | null
          variant_title: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          page_path?: string | null
          price_usd?: number | null
          product_handle?: string | null
          product_title?: string | null
          quantity?: number
          session_id?: string | null
          user_agent?: string | null
          variant_id?: string | null
          variant_title?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          page_path?: string | null
          price_usd?: number | null
          product_handle?: string | null
          product_title?: string | null
          quantity?: number
          session_id?: string | null
          user_agent?: string | null
          variant_id?: string | null
          variant_title?: string | null
        }
        Relationships: []
      }
      collection_images: {
        Row: {
          focal_x: number | null
          focal_y: number | null
          handle: string
          height: number | null
          image_url: string
          prompt: string | null
          source: string
          title: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          focal_x?: number | null
          focal_y?: number | null
          handle: string
          height?: number | null
          image_url: string
          prompt?: string | null
          source: string
          title?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          focal_x?: number | null
          focal_y?: number | null
          handle?: string
          height?: number | null
          image_url?: string
          prompt?: string | null
          source?: string
          title?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      inventory_sync_runs: {
        Row: {
          activated: number
          dry_run: boolean
          error_message: string | null
          failed: number
          finished_at: string | null
          flipped: number
          id: string
          notes: string | null
          processed: number
          started_at: string
          status: string
          total: number
          updated: number
        }
        Insert: {
          activated?: number
          dry_run?: boolean
          error_message?: string | null
          failed?: number
          finished_at?: string | null
          flipped?: number
          id?: string
          notes?: string | null
          processed?: number
          started_at?: string
          status?: string
          total?: number
          updated?: number
        }
        Update: {
          activated?: number
          dry_run?: boolean
          error_message?: string | null
          failed?: number
          finished_at?: string | null
          flipped?: number
          id?: string
          notes?: string | null
          processed?: number
          started_at?: string
          status?: string
          total?: number
          updated?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      shopify_tag_expirations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          product_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          product_id: string
          tag: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          product_id?: string
          tag?: string
        }
        Relationships: []
      }
      shopify_variant_map: {
        Row: {
          available: boolean
          product_gid: string | null
          product_handle: string | null
          sku: string
          synced_at: string
          variant_gid: string
        }
        Insert: {
          available?: boolean
          product_gid?: string | null
          product_handle?: string | null
          sku: string
          synced_at?: string
          variant_gid: string
        }
        Update: {
          available?: boolean
          product_gid?: string | null
          product_handle?: string | null
          sku?: string
          synced_at?: string
          variant_gid?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
