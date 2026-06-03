import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Song } from '../store/useLibraryStore'

export async function exportAllSongs(songs: Song[]): Promise<void> {
  const zip = new JSZip()
  const chordproFolder = zip.folder('ChordPro')!
  const pdfFolder = zip.folder('PDF')!
  const imagesFolder = zip.folder('Immagini')!

  for (const song of songs) {
    if (song.type === 'chordpro') {
      const filename = `${song.title.replace(/[^a-z0-9]/gi, '_')}.cho`
      chordproFolder.file(filename, song.content ?? '')
    } else if (song.type === 'pdf' && song.file_url) {
      try {
        const resp = await fetch(song.file_url)
        const blob = await resp.blob()
        const filename = `${song.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
        pdfFolder.file(filename, blob)
      } catch { /* skip on fetch error */ }
    } else if (song.type === 'image' && song.file_url) {
      try {
        const resp = await fetch(song.file_url)
        const blob = await resp.blob()
        const ext = song.file_url.split('.').pop() ?? 'jpg'
        const filename = `${song.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`
        imagesFolder.file(filename, blob)
      } catch { /* skip on fetch error */ }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, 'RiChord_Export.zip')
}
