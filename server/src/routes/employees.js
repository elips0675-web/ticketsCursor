import { Router } from 'express'
import pool from '../db.js'
import { authenticateToken } from '../middleware.js'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, department, avatar, online, active_tickets as activeTickets, resolved_today as resolvedToday, phone FROM employees WHERE is_active = 1 ORDER BY name',
    )
    res.json(rows)
  } catch (err) {
    console.error('Employees list error:', err)
    res.status(500).json({ message: 'Failed to fetch employees' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const [ticketStats] = await pool.query(`
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
