import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from './useLibraryStore'

interface OfflineState {
  offlineSongs: Song[]
  isOffline: boolean
  setIsOffline: (v: boolean) => void
  saveSongsOffline: (songs: Song[]) => void
  getOfflineSong: (id: string) => Song | undefined
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      offlineSongs: [],
      isOffline: false,
      setIsOffline: (v) => set({ isOffline: v }),
      saveSongsOffline: (songs) => set({ offlineSongs: songs }),
      getOfflineSong: (id) => get().offlineSongs.find((s) => s.id === id),
    }),
    { name: 'richord-offline' }
  )
)
