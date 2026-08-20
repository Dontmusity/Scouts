import { create } from 'zustand'
import { savePitReport, listPitReports, type PitReport } from '../lib/db'
import { useScoutStore } from './useScoutStore'

interface PitState {
  reports: PitReport[]
  loaded: boolean
  init: () => Promise<void>
  saveReport: (report: PitReport) => Promise<void>
}

export const usePitStore = create<PitState>((set, get) => ({
  reports: [],
  loaded: false,

  init: async () => {
    const gameId = useScoutStore.getState().config.gameId
    const reports = await listPitReports(gameId)
    set({ reports, loaded: true })
  },

  saveReport: async (report) => {
    await savePitReport(report)
    set({ reports: [...get().reports.filter((r) => r.id !== report.id), report] })
  },
}))
