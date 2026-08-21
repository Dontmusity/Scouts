import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  fetchNexusEventStatus,
  fetchNexusPits,
  type NexusMatch,
} from '../lib/nexusApi'

interface NexusState {
  /** Llave personal del usuario — solo vive en este dispositivo (localStorage). */
  apiKey: string
  eventKey: string
  matches: NexusMatch[]
  /** teamNumber → ubicación del pit */
  pits: Record<string, string>
  announcements: string[]
  dataAsOfTime: number | null
  /** Respuesta cruda del último sync, para diagnosticar la forma real. */
  raw: unknown
  lastSyncedAt: number | null
  syncing: boolean
  error: string | null
  setApiKey: (key: string) => void
  setEventKey: (key: string) => void
  sync: () => Promise<void>
}

export const useNexusStore = create<NexusState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      eventKey: '',
      matches: [],
      pits: {},
      announcements: [],
      dataAsOfTime: null,
      raw: null,
      lastSyncedAt: null,
      syncing: false,
      error: null,

      setApiKey: (apiKey) => set({ apiKey }),
      setEventKey: (eventKey) => set({ eventKey }),

      sync: async () => {
        const { apiKey, eventKey } = get()
        if (!apiKey || !eventKey) return
        set({ syncing: true, error: null })
        try {
          // Los pits son opcionales: muchos eventos no los cargan ("No pits.").
          const [status, pits] = await Promise.all([
            fetchNexusEventStatus(eventKey, apiKey),
            fetchNexusPits(eventKey, apiKey).catch(() => ({})),
          ])
          set({
            matches: status.matches,
            announcements: status.announcements,
            dataAsOfTime: status.dataAsOfTime,
            raw: status.raw,
            pits,
            lastSyncedAt: Date.now(),
            syncing: false,
          })
        } catch (e) {
          const msg =
            e instanceof TypeError
              ? 'Sin conexión — revisa tu red e intenta de nuevo.'
              : e instanceof Error
                ? e.message
                : 'Error al consultar Nexus'
          set({ error: msg, syncing: false })
        }
      },
    }),
    {
      name: 'scouting-nexus-store',
      // syncing/error son transitorios; `raw` puede ser grande y solo sirve
      // para diagnóstico en el momento, no vale la pena persistirlo.
      partialize: ({ syncing: _s, error: _e, raw: _r, ...rest }) => rest,
    },
  ),
)
