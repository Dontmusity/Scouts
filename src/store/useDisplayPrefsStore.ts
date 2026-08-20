import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DisplayPrefsState {
  showNicknames: boolean
  toggle: () => void
}

export const useDisplayPrefsStore = create<DisplayPrefsState>()(
  persist(
    (set) => ({
      showNicknames: false,
      toggle: () => set((s) => ({ showNicknames: !s.showNicknames })),
    }),
    { name: 'scouting-display-prefs' },
  ),
)
