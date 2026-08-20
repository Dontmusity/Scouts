import { useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { FieldRenderer } from './FieldRenderer'
import { TeamPicker } from './TeamPicker'
import { QrCode } from './QrCode'
import { compressMatch } from '../lib/qr'
import type { GameField } from '../types/gameConfig'
import type { MatchEntry } from '../lib/db'

const phaseLabel: Record<GameField['phase'], string> = {
  prematch: 'Inicio',
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
  const [saving, setSaving] = useState(false)

  const phases = Array.from(new Set(config.fields.map((f) => f.phase)))

  async function handleSave() {
    // guarda contra doble-tap: dos clics rápidos guardaban el partido dos veces
    if (saving || !matchNumber.trim() || !teamNumber.trim()) return
    setSaving(true)
    const entry: MatchEntry = {
      id: crypto.randomUUID(),
      gameId: config.gameId,
      // trim: "254 " y "254" serían dos equipos distintos en el dashboard
      matchNumber: matchNumber.trim(),
      teamNumber: teamNumber.trim(),
      scoutName: scoutName.trim(),
      createdAt: Date.now(),
      values,
    }
    await addMatch(entry)
    setValues({})
    setMatchNumber('')
    setTeamNumber('')
    setSavedMatch(entry)
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-8 text-left">
      <div className="grid grid-cols-3 gap-3">
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
          placeholder="# Partido"
          inputMode="numeric"
          value={matchNumber}
          onChange={(e) => setMatchNumber(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
          placeholder="# Equipo"
          inputMode="numeric"
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

      <TeamPicker value={teamNumber} onPick={setTeamNumber} />

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

      {/* En el flujo normal (no "fixed"): un botón flotante sobre el campo
          tipo fieldMap le tapaba los taps en pantallas cortas (iPhone SE). */}
      <button
        className="w-full rounded-xl bg-emerald-600 py-4 text-xl font-bold text-white shadow-lg disabled:opacity-40"
        disabled={saving || !matchNumber.trim() || !teamNumber.trim()}
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
