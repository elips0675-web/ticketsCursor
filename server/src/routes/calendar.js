import { Router } from 'express'
import knex from '../db.js'
import { authenticateToken, requireRole } from '../middleware.js'
import { createCalendarValidation, updateCalendarValidation, deleteEventValidation } from '../validate.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  const { year, month } = req.query
  try {
    let query = 'SELECT id, title, date, time, description, creator_id as creatorId, created_at as createdAt FROM events WHERE 1=1'
    const params = []
    if (year && month) {
      query += ' AND YEAR(date) = ? AND MONTH(date) = ?'
      params.push(Number(year), Number(month))
    }
    query += ' ORDER BY date, time ASC'
    const [events] = await knex.raw(query, params)
    res.json(events)
  } catch (err) {
    logger.error('Calendar list error:', err)
    res.status(500).json({ message: 'Failed to fetch events' })
  }
})

router.post('/', createCalendarValidation, async (req, res) => {
  const { title, date, time, description } = req.body
  try {
    const [result] = await knex.raw(
      'INSERT INTO events (title, date, time, description, creator_id) VALUES (?, ?, ?, ?, ?)',
      [title, date, time || null, description || '', req.user.userId],
    )
    const [[event]] = await knex.raw(
      'SELECT id, title, date, time, description, creator_id as creatorId, created_at as createdAt FROM events WHERE id = ?',
      [result.insertId],
    )
    res.status(201).json(event)
    // Уведомление создателю
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
    await knex.raw(
      'UPDATE events SET title = ?, date = ?, time = ?, description = ? WHERE id = ?',
      [title, date, time || null, description || '', req.params.id],
    )
    const [[event]] = await knex.raw(
      'SELECT id, title, date, time, description, creator_id as creatorId, created_at as createdAt FROM events WHERE id = ?',
      [req.params.id],
    )
    res.json(event)
  } catch (err) {
    logger.error('Update event error:', err)
    res.status(500).json({ message: 'Failed to update event' })
  }
})

router.delete('/:id', requireRole('admin', 'senior_agent'), deleteEventValidation, async (req, res) => {
  try {
    await knex.raw('DELETE FROM events WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event' })
  }
})

export default router
