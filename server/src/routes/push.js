import { Router } from 'express'
import webpush from 'web-push'
import prisma from '../prisma.js'
import { auditLogMiddleware } from '../audit.js'
import { authenticateToken, requireRole } from '../middleware.js'
import logger from '../logger.js'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@servicedesk.local'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const router = Router()
router.use(authenticateToken)
router.use(auditLogMiddleware)

router.get('/vapid-key', (req, res) => {
  if (!VAPID_PUBLIC_KEY) return res.status(500).json({ message: 'VAPID not configured' })
  res.json({ success: true, data: { publicKey: VAPID_PUBLIC_KEY } })
})

router.get('/subscription', async (req, res) => {
  try {
    const rows = await prisma.push_subscriptions.findMany({
      where: { user_id: req.user.userId },
      select: { subscription_json: true },
    })
    res.json({ success: true, data: rows.map(r => JSON.parse(r.subscription_json)) })
  } catch (err) {
    logger.error('Get subscriptions error:', err)
    res.status(500).json({ message: 'Failed to get subscriptions' })
  }
})

router.post('/subscribe', async (req, res) => {
  const { subscription_json } = req.body
  if (!subscription_json) return res.status(400).json({ message: 'Subscription object required' })
  try {
    await prisma.push_subscriptions.upsert({
      where: { user_id: req.user.userId },
      update: { subscription_json: JSON.stringify(subscription_json) },
      create: { user_id: req.user.userId, subscription_json: JSON.stringify(subscription_json) },
    })
    res.status(201).json({ success: true, data: { ok: true } })
  } catch (err) {
    logger.error('Subscribe error:', err)
    res.status(500).json({ message: 'Failed to subscribe' })
  }
})

router.delete('/unsubscribe', async (req, res) => {
  try {
    await prisma.push_subscriptions.deleteMany({ where: { user_id: req.user.userId } })
    res.json({ success: true, data: { ok: true } })
  } catch (err) {
    logger.error('Unsubscribe error:', err)
    res.status(500).json({ message: 'Failed to unsubscribe' })
  }
})

router.post('/send', requireRole('admin', 'senior_agent'), async (req, res) => {
  const { title, body, url } = req.body
  if (!title) return res.status(400).json({ message: 'Title is required' })

  try {
    const rows = await prisma.push_subscriptions.findMany({
      select: { user_id: true, subscription_json: true },
    })
    if (!rows.length) return res.json({ sent: 0, total: 0 })

    const payload = JSON.stringify({ title, body: body || '', url: url || '/', icon: '/icon.svg' })
    let sent = 0, failed = 0

    await Promise.allSettled(rows.map(async (row) => {
      try {
        const sub = JSON.parse(row.subscription_json)
        await webpush.sendNotification(sub, payload)
        sent++
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.push_subscriptions.deleteMany({ where: { user_id: row.user_id } })
        }
        failed++
      }
    }))

    res.json({ success: true, data: { sent, failed, total: rows.length } })
  } catch (err) {
    logger.error('Send push error:', err)
    res.status(500).json({ message: 'Failed to send push notifications' })
  }
})

export default router
