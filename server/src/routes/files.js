import { Router } from 'express'
import pool from '../db.js'
import { authenticateToken } from '../middleware.js'

const router = Router()
router.use(authenticateToken)

router.get('/folders', async (req, res) => {
  try {
    const [folders] = await pool.query(
      'SELECT * FROM file_folders WHERE user_id = ? OR is_shared = 1 ORDER BY name',
      [req.user.userId],
    )
    for (const f of folders) {
      const [files] = await pool.query(
        'SELECT id, name, size, type, folder_id as folderId, created_at as createdAt FROM files WHERE folder_id = ? ORDER BY created_at DESC',
        [f.id],
      )
      f.files = files
    }
    res.json(folders)
  } catch (err) {
    console.error('Files list error:', err)
    res.status(500).json({ message: 'Failed to fetch files' })
  }
})

router.post('/folders', async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ message: 'Name required' })
  try {
    const [result] = await pool.query(
      'INSERT INTO file_folders (name, user_id) VALUES (?, ?)',
      [name, req.user.userId],
    )
    const [[folder]] = await pool.query('SELECT * FROM file_folders WHERE id = ?', [result.insertId])
    res.status(201).json(folder)
  } catch (err) {
    console.error('Create folder error:', err)
    res.status(500).json({ message: 'Failed to create folder' })
  }
})

router.post('/upload', async (req, res) => {
  const { name, size, type, folderId } = req.body
  if (!name) return res.status(400).json({ message: 'Name required' })
  try {
    const [result] = await pool.query(
      'INSERT INTO files (name, size, type, folder_id, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, size || '0 KB', type || 'file', folderId || null, req.user.userId],
    )
    const [[file]] = await pool.query(
      'SELECT id, name, size, type, folder_id as folderId, created_at as createdAt FROM files WHERE id = ?',
      [result.insertId],
    )
    res.status(201).json(file)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ message: 'Failed to upload file' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM files WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete file' })
  }
})

export default router
