import { useEffect, useState } from 'react'
import type { TeamStat } from '../../lib/teamStats'
import { usePicklistStore } from '../../store/usePicklistStore'

export function Picklist({ stats }: { stats: TeamStat[] }) {
  const { order, setOrder } = usePicklistStore()
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    const known = new Set(order)
    const newTeams = stats.map((s) => s.teamNumber).filter((t) => !known.has(t))
    const stillPresent = order.filter((t) => stats.some((s) => s.teamNumber === t))
    const next = [...stillPresent, ...newTeams]
    if (next.length !== order.length || next.some((t, i) => t !== order[i])) setOrder(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reconciliar cuando cambian los equipos, no en cada reorden manual
  }, [stats])

  const byTeam = new Map(stats.map((s) => [s.teamNumber, s]))

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    const next = [...order]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setOrder(next)
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
