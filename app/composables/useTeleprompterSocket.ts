import type {
  DisplayUpdatePayload,
  PlaybackUpdatePayload,
  PlaybackStepPayload,
  ScriptUpdatePayload,
  SessionRole,
  TeleprompterState
} from '#shared/types/teleprompter'

export function useTeleprompterSocket(roomCode: string, role: SessionRole) {
  const { $socket } = useNuxtApp()
  const socket = $socket
  const connected = ref(socket.connected)
  const error = ref('')
  const state = ref<TeleprompterState | null>(null)

  const join = () => {
    socket.emit('session:join', { roomCode, role })
  }

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

  onMounted(() => {
    if (!socket.connected) {
      socket.connect()
    }
    join()
  })

  const updateScript = (payload: ScriptUpdatePayload) => {
    socket.emit('script:update', payload)
  }

  const updatePlayback = (payload: PlaybackUpdatePayload) => {
    socket.emit('playback:update', payload)
  }

  const updateDisplay = (payload: DisplayUpdatePayload) => {
    socket.emit('display:update', payload)
  }

  const stepPlayback = (payload: PlaybackStepPayload) => {
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
