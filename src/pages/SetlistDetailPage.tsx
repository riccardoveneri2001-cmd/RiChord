import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconShare, IconDotsVertical,
  IconGripVertical, IconTrash, IconPlus, IconSearch, IconList,
  IconDownload,
} from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useSetlistStore, type SetlistSong } from '../store/useSetlistStore'
import { useLibraryStore, type Song } from '../store/useLibraryStore'
import { ShareModal } from '../components/share/ShareModal'
import { BottomSheet } from '../components/ui/BottomSheet'
import { usePullToRefreshBlock } from '../hooks/usePullToRefreshBlock'
import { downloadSetlistPdf, downloadSetlistZip } from '../lib/export'
import toast from 'react-hot-toast'

// ── Shared micro-styles ───────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
  background: '#FFFFFF', border: '0.5px solid #E0DED8',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#FFFFFF', borderRadius: 12,
      border: '0.5px solid #E0DED8', padding: '10px 12px',
    }}>
      <div style={{ width: 14, height: 14, borderRadius: 4, background: '#E8E6E1', flexShrink: 0 }} />
      <div style={{ width: 18, height: 12, borderRadius: 4, background: '#E8E6E1', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '55%', height: 13, borderRadius: 4, background: '#E8E6E1', marginBottom: 5 }} />
        <div style={{ width: '35%', height: 10, borderRadius: 4, background: '#F0EEEB' }} />
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SetlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setlists, fetchSetlistSongs, addSongToSetlist, removeSongFromSetlist, reorderSetlistSongs } = useSetlistStore()
  const { songs } = useLibraryStore()
  const setlist = setlists.find((s) => s.id === id)
  usePullToRefreshBlock()

  const [setlistSongs,    setSetlistSongs]    = useState<SetlistSong[]>([])
  const [loading,         setLoading]         = useState(true)
  const [addOpen,         setAddOpen]         = useState(false)
  const [shareOpen,       setShareOpen]       = useState(false)
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [search,          setSearch]          = useState('')
  const [focused,         setFocused]         = useState(false)
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set())
  const [addingMultiple,  setAddingMultiple]  = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) {
      setLoading(true)
      fetchSetlistSongs(id).then((list) => {
        setSetlistSongs(list)
        setLoading(false)
      })
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Enrich with song data
  const enriched = setlistSongs.map((ss) => ({
    ...ss,
    song: songs.find((s) => s.id === ss.song_id),
  }))

  // Songs available to add (not already in setlist)
  const alreadyAdded = new Set(setlistSongs.map((ss) => ss.song_id))
  const filteredSongs = songs.filter(
    (s) =>
      !alreadyAdded.has(s.id) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.artist?.toLowerCase() ?? '').includes(search.toLowerCase())),
  )

  // Songs for export (only present chordpro songs)
  const chordproSongs = enriched
    .map((e) => e.song)
    .filter((s): s is Song => s != null && s.type === 'chordpro')

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const items = Array.from(setlistSongs)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setSetlistSongs(items)
    await reorderSetlistSongs(id!, items)
  }

  function toggleSong(songId: string) {
    setSelectedSongIds((prev) => {
      const next = new Set(prev)
      if (next.has(songId)) next.delete(songId)
      else next.add(songId)
      return next
    })
  }

  async function handleAddSelected() {
    if (selectedSongIds.size === 0 || addingMultiple) return
    setAddingMultiple(true)
    try {
      const toAdd = songs.filter((s) => selectedSongIds.has(s.id))
      let pos = setlistSongs.length
      for (const song of toAdd) {
        await addSongToSetlist(id!, song.id, pos++)
      }
      const updated = await fetchSetlistSongs(id!)
      setSetlistSongs(updated)
    } finally {
      setAddingMultiple(false)
    }
    handleCloseAdd()
  }

  async function handleRemove(ssId: string) {
    await removeSongFromSetlist(ssId)
    setSetlistSongs((prev) => prev.filter((s) => s.id !== ssId))
  }

  function openAdd() { setSearch(''); setSelectedSongIds(new Set()); setAddOpen(true) }
  function handleCloseAdd() { setAddOpen(false); setSearch(''); setSelectedSongIds(new Set()) }

  function handleOpenSong(index: number) {
    const item = enriched[index]
    if (!item.song) return
    navigate(`/song/${item.song.id}`, {
      state: {
        setlistId: id!,
        setlistName: setlist!.name,
        songIds: setlistSongs.map((s) => s.song_id),
        currentIndex: index,
      },
    })
  }

  async function handleExportPdf() {
    setMenuOpen(false)
    if (chordproSongs.length === 0) { toast('Nessun brano ChordPro da esportare', { duration: 2500 }); return }
    toast('Generazione PDF…', { duration: 2000 })
    await downloadSetlistPdf(chordproSongs, setlist!.name)
  }

  async function handleExportZip() {
    setMenuOpen(false)
    if (chordproSongs.length === 0) { toast('Nessun brano ChordPro da esportare', { duration: 2500 }); return }
    toast('Generazione ZIP…', { duration: 2000 })
    await downloadSetlistZip(chordproSongs, setlist!.name)
  }

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

  const addBtnLabel = selectedSongIds.size === 0
    ? 'Seleziona brani'
    : selectedSongIds.size === 1
      ? 'Aggiungi 1 brano'
      : `Aggiungi ${selectedSongIds.size} brani`

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* Menu backdrop */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setMenuOpen(false)} />
      )}

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

        {/* Three-dot export menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
            style={iconBtn}
            aria-label="Altro"
          >
            <IconDotsVertical size={17} style={{ color: '#1C2333' }} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute', top: 38, right: 0, zIndex: 100,
                background: '#FFFFFF', borderRadius: 12,
                border: '0.5px solid #E0DED8',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 210, overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleExportPdf}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: 'none', border: 'none', borderBottom: '0.5px solid #F0EEEB', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
              >
                <IconDownload size={16} style={{ color: '#2176AE' }} />
                <span style={{ fontSize: 14, color: '#1C2333' }}>Esporta setlist come PDF</span>
              </button>
              <button
                onClick={handleExportZip}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
              >
                <IconDownload size={16} style={{ color: '#2176AE' }} />
                <span style={{ fontSize: 14, color: '#1C2333' }}>Esporta setlist come ZIP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {setlist.description && (
        <div style={{ padding: '10px 16px', background: '#FFFFFF', borderBottom: '0.5px solid #E0DED8' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#8A94A6', lineHeight: 1.5 }}>{setlist.description}</p>
        </div>
      )}

      {/* Song count */}
      {!loading && (
        <div style={{ padding: '10px 16px 4px' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {enriched.length} {enriched.length === 1 ? 'brano' : 'brani'}
          </p>
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && (
        <div style={{ padding: '8px 16px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      )}

      {/* Empty state — only after loading completes */}
      {!loading && enriched.length === 0 && (
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
              background: '#2176AE', color: '#FFFFFF',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <IconPlus size={16} /> Aggiungi brano
          </button>
        </div>
      )}

      {/* Draggable list */}
      {!loading && enriched.length > 0 && (
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
                          onClick={() => item.song && handleOpenSong(index)}
                          style={{
                            ...drag.draggableProps.style,
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: '#FFFFFF',
                            borderRadius: 12,
                            border: '0.5px solid #E0DED8',
                            padding: '10px 12px',
                            cursor: item.song ? 'pointer' : 'default',
                            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
                            transform: snapshot.isDragging
                              ? `${drag.draggableProps.style?.transform} scale(1.02)`
                              : drag.draggableProps.style?.transform,
                          }}
                        >
                          {/* Grip handle */}
                          <div
                            {...drag.dragHandleProps}
                            onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => { e.stopPropagation(); handleRemove(item.id) }}
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

      {/* Add songs BottomSheet — multi-select */}
      <BottomSheet open={addOpen} onClose={handleCloseAdd}>
        <div style={{ padding: '0 16px 32px' }}>

          {/* Header: count + add button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{
              margin: 0, fontSize: 13, fontWeight: 600, color: '#8A94A6',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Aggiungi brani
            </p>
            <button
              onClick={handleAddSelected}
              disabled={selectedSongIds.size === 0 || addingMultiple}
              style={{
                padding: '7px 14px', borderRadius: 10, border: 'none',
                background: selectedSongIds.size > 0 ? '#2176AE' : '#C8CDD8',
                color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                cursor: selectedSongIds.size > 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'background 0.15s',
                minWidth: 120,
              }}
            >
              {addingMultiple ? '…' : addBtnLabel}
            </button>
          </div>

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

          {/* Song list with checkboxes */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filteredSongs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 14, color: '#8A94A6' }}>
                {search ? 'Nessun brano trovato' : 'Tutti i brani sono già in questa setlist'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredSongs.map((song) => {
                  const checked = selectedSongIds.has(song.id)
                  return (
                    <button
                      key={song.id}
                      onClick={() => toggleSong(song.id)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10,
                        background: checked ? '#F0F7FF' : 'none', border: 'none',
                        textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                        border: `1.5px solid ${checked ? '#2176AE' : '#C8CDD8'}`,
                        background: checked ? '#2176AE' : '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.1s, border-color 0.1s',
                      }}>
                        {checked && (
                          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      {/* Song info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</p>
                        {song.artist && (
                          <p style={{ margin: '1px 0 0', fontSize: 13, color: '#8A94A6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Share modal */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} type="setlist" resourceId={id!} />
    </div>
  )
}
