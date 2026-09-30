import type { GameField } from '../types/gameConfig'
import { TeamPicker } from './TeamPicker'

type Value = number | boolean | string

interface Props {
  field: GameField
  value: Value | undefined
  onChange: (value: Value) => void
}

const btn = 'select-none rounded-lg px-4 py-3 text-lg font-semibold active:scale-95 transition'

export function FieldRenderer({ field, value, onChange }: Props) {
  switch (field.type) {
    case 'counter': {
      const n = typeof value === 'number' ? value : 0
      const step = field.step ?? 1
      const min = field.min ?? 0
      const max = field.max ?? 999
      return (
        <div className="flex items-center gap-3">
          <button
            className={`${btn} bg-n27 text-fg`}
            onClick={() => onChange(Math.max(min, n - step))}
          >
            −
          </button>
          <span className="w-12 text-center text-2xl font-bold text-fg">{n}</span>
          <button
            className={`${btn} bg-acc text-on-acc`}
            onClick={() => onChange(Math.min(max, n + step))}
          >
            +
          </button>
        </div>
      )
    }

    case 'toggle': {
      const on = value === true
      return (
        <button
          className={`${btn} w-full ${on ? 'bg-grn text-on-grn' : 'bg-n27 text-n75'}`}
          onClick={() => onChange(!on)}
        >
          {on ? 'Sí' : 'No'}
        </button>
      )
    }

    case 'dropdown': {
      const current = typeof value === 'string' ? value : ''
      // ?? []: un config viejo persistido sin "options" no debe tumbar el render
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <button
              key={opt}
              className={`${btn} ${current === opt ? 'bg-acc text-on-acc' : 'bg-n27 text-n75'}`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )
    }

    case 'rating': {
      const max = field.max ?? 5
      const n = typeof value === 'number' ? value : 0
      return (
        <div className="flex gap-2">
          {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
            <button
              key={i}
              className={`${btn} h-12 w-12 !p-0 ${i <= n ? 'bg-acc text-on-acc' : 'bg-n27 text-n75'}`}
              onClick={() => onChange(i)}
            >
              {i}
            </button>
          ))}
        </div>
      )
    }

    case 'fieldMap': {
      const [x, y] = typeof value === 'string' && value ? value.split(',').map(Number) : [null, null]
      return (
        <div
          className="relative w-full max-w-sm cursor-crosshair overflow-hidden rounded-lg border border-n33"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const px = ((e.clientX - rect.left) / rect.width) * 100
            const py = ((e.clientY - rect.top) / rect.height) * 100
            onChange(`${px.toFixed(1)},${py.toFixed(1)}`)
          }}
        >
          <img src={field.imageUrl} alt={field.label} className="block w-full" draggable={false} />
          {x !== null && y !== null && (
            <div
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          )}
        </div>
      )
    }

    case 'text': {
      const s = typeof value === 'string' ? value : ''
      return (
        <textarea
          className="w-full rounded-lg border border-n33 bg-n215 p-3 text-fg"
          rows={3}
          value={s}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    }

    case 'tags': {
      const selected = typeof value === 'string' && value ? value.split(',').filter(Boolean) : []
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const on = selected.includes(opt)
            return (
              <button
                key={opt}
                className={`${btn} ${on ? 'bg-acc text-on-acc' : 'bg-n27 text-n75'}`}
                onClick={() => onChange((on ? selected.filter((o) => o !== opt) : [...selected, opt]).join(','))}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )
    }

    case 'number': {
      const s = typeof value === 'number' ? String(value) : ''
      return (
        <>
          <input
            type="number"
            inputMode="numeric"
            className="w-full rounded-lg border border-n33 bg-n215 p-3 text-lg text-fg"
            value={s}
            onChange={(e) => {
              const n = e.target.valueAsNumber
              onChange(Number.isFinite(n) ? n : '')
            }}
          />
          {field.suggestTeams && <TeamPicker value={s} onPick={(n) => onChange(Number(n))} />}
        </>
      )
    }
  }
}
