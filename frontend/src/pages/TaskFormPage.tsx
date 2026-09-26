import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { formatDate, todayIso } from '../api/plants'
import { completeTask, reopenTask, type GardenTask, type TaskInput } from '../api/tasks'
import type { Area } from '../api/types'
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../components/styles'

const intervalPresets = [
  { days: 2, label: '2 Tage' },
  { days: 7, label: 'Woche' },
  { days: 14, label: '2 Wochen' },
  { days: 30, label: 'Monat' },
]

export default function TaskFormPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()

  const [task, setTask] = useState<GardenTask | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(todayIso())
  const [recurring, setRecurring] = useState(false)
  const [intervalText, setIntervalText] = useState('7')
  const [areaId, setAreaId] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Area[]>('/api/flaechen').then(setAreas).catch(() => setAreas([]))
    if (isNew) return
    api<GardenTask>(`/api/aufgaben/${id}`)
      .then((loaded) => {
        setTask(loaded)
        setTitle(loaded.title)
        setDueDate(loaded.dueDate)
        setRecurring(loaded.intervalDays !== null)
        setIntervalText(String(loaded.intervalDays ?? 7))
        setAreaId(loaded.areaId ?? '')
        setDescription(loaded.description ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Aufgabe nicht gefunden'))
  }, [id, isNew])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const intervalDays = recurring ? Number(intervalText) : null
    if (recurring && (!Number.isInteger(intervalDays) || intervalDays! < 1 || intervalDays! > 365)) {
      setError('Intervall bitte als Anzahl Tage (1–365) angeben.')
      return
    }
    setSaving(true)
    setError(null)
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim() || null,
      dueDate,
      intervalDays,
      areaId: areaId || null,
    }
    try {
      await api<GardenTask>(isNew ? '/api/aufgaben' : `/api/aufgaben/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(input),
      })
      navigate('/aufgaben')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
      setSaving(false)
    }
  }

  async function toggleDone() {
    if (!task) return
    try {
      setTask(task.doneAt ? await reopenTask(task.id) : await completeTask(task.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlgeschlagen')
    }
  }

  async function remove() {
    if (!task) return
    const automatic = task.source !== 'manuell'
    if (!confirm(automatic ? 'Diese automatische Aufgabe verwerfen? Sie wird nicht neu angelegt.' : 'Aufgabe löschen?')) return
    try {
      await api(`/api/aufgaben/${task.id}`, { method: 'DELETE' })
      navigate('/aufgaben', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  if (!isNew && !task) return <p className="text-sm">{error ?? 'Lädt …'}</p>

  const chip = (active: boolean) =>
    `min-h-10 rounded-full border px-4 text-sm ${active ? 'border-accent bg-accent-light font-medium text-heading' : 'border-border bg-surface'}`

  return (
    <section>
      <Link to="/aufgaben" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
        ‹ Aufgaben
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-heading">{isNew ? 'Neue Aufgabe' : 'Aufgabe'}</h1>
      {task && task.source !== 'manuell' && (
        <p className="mb-3 text-xs">Automatisch von Gartengeist angelegt{task.plantName ? ` für ${task.plantName}` : ''}.</p>
      )}
      {task?.doneAt && (
        <p className="mb-3 rounded-xl bg-accent-light px-4 py-2 text-sm text-heading">
          ✓ Erledigt {task.doneBy ? `von ${task.doneBy.name.split(' ')[0]} ` : ''}am{' '}
          {formatDate(task.doneAt.slice(0, 10))}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className={labelClass}>
            Was ist zu tun?
          </label>
          <input
            id="title"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Tomaten ausgeizen"
            required
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="due" className={labelClass}>
            Fällig am
          </label>
          <input id="due" type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </div>

        <div>
          <span className={labelClass}>Wiederholen</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(!recurring)} onClick={() => setRecurring(false)}>
              Einmalig
            </button>
            {intervalPresets.map((p) => (
              <button
                key={p.days}
                type="button"
                className={chip(recurring && intervalText === String(p.days))}
                onClick={() => {
                  setRecurring(true)
                  setIntervalText(String(p.days))
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {recurring && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              alle
              <input
                className={`${inputClass} w-20`}
                inputMode="numeric"
                value={intervalText}
                onChange={(e) => setIntervalText(e.target.value)}
                aria-label="Intervall in Tagen"
              />
              Tage – ab dem Tag, an dem sie erledigt wird
            </div>
          )}
        </div>

        <div>
          <label htmlFor="area" className={labelClass}>
            Fläche <span className="font-normal text-text">(optional)</span>
          </label>
          <select id="area" className={inputClass} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Ganzer Garten</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Details <span className="font-normal text-text">(optional)</span>
          </label>
          <textarea
            id="description"
            className={`${inputClass} min-h-24 py-3`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Speichert …' : isNew ? 'Anlegen' : 'Speichern'}
        </button>
      </form>

      {task && (
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" onClick={toggleDone} className={secondaryButtonClass}>
            {task.doneAt ? 'Wieder öffnen' : '✓ Erledigt'}
          </button>
          <button type="button" onClick={remove} className="min-h-11 text-sm text-danger">
            {task.source !== 'manuell' ? 'Aufgabe verwerfen' : 'Aufgabe löschen'}
          </button>
        </div>
      )}
    </section>
  )
}
