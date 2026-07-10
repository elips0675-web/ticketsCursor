import 'dotenv/config'
import knexLib from 'knex'
import knexConfig from '../knexfile.js'
import { app, server } from './app.js'
import { setupSocket } from './socket.js'
import { initTelegram } from './telegram.js'
import logger from './logger.js'
import { notifySlaBreached } from './notify.js'

if (!process.env.JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET environment variable is required')
  logger.error('Generate one: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
  process.exit(1)
}

const PORT = process.env.PORT || 4000

setupSocket(server)
initTelegram()

// Auto-run migrations on startup
;(async () => {
  try {
    const migrator = knexLib(knexConfig)
    await migrator.migrate.latest()
    console.log('Migrations up to date')
    await migrator.destroy()
  } catch (e) {
    logger.error('Migration error:', e.message)
  }
})()

// Удаление уведомлений старше 90 дней (каждые 6 часов)
import prisma from './prisma.js'

async function cleanupOldNotifications() {
  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const r = await prisma.notifications.deleteMany({
      where: { created_at: { lt: cutoff } },
    })
    if (r.count > 0) console.log(`Cleaned ${r.count} old notifications`)
  } catch (e) {
    logger.error('Notification cleanup error:', e.message)
  }
}
cleanupOldNotifications()
setInterval(cleanupOldNotifications, 6 * 60 * 60 * 1000)

async function checkOverdueSlaTickets() {
  try {
    const overdue = await prisma.tickets.findMany({
      where: {
        status: { in: ['open', 'in_progress'] },
        due_at: { lt: new Date() },
      },
      select: { id: true },
      take: 200,
    })
    for (const t of overdue) {
      // notify function has deduplication for 24h window
      await notifySlaBreached(t.id)
    }
  } catch (e) {
    logger.error('SLA overdue check error:', e.message)
  }
}

checkOverdueSlaTickets()
setInterval(checkOverdueSlaTickets, 15 * 60 * 1000)

server.listen(PORT, () => {
  console.log(`Service Desk API running on port ${PORT}`)
})

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`)
  server.close(() => {
    console.log('HTTP server closed')
  })
  const { getIO } = await import('./socket.js')
  const io = getIO()
  if (io) {
    io.close(() => console.log('Socket.IO closed'))
  }
  await prisma.$disconnect().catch(() => {})
  logger.info(`Server shut down (${signal})`)
  process.exit(0)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
