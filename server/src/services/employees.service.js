import prisma from '../prisma.js'

export async function listEmployees() {
  const rows = await prisma.employees.findMany({
    where: { is_active: true },
    select: { id: true, name: true, email: true, role: true, department: true, avatar: true, online: true, active_tickets: true, resolved_today: true, phone: true },
    orderBy: { name: 'asc' },
  })
  return rows.map(({ active_tickets, resolved_today, ...rest }) => ({
    ...rest, activeTickets: active_tickets, resolvedToday: resolved_today,
  }))
}

export async function getStats() {
  const [total, open, inProgress, resolved, critical] = await Promise.all([
    prisma.tickets.count(),
    prisma.tickets.count({ where: { status: 'open' } }),
    prisma.tickets.count({ where: { status: 'in_progress' } }),
    prisma.tickets.count({ where: { status: 'resolved' } }),
    prisma.tickets.count({ where: { priority: 'critical' } }),
  ])
  return { total, open, inProgress, resolved, critical }
}
