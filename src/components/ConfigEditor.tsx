import { useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import type { GameConfig } from '../types/gameConfig'

export function ConfigEditor() {
  const { config, setConfig } = useScoutStore()
  const [text, setText] = useState(() => JSON.stringify(config, null, 2))
  const [error, setError] = useState<string | null>(null)

  function handleApply() {
    try {
      const parsed = JSON.parse(text) as GameConfig
      if (!parsed.gameId || !Array.isArray(parsed.fields)) {
        throw new Error('El JSON debe tener "gameId" y un arreglo "fields".')
      }
      setConfig(parsed)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON inválido')
    }
  }

  function setMode(mode: GameConfig['mode']) {
    const next = { ...config, mode }
    setText(JSON.stringify(next, null, 2))
    setConfig(next)
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
