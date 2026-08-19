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
}

let dbPromise: Promise<IDBPDatabase<ScoutingDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ScoutingDB>('scouting-db', 1, {
      upgrade(db) {
        const matches = db.createObjectStore('matches', { keyPath: 'id' })
        matches.createIndex('by-gameId', 'gameId')
        db.createObjectStore('configs', { keyPath: 'gameId' })
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
