import { CheckCircleIcon, CheckIcon, CircleIcon, PlusIcon, StarIcon } from '@phosphor-icons/react'
import type { GameField } from '../types/gameConfig'
import { TeamPicker } from './TeamPicker'

type Value = number | boolean | string

interface Props {
  field: GameField
  value: Value | undefined
  onChange: (value: Value) => void
}

/** Estilo de opción seleccionable (opción única y etiquetas), igual que sel() del handoff. */
const sel = (on: boolean) => (on ? 'border-acc bg-acc text-on-acc' : 'border-n33 bg-transparent text-fg')

const input = 'w-full rounded-xl border border-n33 bg-n19 text-fg focus:outline-2 focus:outline-offset-1 focus:outline-acc'

const tagsOf = (value: Value | undefined) => (typeof value === 'string' && value ? value.split(',').filter(Boolean) : [])

/** Texto a la derecha del título de la tarjeta del campo. */
export function fieldHint(field: GameField, value: Value | undefined): string {
  if (field.type === 'rating') return typeof value === 'number' && value > 0 ? `${value} / ${field.max ?? 5}` : 'Sin calificar'
  if (field.type === 'tags') {
    const n = tagsOf(value).length
    return n ? `${n} elegidas` : ''
  }
  return ''
}

/** Campos que ocupan todo el ancho de la cuadrícula del formulario. */
export const isWideField = (field: GameField) => field.type === 'fieldMap' || field.type === 'text' || field.type === 'tags'

export function FieldRenderer({ field, value, onChange }: Props) {
  switch (field.type) {
    case 'counter': {
      const n = typeof value === 'number' ? value : 0
      const step = field.step ?? 1
      const min = field.min ?? 0
      const max = field.max ?? 999
      return (
        <div className="grid grid-cols-[64px_minmax(0,1fr)_96px] gap-2">
          <button
            aria-label="Restar"
            className="h-16 select-none rounded-xl bg-n27 text-[30px] font-medium text-fg active:bg-n33"
            onClick={() => onChange(Math.max(min, n - step))}
          >
            −
          </button>
          <div className="flex items-center justify-center font-mono text-[34px] font-bold">{n}</div>
          <button
            aria-label="Sumar"
            className="h-16 select-none rounded-xl bg-acc text-[34px] font-semibold text-on-acc active:brightness-90"
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
          className={`flex h-[60px] w-full select-none items-center justify-center gap-2.5 rounded-xl border text-lg font-bold ${on ? 'border-grn bg-grn text-on-grn' : 'border-n27 bg-n27 text-fg'}`}
          onClick={() => onChange(!on)}
        >
          {on ? <CheckCircleIcon size={24} weight="fill" /> : <CircleIcon size={24} />}
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
              className={`min-h-[52px] flex-[1_1_90px] select-none rounded-xl border px-3 text-[15px] font-bold ${sel(current === opt)}`}
              onClick={() => onChange(current === opt ? '' : opt)}
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
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}>
          {Array.from({ length: max }, (_, i) => i + 1).map((i) => {
            const on = i <= n
            return (
              <button
                key={i}
                aria-label={String(i)}
                className={`flex h-14 select-none flex-col items-center justify-center gap-0.5 rounded-[10px] ${on ? 'bg-acc text-on-acc' : 'bg-n27 text-n75'}`}
                onClick={() => onChange(n === i ? 0 : i)}
              >
                <StarIcon size={20} weight={on ? 'fill' : 'regular'} />
                <span className="font-mono text-[11px] font-bold">{i}</span>
              </button>
            )
          })}
        </div>
      )
    }

    case 'fieldMap': {
      const [x, y] = typeof value === 'string' && value ? value.split(',').map(Number) : [null, null]
      return (
        <>
          <div
            className="relative w-full cursor-crosshair overflow-hidden rounded-xl bg-n24"
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
                className="pointer-events-none absolute -ml-3.5 -mt-3.5 h-7 w-7 rounded-full bg-acc shadow-[0_0_0_6px_color-mix(in_oklch,var(--acc)_30%,transparent)]"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[13px] text-n75">
            <span>{x !== null && y !== null ? `Marcado en ${Math.round(x)}%, ${Math.round(y)}%` : 'Sin marcar'}</span>
            <button className="min-h-11 rounded-[10px] px-3 font-semibold" onClick={() => onChange('')}>
              Borrar punto
            </button>
          </div>
        </>
      )
    }

    case 'text': {
      const s = typeof value === 'string' ? value : ''
      return (
        <textarea
          className={`${input} resize-y p-3 text-base`}
          rows={3}
          placeholder="Qué viste, qué falló, algo para el estratega…"
          value={s}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    }

    case 'tags': {
      const selected = tagsOf(value)
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const on = selected.includes(opt)
            return (
              <button
                key={opt}
                className={`flex min-h-11 select-none items-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold ${sel(on)}`}
                onClick={() => onChange((on ? selected.filter((o) => o !== opt) : [...selected, opt]).join(','))}
              >
                {on ? <CheckIcon size={16} weight="bold" /> : <PlusIcon size={16} />}
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
            placeholder="0"
            className={`${input} h-[60px] px-3.5 font-mono text-[26px] font-bold`}
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
