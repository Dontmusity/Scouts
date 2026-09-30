import { useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { validateGameConfig, type GameConfig } from '../types/gameConfig'
import { exampleGameConfig } from '../data/exampleGameConfig'
import { biobuzzConfig } from '../data/biobuzzConfig'
import { loadGameConfig } from '../lib/db'
import { TEAMS, mayaGlyphs } from '../data/team'
import { useDisplayPrefsStore, type Accent } from '../store/useDisplayPrefsStore'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'

const presets = [exampleGameConfig, biobuzzConfig]

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

  /**
   * Un gameId nuevo, o un field id que ya no existe, no borra los partidos
   * guardados — pero deja de mostrarlos (por gameId) o los muestra en 0 (por
   * field id), y a mitad de un evento eso parece pérdida de datos. Avisamos
   * antes de aplicar.
   */
  function confirmIfHidesData(next: GameConfig): boolean {
    if (matches.length === 0) return true
    if (next.gameId !== config.gameId) {
      return window.confirm(
        `Este config usa un "gameId" distinto. Los ${matches.length} partidos guardados quedarán ocultos (no se borran) hasta volver al gameId anterior. ¿Continuar?`,
      )
    }
    const nextIds = new Set(next.fields.map((f) => f.id))
    const orphaned = config.fields.filter((f) => !nextIds.has(f.id) && matches.some((m) => f.id in m.values))
    if (orphaned.length > 0) {
      return window.confirm(
        `Estos campos ya tienen datos guardados y no están en el nuevo config: ${orphaned.map((f) => f.label).join(', ')}. Sus valores quedarán invisibles (se verán en 0) en los partidos ya guardados. ¿Continuar?`,
      )
    }
    return true
  }

  function handleApply() {
    try {
      const next = validateGameConfig(JSON.parse(text))
      if (confirmIfHidesData(next)) {
        setConfig(next)
        setError(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON inválido')
    }
  }


  async function loadPreset(preset: GameConfig) {
    // Si ya se usó antes, retoma su versión guardada (con las ediciones que se le hayan hecho)
    const next = (await loadGameConfig(preset.gameId)) ?? preset
    if (confirmIfHidesData(next)) {
      setText(JSON.stringify(next, null, 2))
      setConfig(next)
      setError(null)
    }
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

      <h2 className="text-lg font-bold">JSON del juego</h2>
      <p className="text-sm text-n72">
        Edita el JSON de configuración del juego (campos, tipos: counter, toggle, dropdown, rating, fieldMap, text) y aplica.
      </p>

      <textarea
        className="h-96 w-full rounded-lg border border-n33 bg-n165 p-3 font-mono text-xs text-grn"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className="text-sm font-bold text-bad">{error}</p>}

      <button
        className="w-full rounded-xl bg-acc py-3 font-bold text-on-acc"
        onClick={handleApply}
      >
        Aplicar configuración
      </button>
    </div>
  )
}
