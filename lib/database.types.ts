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
      _migrations: {
        Row: {
          applied_at: string
          name: string
        }
        Insert: {
          applied_at?: string
          name: string
        }
        Update: {
          applied_at?: string
          name?: string
        }
        Relationships: []
      }
      builds: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          started_at: string | null
          status: string
          status_label: string | null
          subdomain: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input: Json
          started_at?: string | null
          status?: string
          status_label?: string | null
          subdomain: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          started_at?: string | null
          status?: string
          status_label?: string | null
          subdomain?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "builds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string
          cart_id: string
          id: string
          listing_id: string
          listing_variant_id: string | null
          quantity: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          added_at?: string
          cart_id: string
          id?: string
          listing_id: string
          listing_variant_id?: string | null
          quantity: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          added_at?: string
          cart_id?: string
          id?: string
          listing_id?: string
          listing_variant_id?: string | null
          quantity?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_listing_variant_id_fkey"
            columns: ["listing_variant_id"]
            isOneToOne: false
            referencedRelation: "listing_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          applied_gift_card_id: string | null
          applied_promo_id: string | null
          converted_at: string | null
          converted_order_id: string | null
          created_at: string
          currency: string
          customer_profile_id: string | null
          expires_at: string | null
          id: string
          notes_from_customer: string | null
          session_token: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          applied_gift_card_id?: string | null
          applied_promo_id?: string | null
          converted_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          currency?: string
          customer_profile_id?: string | null
          expires_at?: string | null
          id?: string
          notes_from_customer?: string | null
          session_token?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          applied_gift_card_id?: string | null
          applied_promo_id?: string | null
          converted_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          currency?: string
          customer_profile_id?: string | null
          expires_at?: string | null
          id?: string
          notes_from_customer?: string | null
          session_token?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          featured_image_id: string | null
          id: string
          is_featured: boolean
          name: string
          position: number
          slug: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          featured_image_id?: string | null
          id?: string
          is_featured?: boolean
          name: string
          position?: number
          slug: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          featured_image_id?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          position?: number
          slug?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_in_nav: boolean
          is_system_page: boolean
          layout_tree: Json | null
          meta_description: string | null
          meta_keywords: string | null
          nav_label: string | null
          nav_position: number | null
          page_type: string
          parent_page_id: string | null
          published_at: string | null
          slug: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_in_nav?: boolean
          is_system_page?: boolean
          layout_tree?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          nav_label?: string | null
          nav_position?: number | null
          page_type: string
          parent_page_id?: string | null
          published_at?: string | null
          slug: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_in_nav?: boolean
          is_system_page?: boolean
          layout_tree?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          nav_label?: string | null
          nav_position?: number | null
          page_type?: string
          parent_page_id?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          customer_profile_id: string
          deleted_at: string | null
          id: string
          is_default_billing: boolean
          is_default_shipping: boolean
          label: string | null
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          recipient_name: string
          state: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          customer_profile_id: string
          deleted_at?: string | null
          id?: string
          is_default_billing?: boolean
          is_default_shipping?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          recipient_name: string
          state?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          customer_profile_id?: string
          deleted_at?: string | null
          id?: string
          is_default_billing?: boolean
          is_default_shipping?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          recipient_name?: string
          state?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          first_order_at: string | null
          id: string
          last_order_at: string | null
          marketing_opt_in: boolean
          notes_for_maker: string | null
          phone: string | null
          tenant_id: string
          tenant_member_id: string
          total_orders: number
          total_spent_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          marketing_opt_in?: boolean
          notes_for_maker?: string | null
          phone?: string | null
          tenant_id: string
          tenant_member_id: string
          total_orders?: number
          total_spent_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          marketing_opt_in?: boolean
          notes_for_maker?: string | null
          phone?: string | null
          tenant_id?: string
          tenant_member_id?: string
          total_orders?: number
          total_spent_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_profiles_tenant_member_id_fkey"
            columns: ["tenant_member_id"]
            isOneToOne: false
            referencedRelation: "tenant_members"
            referencedColumns: ["id"]
          },
        ]
      }
      design_choices: {
        Row: {
          candidates: Json
          created_at: string
          decision_type: string
          id: string
          mood_key: string | null
          niche_slug: string | null
          picked: Json
          reasoning: string
          tenant_id: string | null
        }
        Insert: {
          candidates: Json
          created_at?: string
          decision_type: string
          id?: string
          mood_key?: string | null
          niche_slug?: string | null
          picked: Json
          reasoning: string
          tenant_id?: string | null
        }
        Update: {
          candidates?: Json
          created_at?: string
          decision_type?: string
          id?: string
          mood_key?: string | null
          niche_slug?: string | null
          picked?: Json
          reasoning?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_choices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          event_id: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description: string
          event_id: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          event_id?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          end_date: string | null
          event_date: string
          id: string
          location: string | null
          name: string
          notes: string | null
          status: string
          tenant_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          event_date: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          event_date?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          allowlist: string[]
          created_at: string
          enabled: boolean
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          allowlist?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          allowlist?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      generation_rate_limits: {
        Row: {
          count: number
          ip: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          ip: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          ip?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      gift_card_transactions: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          created_at: string
          gift_card_id: string
          id: string
          note: string | null
          order_id: string | null
          tenant_id: string
          transaction_type: string
        }
        Insert: {
          amount_cents: number
          balance_after_cents: number
          created_at?: string
          gift_card_id: string
          id?: string
          note?: string | null
          order_id?: string | null
          tenant_id: string
          transaction_type: string
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string
          gift_card_id?: string
          id?: string
          note?: string | null
          order_id?: string | null
          tenant_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          currency: string
          current_balance_cents: number
          delivered_at: string | null
          delivery_status: string
          expires_at: string | null
          id: string
          initial_value_cents: number
          message: string | null
          purchased_by_order_id: string | null
          purchased_by_profile_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          scheduled_delivery_at: string | null
          sender_name: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          current_balance_cents: number
          delivered_at?: string | null
          delivery_status?: string
          expires_at?: string | null
          id?: string
          initial_value_cents: number
          message?: string | null
          purchased_by_order_id?: string | null
          purchased_by_profile_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          scheduled_delivery_at?: string | null
          sender_name?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          current_balance_cents?: number
          delivered_at?: string | null
          delivery_status?: string
          expires_at?: string | null
          id?: string
          initial_value_cents?: number
          message?: string | null
          purchased_by_order_id?: string | null
          purchased_by_profile_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          scheduled_delivery_at?: string | null
          sender_name?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_purchased_by_order_id_fkey"
            columns: ["purchased_by_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_purchased_by_profile_id_fkey"
            columns: ["purchased_by_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      library_assets: {
        Row: {
          approved: boolean
          approved_at: string | null
          duration_ms: number | null
          generated_at: string
          generator: string
          height: number
          id: string
          kind: string
          niche_slug: string
          prompt: string
          retired_at: string | null
          scene: string | null
          storage_path: string
          width: number
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          duration_ms?: number | null
          generated_at?: string
          generator: string
          height: number
          id?: string
          kind: string
          niche_slug: string
          prompt: string
          retired_at?: string | null
          scene?: string | null
          storage_path: string
          width: number
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          duration_ms?: number | null
          generated_at?: string
          generator?: string
          height?: number
          id?: string
          kind?: string
          niche_slug?: string
          prompt?: string
          retired_at?: string | null
          scene?: string | null
          storage_path?: string
          width?: number
        }
        Relationships: []
      }
      listing_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          listing_id: string
          position: number
          tenant_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          tenant_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_collections_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_collections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_variants: {
        Row: {
          created_at: string
          id: string
          inventory_count: number | null
          listing_id: string
          media_ids: string[]
          option_combination: Json
          price_cents: number | null
          sku: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_count?: number | null
          listing_id: string
          media_ids?: string[]
          option_combination: Json
          price_cents?: number | null
          sku?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_count?: number | null
          listing_id?: string
          media_ids?: string[]
          option_combination?: Json
          price_cents?: number | null
          sku?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_variants_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          base_price_cents: number
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          inventory_count: number | null
          inventory_tracked: boolean
          is_preview: boolean
          listing_type: string
          low_stock_threshold: number | null
          media_ids: string[]
          metadata: Json
          name: string
          payment_model: string
          post_purchase_note: string | null
          primary_collection_id: string | null
          published_at: string | null
          requires_scheduling: boolean
          requires_shipping: boolean
          short_description: string | null
          slug: string
          status: string
          subscription_interval: string | null
          tenant_id: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          base_price_cents: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          inventory_count?: number | null
          inventory_tracked?: boolean
          is_preview?: boolean
          listing_type: string
          low_stock_threshold?: number | null
          media_ids?: string[]
          metadata?: Json
          name: string
          payment_model?: string
          post_purchase_note?: string | null
          primary_collection_id?: string | null
          published_at?: string | null
          requires_scheduling?: boolean
          requires_shipping?: boolean
          short_description?: string | null
          slug: string
          status?: string
          subscription_interval?: string | null
          tenant_id: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          base_price_cents?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          inventory_count?: number | null
          inventory_tracked?: boolean
          is_preview?: boolean
          listing_type?: string
          low_stock_threshold?: number | null
          media_ids?: string[]
          metadata?: Json
          name?: string
          payment_model?: string
          post_purchase_note?: string | null
          primary_collection_id?: string | null
          published_at?: string | null
          requires_scheduling?: boolean
          requires_shipping?: boolean
          short_description?: string | null
          slug?: string
          status?: string
          subscription_interval?: string | null
          tenant_id?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_versions: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          niche_slug: string
          snapshot: Json
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          niche_slug: string
          snapshot: Json
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          niche_slug?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "niche_versions_niche_slug_fkey"
            columns: ["niche_slug"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["slug"]
          },
        ]
      }
      niches: {
        Row: {
          aliases: string[]
          approved_at: string | null
          approved_by: string | null
          body_markdown: string
          created_at: string
          created_by: string | null
          display_name: string
          last_updated_by: string | null
          related_niches: string[]
          slug: string
          status: string
          tenant_type_fit: string[]
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          approved_at?: string | null
          approved_by?: string | null
          body_markdown: string
          created_at?: string
          created_by?: string | null
          display_name: string
          last_updated_by?: string | null
          related_niches?: string[]
          slug: string
          status?: string
          tenant_type_fit: string[]
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          approved_at?: string | null
          approved_by?: string | null
          body_markdown?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          last_updated_by?: string | null
          related_niches?: string[]
          slug?: string
          status?: string
          tenant_type_fit?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      notify_interest: {
        Row: {
          created_at: string
          email: string
          id: string
          listing_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          listing_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          listing_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notify_interest_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notify_interest_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          listing_variant_id: string | null
          metadata: Json
          name_snapshot: string
          order_id: string
          post_purchase_note_snapshot: string | null
          quantity: number
          subtotal_cents: number
          tenant_id: string
          unit_price_cents: number
          variant_description_snapshot: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_variant_id?: string | null
          metadata?: Json
          name_snapshot: string
          order_id: string
          post_purchase_note_snapshot?: string | null
          quantity: number
          subtotal_cents: number
          tenant_id: string
          unit_price_cents: number
          variant_description_snapshot?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_variant_id?: string | null
          metadata?: Json
          name_snapshot?: string
          order_id?: string
          post_purchase_note_snapshot?: string | null
          quantity?: number
          subtotal_cents?: number
          tenant_id?: string
          unit_price_cents?: number
          variant_description_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_listing_variant_id_fkey"
            columns: ["listing_variant_id"]
            isOneToOne: false
            referencedRelation: "listing_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          canceled_at: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          customer_profile_id: string | null
          discount_cents: number
          event_id: string | null
          fulfilled_at: string | null
          id: string
          internal_notes: string | null
          notes_to_customer: string | null
          order_number: string
          paid_at: string | null
          shipping_address: Json | null
          shipping_cents: number
          source: string
          status: string
          subtotal_cents: number
          tax_cents: number
          tenant_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          customer_profile_id?: string | null
          discount_cents?: number
          event_id?: string | null
          fulfilled_at?: string | null
          id?: string
          internal_notes?: string | null
          notes_to_customer?: string | null
          order_number: string
          paid_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          source?: string
          status?: string
          subtotal_cents: number
          tax_cents?: number
          tenant_id: string
          total_cents: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          customer_profile_id?: string | null
          discount_cents?: number
          event_id?: string | null
          fulfilled_at?: string | null
          id?: string
          internal_notes?: string | null
          notes_to_customer?: string | null
          order_number?: string
          paid_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          source?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          tenant_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          external_payment_id: string | null
          failure_reason: string | null
          id: string
          metadata: Json
          order_id: string
          payment_method_type: string | null
          payment_type: string
          processed_at: string | null
          processor: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          external_payment_id?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json
          order_id: string
          payment_method_type?: string | null
          payment_type: string
          processed_at?: string | null
          processor: string
          status: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          external_payment_id?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json
          order_id?: string
          payment_method_type?: string | null
          payment_type?: string
          processed_at?: string | null
          processor?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_redemptions: {
        Row: {
          amount_discounted_cents: number
          created_at: string
          customer_profile_id: string | null
          id: string
          order_id: string
          promo_id: string
          tenant_id: string
        }
        Insert: {
          amount_discounted_cents: number
          created_at?: string
          customer_profile_id?: string | null
          id?: string
          order_id: string
          promo_id: string
          tenant_id: string
        }
        Update: {
          amount_discounted_cents?: number
          created_at?: string
          customer_profile_id?: string | null
          id?: string
          order_id?: string
          promo_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      promos: {
        Row: {
          applies_to: Json
          code: string | null
          conditions: Json
          created_at: string
          description: string | null
          discount_percent: number | null
          discount_type: string
          discount_value_cents: number | null
          ends_at: string | null
          id: string
          internal_name: string
          max_uses_per_customer: number | null
          max_uses_total: number | null
          promo_type: string
          stackable_with_others: boolean
          starts_at: string | null
          status: string
          tenant_id: string
          updated_at: string
          uses_count: number
        }
        Insert: {
          applies_to?: Json
          code?: string | null
          conditions?: Json
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discount_type: string
          discount_value_cents?: number | null
          ends_at?: string | null
          id?: string
          internal_name: string
          max_uses_per_customer?: number | null
          max_uses_total?: number | null
          promo_type: string
          stackable_with_others?: boolean
          starts_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          uses_count?: number
        }
        Update: {
          applies_to?: Json
          code?: string | null
          conditions?: Json
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discount_type?: string
          discount_value_cents?: number | null
          ends_at?: string | null
          id?: string
          internal_name?: string
          max_uses_per_customer?: number | null
          max_uses_total?: number | null
          promo_type?: string
          stackable_with_others?: boolean
          starts_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          customer_profile_id: string | null
          helpful_count: number
          id: string
          listing_id: string
          maker_responded_at: string | null
          maker_response: string | null
          media_ids: string[]
          order_id: string
          order_item_id: string
          rating: number
          reviewer_name_snapshot: string
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_profile_id?: string | null
          helpful_count?: number
          id?: string
          listing_id: string
          maker_responded_at?: string | null
          maker_response?: string | null
          media_ids?: string[]
          order_id: string
          order_item_id: string
          rating: number
          reviewer_name_snapshot: string
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_profile_id?: string | null
          helpful_count?: number
          id?: string
          listing_id?: string
          maker_responded_at?: string | null
          maker_response?: string | null
          media_ids?: string[]
          order_id?: string
          order_item_id?: string
          rating?: number
          reviewer_name_snapshot?: string
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          created_at: string
          id: string
          order_item_id: string
          quantity: number
          shipment_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_item_id: string
          quantity: number
          shipment_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_item_id?: string
          quantity?: number
          shipment_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          estimated_delivery_at: string | null
          id: string
          notes: string | null
          order_id: string
          shipment_number: number
          shipped_at: string | null
          shipping_method: string | null
          status: string
          tenant_id: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipment_number: number
          shipped_at?: string | null
          shipping_method?: string | null
          status?: string
          tenant_id: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipment_number?: number
          shipped_at?: string | null
          shipping_method?: string | null
          status?: string
          tenant_id?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_versions: {
        Row: {
          created_at: string
          envelope: Json
          id: string
          label: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          envelope: Json
          id?: string
          label: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          envelope?: Json
          id?: string
          label?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          tier: string
          trial_end: string | null
          trial_start: string | null
          unit_amount_cents: number | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          tier: string
          trial_end?: string | null
          trial_start?: string | null
          unit_amount_cents?: number | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          tier?: string
          trial_end?: string | null
          trial_start?: string | null
          unit_amount_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          removed_at: string | null
          role: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          removed_at?: string | null
          role: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          removed_at?: string | null
          role?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          brand_colors: string[] | null
          business_name: string
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          currency: string
          custom_domain: string | null
          deleted_at: string | null
          id: string
          inspiration_urls: string[]
          logo_contains_wordmark: boolean | null
          logo_url: string | null
          mood_key: string | null
          niche_description: string | null
          niche_from_list: boolean
          phone: string | null
          postal_code: string | null
          primary_niche: string | null
          secondary_niche: string | null
          service_areas: string[] | null
          specialization_notes: string | null
          specializations: string[]
          square_merchant_id: string | null
          state: string | null
          status: string
          stripe_account_id: string | null
          subdomain: string
          tier: string
          time_zone: string
          types: string[]
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          brand_colors?: string[] | null
          business_name: string
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          inspiration_urls?: string[]
          logo_contains_wordmark?: boolean | null
          logo_url?: string | null
          mood_key?: string | null
          niche_description?: string | null
          niche_from_list?: boolean
          phone?: string | null
          postal_code?: string | null
          primary_niche?: string | null
          secondary_niche?: string | null
          service_areas?: string[] | null
          specialization_notes?: string | null
          specializations?: string[]
          square_merchant_id?: string | null
          state?: string | null
          status?: string
          stripe_account_id?: string | null
          subdomain: string
          tier: string
          time_zone?: string
          types: string[]
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          brand_colors?: string[] | null
          business_name?: string
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          inspiration_urls?: string[]
          logo_contains_wordmark?: boolean | null
          logo_url?: string | null
          mood_key?: string | null
          niche_description?: string | null
          niche_from_list?: boolean
          phone?: string | null
          postal_code?: string | null
          primary_niche?: string | null
          secondary_niche?: string | null
          service_areas?: string[] | null
          specialization_notes?: string | null
          specializations?: string[]
          square_merchant_id?: string | null
          state?: string | null
          status?: string
          stripe_account_id?: string | null
          subdomain?: string
          tier?: string
          time_zone?: string
          types?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          ai_generation_metadata: Json | null
          alt_text: string | null
          caption: string | null
          created_at: string
          deleted_at: string | null
          duration_seconds: number | null
          file_name: string
          hash_sha256: string | null
          height_px: number | null
          id: string
          mime_type: string
          public_url: string | null
          size_bytes: number
          source: string
          status: string
          storage_bucket: string
          storage_path: string
          tenant_id: string | null
          updated_at: string
          uploaded_by_user_id: string | null
          width_px: number | null
        }
        Insert: {
          ai_generation_metadata?: Json | null
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          file_name: string
          hash_sha256?: string | null
          height_px?: number | null
          id?: string
          mime_type: string
          public_url?: string | null
          size_bytes: number
          source: string
          status?: string
          storage_bucket: string
          storage_path: string
          tenant_id?: string | null
          updated_at?: string
          uploaded_by_user_id?: string | null
          width_px?: number | null
        }
        Update: {
          ai_generation_metadata?: Json | null
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          file_name?: string
          hash_sha256?: string | null
          height_px?: number | null
          id?: string
          mime_type?: string
          public_url?: string | null
          size_bytes?: number
          source?: string
          status?: string
          storage_bucket?: string
          storage_path?: string
          tenant_id?: string | null
          updated_at?: string
          uploaded_by_user_id?: string | null
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_attributes: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          name: string
          position: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          name: string
          position?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          name?: string
          position?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_attributes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_attributes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_options: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          position: number
          tenant_id: string
          updated_at: string
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          position?: number
          tenant_id: string
          updated_at?: string
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          position?: number
          tenant_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_options_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "variation_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          confirm_token: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          ip: unknown
          type: string
          user_agent: string | null
        }
        Insert: {
          confirm_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          ip?: unknown
          type: string
          user_agent?: string | null
        }
        Update: {
          confirm_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ip?: unknown
          type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          customer_profile_id: string
          id: string
          listing_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          customer_profile_id: string
          id?: string
          listing_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          customer_profile_id?: string
          id?: string
          listing_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_tenant_admin: { Args: { target_tenant_id: string }; Returns: boolean }
      is_tenant_customer: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
