import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import prisma from '../prisma.js'
import { authenticateToken, requireRole } from '../middleware.js'
import { createWikiValidation } from '../validate.js'
import logger from '../logger.js'
import { validateUpload } from '../middleware/validateUpload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wikiUploads = path.join(__dirname, '..', '..', 'uploads', 'wiki')
fs.mkdirSync(wikiUploads, { recursive: true })

const storage = multer.diskStorage({
  destination: wikiUploads,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, unique + '-' + file.originalname)
  },
})
const WIKI_ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf']
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (WIKI_ALLOWED.includes(file.mimetype)) return cb(null, true)
    cb(new Error(`Недопустимый тип файла: ${file.mimetype}`))
  },
})

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const offset = (page - 1) * limit
  try {
    const total = await prisma.wiki_articles.count()
    const rows = await prisma.wiki_articles.findMany({
      orderBy: { updated_at: 'desc' },
      skip: offset,
      take: limit,
    })
    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    logger.error('Wiki list error:', err)
    res.status(500).json({ message: 'Failed to fetch articles' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const article = await prisma.wiki_articles.findUnique({
      where: { id: Number(req.params.id) },
    })
    if (!article) return res.status(404).json({ message: 'Article not found' })
    res.json(article)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch article' })
  }
})

router.post('/', requireRole('admin', 'senior_agent'), createWikiValidation, async (req, res) => {
  const { title, content, category, tags } = req.body
  try {
    const article = await prisma.wiki_articles.create({
      data: {
        title,
        content,
        category: category || 'Другое',
        tags: tags || [],
        author_id: req.user.userId,
        author_name: req.user.name || 'User',
      },
    })
    res.status(201).json(article)
  } catch (err) {
    logger.error('Create article error:', err)
    res.status(500).json({ message: 'Failed to create article' })
  }
})

router.post('/upload-image', requireRole('admin', 'senior_agent'), upload.single('image'), validateUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  const url = `/uploads/wiki/${req.file.filename}`
  res.json({ url })
})

export default router
