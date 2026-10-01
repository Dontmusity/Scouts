/** Piezas visuales repetidas del rediseño (handoff Tamán Keet). */

export const inputCls =
  'h-[52px] w-full min-w-0 rounded-xl border border-n33 bg-n19 px-3 font-mono text-base text-fg focus:outline-2 focus:outline-offset-1 focus:outline-acc'

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-[tkspin_0.8s_linear_infinite] rounded-full border-2 border-n33 border-t-acc" />
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-n75">
      {label}
      {children}
    </label>
  )
}
