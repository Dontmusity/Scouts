import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

/** Sin servidores STUN/TURN: solo candidatos host, suficiente en la misma red Wi-Fi. */
export function createPeer(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: [] })
}

/** ICE sin trickle: espera a que termine la recolección para que un solo QR lleve todo el SDP. */
export function waitForIceComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check)
        resolve()
      }
    }
    pc.addEventListener('icegatheringstatechange', check)
  })
}

export function compressSdp(desc: RTCSessionDescriptionInit): string {
  return compressToEncodedURIComponent(JSON.stringify({ type: desc.type, sdp: desc.sdp }))
}

export function decompressSdp(text: string, expectedType: 'offer' | 'answer'): RTCSessionDescriptionInit {
  const json = decompressFromEncodedURIComponent(text.trim())
  if (!json) throw new Error('Código de conexión inválido o corrupto')
  const desc = JSON.parse(json) as RTCSessionDescriptionInit
  if (desc.type !== expectedType || typeof desc.sdp !== 'string') {
    throw new Error('Código de conexión inválido o corrupto')
  }
  return desc
}
