import { Router } from 'express'
import { auditLogMiddleware } from '../audit.js'
import { authenticateToken, requireRole } from '../middleware.js'
import logger from '../logger.js'
import { listPolls, createPoll, votePoll, deletePoll } from '../services/polls.service.js'

const router = Router()
router.use(authenticateToken)
router.use(auditLogMiddleware)
router.use(requireRole('agent'))

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const status = req.query.status
  try {
    const result = await listPolls({ page, limit, status, userId: req.user.userId })
    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('Polls list error:', err)
    res.status(500).json({ message: 'Failed to fetch polls' })
  }
})

router.post('/', requireRole('admin', 'senior_agent'), async (req, res) => {
  const { title, description, options, multipleChoice, showResults, endsAt } = req.body
  if (!title?.trim() || !options?.length || options.length < 2) {
    return res.status(400).json({ message: 'Title and at least 2 options required' })
  }
  try {
    const poll = await createPoll({
      title, description, options, multipleChoice, showResults, endsAt,
      userId: req.user.userId,
    })
    res.status(201).json({ success: true, data: poll })
  } catch (err) {
    logger.error('Create poll error:', err)
    res.status(500).json({ message: 'Failed to create poll' })
  }
})

router.post('/:id/vote', async (req, res) => {
  const { optionId } = req.body
  if (!optionId) return res.status(400).json({ message: 'optionId required' })
  try {
    const result = await votePoll(Number(req.params.id), optionId, req.user.userId)
    if (result.error) return res.status(400).json({ message: result.error })
    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('Vote error:', err)
    res.status(500).json({ message: 'Failed to vote' })
  }
})

router.delete('/:id', requireRole('admin', 'senior_agent'), async (req, res) => {
  try {
    await deletePoll(Number(req.params.id))
    res.json({ success: true })
  } catch (err) {
    logger.error('Delete poll error:', err)
    res.status(500).json({ message: 'Failed to delete poll' })
  }
})

export default router
