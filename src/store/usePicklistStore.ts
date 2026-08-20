import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PicklistState {
  order: string[]
  setOrder: (order: string[]) => void
}

// Estado a nivel de módulo (via persist a localStorage) en vez de useState en
// el componente: Dashboard se desmonta al cambiar de pestaña (carga perezosa),
// así que un useState local perdía el orden armado a mano en cada ida y vuelta.
export const usePicklistStore = create<PicklistState>()(
  persist((set) => ({ order: [], setOrder: (order) => set({ order }) }), { name: 'scouting-picklist-order' }),
)
