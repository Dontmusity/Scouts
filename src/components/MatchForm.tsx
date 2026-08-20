import { useEffect, useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { useEventStore } from '../store/useEventStore'
import { FieldRenderer } from './FieldRenderer'
import { TeamPicker } from './TeamPicker'
import { QrCode } from './QrCode'
import { compressMatch } from '../lib/qr'
import { findMatchAutofill } from '../lib/matchLookup'
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
  const { config, matches, addMatch } = useScoutStore()
  const [matchNumber, setMatchNumber] = useState('')
  const [teamNumber, setTeamNumber] = useState('')
  const [scoutName, setScoutName] = useState('')
  const [values, setValues] = useState<Record<string, number | boolean | string>>({})
  const [savedMatch, setSavedMatch] = useState<MatchEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [autofilled, setAutofilled] = useState(false)
  const eventMatches = useEventStore((s) => s.matches)

  // 'pit' vive en su propia pestaña (un reporte por equipo por temporada, no
  // por partido) — no debe aparecer también aquí en el formulario de partido.
  const phases = Array.from(new Set(config.fields.map((f) => f.phase))).filter((p) => p !== 'pit')

  // Autocompleta aliados y puntaje desde el cronograma oficial sincronizado
  // (TBA/FTCScout), en cuanto # Partido + # Equipo coinciden con un partido
  // real — nunca pisa un valor que el scout ya haya escrito a mano.
  useEffect(() => {
    const result = findMatchAutofill(eventMatches, matchNumber, teamNumber)
    if (!result) {
      setAutofilled(false)
      return
    }
    const allyIds = config.fields.filter((f) => f.type === 'number' && f.autofill === 'ally').map((f) => f.id)
    const scoreIds = config.fields.filter((f) => f.type === 'number' && f.autofill === 'score').map((f) => f.id)

    setValues((prev) => {
      const next = { ...prev }
      let changed = false
      allyIds.forEach((id, i) => {
        if (next[id] === undefined && result.allies[i] !== undefined) {
          next[id] = result.allies[i]
          changed = true
        }
      })
      if (result.score !== null) {
        scoreIds.forEach((id) => {
          if (next[id] === undefined) {
            next[id] = result.score as number
            changed = true
          }
        })
      }
      if (changed) setAutofilled(true)
      return changed ? next : prev
    })
  }, [matchNumber, teamNumber, eventMatches, config.fields])

  async function handleSave() {
    // guarda contra doble-tap: dos clics rápidos guardaban el partido dos veces
    if (saving || !matchNumber.trim() || !teamNumber.trim()) return
    // Sin backend en vivo no podemos bloquear un duplicado, solo avisar antes de guardarlo.
    const dup = matches.find(
      (m) => m.matchNumber === matchNumber.trim() && m.teamNumber === teamNumber.trim(),
    )
    if (dup) {
      const who = dup.scoutName ? `el scout "${dup.scoutName}"` : 'otro scout'
      const proceed = window.confirm(
        `Ya existe un registro del Partido ${dup.matchNumber} · Equipo ${dup.teamNumber} (cargado por ${who}). ¿Guardar de todas formas?`,
      )
      if (!proceed) return
    }
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

      {autofilled && (
        <p className="text-xs font-bold text-emerald-400">
          🔗 Aliados y puntaje autocompletados desde el partido oficial sincronizado.
        </p>
      )}

      {/* Sin esto, el autocompletado simplemente no pasaba y el scout no tenía
          forma de saber si era un dato mal escrito o un evento sin sincronizar. */}
      {!autofilled && matchNumber.trim() && teamNumber.trim() && (
        <p className="text-xs text-slate-500">
          {eventMatches.length === 0
            ? 'ℹ️ Sin cronograma sincronizado — sincroniza el evento en la pestaña Eventos para autocompletar aliados y puntaje.'
            : `ℹ️ El Partido ${matchNumber.trim()} con el Equipo ${teamNumber.trim()} no está en el cronograma sincronizado (${eventMatches.length} partidos de calificación). Revisa los números o vuelve a sincronizar.`}
        </p>
      )}

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
