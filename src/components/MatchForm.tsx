import { useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { FieldRenderer } from './FieldRenderer'
import { QrCode } from './QrCode'
import { compressMatch } from '../lib/qr'
import type { GameField } from '../types/gameConfig'
import type { MatchEntry } from '../lib/db'

const phaseLabel: Record<GameField['phase'], string> = {
  auto: 'Autónomo',
  teleop: 'TeleOp',
  endgame: 'Endgame',
  pit: 'Pit',
  subjective: 'Subjetivo',
}

export function MatchForm() {
  const { config, addMatch } = useScoutStore()
  const [matchNumber, setMatchNumber] = useState('')
  const [teamNumber, setTeamNumber] = useState('')
  const [scoutName, setScoutName] = useState('')
  const [values, setValues] = useState<Record<string, number | boolean | string>>({})
  const [savedMatch, setSavedMatch] = useState<MatchEntry | null>(null)

  const phases = Array.from(new Set(config.fields.map((f) => f.phase)))

  async function handleSave() {
    if (!matchNumber || !teamNumber) return
    const entry: MatchEntry = {
      id: crypto.randomUUID(),
      gameId: config.gameId,
      matchNumber,
      teamNumber,
      scoutName,
      createdAt: Date.now(),
      values,
    }
    await addMatch(entry)
    setValues({})
    setMatchNumber('')
    setTeamNumber('')
    setSavedMatch(entry)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 text-left">
      <div className="grid grid-cols-3 gap-3">
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
          placeholder="# Partido"
          value={matchNumber}
          onChange={(e) => setMatchNumber(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
          placeholder="# Equipo"
          value={teamNumber}
          onChange={(e) => setTeamNumber(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
          placeholder="Scout"
          value={scoutName}
          onChange={(e) => setScoutName(e.target.value)}
        />
      </div>

      {phases.map((phase) => (
        <section key={phase} className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-sky-400">{phaseLabel[phase]}</h2>
          {config.fields
            .filter((f) => f.phase === phase)
            .map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-sm text-slate-300">{field.label}</label>
                <FieldRenderer
                  field={field}
                  value={values[field.id]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                />
              </div>
            ))}
        </section>
      ))}

      <button
        className="fixed bottom-20 left-1/2 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl bg-emerald-600 py-4 text-xl font-bold text-white shadow-lg disabled:opacity-40"
        disabled={!matchNumber || !teamNumber}
        onClick={handleSave}
      >
        Guardar partido
      </button>

      {savedMatch && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/95 p-4">
          <p className="text-xl font-bold text-white">✓ Guardado</p>
          <p className="text-slate-300">
            Partido {savedMatch.matchNumber} · Equipo {savedMatch.teamNumber}
          </p>
          <QrCode text={compressMatch(savedMatch)} />
          <p className="max-w-xs text-center text-xs text-slate-500">
            Muestra este código al escáner en pit/central para transferirlo sin Wi-Fi.
          </p>
          <button className="rounded-lg bg-slate-700 px-4 py-2 font-bold text-white" onClick={() => setSavedMatch(null)}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
