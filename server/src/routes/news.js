import { Router } from 'express'
import knex from '../db.js'
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
    let where = '1=1'
    const params = []
    if (important === 'true') { where += ' AND important = 1' }
    if (q) { where += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
    const [[{ total }]] = await knex.raw(`SELECT COUNT(*) as total FROM news_posts WHERE ${where}`, params)
    const [rows] = await knex.raw(
      `SELECT id, title, content, important, author_id, author_name, created_at FROM news_posts WHERE ${where} ORDER BY important DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )
    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    logger.error('News list error:', err)
    res.status(500).json({ message: 'Failed to fetch news' })
  }
})

router.post('/', requireRole('admin', 'senior_agent'), createNewsValidation, async (req, res) => {
  const { title, content, important } = req.body
  try {
    const [result] = await knex.raw(
      'INSERT INTO news_posts (title, content, important, author_id, author_name) VALUES (?, ?, ?, ?, ?)',
      [title, content, important || false, req.user.userId, req.user.name || 'User'],
    )
    const [[post]] = await knex.raw('SELECT * FROM news_posts WHERE id = ?', [result.insertId])
    res.status(201).json(post)
  } catch (err) {
    logger.error('Create news error:', err)
    res.status(500).json({ message: 'Failed to create news' })
  }
})

export default router
