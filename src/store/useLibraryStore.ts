import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export type SongType = 'chordpro' | 'pdf' | 'image'

export interface Song {
  id: string
  user_id: string
  title: string
  artist: string | null
  content: string
  key: string | null
  tags: string[]
  notes: string | null
  type: SongType
  file_url: string | null
  created_at: string
  updated_at: string
}

export interface SongFormData {
  title: string
  artist: string
  content: string
  key: string
  tags: string[]
  notes: string
  type: SongType
  file_url?: string | null
}

interface LibraryState {
  songs: Song[]
  loading: boolean
  fetchSongs: (userId: string) => Promise<void>
  addSong: (userId: string, data: SongFormData) => Promise<Song | null>
  updateSong: (id: string, data: Partial<SongFormData>) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  getSong: (id: string) => Song | undefined
  getAllTags: () => string[]
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  songs: [],
  loading: false,

  fetchSongs: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Errore nel caricamento dei brani')
    } else {
      set({ songs: data as Song[] })
    }
    set({ loading: false })
  },

  addSong: async (userId, data) => {
    const { data: result, error } = await supabase
      .from('songs')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) {
      console.error('addSong error:', error)
      toast.error(`Errore nel salvataggio: ${error.message}`)
      return null
    }
    set((s) => ({ songs: [result as Song, ...s.songs] }))
    return result as Song
  },

  updateSong: async (id, data) => {
    const { error } = await supabase
      .from('songs')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.error('updateSong error:', error)
      toast.error(`Errore nel salvataggio: ${error.message}`)
      return
    }
    set((s) => ({
      songs: s.songs.map((song) => (song.id === id ? { ...song, ...data } : song)),
    }))
  },

  deleteSong: async (id) => {
    const { error } = await supabase.from('songs').delete().eq('id', id)
    if (error) {
      toast.error('Errore nell\'eliminazione')
      return
    }
    set((s) => ({ songs: s.songs.filter((song) => song.id !== id) }))
    toast.success('Brano eliminato')
  },

  getSong: (id) => get().songs.find((s) => s.id === id),

  getAllTags: () => {
    const tags = get().songs.flatMap((s) => s.tags ?? [])
    return [...new Set(tags)]
  },
}))
