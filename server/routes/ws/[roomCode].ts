import { getOrCreateSession, upsertSession } from '#server/utils/db'
import { applyStepIndex, clampDisplay, clampPlayback, isValidRoomCode } from '#server/utils/session'
import {
  broadcastToRoom,
  getPeerMeta,
  getPresence,
  registerPeer,
  sendToPeer,
  unregisterPeer
} from '#server/utils/ws-realtime'
import type {
  DisplayUpdatePayload,
  PlaybackStepPayload,
  PlaybackUpdatePayload,
  ScriptUpdatePayload
} from '#shared/types/teleprompter'

interface IncomingMessage<T = unknown> {
  type: string
  payload: T
}

export default defineWebSocketHandler({
  open(peer) {
    const rawUrl = peer.request.url || ''
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `http://localhost${rawUrl}`)
    const roomCodeParam = url.pathname.match(/^\/ws\/([A-Za-z0-9]+)/)?.[1]?.toUpperCase() ?? ''
    const roleParam = (url.searchParams.get('role') ?? '') as 'controller' | 'display'

    if (!isValidRoomCode(roomCodeParam) || (roleParam !== 'controller' && roleParam !== 'display')) {
      sendToPeer(peer, 'session:error', 'Invalid session or role')
      peer.close()
      return
    }

    registerPeer(roomCodeParam, roleParam, peer)

    const current = getOrCreateSession(roomCodeParam)
    const next = {
      ...current,
      presence: getPresence(roomCodeParam),
      updatedAt: new Date().toISOString()
    }

    upsertSession(next)
    broadcastToRoom(roomCodeParam, 'session:state', next)
  },

  message(peer, message) {
    const meta = getPeerMeta(peer)
    if (!meta) {
      sendToPeer(peer, 'session:error', 'Not joined')
      return
    }

    let parsed: IncomingMessage
    try {
      parsed = JSON.parse(message.text())
    }
    catch {
      sendToPeer(peer, 'session:error', 'Invalid message payload')
      return
    }

    const current = getOrCreateSession(meta.roomCode)
    let next = {
      ...current,
      presence: getPresence(meta.roomCode),
      updatedAt: new Date().toISOString()
    }

    switch (parsed.type) {
      case 'script:update': {
        const payload = parsed.payload as ScriptUpdatePayload
        next = {
          ...next,
          scriptMarkdown: payload.markdown,
          renderMode: payload.renderMode
        }
        break
      }
      case 'playback:update': {
        const payload = parsed.payload as PlaybackUpdatePayload
        next = {
          ...next,
          playback: clampPlayback(next.playback, payload)
        }
        break
      }
      case 'display:update': {
        const payload = parsed.payload as DisplayUpdatePayload
        next = {
          ...next,
          display: clampDisplay(next.display, payload)
        }
        break
      }
      case 'playback:step': {
        const payload = parsed.payload as PlaybackStepPayload
        next = {
          ...next,
          playback: {
            ...next.playback,
            stepIndex: applyStepIndex(payload.direction, next.playback.stepIndex)
          }
        }
        break
      }
      case 'session:heartbeat': {
        sendToPeer(peer, 'session:state', next)
        return
      }
      default:
        sendToPeer(peer, 'session:error', 'Unknown event type')
        return
    }

    upsertSession(next)
    broadcastToRoom(meta.roomCode, 'session:state', next)
  },

  close(peer) {
    const meta = unregisterPeer(peer)
    if (!meta) {
      return
    }

    const current = getOrCreateSession(meta.roomCode)
    const next = {
      ...current,
      presence: getPresence(meta.roomCode),
      updatedAt: new Date().toISOString()
    }

    upsertSession(next)
    broadcastToRoom(meta.roomCode, 'session:state', next)
  }
})
