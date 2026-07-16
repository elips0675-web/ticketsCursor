import prisma from './prisma.js'
import logger from './logger.js'

export async function enqueueEvent(eventType, room, payload) {
  try {
    await prisma.event_outbox.create({
      data: {
        event_type: eventType,
        room,
        payload: JSON.stringify(payload),
      },
    })
  } catch (err) {
    logger.error('Outbox enqueue error:', { eventType, error: err.message })
  }
}
