import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '#shared/types/teleprompter'

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  if (!socket) {
    socket = io({
      path: config.public.socketPath,
      autoConnect: true,
      transports: ['websocket', 'polling']
    })
  }

  return {
    provide: {
      socket
    }
  }
})
