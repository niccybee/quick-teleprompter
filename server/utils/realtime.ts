import type { Server } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '#shared/types/teleprompter'

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null

export function setIo(server: Server<ClientToServerEvents, ServerToClientEvents>): void {
  io = server
}

export function getIo(): Server<ClientToServerEvents, ServerToClientEvents> | null {
  return io
}
