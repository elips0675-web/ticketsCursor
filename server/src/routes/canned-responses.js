import { Router } from 'express'
import prisma from '../prisma.js'
import { authenticateToken, requireRole } from '../middleware.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.canned_responses.findMany({
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    logger.error('Canned responses list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch canned responses' })
  }
})

router.post('/', requireRole('admin', 'senior_agent'), async (req, res) => {
  const { title, text, category } = req.body
  if (!title || !text) {
    return res.status(400).json({ success: false, message: 'Title and text are required' })
  }
  try {
    const row = await prisma.canned_responses.create({
      data: { title, text, category: category || '', created_by: req.user.userId },
    })
    res.status(201).json({ success: true, data: row })
  } catch (err) {
    logger.error('Canned response create error:', err)
    res.status(500).json({ success: false, message: 'Failed to create canned response' })
  }
})

router.put('/:id', requireRole('admin', 'senior_agent'), async (req, res) => {
  const id = Number(req.params.id)
  const { title, text, category } = req.body
  try {
    const existing = await prisma.canned_responses.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' })
    const row = await prisma.canned_responses.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(text !== undefined && { text }),
        ...(category !== undefined && { category }),
        updated_at: new Date(),
      },
    })
    res.json({ success: true, data: row })
  } catch (err) {
    logger.error('Canned response update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update canned response' })
  }
})

router.delete('/:id', requireRole('admin', 'senior_agent'), async (req, res) => {
  const id = Number(req.params.id)
  try {
    const existing = await prisma.canned_responses.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' })
    await prisma.canned_responses.delete({ where: { id } })
    res.json({ success: true, data: { deleted: true } })
  } catch (err) {
    logger.error('Canned response delete error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete canned response' })
  }
})

export default router