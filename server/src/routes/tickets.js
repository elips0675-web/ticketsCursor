import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import multer from 'multer'
import prisma from '../prisma.js'
import { authenticateToken, requireRole } from '../middleware.js'
import { getIO } from '../socket.js'
import { invalidateCache } from '../cache.js'
import { logAudit } from '../audit.js'
import {
  notifyTicketCreated, notifyStatusChanged, notifyPriorityChanged,
  notifyTicketAssigned, notifyTicketMessage,
} from '../notify.js'
import { createTicketValidation, updateStatusValidation, updatePriorityValidation, assignTicketValidation, addMessageValidation } from '../validate.js'
import logger from '../logger.js'
import { validateUpload } from '../middleware/validateUpload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ticketUploads = path.join(__dirname, '..', '..', 'uploads', 'tickets')
fs.mkdirSync(ticketUploads, { recursive: true })

const storage = multer.diskStorage({
  destination: ticketUploads,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, unique + '-' + file.originalname)
  },
})
const TICKET_ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip', 'application/x-rar-compressed']
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (TICKET_ALLOWED.includes(file.mimetype)) return cb(null, true)
    cb(new Error(`Недопустимый тип файла: ${file.mimetype}`))
  },
})

const router = Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit) || 1000))
  const offset = (page - 1) * limit
  try {
    const total = await prisma.tickets.count()
    const rows = await prisma.tickets.findMany({
      skip: offset,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        assigned_to_employee: {
          select: { name: true, email: true, avatar: true },
        },
        ticket_messages: {
          orderBy: { created_at: 'asc' },
        },
      },
    })
    const data = rows.map(r => ({
      ...r,
      assigned_name: r.assigned_to_employee?.name || null,
      assigned_email: r.assigned_to_employee?.email || null,
      assigned_avatar: r.assigned_to_employee?.avatar || null,
      assigned_to_employee: undefined,
      messages: r.ticket_messages,
      ticket_messages: undefined,
    }))
    res.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    logger.error('Tickets list error:', err)
    res.status(500).json({ message: 'Failed to fetch tickets' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const ticket = await prisma.tickets.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        assigned_to_employee: {
          select: { name: true, email: true, avatar: true },
        },
        ticket_messages: {
          orderBy: { created_at: 'asc' },
        },
      },
    })
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json({
      ...ticket,
      assigned_name: ticket.assigned_to_employee?.name || null,
      assigned_email: ticket.assigned_to_employee?.email || null,
      assigned_avatar: ticket.assigned_to_employee?.avatar || null,
      assigned_to_employee: undefined,
      messages: ticket.ticket_messages,
      ticket_messages: undefined,
    })
  } catch (err) {
    logger.error('Ticket detail error:', err)
    res.status(500).json({ message: 'Failed to fetch ticket' })
  }
})

router.post('/', createTicketValidation, async (req, res) => {
  const { title, description, priority, category } = req.body
  try {
    const ticket = await prisma.tickets.create({
      data: {
        title,
        description,
        status: 'open',
        priority: priority || 'medium',
        category: category || 'support',
        created_by: req.user.userId,
      },
    })
    await prisma.ticket_messages.create({
      data: {
        ticket_id: ticket.id,
        sender_id: req.user.userId,
        sender_name: req.user.name || 'User',
        text: description,
      },
    })
    getIO()?.emit('ticket:created', { ...ticket, messages: [] })
    logAudit({ userId: req.user.userId, userName: req.user.name, action: 'created', entityType: 'ticket', entityId: ticket.id, details: { title } })
    notifyTicketCreated(ticket.id, req.user.name)
    invalidateCache('cache:/api/tickets*')
    res.status(201).json(ticket)
  } catch (err) {
    logger.error('Create ticket error:', err)
    res.status(500).json({ message: 'Failed to create ticket' })
  }
})

