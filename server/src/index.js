import 'dotenv/config'
import knexLib from 'knex'
import knexConfig from '../knexfile.js'
import { app, server } from './app.js'
import { setupSocket } from './socket.js'
import { initTelegram } from './telegram.js'
import logger from './logger.js'

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
import knex from './db.js'

async function cleanupOldNotifications() {
  try {
    const [r] = await knex.raw("DELETE FROM notifications WHERE created_at < NOW() - INTERVAL 90 DAY")
    if (r.affectedRows > 0) console.log(`Cleaned ${r.affectedRows} old notifications`)
  } catch (e) {
    logger.error('Notification cleanup error:', e.message)
  }
}
cleanupOldNotifications()
setInterval(cleanupOldNotifications, 6 * 60 * 60 * 1000)

server.listen(PORT, () => {
  console.log(`Service Desk API running on port ${PORT}`)
})
