import prisma from '../prisma.js'

function mapEvent(e) {
  const { creator_id, created_at, ...rest } = e
  return { ...rest, creatorId: creator_id, createdAt: created_at }
}

export async function listEvents(year, month) {
  const where = {}
  if (year && month) {
    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)
    where.date = { gte: startDate, lte: endDate }
  }
  const events = await prisma.events.findMany({
    where,
    select: { id: true, title: true, date: true, time: true, description: true, creator_id: true, created_at: true },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })
  return events.map(mapEvent)
}

export async function createEvent({ title, date, time, description, userId }) {
  const event = await prisma.events.create({
    data: { title, date: new Date(date), time: time || null, description: description || '', creator_id: userId },
    select: { id: true, title: true, date: true, time: true, description: true, creator_id: true, created_at: true },
  })
  return mapEvent(event)
}

export async function updateEvent(id, { title, date, time, description }) {
  await prisma.events.update({
    where: { id },
    data: { title, date: new Date(date), time: time || null, description: description || '' },
  })
  const event = await prisma.events.findUnique({
    where: { id },
    select: { id: true, title: true, date: true, time: true, description: true, creator_id: true, created_at: true },
  })
  return mapEvent(event)
}

export async function deleteEvent(id) {
  await prisma.events.delete({ where: { id } })
}
