import { useEffect, useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { useEventStore } from '../store/useEventStore'
import {
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  FloppyDiskIcon,
  InfoIcon,
  LinkIcon,
  WarningIcon,
} from '@phosphor-icons/react'
import { TEAMS, mayaGlyphs } from '../data/team'
import { FieldRenderer, fieldHint, isWideField } from './FieldRenderer'
import { MatchTimer } from './MatchTimer'
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
  const eventTeams = useEventStore((s) => s.teams)
  const [phaseIdx, setPhaseIdx] = useState(0)

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
    setPhaseIdx(0)
    setSaving(false)
  }

  const team = TEAMS[config.mode]
  const phase = phases[phaseIdx] ?? phases[0]
  const m = matchNumber.trim()
  const t = teamNumber.trim()
  const nameOf = (n: number) => eventTeams.find((x) => x.teamNumber === n)?.name ?? ''
  const round = m ? eventMatches.find((x) => String(x.matchNumber) === m) : undefined
  const side = round && t ? (round.red.map(String).includes(t) ? 'red' : round.blue.map(String).includes(t) ? 'blue' : null) : null
  const savedHere = new Set(matches.filter((x) => x.matchNumber === m).map((x) => x.teamNumber))
  const isDup = !!m && !!t && matches.some((x) => x.matchNumber === m && x.teamNumber === t)
  const phaseDone = (p: GameField['phase']) =>
    config.fields.some((f) => f.phase === p && values[f.id] !== undefined && values[f.id] !== '' && values[f.id] !== 0 && values[f.id] !== false)

  // Estado bajo los campos de arriba (info / verde / advertencia) + chip de alianza
  let status: { text: string; tone: 'info' | 'ok' | 'warn' }
  if (!t) status = { text: 'Escribe el número de equipo; te sugerimos los del evento.', tone: 'info' }
  else if (eventMatches.length === 0)
    status = { text: 'Sin cronograma sincronizado — sincroniza el evento en Eventos para autocompletar aliados y puntaje.', tone: 'info' }
  else if (!round) status = { text: `El partido ${m || '—'} no está en el cronograma. Puedes guardar igual.`, tone: 'warn' }
  else if (side) status = { text: autofilled ? 'Aliados y puntaje autocompletados desde el partido oficial.' : 'Equipo encontrado en el cronograma oficial.', tone: 'ok' }
  else status = { text: `El equipo ${t} no juega en el partido ${m}. Revisa el número.`, tone: 'warn' }
  const StatusIcon = status.tone === 'ok' ? LinkIcon : status.tone === 'warn' ? WarningIcon : InfoIcon
  const mates = round && side ? round[side].filter((n) => String(n) !== t) : []

  // Resumen (compu): valores de los campos numéricos + puntos estimados si el config trae "points"
  const summaryFields = config.fields.filter(
    (f) => f.phase !== 'pit' && ['counter', 'toggle', 'rating', 'dropdown'].includes(f.type),
  )
  const hasPoints = config.fields.some((f) => f.points !== undefined)
  const livePts = config.fields.reduce((sum, f) => {
    const v = values[f.id]
    if (f.points === undefined) return sum
    if (f.type === 'toggle') return sum + (v === true ? f.points : 0)
    return sum + (typeof v === 'number' ? v * f.points : 0)
  }, 0)
  const fmt = (f: GameField) => {
    const v = values[f.id]
    if (f.type === 'toggle') return v ? 'Sí' : 'No'
    if (f.type === 'rating') return typeof v === 'number' && v > 0 ? `${v}/${f.max ?? 5}` : '—'
    if (f.type === 'dropdown') return typeof v === 'string' && v ? v : '—'
    return typeof v === 'number' ? String(v) : '0'
  }

  const saveButton = (
    <button
      className="flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-grn text-[19px] font-extrabold text-on-grn disabled:opacity-40"
      disabled={saving || !m || !t}
      onClick={handleSave}
    >
      <FloppyDiskIcon size={22} weight="bold" />
      Guardar partido
    </button>
  )
  const dupWarning = isDup && (
    <div className="flex items-center gap-2.5 rounded-xl bg-bad-t px-3.5 py-3 text-sm">
      <WarningIcon size={20} weight="duotone" className="shrink-0" />
      Ya guardaste el partido {m} del equipo {t}. Si guardas otra vez quedará duplicado.
    </div>
  )

  return (
    <div className="mx-auto grid max-w-[1240px] items-start gap-6 p-4 pb-8 text-left sm:p-6 desk:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        {/* Banda de marca */}
        <div data-chrome className="relative flex min-h-[84px] items-center gap-3.5 overflow-hidden rounded-[18px] bg-brand px-[18px] py-3.5">
          <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs font-extrabold uppercase tracking-[.14em] text-n75">{team.name}</span>
            <span className="text-2xl font-extrabold leading-tight [font-stretch:70%]">
              {config.gameName} · Partido {m || '—'}
            </span>
          </div>
          <span className="tk-maya relative z-10 text-[26px] tracking-[4px]" aria-hidden>
            {mayaGlyphs(team.number).join('')}
          </span>
          <span aria-hidden className="tk-outline pointer-events-none absolute -bottom-6 -right-2 text-[128px] text-n33">
            {team.number}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-[32px] font-extrabold [font-stretch:75%]">Captura de partido</h1>
          <span className="text-sm text-n75">
            Fase {phaseIdx + 1} de {phases.length}
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.3fr)] gap-2">
          {(
            [
              ['# Partido', matchNumber, setMatchNumber, true, ''],
              ['# Equipo', teamNumber, setTeamNumber, true, String(team.number)],
              ['Scout', scoutName, setScoutName, false, 'Tu nombre'],
            ] as const
          ).map(([label, value, set, numeric, placeholder]) => (
            <label key={label} className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-n75">
              {label}
              <input
                className={`h-14 w-full min-w-0 rounded-xl border border-n33 bg-n215 px-3 text-fg focus:outline-2 focus:outline-offset-1 focus:outline-acc ${numeric ? 'font-mono text-[22px] font-bold' : 'text-[17px] font-semibold'}`}
                inputMode={numeric ? 'numeric' : undefined}
                placeholder={placeholder}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            </label>
          ))}
        </div>

        <TeamPicker value={teamNumber} onPick={setTeamNumber} />

        <div
          className={`flex flex-wrap items-center gap-2.5 text-sm ${status.tone === 'ok' ? 'text-grn' : status.tone === 'warn' ? 'text-acc-t' : 'text-n75'}`}
        >
          <StatusIcon size={18} weight="duotone" className="shrink-0" />
          <span className="min-w-[180px] flex-1">{status.text}</span>
          {side && (
            <span className={`rounded-full px-3 py-1.5 text-[13px] font-bold text-fg ${side === 'red' ? 'bg-bad-t' : 'bg-blu-t'}`}>
              {side === 'red' ? 'Roja' : 'Azul'}
              {mates.length > 0 && ` · con ${mates.join(', ')}`}
            </span>
          )}
        </div>

        {/* Alianzas del partido (del cronograma sincronizado) */}
        {round && (
          <div className="grid grid-cols-2 gap-2">
            {(['red', 'blue'] as const).map((k) => (
              <div
                key={k}
                className="flex flex-col gap-1.5 rounded-[14px] border-t-4 p-2.5"
                style={{
                  borderColor: `var(--${k === 'red' ? 'red' : 'blu'})`,
                  background: `color-mix(in oklch, var(--${k === 'red' ? 'red' : 'blu'}-t) 55%, var(--n215))`,
                }}
              >
                <div
                  className="flex items-center justify-between gap-1.5 text-xs font-extrabold uppercase tracking-[.06em]"
                  style={{ color: `var(--${k === 'red' ? 'red' : 'blu'})` }}
                >
                  <span>Alianza {k === 'red' ? 'roja' : 'azul'}</span>
                  <span className="font-mono font-medium normal-case tracking-normal text-n75">
                    {side ? (side === k ? 'tus aliados' : 'rivales') : ''}
                  </span>
                </div>
                {round[k].map((n) => {
                  const ns = String(n)
                  const selected = ns === t
                  const badge = selected
                    ? 'Escuteando'
                    : savedHere.has(ns)
                      ? 'Guardado'
                      : side === k
                        ? 'Aliado'
                        : n === team.number
                          ? 'Nosotros'
                          : ''
                  return (
                    <button
                      key={n}
                      aria-pressed={selected}
                      className="flex min-h-12 items-center gap-2 rounded-[10px] border-2 px-2.5 py-1.5 text-left"
                      style={{
                        borderColor: selected ? 'var(--acc)' : 'transparent',
                        background: selected ? 'color-mix(in oklch, var(--acc) 14%, var(--n215))' : 'var(--n215)',
                      }}
                      onClick={() => setTeamNumber(ns)}
                    >
                      <span className={`font-mono text-[17px] font-bold ${n === team.number ? 'text-acc-t' : ''}`}>{n}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-n75">{nameOf(n)}</span>
                      {badge && (
                        <span
                          className={`rounded-full px-[7px] py-0.5 text-[11px] font-extrabold ${selected ? 'bg-acc text-on-acc' : badge === 'Guardado' ? 'bg-grn text-on-grn' : 'bg-n27'}`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        <MatchTimer
          mode={config.mode}
          onPhase={(p) => {
            const i = (phases as string[]).indexOf(p)
            if (i >= 0) setPhaseIdx(i)
          }}
        />

        {/* Pestañas de fase */}
        <div className="sticky -top-px z-[5] -mx-1 flex gap-1.5 overflow-x-auto bg-n12 px-1 py-1.5">
          {phases.map((p, i) => {
            const active = i === phaseIdx
            return (
              <button
                key={p}
                className={`flex min-h-12 flex-[1_0_auto] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 text-[15px] font-bold ${active ? 'border-acc bg-acc text-on-acc' : 'border-n215 bg-n215'}`}
                onClick={() => setPhaseIdx(i)}
              >
                <span className="font-mono text-xs opacity-70">{phaseDone(p) && !active ? '✓' : i + 1}</span>
                {phaseLabel[p]}
              </button>
            )
          })}
        </div>

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

        <div className="flex gap-2">
          {phaseIdx > 0 && (
            <button className="flex min-h-14 items-center gap-2 rounded-[14px] bg-n27 px-[18px] font-bold" onClick={() => setPhaseIdx(phaseIdx - 1)}>
              <CaretLeftIcon size={18} weight="bold" />
              {phaseLabel[phases[phaseIdx - 1]]}
            </button>
          )}
          {phaseIdx < phases.length - 1 && (
            <button
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-[14px] bg-n27 px-[18px] font-bold"
              onClick={() => setPhaseIdx(phaseIdx + 1)}
            >
              Siguiente: {phaseLabel[phases[phaseIdx + 1]]}
              <CaretRightIcon size={18} weight="bold" />
            </button>
          )}
        </div>

        {/* Teléfono/iPad: Guardar en línea al final de la última fase — nunca flotando sobre el mapa (iPhone SE) */}
        {phaseIdx === phases.length - 1 && (
          <div className="flex flex-col gap-2.5 pb-2 desk:hidden">
            {dupWarning}
            {saveButton}
          </div>
        )}
      </div>

      {/* Compu: panel de resumen con Guardar fijo */}
      <aside className="sticky top-4 hidden flex-col gap-4 rounded-[18px] bg-n215 p-5 desk:flex">
        <span className="text-[13px] text-n75">
          Resumen · P{m || '—'} · {t || '—'}
        </span>
        {hasPoints && (
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[52px] font-bold leading-none">{livePts}</span>
            <span className="text-n75">pts estimados</span>
          </div>
        )}
        <div className="flex max-h-[45vh] flex-col gap-0.5 overflow-y-auto">
          {summaryFields.map((f) => (
            <div key={f.id} className="flex justify-between gap-3 py-2 text-sm">
              <span className="truncate text-n75">{f.label}</span>
              <span className="font-mono font-bold">{fmt(f)}</span>
            </div>
          ))}
        </div>
        {dupWarning}
        {saveButton}
      </aside>

      {savedMatch && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[18px] overflow-auto bg-n165 p-6 text-center">
          <span aria-hidden className="tk-outline pointer-events-none absolute inset-x-0 -bottom-[0.12em] text-[min(46vw,340px)] text-n27">
            {team.number}
          </span>
          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-grn text-on-grn">
            <CheckIcon size={38} weight="bold" />
          </div>
          <p className="relative text-[34px] font-extrabold [font-stretch:80%]">Guardado</p>
          <p className="relative text-[17px] text-n75">
            Partido <b className="font-mono text-fg">{savedMatch.matchNumber}</b> · Equipo{' '}
            <b className="font-mono text-fg">{savedMatch.teamNumber}</b>
          </p>
          <div className="relative rounded-[14px] bg-white p-3.5">
            <QrCode text={compressMatch(savedMatch)} />
          </div>
          <p className="relative max-w-[34ch] text-sm text-n75">
            Que la central lo escanee en Partidos → Escanear QR. No necesita internet.
          </p>
          <div className="relative flex w-full max-w-[340px] flex-col gap-2">
            {/^\d+$/.test(savedMatch.matchNumber) && (
              <button
                className="min-h-[60px] rounded-[14px] bg-acc text-[17px] font-extrabold text-on-acc"
                onClick={() => {
                  setMatchNumber(String(Number(savedMatch.matchNumber) + 1))
                  setSavedMatch(null)
                }}
              >
                Siguiente partido ({Number(savedMatch.matchNumber) + 1})
              </button>
            )}
            <button className="min-h-14 rounded-[14px] bg-n27 font-bold" onClick={() => setSavedMatch(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
