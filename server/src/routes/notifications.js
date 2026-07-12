import { Router } from 'express'
import prisma from '../prisma.js'
import { auditLogMiddleware } from '../audit.js'
import { authenticateToken } from '../middleware.js'
import { getIO } from '../socket.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)
router.use(auditLogMiddleware)

export async function createNotification({ userId, type, title, body, link }) {
  if (!userId) return
  try {
    const notif = await prisma.notifications.create({
      data: { user_id: userId, type, title, body, link },
    })
    getIO()?.emit(`notification:${userId}`, notif)
  } catch (err) {
    logger.error('Notification create error:', err)
  }
}

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.notifications.findMany({
      where: { user_id: req.user.userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    logger.error('Notifications list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    const result = await prisma.notifications.updateMany({
      where: { id: Number(req.params.id), user_id: req.user.userId },
      data: { is_read: true },
    })
    res.json({ success: true, data: { updated: result.count } })
  } catch (err) {
    logger.error('Notification mark read error:', err)
    res.status(500).json({ success: false, message: 'Failed to mark as read' })
  }
})

router.put('/read-all', async (req, res) => {
  try {
    const result = await prisma.notifications.updateMany({
      where: { user_id: req.user.userId },
      data: { is_read: true },
    })
    res.json({ success: true, data: { updated: result.count } })
  } catch (err) {
    logger.error('Notifications mark all read error:', err)
    res.status(500).json({ success: false, message: 'Failed to mark all as read' })
  }
})

router.delete('/clear-all', async (req, res) => {
  try {
    const result = await prisma.notifications.deleteMany({ where: { user_id: req.user.userId } })
    res.json({ success: true, data: { deleted: result.count } })
  } catch (err) {
    logger.error('Notifications clear error:', err)
    res.status(500).json({ success: false, message: 'Failed to clear notifications' })
  }
})

export default router
