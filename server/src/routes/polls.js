import { Router } from 'express'
import prisma from '../prisma.js'
import { authenticateToken, requireRole } from '../middleware.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const offset = (page - 1) * limit
  const status = req.query.status // 'active' | 'closed' | undefined
  try {
    const where = {}
    if (status === 'active') where.ends_at = { gte: new Date() }
    else if (status === 'closed') where.ends_at = { lt: new Date() }
    const total = await prisma.polls.count({ where })
    const rows = await prisma.polls.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' },
    })
    const pollIds = rows.map(r => r.id)
    if (pollIds.length > 0) {
      const allVotes = await prisma.poll_votes.findMany({
        where: { poll_id: { in: pollIds }, user_id: req.user.userId },
        select: { poll_id: true, option_id: true },
      })
      const allOpts = await prisma.poll_options.findMany({
        where: { poll_id: { in: pollIds } },
        orderBy: { id: 'asc' },
      })
      const voteOptionIds = new Set(allVotes.map(v => `${v.poll_id}:${v.option_id}`))
      const optsByPoll = {}
      for (const o of allOpts) {
        if (!optsByPoll[o.poll_id]) optsByPoll[o.poll_id] = []
        optsByPoll[o.poll_id].push({ ...o, voted: voteOptionIds.has(`${o.poll_id}:${o.id}`) })
      }
      const votesByPoll = {}
      for (const v of allVotes) {
        if (!votesByPoll[v.poll_id]) votesByPoll[v.poll_id] = []
        votesByPoll[v.poll_id].push(v.option_id)
      }
      for (const poll of rows) {
        poll.options = optsByPoll[poll.id] || []
        poll.myVotes = votesByPoll[poll.id] || []
        poll.multipleChoice = !!poll.multiple_choice
        poll.showResults = poll.show_results || 'after_vote'
        poll.totalVotes = allOpts.filter(o => o.poll_id === poll.id).reduce((s, o) => s + (o.votes_count || 0), 0)
        poll.isClosed = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
      }
    }
    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) })
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
    const poll = await prisma.polls.create({
      data: {
        title,
        description: description || '',
        multiple_choice: multipleChoice || false,
        show_results: showResults || 'after_vote',
        ends_at: endsAt ? new Date(endsAt) : null,
        created_by: req.user.userId,
        poll_options: {
          create: options.map(opt => ({ text: opt.trim() })),
        },
      },
      include: { poll_options: true },
    })
    const created = await prisma.polls.findUnique({ where: { id: poll.id } })
    res.status(201).json({
      ...created,
      options: poll.poll_options.map(o => ({ ...o, voted: false })),
      totalVotes: 0,
      myVotes: [],
      multipleChoice: !!created.multiple_choice,
      showResults: created.show_results || 'after_vote',
      isClosed: false,
    })
  } catch (err) {
    logger.error('Create poll error:', err)
    res.status(500).json({ message: 'Failed to create poll' })
  }
})

router.post('/:id/vote', async (req, res) => {
  const { optionId } = req.body
  if (!optionId) return res.status(400).json({ message: 'optionId required' })
  try {
    const poll = await prisma.polls.findUnique({ where: { id: Number(req.params.id) } })
    if (!poll) return res.status(404).json({ message: 'Not found' })
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      return res.status(400).json({ message: 'Poll is closed' })
    }

    await prisma.$transaction(async (tx) => {
      if (poll.multiple_choice) {
        const existing = await tx.poll_votes.findFirst({
          where: { poll_id: Number(req.params.id), option_id: optionId, user_id: req.user.userId },
        })
        if (existing) {
          await tx.poll_votes.delete({ where: { id: existing.id } })
        } else {
          await tx.poll_votes.create({
            data: { poll_id: Number(req.params.id), option_id: optionId, user_id: req.user.userId },
          })
        }
      } else {
        await tx.poll_votes.deleteMany({
          where: { poll_id: Number(req.params.id), user_id: req.user.userId },
        })
        await tx.poll_votes.create({
          data: { poll_id: Number(req.params.id), option_id: optionId, user_id: req.user.userId },
        })
      }

      const votes = await tx.poll_votes.groupBy({
        by: ['option_id'],
        where: { poll_id: Number(req.params.id) },
        _count: { id: true },
      })
      await tx.poll_options.updateMany({
        where: { poll_id: Number(req.params.id) },
        data: { votes_count: 0 },
      })
      for (const v of votes) {
        await tx.poll_options.update({
          where: { id: v.option_id },
          data: { votes_count: v._count.id },
        })
      }
    })

    const opts = await prisma.poll_options.findMany({
      where: { poll_id: Number(req.params.id) },
      orderBy: { id: 'asc' },
    })
    const userVotes = await prisma.poll_votes.findMany({
      where: { poll_id: Number(req.params.id), user_id: req.user.userId },
      select: { option_id: true },
    })
    const votedIds = new Set(userVotes.map(v => v.option_id))
    const optsWithVoted = opts.map(o => ({ ...o, voted: votedIds.has(o.id) }))
    const totalVotes = opts.reduce((s, o) => s + (o.votes_count || 0), 0)
    const updated = await prisma.polls.findUnique({ where: { id: Number(req.params.id) } })
    res.json({
      ...updated,
      options: optsWithVoted,
      totalVotes,
      multipleChoice: !!updated.multiple_choice,
      showResults: updated.show_results || 'after_vote',
      isClosed: updated.ends_at ? new Date(updated.ends_at) < new Date() : false,
    })
  } catch (err) {
    logger.error('Vote error:', err)
    res.status(500).json({ message: 'Failed to vote' })
  }
})

router.delete('/:id', requireRole('admin', 'senior_agent'), async (req, res) => {
  try {
    await prisma.polls.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    logger.error('Delete poll error:', err)
    res.status(500).json({ message: 'Failed to delete poll' })
  }
})

export default router
