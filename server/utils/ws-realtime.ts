import type { WebSocketPeer } from 'crossws'

type Role = 'controller' | 'display'

interface PeerMeta {
  roomCode: string
  role: Role
}

const roomPeers = new Map<string, Set<WebSocketPeer>>()
const peerMeta = new WeakMap<WebSocketPeer, PeerMeta>()

export function registerPeer(roomCode: string, role: Role, peer: WebSocketPeer): void {
  const peers = roomPeers.get(roomCode) ?? new Set<WebSocketPeer>()
  peers.add(peer)
  roomPeers.set(roomCode, peers)
  peerMeta.set(peer, { roomCode, role })
}

export function unregisterPeer(peer: WebSocketPeer): PeerMeta | null {
  const meta = peerMeta.get(peer)
  if (!meta) {
    return null
  }

  const peers = roomPeers.get(meta.roomCode)
  if (peers) {
    peers.delete(peer)
    if (peers.size === 0) {
      roomPeers.delete(meta.roomCode)
    }
  }

  peerMeta.delete(peer)
  return meta
}

export function getPeerMeta(peer: WebSocketPeer): PeerMeta | null {
  return peerMeta.get(peer) ?? null
}

export function getPresence(roomCode: string): { controllers: number; displays: number } {
  const peers = roomPeers.get(roomCode)
  if (!peers) {
    return { controllers: 0, displays: 0 }
  }

  let controllers = 0
  let displays = 0

  for (const peer of peers) {
    const meta = peerMeta.get(peer)
    if (meta?.role === 'controller') {
      controllers += 1
    }
    if (meta?.role === 'display') {
      displays += 1
    }
  }

  return { controllers, displays }
}

export function sendToPeer(peer: WebSocketPeer, type: string, payload: unknown): void {
  peer.send(JSON.stringify({ type, payload }))
}

export function broadcastToRoom(roomCode: string, type: string, payload: unknown): void {
  const peers = roomPeers.get(roomCode)
  if (!peers) {
    return
  }

  const message = JSON.stringify({ type, payload })
  for (const peer of peers) {
    peer.send(message)
  }
}
