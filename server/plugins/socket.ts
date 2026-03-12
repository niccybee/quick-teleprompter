import { Server } from 'socket.io'
import type { Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SessionRole,
  TeleprompterState
} from '#shared/types/teleprompter'
import { getOrCreateSession, upsertSession, cleanupStaleSessions } from '#server/utils/db'
import { applyStepIndex, clampDisplay, clampPlayback, isValidRoomCode } from '#server/utils/session'
import { setIo } from '#server/utils/realtime'

type TeleprompterSocket = Socket<ClientToServerEvents, ServerToClientEvents>

const cleanupHandle = Symbol.for('teleprompter.cleanupHandle')
const ioHandle = Symbol.for('teleprompter.io')

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hookOnce('listen', (listener) => {
    const globalAny = globalThis as Record<string | symbol, unknown>

    if (globalAny[ioHandle]) {
      return
    }

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(listener, {
      path: '/socket.io',
      cors: { origin: '*' }
    })

    globalAny[ioHandle] = io
    setIo(io)

    io.on('connection', (socket) => {
      setupSocketHandlers(socket)
    })

    if (!globalAny[cleanupHandle]) {
      globalAny[cleanupHandle] = setInterval(() => {
        cleanupStaleSessions(48)
      }, 60 * 60 * 1000)
    }
  })
})

function setupSocketHandlers(socket: TeleprompterSocket): void {
  socket.on('session:join', ({ roomCode, role }) => {
    const normalizedRoomCode = roomCode.toUpperCase()

    if (!isValidRoomCode(normalizedRoomCode)) {
      socket.emit('session:error', 'Invalid room code')
      return
    }

    socket.data.roomCode = normalizedRoomCode
    socket.data.role = role

    socket.join(normalizedRoomCode)

    const state = getOrCreateSession(normalizedRoomCode)
    const updated = updatePresence(state, role, 1)
    upsertSession(updated)

    socket.emit('session:state', updated)
    socket.to(normalizedRoomCode).emit('session:presence', updated.presence)
  })

  socket.on('script:update', ({ markdown, renderMode }) => {
    const state = getSocketState(socket)
    if (!state) {
      return
    }

    const next: TeleprompterState = {
      ...state,
      scriptMarkdown: markdown,
      renderMode,
      updatedAt: new Date().toISOString()
    }

    persistAndBroadcast(socket, next)
  })

  socket.on('playback:update', (payload) => {
    const state = getSocketState(socket)
    if (!state) {
      return
    }

    const next: TeleprompterState = {
      ...state,
      playback: clampPlayback(state.playback, payload),
      updatedAt: new Date().toISOString()
    }

    persistAndBroadcast(socket, next)
  })

  socket.on('display:update', (payload) => {
    const state = getSocketState(socket)
    if (!state) {
      return
    }

    const next: TeleprompterState = {
      ...state,
      display: clampDisplay(state.display, payload),
      updatedAt: new Date().toISOString()
    }

    persistAndBroadcast(socket, next)
  })

  socket.on('playback:step', ({ direction }) => {
    const state = getSocketState(socket)
    if (!state) {
      return
    }

    const next: TeleprompterState = {
      ...state,
      playback: {
        ...state.playback,
        stepIndex: applyStepIndex(direction, state.playback.stepIndex)
      },
      updatedAt: new Date().toISOString()
    }

    persistAndBroadcast(socket, next)
  })

  socket.on('session:heartbeat', () => {
    const state = getSocketState(socket)
    if (!state) {
      return
    }

    socket.emit('session:state', state)
  })

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode as string | undefined
    const role = socket.data.role as SessionRole | undefined

    if (!roomCode || !role) {
      return
    }

    const state = getOrCreateSession(roomCode)
    const next = updatePresence(state, role, -1)
    upsertSession(next)
    socket.to(roomCode).emit('session:presence', next.presence)
  })
}

function getSocketState(socket: TeleprompterSocket): TeleprompterState | null {
  const roomCode = socket.data.roomCode as string | undefined
  if (!roomCode) {
    socket.emit('session:error', 'Join a room first')
    return null
  }

  return getOrCreateSession(roomCode)
}

function updatePresence(state: TeleprompterState, role: SessionRole, delta: number): TeleprompterState {
  return {
    ...state,
    presence: {
      controllers:
        role === 'controller'
          ? Math.max(0, state.presence.controllers + delta)
          : state.presence.controllers,
      displays:
        role === 'display'
          ? Math.max(0, state.presence.displays + delta)
          : state.presence.displays
    },
    updatedAt: new Date().toISOString()
  }
}

function persistAndBroadcast(socket: TeleprompterSocket, state: TeleprompterState): void {
  upsertSession(state)
  socket.nsp.to(state.roomCode).emit('session:state', state)
}
