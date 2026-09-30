import { useEffect, useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { useEventStore } from '../store/useEventStore'
import { FloppyDiskIcon } from '@phosphor-icons/react'
import { FieldRenderer, fieldHint, isWideField } from './FieldRenderer'
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
    const opponentScoreIds = config.fields
      .filter((f) => f.type === 'number' && f.autofill === 'opponentScore')
      .map((f) => f.id)
    const breakdownOwnFields = config.fields.filter((f) => f.autofill === 'breakdownOwn' && f.breakdownKey)
    const breakdownOpponentFields = config.fields.filter((f) => f.autofill === 'breakdownOpponent' && f.breakdownKey)

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
      if (result.opponentScore !== null) {
        opponentScoreIds.forEach((id) => {
          if (next[id] === undefined) {
            next[id] = result.opponentScore as number
            changed = true
          }
        })
      }
      // Un valor puntual del desglose oficial (auto/teleop/penalizaciones…), ver GameField.breakdownKey.
      breakdownOwnFields.forEach((f) => {
        const v = result.breakdown?.[f.breakdownKey as string]
        if (next[f.id] === undefined && v !== undefined) {
          next[f.id] = v
          changed = true
        }
      })
      breakdownOpponentFields.forEach((f) => {
        const v = result.opponentBreakdown?.[f.breakdownKey as string]
        if (next[f.id] === undefined && v !== undefined) {
          next[f.id] = v
          changed = true
        }
      })
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
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-8 text-left">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(
          [
            ['# Partido', matchNumber, setMatchNumber, true],
            ['# Equipo', teamNumber, setTeamNumber, true],
            ['Scout', scoutName, setScoutName, false],
          ] as const
        ).map(([label, value, set, numeric]) => (
          <label key={label} className="min-w-0 text-[13px] font-semibold text-n75">
            {label}
            <input
              className={`mt-1 h-14 w-full rounded-xl border border-n33 bg-n19 px-3 text-xl font-bold text-fg focus:outline-2 focus:outline-acc ${numeric ? 'font-mono' : ''}`}
              inputMode={numeric ? 'numeric' : undefined}
              value={value}
              onChange={(e) => set(e.target.value)}
            />
          </label>
        ))}
      </div>

      <TeamPicker value={teamNumber} onPick={setTeamNumber} />

      {autofilled && (
        <p className="text-xs font-bold text-grn">
          🔗 Aliados y puntaje autocompletados desde el partido oficial sincronizado.
        </p>
      )}

      {/* Sin esto, el autocompletado simplemente no pasaba y el scout no tenía
          forma de saber si era un dato mal escrito o un evento sin sincronizar. */}
      {!autofilled && matchNumber.trim() && teamNumber.trim() && (
        <p className="text-xs text-n60">
          {eventMatches.length === 0
            ? 'ℹ️ Sin cronograma sincronizado — sincroniza el evento en la pestaña Eventos para autocompletar aliados y puntaje.'
            : `ℹ️ El Partido ${matchNumber.trim()} con el Equipo ${teamNumber.trim()} no está en el cronograma sincronizado (${eventMatches.length} partidos de calificación). Revisa los números o vuelve a sincronizar.`}
        </p>
      )}

      {phases.map((phase) => (
        <section key={phase} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-acc-t">{phaseLabel[phase]}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3">
            {config.fields
              .filter((f) => f.phase === phase)
              .map((field) => (
                <div
                  key={field.id}
                  className={`flex min-w-0 flex-col gap-3 rounded-2xl bg-n215 p-4 ${isWideField(field) ? 'col-span-full' : ''}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-semibold">{field.label}</span>
                    <span className="text-[13px] text-n75">{fieldHint(field, values[field.id])}</span>
                  </div>
                  <FieldRenderer
                    field={field}
                    value={values[field.id]}
                    onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                  />
                </div>
              ))}
          </div>
        </section>
      ))}

      {/* En el flujo normal (no "fixed"): un botón flotante sobre el campo
          tipo fieldMap le tapaba los taps en pantallas cortas (iPhone SE). */}
      <button
        className="flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-grn text-[19px] font-extrabold text-on-grn disabled:opacity-40"
        disabled={saving || !matchNumber.trim() || !teamNumber.trim()}
        onClick={handleSave}
      >
        <FloppyDiskIcon size={22} weight="bold" />
        Guardar partido
      </button>

      {savedMatch && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-n12/95 p-4">
          <p className="text-xl font-bold text-fg">✓ Guardado</p>
          <p className="text-n75">
            Partido {savedMatch.matchNumber} · Equipo {savedMatch.teamNumber}
          </p>
          <QrCode text={compressMatch(savedMatch)} />
          <p className="max-w-xs text-center text-xs text-n60">
            Muestra este código al escáner en pit/central para transferirlo sin Wi-Fi.
          </p>
          <button className="rounded-lg bg-n27 px-4 py-2 font-bold text-fg" onClick={() => setSavedMatch(null)}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
