import { useEffect } from 'react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

// Kurze Bestätigung nach einer Schnell-Aktion mit „Rückgängig“ (verschwindet nach 6 s)
export default function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-heading px-4 py-3 text-sm text-bg shadow-lg"
    >
      <span>{message}</span>
      <button type="button" onClick={onUndo} className="min-h-10 font-semibold text-lime-300 dark:text-lime-800">
        Rückgängig
      </button>
    </div>
  )
}
