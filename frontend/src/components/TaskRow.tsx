import { Link } from 'react-router-dom'
import { formatDate } from '../api/plants'
import { taskCategoryIcons, type GardenTask } from '../api/tasks'
import UserAvatar from './UserAvatar'

interface TaskRowProps {
  task: GardenTask
  onToggle: (task: GardenTask) => void
  overdue?: boolean
  showDate?: boolean
}

// Aufgabe mit großem Abhak-Feld (1 Tap). Antippen des Textes öffnet die Details.
export default function TaskRow({ task, onToggle, overdue = false, showDate = true }: TaskRowProps) {
  const done = task.doneAt !== null
  const meta = [
    showDate && !done && formatDate(task.dueDate),
    task.areaName,
    task.intervalDays && `alle ${task.intervalDays} Tage`,
  ].filter(Boolean)

  return (
    <div className="flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface pr-3">
      <button
        type="button"
        onClick={() => onToggle(task)}
        className="flex size-14 shrink-0 items-center justify-center"
        aria-label={done ? `${task.title} wieder öffnen` : `${task.title} erledigen`}
      >
        <span
          className={`flex size-7 items-center justify-center rounded-lg border-2 text-sm font-bold ${
            done ? 'border-accent bg-accent text-white dark:text-black' : 'border-border'
          }`}
        >
          {done && '✓'}
        </span>
      </button>
      <Link to={`/aufgaben/${task.id}`} className="min-w-0 flex-1 py-2">
        <span className={`block font-medium ${done ? 'text-text line-through' : 'text-heading'}`}>
          {task.category !== 'allgemein' && <span aria-hidden="true">{taskCategoryIcons[task.category]} </span>}
          {task.title}
        </span>
        {meta.length > 0 && (
          <span className={`block text-xs ${overdue ? 'font-medium text-danger' : ''}`}>{meta.join(' · ')}</span>
        )}
      </Link>
      {done && task.doneBy && <UserAvatar user={task.doneBy} size={22} />}
    </div>
  )
}
