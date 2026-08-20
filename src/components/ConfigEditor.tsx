import { useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { validateGameConfig, type GameConfig } from '../types/gameConfig'

export function ConfigEditor() {
  const { config, matches, setConfig } = useScoutStore()
  const [text, setText] = useState(() => JSON.stringify(config, null, 2))
  const [error, setError] = useState<string | null>(null)

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

  function setMode(mode: GameConfig['mode']) {
    // Cambia el modo sobre el borrador actual, no sobre el último config
    // aplicado — así el toggle no destruye ediciones sin guardar.
    try {
      const draft = JSON.parse(text) as GameConfig
      const next = validateGameConfig({ ...draft, mode })
      if (confirmIfHidesData(next)) {
        setText(JSON.stringify(next, null, 2))
        setConfig(next)
        setError(null)
      }
    } catch {
      setError('El JSON del borrador no es válido; corrígelo antes de cambiar el modo.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 text-left">
      <div className="flex gap-2">
        {(['FRC', 'FTC'] as const).map((m) => (
          <button
            key={m}
            className={`rounded-lg px-4 py-2 font-bold ${config.mode === m ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-400">
        Edita el JSON de configuración del juego (campos, tipos: counter, toggle, dropdown, rating, fieldMap, text) y aplica.
      </p>

      <textarea
        className="h-96 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-emerald-300"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className="text-sm font-bold text-red-400">{error}</p>}

      <button
        className="w-full rounded-xl bg-sky-600 py-3 font-bold text-white"
        onClick={handleApply}
      >
        Aplicar configuración
      </button>
    </div>
  )
}
