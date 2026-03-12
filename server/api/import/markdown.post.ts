import { getOrCreateSession, upsertSession } from '#server/utils/db'
import { getIo } from '#server/utils/realtime'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ roomCode: string; markdown: string }>(event)
  const roomCode = body.roomCode?.toUpperCase()

  if (!roomCode || typeof body.markdown !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'roomCode and markdown are required' })
  }

  const current = getOrCreateSession(roomCode)
  const next = {
    ...current,
    scriptMarkdown: body.markdown,
    renderMode: 'markdown' as const,
    updatedAt: new Date().toISOString()
  }

  upsertSession(next)
  getIo()?.to(roomCode).emit('session:state', next)

  return next
})
