import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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
export function ConsistencyChart({ entries, options }: { entries: ConsistencyEntry[]; options: ConsistencyOption[] }) {
  const [fieldId, setFieldId] = useState<string>('total')

  const data = entries
    .map((e) => ({
      team: e.teamNumber,
      desviacion: Number((fieldId === 'total' ? e.total : (e.byField[fieldId] ?? 0)).toFixed(2)),
    }))
    .sort((a, b) => a.desviacion - b.desviacion)

  return (
    <div className="space-y-2">
      <select
        value={fieldId}
        onChange={(e) => setFieldId(e.target.value)}
        className="rounded-lg bg-n215 px-3 py-2 text-sm text-fg"
      >
        <option value="total">Puntaje total</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--n27)" />
            <XAxis dataKey="team" stroke="var(--n60)" fontSize={12} />
            <YAxis stroke="var(--n60)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--n215)', border: 'none', color: 'var(--n97)' }} />
            <Line type="monotone" dataKey="desviacion" stroke="var(--acc)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
