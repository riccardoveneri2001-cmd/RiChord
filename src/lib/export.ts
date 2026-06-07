import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Song } from '../store/useLibraryStore'

function sanitize(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, '_')
}

export function downloadCho(song: Song) {
  const blob = new Blob([song.content ?? ''], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitize(song.title)}.cho`
  a.click()
  URL.revokeObjectURL(url)
}

function parseLine(rawLine: string): { chords: { pos: number; chord: string }[]; text: string } {
  const chords: { pos: number; chord: string }[] = []
  let text = ''
  let i = 0
  while (i < rawLine.length) {
    if (rawLine[i] === '[') {
      const end = rawLine.indexOf(']', i)
      if (end !== -1) {
        chords.push({ pos: text.length, chord: rawLine.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    text += rawLine[i]
    i++
  }
  return { chords, text }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addSongContent(doc: any, content: string, margin: number, startY: number): number {
  const pageH: number = doc.internal.pageSize.getHeight()
  const pageW: number = doc.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = startY

  for (const rawLine of content.split('\n')) {
    if (/^\{[^}]*\}$/.test(rawLine.trim())) continue
    if (!rawLine.trim()) { y += 3; continue }
    if (y > pageH - 20) { doc.addPage(); y = 20 }

    const { chords, text } = parseLine(rawLine)

    if (chords.length > 0) {
      doc.setFont('courier', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(33, 118, 174)
      let chordStr = ''
      let lastEnd = 0
      for (const { pos, chord } of chords) {
        chordStr += ' '.repeat(Math.max(0, pos - lastEnd)) + chord
        lastEnd = pos + chord.length
      }
      const chordLines: string[] = doc.splitTextToSize(chordStr, maxW)
      doc.text(chordLines, margin, y)
      y += 4 * chordLines.length
    }

    if (text.trim()) {
      doc.setFont('courier', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      const textLines: string[] = doc.splitTextToSize(text, maxW)
      doc.text(textLines, margin, y)
      y += 6 * textLines.length
    }
  }

  return y
}

export async function downloadSongPdf(song: Song) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text(song.title, margin, 22)

  let y = 32
  if (song.artist) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(120, 120, 120)
    doc.text(song.artist, margin, y)
    y += 8
  }

  addSongContent(doc, song.content ?? '', margin, y + 4)
  doc.save(`${sanitize(song.title)}.pdf`)
}

export async function downloadSetlistPdf(songs: Song[], name: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text(name, margin, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(120, 120, 120)
  doc.text(`${songs.length} bran${songs.length === 1 ? 'o' : 'i'}`, margin, 40)

  for (let si = 0; si < songs.length; si++) {
    const song = songs[si]
    doc.addPage()
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(`${si + 1}. ${song.title}`, margin, 18)

    let y = 26
    if (song.artist) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(120, 120, 120)
      doc.text(song.artist, margin, y)
      y += 7
    }

    addSongContent(doc, song.content ?? '', margin, y + 2)
  }

  doc.save(`${sanitize(name)}_setlist.pdf`)
}

export async function downloadSetlistZip(songs: Song[], name: string) {
  const zip = new JSZip()

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    const fname = `${String(i + 1).padStart(2, '0')}_${sanitize(song.title)}.cho`
    zip.file(fname, song.content ?? '')
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${sanitize(name)}.zip`)
}

// Legacy export — used by ProfilePage or similar
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
