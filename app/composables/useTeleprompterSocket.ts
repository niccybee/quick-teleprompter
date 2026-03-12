import type {
  DisplayUpdatePayload,
  PlaybackUpdatePayload,
  PlaybackStepPayload,
  ScriptUpdatePayload,
  SessionRole,
  TeleprompterState
} from '#shared/types/teleprompter'

export function useTeleprompterSocket(roomCode: string, role: SessionRole) {
  const socket = import.meta.client ? useNuxtApp().$socket : null
  const connected = ref(socket?.connected ?? false)
  const error = ref('')
  const state = ref<TeleprompterState | null>(null)

  const join = () => {
    if (!socket) {
      return
    }

    socket.emit('session:join', { roomCode, role })
  }

  if (socket) {
    socket.off('connect')
    socket.on('connect', () => {
      connected.value = true
      join()
    })

    socket.off('disconnect')
    socket.on('disconnect', () => {
      connected.value = false
    })

    socket.off('session:state')
    socket.on('session:state', (nextState) => {
      state.value = nextState
    })

    socket.off('session:error')
    socket.on('session:error', (message) => {
      error.value = message
    })
  }

  onMounted(() => {
    if (!socket) {
      return
    }

    if (!socket.connected) {
      socket.connect()
    }
    join()
  })

  const updateScript = (payload: ScriptUpdatePayload) => {
    if (!socket) {
      return
    }

    socket.emit('script:update', payload)
  }

  const updatePlayback = (payload: PlaybackUpdatePayload) => {
    if (!socket) {
      return
    }

    socket.emit('playback:update', payload)
  }

  const updateDisplay = (payload: DisplayUpdatePayload) => {
    if (!socket) {
      return
    }

    socket.emit('display:update', payload)
  }

  const stepPlayback = (payload: PlaybackStepPayload) => {
    if (!socket) {
      return
    }

    socket.emit('playback:step', payload)
  }

  return {
    connected,
    error,
    state,
    updateScript,
    updatePlayback,
    updateDisplay,
    stepPlayback
  }
}
