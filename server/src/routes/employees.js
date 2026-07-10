import { Router } from 'express'
import prisma from '../prisma.js'
import { authenticateToken } from '../middleware.js'
import logger from '../logger.js'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.employees.findMany({
      where: { is_active: true },
      select: { id: true, name: true, email: true, role: true, department: true, avatar: true, online: true, active_tickets: true, resolved_today: true, phone: true },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: rows.map(({ active_tickets, resolved_today, ...rest }) => ({ ...rest, activeTickets: active_tickets, resolvedToday: resolved_today })) })
  } catch (err) {
    logger.error('Employees list error:', err)
    res.status(500).json({ message: 'Failed to fetch employees' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const [total, open, inProgress, resolved, critical] = await Promise.all([
      prisma.tickets.count(),
      prisma.tickets.count({ where: { status: 'open' } }),
      prisma.tickets.count({ where: { status: 'in_progress' } }),
      prisma.tickets.count({ where: { status: 'resolved' } }),
      prisma.tickets.count({ where: { priority: 'critical' } }),
    ])
    res.json({ success: true, data: { total, open, inProgress, resolved, critical } })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

export default router
