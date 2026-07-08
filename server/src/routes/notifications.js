import { Router } from 'express'
import pool from '../db.js'
import { authenticateToken } from '../middleware.js'
import { getIO } from '../socket.js'

const router = Router()
router.use(authenticateToken)

export async function createNotification({ userId, type, title, body, link }) {
  try {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, body, link],
    )
    const [[notif]] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId])
    getIO()?.emit(`notification:${userId}`, notif)
  } catch (err) {
    console.error('Notification create error:', err)
  }
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.userId],
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read' })
  }
})

router.put('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.userId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read' })
  }
})

router.delete('/clear-all', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [req.user.userId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear notifications' })
  }
})

export default router
