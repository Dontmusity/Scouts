import { create } from 'zustand'
import { useScoutStore } from './useScoutStore'
import { validateMatchEntry } from '../lib/db'
import { createPeer, waitForIceComplete, compressSdp, decompressSdp } from '../lib/webrtc'

export type SyncRole = 'central' | 'scout'

interface SyncState {
  role: SyncRole | null
  /** RTCPeerConnection.connectionState */
  status: string
  /** SDP local comprimido, listo para mostrarse como QR o copiarse */
  localCode: string | null
  count: number
  startCentral: () => Promise<void>
  /** Central: aplica la respuesta escaneada del scout */
  acceptAnswer: (text: string) => Promise<void>
  /** Scout: responde a la oferta escaneada de la central */
  answerOffer: (text: string) => Promise<void>
  disconnect: () => void
}

// La conexión vive a nivel de módulo, no en un componente: sigue sincronizando
// aunque el panel se cierre o el usuario cambie de pestaña, y el doble montaje
// de StrictMode no puede duplicarla ni cerrarla.
let pc: RTCPeerConnection | null = null
let channel: RTCDataChannel | null = null
const sentIds = new Set<string>()

function flush() {
  if (useSyncStore.getState().role !== 'scout' || channel?.readyState !== 'open') return
  for (const m of useScoutStore.getState().matches) {
    if (sentIds.has(m.id)) continue
    channel.send(JSON.stringify(m))
    sentIds.add(m.id)
    useSyncStore.setState((s) => ({ count: s.count + 1 }))
  }
}

// Empuja cada partido nuevo en cuanto se guarda, aunque el panel esté cerrado.
useScoutStore.subscribe(flush)

function watch(peer: RTCPeerConnection) {
  peer.onconnectionstatechange = () => {
    useSyncStore.setState({ status: peer.connectionState })
    if (peer.connectionState === 'connected') flush()
  }
}

export const useSyncStore = create<SyncState>((set) => ({
  role: null,
  status: 'new',
  localCode: null,
  count: 0,

  startCentral: async () => {
    if (pc) return
    set({ role: 'central' })
    pc = createPeer()
    watch(pc)
    channel = pc.createDataChannel('matches')
    channel.onmessage = async (e) => {
      try {
        const match = validateMatchEntry(JSON.parse(e.data as string))
        await useScoutStore.getState().addMatch(match) // addMatch deduplica por id
        set((s) => ({ count: s.count + 1 }))
      } catch {
        /* mensaje corrupto: se ignora */
      }
    }
    await pc.setLocalDescription(await pc.createOffer())
    await waitForIceComplete(pc)
    set({ localCode: compressSdp(pc.localDescription!) })
  },

  acceptAnswer: async (text) => {
    if (!pc || pc.signalingState !== 'have-local-offer') return
    await pc.setRemoteDescription(decompressSdp(text, 'answer'))
  },

  answerOffer: async (text) => {
    if (pc) return // escaneo duplicado
    const offer = decompressSdp(text, 'offer') // valida antes de crear la conexión
    set({ role: 'scout' })
    pc = createPeer()
    watch(pc)
    pc.ondatachannel = (e) => {
      channel = e.channel
      channel.onopen = flush
    }
    await pc.setRemoteDescription(offer)
    await pc.setLocalDescription(await pc.createAnswer())
    await waitForIceComplete(pc)
    set({ localCode: compressSdp(pc.localDescription!) })
  },

  disconnect: () => {
    channel?.close()
    pc?.close()
    channel = null
    pc = null
    sentIds.clear()
    set({ role: null, status: 'new', localCode: null, count: 0 })
  },
}))
