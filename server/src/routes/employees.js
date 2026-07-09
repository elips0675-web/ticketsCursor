import { Router } from 'express'
import knex from '../db.js'
import { authenticateToken } from '../middleware.js'
import logger from '../logger.js'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const [rows] = await knex.raw(
      'SELECT id, name, email, role, department, avatar, online, active_tickets as activeTickets, resolved_today as resolvedToday, phone FROM employees WHERE is_active = 1 ORDER BY name',
    )
    res.json(rows)
  } catch (err) {
    logger.error('Employees list error:', err)
    res.status(500).json({ message: 'Failed to fetch employees' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const [ticketStats] = await knex.raw(`
      SELECT 
        COUNT(*) as total,
        SUM(status = 'open') as open,
        SUM(status = 'in_progress') as inProgress,
        SUM(status = 'resolved') as resolved,
        SUM(priority = 'critical') as critical
      FROM tickets
    `)
    res.json(ticketStats[0])
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

export default router
