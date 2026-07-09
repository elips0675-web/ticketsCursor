import prisma from './prisma.js'
import logger from './logger.js'

export async function logAudit({ userId, userName, action, entityType, entityId, details }) {
  try {
    await prisma.audit_log.create({
      data: {
        user_id: userId,
        user_name: userName || 'Unknown',
        action,
        entity_type: entityType,
        entity_id: Number(entityId) || null,
        details: details ? JSON.stringify(details) : null,
      },
    })
  } catch (err) {
    logger.error('Audit log error:', err)
  }
}

const ACTION_MAP = { POST: 'created', PUT: 'updated', DELETE: 'deleted' }

export function auditLogMiddleware(req, res, next) {
  const originalJson = res.json.bind(res)
  res.json = function (body) {
    if (res.statusCode < 400) {
      const action = ACTION_MAP[req.method]
      if (action) {
        logAudit({
          userId: req.user?.userId,
          userName: req.user?.name || 'System',
          action,
          entityType: req.baseUrl?.replace('/api/', '') || req.path?.split('/')[1] || 'unknown',
          entityId: req.params?.id || body?.id || null,
          details: { body: req.body, path: req.originalUrl },
        })
      }
    }
    return originalJson(body)
  }
  next()
}
