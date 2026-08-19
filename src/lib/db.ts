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
  return db.getAllFromIndex('matches', 'by-gameId', gameId)
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
