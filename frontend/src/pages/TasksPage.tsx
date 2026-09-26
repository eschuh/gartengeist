import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatDate, todayIso } from '../api/plants'
import { completeTask, reopenTask, type GardenTask, type PreCultivationPlan } from '../api/tasks'
import TaskRow from '../components/TaskRow'
import TasksTabs from '../components/TasksTabs'
import UndoToast from '../components/UndoToast'
import WateringDue from '../components/WateringDue'
import { primaryButtonClass } from '../components/styles'

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export default function TasksPage() {
  const [open, setOpen] = useState<GardenTask[] | null>(null)
  const [done, setDone] = useState<GardenTask[] | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [showLater, setShowLater] = useState(false)
  const [plan, setPlan] = useState<PreCultivationPlan[]>([])
  const [undo, setUndo] = useState<{ message: string; id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api<GardenTask[]>('/api/aufgaben')
      .then(setOpen)
      .catch((err) => setError(err instanceof Error ? err.message : 'Aufgaben konnten nicht geladen werden'))
    if (showDone) api<GardenTask[]>('/api/aufgaben?status=erledigt').then(setDone).catch(() => setDone([]))
  }, [showDone])

  useEffect(load, [load])

  useEffect(() => {
    api<PreCultivationPlan[]>('/api/aufgaben/voranzucht-plan')
      .then(setPlan)
      .catch(() => setPlan([]))
  }, [])

  const dismissUndo = useCallback(() => setUndo(null), [])

  async function toggle(task: GardenTask) {
    try {
      if (task.doneAt) {
        await reopenTask(task.id)
      } else {
        await completeTask(task.id)
        setUndo({ message: `✓ ${task.title}`, id: task.id })
      }
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlgeschlagen')
    }
  }

  async function undoComplete() {
    if (!undo) return
    const id = undo.id
    setUndo(null)
    await reopenTask(id).catch(() => undefined)
    load()
  }

  const today = todayIso()
  const weekEnd = addDaysIso(today, 7)
  const overdue = open?.filter((t) => t.dueDate < today) ?? []
  const dueToday = open?.filter((t) => t.dueDate === today) ?? []
  const thisWeek = open?.filter((t) => t.dueDate > today && t.dueDate <= weekEnd) ?? []
  const later = open?.filter((t) => t.dueDate > weekEnd) ?? []
  const upcomingPlan = plan.filter((p) => !p.taskCreated)

  const section = (title: string, tasks: GardenTask[], opts: { overdue?: boolean; showDate?: boolean } = {}) =>
    tasks.length > 0 && (
      <div>
        <h2 className={`mb-2 text-sm font-semibold ${opts.overdue ? 'text-danger' : 'text-heading'}`}>{title}</h2>
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={toggle} overdue={opts.overdue} showDate={opts.showDate} />
          ))}
        </div>
      </div>
    )

  return (
    <section>
      <TasksTabs />
      <div className="flex flex-col gap-5">
        <WateringDue />

        {error && <p className="text-sm text-danger">{error}</p>}
        {open === null && !error && <p className="text-sm">Lädt …</p>}
        {open?.length === 0 && <p className="text-sm">Keine offenen Aufgaben. 🌿</p>}

        {section('Überfällig', overdue, { overdue: true })}
        {section('Heute', dueToday, { showDate: false })}
        {section('Nächste 7 Tage', thisWeek)}

        {later.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowLater((v) => !v)} className="mb-2 min-h-11 text-sm font-semibold text-heading">
              Später ({later.length}) {showLater ? '▴' : '▾'}
            </button>
            {showLater && (
              <div className="flex flex-col gap-2">
                {later.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggle} />
                ))}
              </div>
            )}
          </div>
        )}

        <Link to="/aufgaben/neu" className={`${primaryButtonClass} flex items-center justify-center`}>
          + Aufgabe
        </Link>

        <div>
          <button type="button" onClick={() => setShowDone((v) => !v)} className="min-h-11 text-sm text-accent">
            {showDone ? 'Erledigte ausblenden' : 'Erledigt (letzte 14 Tage) anzeigen'}
          </button>
          {showDone && done && (
            <div className="mt-2 flex flex-col gap-2">
              {done.length === 0 && <p className="text-sm">Nichts erledigt in den letzten 14 Tagen.</p>}
              {done.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={toggle} />
              ))}
            </div>
          )}
        </div>

        {upcomingPlan.length > 0 && (
          <div className="rounded-2xl border border-border p-4">
            <h2 className="font-semibold text-heading">🌱 Voranzucht {upcomingPlan[0].sowDate.slice(0, 4)}</h2>
            <p className="mb-3 mt-1 text-xs">
              Berechnet aus euren Kulturen und den Frostdaten eures Standorts. Die Aufgaben erscheinen automatisch drei
              Wochen vorher.
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {upcomingPlan.map((p) => (
                <li key={p.plantId} className="flex justify-between gap-3">
                  <Link to={`/garten/katalog/${p.plantId}`} className="font-medium text-heading">
                    {p.plantName}
                  </Link>
                  <span>
                    säen ab {formatDate(p.sowDate)} · pflanzen {formatDate(p.plantOutDate)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {undo && <UndoToast message={undo.message} onUndo={undoComplete} onDismiss={dismissUndo} />}
    </section>
  )
}
