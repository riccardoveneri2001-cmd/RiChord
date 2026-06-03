import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Search, GripVertical, Trash2, Maximize2, Share2 } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { useSetlistStore, type SetlistSong } from '../store/useSetlistStore'
import { useLibraryStore } from '../store/useLibraryStore'
import { PerformingMode } from '../components/song/PerformingMode'
import { ShareModal } from '../components/share/ShareModal'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { transposeChordPro } from '../lib/chordpro'

export function SetlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setlists, fetchSetlistSongs, addSongToSetlist, removeSongFromSetlist, reorderSetlistSongs } = useSetlistStore()
  const { songs } = useLibraryStore()
  const setlist = setlists.find((s) => s.id === id)

  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [performingIdx, setPerformingIdx] = useState<number | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSetlistSongs(id).then(setSetlistSongs)
    }
  }, [id])

  const enriched = setlistSongs.map((ss) => ({
    ...ss,
    song: songs.find((s) => s.id === ss.song_id),
  }))

  const filteredSongs = songs.filter(
    (s) => s.type === 'chordpro' &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
       (s.artist?.toLowerCase() ?? '').includes(search.toLowerCase()))
  )

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(setlistSongs)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setSetlistSongs(items)
    await reorderSetlistSongs(id!, items)
  }

  const handleAddSong = async (songId: string) => {
    await addSongToSetlist(id!, songId, setlistSongs.length)
    const updated = await fetchSetlistSongs(id!)
    setSetlistSongs(updated)
    setAddOpen(false)
    setSearch('')
  }

  const handleRemove = async (ssId: string) => {
    await removeSongFromSetlist(ssId)
    setSetlistSongs((prev) => prev.filter((s) => s.id !== ssId))
  }

  const currentPerforming = performingIdx !== null ? enriched[performingIdx] : null
  const currentContent = currentPerforming?.song?.content
    ? transposeChordPro(currentPerforming.song.content, 0)
    : ''

  if (!setlist) return (
    <PageWrapper>
      <button onClick={() => navigate('/setlists')} className="flex items-center gap-2 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors font-jakarta text-sm mb-4">
        <ArrowLeft size={18} /> Setlist
      </button>
      <p className="text-secondary font-jakarta">Setlist non trovata</p>
    </PageWrapper>
  )

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button onClick={() => navigate('/setlists')} className="flex items-center gap-2 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors font-jakarta text-sm">
          <ArrowLeft size={18} /> Setlist
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShareOpen(true)} className="p-2 rounded-xl text-secondary hover:text-blue-accent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Share2 size={18} />
          </button>
          {enriched.length > 0 && (
            <Button size="sm" onClick={() => setPerformingIdx(0)}>
              <Maximize2 size={14} /> Esegui
            </Button>
          )}
        </div>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-display text-primary-light dark:text-primary-dark">{setlist.name}</h1>
        {setlist.event_date && (
          <p className="text-sm text-secondary font-jakarta mt-0.5">
            {new Date(setlist.event_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        {setlist.description && (
          <p className="text-sm text-secondary font-jakarta mt-1">{setlist.description}</p>
        )}
      </div>

      {/* Songs list */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="setlist-songs">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 mb-4">
              {enriched.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`bg-white dark:bg-night-surface rounded-xl border border-border-light dark:border-border-dark flex items-center gap-3 p-3 transition-all ${
                        snapshot.isDragging ? 'shadow-lg scale-[1.02]' : ''
                      }`}
                    >
                      <div {...drag.dragHandleProps} className="text-secondary cursor-grab active:cursor-grabbing p-1">
                        <GripVertical size={16} />
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center text-xs text-secondary font-jakarta shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark truncate">
                          {item.song?.title ?? 'Brano eliminato'}
                        </p>
                        {item.song?.artist && (
                          <p className="text-xs text-secondary font-jakarta truncate">{item.song.artist}</p>
                        )}
                      </div>
                      {item.custom_key && (
                        <span className="text-xs font-mono text-blue-accent bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md shrink-0">
                          {item.custom_key}
                        </span>
                      )}
                      <button onClick={() => handleRemove(item.id)} className="p-1.5 text-secondary hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 shrink-0">
                        <Trash2 size={14} />
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

      <Button variant="secondary" onClick={() => setAddOpen(true)} className="w-full">
        <Plus size={15} /> Aggiungi brano
      </Button>

      {/* Add song modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setSearch('') }} title="Aggiungi brano">
        <div className="space-y-3">
          <Input
            placeholder="Cerca brano…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredSongs.length === 0 ? (
              <p className="text-sm text-secondary font-jakarta text-center py-4">Nessun brano trovato</p>
            ) : (
              filteredSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleAddSong(song.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <p className="text-sm font-jakarta font-medium text-primary-light dark:text-primary-dark">{song.title}</p>
                  {song.artist && <p className="text-xs text-secondary font-jakarta">{song.artist}</p>}
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

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

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} type="setlist" resourceId={id!} />
    </PageWrapper>
  )
}
