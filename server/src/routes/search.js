import { Router } from 'express'
import knex from '../db.js'
import { authenticateToken } from '../middleware.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  const q = req.query.q?.trim()
  if (!q || q.length < 2) {
    return res.json({ tickets: [], employees: [], wiki: [], news: [], chats: [], files: [] })
  }
  const like = `%${q}%`
  try {
    const [tickets] = await knex.raw(
      'SELECT id, title, status, priority, created_at FROM tickets WHERE title LIKE ? OR description LIKE ? ORDER BY updated_at DESC LIMIT 10',
      [like, like],
    )
    const [employees] = await knex.raw(
      'SELECT id, name, email, department, avatar FROM employees WHERE name LIKE ? OR email LIKE ? OR department LIKE ? LIMIT 10',
      [like, like, like],
    )
    const [wiki] = await knex.raw(
      'SELECT id, title, category, created_at FROM wiki_articles WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC LIMIT 10',
      [like, like],
    )
    const [news] = await knex.raw(
      'SELECT id, title, created_at FROM news_posts WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT 10',
      [like, like],
    )
    const [chats] = await knex.raw(
      'SELECT id, name, type FROM chat_rooms WHERE name LIKE ? LIMIT 10',
      [like],
    )
    const [files] = await knex.raw(
      'SELECT id, name, size, type, created_at FROM files WHERE name LIKE ? ORDER BY created_at DESC LIMIT 10',
      [like],
    )
    res.json({ tickets, employees, wiki, news, chats, files })
  } catch (err) {
    logger.error('Search error:', err)
    res.status(500).json({ message: 'Search failed' })
  }
})

export default router
