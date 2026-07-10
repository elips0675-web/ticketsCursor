import prisma from '../prisma.js'

export async function listNews({ page, limit, important, q }) {
  const offset = (page - 1) * limit
  const where = {}
  if (important === 'true') where.important = true
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
    ]
  }
  const total = await prisma.news_posts.count({ where })
  const rows = await prisma.news_posts.findMany({
    where,
    select: { id: true, title: true, content: true, important: true, author_id: true, author_name: true, created_at: true },
    orderBy: [{ important: 'desc' }, { created_at: 'desc' }],
    skip: offset, take: limit,
  })
  return { data: rows, total, page, totalPages: Math.ceil(total / limit) }
}

export async function createNews({ title, content, important, userId, userName }) {
  return prisma.news_posts.create({
    data: { title, content, important: important || false, author_id: userId, author_name: userName || 'User' },
  })
}
