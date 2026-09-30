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
  toggle: () => void
  setTheme: (theme: Theme) => void
  setAccent: (mode: 'FRC' | 'FTC', acc: Accent) => void
}

export const useDisplayPrefsStore = create<DisplayPrefsState>()(
  persist(
    (set) => ({
      showNicknames: false,
      theme: 'dark',
      accFRC: 'tec',
      accFTC: 'ambar',
      toggle: () => set((s) => ({ showNicknames: !s.showNicknames })),
      setTheme: (theme) => set({ theme }),
      setAccent: (mode, acc) => set(mode === 'FRC' ? { accFRC: acc } : { accFTC: acc }),
    }),
    { name: 'scouting-display-prefs' },
  ),
)
