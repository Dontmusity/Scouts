import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { PredictorTeam } from './MatchPredictor'

export function TeamStatsChart({ teams }: { teams: PredictorTeam[] }) {
  const data = teams.slice(0, 12).map((t) => ({ team: t.teamNumber, promedio: Number(t.mean.toFixed(1)) }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--n27)" />
          <XAxis dataKey="team" stroke="var(--n60)" fontSize={12} />
          <YAxis stroke="var(--n60)" fontSize={12} />
          <Tooltip contentStyle={{ background: 'var(--n215)', border: 'none', color: 'var(--n97)' }} />
          <Bar dataKey="promedio" fill="var(--acc)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
