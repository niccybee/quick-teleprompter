import { getSessionByCode, upsertSession } from '#server/utils/db'
import { createDefaultState, randomRoomCode } from '#server/utils/session'

export default defineEventHandler(() => {
  let roomCode = randomRoomCode()

  while (getSessionByCode(roomCode)) {
    roomCode = randomRoomCode()
  }

  const state = createDefaultState(roomCode)
  upsertSession(state)

  return {
    roomCode
  }
})
