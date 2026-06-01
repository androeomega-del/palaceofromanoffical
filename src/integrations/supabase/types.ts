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
      abandoned_carts: {
        Row: {
          checkout_url: string | null
          created_at: string
          customer_name: string | null
          email: string
          id: string
          item_count: number
          items: Json
          last_activity_at: string
          page_path: string | null
          recovered_at: string | null
          recovery_email_count: number
          recovery_email_sent_at: string | null
          session_id: string
          total_usd: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          customer_name?: string | null
          email: string
          id?: string
          item_count?: number
          items?: Json
          last_activity_at?: string
          page_path?: string | null
          recovered_at?: string | null
          recovery_email_count?: number
          recovery_email_sent_at?: string | null
          session_id: string
          total_usd?: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string
          id?: string
          item_count?: number
          items?: Json
          last_activity_at?: string
          page_path?: string | null
          recovered_at?: string | null
          recovery_email_count?: number
          recovery_email_sent_at?: string | null
          session_id?: string
          total_usd?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_usage_ledger: {
        Row: {
          cost_cents: number
          created_at: string
          id: string
          input_tokens: number
          metadata: Json
          model: string
          module: string
          output_tokens: number
        }
        Insert: {
          cost_cents?: number
          created_at?: string
          id?: string
          input_tokens?: number
          metadata?: Json
          model: string
          module: string
          output_tokens?: number
        }
        Update: {
          cost_cents?: number
          created_at?: string
          id?: string
          input_tokens?: number
          metadata?: Json
          model?: string
          module?: string
          output_tokens?: number
        }
        Relationships: []
      }
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
      content_queue: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          channel: string
          cost_cents: number
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          kind: string
          parent_id: string | null
          payload: Json
          published_at: string | null
          scheduled_for: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          channel: string
          cost_cents?: number
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          kind: string
          parent_id?: string | null
          payload?: Json
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          channel?: string
          cost_cents?: number
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          kind?: string
          parent_id?: string | null
          payload?: Json
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_task_completions: {
        Row: {
          completed_at: string
          completed_by: string | null
          completed_on: string
          id: string
          task_id: string
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          completed_on?: string
          id?: string
          task_id: string
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          completed_on?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          last_rolled_over_on: string | null
          notes: string | null
          priority: string
          recurrence: string
          recurrence_day: number | null
          reminder_sent_for: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_rolled_over_on?: string | null
          notes?: string | null
          priority?: string
          recurrence?: string
          recurrence_day?: number | null
          reminder_sent_for?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          last_rolled_over_on?: string | null
          notes?: string | null
          priority?: string
          recurrence?: string
          recurrence_day?: number | null
          reminder_sent_for?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dynamic_landing_pages: {
        Row: {
          blueprint_json: Json
          created_at: string
          expires_at: string | null
          generated_at: string
          id: string
          priority_score: number
          signal_type: string
          slug: string
          source_term: string
          status: string
        }
        Insert: {
          blueprint_json: Json
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          priority_score?: number
          signal_type: string
          slug: string
          source_term: string
          status?: string
        }
        Update: {
          blueprint_json?: Json
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          priority_score?: number
          signal_type?: string
          slug?: string
          source_term?: string
          status?: string
        }
        Relationships: []
      }
      email_dispatch_log: {
        Row: {
          cart_id: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          cart_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          cart_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      growth_jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number
          payload: Json
          result: Json | null
          run_after: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          job_type: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          result?: Json | null
          run_after?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          job_type?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          result?: Json | null
          run_after?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      gsc_alert_thresholds: {
        Row: {
          active: boolean
          clicks_drop_pct: number
          created_at: string
          id: string
          impressions_drop_pct: number
          min_clicks_floor: number
          min_impressions_floor: number
          position_warn_above: number | null
          scope_type: string
          scope_value: string | null
          sitemap_error_min: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          clicks_drop_pct?: number
          created_at?: string
          id?: string
          impressions_drop_pct?: number
          min_clicks_floor?: number
          min_impressions_floor?: number
          position_warn_above?: number | null
          scope_type?: string
          scope_value?: string | null
          sitemap_error_min?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          clicks_drop_pct?: number
          created_at?: string
          id?: string
          impressions_drop_pct?: number
          min_clicks_floor?: number
          min_impressions_floor?: number
          position_warn_above?: number | null
          scope_type?: string
          scope_value?: string | null
          sitemap_error_min?: number
          updated_at?: string
        }
        Relationships: []
      }
      gsc_alerts: {
        Row: {
          alert_type: string
          created_at: string
          emailed: boolean
          id: string
          message: string
          metric_data: Json
          resolved_at: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          emailed?: boolean
          id?: string
          message: string
          metric_data?: Json
          resolved_at?: string | null
          severity: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          emailed?: boolean
          id?: string
          message?: string
          metric_data?: Json
          resolved_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      gsc_daily_snapshots: {
        Row: {
          clicks: number
          created_at: string
          ctr: number
          impressions: number
          indexed_count: number | null
          position: number
          raw: Json | null
          sitemap_errors: number
          sitemap_warnings: number
          snapshot_date: string
          top_pages: Json
          top_queries: Json
        }
        Insert: {
          clicks?: number
          created_at?: string
          ctr?: number
          impressions?: number
          indexed_count?: number | null
          position?: number
          raw?: Json | null
          sitemap_errors?: number
          sitemap_warnings?: number
          snapshot_date: string
          top_pages?: Json
          top_queries?: Json
        }
        Update: {
          clicks?: number
          created_at?: string
          ctr?: number
          impressions?: number
          indexed_count?: number | null
          position?: number
          raw?: Json | null
          sitemap_errors?: number
          sitemap_warnings?: number
          snapshot_date?: string
          top_pages?: Json
          top_queries?: Json
        }
        Relationships: []
      }
      gsc_monitored_urls: {
        Row: {
          active: boolean
          created_at: string
          id: string
          last_synced_at: string
          locale: string | null
          page_group: string
          source: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          last_synced_at?: string
          locale?: string | null
          page_group?: string
          source?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          last_synced_at?: string
          locale?: string | null
          page_group?: string
          source?: string
          url?: string
        }
        Relationships: []
      }
      gsc_redirect_audits: {
        Row: {
          by_locale: Json
          id: string
          notes: string | null
          results: Json
          run_at: string
          status_200: number
          status_301: number
          status_404: number
          status_other: number
          total: number
        }
        Insert: {
          by_locale?: Json
          id?: string
          notes?: string | null
          results?: Json
          run_at?: string
          status_200?: number
          status_301?: number
          status_404?: number
          status_other?: number
          total?: number
        }
        Update: {
          by_locale?: Json
          id?: string
          notes?: string | null
          results?: Json
          run_at?: string
          status_200?: number
          status_301?: number
          status_404?: number
          status_other?: number
          total?: number
        }
        Relationships: []
      }
      gsc_url_inspections: {
        Row: {
          capture_source: string
          captured_at: string
          captured_by: string | null
          coverage_state: string | null
          created_at: string
          id: string
          indexing_state: string | null
          inspection_result: Json
          last_crawl_time: string | null
          notes: string | null
          page_fetch_state: string | null
          robots_txt_state: string | null
          url: string
          verdict: string | null
        }
        Insert: {
          capture_source?: string
          captured_at?: string
          captured_by?: string | null
          coverage_state?: string | null
          created_at?: string
          id?: string
          indexing_state?: string | null
          inspection_result?: Json
          last_crawl_time?: string | null
          notes?: string | null
          page_fetch_state?: string | null
          robots_txt_state?: string | null
          url: string
          verdict?: string | null
        }
        Update: {
          capture_source?: string
          captured_at?: string
          captured_by?: string | null
          coverage_state?: string | null
          created_at?: string
          id?: string
          indexing_state?: string | null
          inspection_result?: Json
          last_crawl_time?: string | null
          notes?: string | null
          page_fetch_state?: string | null
          robots_txt_state?: string | null
          url?: string
          verdict?: string | null
        }
        Relationships: []
      }
      gsc_weekly_reviews: {
        Row: {
          action_items: Json
          clicks: number
          clicks_wow_pct: number | null
          created_at: string
          ctr: number
          id: string
          impressions: number
          impressions_wow_pct: number | null
          position: number
          summary: string | null
          top_pages: Json
          top_queries: Json
          week_start: string
        }
        Insert: {
          action_items?: Json
          clicks?: number
          clicks_wow_pct?: number | null
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          impressions_wow_pct?: number | null
          position?: number
          summary?: string | null
          top_pages?: Json
          top_queries?: Json
          week_start: string
        }
        Update: {
          action_items?: Json
          clicks?: number
          clicks_wow_pct?: number | null
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          impressions_wow_pct?: number | null
          position?: number
          summary?: string | null
          top_pages?: Json
          top_queries?: Json
          week_start?: string
        }
        Relationships: []
      }
      homepage_daily_layout: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          is_active: boolean
          layout_json: Json
          status: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          is_active?: boolean
          layout_json: Json
          status?: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          is_active?: boolean
          layout_json?: Json
          status?: string
        }
        Relationships: []
      }
      homepage_layout_audit: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          details: Json
          edition_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: Json
          edition_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: Json
          edition_id?: string | null
          id?: string
        }
        Relationships: []
      }
      interaction_events: {
        Row: {
          created_at: string
          event_type: string
          handle: string
          id: string
          page_path: string | null
          position: number | null
          product_type: string | null
          session_id: string | null
          surface: string | null
          user_agent: string | null
          vendor: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          handle: string
          id?: string
          page_path?: string | null
          position?: number | null
          product_type?: string | null
          session_id?: string | null
          surface?: string | null
          user_agent?: string | null
          vendor?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          handle?: string
          id?: string
          page_path?: string | null
          position?: number | null
          product_type?: string | null
          session_id?: string | null
          surface?: string | null
          user_agent?: string | null
          vendor?: string | null
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
      lookbook_hotspots: {
        Row: {
          created_at: string
          id: string
          label: string | null
          lookbook_image_id: string
          product_handle: string
          sort_order: number
          surface_kind: string | null
          surface_slug: string | null
          variant_gid: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          lookbook_image_id: string
          product_handle: string
          sort_order?: number
          surface_kind?: string | null
          surface_slug?: string | null
          variant_gid?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          lookbook_image_id?: string
          product_handle?: string
          sort_order?: number
          surface_kind?: string | null
          surface_slug?: string | null
          variant_gid?: string | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "lookbook_hotspots_lookbook_image_id_fkey"
            columns: ["lookbook_image_id"]
            isOneToOne: false
            referencedRelation: "lookbook_images"
            referencedColumns: ["id"]
          },
        ]
      }
      lookbook_images: {
        Row: {
          alt_text: string | null
          blur_data_url: string | null
          chapter_key: string | null
          created_at: string
          edition_handle: string
          external_id: string | null
          height: number | null
          id: string
          image_url: string
          sort_order: number
          surface_kind: string | null
          surface_slug: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          blur_data_url?: string | null
          chapter_key?: string | null
          created_at?: string
          edition_handle: string
          external_id?: string | null
          height?: number | null
          id?: string
          image_url: string
          sort_order?: number
          surface_kind?: string | null
          surface_slug?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          blur_data_url?: string | null
          chapter_key?: string | null
          created_at?: string
          edition_handle?: string
          external_id?: string | null
          height?: number | null
          id?: string
          image_url?: string
          sort_order?: number
          surface_kind?: string | null
          surface_slug?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      meta_ab_conversions: {
        Row: {
          bucket: number
          created_at: string
          event_type: string
          id: string
          page_type: string
          session_id: string | null
          value_usd: number | null
          variant: string
        }
        Insert: {
          bucket: number
          created_at?: string
          event_type: string
          id?: string
          page_type: string
          session_id?: string | null
          value_usd?: number | null
          variant: string
        }
        Update: {
          bucket?: number
          created_at?: string
          event_type?: string
          id?: string
          page_type?: string
          session_id?: string | null
          value_usd?: number | null
          variant?: string
        }
        Relationships: []
      }
      meta_ab_exposures: {
        Row: {
          bucket: number
          created_at: string
          id: string
          is_bot: boolean
          page_path: string | null
          page_type: string
          session_id: string | null
          user_agent: string | null
          variant: string
        }
        Insert: {
          bucket: number
          created_at?: string
          id?: string
          is_bot?: boolean
          page_path?: string | null
          page_type: string
          session_id?: string | null
          user_agent?: string | null
          variant: string
        }
        Update: {
          bucket?: number
          created_at?: string
          id?: string
          is_bot?: boolean
          page_path?: string | null
          page_type?: string
          session_id?: string | null
          user_agent?: string | null
          variant?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          marketing_consent: boolean
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          marketing_consent?: boolean
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          marketing_consent?: boolean
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      order_emails_sent: {
        Row: {
          email_type: string
          id: string
          order_id: string
          recipient_email: string | null
          sent_at: string
        }
        Insert: {
          email_type: string
          id?: string
          order_id: string
          recipient_email?: string | null
          sent_at?: string
        }
        Update: {
          email_type?: string
          id?: string
          order_id?: string
          recipient_email?: string | null
          sent_at?: string
        }
        Relationships: []
      }
      product_image_reviews: {
        Row: {
          attributes: Json
          created_at: string
          handle: string
          image_path: string | null
          image_url: string | null
          prompt: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          sku: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          handle: string
          image_path?: string | null
          image_url?: string | null
          prompt: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          sku: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          handle?: string
          image_path?: string | null
          image_url?: string | null
          prompt?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          sku?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_origins: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          handle: string
          location_id: string | null
          total_stock: number
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          handle: string
          location_id?: string | null
          total_stock?: number
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          handle?: string
          location_id?: string | null
          total_stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_email: string
          author_name: string
          body: string
          created_at: string
          id: string
          order_id: string | null
          product_handle: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          verified_purchase: boolean
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_email: string
          author_name: string
          body: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_handle: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_email?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_handle?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean
        }
        Relationships: []
      }
      quiz_funnel_events: {
        Row: {
          answers_snapshot: Json | null
          created_at: string
          email: string | null
          event_type: string
          id: string
          page_path: string | null
          session_id: string | null
          step: number | null
          user_agent: string | null
        }
        Insert: {
          answers_snapshot?: Json | null
          created_at?: string
          email?: string | null
          event_type: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          step?: number | null
          user_agent?: string | null
        }
        Update: {
          answers_snapshot?: Json | null
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          step?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      quiz_unlocks: {
        Row: {
          answers: Json
          created_at: string
          email: string
          id: string
          source: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          email: string
          id?: string
          source?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          created_at: string
          id: string
          page_path: string | null
          query: string
          result_count: number
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path?: string | null
          query: string
          result_count?: number
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string | null
          query?: string
          result_count?: number
          session_id?: string | null
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
      stock_alert_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          image_url: string | null
          notified_at: string | null
          price_usd: string | null
          product_handle: string
          product_title: string
          variant_gid: string
          variant_title: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          image_url?: string | null
          notified_at?: string | null
          price_usd?: string | null
          product_handle: string
          product_title: string
          variant_gid: string
          variant_title?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          image_url?: string | null
          notified_at?: string | null
          price_usd?: string | null
          product_handle?: string
          product_title?: string
          variant_gid?: string
          variant_title?: string | null
        }
        Relationships: []
      }
      trending_brands: {
        Row: {
          brand_name: string
          category: string
          created_at: string
          id: string
          key_aesthetic: string
          trend_status: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          category: string
          created_at?: string
          id?: string
          key_aesthetic: string
          trend_status: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          category?: string
          created_at?: string
          id?: string
          key_aesthetic?: string
          trend_status?: string
          updated_at?: string
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
      win_back_emails_sent: {
        Row: {
          id: string
          recipient_email: string
          recommendation_handles: string[] | null
          sent_at: string
        }
        Insert: {
          id?: string
          recipient_email: string
          recommendation_handles?: string[] | null
          sent_at?: string
        }
        Update: {
          id?: string
          recipient_email?: string
          recommendation_handles?: string[] | null
          sent_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_reviews_public: {
        Row: {
          approved_at: string | null
          author_name: string | null
          body: string | null
          created_at: string | null
          id: string | null
          product_handle: string | null
          rating: number | null
          status: string | null
          title: string | null
          updated_at: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          approved_at?: string | null
          author_name?: string | null
          body?: string | null
          created_at?: string | null
          id?: string | null
          product_handle?: string | null
          rating?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          approved_at?: string | null
          author_name?: string | null
          body?: string | null
          created_at?: string | null
          id?: string | null
          product_handle?: string | null
          rating?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
      public_approved_reviews: {
        Row: {
          author_name: string | null
          body: string | null
          created_at: string | null
          id: string | null
          product_handle: string | null
          rating: number | null
          title: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          created_at?: string | null
          id?: string | null
          product_handle?: string | null
          rating?: number | null
          title?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          author_name?: string | null
          body?: string | null
          created_at?: string | null
          id?: string | null
          product_handle?: string | null
          rating?: number | null
          title?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rollover_recurring_daily_tasks: { Args: never; Returns: number }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_lookbook_hotspots: {
        Args: never
        Returns: {
          alt_text: string
          hotspot_id: string
          image_url: string
          label: string
          lookbook_image_id: string
          product_handle: string
          reason: string
          surface_kind: string
          surface_slug: string
          total_hotspots: number
          unique_handles: number
        }[]
      }
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
