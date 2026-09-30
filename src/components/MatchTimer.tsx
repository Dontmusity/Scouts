import { useEffect, useState } from 'react'
import { ArrowCounterClockwiseIcon, PlayIcon } from '@phosphor-icons/react'
import type { GameConfig, GameField } from '../types/gameConfig'

/**
 * Segundos de cada periodo. FTC BIOBUZZ (manual TU02 §10.1): 30 auto + 8 transición + 2:00 teleop, y las
 * FLOWERS se abren en el último minuto → endgame de 60 s. FRC: valores del handoff, pendientes de confirmar.
 */
const TIMING: Record<GameConfig['mode'], { auto: number; transition: number; teleop: number; endgame: number }> = {
  FRC: { auto: 20, transition: 3, teleop: 140, endgame: 30 },
  FTC: { auto: 30, transition: 8, teleop: 120, endgame: 60 },
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** Cronómetro opcional del partido; avisa el cambio de fase (auto → teleop → endgame) para saltar de pestaña. */
export function MatchTimer({ mode, onPhase }: { mode: GameConfig['mode']; onPhase: (p: GameField['phase']) => void }) {
  const T = TIMING[mode]
  const total = T.auto + T.transition + T.teleop
  const [start, setStart] = useState<number | null>(null)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (start === null) return
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [start])

  const elapsed = start === null ? 0 : Math.min(total, (now - start) / 1000)
  const phase: GameField['phase'] = elapsed < T.auto + T.transition ? 'auto' : elapsed < total - T.endgame ? 'teleop' : 'endgame'

  // Solo al cruzar de periodo, para no pelear con el scout si cambia de pestaña a mano
  useEffect(() => {
    if (start !== null) onPhase(phase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, start])

  useEffect(() => {
    if (start !== null && elapsed >= total) setStart(null)
  }, [elapsed, total, start])

  if (start === null)
    return (
      <div className="rounded-[14px] bg-n215 px-4 py-3.5">
        <button
          className="flex min-h-[52px] items-center gap-3 text-left"
          onClick={() => {
            setNow(Date.now())
            setStart(Date.now())
          }}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-acc text-on-acc">
            <PlayIcon size={22} weight="fill" />
          </span>
          <span className="flex flex-col">
            <span className="font-bold">Iniciar cronómetro</span>
            <span className="text-[13px] text-n75">
              {T.auto} s auto · {T.transition} s transición · {fmt(T.teleop)} teleop. Cambia de fase solo.
            </span>
          </span>
        </button>
      </div>
    )

  const label =
    elapsed < T.auto ? 'Autónomo' : elapsed < T.auto + T.transition ? 'Transición' : phase === 'endgame' ? 'TeleOp · Endgame' : 'TeleOp'
  const remaining = elapsed < T.auto ? T.auto - elapsed : elapsed < T.auto + T.transition ? T.auto + T.transition - elapsed : total - elapsed
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] bg-n215 px-4 py-3.5">
      <div className="flex items-center gap-3.5">
        <span className="font-mono text-[34px] font-bold leading-none">{fmt(Math.ceil(remaining))}</span>
        <span className="flex flex-1 flex-col">
          <span className="text-[15px] font-bold">{label}</span>
          <span className="text-xs text-n75">Transcurrido {fmt(elapsed)}</span>
        </span>
        <button aria-label="Reiniciar" className="flex h-12 w-12 items-center justify-center rounded-xl bg-n27" onClick={() => setStart(null)}>
          <ArrowCounterClockwiseIcon size={22} weight="duotone" />
        </button>
      </div>
      <div className="relative flex h-2 gap-0.5 overflow-hidden rounded-full bg-n27">
        <div className="bg-n33" style={{ width: pct(T.auto) }} />
        <div className="bg-n24" style={{ width: pct(T.transition) }} />
        <div className="flex-1 bg-n33" />
        <div className="absolute inset-y-0 left-0 bg-acc" style={{ width: pct(elapsed) }} />
      </div>
    </div>
  )
}
