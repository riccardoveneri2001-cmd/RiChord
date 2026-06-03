import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type Database = {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string
          user_id: string
          title: string
          artist: string | null
          content: string
          key: string | null
          tags: string[]
          notes: string | null
          type: 'chordpro' | 'pdf' | 'image'
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['songs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['songs']['Insert']>
      }
      setlists: {
        Row: {
          id: string
          user_id: string
          name: string
          event_date: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['setlists']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['setlists']['Insert']>
      }
      setlist_songs: {
        Row: {
          id: string
          setlist_id: string
          song_id: string
          position: number
          custom_key: string | null
        }
        Insert: Omit<Database['public']['Tables']['setlist_songs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['setlist_songs']['Insert']>
      }
      share_links: {
        Row: {
          id: string
          user_id: string
          token: string
          type: 'song' | 'setlist'
          resource_id: string
          expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['share_links']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['share_links']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          notation: 'italian' | 'english'
          theme: 'dark' | 'light'
          onboarding_done: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
    }
  }
}
