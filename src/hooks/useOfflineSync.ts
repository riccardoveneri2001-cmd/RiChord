import { useEffect } from 'react'
import { useOfflineStore } from '../store/useOfflineStore'
import { useLibraryStore } from '../store/useLibraryStore'

export function useOfflineSync() {
  const { setIsOffline, saveSongsOffline } = useOfflineStore()
  const { songs } = useLibraryStore()

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOffline])

  // Auto-save songs to offline cache whenever library updates
  useEffect(() => {
    if (songs.length > 0) {
      saveSongsOffline(songs)
    }
  }, [songs, saveSongsOffline])
}
