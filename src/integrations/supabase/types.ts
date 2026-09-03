export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          commission_rate: number
          contact_email: string | null
          created_at: string
          id: string
          name: string
          status: string
          website_url: string
        }
        Insert: {
          commission_rate?: number
          contact_email?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          website_url: string
        }
        Update: {
          commission_rate?: number
          contact_email?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          website_url?: string
        }
        Relationships: []
      }
      clicks: {
        Row: {
          clicked_at: string | null
          cookie_id: string | null
          creator_username: string
          id: string
          ip_address: string | null
          post_id: string | null
          product_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string | null
          cookie_id?: string | null
          creator_username: string
          id?: string
          ip_address?: string | null
          post_id?: string | null
          product_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string | null
          cookie_id?: string | null
          creator_username?: string
          id?: string
          ip_address?: string | null
          post_id?: string | null
          product_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          banner_image: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_admin: boolean
          profile_image: string | null
          username: string
        }
        Insert: {
          banner_image?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          is_admin?: boolean
          profile_image?: string | null
          username: string
        }
        Update: {
          banner_image?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean
          profile_image?: string | null
          username?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          cover_image: string | null
          created_at: string | null
          creator_id: string
          creator_username: string
          id: string
          tiktok_url: string | null
          title: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          creator_id: string
          creator_username: string
          id?: string
          tiktok_url?: string | null
          title: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string
          creator_username?: string
          id?: string
          tiktok_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_link: string
          brand: string | null
          brand_id: string | null
          id: string
          image_url: string | null
          name: string
          position: number | null
          post_id: string
          price: string | null
        }
        Insert: {
          affiliate_link: string
          brand?: string | null
          brand_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          position?: number | null
          post_id: string
          price?: string | null
        }
        Update: {
          affiliate_link?: string
          brand?: string | null
          brand_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number | null
          post_id?: string
          price?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          click_id: string | null
          commission_amount: number
          creator_share: number | null
          detected_at: string
          id: string
          order_amount: number
          order_reference: string | null
          product_id: string
          status: string
        }
        Insert: {
          click_id?: string | null
          commission_amount: number
          creator_share?: number | null
          detected_at?: string
          id?: string
          order_amount: number
          order_reference?: string | null
          product_id: string
          status?: string
        }
        Update: {
          click_id?: string | null
          commission_amount?: number
          creator_share?: number | null
          detected_at?: string
          id?: string
          order_amount?: number
          order_reference?: string | null
          product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
