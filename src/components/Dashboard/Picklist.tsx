import { useEffect, useState } from 'react'
import type { TeamStat } from '../../lib/teamStats'

export function Picklist({ stats }: { stats: TeamStat[] }) {
  const [order, setOrder] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    setOrder((prev) => {
      const known = new Set(prev)
      const newTeams = stats.map((s) => s.teamNumber).filter((t) => !known.has(t))
      const stillPresent = prev.filter((t) => stats.some((s) => s.teamNumber === t))
      return [...stillPresent, ...newTeams]
    })
  }, [stats])

  const byTeam = new Map(stats.map((s) => [s.teamNumber, s]))

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDragIndex(null)
  }

  return (
    <ul className="space-y-2">
      {order.map((team, i) => {
        const stat = byTeam.get(team)
        return (
          <li
            key={team}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className="flex cursor-grab items-center justify-between rounded-lg bg-slate-800 p-3 active:cursor-grabbing"
          >
            <span className="flex items-center gap-3">
              <span className="w-6 text-right font-bold text-slate-500">{i + 1}</span>
              <span className="font-bold text-white">Equipo {team}</span>
            </span>
            {stat && (
              <span className="text-sm text-slate-400">
                prom. {stat.totalAvg.toFixed(1)} · {stat.matchesPlayed} partidos
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
