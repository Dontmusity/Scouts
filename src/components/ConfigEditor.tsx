import { useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { validateGameConfig, type GameConfig } from '../types/gameConfig'
import { presets, withPresetPoints } from '../data/presets'
import { loadGameConfig } from '../lib/db'
import { TEAMS, mayaGlyphs } from '../data/team'
import { useDisplayPrefsStore, type Accent } from '../store/useDisplayPrefsStore'
import { MoonIcon, SunIcon, WarningIcon } from '@phosphor-icons/react'


const ACCENTS: [Accent, string, string][] = [
  ['tec', 'Azul Tec', 'oklch(0.78 0.13 235)'],
  ['ambar', 'Ámbar', 'oklch(0.86 0.16 95)'],
  ['jade', 'Jade', 'oklch(0.8 0.13 175)'],
  ['magenta', 'Magenta', 'oklch(0.76 0.17 340)'],
]

export function ConfigEditor() {
  const { config, matches, setConfig } = useScoutStore()
  const [text, setText] = useState(() => JSON.stringify(config, null, 2))
  const [error, setError] = useState<string | null>(null)
  const { theme, accFRC, accFTC, setTheme, setAccent } = useDisplayPrefsStore()
  const team = TEAMS[config.mode]

  const [pending, setPending] = useState<{ next: GameConfig; message: string } | null>(null)

  /**
   * Un gameId nuevo, o un field id que ya no existe, no borra los partidos
   * guardados — pero deja de mostrarlos (por gameId) o los muestra en 0 (por
   * field id), y a mitad de un evento eso parece pérdida de datos. Avisamos
   * antes de aplicar.
   */
  function hidesDataMessage(next: GameConfig): string | null {
    if (matches.length === 0) return null
    if (next.gameId !== config.gameId)
      return `Los ${matches.length} partidos guardados con este juego se van a ocultar. No se borran: vuelven al regresar a este juego.`
    const nextIds = new Set(next.fields.map((f) => f.id))
    const orphaned = config.fields.filter((f) => !nextIds.has(f.id) && matches.some((m) => f.id in m.values))
    if (orphaned.length > 0)
      return `Estos campos ya tienen datos guardados y no están en el nuevo config: ${orphaned.map((f) => f.label).join(', ')}. Sus valores quedarán invisibles (se verán en 0) en los partidos ya guardados.`
    return null
  }

  function apply(next: GameConfig) {
    setText(JSON.stringify(next, null, 2))
    setConfig(next)
    setError(null)
    setPending(null)
  }

  function tryApply(next: GameConfig) {
    const message = hidesDataMessage(next)
    if (message) setPending({ next, message })
    else apply(next)
  }

  function handleApply() {
    try {
      tryApply(validateGameConfig(JSON.parse(text)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON inválido')
    }
  }

  async function loadPreset(preset: GameConfig) {
    // Si ya se usó antes, retoma su versión guardada (con las ediciones que se le hayan hecho)
    const stored = await loadGameConfig(preset.gameId)
    tryApply(stored ? withPresetPoints(stored) : preset)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 text-left">
      <h1 className="text-[32px] font-extrabold [font-stretch:75%]">Ajustes</h1>

      <section className="flex items-center gap-5 rounded-[20px] bg-n215 p-5">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[20px] bg-acc text-center text-xs text-on-acc">
          mascota
          <br />
          del equipo
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-acc-t">{team.name}</p>
          <p className="text-6xl font-extrabold [font-stretch:62%]">{team.number}</p>
          <p className="text-xs text-n72">FRC · FTC</p>
        </div>
        <div className="tk-maya flex flex-col gap-1 text-2xl text-acc-t">
          {mayaGlyphs(team.number).map((g, i) => (
            <span key={i}>{g}</span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Apariencia</h2>
        <div className="inline-flex rounded-2xl bg-n215 p-1">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              className={`flex min-h-12 items-center gap-2 rounded-xl px-6 font-bold ${theme === t ? 'bg-acc text-on-acc' : 'text-n75'}`}
              onClick={() => setTheme(t)}
            >
              {t === 'dark' ? <MoonIcon size={18} weight="fill" /> : <SunIcon size={18} />}
              {t === 'dark' ? 'Oscuro' : 'Claro'}
            </button>
          ))}
        </div>
        <p className="text-sm text-n72">Color de acento por programa. Cambia solo al pasar de FRC a FTC.</p>
        {(['FRC', 'FTC'] as const).map((m) => (
          <div key={m} className="space-y-2">
            <p className="text-sm font-bold">
              {m} · {TEAMS[m].name} {TEAMS[m].number}{' '}
              {config.mode === m && <span className="rounded-full bg-acc px-2 text-xs text-on-acc">En uso</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map(([id, label, swatch]) => {
                const on = (m === 'FRC' ? accFRC : accFTC) === id
                return (
                  <button
                    key={id}
                    className={`flex min-h-12 items-center gap-2 rounded-xl bg-n215 px-3 font-bold ${on ? 'ring-2 ring-fg' : ''}`}
                    onClick={() => setAccent(m, id)}
                  >
                    <span className="h-6 w-6 rounded-full" style={{ background: swatch }} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Juego</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((p) => (
            <button
              key={p.gameId}
              className={`rounded-2xl border p-4 text-left ${config.gameId === p.gameId ? 'border-acc bg-acc/10' : 'border-transparent bg-n215'}`}
              onClick={() => loadPreset(p)}
            >
              <p className="font-extrabold">{p.gameName}</p>
              <p className="text-xs text-n72">
                {TEAMS[p.mode].name} {TEAMS[p.mode].number} · alianzas de {p.mode === 'FRC' ? 3 : 2}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <h2 className="text-lg font-bold">JSON del juego</h2>
          <span className="text-[13px] text-n75">Define fases y campos del formulario</span>
        </div>
        <textarea
          className={`w-full resize-y rounded-[14px] border bg-n12 p-3.5 font-mono text-[12.5px] leading-[1.55] text-fg ${error ? 'border-bad' : 'border-n33'}`}
          rows={14}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error && (
          <div className="flex gap-2.5 rounded-xl bg-bad-t px-3.5 py-3">
            <WarningIcon size={20} weight="duotone" className="shrink-0" />
            <span className="font-mono text-[13px]">{error}</span>
          </div>
        )}
        <button className="min-h-14 self-start rounded-[14px] bg-acc px-[22px] font-extrabold text-on-acc" onClick={handleApply}>
          Aplicar configuración
        </button>
      </section>

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5">
          <div className="flex max-w-[420px] flex-col gap-3.5 rounded-[20px] bg-n215 p-[22px]">
            <p className="text-[22px] font-extrabold">¿Aplicar configuración?</p>
            <p className="text-n75">{pending.message}</p>
            <div className="flex gap-2">
              <button className="min-h-[52px] flex-1 rounded-xl bg-n27 font-bold" onClick={() => setPending(null)}>
                Cancelar
              </button>
              <button className="min-h-[52px] flex-1 rounded-xl bg-acc font-extrabold text-on-acc" onClick={() => apply(pending.next)}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
