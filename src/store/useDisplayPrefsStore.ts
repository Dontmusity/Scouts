import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'
export type Accent = 'tec' | 'ambar' | 'jade' | 'magenta'

interface DisplayPrefsState {
  showNicknames: boolean
  theme: Theme
  /** Color de acento por programa — se aplica según el modo activo. */
  accFRC: Accent
  accFTC: Accent
  /** Equipo que usa la app (personalizable en Ajustes). */
  teamName: string
  teamNumber: number
  toggle: () => void
  setTheme: (theme: Theme) => void
  setAccent: (mode: 'FRC' | 'FTC', acc: Accent) => void
  setTeam: (name: string, number: number) => void
}

export const useDisplayPrefsStore = create<DisplayPrefsState>()(
  persist(
    (set) => ({
      showNicknames: false,
      theme: 'dark',
      accFRC: 'tec',
      accFTC: 'ambar',
      teamName: 'Tamán Keet',
      teamNumber: 3933,
      toggle: () => set((s) => ({ showNicknames: !s.showNicknames })),
      setTheme: (theme) => set({ theme }),
      setTeam: (teamName, teamNumber) => set({ teamName, teamNumber }),
      setAccent: (mode, acc) => set(mode === 'FRC' ? { accFRC: acc } : { accFTC: acc }),
    }),
    { name: 'scouting-display-prefs' },
  ),
)
