import prisma from '../prisma.js'

export async function listArticles(page, limit) {
  const offset = (page - 1) * limit
  const total = await prisma.wiki_articles.count()
  const rows = await prisma.wiki_articles.findMany({
    orderBy: { updated_at: 'desc' }, skip: offset, take: limit,
  })
  return { data: rows, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getArticleById(id) {
  return prisma.wiki_articles.findUnique({ where: { id } })
}

export async function createArticle({ title, content, category, tags, userId, userName }) {
  return prisma.wiki_articles.create({
    data: {
      title, content, category: category || 'Другое', tags: tags || [],
      author_id: userId, author_name: userName || 'User',
    },
  })
}
