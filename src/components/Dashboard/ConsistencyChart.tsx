import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { TeamStat } from '../../lib/teamStats'
import { numericFieldsOf } from '../../lib/teamStats'
import type { GameField } from '../../types/gameConfig'

/** Menor desviación = equipo más consistente en ese rubro. */
export function ConsistencyChart({ stats, fields }: { stats: TeamStat[]; fields: GameField[] }) {
  const [fieldId, setFieldId] = useState<string>('total')
  const options = numericFieldsOf(fields)

  const data = stats
    .map((s) => ({
      team: s.teamNumber,
      desviacion: Number((fieldId === 'total' ? s.stdDev : (s.stdDevByField[fieldId] ?? 0)).toFixed(2)),
    }))
    .sort((a, b) => a.desviacion - b.desviacion)

  return (
    <div className="space-y-2">
      <select
        value={fieldId}
        onChange={(e) => setFieldId(e.target.value)}
        className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
      >
        <option value="total">Puntaje total</option>
        {options.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="team" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: 'white' }} />
            <Line type="monotone" dataKey="desviacion" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
