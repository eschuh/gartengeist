interface HouseholdSizeInputProps {
  value: number
  onChange: (value: number) => void
}

const stepButtonClass =
  'flex size-14 items-center justify-center rounded-full border border-border bg-surface text-2xl text-heading disabled:opacity-40'

export default function HouseholdSizeInput({ value, onChange }: HouseholdSizeInputProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Weniger Personen"
      >
        −
      </button>
      <div className="w-24 text-center">
        <span className="block text-4xl font-semibold text-heading">{value}</span>
        <span className="text-sm">{value === 1 ? 'Person' : 'Personen'}</span>
      </div>
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => onChange(value + 1)}
        disabled={value >= 20}
        aria-label="Mehr Personen"
      >
        +
      </button>
    </div>
  )
}
