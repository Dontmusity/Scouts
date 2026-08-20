import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GameConfig } from '../types/gameConfig'

export interface MatchEntry {
  id: string
  gameId: string
  matchNumber: string
  teamNumber: string
  scoutName: string
  createdAt: number
  /** field id -> value (number | boolean | string) */
  values: Record<string, number | boolean | string>
}

/**
 * Valida datos que llegan de fuera (QR escaneado, import JSON, canal Wi-Fi)
 * antes de persistirlos — un entry malformado guardado rompería el export CSV
 * y el dashboard para todo el dataset.
 */
export function validateMatchEntry(v: unknown): MatchEntry {
  const m = v as Partial<MatchEntry>
  if (
    !m ||
    typeof m !== 'object' ||
    typeof m.id !== 'string' ||
    !m.id ||
    typeof m.gameId !== 'string' ||
    typeof m.matchNumber !== 'string' ||
    typeof m.teamNumber !== 'string' ||
    typeof m.scoutName !== 'string' ||
    !Number.isFinite(m.createdAt) ||
    !m.values ||
    typeof m.values !== 'object' ||
    Array.isArray(m.values)
  ) {
    throw new Error('Datos de partido inválidos')
  }
  return m as MatchEntry
}

export interface PitReport {
  id: string
  gameId: string
  teamNumber: string
  /** field id -> value (number | boolean | string) */
  values: Record<string, number | boolean | string>
  updatedAt: number
}

/**
 * Valida un pit report antes de persistirlo — mismo criterio que
 * validateMatchEntry, para que un reporte malformado no rompa el grid de pits.
 */
export function validatePitReport(v: unknown): PitReport {
  const p = v as Partial<PitReport>
  if (
    !p ||
    typeof p !== 'object' ||
    typeof p.id !== 'string' ||
    !p.id ||
    typeof p.gameId !== 'string' ||
    typeof p.teamNumber !== 'string' ||
    !Number.isFinite(p.updatedAt) ||
    !p.values ||
    typeof p.values !== 'object' ||
    Array.isArray(p.values)
  ) {
    throw new Error('Datos de pit scouting inválidos')
  }
  return p as PitReport
}

interface ScoutingDB extends DBSchema {
  matches: {
    key: string
    value: MatchEntry
    indexes: { 'by-gameId': string }
  }
  configs: {
    key: string
    value: GameConfig
  }
  pitReports: {
    key: string
    value: PitReport
    indexes: { 'by-gameId': string }
  }
}

let dbPromise: Promise<IDBPDatabase<ScoutingDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ScoutingDB>('scouting-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const matches = db.createObjectStore('matches', { keyPath: 'id' })
          matches.createIndex('by-gameId', 'gameId')
          db.createObjectStore('configs', { keyPath: 'gameId' })
        }
        if (oldVersion < 2) {
          const pitReports = db.createObjectStore('pitReports', { keyPath: 'id' })
          pitReports.createIndex('by-gameId', 'gameId')
        }
      },
    })
  }
  return dbPromise
}

export async function saveMatch(entry: MatchEntry) {
  const db = await getDb()
  await db.put('matches', entry)
}

export async function listMatches(gameId: string): Promise<MatchEntry[]> {
  const db = await getDb()
  const rows = await db.getAllFromIndex('matches', 'by-gameId', gameId)
  // el índice devuelve en orden de UUID (aleatorio); la UI asume orden cronológico
  return rows.sort((a, b) => a.createdAt - b.createdAt)
}

export async function deleteMatch(id: string) {
  const db = await getDb()
  await db.delete('matches', id)
}

export async function saveGameConfig(config: GameConfig) {
  const db = await getDb()
  await db.put('configs', config)
}

export async function loadGameConfig(gameId: string): Promise<GameConfig | undefined> {
  const db = await getDb()
  return db.get('configs', gameId)
}

export async function listGameConfigs(): Promise<GameConfig[]> {
  const db = await getDb()
  return db.getAll('configs')
}

export async function savePitReport(report: PitReport) {
  const db = await getDb()
  await db.put('pitReports', report)
}

export async function listPitReports(gameId: string): Promise<PitReport[]> {
  const db = await getDb()
  return db.getAllFromIndex('pitReports', 'by-gameId', gameId)
}

export async function deletePitReport(id: string) {
  const db = await getDb()
  await db.delete('pitReports', id)
}
