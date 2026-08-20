import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tier = 'tier1' | 'tier2' | 'tier3' | 'doNotPick' | 'uncategorized'

interface PicklistState {
  scoutName: string
  setScoutName: (name: string) => void
  // assignments[scoutName][teamNumber] = Tier — cada scout tiene su propia
  // picklist personal; la lista primaria combinada se deriva de todas ellas
  // (ver computeMergedTiers) en vez de guardarse por separado.
  assignments: Record<string, Record<string, Tier>>
  setTierFor: (teamNumber: string, tier: Tier) => void
}

export const usePicklistStore = create<PicklistState>()(
  persist(
    (set, get) => ({
      scoutName: '',
      setScoutName: (scoutName) => set({ scoutName }),
      assignments: {},
      setTierFor: (teamNumber, tier) => {
        const { scoutName, assignments } = get()
        if (!scoutName) return
        set({
          assignments: {
            ...assignments,
            [scoutName]: { ...assignments[scoutName], [teamNumber]: tier },
          },
        })
      },
    }),
    { name: 'scouting-picklist-v2' },
  ),
)
