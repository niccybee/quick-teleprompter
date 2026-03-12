import { getOrCreateSession, upsertSession } from '#server/utils/db'
import { importGoogleDocText } from '#server/utils/google-docs'
import { getIo } from '#server/utils/realtime'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ roomCode: string; url: string }>(event)
  const roomCode = body.roomCode?.toUpperCase()

  if (!roomCode || !body.url) {
    throw createError({ statusCode: 400, statusMessage: 'roomCode and url are required' })
  }

  const text = await importGoogleDocText(body.url)
  const current = getOrCreateSession(roomCode)
  const next = {
    ...current,
    scriptMarkdown: text,
    renderMode: 'markdown' as const,
    updatedAt: new Date().toISOString()
  }

  upsertSession(next)
  getIo()?.to(roomCode).emit('session:state', next)

  return next
})
