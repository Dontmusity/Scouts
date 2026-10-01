/** Barras horizontales del handoff: número de equipo · barra · valor. Nuestro equipo va en color de acento. */
export function Bars({ rows, us, decimals = 0 }: { rows: { team: string; value: number }[]; us: string; decimals?: number }) {
  const max = Math.max(...rows.map((r) => r.value), 0) || 1
  return (
    <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto">
      {rows.map((r) => (
        <div key={r.team} className="grid grid-cols-[64px_minmax(0,1fr)_44px] items-center gap-2.5">
          <span className="font-mono text-sm font-bold">{r.team}</span>
          <div className="h-[22px] rounded-md bg-n27">
            <div
              className="h-full rounded-md"
              style={{ width: `${(Math.max(0, r.value) / max) * 100}%`, background: r.team === us ? 'var(--acc)' : 'var(--n72)' }}
            />
          </div>
          <span className="text-right font-mono text-sm">{r.value.toFixed(decimals)}</span>
        </div>
      ))}
    </div>
  )
}
