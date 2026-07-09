import { Router } from 'express'
import prisma from '../prisma.js'
import { authenticateToken } from '../middleware.js'
import logger from '../logger.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.chat_rooms.findMany({
      include: {
        chat_messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    })
    const rows = rooms
      .map(({ chat_messages, ...c }) => ({
        ...c,
        last_message: chat_messages[0]?.text || null,
        last_time: chat_messages[0]?.created_at || null,
      }))
      .sort((a, b) => {
        if (!a.last_time) return 1
        if (!b.last_time) return -1
        return new Date(b.last_time) - new Date(a.last_time)
      })
    res.json(rows)
  } catch (err) {
    logger.error('Chats list error:', err)
    res.status(500).json({ message: 'Failed to fetch chats' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const chat = await prisma.chat_rooms.findUnique({
      where: { id: Number(req.params.id) },
    })
    if (!chat) return res.status(404).json({ message: 'Chat not found' })
    const messages = await prisma.chat_messages.findMany({
      where: { chat_id: Number(req.params.id) },
      orderBy: { created_at: 'asc' },
    })
    chat.messages = messages
    res.json(chat)
  } catch (err) {
    logger.error('Chat detail error:', err)
    res.status(500).json({ message: 'Failed to fetch chat' })
  }
})

router.post('/:id/messages', async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ message: 'Text required' })
  try {
    const msg = await prisma.chat_messages.create({
      data: {
        chat_id: Number(req.params.id),
        sender_id: req.user.userId,
        sender_name: req.user.name || 'User',
        text,
      },
    })
    const participants = await prisma.chat_messages.findMany({
      where: {
        chat_id: Number(req.params.id),
        sender_id: { not: req.user.userId },
      },
      distinct: ['sender_id'],
      select: { sender_id: true },
    })
    const { createNotification } = await import('./notifications.js')
    for (const p of participants) {
      await createNotification({
        userId: p.sender_id,
        type: 'chat_message',
        title: req.user.name || 'User',
        body: text,
        link: `/chats/${req.params.id}`,
      })
    }
    res.status(201).json(msg)
  } catch (err) {
    logger.error('Send message error:', err)
    res.status(500).json({ message: 'Failed to send message' })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    await prisma.chat_rooms.update({
      where: { id: Number(req.params.id) },
      data: { unread: 0 },
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark read' })
  }
})

router.post('/personal/:userId', async (req, res) => {
  const { userId } = req.params
  const myId = req.user.userId
  if (Number(userId) === myId) return res.status(400).json({ message: 'Cannot chat with yourself' })
  try {
    const user = await prisma.employees.findUnique({
      where: { id: Number(userId) },
      select: { name: true },
    })
    if (!user) return res.status(404).json({ message: 'User not found' })
    const existing = await prisma.chat_rooms.findFirst({
      where: { type: 'personal', name: user.name },
    })
    if (existing) return res.json(existing)
    const chat = await prisma.chat_rooms.create({
      data: {
        name: user.name,
        type: 'personal',
      },
    })
    res.status(201).json(chat)
  } catch (err) {
    logger.error('Create personal chat error:', err)
    res.status(500).json({ message: 'Failed to create chat' })
  }
})

export default router
