import { create } from 'zustand'
import type { GameConfig } from '../types/gameConfig'
import { exampleGameConfig } from '../data/exampleGameConfig'
import {
  saveGameConfig,
  loadGameConfig,
  saveMatch,
  listMatches,
  deleteMatch,
  type MatchEntry,
} from '../lib/db'

const ACTIVE_GAME_KEY = 'activeGameId'

interface ScoutState {
  config: GameConfig
  matches: MatchEntry[]
  loaded: boolean
  init: () => Promise<void>
  setConfig: (config: GameConfig) => Promise<void>
  addMatch: (entry: MatchEntry) => Promise<void>
  removeMatch: (id: string) => Promise<void>
}

export const useScoutStore = create<ScoutState>((set, get) => ({
  config: exampleGameConfig,
  matches: [],
  loaded: false,

  init: async () => {
    // Recordar el último gameId aplicado; si no, al recargar volvía siempre al config por defecto
    const activeId = localStorage.getItem(ACTIVE_GAME_KEY) ?? exampleGameConfig.gameId
    const stored = (await loadGameConfig(activeId)) ?? (await loadGameConfig(exampleGameConfig.gameId))
    const config = stored ?? exampleGameConfig
    if (!stored) await saveGameConfig(exampleGameConfig)
    const matches = await listMatches(config.gameId)
    set({ config, matches, loaded: true })
  },

  setConfig: async (config) => {
    await saveGameConfig(config)
    localStorage.setItem(ACTIVE_GAME_KEY, config.gameId)
    const matches = await listMatches(config.gameId)
    set({ config, matches })
  },

  addMatch: async (entry) => {
    await saveMatch(entry)
    set({ matches: [...get().matches.filter((m) => m.id !== entry.id), entry] })
  },

  removeMatch: async (id) => {
    await deleteMatch(id)
    set({ matches: get().matches.filter((m) => m.id !== id) })
  },
}))
