import { Router } from 'express'
import prisma from '../prisma.js'
import { authenticateToken, requireRole } from '../middleware.js'
import { createCalendarValidation, updateCalendarValidation, deleteEventValidation } from '../validate.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  const { year, month } = req.query
  try {
    const where = {}
    if (year && month) {
      const startDate = new Date(Number(year), Number(month) - 1, 1)
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)
      where.date = { gte: startDate, lte: endDate }
    }
    const events = await prisma.events.findMany({
      where,
      select: { id: true, title: true, date: true, time: true, description: true, creator_id: true, created_at: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })
    res.json({ success: true, data: events.map(({ creator_id, created_at, ...rest }) => ({ ...rest, creatorId: creator_id, createdAt: created_at })) })
  } catch (err) {
    logger.error('Calendar list error:', err)
    res.status(500).json({ message: 'Failed to fetch events' })
  }
})

router.post('/', createCalendarValidation, async (req, res) => {
  const { title, date, time, description } = req.body
  try {
    const event = await prisma.events.create({
      data: {
        title,
        date: new Date(date),
        time: time || null,
        description: description || '',
        creator_id: req.user.userId,
      },
      select: { id: true, title: true, date: true, time: true, description: true, creator_id: true, created_at: true },
    })
    res.status(201).json({ success: true, data: { ...event, creatorId: event.creator_id, createdAt: event.created_at, creator_id: undefined, created_at: undefined } })
    const { createNotification } = await import('./notifications.js')
    await createNotification({
      userId: req.user.userId,
      type: 'event',
      title: 'Событие создано',
      body: title,
      link: `/calendar`,
    })
  } catch (err) {
    logger.error('Create event error:', err)
    res.status(500).json({ message: 'Failed to create event' })
  }
})

router.put('/:id', requireRole('admin', 'senior_agent'), updateCalendarValidation, async (req, res) => {
  const { title, date, time, description } = req.body
  try {
    await prisma.events.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        date: new Date(date),
        time: time || null,
        description: description || '',
      },
    })
    const event = await prisma.events.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, title: true, date: true, time: true, description: true, creator_id: true, created_at: true },
    })
    res.json({ success: true, data: { ...event, creatorId: event.creator_id, createdAt: event.created_at, creator_id: undefined, created_at: undefined } })
  } catch (err) {
    logger.error('Update event error:', err)
    res.status(500).json({ message: 'Failed to update event' })
  }
})

router.delete('/:id', requireRole('admin', 'senior_agent'), deleteEventValidation, async (req, res) => {
  try {
    await prisma.events.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true, data: { ok: true } })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event' })
  }
})

export default router
