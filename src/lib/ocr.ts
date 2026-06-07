/**
 * OCR pipeline:
 *  - Images  → Tesseract.js directly
 *  - PDFs    → pdf.js renders each page to canvas → Tesseract.js per page
 *
 * After recognition, word bounding-boxes are used to:
 *   1. Group words into horizontal lines (by Y centre)
 *   2. Classify lines as "chord" or "lyric" based on content
 *   3. Pair each chord line with the lyric line immediately below it
 *   4. Reconstruct ChordPro by placing [Chord] tokens before the lyric word
 *      whose X position is closest to the chord's X position
 */

// ── Chord pattern ─────────────────────────────────────────────────────────────

const CHORD_RE =
  /^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])(#|b)?(m7?|M7?|maj7?|sus[24]?|dim|aug|\+|-|add\d*)?(\/[A-G](#|b)?)?$/

function isChordToken(text: string): boolean {
  return CHORD_RE.test(text.trim())
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BBox { x0: number; y0: number; x1: number; y1: number }
interface OcrWord { text: string; bbox: BBox }

// ── Line grouping ─────────────────────────────────────────────────────────────

function groupIntoLines(words: OcrWord[], yThreshold = 12): OcrWord[][] {
  if (words.length === 0) return []
  const sorted = [...words].sort((a, b) =>
    (a.bbox.y0 + a.bbox.y1) / 2 - (b.bbox.y0 + b.bbox.y1) / 2,
  )
  const lines: { words: OcrWord[]; yCenter: number }[] = []
  for (const word of sorted) {
    const cy = (word.bbox.y0 + word.bbox.y1) / 2
    const last = lines[lines.length - 1]
    if (last && Math.abs(cy - last.yCenter) <= yThreshold) {
      last.words.push(word)
    } else {
      lines.push({ words: [word], yCenter: cy })
    }
  }
  // Sort words within each line by X
  return lines.map((l) => l.words.sort((a, b) => a.bbox.x0 - b.bbox.x0))
}

// ── ChordPro line builder ─────────────────────────────────────────────────────

function buildChordProLine(chordWords: OcrWord[], lyricWords: OcrWord[]): string {
  const chords = chordWords
    .filter((w) => isChordToken(w.text))
    .sort((a, b) => a.bbox.x0 - b.bbox.x0)

  if (chords.length === 0 || lyricWords.length === 0) {
    return lyricWords.map((w) => w.text).join(' ')
  }

  // Assign each chord to the lyric word with the nearest X (left edge)
  const assignments = new Map<number, string[]>()
  for (const chord of chords) {
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < lyricWords.length; i++) {
      const dist = Math.abs(chord.bbox.x0 - lyricWords[i].bbox.x0)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    if (!assignments.has(bestIdx)) assignments.set(bestIdx, [])
    assignments.get(bestIdx)!.push(chord.text)
  }

  return lyricWords
    .map((lw, i) => {
      const before = (assignments.get(i) ?? []).map((c) => `[${c}]`).join('')
      return before + lw.text
    })
    .join(' ')
}

// ── Page processor ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processOcrData(data: any): string {
  const words: OcrWord[] = (data.words as OcrWord[]).filter(
    (w) => w.text.trim().length > 0,
  )

  if (words.length === 0) return ''

  const rawLines = groupIntoLines(words)

  type LineKind = 'chord' | 'lyric'
  const classified: { kind: LineKind; words: OcrWord[] }[] = rawLines.map((line) => {
    const chordCount = line.filter((w) => isChordToken(w.text)).length
    const kind: LineKind =
      line.length > 0 && chordCount / line.length >= 0.6 ? 'chord' : 'lyric'
    return { kind, words: line }
  })

  const output: string[] = []
  let i = 0
  while (i < classified.length) {
    const cur = classified[i]
    if (
      cur.kind === 'chord' &&
      i + 1 < classified.length &&
      classified[i + 1].kind === 'lyric'
    ) {
      // Chord + lyric pair → reconstruct ChordPro line
      output.push(buildChordProLine(cur.words, classified[i + 1].words))
      i += 2
    } else if (cur.kind === 'lyric') {
      output.push(cur.words.map((w) => w.text).join(' '))
      i++
    } else {
      // Chord line without lyric below: output chords in brackets
      output.push(cur.words.map((w) => (isChordToken(w.text) ? `[${w.text}]` : w.text)).join(' '))
      i++
    }
  }

  return output.join('\n')
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function runOcr(
  fileUrl: string,
  fileType: 'image' | 'pdf',
  onProgress?: (msg: string) => void,
): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('ita+eng', 1, {
    logger: (m: { status: string; progress?: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(`Riconoscimento… ${Math.round((m.progress ?? 0) * 100)}%`)
      }
    },
  })

  let result = ''

  try {
    if (fileType === 'image') {
      onProgress?.('Analisi immagine…')
      const { data } = await worker.recognize(fileUrl)
      result = processOcrData(data)
    } else {
      // PDF: render each page with pdf.js then OCR
      onProgress?.('Caricamento PDF…')
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const pdf = await pdfjsLib.getDocument({ url: fileUrl }).promise
      const pages: string[] = []

      for (let p = 1; p <= pdf.numPages; p++) {
        onProgress?.(`Pagina ${p} / ${pdf.numPages}…`)
        const page = await pdf.getPage(p)
        const viewport = page.getViewport({ scale: 2.0 })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise

        const { data } = await worker.recognize(canvas)
        const pageText = processOcrData(data)
        if (pageText.trim()) pages.push(pageText)
      }

      result = pages.join('\n\n')
    }
  } finally {
    await worker.terminate()
  }

  return result.trim()
}
