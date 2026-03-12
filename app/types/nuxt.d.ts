import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '#shared/types/teleprompter'

declare module '#app' {
  interface NuxtApp {
    $socket: Socket<ServerToClientEvents, ClientToServerEvents>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $socket: Socket<ServerToClientEvents, ClientToServerEvents>
  }
}

export {}
