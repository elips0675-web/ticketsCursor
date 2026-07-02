import { Router } from 'express'
import pool from '../db.js'
import { authenticateToken } from '../middleware.js'

const router = Router()

router.use(authenticateToken)

// GET /api/tickets — list all tickets
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, 
        e.name as assigned_name, e.email as assigned_email, e.avatar as assigned_avatar,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', m.id, 'ticketId', m.ticket_id, 'senderId', m.sender_id,
            'senderName', m.sender_name, 'text', m.text,
            'createdAt', m.created_at, 'isInternal', m.is_internal
          )
        ) as messages
      FROM tickets t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN ticket_messages m ON m.ticket_id = t.id
      GROUP BY t.id
      ORDER BY t.updated_at DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('Tickets list error:', err)
    res.status(500).json({ message: 'Failed to fetch tickets' })
  }
})

// GET /api/tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, e.name as assigned_name, e.email as assigned_email, e.avatar as assigned_avatar
       FROM tickets t LEFT JOIN employees e ON t.assigned_to = e.id WHERE t.id = ?`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found' })

    const [messages] = await pool.query(
      'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC',
      [req.params.id],
    )
    const ticket = rows[0]
    ticket.messages = messages
    res.json(ticket)
  } catch (err) {
    console.error('Ticket detail error:', err)
    res.status(500).json({ message: 'Failed to fetch ticket' })
  }
})

// POST /api/tickets — create ticket
router.post('/', async (req, res) => {
  const { title, description, priority, category } = req.body
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description required' })
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO tickets (title, description, status, priority, category, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [title, description, 'open', priority || 'medium', category || 'support', req.user.userId],
    )
    const ticketId = result.insertId
    await pool.query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, sender_name, text, created_at) VALUES (?, ?, ?, ?, NOW())',
      [ticketId, req.user.userId, req.user.name || 'User', description],
    )
    const [ticket] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId])
    res.status(201).json(ticket[0])
  } catch (err) {
    console.error('Create ticket error:', err)
    res.status(500).json({ message: 'Failed to create ticket' })
  }
})

// PUT /api/tickets/:id/status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body
  const allowed = ['open', 'in_progress', 'resolved', 'closed']
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' })
  try {
    await pool.query('UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' })
  }
})

// PUT /api/tickets/:id/priority
router.put('/:id/priority', async (req, res) => {
  const { priority } = req.body
  const allowed = ['low', 'medium', 'high', 'critical']
  if (!allowed.includes(priority)) return res.status(400).json({ message: 'Invalid priority' })
  try {
    await pool.query('UPDATE tickets SET priority = ?, updated_at = NOW() WHERE id = ?', [priority, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update priority' })
  }
})

// PUT /api/tickets/:id/assign
router.put('/:id/assign', async (req, res) => {
  const { employeeId } = req.body
  try {
    await pool.query('UPDATE tickets SET assigned_to = ?, updated_at = NOW() WHERE id = ?', [employeeId, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign ticket' })
  }
})

// POST /api/tickets/:id/messages
router.post('/:id/messages', async (req, res) => {
  const { text, isInternal } = req.body
  if (!text?.trim()) return res.status(400).json({ message: 'Text required' })
  try {
    const [result] = await pool.query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, sender_name, text, is_internal, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.params.id, req.user.userId, req.user.name || 'User', text, isInternal ? 1 : 0],
    )
    const [msg] = await pool.query('SELECT * FROM ticket_messages WHERE id = ?', [result.insertId])
    await pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [req.params.id])
    res.status(201).json(msg[0])
  } catch (err) {
    res.status(500).json({ message: 'Failed to add message' })
  }
})

export default router
