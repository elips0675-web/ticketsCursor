import prisma from '../prisma.js'
import { getSettings } from '../settings.js'

function parseBooleanSetting(value) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function getSlaHours(priority, settings) {
  const raw = Number(settings.SLA_RESPONSE_HOURS)
  const base = Number.isFinite(raw) && raw > 0 ? raw : 4
  switch (priority) {
    case 'critical':
      return Math.max(1, Math.round(base * 0.5))
    case 'high':
      return base
    case 'low':
      return base * 4
    case 'medium':
    default:
      return base * 2
  }
}

function getResolvedAt(status) {
  return status === 'resolved' || status === 'closed' ? new Date() : null
}

function mapTicketRow(r) {
  return {
    ...r,
    assigned_name: r.assigned_to_employee?.name || null,
    assigned_email: r.assigned_to_employee?.email || null,
    assigned_avatar: r.assigned_to_employee?.avatar || null,
    assigned_to_employee: undefined,
    messages: r.ticket_messages,
    ticket_messages: undefined,
  }
}

export async function getLeastLoadedAssignee() {
  const rows = await prisma.$queryRaw`
    SELECT e.id
    FROM employees e
    LEFT JOIN tickets t
      ON t.assigned_to = e.id
      AND t.status IN ('open', 'in_progress')
    WHERE e.is_active = 1
      AND e.role IN ('agent', 'senior_agent')
    GROUP BY e.id
    ORDER BY COUNT(t.id) ASC, e.id ASC
    LIMIT 1
  `
  const candidate = rows?.[0]
  return candidate ? Number(candidate.id) : null
}

export async function listTickets({ page, limit }) {
  const offset = (page - 1) * limit
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
  const data = rows.map(mapTicketRow)
  return { data, total, page, totalPages: Math.ceil(total / limit) }
}

export async function listOverdueSlaTickets(limit) {
  const rows = await prisma.tickets.findMany({
    where: {
      status: { in: ['open', 'in_progress'] },
      due_at: { lt: new Date() },
    },
    orderBy: { due_at: 'asc' },
    take: limit,
    include: {
      assigned_to_employee: { select: { name: true, email: true, avatar: true } },
    },
  })
  return rows.map(mapTicketRow)
}

export async function getTicketById(id) {
  const ticket = await prisma.tickets.findUnique({
    where: { id },
    include: {
      assigned_to_employee: {
        select: { name: true, email: true, avatar: true },
      },
      ticket_messages: {
        orderBy: { created_at: 'asc' },
      },
    },
  })
  if (!ticket) return null
  return mapTicketRow(ticket)
}

export async function createTicket({ title, description, priority, category, createdBy }) {
  const settings = await getSettings()
  const normalizedPriority = priority || 'medium'
  const dueAt = new Date(Date.now() + getSlaHours(normalizedPriority, settings) * 60 * 60 * 1000)
  const autoAssignEnabled = parseBooleanSetting(settings.AUTO_ASSIGN)
  const autoAssignedTo = autoAssignEnabled ? await getLeastLoadedAssignee() : null
  const ticket = await prisma.tickets.create({
    data: {
      title,
      description,
      status: 'open',
      priority: normalizedPriority,
      category: category || 'support',
      created_by: createdBy,
      assigned_to: autoAssignedTo,
      due_at: dueAt,
    },
  })
  return { ticket, dueAt, autoAssignedTo }
}

export async function updateTicketStatus(id, status) {
  const old = await prisma.tickets.findUnique({
    where: { id },
    select: { status: true, first_response_at: true },
  })
  if (!old) return null
  const updateData = {
    status,
    updated_at: new Date(),
    resolved_at: getResolvedAt(status),
  }
  if (status === 'in_progress' && !old.first_response_at) {
    updateData.first_response_at = new Date()
  }
  await prisma.tickets.update({ where: { id }, data: updateData })
  return old
}
