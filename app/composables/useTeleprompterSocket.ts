import type {
  DisplayUpdatePayload,
  PlaybackUpdatePayload,
  PlaybackStepPayload,
  ScriptUpdatePayload,
  SessionRole,
  TeleprompterState
} from '#shared/types/teleprompter'

interface ServerMessage<T = unknown> {
  type: string
  payload: T
}

function buildWsUrl(roomCode: string, role: SessionRole): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/${roomCode}?role=${role}`
}

export function useTeleprompterSocket(roomCode: string, role: SessionRole) {
  const connected = ref(false)
  const error = ref('')
  const state = ref<TeleprompterState | null>(null)
  const socket = shallowRef<WebSocket | null>(null)

  const { pause: pauseHeartbeat, resume: resumeHeartbeat } = useIntervalFn(
    () => {
      send('session:heartbeat', { roomCode, role })
    },
    20_000,
    { immediate: false }
  )

  const send = (type: string, payload: unknown = {}) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      return
    }

    socket.value.send(JSON.stringify({ type, payload }))
  }

  const connect = () => {
    if (!import.meta.client || socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    socket.value = new WebSocket(buildWsUrl(roomCode, role))

    socket.value.onopen = () => {
      connected.value = true
      error.value = ''
      resumeHeartbeat()
    }

    socket.value.onclose = () => {
      connected.value = false
      pauseHeartbeat()
    }

    socket.value.onerror = () => {
      error.value = 'Realtime connection failed'
    }

    socket.value.onmessage = (event) => {
      let message: ServerMessage
      try {
        message = JSON.parse(String(event.data))
      }
      catch {
        return
      }

      if (message.type === 'session:state') {
        state.value = message.payload as TeleprompterState
      }

      if (message.type === 'session:error') {
        error.value = String(message.payload)
      }
    }
  }

  onMounted(() => {
    connect()
  })

  onBeforeUnmount(() => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
  })

  tryOnScopeDispose(() => {
    pauseHeartbeat()
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
  })

  const updateScript = (payload: ScriptUpdatePayload) => {
    send('script:update', payload)
  }

  const updatePlayback = (payload: PlaybackUpdatePayload) => {
    send('playback:update', payload)
  }

  const updateDisplay = (payload: DisplayUpdatePayload) => {
    send('display:update', payload)
  }

  const stepPlayback = (payload: PlaybackStepPayload) => {
    send('playback:step', payload)
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