router.put('/:id/status', requireRole('admin', 'senior_agent'), updateStatusValidation, async (req, res) => {
  const { status } = req.body
  try {
    const old = await prisma.tickets.findUnique({ where: { id: Number(req.params.id) }, select: { status: true } })
    if (!old) return res.status(404).json({ message: 'Ticket not found' })
    await prisma.tickets.update({ where: { id: Number(req.params.id) }, data: { status, updated_at: new Date() } })
    getIO()?.emit('ticket:updated', { id: Number(req.params.id), status, updatedBy: req.user.userId })
    logAudit({ userId: req.user.userId, userName: req.user.name, action: 'status_changed', entityType: 'ticket', entityId: Number(req.params.id), details: { from: old.status, to: status } })
    notifyStatusChanged(Number(req.params.id), old.status, status, req.user.name)
    invalidateCache('cache:/api/tickets*')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' })
  }
})

router.put('/:id/priority', requireRole('admin', 'senior_agent'), updatePriorityValidation, async (req, res) => {
  const { priority } = req.body
  try {
    const old = await prisma.tickets.findUnique({ where: { id: Number(req.params.id) }, select: { priority: true } })
    await prisma.tickets.update({ where: { id: Number(req.params.id) }, data: { priority, updated_at: new Date() } })
    getIO()?.emit('ticket:updated', { id: Number(req.params.id), priority, updatedBy: req.user.userId })
    logAudit({ userId: req.user.userId, userName: req.user.name, action: 'priority_changed', entityType: 'ticket', entityId: Number(req.params.id), details: { from: old?.priority, to: priority } })
    notifyPriorityChanged(Number(req.params.id), old?.priority, priority, req.user.name)
    invalidateCache('cache:/api/tickets*')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update priority' })
  }
})

router.put('/:id/assign', requireRole('admin', 'senior_agent'), assignTicketValidation, async (req, res) => {
  const { employeeId } = req.body
  try {
    let emp = null
    if (employeeId) {
      emp = await prisma.employees.findUnique({ where: { id: Number(employeeId) }, select: { name: true } })
    }
    await prisma.tickets.update({ where: { id: Number(req.params.id) }, data: { assigned_to: employeeId || null, updated_at: new Date() } })
    getIO()?.emit('ticket:updated', { id: Number(req.params.id), assignedTo: employeeId, updatedBy: req.user.userId })
    logAudit({ userId: req.user.userId, userName: req.user.name, action: 'assigned', entityType: 'ticket', entityId: Number(req.params.id), details: { assignedTo: employeeId || null, assignedName: emp?.name || null } })
    notifyTicketAssigned(Number(req.params.id), employeeId, req.user.name)
    invalidateCache('cache:/api/tickets*')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign ticket' })
  }
})

router.post('/upload', upload.single('file'), validateUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' })
  res.json({
    url: `/uploads/tickets/${req.file.filename}`,
    name: req.file.originalname,
    size: req.file.size,
  })
})

router.post('/:id/messages', addMessageValidation, async (req, res) => {
  const { text, isInternal, attachments } = req.body
  try {
    const msg = await prisma.ticket_messages.create({
      data: {
        ticket_id: Number(req.params.id),
        sender_id: req.user.userId,
        sender_name: req.user.name || 'User',
        text,
        attachments: attachments ? JSON.stringify(attachments) : null,
        is_internal: isInternal ? true : false,
      },
    })
    await prisma.tickets.update({ where: { id: Number(req.params.id) }, data: { updated_at: new Date() } })
    getIO()?.emit('ticket:message', { ticketId: Number(req.params.id), message: msg })
    notifyTicketMessage(Number(req.params.id), req.user.userId, req.user.name, text)
    res.status(201).json(msg)
  } catch (err) {
    res.status(500).json({ message: 'Failed to add message' })
  }
})

router.delete('/:id/messages/:msgId', async (req, res) => {
  try {
    const msg = await prisma.ticket_messages.findUnique({ where: { id: Number(req.params.msgId) } })
    if (!msg) return res.status(404).json({ message: 'Message not found' })
    const isAdmin = req.user.role === 'admin' || req.user.role === 'senior_agent'
    const isOwner = msg.sender_id === req.user.userId
    if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' })
    await prisma.ticket_messages.delete({ where: { id: Number(req.params.msgId) } })
    getIO()?.emit('ticket:message-removed', { ticketId: Number(req.params.id), msgId: Number(req.params.msgId) })
    res.json({ success: true })
  } catch (err) {
    logger.error('Delete message error:', err)
    res.status(500).json({ message: 'Failed to delete message' })
  }
})

export default router
