import { Router } from 'express'
import { authenticateToken, requireRole } from '../middleware.js'
import { createNewsValidation } from '../validate.js'
import logger from '../logger.js'
import { listNews, createNews } from '../services/news.service.js'

const router = Router()
router.use(authenticateToken)
router.use(requireRole('agent'))

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const important = req.query.important
  const q = req.query.q?.trim()
  try {
    const result = await listNews({ page, limit, important, q })
    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('News list error:', err)
    res.status(500).json({ message: 'Failed to fetch news' })
  }
})

router.post('/', requireRole('admin', 'senior_agent'), createNewsValidation, async (req, res) => {
  const { title, content, important } = req.body
  try {
    const post = await createNews({
      title, content, important,
      userId: req.user.userId,
      userName: req.user.name,
    })
    res.status(201).json({ success: true, data: post })
  } catch (err) {
    logger.error('Create news error:', err)
    res.status(500).json({ message: 'Failed to create news' })
  }
})

export default router
