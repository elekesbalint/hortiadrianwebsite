export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          image: string | null
          role: 'user' | 'admin'
          push_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          image?: string | null
          role?: 'user' | 'admin'
          push_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          role?: 'user' | 'admin'
          push_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          image: string | null
          description: string | null
          order: number
          is_active: boolean
          show_in_header: boolean
          detail_page_title: string | null
          featured_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          image?: string | null
          description?: string | null
          order?: number
          is_active?: boolean
          show_in_header?: boolean
          detail_page_title?: string | null
          featured_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          image?: string | null
          description?: string | null
          order?: number
          is_active?: boolean
          show_in_header?: boolean
          detail_page_title?: string | null
          featured_order?: number | null
          created_at?: string
        }
      }
      places: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string
          address: string
          city: string
          county: string | null
          latitude: number
          longitude: number
          phone: string | null
          email: string | null
          website: string | null
          instagram: string | null
          facebook: string | null
          youtube: string | null
          tiktok: string | null
          opening_hours: Record<string, string> | null
          is_open: boolean
          is_premium: boolean
          price_level: number | null
          rating: number
          rating_count: number
          images: string[]
          menu_url: string | null
          price_url: string | null
          booking_url: string | null
          features: string[]
          is_active: boolean
          featured_order: number | null
          event_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category_id: string
          address: string
          city: string
          county?: string | null
          latitude: number
          longitude: number
          phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
          youtube?: string | null
          tiktok?: string | null
          opening_hours?: Record<string, string> | null
          is_open?: boolean
          is_premium?: boolean
          price_level?: number | null
          rating?: number
          rating_count?: number
          images?: string[]
          menu_url?: string | null
          price_url?: string | null
          booking_url?: string | null
          features?: string[]
          is_active?: boolean
          featured_order?: number | null
          event_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category_id?: string
          address?: string
          city?: string
          county?: string | null
          latitude?: number
          longitude?: number
          phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
          youtube?: string | null
          tiktok?: string | null
          opening_hours?: Record<string, string> | null
          is_open?: boolean
          is_premium?: boolean
          price_level?: number | null
          rating?: number
          rating_count?: number
          images?: string[]
          menu_url?: string | null
          price_url?: string | null
          booking_url?: string | null
          features?: string[]
          is_active?: boolean
          featured_order?: number | null
          event_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      filters: {
        Row: {
          id: string
          group_name: string
          group_slug: string
          name: string
          slug: string
          order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          group_name: string
          group_slug: string
          name: string
          slug: string
          order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          group_name?: string
          group_slug?: string
          name?: string
          slug?: string
          order?: number
          is_active?: boolean
        }
      }
      place_filters: {
        Row: {
          place_id: string
          filter_id: string
        }
        Insert: {
          place_id: string
          filter_id: string
        }
        Update: {
          place_id?: string
          filter_id?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          place_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          place_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          place_id?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          place_id: string
          rating: number
          comment: string | null
          images: string[]
          user_name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          place_id: string
          rating: number
          comment?: string | null
          images?: string[]
          user_name?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          place_id?: string
          rating?: number
          comment?: string | null
          images?: string[]
          user_name?: string
          created_at?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
      }
      admin_users: {
        Row: { user_id: string }
        Insert: { user_id: string }
        Update: { user_id?: string }
      }
      sent_notifications: {
        Row: {
          id: string
          title: string
          body: string
          url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          url?: string | null
          created_at?: string
        }
      }
      newsletter_subscribers: {
        Row: {
          email: string
          created_at: string
        }
        Insert: {
          email: string
          created_at?: string
        }
        Update: {
          email?: string
          created_at?: string
        }
      }
      site_statistics: {
        Row: {
          id: string
          key: string
          value: number
          display_label: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: number
          display_label?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: number
          display_label?: string | null
          updated_at?: string
          updated_by?: string | null
        }
      }
      site_documents: {
        Row: {
          key: string
          url: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          url: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          key?: string
          url?: string
          updated_at?: string
          updated_by?: string | null
        }
      }
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Place = Database['public']['Tables']['places']['Row']
export type Filter = Database['public']['Tables']['filters']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row']
