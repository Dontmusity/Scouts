import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EventTeam, EventRanking } from '../types/tba'
import { fetchTbaTeams, fetchTbaRankings } from '../lib/tbaApi'
import { fetchFtcEventTeams, fetchFtcEventRankings } from '../lib/ftcScoutApi'

// fetch() rechaza con un TypeError genérico ("Failed to fetch" / "NetworkError…")
// cuando no hay conexión — sin esto, ese texto en inglés se mostraba tal cual.
function friendlyError(e: unknown): string {
  if (e instanceof TypeError) return 'Sin conexión — revisa tu red e intenta de nuevo.'
  return e instanceof Error ? e.message : 'Error de sincronización'
}

interface EventState {
  tbaApiKey: string
  tbaEventKey: string
  ftcSeason: number
  ftcEventCode: string
  teams: EventTeam[]
  rankings: EventRanking[]
  lastSyncedAt: number | null
  syncing: boolean
  error: string | null
  setTbaApiKey: (key: string) => void
  setTbaEventKey: (key: string) => void
  setFtcSeason: (season: number) => void
  setFtcEventCode: (code: string) => void
  syncFrc: () => Promise<void>
  syncFtc: () => Promise<void>
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      tbaApiKey: '',
      tbaEventKey: '',
      ftcSeason: new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1,
      ftcEventCode: '',
      teams: [],
      rankings: [],
      lastSyncedAt: null,
      syncing: false,
      error: null,

      setTbaApiKey: (tbaApiKey) => set({ tbaApiKey }),
      setTbaEventKey: (tbaEventKey) => set({ tbaEventKey }),
      setFtcSeason: (ftcSeason) => set({ ftcSeason }),
      setFtcEventCode: (ftcEventCode) => set({ ftcEventCode }),

      syncFrc: async () => {
        const { tbaApiKey, tbaEventKey } = get()
        if (!tbaApiKey || !tbaEventKey) return
        set({ syncing: true, error: null })
        try {
          const [teams, rankings] = await Promise.all([
            fetchTbaTeams(tbaEventKey, tbaApiKey),
            fetchTbaRankings(tbaEventKey, tbaApiKey).catch(() => []),
          ])
          set({ teams, rankings, lastSyncedAt: Date.now(), syncing: false })
        } catch (e) {
          set({ error: friendlyError(e), syncing: false })
        }
      },

      syncFtc: async () => {
        const { ftcSeason, ftcEventCode } = get()
        if (!ftcEventCode) return
        set({ syncing: true, error: null })
        try {
          const [teams, rankings] = await Promise.all([
            fetchFtcEventTeams(ftcSeason, ftcEventCode),
            fetchFtcEventRankings(ftcSeason, ftcEventCode).catch(() => []),
          ])
          set({ teams, rankings, lastSyncedAt: Date.now(), syncing: false })
        } catch (e) {
          set({ error: friendlyError(e), syncing: false })
        }
      },
    }),
    {
      name: 'scouting-event-store',
      // syncing/error son transitorios: si se persistiera syncing:true (app
      // cerrada a mitad de un fetch), los botones quedarían bloqueados para siempre.
      partialize: ({ syncing: _s, error: _e, ...rest }) => rest,
    },
  ),
)
