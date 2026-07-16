import { cache } from '../cache.js'

const TTL = 86400

export function idempotent(req, res, next) {
  const key = req.headers['idempotency-key']
  if (!key) return next()

  const cacheKey = `idempotency:${req.user?.userId || 'anon'}:${key}`

  cache.get(cacheKey).then(cached => {
    if (cached) return res.json(cached)

    const originalJson = res.json.bind(res)
    res.json = (body) => {
      cache.set(cacheKey, body, TTL).catch(() => {})
      originalJson(body)
    }
    next()
  }).catch(() => next())
}
