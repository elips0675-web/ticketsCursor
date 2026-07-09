import { Router } from 'express'
import knex from '../db.js'
import { authenticateToken } from '../middleware.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const [rows] = await knex.raw(`
      SELECT c.*,
        (SELECT m.text FROM chat_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM chat_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_time
      FROM chat_rooms c ORDER BY last_time DESC
    `)
    res.json(rows)
  } catch (err) {
    logger.error('Chats list error:', err)
    res.status(500).json({ message: 'Failed to fetch chats' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [[chat]] = await knex.raw('SELECT * FROM chat_rooms WHERE id = ?', [req.params.id])
    if (!chat) return res.status(404).json({ message: 'Chat not found' })
    const [messages] = await knex.raw(
      'SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC',
      [req.params.id],
    )
    chat.messages = messages
    res.json(chat)
  } catch (err) {
    logger.error('Chat detail error:', err)
    res.status(500).json({ message: 'Failed to fetch chat' })
  }
})

router.post('/:id/messages', async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ message: 'Text required' })
  try {
    const [result] = await knex.raw(
      'INSERT INTO chat_messages (chat_id, sender_id, sender_name, text) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.userId, req.user.name || 'User', text],
    )
    const [[msg]] = await knex.raw('SELECT * FROM chat_messages WHERE id = ?', [result.insertId])
    // Уведомление участникам чата кроме отправителя
    const [participants] = await knex.raw(
      'SELECT DISTINCT sender_id FROM chat_messages WHERE chat_id = ? AND sender_id != ?',
      [req.params.id, req.user.userId],
    )
    const { createNotification } = await import('./notifications.js')
    for (const p of participants) {
      await createNotification({
        userId: p.sender_id,
        type: 'chat_message',
        title: req.user.name || 'User',
        body: text,
        link: `/chats/${req.params.id}`,
      })
    }
    res.status(201).json(msg)
  } catch (err) {
    logger.error('Send message error:', err)
    res.status(500).json({ message: 'Failed to send message' })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    await knex.raw('UPDATE chat_rooms SET unread = 0 WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark read' })
  }
})

router.post('/personal/:userId', async (req, res) => {
  const { userId } = req.params
  const myId = req.user.userId
  if (Number(userId) === myId) return res.status(400).json({ message: 'Cannot chat with yourself' })
  try {
    const [[existing]] = await knex.raw(
      'SELECT * FROM chat_rooms WHERE type = ? AND name = (SELECT name FROM employees WHERE id = ?)',
      ['personal', userId],
    )
    if (existing) return res.json(existing)

    const [[userRow]] = await knex.raw('SELECT name FROM employees WHERE id = ?', [userId])
    if (!userRow) return res.status(404).json({ message: 'User not found' })
    const [result] = await knex.raw(
      'INSERT INTO chat_rooms (name, type) VALUES (?, ?)',
      [userRow.name, 'personal'],
    )
    const [[chat]] = await knex.raw('SELECT * FROM chat_rooms WHERE id = ?', [result.insertId])
    res.status(201).json(chat)
  } catch (err) {
    logger.error('Create personal chat error:', err)
    res.status(500).json({ message: 'Failed to create chat' })
  }
})

export default router
