import { useEffect } from 'react'
import type { JournalPhoto } from '../api/journal'

interface PhotoViewerProps {
  photos: JournalPhoto[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export default function PhotoViewer({ photos, index, onIndexChange, onClose }: PhotoViewerProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight' && index < photos.length - 1) onIndexChange(index + 1)
      if (event.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photos.length, onClose, onIndexChange])

  const navButton = 'absolute top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex size-12 items-center justify-center rounded-full bg-black/50 text-2xl text-white"
        aria-label="Schließen"
      >
        ×
      </button>
      <img src={photos[index].url} alt="" className="max-h-full max-w-full object-contain" />
      {index > 0 && (
        <button type="button" onClick={() => onIndexChange(index - 1)} className={`${navButton} left-3`} aria-label="Vorheriges Foto">
          ‹
        </button>
      )}
      {index < photos.length - 1 && (
        <button type="button" onClick={() => onIndexChange(index + 1)} className={`${navButton} right-3`} aria-label="Nächstes Foto">
          ›
        </button>
      )}
      {photos.length > 1 && (
        <span className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] text-sm text-white/80">
          {index + 1} / {photos.length}
        </span>
      )}
    </div>
  )
}
