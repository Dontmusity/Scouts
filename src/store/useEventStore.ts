import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EventTeam, EventRanking, EventMatch } from '../types/tba'
import { fetchTbaTeams, fetchTbaRankings, fetchTbaMatches } from '../lib/tbaApi'
import { fetchFtcEventTeams, fetchFtcEventRankings, fetchFtcEventMatches } from '../lib/ftcScoutApi'

// fetch() rechaza con un TypeError genérico ("Failed to fetch" / "NetworkError…")
// cuando no hay conexión — sin esto, ese texto en inglés se mostraba tal cual.
function friendlyError(e: unknown): string {
  if (e instanceof TypeError) return 'Sin conexión — revisa tu red e intenta de nuevo.'
  return e instanceof Error ? e.message : 'Error de sincronización'
}

/** El cronograma es opcional: si falla, se reporta sin tumbar el resto del sync. */
const ok = (matches: EventMatch[]) => ({ matches, scheduleError: null })
const fail = (e: unknown) => ({
  matches: [] as EventMatch[],
  scheduleError: `No se pudo cargar el cronograma: ${friendlyError(e)} El autocompletado de aliados y puntaje no funcionará.`,
})

interface EventState {
  tbaApiKey: string
  tbaEventKey: string
  ftcSeason: number
  ftcEventCode: string
  teams: EventTeam[]
  rankings: EventRanking[]
  matches: EventMatch[]
  lastSyncedAt: number | null
  syncing: boolean
  error: string | null
  /**
   * Falla del cronograma en particular. Se separa de `error` porque equipos y
   * rankings pueden bajar bien mientras el cronograma falla — antes eso se
   * tragaba en silencio y el autocompletado quedaba muerto sin explicación.
   */
  scheduleError: string | null
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
      matches: [],
      lastSyncedAt: null,
      syncing: false,
      error: null,
      scheduleError: null,

      setTbaApiKey: (tbaApiKey) => set({ tbaApiKey }),
      setTbaEventKey: (tbaEventKey) => set({ tbaEventKey }),
      setFtcSeason: (ftcSeason) => set({ ftcSeason }),
      setFtcEventCode: (ftcEventCode) => set({ ftcEventCode }),

      syncFrc: async () => {
        const { tbaApiKey, tbaEventKey } = get()
        if (!tbaApiKey || !tbaEventKey) return
        set({ syncing: true, error: null, scheduleError: null })
        try {
          const [teams, rankings, schedule] = await Promise.all([
            fetchTbaTeams(tbaEventKey, tbaApiKey),
            fetchTbaRankings(tbaEventKey, tbaApiKey).catch(() => []),
            fetchTbaMatches(tbaEventKey, tbaApiKey).then(ok, fail),
          ])
          set({ teams, rankings, ...schedule, lastSyncedAt: Date.now(), syncing: false })
        } catch (e) {
          set({ error: friendlyError(e), syncing: false })
        }
      },

      syncFtc: async () => {
        const { ftcSeason, ftcEventCode } = get()
        if (!ftcEventCode) return
        set({ syncing: true, error: null, scheduleError: null })
        try {
          const [teams, rankings, schedule] = await Promise.all([
            fetchFtcEventTeams(ftcSeason, ftcEventCode),
            fetchFtcEventRankings(ftcSeason, ftcEventCode).catch(() => []),
            fetchFtcEventMatches(ftcSeason, ftcEventCode).then(ok, fail),
          ])
          set({ teams, rankings, ...schedule, lastSyncedAt: Date.now(), syncing: false })
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
