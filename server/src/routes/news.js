import { Router } from 'express'
import prisma from '../prisma.js'
import { authenticateToken, requireRole } from '../middleware.js'
import { createNewsValidation } from '../validate.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const offset = (page - 1) * limit
  const important = req.query.important
  const q = req.query.q?.trim()
  try {
    const where = {}
    if (important === 'true') where.important = true
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
      ]
    }
    const total = await prisma.news_posts.count({ where })
    const rows = await prisma.news_posts.findMany({
      where,
      select: { id: true, title: true, content: true, important: true, author_id: true, author_name: true, created_at: true },
      orderBy: [{ important: 'desc' }, { created_at: 'desc' }],
      skip: offset,
      take: limit,
    })
    res.json({ success: true, data: { data: rows, total, page, totalPages: Math.ceil(total / limit) } })
  } catch (err) {
    logger.error('News list error:', err)
    res.status(500).json({ message: 'Failed to fetch news' })
  }
})

router.post('/', requireRole('admin', 'senior_agent'), createNewsValidation, async (req, res) => {
  const { title, content, important } = req.body
  try {
    const post = await prisma.news_posts.create({
      data: {
        title,
        content,
        important: important || false,
        author_id: req.user.userId,
        author_name: req.user.name || 'User',
      },
    })
    res.status(201).json({ success: true, data: post })
  } catch (err) {
    logger.error('Create news error:', err)
    res.status(500).json({ message: 'Failed to create news' })
  }
})

export default router
