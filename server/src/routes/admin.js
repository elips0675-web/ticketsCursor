import { Router } from 'express'
import { exec } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import prisma from '../prisma.js'
import { auditLogMiddleware } from '../audit.js'
import { authenticateToken, requireRole } from '../middleware.js'
import { invalidateCache as invalidateSettingsCache } from '../settings.js'
import logger from '../logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..', '..')

const router = Router()
router.use(authenticateToken, requireRole('admin'))
router.use(auditLogMiddleware)

const ALLOWED_SETTINGS = [
  'TELEGRAM_BOT_TOKEN', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_SECURE',
  'COMPANY_NAME', 'COMPANY_LOGO', 'TIMEZONE', 'DEFAULT_LANGUAGE',
  'AUTO_ASSIGN', 'SLA_RESPONSE_HOURS',
  'LDAP_URL', 'LDAP_BASE_DN', 'LDAP_BIND_DN', 'LDAP_BIND_CREDENTIALS',
  'EMAIL_TEMPLATES',
]

router.get('/settings', async (req, res) => {
  try {
    const rows = await prisma.admin_settings.findMany({ select: { key: true, value: true } })
    const settings = {}
    for (const r of rows) settings[r.key] = r.value
    res.json({ success: true, data: settings })
  } catch (err) {
    logger.error('Settings get error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch settings' })
  }
})

router.put('/settings', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      if (!ALLOWED_SETTINGS.includes(key)) continue
      await prisma.admin_settings.upsert({
        where: { key },
        update: { value: String(value), updated_at: new Date() },
        create: { key, value: String(value), updated_at: new Date() },
      })
    }
    invalidateSettingsCache()
    res.json({ success: true, data: { updated: true } })
  } catch (err) {
    logger.error('Settings update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update settings' })
  }
})

router.get('/users', async (req, res) => {
  try {
    const rows = await prisma.employees.findMany({
      orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
    })
    const data = rows.map(r => ({
      id: r.id, name: r.name, email: r.email,
      role: r.role, department: r.department, title: r.title,
      avatar: r.avatar, phone: r.phone,
      online: r.online,
      activeTickets: r.active_tickets || 0,
      resolvedToday: r.resolved_today || 0,
      isActive: r.is_active,
      createdAt: r.created_at,
    }))
    res.json({ success: true, data })
  } catch (err) {
    logger.error('Admin users list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch users' })
  }
})

router.put('/users/:id', async (req, res) => {
  const targetId = Number(req.params.id)
  if (targetId === req.user.userId) {
    return res.status(400).json({ success: false, message: 'Cannot modify your own account' })
  }
  const { role, isActive, department, title } = req.body
  const data = {}
  if (role) {
    if (role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot assign super_admin via API' })
    }
    if (!['admin', 'senior_agent', 'agent', 'requester'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }
    data.role = role
  }
  if (isActive !== undefined) {
    data.is_active = Boolean(isActive)
  }
  if (department !== undefined) {
    data.department = department
  }
  if (title !== undefined) {
    data.title = title
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ success: false, message: 'No fields to update' })
  try {
    await prisma.employees.update({ where: { id: targetId }, data })
    res.json({ success: true, data: { updated: true } })
  } catch (err) {
    logger.error('Admin user update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update user' })
  }
})

router.get('/audit', async (req, res) => {
  const { entityType, entityId, limit = 50, offset = 0, from, to, format } = req.query
  try {
    const where = {}
    if (entityType) where.entity_type = entityType
    if (entityId) where.entity_id = Number(entityId)
    if (from || to) {
      where.created_at = {}
      if (from) where.created_at.gte = new Date(from)
      if (to) where.created_at.lte = new Date(to)
    }
    const rows = await prisma.audit_log.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: Number(offset),
      take: format === 'csv' ? undefined : Number(limit),
    })
    if (format === 'csv') {
      const header = 'Date,User,Action,Entity,EntityId,IP\n'
      const csv = rows.map(r =>
        `"${r.created_at}","${r.user_name || ''}","${r.action}","${r.entity_type || ''}","${r.entity_id || ''}","${r.ip_address || ''}"`
      ).join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=audit.csv')
      return res.send('\uFEFF' + header + csv)
    }
    res.json({ success: true, data: rows })
  } catch (err) {
    logger.error('Audit log error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch audit log' })
  }
})

router.post('/settings/backup', async (req, res) => {
  try {
    const script = path.join(projectRoot, 'scripts', 'backup-mysql.ps1')
    exec(`"${process.env.ComSpec || 'cmd.exe'}" /c powershell -File "${script}"`, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) {
        logger.error('Backup error:', err.message)
        return res.status(500).json({ success: false, message: stderr || err.message })
      }
      res.json({ success: true, data: { output: stdout.trim() } })
    })
  } catch (err) {
    logger.error('Backup route error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/settings/seed', async (req, res) => {
  try {
    const serverDir = path.join(projectRoot, 'server')
    exec('npm.cmd run seed', { cwd: serverDir, timeout: 120000, shell: process.env.ComSpec || 'cmd.exe' }, (err, stdout, stderr) => {
      if (err) {
        logger.error('Seed error:', err.message)
        return res.status(500).json({ success: false, message: stderr || err.message })
      }
      res.json({ success: true, data: { output: stdout.trim() } })
    })
  } catch (err) {
    logger.error('Seed route error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/settings/redis-status', async (req, res) => {
  try {
    const row = await prisma.admin_settings.findUnique({ where: { key: 'REDIS_URL' } })
    const redisUrl = row?.value || ''
    let connected = false
    if (redisUrl) {
      try {
        const { createClient } = await import('redis')
        const client = createClient({ url: redisUrl })
        await client.connect()
        await client.ping()
        await client.quit()
        connected = true
      } catch { }
    }
    res.json({ success: true, data: { url: redisUrl, connected } })
  } catch (err) {
    logger.error('Redis status error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

router.put('/settings/redis', async (req, res) => {
  try {
    const { url } = req.body
    await prisma.admin_settings.upsert({
      where: { key: 'REDIS_URL' },
      update: { value: url || '', updated_at: new Date() },
      create: { key: 'REDIS_URL', value: url || '', updated_at: new Date() },
    })
    res.json({ success: true, data: { updated: true } })
  } catch (err) {
    logger.error('Redis settings error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
