import prisma from '../prisma.js'

export async function listPolls({ page, limit, status, userId }) {
  const offset = (page - 1) * limit
  const where = {}
  if (status === 'active') where.ends_at = { gte: new Date() }
  else if (status === 'closed') where.ends_at = { lt: new Date() }
  const total = await prisma.polls.count({ where })
  const rows = await prisma.polls.findMany({
    where, skip: offset, take: limit, orderBy: { created_at: 'desc' },
  })
  const pollIds = rows.map(r => r.id)
  if (pollIds.length > 0) {
    const allVotes = await prisma.poll_votes.findMany({
      where: { poll_id: { in: pollIds }, user_id: userId },
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
  return { data: rows, total, page, totalPages: Math.ceil(total / limit) }
}

export async function createPoll({ title, description, options, multipleChoice, showResults, endsAt, userId }) {
  const poll = await prisma.polls.create({
    data: {
      title, description: description || '',
      multiple_choice: multipleChoice || false,
      show_results: showResults || 'after_vote',
      ends_at: endsAt ? new Date(endsAt) : null,
      created_by: userId,
      poll_options: { create: options.map(opt => ({ text: opt.trim() })) },
    },
    include: { poll_options: true },
  })
  const created = await prisma.polls.findUnique({ where: { id: poll.id } })
  return {
    ...created,
    options: poll.poll_options.map(o => ({ ...o, voted: false })),
    totalVotes: 0, myVotes: [],
    multipleChoice: !!created.multiple_choice,
    showResults: created.show_results || 'after_vote',
    isClosed: false,
  }
}

export async function votePoll(pollId, optionId, userId) {
  const poll = await prisma.polls.findUnique({ where: { id: pollId } })
  if (!poll) return { error: 'Not found' }
  if (poll.ends_at && new Date(poll.ends_at) < new Date()) return { error: 'Poll is closed' }
  await prisma.$transaction(async (tx) => {
    if (poll.multiple_choice) {
      const existing = await tx.poll_votes.findFirst({
        where: { poll_id: pollId, option_id: optionId, user_id: userId },
      })
      if (existing) {
        await tx.poll_votes.delete({ where: { id: existing.id } })
      } else {
        await tx.poll_votes.create({ data: { poll_id: pollId, option_id: optionId, user_id: userId } })
      }
    } else {
      await tx.poll_votes.deleteMany({ where: { poll_id: pollId, user_id: userId } })
      await tx.poll_votes.create({ data: { poll_id: pollId, option_id: optionId, user_id: userId } })
    }
    const votes = await tx.poll_votes.groupBy({
      by: ['option_id'],
      where: { poll_id: pollId },
      _count: { id: true },
    })
    await tx.poll_options.updateMany({ where: { poll_id: pollId }, data: { votes_count: 0 } })
    for (const v of votes) {
      await tx.poll_options.update({ where: { id: v.option_id }, data: { votes_count: v._count.id } })
    }
  })
  const opts = await prisma.poll_options.findMany({ where: { poll_id: pollId }, orderBy: { id: 'asc' } })
  const userVotes = await prisma.poll_votes.findMany({
    where: { poll_id: pollId, user_id: userId },
    select: { option_id: true },
  })
  const votedIds = new Set(userVotes.map(v => v.option_id))
  const optsWithVoted = opts.map(o => ({ ...o, voted: votedIds.has(o.id) }))
  const totalVotes = opts.reduce((s, o) => s + (o.votes_count || 0), 0)
  const updated = await prisma.polls.findUnique({ where: { id: pollId } })
  return {
    ...updated, options: optsWithVoted, totalVotes,
    multipleChoice: !!updated.multiple_choice,
    showResults: updated.show_results || 'after_vote',
    isClosed: updated.ends_at ? new Date(updated.ends_at) < new Date() : false,
  }
}

export async function deletePoll(id) {
  await prisma.polls.delete({ where: { id } })
}
