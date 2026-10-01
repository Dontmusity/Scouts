import { useState } from 'react'
import { Bars } from './Bars'

export interface ConsistencyEntry {
  teamNumber: string
  total: number
  byField: Record<string, number>
}

export interface ConsistencyOption {
  id: string
  label: string
}

/** Menor desviación = equipo más consistente en ese rubro. */
export function ConsistencyChart({ entries, options, us }: { entries: ConsistencyEntry[]; options: ConsistencyOption[]; us: string }) {
  const [fieldId, setFieldId] = useState<string>('total')

  const rows = entries
    .map((e) => ({ team: e.teamNumber, value: fieldId === 'total' ? e.total : (e.byField[fieldId] ?? 0) }))
    .sort((a, b) => a.value - b.value)

  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-n215 p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-col">
          <span className="text-lg font-bold">Consistencia</span>
          <span className="text-[13px] text-n75">Desviación estándar · menor = más consistente</span>
        </div>
        <select
          value={fieldId}
          onChange={(e) => setFieldId(e.target.value)}
          className="h-11 max-w-full rounded-[10px] border border-n33 bg-n19 px-2.5 font-semibold text-fg"
        >
          <option value="total">Puntos totales</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Bars rows={rows} us={us} decimals={1} />
    </section>
  )
}
