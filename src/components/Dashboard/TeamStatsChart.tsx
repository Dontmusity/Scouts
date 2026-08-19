import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { TeamStat } from '../../lib/teamStats'

export function TeamStatsChart({ stats }: { stats: TeamStat[] }) {
  const data = stats.slice(0, 12).map((s) => ({ team: s.teamNumber, promedio: Number(s.totalAvg.toFixed(1)) }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="team" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', color: 'white' }} />
          <Bar dataKey="promedio" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
