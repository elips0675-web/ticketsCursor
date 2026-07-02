import { Router } from 'express'
import pool from '../db.js'
import { authenticateToken } from '../middleware.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        (SELECT m.text FROM chat_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM chat_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_time
      FROM chat_rooms c ORDER BY last_time DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('Chats list error:', err)
    res.status(500).json({ message: 'Failed to fetch chats' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [[chat]] = await pool.query('SELECT * FROM chat_rooms WHERE id = ?', [req.params.id])
    if (!chat) return res.status(404).json({ message: 'Chat not found' })
    const [messages] = await pool.query(
      'SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC',
      [req.params.id],
    )
    chat.messages = messages
    res.json(chat)
  } catch (err) {
    console.error('Chat detail error:', err)
    res.status(500).json({ message: 'Failed to fetch chat' })
  }
})

router.post('/:id/messages', async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ message: 'Text required' })
  try {
    const [result] = await pool.query(
      'INSERT INTO chat_messages (chat_id, sender_id, sender_name, text) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.userId, req.user.name || 'User', text],
    )
    const [[msg]] = await pool.query('SELECT * FROM chat_messages WHERE id = ?', [result.insertId])
    res.status(201).json(msg)
  } catch (err) {
    console.error('Send message error:', err)
    res.status(500).json({ message: 'Failed to send message' })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE chat_rooms SET unread = 0 WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark read' })
  }
})

export default router
