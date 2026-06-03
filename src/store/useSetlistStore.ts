import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface Setlist {
  id: string
  user_id: string
  name: string
  event_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface SetlistSong {
  id: string
  setlist_id: string
  song_id: string
  position: number
  custom_key: string | null
}

interface SetlistState {
  setlists: Setlist[]
  loading: boolean
  fetchSetlists: (userId: string) => Promise<void>
  createSetlist: (userId: string, data: Omit<Setlist, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Setlist | null>
  updateSetlist: (id: string, data: Partial<Setlist>) => Promise<void>
  deleteSetlist: (id: string) => Promise<void>
  duplicateSetlist: (id: string) => Promise<void>
  fetchSetlistSongs: (setlistId: string) => Promise<SetlistSong[]>
  addSongToSetlist: (setlistId: string, songId: string, position: number) => Promise<void>
  removeSongFromSetlist: (id: string) => Promise<void>
  reorderSetlistSongs: (setlistId: string, songs: SetlistSong[]) => Promise<void>
  updateSetlistSongKey: (id: string, key: string) => Promise<void>
}

export const useSetlistStore = create<SetlistState>((set) => ({
  setlists: [],
  loading: false,

  fetchSetlists: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error) set({ setlists: data as Setlist[] })
    set({ loading: false })
  },

  createSetlist: async (userId, data) => {
    const { data: result, error } = await supabase
      .from('setlists')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) { toast.error('Errore nella creazione'); return null }
    set((s) => ({ setlists: [result as Setlist, ...s.setlists] }))
    toast.success('Setlist creata')
    return result as Setlist
  },

  updateSetlist: async (id, data) => {
    const { error } = await supabase
      .from('setlists')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { toast.error('Errore nel salvataggio'); return }
    set((s) => ({ setlists: s.setlists.map((sl) => (sl.id === id ? { ...sl, ...data } : sl)) }))
  },

  deleteSetlist: async (id) => {
    const { error } = await supabase.from('setlists').delete().eq('id', id)
    if (error) { toast.error('Errore nell\'eliminazione'); return }
    set((s) => ({ setlists: s.setlists.filter((sl) => sl.id !== id) }))
    toast.success('Setlist eliminata')
  },

  duplicateSetlist: async (id) => {
    const { data: sl } = await supabase.from('setlists').select('*').eq('id', id).single()
    if (!sl) return
    const { data: newSl, error } = await supabase
      .from('setlists')
      .insert({ name: `${sl.name} (copia)`, event_date: sl.event_date, description: sl.description, user_id: sl.user_id })
      .select()
      .single()
    if (error || !newSl) { toast.error('Errore nella duplicazione'); return }

    const { data: songs } = await supabase.from('setlist_songs').select('*').eq('setlist_id', id)
    if (songs?.length) {
      await supabase.from('setlist_songs').insert(
        songs.map(({ song_id, position, custom_key }: SetlistSong) => ({
          setlist_id: newSl.id, song_id, position, custom_key
        }))
      )
    }
    set((s) => ({ setlists: [newSl as Setlist, ...s.setlists] }))
    toast.success('Setlist duplicata')
  },

  fetchSetlistSongs: async (setlistId) => {
    const { data, error } = await supabase
      .from('setlist_songs')
      .select('*')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: true })
    if (error) return []
    return data as SetlistSong[]
  },

  addSongToSetlist: async (setlistId, songId, position) => {
    await supabase.from('setlist_songs').insert({ setlist_id: setlistId, song_id: songId, position, custom_key: null })
  },

  removeSongFromSetlist: async (id) => {
    await supabase.from('setlist_songs').delete().eq('id', id)
  },

  reorderSetlistSongs: async (_setlistId, songs) => {
    const updates = songs.map((s, i) =>
      supabase.from('setlist_songs').update({ position: i }).eq('id', s.id)
    )
    await Promise.all(updates)
  },

  updateSetlistSongKey: async (id, key) => {
    await supabase.from('setlist_songs').update({ custom_key: key }).eq('id', id)
  },
}))
