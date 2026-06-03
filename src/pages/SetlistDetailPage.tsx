import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconShare, IconPlayerPlay,
  IconGripVertical, IconTrash, IconPlus, IconSearch, IconList,
} from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useSetlistStore, type SetlistSong } from '../store/useSetlistStore'
import { useLibraryStore } from '../store/useLibraryStore'
import { PerformingMode } from '../components/song/PerformingMode'
import { ShareModal } from '../components/share/ShareModal'
import { BottomSheet } from '../components/ui/BottomSheet'
import { transposeChordPro } from '../lib/chordpro'

// ── Shared micro-styles ───────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
  background: '#FFFFFF', border: '0.5px solid #E0DED8',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SetlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setlists, fetchSetlistSongs, addSongToSetlist, removeSongFromSetlist, reorderSetlistSongs } = useSetlistStore()
  const { songs } = useLibraryStore()
  const setlist = setlists.find((s) => s.id === id)

  const [setlistSongs,  setSetlistSongs]  = useState<SetlistSong[]>([])
  const [addOpen,       setAddOpen]       = useState(false)
  const [shareOpen,     setShareOpen]     = useState(false)
  const [search,        setSearch]        = useState('')
  const [performingIdx, setPerformingIdx] = useState<number | null>(null)
  const [focused,       setFocused]       = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) fetchSetlistSongs(id).then(setSetlistSongs)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Enrich with song data
  const enriched = setlistSongs.map((ss) => ({
    ...ss,
    song: songs.find((s) => s.id === ss.song_id),
  }))

  // Songs available to add (only chordpro, not already in setlist)
  const alreadyAdded = new Set(setlistSongs.map((ss) => ss.song_id))
  const filteredSongs = songs.filter(
    (s) =>
      !alreadyAdded.has(s.id) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.artist?.toLowerCase() ?? '').includes(search.toLowerCase())),
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const items = Array.from(setlistSongs)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setSetlistSongs(items)
    await reorderSetlistSongs(id!, items)
  }

  async function handleAddSong(songId: string) {
    await addSongToSetlist(id!, songId, setlistSongs.length)
    const updated = await fetchSetlistSongs(id!)
    setSetlistSongs(updated)
    setAddOpen(false)
    setSearch('')
  }

  async function handleRemove(ssId: string) {
    await removeSongFromSetlist(ssId)
    setSetlistSongs((prev) => prev.filter((s) => s.id !== ssId))
  }

  function openAdd() { setSearch(''); setAddOpen(true) }

  // Performing mode
  const currentPerforming = performingIdx !== null ? enriched[performingIdx] : null
  const currentContent = currentPerforming?.song?.content
    ? transposeChordPro(currentPerforming.song.content, 0)
    : ''

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!setlist) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <p style={{ color: '#8A94A6', fontSize: 15 }}>Setlist non trovata.</p>
      <button
        onClick={() => navigate('/setlists')}
        style={{ color: '#2176AE', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 14, fontFamily: 'inherit' }}
      >
        ← Setlist
      </button>
    </div>
  )

  const formattedDate = setlist.event_date
    ? new Date(setlist.event_date + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#F5F4F1', borderBottom: '0.5px solid #E0DED8',
        padding: '6px 16px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={() => navigate('/setlists')} style={iconBtn} aria-label="Indietro">
          <IconArrowLeft size={18} style={{ color: '#2176AE' }} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {setlist.name}
          </p>
          {formattedDate && (
            <p style={{ margin: 0, fontSize: 12, color: '#8A94A6' }}>{formattedDate}</p>
          )}
        </div>

        <button onClick={() => setShareOpen(true)} style={iconBtn} aria-label="Condividi">
          <IconShare size={17} style={{ color: '#1C2333' }} />
        </button>

        {enriched.length > 0 && (
          <button
            onClick={() => setPerformingIdx(0)}
            style={{
              height: 34, paddingLeft: 12, paddingRight: 14, borderRadius: 8,
              border: 'none', background: '#2176AE', color: '#FFFFFF',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            <IconPlayerPlay size={14} />
            Esegui
          </button>
        )}
      </div>

      {/* Description */}
      {setlist.description && (
        <div style={{ padding: '10px 16px', background: '#FFFFFF', borderBottom: '0.5px solid #E0DED8' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#8A94A6', lineHeight: 1.5 }}>{setlist.description}</p>
        </div>
      )}

      {/* Song count */}
      <div style={{ padding: '10px 16px 4px' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {enriched.length} {enriched.length === 1 ? 'brano' : 'brani'}
        </p>
      </div>

      {/* Empty state */}
      {enriched.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#EDE9FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <IconList size={28} style={{ color: '#5B21B6' }} />
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#1C2333' }}>Setlist vuota</p>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#8A94A6', lineHeight: 1.5, maxWidth: 240 }}>
            Aggiungi brani dalla tua libreria.
          </p>
          <button
            onClick={openAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 20px', borderRadius: 12, border: 'none',
              background: '#5B21B6', color: '#FFFFFF',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <IconPlus size={16} /> Aggiungi brano
          </button>
        </div>
      )}

      {/* Draggable list */}
      {enriched.length > 0 && (
        <div style={{ padding: '8px 16px 0' }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="setlist-songs">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {enriched.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          style={{
                            ...drag.draggableProps.style,
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: '#FFFFFF',
                            borderRadius: 12,
                            border: '0.5px solid #E0DED8',
                            padding: '10px 12px',
                            boxShadow: snapshot.isDragging
                              ? '0 8px 24px rgba(0,0,0,0.12)'
                              : 'none',
                            transform: snapshot.isDragging
                              ? `${drag.draggableProps.style?.transform} scale(1.02)`
                              : drag.draggableProps.style?.transform,
                          }}
                        >
                          {/* Grip handle */}
                          <div
                            {...drag.dragHandleProps}
                            style={{ display: 'flex', alignItems: 'center', cursor: 'grab', padding: '2px 0', flexShrink: 0 }}
                          >
                            <IconGripVertical size={16} style={{ color: '#C8CDD8' }} />
                          </div>

                          {/* Position number */}
                          <span style={{
                            fontSize: 12, fontWeight: 600, color: '#8A94A6',
                            minWidth: 18, textAlign: 'center', flexShrink: 0,
                          }}>
                            {index + 1}
                          </span>

                          {/* Song info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0, fontSize: 15, fontWeight: 500, color: '#1C2333',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.song?.title ?? 'Brano eliminato'}
                            </p>
                            {item.song?.artist && (
                              <p style={{
                                margin: '1px 0 0', fontSize: 13, color: '#8A94A6',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {item.song.artist}
                              </p>
                            )}
                          </div>

                          {/* Custom key */}
                          {item.custom_key && (
                            <span style={{
                              fontSize: 12, fontWeight: 600, color: '#2176AE',
                              background: '#E0F0FA', borderRadius: 6,
                              padding: '2px 8px', flexShrink: 0,
                              fontFamily: 'monospace',
                            }}>
                              {item.custom_key}
                            </span>
                          )}

                          {/* Remove */}
                          <button
                            onClick={() => handleRemove(item.id)}
                            style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            aria-label="Rimuovi"
                          >
                            <IconTrash size={15} style={{ color: '#C8CDD8' }} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add song button (inline, below list) */}
          <button
            onClick={openAdd}
            style={{
              width: '100%', marginTop: 10,
              padding: '12px 16px', borderRadius: 12,
              border: '0.5px dashed #C8CDD8', background: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: '#8A94A6', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <IconPlus size={16} style={{ color: '#8A94A6' }} />
            Aggiungi brano
          </button>
        </div>
      )}

      {/* Add song BottomSheet */}
      <BottomSheet open={addOpen} onClose={() => { setAddOpen(false); setSearch('') }}>
        <div style={{ padding: '0 16px 32px' }}>
          <p style={{
            textAlign: 'center', margin: '0 0 14px',
            fontSize: 13, fontWeight: 600, color: '#8A94A6',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Aggiungi brano
          </p>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F5F4F1', borderRadius: 12,
            border: `0.5px solid ${focused ? '#2176AE' : '#E0DED8'}`,
            padding: '0 12px', marginBottom: 12,
            transition: 'border-color 0.15s',
          }}>
            <IconSearch size={15} style={{ color: '#8A94A6', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Cerca brano…"
              style={{
                flex: 1, padding: '11px 0', background: 'none', border: 'none',
                fontSize: 15, color: '#1C2333', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Results */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filteredSongs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 14, color: '#8A94A6' }}>
                {search ? 'Nessun brano trovato' : 'Tutti i brani sono già in questa setlist'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredSongs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handleAddSong(song.id)}
                    style={{
                      width: '100%', padding: '11px 12px', borderRadius: 10,
                      background: 'none', border: 'none', textAlign: 'left',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#F5F4F1')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#1C2333' }}>{song.title}</p>
                    {song.artist && (
                      <p style={{ margin: '1px 0 0', fontSize: 13, color: '#8A94A6' }}>{song.artist}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Share modal */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} type="setlist" resourceId={id!} />

      {/* Performing mode */}
      {performingIdx !== null && currentPerforming?.song && (
        <PerformingMode
          song={currentPerforming.song}
          content={currentContent}
          onClose={() => setPerformingIdx(null)}
          onNext={performingIdx < enriched.length - 1 ? () => setPerformingIdx((i) => (i ?? 0) + 1) : undefined}
          onPrev={performingIdx > 0 ? () => setPerformingIdx((i) => (i ?? 0) - 1) : undefined}
        />
      )}
    </div>
  )
}
