import { getOrCreateSession } from '#server/utils/db'
import { isValidRoomCode } from '#server/utils/session'

export default defineEventHandler((event) => {
  const roomCode = getRouterParam(event, 'roomCode')?.toUpperCase() ?? ''

  if (!isValidRoomCode(roomCode)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid room code' })
  }

  return getOrCreateSession(roomCode)
})
